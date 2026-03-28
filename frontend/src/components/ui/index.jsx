import { motion } from 'framer-motion';

// ─── Button ────────────────────────────────────────────────────────────────
export const Button = ({
  children,
  onClick,
  type = 'button',
  variant = 'primary',
  size = 'md',
  disabled,
  loading,
  className = '',
  fullWidth = false,
}) => {
  const base =
    'relative inline-flex items-center justify-center font-body font-semibold rounded-xl transition-all duration-200 select-none overflow-hidden';
  const sizes = {
    sm: 'px-4 py-2 text-sm gap-1.5',
    md: 'px-6 py-3.5 text-[15px] gap-2',
    lg: 'px-8 py-4 text-base gap-2',
  };
  const variants = {
    primary:
      'bg-gradient-to-r from-brand-300 to-blue-500 text-night-900 shadow-lg shadow-brand-300/20 hover:shadow-brand-300/40 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:scale-100',
    secondary:
      'glass text-brand-300 border border-brand-300/30 hover:border-brand-300/60 hover:bg-brand-300/5 active:scale-[0.98]',
    ghost:
      'text-text-secondary hover:text-text-primary hover:bg-white/5 active:scale-[0.98]',
    danger:
      'bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30 active:scale-[0.98]',
    success:
      'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/30 active:scale-[0.98]',
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`${base} ${sizes[size]} ${variants[variant]} ${fullWidth ? 'w-full' : ''} ${className}`}
    >
      {loading && (
        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
          />
        </svg>
      )}
      {children}
    </button>
  );
};

// ─── Input ────────────────────────────────────────────────────────────────
export const Input = ({
  label,
  name,
  type = 'text',
  value,
  onChange,
  placeholder,
  error,
  required,
  prefix,
  suffix,
  className = '',
  autoComplete,
}) => (
  <div className={`w-full ${className}`}>
    {label && (
      <label
        htmlFor={name}
        className="block text-xs font-semibold text-[#8890b8] uppercase tracking-widest mb-2"
      >
        {label} {required && <span className="text-brand-300">*</span>}
      </label>
    )}
    <div
      className={`flex items-center input-base gap-2 p-0 ${error ? 'border-red-500/60' : ''}`}
    >
      {prefix && <span className="pl-4 text-[#3a4480] shrink-0">{prefix}</span>}
      <input
        id={name}
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        autoComplete={autoComplete}
        className="flex-1 bg-transparent outline-none px-4 py-3.5 text-[15px] text-[#e8eaf6] placeholder:text-[#3a4480] font-body"
      />
      {suffix && <span className="pr-4 text-[#3a4480] shrink-0">{suffix}</span>}
    </div>
    {error && (
      <p className="mt-1.5 text-xs text-red-400 flex items-center gap-1">
        <span>⚠</span>
        {error}
      </p>
    )}
  </div>
);

// ─── Select ────────────────────────────────────────────────────────────────
export const Select = ({
  label,
  name,
  value,
  onChange,
  options,
  error,
  required,
  className = '',
}) => (
  <div className={`w-full ${className}`}>
    {label && (
      <label
        htmlFor={name}
        className="block text-xs font-semibold text-[#8890b8] uppercase tracking-widest mb-2"
      >
        {label} {required && <span className="text-brand-300">*</span>}
      </label>
    )}
    <div className={`input-base p-0 ${error ? 'border-red-500/60' : ''}`}>
      <select
        id={name}
        name={name}
        value={value}
        onChange={onChange}
        className="w-full bg-transparent outline-none px-4 py-3.5 text-[15px] text-[#e8eaf6] font-body appearance-none"
      >
        <option value="" disabled className="bg-[#070b2a]">
          Select {label}
        </option>
        {options.map((o) => (
          <option key={o.value} value={o.value} className="bg-[#070b2a]">
            {o.label}
          </option>
        ))}
      </select>
    </div>
    {error && <p className="mt-1.5 text-xs text-red-400">{error}</p>}
  </div>
);

// ─── Card ────────────────────────────────────────────────────────────────
export const Card = ({ children, className = '', onClick, hover = false }) => (
  <div
    onClick={onClick}
    className={`glass rounded-2xl p-5 ${hover ? 'cursor-pointer hover:border-brand-300/40 transition-all duration-300' : ''} ${className}`}
  >
    {children}
  </div>
);

// ─── Badge ────────────────────────────────────────────────────────────────
export const Badge = ({ children, variant = 'default', className = '' }) => {
  const variants = {
    default: 'bg-white/10 text-[#8890b8]',
    success: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20',
    danger: 'bg-red-500/15 text-red-400 border border-red-500/20',
    warning: 'bg-amber-500/15 text-amber-400 border border-amber-500/20',
    brand: 'bg-brand-300/15 text-brand-300 border border-brand-300/20',
  };
  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${variants[variant]} ${className}`}
    >
      {children}
    </span>
  );
};

// ─── Spinner ────────────────────────────────────────────────────────────────
export const Spinner = ({ size = 'md', className = '' }) => {
  const sizes = { sm: 'h-4 w-4', md: 'h-8 w-8', lg: 'h-12 w-12' };
  return (
    <div className={`${sizes[size]} ${className}`}>
      <svg
        className="animate-spin w-full h-full text-brand-300"
        fill="none"
        viewBox="0 0 24 24"
      >
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="3"
        />
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
        />
      </svg>
    </div>
  );
};

// ─── PageLoader ────────────────────────────────────────────────────────────
export const PageLoader = () => (
  <div className="min-h-screen flex flex-col items-center justify-center gap-4">
    <div className="relative">
      <div className="w-16 h-16 rounded-full border-2 border-brand-300/20 animate-ping absolute inset-0" />
      <div className="w-16 h-16 rounded-full border-2 border-t-brand-300 animate-spin" />
    </div>
    <p className="text-[#8890b8] text-sm font-body animate-pulse">Loading...</p>
  </div>
);

// ─── EmptyState ────────────────────────────────────────────────────────────
export const EmptyState = ({ icon, title, description, action }) => (
  <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
    <div className="text-5xl mb-4 opacity-50">{icon}</div>
    <h3 className="font-display font-semibold text-lg text-[#e8eaf6] mb-2">
      {title}
    </h3>
    {description && (
      <p className="text-[#8890b8] text-sm leading-relaxed mb-6">
        {description}
      </p>
    )}
    {action}
  </div>
);

// ─── OTPInput ────────────────────────────────────────────────────────────
export const OTPInput = ({ value, onChange, error }) => {
  const digits = Array(6).fill('');
  const vals = value.split('');

  const handleChange = (e, i) => {
    const v = e.target.value.replace(/\D/g, '').slice(-1);
    const newVal = vals.slice();
    newVal[i] = v;
    onChange(newVal.join(''));
    if (v && i < 5) document.getElementById(`otp-${i + 1}`)?.focus();
  };

  const handleKeyDown = (e, i) => {
    if (e.key === 'Backspace' && !vals[i] && i > 0) {
      document.getElementById(`otp-${i - 1}`)?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData
      .getData('text')
      .replace(/\D/g, '')
      .slice(0, 6);
    onChange(pasted.padEnd(6, '').slice(0, 6));
  };

  return (
    <div>
      <div className="flex gap-2 justify-center">
        {digits.map((_, i) => (
          <input
            key={i}
            id={`otp-${i}`}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={vals[i] || ''}
            onChange={(e) => handleChange(e, i)}
            onKeyDown={(e) => handleKeyDown(e, i)}
            onPaste={handlePaste}
            className={`w-12 h-14 text-center text-xl font-mono font-bold bg-night-800 border rounded-xl outline-none transition-all
              ${vals[i] ? 'border-brand-300 text-brand-300 shadow-[0_0_12px_#00d4ff33]' : 'border-white/10 text-white'}
              ${error ? 'border-red-500/60' : ''}
              focus:border-brand-300 focus:shadow-[0_0_12px_#00d4ff33]`}
          />
        ))}
      </div>
      {error && (
        <p className="mt-2 text-xs text-red-400 text-center">{error}</p>
      )}
    </div>
  );
};

// ─── Modal ────────────────────────────────────────────────────────────────
export const Modal = ({ isOpen, onClose, children, title }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />
      <motion.div
        initial={{ y: 60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 60, opacity: 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="relative w-full max-w-lg glass rounded-2xl p-6 z-10 max-h-[90dvh] overflow-y-auto"
      >
        {title && (
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-display font-bold text-lg text-[#e8eaf6]">
              {title}
            </h2>
            <button
              onClick={onClose}
              className="text-[#8890b8] hover:text-white w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/5 text-xl"
            >
              ✕
            </button>
          </div>
        )}
        {children}
      </motion.div>
    </div>
  );
};

// ─── Logo ────────────────────────────────────────────────────────────────
export const Logo = ({ size = 'md' }) => {
  const sizes = { sm: 'text-lg', md: 'text-2xl', lg: 'text-4xl' };
  return (
    <div
      className={`font-display font-bold ${sizes[size]} flex items-center gap-2`}
    >
      <span className="text-brand-300">⚡</span>
      <span className="text-gradient">Digitines</span>
    </div>
  );
};

// ─── ProgressBar ────────────────────────────────────────────────────────
export const ProgressBar = ({ value, max, className = '' }) => {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));
  return (
    <div className={`progress-bar ${className}`}>
      <div className="progress-fill" style={{ width: `${pct}%` }} />
    </div>
  );
};

// ─── ScoreRing ────────────────────────────────────────────────────────────
export const ScoreRing = ({ score, total, size = 100 }) => {
  const pct = total > 0 ? (score / total) * 100 : 0;
  const r = 36;
  const circ = 2 * Math.PI * r;
  const dash = (pct / 100) * circ;
  const color = pct >= 70 ? '#00f5a0' : pct >= 40 ? '#ffb703' : '#ff4d6d';

  return (
    <div
      className="relative flex items-center justify-center"
      style={{ width: size, height: size }}
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 80 80"
        className="-rotate-90"
      >
        <circle
          cx="40"
          cy="40"
          r={r}
          fill="none"
          stroke="#1a2060"
          strokeWidth="6"
        />
        <circle
          cx="40"
          cy="40"
          r={r}
          fill="none"
          stroke={color}
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={`${dash} ${circ}`}
          style={{
            transition: 'stroke-dasharray 1s ease',
            filter: `drop-shadow(0 0 8px ${color}88)`,
          }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-mono font-bold text-lg" style={{ color }}>
          {Math.round(pct)}%
        </span>
        <span className="text-[#8890b8] text-[10px]">
          {score}/{total}
        </span>
      </div>
    </div>
  );
};
