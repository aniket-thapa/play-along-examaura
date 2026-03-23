import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { Button, Logo } from '../components/ui';

export default function NotFoundPage() {
  const navigate = useNavigate();
  const { isAuthenticated, isAdmin } = useAuth();

  const handleBack = () => {
    if (isAuthenticated) {
      navigate(isAdmin ? '/admin' : '/dashboard');
    } else {
      navigate('/login');
    }
  };

  return (
    <div className="min-h-screen bg-night-900 flex flex-col relative overflow-hidden">
      <div className="orbit-bg" />
      <div className="noise-bg" />
      <div className="relative z-10 flex flex-col min-h-screen px-6">
        <div className="pt-10">
          <Logo size="md" />
        </div>
        <div className="flex-1 flex flex-col items-center justify-center text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 20 }}
          >
            <div className="font-display font-bold text-[120px] leading-none text-gradient opacity-20 mb-4">
              404
            </div>
            <h1 className="font-display font-bold text-2xl text-[#e8eaf6] mb-3">
              Page Not Found
            </h1>
            <p className="text-[#8890b8] text-sm mb-8 max-w-xs mx-auto leading-relaxed">
              The page you're looking for doesn't exist or has been moved.
            </p>
            <Button onClick={handleBack} size="lg">
              ← Go Back
            </Button>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
