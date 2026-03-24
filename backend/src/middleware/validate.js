const Joi = require('joi');

const validate = (schema) => (req, res, next) => {
  const { error, value } = schema.validate(req.body, {
    abortEarly: false,
    stripUnknown: true,
  });
  if (error) {
    const errors = error.details.map((d) => d.message.replace(/"/g, "'"));
    return res.status(400).json({ success: false, message: errors[0], errors });
  }
  req.body = value;
  next();
};

const schemas = {
  register: Joi.object({
    name: Joi.string().trim().min(2).max(60).required(),
    phone: Joi.string()
      .trim()
      .pattern(/^\+?[\d\s\-()]{7,15}$/)
      .required()
      .messages({
        'string.pattern.base': 'Invalid phone number',
      }),
    email: Joi.string().trim().email().lowercase().required(),
    gender: Joi.string()
      .valid('male', 'female', 'other', 'prefer_not_to_say')
      .required(),
    password: Joi.string()
      .min(8)
      .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
      .required()
      .messages({
        'string.pattern.base':
          'Password must contain uppercase, lowercase, and a number',
      }),
  }),

  login: Joi.object({
    email: Joi.string().trim().email().lowercase().required(),
    password: Joi.string().required(),
  }),

  verifyOtp: Joi.object({
    email: Joi.string().trim().email().lowercase().required(),
    otp: Joi.string().length(6).pattern(/^\d+$/).required().messages({
      'string.length': 'OTP must be 6 digits',
      'string.pattern.base': 'OTP must be numeric',
    }),
  }),

  resendOtp: Joi.object({
    email: Joi.string().trim().email().lowercase().required(),
  }),

  createQuiz: Joi.object({
    title: Joi.string().trim().max(120).required(),
    description: Joi.string().trim().max(500).allow('', null),
    instructions: Joi.string().trim().allow('', null),
    durationSeconds: Joi.number().integer().min(30).required(),
    isLocked: Joi.boolean().default(true),
    isResultPublished: Joi.boolean().default(false),
    coverColor: Joi.string().trim().default('#00d4ff'),
    order: Joi.number().integer().default(0),
    questions: Joi.array()
      .min(1)
      .items(
        Joi.object({
          text: Joi.string().trim().required(),
          options: Joi.array()
            .min(2)
            .max(6)
            .items(Joi.object({ text: Joi.string().trim().required() }))
            .required(),
          correctOptionIndex: Joi.number().integer().min(0).required(),
          marks: Joi.number().min(0).default(1),
        }),
      )
      .required(),
  }),

  submitQuiz: Joi.object({
    answers: Joi.array()
      .items(
        Joi.object({
          questionId: Joi.string().required(),
          selectedOptionIndex: Joi.number()
            .integer()
            .min(0)
            .allow(null)
            .default(null),
        }),
      )
      .required(),
    autoSubmitted: Joi.boolean().default(false),
    autoSubmitReason: Joi.string()
      .valid('time_expired', 'tab_switch', 'manual')
      .allow(null),
    tabSwitchCount: Joi.number().integer().min(0).default(0),
    timeTakenSeconds: Joi.number().min(0).allow(null),
  }),
};

module.exports = { validate, schemas };
