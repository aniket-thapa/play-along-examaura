import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { adminAPI } from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import {
  Badge,
  Logo,
  Spinner,
  EmptyState,
  Modal,
  ScoreRing,
} from '../../components/ui';

const TABS = ['Leaderboard', 'Quizzes', 'Create Quiz'];

// ─── Stats Cards ──────────────────────────────────────────────────────────
const StatsRow = ({ stats }) => (
  <div className="grid grid-cols-2 gap-3 mb-6">
    {[
      {
        label: 'Total Users',
        value: stats.totalUsers,
        icon: '👥',
        color: 'brand',
      },
      {
        label: 'Verified',
        value: stats.verifiedUsers,
        icon: '✅',
        color: 'success',
      },
      {
        label: 'Active Quizzes',
        value: stats.activeQuizzes,
        icon: '🔓',
        color: 'brand',
      },
      {
        label: 'Attempts',
        value: stats.totalAttempts,
        icon: '📝',
        color: 'warning',
      },
    ].map((s, i) => (
      <motion.div
        key={s.label}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: i * 0.05 }}
        className="glass rounded-xl p-4 flex items-center gap-3"
      >
        <div className="text-2xl">{s.icon}</div>
        <div>
          <div className="font-display font-bold text-xl text-[#e8eaf6]">
            {s.value ?? '—'}
          </div>
          <div className="text-[#8890b8] text-xs">{s.label}</div>
        </div>
      </motion.div>
    ))}
  </div>
);

// ─── Leaderboard ──────────────────────────────────────────────────────────
const Leaderboard = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);
  const [attempts, setAttempts] = useState([]);
  const [attemptsLoading, setAttemptsLoading] = useState(false);

  const fetchUsers = useCallback(async (q = '') => {
    setLoading(true);
    try {
      const { data } = await adminAPI.getUsers({ search: q, limit: 100 });
      setUsers(data.data || []);
    } catch {
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  useEffect(() => {
    const t = setTimeout(() => fetchUsers(search), 400);
    return () => clearTimeout(t);
  }, [search, fetchUsers]);

  const openUser = async (user) => {
    setSelected(user);
    setAttemptsLoading(true);
    try {
      const { data } = await adminAPI.getUserAttempts(user._id);
      setAttempts(data.data || []);
    } catch {
      toast.error('Failed to load attempts');
    } finally {
      setAttemptsLoading(false);
    }
  };

  const medalFor = (i) =>
    i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`;

  return (
    <>
      <div className="mb-4">
        <div className="relative">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, email, phone..."
            className="w-full input-base text-sm"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8890b8] hover:text-white"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-10">
          <Spinner size="lg" />
        </div>
      ) : users.length === 0 ? (
        <EmptyState
          icon="👥"
          title="No participants yet"
          description="Users will appear here once they register."
        />
      ) : (
        <div className="space-y-2">
          {users.map((user, i) => (
            <motion.div
              key={user._id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              onClick={() => openUser(user)}
              className="glass rounded-xl p-4 cursor-pointer hover:border-brand-300/30 transition-all active:scale-[0.99]"
            >
              <div className="flex items-center gap-3">
                <div className="text-lg font-bold w-8 text-center shrink-0">
                  {medalFor(i)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-display font-semibold text-sm text-[#e8eaf6] truncate">
                      {user.name}
                    </p>
                    {!user.isVerified && (
                      <Badge variant="warning" className="text-[10px]">
                        Unverified
                      </Badge>
                    )}
                  </div>
                  <p className="text-[#8890b8] text-xs truncate">
                    {user.email}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <div className="font-mono font-bold text-brand-300 text-sm">
                    {user.totalScore} pts
                  </div>
                  <div className="text-[#8890b8] text-[10px]">
                    {user.quizzesAttempted} quiz
                    {user.quizzesAttempted !== 1 ? 'zes' : ''}
                  </div>
                </div>
              </div>
              {user.quizzesAttempted > 0 && (
                <div className="mt-3 flex items-center gap-2">
                  <div className="flex-1 h-1.5 bg-night-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-brand-300 to-blue-500 rounded-full"
                      style={{ width: `${user.percentage}%` }}
                    />
                  </div>
                  <span className="text-[10px] text-[#8890b8] shrink-0">
                    {user.percentage}%
                  </span>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      )}

      {/* User detail modal */}
      <Modal
        isOpen={!!selected}
        onClose={() => setSelected(null)}
        title={selected?.name}
      >
        {selected && (
          <div>
            <div className="flex items-center gap-4 mb-5 p-4 bg-night-800 rounded-xl">
              <ScoreRing
                score={selected.totalScore}
                total={selected.totalMarks}
                size={72}
              />
              <div>
                <p className="text-[#8890b8] text-xs">{selected.email}</p>
                <p className="text-[#8890b8] text-xs">{selected.phone}</p>
                <p className="text-[#8890b8] text-xs capitalize">
                  {selected.gender?.replace('_', ' ')}
                </p>
                <div className="flex items-center gap-2 mt-2">
                  <Badge variant={selected.isVerified ? 'success' : 'warning'}>
                    {selected.isVerified ? '✓ Verified' : 'Unverified'}
                  </Badge>
                  <Badge variant="brand">
                    {selected.quizzesAttempted} attempted
                  </Badge>
                </div>
              </div>
            </div>

            <h3 className="font-display font-bold text-sm text-brand-300 uppercase tracking-wider mb-3">
              Attempt History
            </h3>
            {attemptsLoading ? (
              <div className="flex justify-center py-6">
                <Spinner />
              </div>
            ) : attempts.length === 0 ? (
              <p className="text-[#8890b8] text-sm text-center py-4">
                No attempts yet
              </p>
            ) : (
              <div className="space-y-2">
                {attempts.map((a) => (
                  <div
                    key={a._id}
                    className="flex items-center justify-between p-3 bg-night-800 rounded-xl"
                  >
                    <div className="flex-1 min-w-0 mr-3">
                      <p className="text-[#e8eaf6] text-sm font-medium truncate">
                        {a.quiz?.title || 'Quiz'}
                      </p>
                      <p className="text-[#8890b8] text-xs">
                        {a.submittedAt
                          ? new Date(a.submittedAt).toLocaleDateString(
                              'en-IN',
                              { dateStyle: 'medium' },
                            )
                          : ''}
                        {a.autoSubmitted ? ` · ⚠️ Auto` : ''}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-mono font-bold text-brand-300 text-sm">
                        {a.score}/{a.totalMarks}
                      </p>
                      <p className="text-[#8890b8] text-[10px]">
                        {Math.round((a.score / a.totalMarks) * 100)}%
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </Modal>
    </>
  );
};

// ─── Quiz Manager ─────────────────────────────────────────────────────────
const QuizManager = () => {
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetch = async () => {
    setLoading(true);
    try {
      const { data } = await adminAPI.getQuizzes();
      setQuizzes(data.data || []);
    } catch {
      toast.error('Failed to load quizzes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetch();
  }, []);

  const toggleLock = async (quiz) => {
    try {
      const { data } = await adminAPI.toggleLock(quiz._id);
      setQuizzes((prev) =>
        prev.map((q) =>
          q._id === quiz._id ? { ...q, isLocked: data.isLocked } : q,
        ),
      );
      toast.success(data.message);
    } catch {
      toast.error('Failed to update');
    }
  };

  const togglePublish = async (quiz) => {
    try {
      const { data } = await adminAPI.togglePublish(quiz._id);
      setQuizzes((prev) =>
        prev.map((q) =>
          q._id === quiz._id
            ? { ...q, isResultPublished: data.isResultPublished }
            : q,
        ),
      );
      toast.success(data.message);
    } catch {
      toast.error('Failed to update publish status');
    }
  };

  const deleteQuiz = async (id) => {
    if (!window.confirm('Delete this quiz and all its attempts?')) return;
    try {
      await adminAPI.deleteQuiz(id);
      setQuizzes((prev) => prev.filter((q) => q._id !== id));
      toast.success('Quiz deleted');
    } catch {
      toast.error('Failed to delete');
    }
  };

  if (loading)
    return (
      <div className="flex justify-center py-10">
        <Spinner size="lg" />
      </div>
    );

  if (quizzes.length === 0)
    return (
      <EmptyState
        icon="📋"
        title="No quizzes yet"
        description="Create your first quiz using the 'Create Quiz' tab."
      />
    );

  return (
    <div className="space-y-3">
      {quizzes.map((quiz, i) => (
        <motion.div
          key={quiz._id}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.04 }}
          className="glass rounded-xl overflow-hidden"
        >
          <div
            className="h-1"
            style={{ background: quiz.coverColor || '#00d4ff' }}
          />
          <div className="p-4">
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="flex-1 min-w-0">
                <h3 className="font-display font-semibold text-sm text-[#e8eaf6] leading-snug">
                  {quiz.title}
                </h3>
                <div className="flex flex-wrap gap-2 mt-1">
                  <span className="text-[#8890b8] text-[11px]">
                    📝 {quiz.questions?.length} Qs
                  </span>
                  <span className="text-[#8890b8] text-[11px]">
                    ⏱ {Math.floor(quiz.durationSeconds / 60)}m
                  </span>
                  <span className="text-[#8890b8] text-[11px]">
                    👥 {quiz.attemptCount} attempts
                  </span>
                </div>
              </div>
              <Badge variant={quiz.isLocked ? 'default' : 'success'}>
                {quiz.isLocked ? '🔒 Locked' : '🔓 Open'}
              </Badge>
              <Badge
                variant={quiz.isResultPublished ? 'success' : 'default'}
                className="ml-1"
              >
                {quiz.isResultPublished ? '📢 Published' : '🙈 Hidden'}
              </Badge>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => toggleLock(quiz)}
                className={`flex-1 py-1 px-2 rounded-lg text-xs font-semibold transition-all border
                  ${
                    quiz.isLocked
                      ? 'border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10'
                      : 'border-amber-500/30 text-amber-400 hover:bg-amber-500/10'
                  }`}
              >
                {quiz.isLocked ? '🔓 Unlock' : '🔒 Lock'}
              </button>
              <button
                onClick={() => togglePublish(quiz)}
                className={`flex-1 py-1 px-2 rounded-lg text-xs font-semibold transition-all border
                  ${
                    !quiz.isResultPublished
                      ? 'border-blue-500/30 text-blue-400 hover:bg-blue-500/10'
                      : 'border-purple-500/30 text-purple-400 hover:bg-purple-500/10'
                  }`}
              >
                {!quiz.isResultPublished ? '📢 Publish' : '🙈 Hide'}
              </button>
              <button
                onClick={() => deleteQuiz(quiz._id)}
                className="px-3 py-1 rounded-lg text-xs font-semibold border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-all"
              >
                🗑️
              </button>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
};

// ─── Create Quiz Form ─────────────────────────────────────────────────────
const CreateQuizForm = ({ onCreated }) => {
  const [form, setForm] = useState({
    title: '',
    description: '',
    instructions: '',
    durationSeconds: 600,
    coverColor: '#00d4ff',
    order: 0,
  });
  const [questions, setQuestions] = useState([
    {
      text: '',
      options: [{ text: '' }, { text: '' }],
      correctOptionIndex: 0,
      marks: 1,
      negativeMarks: 0.25,
    },
  ]);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  const addQuestion = () =>
    setQuestions((qs) => [
      ...qs,
      {
        text: '',
        options: [{ text: '' }, { text: '' }],
        correctOptionIndex: 0,
        marks: 1,
        negativeMarks: 0.25,
      },
    ]);

  const removeQuestion = (qi) =>
    setQuestions((qs) => qs.filter((_, i) => i !== qi));

  const updateQuestion = (qi, key, val) =>
    setQuestions((qs) =>
      qs.map((q, i) => (i === qi ? { ...q, [key]: val } : q)),
    );

  const addOption = (qi) =>
    setQuestions((qs) =>
      qs.map((q, i) =>
        i === qi && q.options.length < 6
          ? { ...q, options: [...q.options, { text: '' }] }
          : q,
      ),
    );

  const removeOption = (qi, oi) =>
    setQuestions((qs) =>
      qs.map((q, i) => {
        if (i !== qi) return q;
        const opts = q.options.filter((_, j) => j !== oi);
        const correct =
          q.correctOptionIndex >= opts.length ? 0 : q.correctOptionIndex;
        return { ...q, options: opts, correctOptionIndex: correct };
      }),
    );

  const updateOption = (qi, oi, val) =>
    setQuestions((qs) =>
      qs.map((q, i) =>
        i === qi
          ? {
              ...q,
              options: q.options.map((o, j) => (j === oi ? { text: val } : o)),
            }
          : q,
      ),
    );

  const validate = () => {
    const errs = {};
    if (!form.title.trim()) errs.title = 'Title required';
    if (!form.durationSeconds || form.durationSeconds < 30)
      errs.duration = 'Min 30 seconds';
    questions.forEach((q, i) => {
      if (!q.text.trim()) errs[`q_${i}`] = 'Question text required';
      q.options.forEach((o, j) => {
        if (!o.text.trim()) errs[`q_${i}_o_${j}`] = 'Option text required';
      });
    });
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) {
      toast.error('Please fill all required fields');
      return;
    }
    setSubmitting(true);
    try {
      await adminAPI.createQuiz({ ...form, questions });
      toast.success('Quiz created successfully! 🎉');
      onCreated?.();
      setForm({
        title: '',
        description: '',
        instructions: '',
        durationSeconds: 600,
        coverColor: '#00d4ff',
        order: 0,
      });
      setQuestions([
        {
          text: '',
          options: [{ text: '' }, { text: '' }],
          correctOptionIndex: 0,
          marks: 1,
          negativeMarks: 0.25,
        },
      ]);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create quiz');
    } finally {
      setSubmitting(false);
    }
  };

  const COLORS = [
    '#00d4ff',
    '#7c3aed',
    '#f59e0b',
    '#10b981',
    '#ef4444',
    '#ec4899',
  ];

  return (
    <div className="space-y-5 pb-10">
      {/* Basic info */}
      <div className="glass rounded-2xl p-4 space-y-4">
        <h3 className="font-display font-bold text-sm text-brand-300 uppercase tracking-widest">
          Quiz Details
        </h3>
        <div>
          <label className="block text-xs text-[#8890b8] uppercase tracking-widest mb-1.5">
            Title *
          </label>
          <input
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="e.g. General Knowledge Round 1"
            className="input-base text-sm"
          />
          {errors.title && (
            <p className="text-xs text-red-400 mt-1">{errors.title}</p>
          )}
        </div>
        <div>
          <label className="block text-xs text-[#8890b8] uppercase tracking-widest mb-1.5">
            Description
          </label>
          <textarea
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="Short description for participants..."
            rows={2}
            className="input-base text-sm resize-none"
          />
        </div>
        <div>
          <label className="block text-xs text-[#8890b8] uppercase tracking-widest mb-1.5">
            Instructions
          </label>
          <textarea
            value={form.instructions}
            onChange={(e) => setForm({ ...form, instructions: e.target.value })}
            placeholder="Special instructions shown before quiz starts..."
            rows={2}
            className="input-base text-sm resize-none"
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-[#8890b8] uppercase tracking-widest mb-1.5">
              Duration (seconds) *
            </label>
            <input
              type="number"
              min={30}
              value={form.durationSeconds}
              onChange={(e) =>
                setForm({
                  ...form,
                  durationSeconds: parseInt(e.target.value) || 0,
                })
              }
              className="input-base text-sm"
            />
            <p className="text-[10px] text-[#8890b8] mt-1">
              {Math.floor(form.durationSeconds / 60)}m{' '}
              {form.durationSeconds % 60}s
            </p>
            {errors.duration && (
              <p className="text-xs text-red-400">{errors.duration}</p>
            )}
          </div>
          <div>
            <label className="block text-xs text-[#8890b8] uppercase tracking-widest mb-1.5">
              Order
            </label>
            <input
              type="number"
              min={0}
              value={form.order}
              onChange={(e) =>
                setForm({ ...form, order: parseInt(e.target.value) || 0 })
              }
              className="input-base text-sm"
            />
          </div>
        </div>
        <div>
          <label className="block text-xs text-[#8890b8] uppercase tracking-widest mb-2">
            Cover Color
          </label>
          <div className="flex gap-2">
            {COLORS.map((c) => (
              <button
                key={c}
                onClick={() => setForm({ ...form, coverColor: c })}
                className={`w-8 h-8 rounded-full transition-all ${form.coverColor === c ? 'scale-125 ring-2 ring-white ring-offset-2 ring-offset-night-900' : 'hover:scale-110'}`}
                style={{ background: c }}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Questions */}
      <div className="space-y-4">
        {questions.map((q, qi) => (
          <div key={qi} className="glass rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-display font-bold text-sm text-brand-300">
                Q{qi + 1}
              </span>
              {questions.length > 1 && (
                <button
                  onClick={() => removeQuestion(qi)}
                  className="text-red-400 hover:text-red-300 text-sm px-2 py-1 rounded-lg hover:bg-red-500/10 transition-all"
                >
                  Remove
                </button>
              )}
            </div>
            <textarea
              value={q.text}
              onChange={(e) => updateQuestion(qi, 'text', e.target.value)}
              placeholder="Enter your question..."
              rows={2}
              className={`input-base text-sm resize-none ${errors[`q_${qi}`] ? 'border-red-500/60' : ''}`}
            />
            {errors[`q_${qi}`] && (
              <p className="text-xs text-red-400">{errors[`q_${qi}`]}</p>
            )}

            <div className="space-y-2">
              {q.options.map((opt, oi) => (
                <div key={oi} className="flex items-center gap-2">
                  <button
                    onClick={() => updateQuestion(qi, 'correctOptionIndex', oi)}
                    className={`shrink-0 w-7 h-7 rounded-full border-2 text-xs font-bold transition-all flex items-center justify-center
                      ${q.correctOptionIndex === oi ? 'bg-brand-300 border-brand-300 text-night-900' : 'border-white/20 text-[#8890b8] hover:border-brand-300/50'}`}
                  >
                    {String.fromCharCode(65 + oi)}
                  </button>
                  <input
                    value={opt.text}
                    onChange={(e) => updateOption(qi, oi, e.target.value)}
                    placeholder={`Option ${String.fromCharCode(65 + oi)}`}
                    className={`flex-1 input-base text-sm py-2.5 ${errors[`q_${qi}_o_${oi}`] ? 'border-red-500/60' : ''}`}
                  />
                  {q.options.length > 2 && (
                    <button
                      onClick={() => removeOption(qi, oi)}
                      className="text-red-400 hover:text-red-300 text-lg shrink-0 w-7 flex items-center justify-center"
                    >
                      ×
                    </button>
                  )}
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between flex-wrap gap-2">
              {q.options.length < 6 && (
                <button
                  onClick={() => addOption(qi)}
                  className="text-brand-300 text-xs hover:underline flex items-center gap-1"
                >
                  + Add Option
                </button>
              )}
              <div className="flex items-center gap-3 ml-auto">
                {/* Marks */}
                <div className="flex items-center gap-1.5">
                  <label className="text-xs text-[#8890b8] whitespace-nowrap">
                    +Marks:
                  </label>
                  <input
                    type="number"
                    min={0}
                    step={1}
                    value={q.marks}
                    onChange={(e) =>
                      updateQuestion(qi, 'marks', parseInt(e.target.value) || 0)
                    }
                    className="w-14 input-base text-sm py-1.5 px-2 text-center"
                  />
                </div>
                {/* Negative Marks */}
                <div className="flex items-center gap-1.5">
                  <label className="text-xs text-red-400 whitespace-nowrap">
                    −Penalty:
                  </label>
                  <input
                    type="number"
                    min={0}
                    step={0.25}
                    value={q.negativeMarks}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value);
                      updateQuestion(
                        qi,
                        'negativeMarks',
                        isNaN(val) ? 0 : Math.max(0, val),
                      );
                    }}
                    className="w-16 input-base text-sm py-1.5 px-2 text-center border-red-500/30 focus:border-red-400"
                  />
                </div>
              </div>
            </div>
            <p className="text-[10px] text-[#8890b8]">
              Tap a letter to mark as correct · Wrong answer deducts penalty
              points · Unanswered = no penalty
            </p>
          </div>
        ))}
      </div>

      <button
        onClick={addQuestion}
        className="w-full py-3 border-2 border-dashed border-brand-300/30 rounded-xl text-brand-300 text-sm font-semibold hover:border-brand-300/60 hover:bg-brand-300/5 transition-all"
      >
        + Add Question
      </button>

      <button
        onClick={handleSubmit}
        disabled={submitting}
        className="w-full py-4 bg-gradient-to-r from-brand-300 to-blue-500 text-night-900 font-display font-bold text-base rounded-xl transition-all hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
      >
        {submitting ? (
          <>
            <span className="animate-spin">⏳</span> Creating...
          </>
        ) : (
          '🚀 Create Quiz'
        )}
      </button>
    </div>
  );
};

// ─── Admin Page ────────────────────────────────────────────────────────────
export default function AdminPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(0);
  const [stats, setStats] = useState({});

  useEffect(() => {
    adminAPI
      .stats()
      .then(({ data }) => {
        if (data.success) setStats(data.data);
      })
      .catch(() => {});
  }, []);

  return (
    <div className="min-h-screen bg-night-900 relative">
      <div className="orbit-bg" />
      <div className="noise-bg" />

      <div className="relative z-10">
        {/* Nav */}
        <div className="sticky top-0 z-20 glass-dark border-b border-white/5">
          <div className="max-w-lg mx-auto px-5 py-3">
            <div className="flex items-center justify-between">
              <div>
                <Logo size="sm" />
                <p className="text-[10px] text-brand-300 font-semibold tracking-widest mt-0.5">
                  ADMIN PANEL
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-[#8890b8] text-xs hidden sm:block">
                  {user?.email}
                </span>
                <button
                  onClick={() => {
                    logout();
                    navigate('/login');
                  }}
                  className="text-[#8890b8] hover:text-red-400 transition-colors text-sm font-medium"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
          {/* Tabs */}
          <div className="max-w-lg mx-auto px-5 pb-3">
            <div className="flex gap-1 no-scrollbar overflow-x-auto">
              {TABS.map((tab, i) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(i)}
                  className={`px-4 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all
                    ${activeTab === i ? 'bg-brand-300 text-night-900' : 'text-[#8890b8] hover:text-white hover:bg-white/5'}`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="max-w-lg mx-auto px-5 py-5">
          <StatsRow stats={stats} />

          {activeTab === 0 && <Leaderboard />}
          {activeTab === 1 && <QuizManager />}
          {activeTab === 2 && (
            <CreateQuizForm
              onCreated={() => {
                setActiveTab(1);
                adminAPI
                  .stats()
                  .then(({ data }) => setStats(data.data))
                  .catch(() => {});
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
}
