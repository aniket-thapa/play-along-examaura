import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { quizAPI } from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import {
  Badge,
  Logo,
  ScoreRing,
  Spinner,
  EmptyState,
} from '../../components/ui';

const formatDuration = (secs) => {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return s > 0 ? `${m}m ${s}s` : `${m}m`;
};

const QuizCard = ({ quiz, index, onClick }) => {
  const {
    attempt,
    isLocked,
    isResultPublished,
    title,
    description,
    questionCount,
    totalMarks,
    durationSeconds,
    coverColor,
  } = quiz;
  const isAttempted = !!attempt;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.07 }}
      onClick={() => !isLocked && onClick(quiz)}
      className={`relative overflow-hidden rounded-2xl border transition-all duration-300 select-none
        ${
          isLocked
            ? 'border-white/5 bg-night-800/50 opacity-70'
            : isAttempted
              ? 'border-emerald-500/20 bg-night-800/80 cursor-pointer hover:border-emerald-500/40'
              : 'border-brand-300/20 bg-night-800/80 cursor-pointer hover:border-brand-300/50 hover:shadow-lg hover:shadow-brand-300/5 active:scale-[0.98]'
        }`}
    >
      {/* Color accent bar */}
      <div
        className="h-1 w-full"
        style={{ background: isLocked ? '#1a2060' : coverColor }}
      />

      <div className="p-5">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex-1 min-w-0">
            <h3 className="font-display font-bold text-base text-[#e8eaf6] truncate">
              {title}
            </h3>
            {description && (
              <p className="text-[#8890b8] text-xs mt-0.5 line-clamp-2">
                {description}
              </p>
            )}
          </div>
          {isAttempted ? (
            isResultPublished ? (
              <ScoreRing
                score={attempt.score}
                total={attempt.totalMarks || totalMarks}
                size={56}
              />
            ) : (
              <div
                className="shrink-0 w-14 h-14 rounded-full bg-night-800 border-2 border-night-700 flex items-center justify-center text-xl"
                title="Result Hidden"
              >
                🙈
              </div>
            )
          ) : isLocked ? (
            <div className="shrink-0 w-10 h-10 rounded-xl bg-night-700 flex items-center justify-center text-xl lock-pulse">
              🔒
            </div>
          ) : (
            <div
              className="shrink-0 w-10 h-10 rounded-xl flex items-center justify-center text-xl"
              style={{ background: `${coverColor}20` }}
            >
              ⚡
            </div>
          )}
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <span className="text-[#8890b8] text-xs flex items-center gap-1">
            <span className="text-brand-300/70">📝</span> {questionCount} Qs
          </span>
          <span className="text-[#8890b8] text-xs flex items-center gap-1">
            <span className="text-brand-300/70">⏱</span>{' '}
            {formatDuration(durationSeconds)}
          </span>
          <span className="text-[#8890b8] text-xs flex items-center gap-1">
            <span className="text-brand-300/70">🏆</span> {totalMarks} pts
          </span>

          <div className="ml-auto">
            {isLocked ? (
              <Badge variant="default">Locked</Badge>
            ) : isAttempted ? (
              <Badge variant="success">✓ Done</Badge>
            ) : (
              <Badge variant="brand">Open</Badge>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default function DashboardPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchQuizzes = async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    try {
      const { data } = await quizAPI.list();
      if (data.success) setQuizzes(data.data);
    } catch {
      toast.error('Failed to load quizzes');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchQuizzes();
    const interval = setInterval(() => fetchQuizzes(true), 30000);
    return () => clearInterval(interval);
  }, []);

  const totalScore = quizzes.reduce(
    (s, q) =>
      s + (q.isResultPublished && q.attempt?.score ? q.attempt.score : 0),
    0,
  );
  const totalMarks = quizzes.reduce(
    (s, q) =>
      s +
      (q.isResultPublished && q.attempt?.score != null && q.attempt
        ? q.attempt.totalMarks
        : 0),
    0,
  );
  const attempted = quizzes.filter((q) => q.attempt).length;
  const unlocked = quizzes.filter((q) => !q.isLocked).length;

  const handleQuizClick = (quiz) => {
    navigate(`/quiz/${quiz._id}`);
  };

  return (
    <div className="min-h-screen bg-night-900 relative">
      <div className="orbit-bg" />
      <div className="noise-bg" />

      <div className="relative z-10">
        {/* Top Nav */}
        <div className="sticky top-0 z-20 glass-dark border-b border-white/5 px-5 py-3">
          <div className="flex items-center justify-between max-w-lg mx-auto">
            <Logo size="sm" />
            <div className="flex items-center gap-3">
              {refreshing && <Spinner size="sm" />}
              <button
                onClick={() => fetchQuizzes(true)}
                className="text-[#8890b8] hover:text-brand-300 transition-colors text-lg"
                title="Refresh"
              >
                ↻
              </button>
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

        <div className="max-w-lg mx-auto px-5 py-6 pb-10">
          {/* Greeting */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <p className="text-[#8890b8] text-sm font-body">Hello,</p>
            <h1 className="font-display font-bold text-2xl text-gradient">
              {user?.name} 👋
            </h1>
          </motion.div>

          {/* Stats row */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="grid grid-cols-3 gap-3 mb-6"
          >
            {[
              { label: 'Attempted', value: attempted, icon: '📝' },
              {
                label: 'Score',
                value: `${totalScore}/${totalMarks}`,
                icon: '🏆',
              },
              { label: 'Available', value: unlocked, icon: '🔓' },
            ].map((stat) => (
              <div
                key={stat.label}
                className="glass rounded-xl p-3 text-center"
              >
                <div className="text-xl mb-1">{stat.icon}</div>
                <div className="font-display font-bold text-base text-[#e8eaf6]">
                  {stat.value}
                </div>
                <div className="text-[#8890b8] text-[10px] font-medium mt-0.5">
                  {stat.label}
                </div>
              </div>
            ))}
          </motion.div>

          {/* Quizzes section */}
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display font-bold text-base text-[#e8eaf6]">
              Quizzes{' '}
              <span className="text-[#8890b8] font-body font-normal text-sm">
                ({quizzes.length})
              </span>
            </h2>
            <span className="text-xs text-[#8890b8]">
              Auto-refreshes every 30s
            </span>
          </div>

          {loading ? (
            <div className="flex justify-center py-16">
              <Spinner size="lg" />
            </div>
          ) : quizzes.length === 0 ? (
            <EmptyState
              icon="📋"
              title="No quizzes yet"
              description="Quizzes will appear here once they are added by the admin. Stay tuned!"
            />
          ) : (
            <div className="space-y-3">
              {quizzes.map((quiz, i) => (
                <QuizCard
                  key={quiz._id}
                  quiz={quiz}
                  index={i}
                  onClick={handleQuizClick}
                />
              ))}
            </div>
          )}

          {/* Locked notice */}
          {quizzes.some((q) => q.isLocked) && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="text-center text-[#8890b8] text-xs mt-6"
            >
              🔒 Locked quizzes will be unlocked by the admin during the event
            </motion.p>
          )}
        </div>
      </div>
    </div>
  );
}
