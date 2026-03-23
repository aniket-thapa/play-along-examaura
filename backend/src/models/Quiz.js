const mongoose = require('mongoose');

const optionSchema = new mongoose.Schema({
  text: { type: String, required: true, trim: true },
}, { _id: true });

const questionSchema = new mongoose.Schema({
  text: {
    type: String,
    required: [true, 'Question text is required'],
    trim: true,
  },
  options: {
    type: [optionSchema],
    validate: {
      validator: (opts) => opts.length >= 2 && opts.length <= 6,
      message: 'Each question must have 2–6 options',
    },
  },
  correctOptionIndex: {
    type: Number,
    required: [true, 'Correct option index is required'],
    min: 0,
  },
  marks: {
    type: Number,
    default: 1,
    min: 0,
  },
}, { _id: true });

const quizSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Quiz title is required'],
      trim: true,
      maxlength: [120, 'Title too long'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, 'Description too long'],
    },
    instructions: {
      type: String,
      trim: true,
    },
    questions: {
      type: [questionSchema],
      validate: {
        validator: (qs) => qs.length >= 1,
        message: 'Quiz must have at least 1 question',
      },
    },
    durationSeconds: {
      type: Number,
      required: [true, 'Duration is required'],
      min: [30, 'Duration must be at least 30 seconds'],
    },
    isLocked: {
      type: Boolean,
      default: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    coverColor: {
      type: String,
      default: '#00d4ff',
    },
    order: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

quizSchema.virtual('totalMarks').get(function () {
  return this.questions.reduce((sum, q) => sum + (q.marks || 1), 0);
});

quizSchema.virtual('questionCount').get(function () {
  return this.questions.length;
});

quizSchema.index({ isLocked: 1, order: 1 });

// Strip correct answers from questions for user-facing responses
quizSchema.methods.toUserJSON = function () {
  const obj = this.toObject({ virtuals: true });
  obj.questions = obj.questions.map((q) => {
    const { correctOptionIndex, ...rest } = q;
    return rest;
  });
  return obj;
};

const Quiz = mongoose.model('Quiz', quizSchema);
module.exports = Quiz;
