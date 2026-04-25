import { useParams } from 'react-router-dom';
import { useGame } from '../lib/useGame';
import { auth } from '../firebase';
import { joinGame, submitAction } from '../lib/gameActions';
import React, { useState, useEffect, useRef } from 'react';
import { User, Coins, Check, AlertCircle, Trophy, Frown, XCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import ChatBox from '../components/ChatBox';
import { playSound } from '../lib/sounds';

export default function Play() {
  const { code } = useParams();
  const { game, players, history, messages, loading } = useGame(code);
  const [name, setName] = useState('');
  const [raiseAmount, setRaiseAmount] = useState('');
  const [betAmount, setBetAmount] = useState('');

  if (loading) return <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">טוען נתונים...</div>;
  if (!game) return <div className="p-8 text-center text-red-500">המשחק לא נמצא!</div>;

  const uid = auth.currentUser?.uid;
  if (!uid) return <div className="p-8 text-center text-red-500">שגיאת התחברות קריטית</div>;

  const me = players[uid];

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) await joinGame(code!, uid, name.trim());
  };

  if (!me) {
    return (
      <div className="max-w-md mx-auto px-4 py-12">
        <div className="bg-slate-900 border border-white/10 p-8 rounded-3xl text-center shadow-2xl">
          <div className="w-16 h-16 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <User className="w-8 h-8 text-blue-500" />
          </div>
          <h2 className="text-2xl font-bold mb-2">הצטרפות לשולחן #{code}</h2>
          <p className="text-slate-400 mb-8">הכנס את השם שלך כדי שהחברים יזהו אותך</p>
          
          <form onSubmit={handleJoin} className="space-y-4">
            <input 
              type="text"
              placeholder="השם שלך"
              required
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-4 text-center text-lg focus:border-blue-500 outline-none transition"
            />
            <button 
              type="submit"
              className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold transition"
            >
              הכנס אותי למשחק
            </button>
          </form>
        </div>
      </div>
    );
  }

  if (game.meta.phase === 'lobby') {
    return (
      <div className="max-w-md mx-auto px-4 py-12 text-center">
        <h2 className="text-2xl font-bold mb-4">ברוך הבא, {me.name}!</h2>
        <div className="animate-pulse bg-slate-800 border border-white/10 p-6 rounded-2xl mb-8">
          <p className="text-slate-400 text-lg">ממתין למנהל שיחלק יתרות ויתחיל את המשחק...</p>
        </div>
        {me.balance > 0 && (
          <div className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
             <Coins className="w-5 h-5 text-emerald-400" />
             <span className="text-emerald-400 font-bold tracking-widest text-lg">${me.balance}</span>
          </div>
        )}
      </div>
    );
  }

  // PLAYING PHASE
  const round = game.currentRound;
  const myAction = round?.actions[uid];
  const isBlackjack = game.meta.type === 'blackjack';

  const prevRoundRef = useRef(game.currentRound);
  const prevHistoryLengthRef = useRef(history.length);
  const prevBalanceRef = useRef(me?.balance);

  useEffect(() => {
    if (!me) return;

    // Detect round start (dealing cards)
    if (!prevRoundRef.current && game.currentRound) {
      playSound('deal');
    }

    // Detect round end (results)
    if (prevRoundRef.current && !game.currentRound && history.length > prevHistoryLengthRef.current) {
      // Analyze latest history for sounds
      const latestHistory = history[0];
      if (latestHistory && latestHistory.actions[uid]) {
        const act = latestHistory.actions[uid];
        const isWinPoker = latestHistory.winners.includes(uid);
        const outcomeBJ = latestHistory.outcomes ? latestHistory.outcomes[uid] : null;
        
        const isWin = outcomeBJ ? (outcomeBJ === 'win' || outcomeBJ === 'blackjack') : isWinPoker;
        const isPush = outcomeBJ === 'push';
        const isFold = act.type === 'fold';
        
        if (isWin) {
          playSound('win');
        } else if (isPush) {
          playSound('push');
        } else if (isFold) {
          // already played fold sound when doing action probably, but can play lose or thud here.
        } else {
          playSound('lose');
        }
      }
    }

    // Detect elimination
    if (prevBalanceRef.current !== undefined && prevBalanceRef.current > 0 && me.balance === 0) {
      // Small delay so it plays right after the lose sound
      setTimeout(() => playSound('lose'), 600);
    }

    prevRoundRef.current = game.currentRound;
    prevHistoryLengthRef.current = history.length;
    prevBalanceRef.current = me.balance;
  }, [game.currentRound, history, me, uid]);

  const doAction = async (type: import('../lib/types').PlayerAction['type'], amount: number) => {
    if (!round) return;
    if (type === 'fold') {
      playSound('fold');
    } else {
      playSound('bet');
    }
    await submitAction(code!, uid, { type, amount });
  };

  const handleRaiseSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseInt(raiseAmount);
    if (!round) return;
    if (amt >= round.baseBet * 2 && amt <= me.balance) {
      doAction('raise', amt);
    } else {
      alert("סכום ה-Raise חייב להיות פי 2 לפחות מבסיס ההימור ולא יותר מהיתרה שלך.");
    }
  };

  const handleBetSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseInt(betAmount);
    if (!round) return;
    if (amt > 0 && amt <= me.balance) {
      doAction('bet', amt);
    } else {
      alert("סכום ההימור חייב להיות חיובי ולא יותר מהיתרה שלך.");
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-8">
      {/* HUD */}
      <div className="flex justify-between items-center mb-8 bg-slate-900 border border-white/10 p-4 rounded-2xl shadow-lg">
        <div>
          <p className="text-xs text-slate-400 uppercase tracking-widest">שחקן</p>
          <p className="font-bold text-lg">{me.name}</p>
        </div>
        <div className="text-left">
          <p className="text-xs text-emerald-400/70 uppercase tracking-widest">יתרה</p>
          <p className="font-mono font-bold text-2xl text-emerald-400">${me.balance}</p>
        </div>
      </div>

       {/* Player Actions OR Status */}
       {!round?.active ? (
        <div className="text-center py-12 bg-slate-900 border border-white/5 rounded-3xl relative overflow-hidden">
          {history.length > 0 && history[0].actions[uid] ? (
            (() => {
              const h = history[0];
              const act = h.actions[uid];
              const isWinPoker = h.winners.includes(uid);
              const outcomeBJ = h.outcomes ? h.outcomes[uid] : null;
              
              const isWin = outcomeBJ ? (outcomeBJ === 'win' || outcomeBJ === 'blackjack') : isWinPoker;
              const isPush = outcomeBJ === 'push';
              const isFold = act.type === 'fold';
              const winAmount = outcomeBJ === 'blackjack' ? act.amount * 1.5 : (outcomeBJ === 'win' ? act.amount : (isWinPoker ? act.amount * h.multiplier : 0));

              if (isWin) {
                return (
                  <motion.div 
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: 'spring', bounce: 0.6 }}
                    className="space-y-4"
                  >
                    <div className="w-24 h-24 bg-yellow-500/20 border-2 border-yellow-500 shadow-[0_0_50px_rgba(234,179,8,0.4)] rounded-full flex items-center justify-center mx-auto mb-6">
                      <Trophy className="w-12 h-12 text-yellow-400" />
                    </div>
                    <h2 className="text-3xl font-black text-yellow-400 drop-shadow-lg">ניצחת!</h2>
                    <p className="text-lg text-slate-300">
                      בסיבוב האחרון זכית ב-
                      <span className="font-bold text-emerald-400 font-mono text-2xl mx-2">
                        +${winAmount}
                      </span>
                    </p>
                    <p className="text-sm text-slate-500 mt-6">ממתין שהמנהל יתחיל סיבוב חדש...</p>
                  </motion.div>
                );
              } else if (isPush) {
                return (
                  <div className="space-y-4 opacity-80">
                    <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-700">
                      <Coins className="w-8 h-8 text-amber-500" />
                    </div>
                    <h2 className="text-xl font-bold text-amber-400">Push (תיקו)</h2>
                    <p className="text-slate-500">הכסף שלך חזר אליך.</p>
                    <p className="text-sm text-slate-500 mt-6">ממתין לסיבוב הבא...</p>
                  </div>
                );
              } else if (isFold) {
                return (
                   <div className="space-y-4 opacity-80">
                    <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-700">
                      <XCircle className="w-8 h-8 text-slate-500" />
                    </div>
                    <h2 className="text-xl font-bold text-slate-400">פרשת (Fold)</h2>
                    <p className="text-slate-500">ממתין לסיבוב הבא...</p>
                   </div>
                );
              } else {
                return (
                  <div className="space-y-4 opacity-80">
                    <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Frown className="w-8 h-8 text-red-500" />
                    </div>
                    <h2 className="text-xl font-bold text-red-400">לא זכית</h2>
                    <p className="text-slate-400">
                      הפסדת בסיבוב זה
                      <span className="font-bold text-red-400 font-mono text-xl mx-2">
                        -${act.amount}
                      </span>
                    </p>
                    <p className="text-sm text-slate-500 mt-6">ממתין לסיבוב הבא...</p>
                  </div>
                );
              }
            })()
          ) : (
             <div className="space-y-4">
               <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
                 <Coins className="w-8 h-8 text-slate-500" />
               </div>
               <p className="text-slate-400 text-lg">ממתין לסיבוב חדש שיפתח על ידי המנהל...</p>
             </div>
          )}
        </div>
      ) : myAction && (!isBlackjack || myAction.type !== 'bet') ? (
        <div className="text-center py-12 bg-slate-900 border border-white/5 rounded-3xl">
          <div className="w-16 h-16 bg-blue-500/20 border border-blue-500/50 rounded-full flex items-center justify-center mx-auto mb-6">
             <Check className="w-8 h-8 text-blue-400" />
          </div>
          <h2 className="text-2xl font-bold text-blue-400 mb-2">הפעולה נרשמה</h2>
          <p className="text-slate-400 mb-4">{myAction.type.toUpperCase()} • ${myAction.amount}</p>
          <p className="text-sm text-slate-500">ממתינים ששאר השחקנים יסיימו...</p>
        </div>
      ) : isBlackjack && !myAction ? (
        <div className="bg-slate-900 border border-white/10 rounded-2xl p-6 text-center">
          {me.balance <= 0 ? (
            <div className="py-6">
               <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
               <h3 className="text-xl font-bold text-red-500 mb-2">נגמר לך הכסף</h3>
               <p className="text-slate-400">הודחת מהמשחק לסיבובים הבאים, אין לך מספיק יתרה להמר.</p>
            </div>
          ) : (
            <>
              <h3 className="font-bold mb-4">בחר סכום הימור</h3>
              <form onSubmit={handleBetSubmit} className="space-y-4">
                <input 
                  type="number"
                  placeholder={`הימור (מקסימום ${me.balance})`}
                  value={betAmount}
                  onChange={e => setBetAmount(e.target.value)}
                  className="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-4 font-mono text-xl focus:border-amber-500 outline-none text-center text-white"
                />
                <button 
                  type="submit"
                  disabled={!betAmount || parseInt(betAmount) <= 0 || parseInt(betAmount) > me.balance}
                  className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 disabled:text-slate-500 text-white rounded-xl font-bold py-4 transition"
                >
                  המר והמתן לקלפים
                </button>
              </form>
            </>
          )}
        </div>
      ) : me.balance < round.baseBet && !isBlackjack ? (
        <div className="text-center py-12 bg-red-900/20 border border-red-500/20 rounded-3xl">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-red-400 mb-2">אין מספיק יתרה</h2>
          <p className="text-slate-400 mb-6">אין לך מספיק יתרה לבצע Call בסיבוב זה.</p>
          <button 
            onClick={() => doAction('fold', 0)}
            className="w-full max-w-[200px] py-3 bg-slate-800 text-white rounded-lg hover:bg-slate-700"
          >
            Fold
          </button>
        </div>
      ) : (
        <div className="space-y-4">
           <div className="text-center mb-6">
             <p className="text-slate-400 mb-1">הימור בסיס לסיבוב:</p>
             <p className="text-3xl font-mono font-bold text-white">${round.baseBet}</p>
           </div>
           
           {!isBlackjack ? (
             <>
               <button 
                 onClick={() => doAction('call', round.baseBet)}
                 className="w-full py-5 bg-blue-600 hover:bg-blue-500 rounded-2xl font-bold text-2xl transition shadow-xl shadow-blue-900/30 active:scale-95 flex items-center justify-center gap-2"
               >
                 <span>Call</span> <span className="font-mono">${round.baseBet}</span>
                 {me.balance === round.baseBet && <span className="text-sm bg-red-500 px-2 py-1 rounded ml-2 text-white shadow">All-In!</span>}
               </button>

               <div className="bg-slate-900 border border-white/10 rounded-2xl p-4">
                 <form onSubmit={handleRaiseSubmit} className="flex gap-2">
                   <input 
                     type="number"
                     placeholder={`Raise (מינ' ${round.baseBet * 2})`}
                     value={raiseAmount}
                     onChange={e => setRaiseAmount(e.target.value)}
                     className="flex-1 bg-slate-800 border border-white/10 rounded-xl px-4 py-3 font-mono text-lg focus:border-amber-500 outline-none w-full"
                   />
                   <button 
                     type="submit"
                     disabled={!raiseAmount || parseInt(raiseAmount) < round.baseBet * 2 || parseInt(raiseAmount) > me.balance}
                     className="w-32 bg-amber-600 hover:bg-amber-500 disabled:bg-slate-800 disabled:text-slate-500 rounded-xl font-bold transition flex items-center justify-center relative overflow-hidden"
                   >
                     <span>Raise</span>
                     {parseInt(raiseAmount) === me.balance && <div className="absolute inset-x-0 bottom-0 top-0 bg-red-600 text-white font-bold flex items-center justify-center text-sm shadow">ALL IN!</div>}
                   </button>
                 </form>
                 <p className="text-xs text-slate-500 mt-2 text-center">עליך להעלות לפחות פי 2 מדמי הבסיס</p>
               </div>

               <button 
                 onClick={() => doAction('fold', 0)}
                 className="w-full py-4 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-2xl font-bold text-slate-300 transition active:scale-95 mt-4"
               >
                 Fold
               </button>
             </>
           ) : (
             <div className="grid grid-cols-2 gap-4">
                <button 
                  onClick={() => doAction('hit', myAction!.amount)}
                  className="py-6 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-bold text-xl shadow-lg active:scale-95"
                >
                  Hit
                </button>
                <button 
                  onClick={() => doAction('stand', myAction!.amount)}
                  className="py-6 bg-slate-800 hover:bg-slate-700 text-white rounded-2xl font-bold text-xl shadow-lg active:scale-95"
                >
                  Stand
                </button>
                <button 
                  disabled={me.balance < myAction!.amount * 2}
                  onClick={() => doAction('double', myAction!.amount * 2)}
                  className="py-4 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white rounded-2xl font-bold text-lg shadow-lg active:scale-95 col-span-2"
                >
                  Double ($ {myAction!.amount * 2})
                </button>
             </div>
           )}
        </div>
      )}

      {/* The Game Board - Display Everyone's Status */}
      {round?.active && (
        <div className="mt-12 pt-8 border-t border-white/10">
          <h3 className="text-sm font-bold text-slate-400 mb-4 uppercase tracking-widest text-center">השולחן כעת</h3>
          <div className="grid grid-cols-2 gap-3">
            {(Object.entries(players) as [string, import('../lib/types').Player][]).map(([playerId, p]) => {
              const action = round.actions[playerId];
              const isAllIn = action && action.type !== 'fold' && action.amount >= p.balance;
              const didFold = action && action.type === 'fold';
              
              let statusBg = "bg-slate-800/80 border-slate-700";
              let iconStr = "⏳";
              let statusText = "ממתין";
              let amountDisplay = "";
              
              if (didFold) {
                statusBg = "bg-slate-900/30 border-white/5 opacity-50";
                iconStr = "❌";
                statusText = "קיפל";
              } else if (isAllIn) {
                statusBg = "bg-red-900/10 border-red-500/20";
                iconStr = "🔥";
                statusText = "אול-אין";
                amountDisplay = `$${action.amount}`;
              } else if (action && action.type === 'raise') {
                statusBg = "bg-amber-900/10 border-amber-500/20";
                iconStr = "⬆️";
                statusText = "העלה";
                amountDisplay = `$${action.amount}`;
                      } else if (action && action.type === 'call') {
                        statusBg = "bg-blue-900/10 border-blue-500/20";
                        iconStr = "✔️";
                        statusText = "השווה";
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
                        <div key={playerId} className={`flex flex-col p-3 rounded-xl border ${statusBg}`}>
                          <span className="font-bold text-slate-200 text-sm mb-1 truncate">{p.name} {playerId === uid ? '(את/ה)' : ''}</span>
                          <div className="flex justify-between items-center mt-auto">
                            <span className="text-xs flex items-center gap-1">
                               <span>{iconStr}</span> 
                               <span className="text-slate-400 font-bold">{statusText}</span>
                            </span>
                            {amountDisplay && <span className="text-xs font-mono font-bold text-white">{amountDisplay}</span>}
                          </div>
                        </div>
                      );
            })}
          </div>
        </div>
      )}

      {/* Chat */}
      <ChatBox code={code!} uid={uid} name={me.name} messages={messages} />
    </div>
  );
}
