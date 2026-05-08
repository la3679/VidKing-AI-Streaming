import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { Chrome, Mail, Github, LogIn } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthModal = ({ isOpen, onClose }: AuthModalProps) => {
  const handleGoogleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      onClose();
    } catch (error) {
      console.error("Login failed:", error);
    }
  };

  if (!isOpen) return null;

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
    >
      <motion.div 
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        className="bento-card w-full max-w-md p-10 bg-neutral-900 shadow-2xl border-brand/20"
      >
            <div className="text-center mb-10">
              <h2 className="text-4xl font-display font-black tracking-tighter text-brand mb-2">
                VIDKING<span className="text-white ml-0.5">AI</span>
              </h2>
              <p className="text-xs text-brand uppercase font-black tracking-widest opacity-60 italic">Neural Streaming Access</p>
            </div>

            <div className="space-y-4">
              <button 
                onClick={handleGoogleLogin}
                className="w-full flex items-center justify-center gap-3 bg-white text-black py-4 rounded-xl font-bold hover:bg-gray-100 transition-all font-sans active:scale-95"
              >
                <Chrome className="w-5 h-5" />
                Continue with Google
              </button>
              
              <button className="w-full flex items-center justify-center gap-3 bg-white/5 border border-white/10 text-white py-4 rounded-xl font-bold hover:bg-white/10 transition-all font-sans active:scale-95">
                <Github className="w-5 h-5" />
                Continue with GitHub
              </button>

              <div className="relative my-8">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-white/5"></div>
                </div>
                <div className="relative flex justify-center text-[10px] uppercase">
                  <span className="bg-neutral-900 px-3 text-white/20 font-black tracking-[0.3em]">Credentials</span>
                </div>
              </div>

              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/20 group-focus-within:text-brand transition-colors" />
                <input 
                  type="email" 
                  placeholder="Neural ID (Email)" 
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-4 pl-12 focus:outline-none focus:border-brand/50 transition-all text-sm font-medium"
                />
              </div>

              <button className="btn-primary w-full py-4 tracking-widest uppercase text-xs font-black">
                Enter the Kingdom
              </button>
            </div>

            <p className="mt-8 text-center text-xs text-gray-500">
              By continuing, you agree to VidKing's <span className="underline cursor-pointer">Terms of Service</span> and <span className="underline cursor-pointer">Privacy Policy</span>.
            </p>
          </motion.div>
        </motion.div>
  );
};
