const express = require('express');
const mongoose = require('mongoose');
const Quiz = require('../models/Quiz');
const Attempt = require('../models/Attempt');
const User = require('../models/User');
const { authenticate, requireAdmin } = require('../middleware/auth');
const { validate, schemas } = require('../middleware/validate');
const logger = require('../utils/logger');

const router = express.Router();
router.use(authenticate, requireAdmin);

// GET /api/admin/users — all users with total scores, sorted by score desc
router.get('/users', async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, parseInt(req.query.limit) || 50);
    const skip = (page - 1) * limit;
    const search = req.query.search?.trim();

    const userQuery = { role: 'user' };
    if (search) {
      userQuery.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
      ];
    }

    const [users, totalCount] = await Promise.all([
      User.find(userQuery).select('name email phone gender isVerified createdAt').lean(),
      User.countDocuments(userQuery),
    ]);

    if (users.length === 0) {
      return res.status(200).json({ success: true, data: [], totalCount: 0, page, totalPages: 0 });
    }

    const userIds = users.map((u) => u._id);

    // Aggregate attempts per user
    const attemptStats = await Attempt.aggregate([
      { $match: { user: { $in: userIds }, isSubmitted: true } },
      {
        $group: {
          _id: '$user',
          totalScore: { $sum: '$score' },
          totalMarks: { $sum: '$totalMarks' },
          quizzesAttempted: { $sum: 1 },
          lastAttemptAt: { $max: '$submittedAt' },
        },
      },
    ]);

    const statsMap = {};
    attemptStats.forEach((s) => { statsMap[s._id.toString()] = s; });

    const enriched = users.map((u) => {
      const stats = statsMap[u._id.toString()] || { totalScore: 0, totalMarks: 0, quizzesAttempted: 0 };
      return {
        ...u,
        totalScore: stats.totalScore,
        totalMarks: stats.totalMarks,
        quizzesAttempted: stats.quizzesAttempted,
        percentage: stats.totalMarks > 0 ? Math.round((stats.totalScore / stats.totalMarks) * 100) : 0,
        lastAttemptAt: stats.lastAttemptAt || null,
      };
    });

    // Sort by total score descending
    enriched.sort((a, b) => b.totalScore - a.totalScore || a.name.localeCompare(b.name));

    const paginated = enriched.slice(skip, skip + limit);

    res.status(200).json({
      success: true,
      data: paginated,
      totalCount: enriched.length,
      page,
      totalPages: Math.ceil(enriched.length / limit),
    });
  } catch (error) {
    logger.error('Admin get users error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch users' });
  }
});

// GET /api/admin/users/:id/attempts — detailed attempts for a user
router.get('/users/:id/attempts', async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid user ID' });
    }
    const attempts = await Attempt.find({ user: req.params.id, isSubmitted: true })
      .populate('quiz', 'title durationSeconds')
      .sort({ submittedAt: -1 })
      .lean();

    res.status(200).json({ success: true, data: attempts });
  } catch (error) {
    logger.error('Admin get user attempts error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch attempts' });
  }
});

// GET /api/admin/quizzes
router.get('/quizzes', async (req, res) => {
  try {
    const quizzes = await Quiz.find().sort({ order: 1, createdAt: 1 }).lean();

    // Add attempt count for each quiz
    const quizIds = quizzes.map((q) => q._id);
    const counts = await Attempt.aggregate([
      { $match: { quiz: { $in: quizIds }, isSubmitted: true } },
      { $group: { _id: '$quiz', count: { $sum: 1 }, avgScore: { $avg: '$score' } } },
    ]);
    const countMap = {};
    counts.forEach((c) => { countMap[c._id.toString()] = c; });

    const result = quizzes.map((q) => ({
      ...q,
      attemptCount: countMap[q._id.toString()]?.count || 0,
      avgScore: Math.round(countMap[q._id.toString()]?.avgScore || 0),
    }));

    res.status(200).json({ success: true, data: result });
  } catch (error) {
    logger.error('Admin get quizzes error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch quizzes' });
  }
});

// POST /api/admin/quizzes
router.post('/quizzes', validate(schemas.createQuiz), async (req, res) => {
  try {
    const quiz = await Quiz.create({ ...req.body, createdBy: req.user._id });
    res.status(201).json({ success: true, message: 'Quiz created successfully', data: quiz });
  } catch (error) {
    logger.error('Admin create quiz error:', error);
    res.status(500).json({ success: false, message: 'Failed to create quiz' });
  }
});

// PUT /api/admin/quizzes/:id
router.put('/quizzes/:id', async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid quiz ID' });
    }

    const { _id, createdBy, createdAt, updatedAt, __v, ...updateData } = req.body;
    const quiz = await Quiz.findByIdAndUpdate(
      req.params.id,
      { $set: updateData },
      { new: true, runValidators: true }
    );
    if (!quiz) return res.status(404).json({ success: false, message: 'Quiz not found' });

    res.status(200).json({ success: true, message: 'Quiz updated', data: quiz });
  } catch (error) {
    logger.error('Admin update quiz error:', error);
    res.status(500).json({ success: false, message: 'Failed to update quiz' });
  }
});

// PATCH /api/admin/quizzes/:id/toggle-lock
router.patch('/quizzes/:id/toggle-lock', async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid quiz ID' });
    }
    const quiz = await Quiz.findById(req.params.id);
    if (!quiz) return res.status(404).json({ success: false, message: 'Quiz not found' });

    quiz.isLocked = !quiz.isLocked;
    await quiz.save();

    res.status(200).json({
      success: true,
      message: `Quiz ${quiz.isLocked ? 'locked' : 'unlocked'}`,
      isLocked: quiz.isLocked,
    });
  } catch (error) {
    logger.error('Toggle lock error:', error);
    res.status(500).json({ success: false, message: 'Failed to toggle lock' });
  }
});

// DELETE /api/admin/quizzes/:id
router.delete('/quizzes/:id', async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid quiz ID' });
    }
    const quiz = await Quiz.findByIdAndDelete(req.params.id);
    if (!quiz) return res.status(404).json({ success: false, message: 'Quiz not found' });

    // Cascade delete attempts
    await Attempt.deleteMany({ quiz: req.params.id });

    res.status(200).json({ success: true, message: 'Quiz deleted' });
  } catch (error) {
    logger.error('Admin delete quiz error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete quiz' });
  }
});

// GET /api/admin/stats — dashboard overview
router.get('/stats', async (req, res) => {
  try {
    const [totalUsers, verifiedUsers, totalQuizzes, activeQuizzes, totalAttempts] = await Promise.all([
      User.countDocuments({ role: 'user' }),
      User.countDocuments({ role: 'user', isVerified: true }),
      Quiz.countDocuments(),
      Quiz.countDocuments({ isLocked: false }),
      Attempt.countDocuments({ isSubmitted: true }),
    ]);

    res.status(200).json({
      success: true,
      data: { totalUsers, verifiedUsers, totalQuizzes, activeQuizzes, totalAttempts },
    });
  } catch (error) {
    logger.error('Admin stats error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch stats' });
  }
});

module.exports = router;
