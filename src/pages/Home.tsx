import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { generateUniqueCode } from '../lib/codeGen';
import { createGame } from '../lib/gameActions';
import { auth } from '../firebase';
import { Trophy, Play as PlayIcon, Users, Clock } from 'lucide-react';

interface RecentGame {
  code: string;
  role: 'host' | 'player';
  timestamp: number;
}

export default function Home() {
  const navigate = useNavigate();
  const [joinCode, setJoinCode] = useState('');
  const [recentGames, setRecentGames] = useState<RecentGame[]>([]);
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('__casino_recent_games');
      if (stored) {
        setRecentGames(JSON.parse(stored));
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  const addRecentGame = (code: string, role: 'host' | 'player') => {
    let recent = [...recentGames];
    // Remove if already exists
    recent = recent.filter(g => g.code !== code);
    recent.unshift({ code, role, timestamp: Date.now() });
    if (recent.length > 5) recent = recent.slice(0, 5);
    localStorage.setItem('__casino_recent_games', JSON.stringify(recent));
    setRecentGames(recent);
  };

  const handleCreate = async (type: 'poker' | 'blackjack') => {
    if (!auth.currentUser) return;
    const code = generateUniqueCode();
    await createGame(code, auth.currentUser.uid, type);
    addRecentGame(code, 'host');
    navigate(`/host/${code}`);
  };

  const handleSelectGame = () => {
    setIsCreating(true);
  };

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (joinCode.length === 3) {
      addRecentGame(joinCode, 'player');
      navigate(`/play/${joinCode}`);
    }
  };

  const clearRecent = () => {
    localStorage.removeItem('__casino_recent_games');
    setRecentGames([]);
  };

  return (
    <div className="max-w-4xl mx-auto px-6 py-12 text-center">
      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold uppercase tracking-wider mb-6">
        קזינו וירטואלי פרטי
      </div>
      <h1 className="text-5xl sm:text-7xl font-extrabold tracking-tight mb-8">
        פוקר ובלאק-ג'ק <br />
        <span className="text-slate-500">עם חברים.</span>
      </h1>
      <p className="text-xl text-slate-400 mb-12 max-w-2xl mx-auto leading-relaxed">
        הקזינו הביתי שלכם. צור שולחן פוקר או בלאק-ג'ק, הזמן את החברים והתחילו לשחק. ניהול יתרות וסיבובים קל ומהיר.
      </p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
        <div className="flex flex-col gap-6">
          {/* Create Game Card */}
          <div className="group p-8 bg-slate-900 border border-white/5 rounded-3xl hover:border-blue-500/50 transition-all text-right">
            <div className="w-12 h-12 bg-blue-500/10 rounded-2xl flex items-center justify-center mb-6 border border-blue-500/20 mr-0 ml-auto">
              <PlayIcon className="w-6 h-6 text-blue-500" />
            </div>
            <h3 className="text-2xl font-bold mb-3">פתח שולחן (מנהל)</h3>
            {!isCreating ? (
              <>
                <p className="text-slate-400 mb-8 leading-relaxed">פתח משחק חדש, נהל יתרות, וקבע את התוצאות.</p>
                <button 
                  onClick={handleSelectGame}
                  className="w-full py-4 bg-white text-slate-950 rounded-xl font-bold hover:bg-slate-100 transition-colors shadow-lg"
                >
                  פתח משחק חדש
                </button>
              </>
            ) : (
              <>
                <p className="text-slate-400 mb-6 leading-relaxed">בחר את סוג המשחק:</p>
                <div className="grid grid-cols-2 gap-3">
                  <button 
                    onClick={() => handleCreate('poker')}
                    className="py-4 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-500 transition-all active:scale-95"
                  >
                    פוקר
                  </button>
                  <button 
                    onClick={() => handleCreate('blackjack')}
                    className="py-4 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-500 transition-all active:scale-95"
                  >
                    בלאק-ג'ק
                  </button>
                </div>
                <button 
                  onClick={() => setIsCreating(false)}
                  className="w-full mt-4 text-slate-500 text-sm hover:text-slate-300 transition-colors"
                >
                  ביטול
                </button>
              </>
            )}
          </div>

          {/* Join Game Card */}
          <div className="group p-8 bg-slate-900 border border-white/5 rounded-3xl hover:border-emerald-500/50 transition-all text-right">
            <div className="w-12 h-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center mb-6 border border-emerald-500/20 mr-0 ml-auto">
              <Users className="w-6 h-6 text-emerald-500" />
            </div>
            <h3 className="text-2xl font-bold mb-3">הצטרף לשולחן (שחקן)</h3>
            <p className="text-slate-400 mb-8 leading-relaxed">הזן קוד בן 3 ספרות כדי להצטרף למשחק קיים.</p>
            <form onSubmit={handleJoin} className="space-y-4">
              <input 
                type="text" 
                inputMode="numeric"
                maxLength={3}
                value={joinCode}
                onChange={e => setJoinCode(e.target.value)}
                placeholder="קוד בן 3 ספרות"
                className="w-full py-4 px-4 bg-slate-800 border border-white/10 rounded-xl text-center text-3xl tracking-[1em] focus:outline-none focus:border-emerald-500 transition-colors"
                style={{ direction: 'ltr' }}
              />
              <button 
                type="submit"
                disabled={joinCode.length !== 3}
                className="w-full py-4 bg-slate-800 text-white rounded-xl font-bold hover:bg-slate-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                הצטרף
              </button>
            </form>
          </div>
        </div>

        {/* Recent Games Panel */}
        <div className="bg-slate-900/50 border border-white/5 rounded-3xl p-8 text-right flex flex-col">
           <div className="flex items-center justify-between mb-6">
             <h3 className="text-xl font-bold flex items-center gap-2 text-slate-200">
               <Clock className="w-5 h-5 text-slate-400" />
               משחקים אחרונים ששוחקו
             </h3>
             {recentGames.length > 0 && (
               <button onClick={clearRecent} className="text-sm text-slate-500 hover:text-red-400 transition-colors">
                 נקה רשימה
               </button>
             )}
           </div>

           {recentGames.length === 0 ? (
             <div className="flex-1 flex flex-col items-center justify-center text-slate-500 py-12">
               <Clock className="w-12 h-12 mb-4 opacity-50" />
               <p>אין משחקים אחרונים לחזור אליהם.</p>
             </div>
           ) : (
             <div className="space-y-3">
               {recentGames.map((g, i) => (
                 <div key={i} className="flex items-center justify-between bg-slate-800/80 p-4 rounded-xl border border-white/5 hover:border-slate-600 transition-colors cursor-pointer" onClick={() => navigate(`/${g.role}/${g.code}`)}>
                   <div>
                     <p className="font-bold text-lg text-emerald-400 tracking-wider">#{g.code}</p>
                     <p className="text-xs text-slate-400">{g.role === 'host' ? 'מנהל משחק (Host)' : 'שחקן'}</p>
                   </div>
                   <button 
                     className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-sm font-bold transition-colors"
                   >
                     הצטרף מחדש
                   </button>
                 </div>
               ))}
             </div>
           )}
           <p className="text-slate-500 text-sm mt-auto pt-6 text-center">המשחקים נשמרים בענן. ניתן לחזור למשחק דרך הקוד השמור.</p>
        </div>
      </div>
    </div>
  );
}
