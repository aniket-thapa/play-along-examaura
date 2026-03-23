const mongoose = require('mongoose');

const answerSchema = new mongoose.Schema({
  questionId: { type: mongoose.Schema.Types.ObjectId, required: true },
  selectedOptionIndex: { type: Number, default: null }, // null = unanswered
}, { _id: false });

const attemptSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    quiz: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Quiz',
      required: true,
    },
    answers: [answerSchema],
    score: {
      type: Number,
      default: 0,
    },
    totalMarks: {
      type: Number,
      required: true,
    },
    startedAt: {
      type: Date,
      default: Date.now,
    },
    submittedAt: {
      type: Date,
    },
    isSubmitted: {
      type: Boolean,
      default: false,
    },
    autoSubmitted: {
      type: Boolean,
      default: false,
    },
    autoSubmitReason: {
      type: String,
      enum: ['time_expired', 'tab_switch', 'manual', null],
      default: null,
    },
    tabSwitchCount: {
      type: Number,
      default: 0,
    },
    timeTakenSeconds: {
      type: Number,
    },
  },
  {
    timestamps: true,
  }
);

// Each user can have only one submitted attempt per quiz
attemptSchema.index({ user: 1, quiz: 1 }, { unique: true });
attemptSchema.index({ user: 1, isSubmitted: 1 });
attemptSchema.index({ quiz: 1, score: -1 });

// Calculate score from quiz answers
attemptSchema.methods.calculateScore = function (quiz) {
  let score = 0;
  for (const answer of this.answers) {
    const question = quiz.questions.find(
      (q) => q._id.toString() === answer.questionId.toString()
    );
    if (
      question &&
      answer.selectedOptionIndex !== null &&
      answer.selectedOptionIndex === question.correctOptionIndex
    ) {
      score += question.marks || 1;
    }
  }
  this.score = score;
  return score;
};

const Attempt = mongoose.model('Attempt', attemptSchema);
module.exports = Attempt;
