import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { quizAPI } from '../../utils/api';
import {
  Button,
  Logo,
  ProgressBar,
  Spinner,
  ScoreRing,
} from '../../components/ui';

const MAX_TAB_SWITCHES = 3;

const formatTime = (secs) => {
  const m = Math.floor(secs / 60)
    .toString()
    .padStart(2, '0');
  const s = (secs % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
};

// ─── Instruction Screen ───────────────────────────────────────────────────
const InstructionScreen = ({ quiz, onStart, onBack }) => (
  <div className="min-h-screen bg-night-900 relative flex flex-col">
    <div className="orbit-bg" />
    <div className="noise-bg" />
    <div className="relative z-10 flex flex-col flex-1 px-5 py-8 max-w-lg mx-auto w-full">
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-[#8890b8] hover:text-white text-sm mb-8 -ml-1"
      >
        <span>←</span> Dashboard
      </button>

      <div className="flex-1">
        <div className="text-center mb-8">
          <div className="w-20 h-20 rounded-2xl bg-brand-300/10 border border-brand-300/20 flex items-center justify-center text-4xl mx-auto mb-4">
            📋
          </div>
          <h1 className="font-display font-bold text-2xl text-gradient mb-1">
            {quiz.title}
          </h1>
          {quiz.description && (
            <p className="text-[#8890b8] text-sm">{quiz.description}</p>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {[
            { icon: '📝', label: 'Questions', value: quiz.questions.length },
            {
              icon: '⏱',
              label: 'Duration',
              value: `${Math.floor(quiz.durationSeconds / 60)}m`,
            },
            {
              icon: '🏆',
              label: 'Points',
              value:
                quiz.totalMarks ||
                quiz.questions.reduce((s, q) => s + (q.marks || 1), 0),
            },
          ].map((s) => (
            <div key={s.label} className="glass rounded-xl p-3 text-center">
              <div className="text-2xl mb-1">{s.icon}</div>
              <div className="font-display font-bold text-lg text-[#e8eaf6]">
                {s.value}
              </div>
              <div className="text-[#8890b8] text-[10px]">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Instructions */}
        <div className="glass rounded-2xl p-5 mb-6">
          <h2 className="font-display font-bold text-sm text-brand-300 uppercase tracking-widest mb-4">
            Instructions
          </h2>
          <div className="space-y-3">
            {[
              {
                icon: '⏰',
                text: `Total time: ${Math.floor(quiz.durationSeconds / 60)} minutes. Quiz auto-submits when time runs out.`,
              },
              {
                icon: '✅',
                text: 'Select one option per question. You can change or deselect your answer before submitting.',
              },
              {
                icon: '🚫',
                text: `Do not switch tabs or leave the browser. After ${MAX_TAB_SWITCHES} violations, your quiz is auto-submitted.`,
              },
              {
                icon: '📤',
                text: 'Click "Submit Quiz" when done or wait for the timer to expire.',
              },
              {
                icon: '⚠️',
                text: 'Once submitted, you cannot reattempt the quiz.',
              },
            ]
              .concat(
                quiz.instructions
                  ? [{ icon: '📌', text: quiz.instructions }]
                  : [],
              )
              .map((item, i) => (
                <div key={i} className="flex items-start gap-3">
                  <span className="text-base shrink-0 mt-0.5">{item.icon}</span>
                  <p className="text-[#8890b8] text-sm leading-relaxed">
                    {item.text}
                  </p>
                </div>
              ))}
          </div>
        </div>
      </div>

      <div className="safe-bottom">
        <Button onClick={onStart} fullWidth size="lg">
          Start Quiz ⚡
        </Button>
        <p className="text-center text-[#8890b8] text-xs mt-3">
          Timer starts immediately after clicking
        </p>
      </div>
    </div>
  </div>
);

// ─── Result Screen ────────────────────────────────────────────────────────
const ResultScreen = ({ result, quizTitle, onBack }) => {
  const published = result.isResultPublished;
  const pct =
    published && result.totalMarks > 0
      ? Math.round((result.score / result.totalMarks) * 100)
      : 0;
  const msg = !published
    ? ['✅ Submitted!', 'Your results will be published soon.']
    : pct >= 80
      ? ['🎉 Excellent!', 'Outstanding performance!']
      : pct >= 60
        ? ['👍 Good Job!', 'Solid attempt!']
        : pct >= 40
          ? ['📚 Keep Going!', 'Room to improve!']
          : ['💪 Try Harder!', 'Better luck next time!'];

  return (
    <div className="min-h-screen bg-night-900 relative flex flex-col">
      <div className="orbit-bg" />
      <div className="noise-bg" />
      <div className="relative z-10 flex flex-col flex-1 px-5 py-8 max-w-lg mx-auto w-full items-center justify-center">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 20 }}
          className="w-full text-center"
        >
          <h2 className="font-display font-bold text-xl text-gradient mb-2">
            {quizTitle}
          </h2>
          <p className="text-[#8890b8] text-sm mb-8">Quiz Completed</p>

          <div className="flex justify-center mb-8">
            {published ? (
              <ScoreRing
                score={result.score}
                total={result.totalMarks}
                size={140}
              />
            ) : (
              <div className="w-32 h-32 rounded-full border-4 border-night-700 bg-night-800 flex items-center justify-center text-4xl shadow-xl">
                🙈
              </div>
            )}
          </div>

          <h1 className="font-display font-bold text-3xl text-[#e8eaf6] mb-1">
            {msg[0]}
          </h1>
          <p className="text-[#8890b8] text-sm mb-8">{msg[1]}</p>

          <div className="glass rounded-2xl p-5 mb-8 space-y-4">
            {[
              ...(published
                ? [
                    {
                      label: 'Score',
                      value: `${result.score} / ${result.totalMarks}`,
                    },
                    { label: 'Percentage', value: `${pct}%` },
                  ]
                : []),
              {
                label: 'Time Taken',
                value: result.timeTakenSeconds
                  ? `${Math.floor(result.timeTakenSeconds / 60)}m ${result.timeTakenSeconds % 60}s`
                  : 'N/A',
              },
              ...(result.autoSubmitted
                ? [
                    {
                      label: 'Submitted By',
                      value:
                        result.autoSubmitReason === 'time_expired'
                          ? '⏰ Timer Expired'
                          : '🚫 Tab Switch',
                      warn: true,
                    },
                  ]
                : []),
            ].map((row) => (
              <div
                key={row.label}
                className="flex justify-between items-center border-b border-white/5 pb-3 last:border-0 last:pb-0"
              >
                <span className="text-[#8890b8] text-sm">{row.label}</span>
                <span
                  className={`font-semibold text-sm ${row.warn ? 'text-amber-400' : 'text-[#e8eaf6]'}`}
                >
                  {row.value}
                </span>
              </div>
            ))}
          </div>

          <Button onClick={onBack} fullWidth variant="secondary" size="lg">
            ← Back to Dashboard
          </Button>
        </motion.div>
      </div>
    </div>
  );
};

// ─── Main Quiz Page ────────────────────────────────────────────────────────
export default function QuizPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [phase, setPhase] = useState('loading'); // loading | instruction | quiz | result | error
  const [quiz, setQuiz] = useState(null);
  const [attemptId, setAttemptId] = useState(null);
  const [answers, setAnswers] = useState({}); // { questionId: optionIndex | null }
  const [currentQ, setCurrentQ] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [tabSwitches, setTabSwitches] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);

  const tabSwitchRef = useRef(0);
  const startTimeRef = useRef(null);
  const timerRef = useRef(null);
  const submitCalledRef = useRef(false);

  // Load quiz on mount
  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await quizAPI.get(id);
        if (!data.success) throw new Error();
        if (data.alreadyAttempted) {
          const res = await quizAPI.result(id);
          setResult(res.data.data);
          setQuiz(data.data);
          setPhase('result');
        } else {
          setQuiz(data.data);
          setPhase('instruction');
        }
      } catch (err) {
        const msg = err.response?.data?.message || 'Failed to load quiz';
        toast.error(msg);
        setPhase('error');
      }
    };
    load();
    return () => clearInterval(timerRef.current);
  }, [id]);

  const submitQuiz = useCallback(
    async (autoSubmit = false, reason = 'manual') => {
      if (submitCalledRef.current) return;
      submitCalledRef.current = true;
      clearInterval(timerRef.current);
      setSubmitting(true);

      const timeTaken = startTimeRef.current
        ? Math.floor((Date.now() - startTimeRef.current) / 1000)
        : null;
      const answerPayload = quiz.questions.map((q) => ({
        questionId: q._id,
        selectedOptionIndex: answers[q._id] ?? null,
      }));

      try {
        const { data } = await quizAPI.submit(id, {
          answers: answerPayload,
          autoSubmitted: autoSubmit,
          autoSubmitReason: reason,
          tabSwitchCount: tabSwitchRef.current,
          timeTakenSeconds: timeTaken,
        });
        if (data.success) {
          setResult(data.data);
          setPhase('result');
        }
      } catch (err) {
        toast.error(err.response?.data?.message || 'Submit failed');
        submitCalledRef.current = false;
      } finally {
        setSubmitting(false);
      }
    },
    [id, quiz, answers],
  );

  const startQuiz = async () => {
    try {
      const { data } = await quizAPI.start(id);
      if (!data.success) throw new Error();
      setAttemptId(data.attemptId);

      // Init answers
      const initAns = {};
      data.data.questions.forEach((q) => {
        initAns[q._id] = null;
      });
      setAnswers(initAns);

      // Timer — use server startedAt if available to handle re-opens
      const elapsed = startTimeRef.current ? 0 : 0;
      const remaining = quiz.durationSeconds - elapsed;
      setTimeLeft(Math.max(0, remaining));
      startTimeRef.current = Date.now() - elapsed * 1000;

      setCurrentQ(0);
      setPhase('quiz');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to start quiz');
    }
  };

  // Timer countdown
  useEffect(() => {
    if (phase !== 'quiz') return;
    timerRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(timerRef.current);
          submitQuiz(true, 'time_expired');
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [phase, submitQuiz]);

  // Visibility change detection (tab switch)
  useEffect(() => {
    if (phase !== 'quiz') return;
    const handleVisibility = () => {
      if (document.hidden) {
        tabSwitchRef.current += 1;
        setTabSwitches(tabSwitchRef.current);
        if (tabSwitchRef.current >= MAX_TAB_SWITCHES) {
          toast.error(
            `Auto-submitting: too many tab switches (${MAX_TAB_SWITCHES})`,
          );
          submitQuiz(true, 'tab_switch');
        } else {
          const remaining = MAX_TAB_SWITCHES - tabSwitchRef.current;
          toast.error(
            `⚠️ Tab switch detected! ${remaining} warning${remaining > 1 ? 's' : ''} left.`,
          );
        }
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () =>
      document.removeEventListener('visibilitychange', handleVisibility);
  }, [phase, submitQuiz]);

  const handleSelectOption = (qId, optIndex) => {
    setAnswers((prev) => ({
      ...prev,
      [qId]: prev[qId] === optIndex ? null : optIndex, // toggle deselect
    }));
  };

  const answeredCount = Object.values(answers).filter((v) => v !== null).length;
  const timerPct = quiz ? (timeLeft / quiz.durationSeconds) * 100 : 100;
  const timerClass =
    timeLeft <= 30
      ? 'timer-danger'
      : timeLeft <= 60
        ? 'timer-warning'
        : 'timer-safe';

  if (phase === 'loading')
    return (
      <div className="min-h-screen flex items-center justify-center bg-night-900">
        <Spinner size="lg" />
      </div>
    );

  if (phase === 'error')
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-6 bg-night-900">
        <div className="text-5xl">⚠️</div>
        <p className="text-[#8890b8] text-center">This quiz is not available</p>
        <Button onClick={() => navigate('/dashboard')} variant="secondary">
          ← Dashboard
        </Button>
      </div>
    );

  if (phase === 'instruction')
    return (
      <InstructionScreen
        quiz={quiz}
        onStart={startQuiz}
        onBack={() => navigate('/dashboard')}
      />
    );

  if (phase === 'result')
    return (
      <ResultScreen
        result={result}
        quizTitle={quiz?.title}
        onBack={() => navigate('/dashboard')}
      />
    );

  // ─── Quiz Phase ───────────────────────────────────────────────────────────
  const question = quiz.questions[currentQ];
  const isLast = currentQ === quiz.questions.length - 1;

  return (
    <div className="min-h-screen bg-night-900 flex flex-col relative">
      <div className="noise-bg" />

      {/* Fixed header */}
      <div className="relative z-20 glass-dark border-b border-white/5">
        <div className="max-w-lg mx-auto px-4 py-3">
          <div className="flex items-center justify-between mb-2">
            <Logo size="sm" />
            <div className="flex items-center gap-3">
              {tabSwitches > 0 && (
                <span className="text-amber-400 text-xs font-semibold">
                  ⚠️ {tabSwitches}/{MAX_TAB_SWITCHES}
                </span>
              )}
              <div className={`font-mono font-bold text-xl ${timerClass}`}>
                {formatTime(timeLeft)}
              </div>
            </div>
          </div>
          <ProgressBar
            value={quiz.durationSeconds - timeLeft}
            max={quiz.durationSeconds}
          />
        </div>
      </div>

      {/* Question area */}
      <div className="relative z-10 flex-1 max-w-lg mx-auto w-full px-4 py-5 flex flex-col">
        {/* Progress */}
        <div className="flex items-center justify-between mb-4">
          <span className="text-[#8890b8] text-xs">
            Question{' '}
            <span className="text-[#e8eaf6] font-bold">{currentQ + 1}</span> of{' '}
            {quiz.questions.length}
          </span>
          <span className="text-[#8890b8] text-xs">
            Answered:{' '}
            <span className="text-brand-300 font-bold">{answeredCount}</span>/
            {quiz.questions.length}
          </span>
        </div>

        <ProgressBar
          value={currentQ + 1}
          max={quiz.questions.length}
          className="mb-5"
        />

        {/* Question card */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentQ}
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            transition={{ duration: 0.25 }}
            className="flex-1"
          >
            <div className="glass rounded-2xl p-5 mb-5">
              <div className="flex items-start gap-3 mb-1">
                <span className="shrink-0 w-7 h-7 rounded-lg bg-brand-300/10 border border-brand-300/20 flex items-center justify-center text-brand-300 font-mono font-bold text-sm">
                  {currentQ + 1}
                </span>
                <p className="font-display font-semibold text-base text-[#e8eaf6] leading-snug pt-0.5">
                  {question.text}
                </p>
              </div>
              {question.marks > 1 && (
                <p className="text-xs text-[#8890b8] mt-2 ml-10">
                  {question.marks} points
                </p>
              )}
            </div>

            {/* Options */}
            <div className="space-y-3">
              {question.options.map((opt, i) => {
                const selected = answers[question._id] === i;
                return (
                  <motion.button
                    key={opt._id || i}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleSelectOption(question._id, i)}
                    className={`w-full flex items-center gap-4 rounded-xl p-4 text-left transition-all duration-200 border
                      ${
                        selected
                          ? 'bg-brand-300/10 border-brand-300 shadow-[0_0_12px_#00d4ff22]'
                          : 'bg-night-800/50 border-white/8 hover:border-brand-300/30 hover:bg-brand-300/5'
                      }`}
                  >
                    <span
                      className={`shrink-0 w-7 h-7 rounded-full border-2 flex items-center justify-center text-sm font-bold transition-all
                      ${selected ? 'bg-brand-300 border-brand-300 text-night-900' : 'border-white/20 text-[#8890b8]'}`}
                    >
                      {selected ? '✓' : String.fromCharCode(65 + i)}
                    </span>
                    <span
                      className={`text-sm font-body ${selected ? 'text-brand-300 font-medium' : 'text-[#ccd6f6]'}`}
                    >
                      {opt.text}
                    </span>
                  </motion.button>
                );
              })}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Bottom navigation */}
      <div className="relative z-20 glass-dark border-t border-white/5 safe-bottom">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center gap-3">
          <Button
            onClick={() => setCurrentQ((c) => Math.max(0, c - 1))}
            disabled={currentQ === 0}
            variant="secondary"
            size="md"
            className="flex-1"
          >
            ← Prev
          </Button>

          {isLast ? (
            <Button
              onClick={() => {
                const unanswered = quiz.questions.length - answeredCount;
                if (unanswered > 0) {
                  toast(
                    (t) => (
                      <div className="text-sm">
                        <p className="font-semibold mb-2">
                          {unanswered} question{unanswered > 1 ? 's' : ''}{' '}
                          unanswered!
                        </p>
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              toast.dismiss(t.id);
                              submitQuiz(false, 'manual');
                            }}
                            className="px-3 py-1 bg-brand-300 text-night-900 rounded-lg text-xs font-bold"
                          >
                            Submit Anyway
                          </button>
                          <button
                            onClick={() => toast.dismiss(t.id)}
                            className="px-3 py-1 bg-white/10 rounded-lg text-xs"
                          >
                            Review
                          </button>
                        </div>
                      </div>
                    ),
                    { duration: 8000, icon: '⚠️' },
                  );
                } else {
                  submitQuiz(false, 'manual');
                }
              }}
              loading={submitting}
              variant="primary"
              size="md"
              className="flex-1"
            >
              Submit ✓
            </Button>
          ) : (
            <Button
              onClick={() =>
                setCurrentQ((c) => Math.min(quiz.questions.length - 1, c + 1))
              }
              variant="primary"
              size="md"
              className="flex-1"
            >
              Next →
            </Button>
          )}
        </div>

        {/* Question dots */}
        <div className="max-w-lg mx-auto px-4 pb-2">
          <div className="flex flex-wrap gap-1.5 justify-center">
            {quiz.questions.map((q, i) => (
              <button
                key={i}
                onClick={() => setCurrentQ(i)}
                className={`w-7 h-7 rounded-md text-[10px] font-bold transition-all border
                  ${
                    i === currentQ
                      ? 'bg-brand-300 text-night-900 border-brand-300 shadow-[0_0_8px_#00d4ff55]'
                      : answers[q._id] !== null && answers[q._id] !== undefined
                        ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                        : 'bg-night-800 text-[#8890b8] border-white/10'
                  }`}
              >
                {i + 1}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
