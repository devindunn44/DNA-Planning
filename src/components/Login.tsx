import React from 'react';
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { LogIn } from 'lucide-react';

export const Login: React.FC = () => {
  const handleGoogleSignIn = async () => {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Login failed", error);
    }
  };

  return (
    <div className="sign-wrap min-h-screen flex flex-col items-center justify-center p-8 bg-[var(--bg)]">
      <div className="sign-logo text-center mb-12">
        <h1 className="font-serif text-4xl text-[var(--p)] font-light tracking-tight">SyncSpace</h1>
        <p className="text-[var(--t2)] mt-2">A shared calendar for the two of you</p>
      </div>
      <div className="sign-box w-full max-w-sm">
        <button 
          onClick={handleGoogleSignIn}
          className="btn google w-full flex items-center justify-center gap-3 p-4 bg-white border border-gray-300 rounded-xl font-semibold text-gray-700 hover:bg-gray-50 transition-all"
        >
          <svg width="20" height="20" viewBox="0 0 20 20">
            <path d="M19.6 10.23c0-.68-.06-1.36-.18-2H10v3.77h5.4a4.6 4.6 0 01-2 3.02v2.5h3.24c1.9-1.75 2.96-4.33 2.96-7.3z" fill="#4285F4"/>
            <path d="M10 20c2.7 0 4.96-.9 6.62-2.43l-3.24-2.51c-.9.6-2.04.96-3.38.96-2.6 0-4.8-1.75-5.6-4.12H1.08v2.6A10 10 0 0010 20z" fill="#34A853"/>
            <path d="M4.4 11.9A5.97 5.97 0 014.1 10c0-.66.11-1.3.3-1.9V5.5H1.08A10 10 0 000 10c0 1.6.39 3.14 1.08 4.5l3.32-2.6z" fill="#FBBC05"/>
            <path d="M10 3.98c1.47 0 2.78.5 3.82 1.5l2.85-2.85C14.95.98 12.7 0 10 0A10 10 0 001.08 5.5l3.32 2.6C5.2 5.73 7.4 3.98 10 3.98z" fill="#EA4335"/>
          </svg>
          Continue with Google
        </button>
        <div className="divider flex items-center gap-3 my-6 text-gray-400 text-sm">
          <div className="h-px flex-1 bg-gray-200"></div>
          <span>or</span>
          <div className="h-px flex-1 bg-gray-200"></div>
        </div>
        <div className="space-y-4">
          <div className="field">
            <label className="block text-xs font-bold text-[var(--t2)] uppercase tracking-wider mb-1">Email</label>
            <input type="email" placeholder="you@example.com" disabled className="w-full p-3 border rounded-xl bg-gray-50 text-gray-400 cursor-not-allowed" />
          </div>
          <div className="field">
            <label className="block text-xs font-bold text-[var(--t2)] uppercase tracking-wider mb-1">Password</label>
            <input type="password" placeholder="••••••••" disabled className="w-full p-3 border rounded-xl bg-gray-50 text-gray-400 cursor-not-allowed" />
          </div>
          <button disabled className="w-full p-4 bg-gray-200 text-gray-500 rounded-xl font-semibold cursor-not-allowed">Email sign in coming soon</button>
        </div>
      </div>
    </div>
  );
};
