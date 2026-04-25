import React, { useState, useRef, useEffect } from 'react';
import { Message } from '../lib/types';
import { sendMessage } from '../lib/gameActions';
import { Send, MessageSquare } from 'lucide-react';

interface ChatBoxProps {
  code: string;
  uid: string;
  name: string;
  messages: Message[];
}

export default function ChatBox({ code, uid, name, messages }: ChatBoxProps) {
  const [text, setText] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    const msg = text.trim();
    setText('');
    try {
      await sendMessage(code, uid, name, msg);
    } catch (e) {
      console.error('Failed to send message', e);
    }
  };

  if (!isOpen) {
    return (
      <button 
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 p-4 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-500 transition-all z-50 flex items-center justify-center gap-2 group"
      >
        <MessageSquare className="w-6 h-6" />
        <span className="max-w-0 overflow-hidden whitespace-nowrap group-hover:max-w-[100px] transition-all duration-300 font-bold">
          צ'אט
        </span>
        {messages.length > 0 && (
          <span className="absolute -top-2 -left-2 bg-red-500 text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center">
            {messages.length}
          </span>
        )}
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 w-80 bg-slate-900 border border-white/10 rounded-2xl shadow-2xl flex flex-col z-50 overflow-hidden transform transition-all data-[state=open]:scale-100 data-[state=closed]:scale-95">
      {/* Header */}
      <div className="bg-slate-800 p-3 border-b border-white/5 flex justify-between items-center cursor-pointer" onClick={() => setIsOpen(false)}>
        <h3 className="font-bold flex items-center gap-2 text-slate-100">
           <MessageSquare className="w-4 h-4 text-blue-400" />
           צ'אט שולחן
        </h3>
        <button className="text-slate-400 hover:text-white">&times;</button>
      </div>

      {/* Messages */}
      <div className="h-64 overflow-y-auto p-4 space-y-3 bg-slate-950/50">
        {messages.length === 0 ? (
          <p className="text-center text-slate-500 text-sm mt-10">אין הודעות. תהיה הראשון לכתוב!</p>
        ) : (
          messages.map((m, i) => {
            const isMe = m.senderId === uid;
            return (
              <div key={m.id || i} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                <div className={`text-[10px] text-slate-500 mb-1 px-1`}>
                  {isMe ? 'את/ה' : m.senderName}
                </div>
                <div className={`px-3 py-2 rounded-2xl max-w-[85%] text-sm ${
                  isMe ? 'bg-blue-600 text-white rounded-br-none' : 'bg-slate-800 text-slate-200 border border-white/5 rounded-bl-none'
                }`}>
                  {m.text}
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="p-3 bg-slate-800 border-t border-white/5">
        <form onSubmit={handleSend} className="flex gap-2">
          <input 
            type="text" 
            placeholder="הקלד הודעה..."
            value={text}
            onChange={e => setText(e.target.value)}
            className="flex-1 bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-500 transition-colors"
          />
          <button 
            type="submit"
            disabled={!text.trim()}
            className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Send className="w-4 h-4 text-white" />
          </button>
        </form>
      </div>
    </div>
  );
}
