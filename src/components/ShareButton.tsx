import React, { useState } from 'react';
import { Share2, Check } from 'lucide-react';

export default function ShareButton({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    const url = `${window.location.origin}/play/${code}`;
    
    // Try native share
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Join Poker/Blackjack Night',
          text: 'בואו לשחק פוקר ובלאק ג\'ק!',
          url: url,
        });
        return;
      } catch (err) {
        console.error('Error sharing', err);
      }
    }
    
    // Fallback to clipboard
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy', err);
    }
  };

  return (
    <button 
      onClick={handleShare}
      className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition ${
        copied 
          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
          : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-white/5'
      }`}
    >
      {copied ? <Check className="w-4 h-4" /> : <Share2 className="w-4 h-4" />}
      {copied ? 'הועתק!' : 'הזמן למשחק'}
    </button>
  );
}
