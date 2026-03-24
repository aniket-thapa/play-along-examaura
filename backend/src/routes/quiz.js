const express = require('express');
const Quiz = require('../models/Quiz');
const Attempt = require('../models/Attempt');
const { authenticate, requireVerified } = require('../middleware/auth');
const { validate, schemas } = require('../middleware/validate');
const logger = require('../utils/logger');

const router = express.Router();

// All quiz routes require authentication and verified email
router.use(authenticate, requireVerified);

// GET /api/quiz — list all quizzes (without correct answers)
router.get('/', async (req, res) => {
  try {
    const quizzes = await Quiz.find()
      .select('-questions.correctOptionIndex')
      .sort({ order: 1, createdAt: 1 })
      .lean();

    // Get user's attempts for these quizzes
    const quizIds = quizzes.map((q) => q._id);
    const attempts = await Attempt.find({
      user: req.user._id,
      quiz: { $in: quizIds },
      isSubmitted: true,
    })
      .select('quiz score totalMarks isSubmitted autoSubmitted')
      .lean();

    const attemptMap = {};
    attempts.forEach((a) => {
      attemptMap[a.quiz.toString()] = a;
    });

    const result = quizzes.map((quiz) => ({
      _id: quiz._id,
      title: quiz.title,
      description: quiz.description,
      durationSeconds: quiz.durationSeconds,
      isLocked: quiz.isLocked,
      coverColor: quiz.coverColor,
      order: quiz.order,
      questionCount: quiz.questions.length,
      isResultPublished: quiz.isResultPublished,
      totalMarks: quiz.questions.reduce((s, q) => s + (q.marks || 1), 0),
      attempt: attemptMap[quiz._id.toString()]
        ? {
            ...attemptMap[quiz._id.toString()],
            score: quiz.isResultPublished
              ? attemptMap[quiz._id.toString()].score
              : null,
          }
        : null,
      createdAt: quiz.createdAt,
    }));

    res.status(200).json({ success: true, data: result });
  } catch (error) {
    logger.error('Get quizzes error:', error);
    res
      .status(500)
      .json({ success: false, message: 'Failed to fetch quizzes' });
  }
});

// GET /api/quiz/:id — get quiz details (user-facing, no correct answers)
router.get('/:id', async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id);
    if (!quiz) {
      return res
        .status(404)
        .json({ success: false, message: 'Quiz not found' });
    }
    if (quiz.isLocked) {
      return res
        .status(403)
        .json({ success: false, message: 'This quiz is currently locked' });
    }

    // Check existing attempt
    const existingAttempt = await Attempt.findOne({
      user: req.user._id,
      quiz: quiz._id,
      isSubmitted: true,
    });
    if (existingAttempt) {
      return res.status(200).json({
        success: true,
        data: quiz.toUserJSON(),
        attempt: {
          score: quiz.isResultPublished ? existingAttempt.score : null,
          totalMarks: existingAttempt.totalMarks,
          submittedAt: existingAttempt.submittedAt,
          autoSubmitted: existingAttempt.autoSubmitted,
        },
        alreadyAttempted: true,
      });
    }

    res.status(200).json({
      success: true,
      data: quiz.toUserJSON(),
      alreadyAttempted: false,
    });
  } catch (error) {
    logger.error('Get quiz error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch quiz' });
  }
});

// POST /api/quiz/:id/start — start an attempt (idempotent)
router.post('/:id/start', async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id);
    if (!quiz)
      return res
        .status(404)
        .json({ success: false, message: 'Quiz not found' });
    if (quiz.isLocked)
      return res
        .status(403)
        .json({ success: false, message: 'Quiz is locked' });

    // Check if already submitted
    const submitted = await Attempt.findOne({
      user: req.user._id,
      quiz: quiz._id,
      isSubmitted: true,
    });
    if (submitted) {
      return res.status(409).json({
        success: false,
        message: 'You have already submitted this quiz',
      });
    }

    // Get or create in-progress attempt
    let attempt = await Attempt.findOne({
      user: req.user._id,
      quiz: quiz._id,
      isSubmitted: false,
    });
    if (!attempt) {
      attempt = await Attempt.create({
        user: req.user._id,
        quiz: quiz._id,
        totalMarks: quiz.questions.reduce((s, q) => s + (q.marks || 1), 0),
        answers: quiz.questions.map((q) => ({
          questionId: q._id,
          selectedOptionIndex: null,
        })),
      });
    }

    res.status(200).json({
      success: true,
      data: quiz.toUserJSON(),
      attemptId: attempt._id,
      startedAt: attempt.startedAt,
    });
  } catch (error) {
    logger.error('Start quiz error:', error);
    res.status(500).json({ success: false, message: 'Failed to start quiz' });
  }
});

// POST /api/quiz/:id/submit — submit an attempt
router.post('/:id/submit', validate(schemas.submitQuiz), async (req, res) => {
  try {
    const {
      answers,
      autoSubmitted,
      autoSubmitReason,
      tabSwitchCount,
      timeTakenSeconds,
    } = req.body;
    const quiz = await Quiz.findById(req.params.id);
    if (!quiz)
      return res
        .status(404)
        .json({ success: false, message: 'Quiz not found' });

    // Allow submission even if quiz was relocked (edge case)
    const attempt = await Attempt.findOne({
      user: req.user._id,
      quiz: quiz._id,
      isSubmitted: false,
    });
    if (!attempt) {
      const submitted = await Attempt.findOne({
        user: req.user._id,
        quiz: quiz._id,
        isSubmitted: true,
      });
      if (submitted) {
        return res
          .status(409)
          .json({ success: false, message: 'Quiz already submitted' });
      }
      return res
        .status(404)
        .json({ success: false, message: 'No active attempt found' });
    }

    // Validate timing (allow 30s grace period)
    const elapsed = (Date.now() - attempt.startedAt.getTime()) / 1000;
    const gracePeriod = 30;
    if (elapsed > quiz.durationSeconds + gracePeriod && !autoSubmitted) {
      // Force auto-submit
    }

    // Update answers
    attempt.answers = answers.map((a) => ({
      questionId: a.questionId,
      selectedOptionIndex: a.selectedOptionIndex,
    }));
    attempt.autoSubmitted = autoSubmitted || false;
    attempt.autoSubmitReason =
      autoSubmitReason || (autoSubmitted ? 'time_expired' : 'manual');
    attempt.tabSwitchCount = tabSwitchCount || 0;
    attempt.timeTakenSeconds = timeTakenSeconds || Math.floor(elapsed);
    attempt.submittedAt = new Date();
    attempt.isSubmitted = true;

    // Calculate score
    attempt.calculateScore(quiz);
    await attempt.save();

    res.status(200).json({
      success: true,
      message: 'Quiz submitted successfully!',
      data: {
        score: quiz.isResultPublished ? attempt.score : null,
        totalMarks: attempt.totalMarks,
        percentage: quiz.isResultPublished
          ? Math.round((attempt.score / attempt.totalMarks) * 100)
          : null,
        timeTakenSeconds: attempt.timeTakenSeconds,
        autoSubmitted: attempt.autoSubmitted,
        isResultPublished: quiz.isResultPublished,
      },
    });
  } catch (error) {
    logger.error('Submit quiz error:', error);
    res.status(500).json({ success: false, message: 'Failed to submit quiz' });
  }
});

// GET /api/quiz/:id/result — get result for a submitted attempt
router.get('/:id/result', async (req, res) => {
  try {
    const attempt = await Attempt.findOne({
      user: req.user._id,
      quiz: req.params.id,
      isSubmitted: true,
    }).populate('quiz', 'title totalMarks isResultPublished');

    if (!attempt) {
      return res
        .status(404)
        .json({ success: false, message: 'No submitted attempt found' });
    }

    res.status(200).json({
      success: true,
      data: {
        score: attempt.quiz.isResultPublished ? attempt.score : null,
        totalMarks: attempt.totalMarks,
        percentage: attempt.quiz.isResultPublished
          ? Math.round((attempt.score / attempt.totalMarks) * 100)
          : null,
        timeTakenSeconds: attempt.timeTakenSeconds,
        autoSubmitted: attempt.autoSubmitted,
        autoSubmitReason: attempt.autoSubmitReason,
        submittedAt: attempt.submittedAt,
        answers: attempt.quiz.isResultPublished ? attempt.answers : [],
        isResultPublished: attempt.quiz.isResultPublished,
      },
    });
  } catch (error) {
    logger.error('Get result error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch result' });
  }
});

module.exports = router;
