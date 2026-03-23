import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { authAPI } from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import { Button, Input, OTPInput, Logo } from '../../components/ui';

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { saveAuth } = useAuth();
  const from = location.state?.from?.pathname || null;

  const [step, setStep] = useState('login'); // 'login' | 'otp'
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [otp, setOtp] = useState('');
  const [otpError, setOtpError] = useState('');
  const [resendCountdown, setResendCountdown] = useState(0);
  const [pendingEmail, setPendingEmail] = useState('');
  const [form, setForm] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
    setErrors((e) => ({ ...e, [name]: '' }));
  };

  const startResendTimer = () => {
    setResendCountdown(60);
    const interval = setInterval(() => {
      setResendCountdown((c) => {
        if (c <= 1) {
          clearInterval(interval);
          return 0;
        }
        return c - 1;
      });
    }, 1000);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!form.email) errs.email = 'Email is required';
    if (!form.password) errs.password = 'Password is required';
    if (Object.keys(errs).length) {
      setErrors(errs);
      return;
    }

    setLoading(true);
    try {
      const { data } = await authAPI.login(form);
      if (data.success) {
        saveAuth(data.token, data.user);
        toast.success(`Welcome back, ${data.user.name}!`);
        const dest =
          from || (data.user.role === 'admin' ? '/admin' : '/dashboard');
        navigate(dest, { replace: true });
      }
    } catch (err) {
      const res = err.response?.data;
      if (res?.requiresVerification) {
        toast.info('Please verify your email first');
        setPendingEmail(res.email || form.email);
        setStep('otp');
        startResendTimer();
      } else {
        toast.error(res?.message || 'Login failed');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (otp.length !== 6) {
      setOtpError('Enter the 6-digit OTP');
      return;
    }
    setOtpError('');
    setLoading(true);
    try {
      const { data } = await authAPI.verifyOtp({ email: pendingEmail, otp });
      if (data.success) {
        saveAuth(data.token, data.user);
        toast.success('Email verified! Welcome aboard 🎉');
        navigate('/dashboard', { replace: true });
      }
    } catch (err) {
      setOtpError(err.response?.data?.message || 'Invalid OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendCountdown > 0) return;
    try {
      await authAPI.resendOtp({ email: pendingEmail });
      toast.success('OTP resent!');
      setOtp('');
      setOtpError('');
      startResendTimer();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to resend');
    }
  };

  return (
    <div className="min-h-screen max-w-xl mx-auto flex flex-col relative overflow-hidden bg-night-900">
      <div className="orbit-bg" />
      <div className="noise-bg" />

      <div className="relative z-10 flex flex-col min-h-screen">
        <div className="px-6 pt-12 pb-4">
          <Logo size="md" />
        </div>

        <div className="flex-1 flex flex-col justify-center px-6 py-8">
          {step === 'login' ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              <div className="mb-8">
                <h1 className="font-display font-bold text-3xl text-gradient mb-2">
                  Welcome Back
                </h1>
                <p className="text-[#8890b8] text-sm">
                  Sign in to continue to the quiz event
                </p>
              </div>

              <form onSubmit={handleLogin} className="space-y-4">
                <Input
                  label="Email"
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="you@example.com"
                  error={errors.email}
                  required
                  autoComplete="email"
                  prefix={<span>✉️</span>}
                />
                <Input
                  label="Password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  value={form.password}
                  onChange={handleChange}
                  placeholder="Your password"
                  error={errors.password}
                  required
                  autoComplete="current-password"
                  prefix={<span>🔒</span>}
                  suffix={
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="text-[#8890b8] hover:text-brand-300 text-sm transition-colors px-2"
                    >
                      {showPassword ? 'Hide' : 'Show'}
                    </button>
                  }
                />
                <div className="pt-2">
                  <Button type="submit" fullWidth loading={loading} size="lg">
                    Sign In
                  </Button>
                </div>
              </form>

              <p className="text-center text-sm text-[#8890b8] mt-6">
                New here?{' '}
                <Link
                  to="/register"
                  className="text-brand-300 font-semibold hover:underline"
                >
                  Create Account
                </Link>
              </p>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <button
                onClick={() => setStep('login')}
                className="flex items-center gap-2 text-[#8890b8] hover:text-white text-sm mb-8 -ml-1"
              >
                <span>←</span> Back
              </button>
              <div className="mb-8 text-center">
                <div className="w-16 h-16 rounded-full bg-brand-300/10 border border-brand-300/20 flex items-center justify-center text-3xl mx-auto mb-4">
                  📧
                </div>
                <h1 className="font-display font-bold text-2xl text-gradient mb-2">
                  Verify Email
                </h1>
                <p className="text-[#8890b8] text-sm">
                  Enter the OTP sent to
                  <br />
                  <span className="text-brand-300 font-semibold">
                    {pendingEmail}
                  </span>
                </p>
              </div>
              <form onSubmit={handleVerifyOtp} className="space-y-6">
                <OTPInput value={otp} onChange={setOtp} error={otpError} />
                <Button type="submit" fullWidth loading={loading} size="lg">
                  Verify Email
                </Button>
                <div className="text-center">
                  <p className="text-[#8890b8] text-sm mb-2">
                    Didn't receive it?
                  </p>
                  <button
                    type="button"
                    onClick={handleResend}
                    disabled={resendCountdown > 0}
                    className="text-brand-300 font-semibold text-sm hover:underline disabled:opacity-50"
                  >
                    {resendCountdown > 0
                      ? `Resend in ${resendCountdown}s`
                      : 'Resend OTP'}
                  </button>
                </div>
              </form>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
