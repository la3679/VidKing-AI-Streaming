import { useState } from 'react';
import { motion } from 'motion/react';
import {
  GoogleAuthProvider,
  GithubAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
} from 'firebase/auth';
import { auth, firebaseEnabled } from '../lib/firebase';
import { Chrome, Mail, Github, Lock, Loader2 } from 'lucide-react';
import { useEscapeKey } from '../hooks/useEscapeKey';
import { isValidEmail, isValidPassword } from '../lib/validation';
import { getErrorMessage } from '../lib/errors';
import { toast } from '../store/useToastStore';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type Mode = 'signin' | 'signup';

export const AuthModal = ({ isOpen, onClose }: AuthModalProps) => {
  const [mode, setMode] = useState<Mode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [busy, setBusy] = useState<string | null>(null);

  useEscapeKey(onClose, isOpen);

  const guard = (): boolean => {
    if (!firebaseEnabled) {
      toast.error('Sign-in is unavailable: Firebase is not configured.');
      return false;
    }
    return true;
  };

  const runProvider = async (kind: 'google' | 'github') => {
    if (!guard()) return;
    setBusy(kind);
    try {
      const provider =
        kind === 'google' ? new GoogleAuthProvider() : new GithubAuthProvider();
      await signInWithPopup(auth, provider);
      toast.success('Signed in successfully');
      onClose();
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setBusy(null);
    }
  };

  const submitEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!guard()) return;
    if (!isValidEmail(email)) return toast.error('Please enter a valid email address.');
    if (!isValidPassword(password))
      return toast.error('Password must be at least 6 characters.');

    setBusy('email');
    try {
      if (mode === 'signup') {
        const cred = await createUserWithEmailAndPassword(auth, email, password);
        if (name.trim()) await updateProfile(cred.user, { displayName: name.trim() });
        toast.success('Account created');
      } else {
        await signInWithEmailAndPassword(auth, email, password);
        toast.success('Signed in successfully');
      }
      onClose();
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setBusy(null);
    }
  };

  if (!isOpen) return null;
  const loading = busy !== null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        role="dialog"
        aria-modal="true"
        aria-label="Sign in to VidKing"
        onClick={(e) => e.stopPropagation()}
        className="bento-card w-full max-w-md p-8 sm:p-10 bg-card shadow-2xl border-brand/20"
      >
        <div className="text-center mb-8">
          <h2 className="text-4xl font-display font-black tracking-tighter text-brand mb-2">
            VIDKING<span className="text-ink ml-0.5">AI</span>
          </h2>
          <p className="text-xs text-muted uppercase font-black tracking-widest">
            {mode === 'signin' ? 'Welcome back' : 'Create your account'}
          </p>
        </div>

        <div className="space-y-3">
          <button
            onClick={() => runProvider('google')}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 bg-white text-black py-3.5 rounded-xl font-bold hover:bg-gray-100 transition-all active:scale-95 disabled:opacity-60"
          >
            {busy === 'google' ? <Loader2 className="w-5 h-5 animate-spin" /> : <Chrome className="w-5 h-5" />}
            Continue with Google
          </button>

          <button
            onClick={() => runProvider('github')}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 bg-panel border border-line text-ink py-3.5 rounded-xl font-bold hover:bg-line transition-all active:scale-95 disabled:opacity-60"
          >
            {busy === 'github' ? <Loader2 className="w-5 h-5 animate-spin" /> : <Github className="w-5 h-5" />}
            Continue with GitHub
          </button>
        </div>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-line" />
          </div>
          <div className="relative flex justify-center text-[10px] uppercase">
            <span className="bg-card px-3 text-muted font-black tracking-[0.3em]">
              or with email
            </span>
          </div>
        </div>

        <form onSubmit={submitEmail} className="space-y-3">
          {mode === 'signup' && (
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Display name (optional)"
              aria-label="Display name"
              className="w-full bg-panel border border-line rounded-xl py-3.5 px-4 focus:outline-none focus:border-brand/50 transition-all text-sm"
            />
          )}
          <div className="relative group">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted group-focus-within:text-brand transition-colors" aria-hidden="true" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              aria-label="Email"
              autoComplete="email"
              className="w-full bg-panel border border-line rounded-xl py-3.5 pl-12 pr-4 focus:outline-none focus:border-brand/50 transition-all text-sm"
            />
          </div>
          <div className="relative group">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted group-focus-within:text-brand transition-colors" aria-hidden="true" />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              aria-label="Password"
              autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
              className="w-full bg-panel border border-line rounded-xl py-3.5 pl-12 pr-4 focus:outline-none focus:border-brand/50 transition-all text-sm"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full py-3.5 tracking-widest uppercase text-xs font-black disabled:opacity-60"
          >
            {busy === 'email' ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : mode === 'signin' ? (
              'Sign in'
            ) : (
              'Create account'
            )}
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-muted">
          {mode === 'signin' ? "Don't have an account?" : 'Already have an account?'}{' '}
          <button
            onClick={() => setMode(mode === 'signin' ? 'signup' : 'signin')}
            className="text-brand font-bold hover:underline"
          >
            {mode === 'signin' ? 'Sign up' : 'Sign in'}
          </button>
        </p>
      </motion.div>
    </motion.div>
  );
};
