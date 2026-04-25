/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Host from './pages/Host';
import Play from './pages/Play';
import { useEffect, useState } from 'react';
import { auth } from './firebase';
import { onAuthStateChanged, signInAnonymously, signInWithPopup, GoogleAuthProvider, User } from 'firebase/auth';
import RulesModal from './components/RulesModal';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return unsub;
  }, []);

  const handleGuestLogin = async () => {
    try {
      setLoading(true);
      await signInAnonymously(auth);
    } catch (e: any) {
      console.error("Anonymous auth failed:", e);
      if (e.code === 'auth/admin-restricted-operation') {
        alert("כניסת אורחים חסומה. יש להפעיל Anonymous Authentication ב-Firebase.");
      } else {
        alert("שגיאה בהתחברות: " + e.message);
      }
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      await signInWithPopup(auth, new GoogleAuthProvider());
    } catch (e: any) {
      console.error("Google auth failed:", e);
      alert("שגיאה בהתחברות עם גוגל: " + e.message);
      setLoading(false);
    }
  };

  if (loading && !user) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white" dir="rtl">
        <div className="animate-spin w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full mb-4" />
        <p className="text-slate-400">מתחבר...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6" dir="rtl">
        <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-8 text-center shadow-2xl">
          <div className="w-20 h-20 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto mb-8">
            <span className="text-4xl">🎲</span>
          </div>
          
          <h1 className="text-3xl font-black text-white mb-2 italic tracking-tighter">POKER NIGHT</h1>
          <p className="text-slate-400 mb-8 leading-relaxed">
            ברוכים הבאים למנהל פוקר. בחר כיצד ברצונך להתחבר:
          </p>

          <div className="space-y-4">
            <button 
              onClick={handleGoogleLogin}
              className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-white text-slate-950 rounded-2xl hover:bg-slate-100 font-bold transition-all active:scale-95 shadow-lg group"
            >
              <img src="https://www.google.com/favicon.ico" className="w-5 h-5" alt="Google" />
              התחבר עם גוגל (שומר נתונים)
            </button>

            <button 
              onClick={handleGuestLogin}
              className="w-full px-6 py-4 bg-slate-800 text-white rounded-2xl hover:bg-slate-700 font-bold transition-all active:scale-95 border border-slate-700"
            >
              המשך כאורח (ללא שמירה)
            </button>
          </div>

          <div className="mt-8 pt-8 border-t border-slate-800 text-right space-y-3">
             <h3 className="text-sm font-bold text-slate-300">💡 שים לב:</h3>
             <p className="text-xs text-slate-500 leading-relaxed">
               • התחברות עם גוגל מאפשרת לך לשמור על היתרה והסטטיסטיקות שלך בכל מכשיר.
             </p>
             <p className="text-xs text-slate-500 leading-relaxed">
               • מצב אורח מוחק את הנתונים ברגע שהדפדפן נסגר או המשחק מסתיים.
             </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div dir="rtl" className="min-h-screen bg-slate-950 text-slate-100 font-sans">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/host/:code" element={<Host />} />
          <Route path="/play/:code" element={<Play />} />
        </Routes>
        <RulesModal />
      </BrowserRouter>
    </div>
  );
}

