import { useState, useEffect } from 'react';
import { doc, collection, onSnapshot, query, orderBy, limit } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { Game, Player, RoundHistory, Message } from './types';

export function useGame(code: string | undefined) {
  const [game, setGame] = useState<Game | null>(null);
  const [players, setPlayers] = useState<Record<string, Player>>({});
  const [history, setHistory] = useState<RoundHistory[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!code) return;

    const gameRootRef = doc(db, 'games', code);
    const playersRef = collection(db, 'games', code, 'players');
    const historyRef = query(collection(db, 'games', code, 'history'), orderBy('timestamp', 'desc'));
    const messagesRef = query(collection(db, 'games', code, 'messages'), orderBy('timestamp', 'asc'), limit(50));

    const unsubGame = onSnapshot(gameRootRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        setGame({
          meta: {
            createdAt: data.createdAt,
            hostId: data.hostId,
            phase: data.phase,
            type: data.type || 'poker'
          },
          currentRound: data.currentRound,
          lastBaseBet: data.lastBaseBet
        });
      } else {
        setGame(null);
      }
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, `games/${code}`);
    });

    const unsubPlayers = onSnapshot(playersRef, (snapshot) => {
      const pDict: Record<string, Player> = {};
      snapshot.forEach(doc => {
        pDict[doc.id] = doc.data() as Player;
      });
      setPlayers(pDict);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, `games/${code}/players`);
    });

    const unsubHistory = onSnapshot(historyRef, (snapshot) => {
      const h: RoundHistory[] = [];
      snapshot.forEach(doc => {
        h.push(doc.data() as RoundHistory);
      });
      setHistory(h);
    }, (error) => {
       handleFirestoreError(error, OperationType.GET, `games/${code}/history`);
    });

    const unsubMessages = onSnapshot(messagesRef, (snapshot) => {
      const m: Message[] = [];
      snapshot.forEach(doc => {
        m.push({ id: doc.id, ...doc.data() } as Message);
      });
      setMessages(m);
    }, (error) => {
       handleFirestoreError(error, OperationType.GET, `games/${code}/messages`);
    });

    return () => {
      unsubGame();
      unsubPlayers();
      unsubHistory();
      unsubMessages();
    };
  }, [code]);

  return { game, players, history, messages, loading };
}
