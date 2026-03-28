import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { authAPI } from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import { Button, Input, Select, OTPInput, Logo } from '../../components/ui';

const GENDER_OPTIONS = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'other', label: 'Other' },
  { value: 'prefer_not_to_say', label: 'Prefer not to say' },
];

const validate = (form) => {
  const errs = {};
  if (!form.name.trim() || form.name.trim().length < 2)
    errs.name = 'Name must be at least 2 characters';
  if (!/^\+?[\d\s\-()]{7,15}$/.test(form.phone))
    errs.phone = 'Enter a valid phone number';
  if (!/^\S+@\S+\.\S+$/.test(form.email)) errs.email = 'Enter a valid email';
  if (!form.gender) errs.gender = 'Please select a gender';
  if (form.password.length < 6)
    errs.password = 'Password must be at least 6 characters';
  return errs;
};

export default function RegisterPage() {
  const navigate = useNavigate();
  const { saveAuth } = useAuth();
  const [step, setStep] = useState('register'); // 'register' | 'otp'
  const [loading, setLoading] = useState(false);
  const [otp, setOtp] = useState('');
  const [otpError, setOtpError] = useState('');
  const [resendCountdown, setResendCountdown] = useState(0);
  const [showPassword, setShowPassword] = useState(false);

  const [form, setForm] = useState({
    name: '',
    phone: '',
    email: '',
    gender: '',
    password: '',
  });
  const [errors, setErrors] = useState({});

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

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
    setErrors((e) => ({ ...e, [name]: '' }));
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    const errs = validate(form);
    if (Object.keys(errs).length) {
      setErrors(errs);
      return;
    }

    setLoading(true);
    try {
      const { data } = await authAPI.register(form);
      if (data.success) {
        toast.success('OTP sent to your email!');
        setStep('otp');
        startResendTimer();
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Registration failed';
      if (
        msg.toLowerCase().includes('otp resent') ||
        msg.toLowerCase().includes('unverified')
      ) {
        toast.success('OTP resent to your email!');
        setStep('otp');
        startResendTimer();
      } else {
        toast.error(msg);
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
      const { data } = await authAPI.verifyOtp({ email: form.email, otp });
      if (data.success) {
        saveAuth(data.token, data.user);
        toast.success(`Welcome, ${data.user.name}! 🎉`);
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
      await authAPI.resendOtp({ email: form.email });
      toast.success('OTP resent!');
      setOtp('');
      setOtpError('');
      startResendTimer();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to resend OTP');
    }
  };

  return (
    <div className="min-h-screen max-w-xl mx-auto flex flex-col relative overflow-hidden bg-night-900">
      <div className="orbit-bg" />
      <div className="noise-bg" />

      <div className="relative z-10 flex flex-col min-h-screen">
        {/* Header */}
        <div className="px-6 pt-12 pb-4">
          <Logo size="md" />
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col justify-center px-6 py-8">
          <AnimatePresence mode="wait">
            {step === 'register' ? (
              <motion.div
                key="register"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                <div className="mb-8">
                  <h1 className="font-display font-bold text-3xl text-gradient mb-2">
                    Create Account
                  </h1>
                  <p className="text-[#8890b8] text-sm">
                    Register to participate in the live quiz event
                  </p>
                </div>

                <form onSubmit={handleRegister} className="space-y-4">
                  <Input
                    label="Full Name"
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    placeholder="John Doe"
                    error={errors.name}
                    required
                    prefix={<span className="text-base">👤</span>}
                  />
                  <Input
                    label="Phone Number"
                    name="phone"
                    type="tel"
                    value={form.phone}
                    onChange={handleChange}
                    placeholder="+91 99999 99999"
                    error={errors.phone}
                    required
                    prefix={<span className="text-base">📱</span>}
                  />
                  <Input
                    label="Email Address"
                    name="email"
                    type="email"
                    value={form.email}
                    onChange={handleChange}
                    placeholder="you@example.com"
                    error={errors.email}
                    required
                    autoComplete="email"
                    prefix={<span className="text-base">✉️</span>}
                  />
                  <Select
                    label="Gender"
                    name="gender"
                    value={form.gender}
                    onChange={handleChange}
                    options={GENDER_OPTIONS}
                    error={errors.gender}
                    required
                  />
                  <Input
                    label="Password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    value={form.password}
                    onChange={handleChange}
                    placeholder="Min 8 chars, uppercase & number"
                    error={errors.password}
                    required
                    autoComplete="new-password"
                    prefix={<span className="text-base">🔒</span>}
                    suffix={
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="text-[#8890b8] hover:text-brand-300 transition-colors text-sm px-2"
                      >
                        {showPassword ? 'Hide' : 'Show'}
                      </button>
                    }
                  />

                  <div className="pt-2">
                    <Button type="submit" fullWidth loading={loading} size="lg">
                      Create Account & Get OTP
                    </Button>
                  </div>
                </form>

                <p className="text-center text-sm text-[#8890b8] mt-6">
                  Already have an account?{' '}
                  <Link
                    to="/login"
                    className="text-brand-300 font-semibold hover:underline"
                  >
                    Sign In
                  </Link>
                </p>
              </motion.div>
            ) : (
              <motion.div
                key="otp"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3 }}
              >
                <button
                  onClick={() => setStep('register')}
                  className="flex items-center gap-2 text-[#8890b8] hover:text-white text-sm mb-8 -ml-1 transition-colors"
                >
                  <span>←</span> Back
                </button>

                <div className="mb-8 text-center">
                  <div className="w-16 h-16 rounded-full bg-brand-300/10 border border-brand-300/20 flex items-center justify-center text-3xl mx-auto mb-4">
                    📧
                  </div>
                  <h1 className="font-display font-bold text-2xl text-gradient mb-2">
                    Check Your Email
                  </h1>
                  <p className="text-[#8890b8] text-sm leading-relaxed">
                    We sent a 6-digit code to
                    <br />
                    <span className="text-brand-300 font-semibold">
                      {form.email}
                    </span>
                  </p>
                </div>

                <form onSubmit={handleVerifyOtp} className="space-y-6">
                  <OTPInput value={otp} onChange={setOtp} error={otpError} />

                  <Button type="submit" fullWidth loading={loading} size="lg">
                    Verify & Join Event
                  </Button>

                  <div className="text-center">
                    <p className="text-[#8890b8] text-sm mb-2">
                      Didn't receive the code?
                    </p>
                    <button
                      type="button"
                      onClick={handleResend}
                      disabled={resendCountdown > 0}
                      className="text-brand-300 font-semibold text-sm hover:underline disabled:opacity-50 disabled:no-underline"
                    >
                      {resendCountdown > 0
                        ? `Resend in ${resendCountdown}s`
                        : 'Resend OTP'}
                    </button>
                  </div>
                </form>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
