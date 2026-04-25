import { useParams, Link } from 'react-router-dom';
import { useGame } from '../lib/useGame';
import { auth } from '../firebase';
import QRCode from 'react-qr-code';
import { startGame, startRound, closeRound, setPlayerBalance, setAllPlayerBalances, resetGame } from '../lib/gameActions';
import { Player } from '../lib/types';
import { useState, useEffect } from 'react';
import { Users, AlertTriangle, ArrowRight, Check, History, RefreshCcw, X } from 'lucide-react';
import ChatBox from '../components/ChatBox';
import { playSound } from '../lib/sounds';
import ShareButton from '../components/ShareButton';

export default function Host() {
  const { code } = useParams();
  const { game, players, history, messages, loading } = useGame(code);
  const [baseBet, setBaseBet] = useState('');
  const [multiplier, setMultiplier] = useState(2);
  const [selectedWinners, setSelectedWinners] = useState<string[]>([]);
  const [initialBalances, setInitialBalances] = useState<Record<string, string>>({});
  const [globalBalance, setGlobalBalance] = useState('');
  const [historyOpen, setHistoryOpen] = useState(false);

  const [isCreating, setIsCreating] = useState(false);

  const [playerOutcomes, setPlayerOutcomes] = useState<Record<string, 'win' | 'lose' | 'push' | 'blackjack'>>({});

  useEffect(() => {
    if (game?.lastBaseBet && !baseBet) {
      setBaseBet(game.lastBaseBet.toString());
    }
    if (game?.meta.type === 'blackjack') {
      setMultiplier(1);
    } else {
      setMultiplier(2);
    }
  }, [game?.lastBaseBet, game?.meta.type]);

  if (loading) return <div className="p-8 text-center text-slate-400">טוען נתונים...</div>;
  if (!game) return <div className="p-8 text-center text-red-500">המשחק לא נמצא!</div>;
  if (game.meta.hostId !== auth.currentUser?.uid) {
    return <div className="p-8 text-center text-red-500">אין לך הרשאת מנהל למשחק זה.</div>;
  }

  const joinUrl = `${window.location.origin}/play/${code}`;
  const playersList = Object.entries(players) as [string, Player][];
  const isBlackjack = game.meta.type === 'blackjack';
  const gameName = isBlackjack ? 'בלאק-ג\'ק' : 'פוקר';

  const handleStartGame = async () => {
    // ensure all players have a balance
    await startGame(code!);
  };

  const handleSetBalance = async (uid: string) => {
    const bal = parseInt(initialBalances[uid] || '0');
    if (bal > 0) {
      await setPlayerBalance(code!, uid, bal);
    }
  };

  const handleSetGlobalBalance = async () => {
    const bal = parseInt(globalBalance);
    if (bal > 0) {
      await setAllPlayerBalances(code!, playersList.map(p => p[0]), bal);
      setGlobalBalance('');
      setInitialBalances({});
    }
  };

  const handleStartRound = async () => {
    const bet = isBlackjack ? 0 : parseInt(baseBet);
    if (bet >= 0) {
      playSound('deal');
      await startRound(code!, bet);
      setSelectedWinners([]);
      setPlayerOutcomes({});
    }
  };

  const handleCloseRound = async () => {
    if (!game.currentRound) return;
    playSound('action');
    await closeRound(code!, multiplier, selectedWinners, players, game.currentRound, isBlackjack, playerOutcomes);
  };

  const toggleWinner = (uid: string) => {
    setSelectedWinners(prev => 
      prev.includes(uid) ? prev.filter(id => id !== uid) : [...prev, uid]
    );
  };

  const toggleOutcome = (uid: string, outcome: 'win' | 'lose' | 'push' | 'blackjack') => {
    setPlayerOutcomes(p => ({...p, [uid]: outcome}));
  };

  const handleResetGame = async () => {
    if (window.confirm("האם אתה בטוח שברצונך לאפס את כל המשחק, המשחק יחזור ללובי וכל היתרות יאופסו?")) {
      await resetGame(code!, players);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8 border-b border-white/10 pb-4">
        <div>
          <h1 className="text-3xl font-bold">שולחן #{code}</h1>
          <p className="text-slate-400 text-sm">ניהול הקזינו • {gameName}</p>
        </div>
        <div className="flex items-center gap-4">
          <ShareButton code={code!} />
          <span className="px-3 py-1 bg-slate-800 rounded-full text-xs font-mono">{playersList.length} שחקנים מחוברים</span>
          {game.meta.phase === 'playing' && (
            <>
              <button onClick={() => setHistoryOpen(true)} className="flex items-center gap-2 text-slate-400 hover:text-white transition">
                <History className="w-5 h-5" /> היסטוריה
              </button>
              <button onClick={handleResetGame} className="flex items-center gap-2 text-red-400 hover:text-red-300 transition">
                <RefreshCcw className="w-5 h-5" /> איפוס משחק
              </button>
            </>
          )}
        </div>
      </div>

      {game.meta.phase === 'lobby' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1 bg-slate-900 border border-white/10 p-6 rounded-3xl text-center">
             <h2 className="text-xl font-bold mb-6">הזמן שחקנים</h2>
             <div className="bg-white p-4 rounded-xl inline-block mb-4">
               <QRCode value={joinUrl} size={150} />
             </div>
             <p className="text-4xl font-mono tracking-widest font-bold text-emerald-400 mb-2">{code}</p>
             <p className="text-slate-400 text-sm mb-4">סרוק להצטרפות או הזן קוד בדף הבית</p>
             <button 
               onClick={() => navigator.clipboard.writeText(joinUrl)}
               className="w-full py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-sm transition"
             >
               העתק קישור
             </button>
          </div>

          <div className="lg:col-span-2 bg-slate-900 border border-white/10 p-6 rounded-3xl">
             <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
               <Users className="w-5 h-5" /> רשימת שחקנים (לובי)
             </h2>
             
             <div className="mb-6 flex gap-2">
               <input 
                 type="number" 
                 placeholder="סכום התחלתי לכולם" 
                 value={globalBalance}
                 onChange={e => setGlobalBalance(e.target.value)}
                 className="flex-1 bg-slate-800 border border-white/10 rounded-lg px-4 py-2"
               />
               <button onClick={handleSetGlobalBalance} className="bg-slate-800 px-4 py-2 rounded-lg hover:bg-slate-700">Set All</button>
             </div>

             <div className="space-y-3">
               {playersList.length === 0 && <p className="text-slate-500 text-center py-4">ממתין לשחקנים...</p>}
               {playersList.map(([uid, p]) => (
                 <div key={uid} className="flex items-center justify-between bg-slate-800 p-3 rounded-xl border border-white/5">
                   <div>
                     <p className="font-bold">{p.name}</p>
                     <p className="text-xs text-slate-400">סטטוס: {p.status} | יתרה: ${p.balance}</p>
                   </div>
                   <div className="flex gap-2">
                     <input 
                       type="number"
                       placeholder="סכום"
                       value={initialBalances[uid] || ''}
                       onChange={e => setInitialBalances(prev => ({...prev, [uid]: e.target.value}))}
                       className="w-24 bg-slate-900 border border-white/10 rounded-lg px-2 py-1 text-sm text-center"
                     />
                     <button onClick={() => handleSetBalance(uid)} className="bg-blue-600 px-3 py-1 rounded-lg text-sm hover:bg-blue-500">אשר</button>
                   </div>
                 </div>
               ))}
             </div>

             <div className="mt-8">
               <button 
                 onClick={handleStartGame}
                 disabled={playersList.length === 0}
                 className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-lg transition disabled:opacity-50"
               >
                 התחל משחק
               </button>
             </div>
          </div>
        </div>
      )}

      {game.meta.phase === 'playing' && (
        <div className="space-y-8">
          
          {!game.currentRound?.active ? (
            <div className="bg-slate-900 border border-white/10 p-8 rounded-3xl text-center max-w-xl mx-auto shadow-2xl relative overflow-hidden">
              <h2 className="text-3xl font-black mb-2 text-white">סיבוב #{history.length + 1}</h2>
              <p className="text-slate-400 mb-6 font-mono text-sm">
                {isBlackjack ? "שחקנים יכניסו את סכום ההימור שלהם בתחילת הסיבוב" : (history.length > 0 ? "אותו סכום כמו בסיבוב הקודם" : "הכנס את ההימור לסיבוב הראשון (יישמר לשאר הסיבובים)")}
              </p>
              
              {!isBlackjack && (
                <div className="relative mb-8">
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 text-2xl font-bold">$</span>
                  <input 
                    type="number" 
                    placeholder="הימור בסיס" 
                    value={baseBet}
                    onChange={e => setBaseBet(e.target.value)}
                    readOnly={history.length > 0}
                    className={`w-full bg-slate-800 border-2 rounded-2xl px-12 py-5 text-center text-4xl font-black mb-4 outline-none transition-all ${history.length > 0 ? 'border-transparent text-emerald-400 cursor-not-allowed shadow-[0_0_30px_rgba(52,211,153,0.1)]' : 'border-slate-700 focus:border-blue-500 text-white shadow-xl'}`}
                  />
                </div>
              )}

              <button 
                onClick={handleStartRound}
                disabled={!isBlackjack && !baseBet}
                className="w-full py-5 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-bold text-xl transition-all disabled:opacity-50 active:scale-95 shadow-lg shadow-blue-500/20 uppercase tracking-widest"
              >
                התחל סיבוב #{history.length + 1}
              </button>
            </div>
          ) : (
            <div className="bg-slate-900 border border-white/10 p-6 rounded-3xl">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-emerald-400">סיבוב פעיל!</h2>
                <div className="text-slate-400 font-mono">בסיס: ${game.currentRound.baseBet}</div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Actions Tracking */}
                <div>
                  <h3 className="font-bold mb-4">סטטוס שחקנים על השולחן</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {playersList.map(([uid, p]) => {
                      const action = game.currentRound!.actions[uid];
                      const isAllIn = action && action.type !== 'fold' && action.amount >= p.balance;
                      const didFold = action && action.type === 'fold';
                      
                      let statusBg = "bg-slate-800/80 border-slate-700/50";
                      let iconStr = "⏳";
                      let statusText = "ממתין לתורו";
                      let amountDisplay = "";
                      
                      if (didFold) {
                        statusBg = "bg-slate-900/50 border-white/5 opacity-50";
                        iconStr = "❌";
                        statusText = "קיפל (Fold)";
                      } else if (isAllIn) {
                        statusBg = "bg-red-900/20 border-red-500/30";
                        iconStr = "🔥";
                        statusText = "אול-אין!";
                        amountDisplay = `$${action.amount}`;
                      } else if (action && action.type === 'raise') {
                        statusBg = "bg-amber-900/20 border-amber-500/30";
                        iconStr = "⬆️";
                        statusText = "העלה (Raise)";
                        amountDisplay = `$${action.amount}`;
                      } else if (action && action.type === 'call') {
                        statusBg = "bg-blue-900/20 border-blue-500/30";
                        iconStr = "✔️";
                        statusText = "השווה (Call)";
                        amountDisplay = `$${action.amount}`;
                      } else if (action && (action.type === 'hit' || action.type === 'stand')) {
                        statusBg = "bg-blue-900/10 border-blue-500/20";
                        iconStr = action.type === 'hit' ? "🃏" : "✋";
                        statusText = action.type === 'hit' ? "Hit" : "Stand";
                        amountDisplay = `$${action.amount}`;
                      } else if (action && (action.type === 'double')) {
                        statusBg = "bg-purple-900/10 border-purple-500/20";
                        iconStr = "✨";
                        statusText = "Double";
                        amountDisplay = `$${action.amount}`;
                      }

                      return (
                        <div key={uid} className={`flex flex-col p-3 rounded-xl border ${statusBg} transition-all`}>
                          <div className="flex justify-between items-start mb-1">
                            <span className="font-bold text-slate-200">{p.name}</span>
                            <span className="text-xs font-mono text-slate-500">${p.balance}</span>
                          </div>
                          
                          <div className="flex justify-between items-center mt-auto">
                            <div className="text-xs flex items-center gap-1.5 font-bold tracking-wide">
                              <span>{iconStr}</span>
                              <span className={
                                didFold ? 'text-slate-500' :
                                isAllIn ? 'text-red-400' :
                                action?.type === 'raise' ? 'text-amber-400' :
                                action?.type === 'call' ? 'text-blue-400' :
                                'text-slate-400'
                              }>
                                {statusText}
                              </span>
                            </div>
                            {amountDisplay && <span className="text-sm font-mono font-bold text-white">{amountDisplay}</span>}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Resolve Settings */}
                <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700">
                  <h3 className="font-bold mb-4">קביעת תוצאות</h3>
                  
                  {isBlackjack ? (
                    <div className="space-y-4 mb-6">
                      {playersList.map(([uid, p]) => {
                        const hasAction = game.currentRound!.actions[uid];
                        if (!hasAction) return null;
                        const outcome = playerOutcomes[uid] || 'lose';
                        
                        return (
                          <div key={uid} className="flex flex-col gap-2 p-3 bg-slate-900 rounded-lg border border-slate-700">
                             <div className="font-bold text-sm text-slate-300">{p.name} <span className="font-mono text-emerald-400">(${hasAction.amount})</span></div>
                             <div className="flex gap-1">
                                <button onClick={() => toggleOutcome(uid, 'win')} className={`flex-1 py-1.5 rounded text-xs font-bold transition ${outcome === 'win' ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}>Win (1:1)</button>
                                <button onClick={() => toggleOutcome(uid, 'blackjack')} className={`flex-1 py-1.5 rounded text-xs font-bold transition ${outcome === 'blackjack' ? 'bg-purple-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}>BJ (1.5:1)</button>
                                <button onClick={() => toggleOutcome(uid, 'push')} className={`flex-1 py-1.5 rounded text-xs font-bold transition ${outcome === 'push' ? 'bg-amber-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}>Push</button>
                                <button onClick={() => toggleOutcome(uid, 'lose')} className={`flex-1 py-1.5 rounded text-xs font-bold transition ${outcome === 'lose' ? 'bg-red-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}>Lose</button>
                             </div>
                          </div>
                        );
                      })}
                      {playersList.filter(([uid]) => game.currentRound!.actions[uid]).length === 0 && (
                        <p className="text-sm text-slate-500 text-center">אין עדיין שחקנים שהימרו בסיבוב זה.</p>
                      )}
                    </div>
                  ) : (
                    <>
                      <div className="mb-6">
                        <label className="block text-sm text-slate-400 mb-2">
                           הקופה (סך כל ההימורים):
                        </label>
                        <div className="text-3xl font-mono text-emerald-400 font-bold bg-slate-900 border border-emerald-500/20 p-4 rounded-xl inline-block shadow-[0_0_20px_rgba(52,211,153,0.1)]">
                           ${Object.values(game.currentRound!.actions).reduce((sum, act) => sum + (act.amount || 0), 0)}
                        </div>
                        <p className="text-xs text-slate-500 mt-2">סכום זה יחולק שווה בשווה בין המנצחים שייבחרו.</p>
                      </div>

                      <div className="mb-6">
                        <label className="block text-sm text-slate-400 mb-2">בחר מנצחים:</label>
                        <div className="flex flex-wrap gap-2">
                          {playersList.map(([uid, p]) => {
                            const hasAction = game.currentRound!.actions[uid];
                            const didFold = hasAction && hasAction.type === 'fold';
                            const isWin = selectedWinners.includes(uid);
                            
                            return (
                              <button
                                key={uid}
                                disabled={didFold || !hasAction}
                                onClick={() => toggleWinner(uid)}
                                className={`px-3 py-1.5 rounded-lg text-sm flex items-center gap-1 transition disabled:opacity-30 disabled:cursor-not-allowed ${
                                  isWin ? 'bg-emerald-500 text-white border border-emerald-500' : 'bg-slate-900 border border-slate-700 hover:border-slate-500'
                                }`}
                              >
                                {isWin && <Check className="w-3 h-3" />}
                                {p.name}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </>
                  )}

                  <button 
                    onClick={handleCloseRound}
                    className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold transition flex justify-center items-center gap-2"
                  >
                    סגור סיבוב ושמור יתרות <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

            </div>
          )}

          {/* Current global table standing */}
          <div className="bg-slate-900 border border-white/10 p-6 rounded-3xl">
             <h2 className="text-xl font-bold mb-4">טבלת יתרות</h2>
             <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
               {playersList.sort((a,b) => b[1].balance - a[1].balance).map(([uid, p]) => (
                  <div key={uid} className="bg-slate-800 p-4 rounded-xl border border-slate-700 text-center">
                    <div className="font-bold">{p.name}</div>
                    <div className="text-xl font-mono text-emerald-400 mt-1">${p.balance}</div>
                  </div>
               ))}
             </div>
          </div>
        </div>
      )}

      {/* History Drawer */}
      {historyOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setHistoryOpen(false)}></div>
          <div className="relative w-full max-w-md bg-slate-900 border-l border-white/10 h-full overflow-y-auto p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-bold">היסטוריית סיבובים</h2>
              <button onClick={() => setHistoryOpen(false)} className="p-2 bg-slate-800 rounded-full text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-4">
               {history.length === 0 ? (
                 <p className="text-slate-500 text-center py-8">אין עדיין סיבובים לשולחן זה</p>
               ) : (
                 history.map((h, i) => (
                   <div key={i} className="bg-slate-800 p-4 rounded-xl border border-slate-700">
                     <div className="flex justify-between items-center mb-2 border-b border-white/5 pb-2">
                       <span className="font-bold text-slate-300">בסיס: ${h.baseBet}</span>
                       <span className="text-emerald-400 font-mono">x{h.multiplier}</span>
                     </div>
                     <div className="text-sm space-y-1 mb-2">
                        {Object.entries(h.actions as any).map(([uid, act]: [string, any]) => (
                           <div key={uid} className="flex justify-between text-slate-400">
                             <span>{players[uid]?.name || 'שחקן לא ידוע'}: {act.type}</span>
                             <span>{act.type !== 'fold' && `$${act.amount}`}</span>
                           </div>
                        ))}
                     </div>
                     <div className="border-t border-white/5 pt-2 text-xs text-slate-500">
                       {game.meta.type === 'blackjack' ? (
                         <span>תוצאות: {Object.entries(h.outcomes || {}).map(([uid, out]) => `${players[uid]?.name || '?'}: ${out}`).join(', ') || 'אין'}</span>
                       ) : (
                         <span>מנצחים: {h.winners.map(uid => players[uid]?.name).join(', ') || 'אין'}</span>
                       )}
                     </div>
                   </div>
                 ))
               )}
            </div>
          </div>
        </div>
      )}

      {/* Chat */}
      <ChatBox code={code!} uid={auth.currentUser!.uid} name="Host" messages={messages} />
    </div>
  );
}
