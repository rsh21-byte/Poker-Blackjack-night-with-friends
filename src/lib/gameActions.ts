import { doc, setDoc, updateDoc, collection, getDocs, serverTimestamp, writeBatch, arrayUnion } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { Player, PlayerAction, Round } from './types';

export const createGame = async (code: string, hostId: string, type: string) => {
  try {
    const gameRef = doc(db, 'games', code);
    await setDoc(gameRef, {
      createdAt: serverTimestamp(),
      hostId,
      phase: 'lobby',
      type,
      currentRound: null
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `games/${code}`);
  }
};

export const joinGame = async (code: string, uid: string, name: string) => {
  try {
    const playerRef = doc(db, 'games', code, 'players', uid);
    await setDoc(playerRef, {
      name,
      balance: 0,
      joinedAt: serverTimestamp(),
      status: 'waiting'
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `games/${code}/players/${uid}`);
  }
};

export const startGame = async (code: string) => {
  try {
    const gameRef = doc(db, 'games', code);
    await updateDoc(gameRef, { phase: 'playing' });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `games/${code}`);
  }
};

export const setPlayerBalance = async (code: string, uid: string, balance: number) => {
  try {
    const playerRef = doc(db, 'games', code, 'players', uid);
    await updateDoc(playerRef, { balance, status: 'active' });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `games/${code}/players/${uid}`);
  }
};

export const setAllPlayerBalances = async (code: string, uids: string[], balance: number) => {
  try {
    const batch = writeBatch(db);
    uids.forEach(uid => {
      const playerRef = doc(db, 'games', code, 'players', uid);
      batch.update(playerRef, { balance, status: 'active' });
    });
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `games/${code}/players [BATCH]`);
  }
};

export const startRound = async (code: string, baseBet: number) => {
  try {
    const gameRef = doc(db, 'games', code);
    await updateDoc(gameRef, {
      lastBaseBet: baseBet,
      currentRound: {
        active: true,
        baseBet,
        status: 'betting',
        phase: 'preflop',
        currentHighestBet: baseBet,
        multiplier: null,
        winners: {},
        actions: {}
      }
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `games/${code}`);
  }
};

export const submitAction = async (code: string, uid: string, action: PlayerAction) => {
  try {
    const gameRef = doc(db, 'games', code);
    await updateDoc(gameRef, {
      [`currentRound.actions.${uid}`]: arrayUnion(action)
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `games/${code}`);
  }
};

export const closeRound = async (
  code: string, 
  multiplier: number, 
  winners: string[], 
  playersDict: Record<string, Player>, 
  round: Round,
  isBlackjack?: boolean,
  playerOutcomes?: Record<string, 'win' | 'lose' | 'push' | 'blackjack'>
) => {
  try {
    const batch = writeBatch(db);
    const gameRef = doc(db, 'games', code);
    
    const balancesAfter: Record<string, number> = {};
    
    const pokerPot = Object.values(round.actions).reduce((sum, act) => sum + (act.amount || 0), 0);
    const pokerWinAmount = winners.length > 0 ? Math.floor(pokerPot / winners.length) : 0;
    
    Object.keys(playersDict).forEach(uid => {
      let p = playersDict[uid];
      let newBalance = p.balance;
      const action = round.actions[uid];
      
      if (action && action.type !== 'fold') {
        if (isBlackjack && playerOutcomes) {
          const outcome = playerOutcomes[uid] || 'lose';
          if (outcome === 'win') {
            newBalance = p.balance + action.amount;
          } else if (outcome === 'blackjack') {
            newBalance = p.balance + action.amount * 1.5;
          } else if (outcome === 'push') {
            newBalance = p.balance; // push = no win, no loss on balance (bet returned)
          } else {
            newBalance = p.balance - action.amount; // lose
          }
        } else {
          newBalance = p.balance - (action.amount || 0);
          if (winners.includes(uid)) {
            newBalance += pokerWinAmount;
          }
        }
      }
      balancesAfter[uid] = newBalance;
      
      const playerRef = doc(db, 'games', code, 'players', uid);
      batch.update(playerRef, { balance: newBalance });
    });

    const historyRef = doc(collection(db, 'games', code, 'history'));
    batch.set(historyRef, {
      timestamp: serverTimestamp(),
      baseBet: round.baseBet,
      multiplier,
      pokerPot,
      actions: round.actions,
      winners,
      balancesAfter,
      ...(isBlackjack && playerOutcomes ? { outcomes: playerOutcomes } : {})
    });

    batch.update(gameRef, { currentRound: null });
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `games/${code} [CLOSE_ROUND]`);
  }
};

export const sendMessage = async (code: string, uid: string, name: string, text: string) => {
  try {
    const messagesRef = collection(db, 'games', code, 'messages');
    const msgDoc = doc(messagesRef);
    await setDoc(msgDoc, {
      senderId: uid,
      senderName: name,
      text,
      timestamp: serverTimestamp()
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `games/${code}/messages`);
  }
};

export const advancePhase = async (code: string, nextPhase: 'preflop' | 'flop' | 'turn' | 'river' | 'resolved') => {
  try {
    const gameRef = doc(db, 'games', code);
    await updateDoc(gameRef, {
      'currentRound.phase': nextPhase,
      'currentRound.status': nextPhase === 'resolved' ? 'resolved' : 'betting'
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `games/${code}`);
  }
};

export const resetGame = async (code: string, playersDict: Record<string, Player>) => {
  try {
    const batch = writeBatch(db);
    const gameRef = doc(db, 'games', code);
    batch.update(gameRef, { phase: 'lobby', currentRound: null });

    Object.keys(playersDict).forEach(uid => {
      const playerRef = doc(db, 'games', code, 'players', uid);
      batch.update(playerRef, { balance: 0, status: 'waiting' });
    });

    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `games/${code} [RESET_GAME]`);
  }
};
