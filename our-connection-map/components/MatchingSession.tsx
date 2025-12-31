
import React, { useState, useEffect } from 'react';
import { User } from '../types';
import { store } from '../services/store';

interface Props {
  user: User;
  partner: User;
  onComplete: () => void;
}

const MatchingSession: React.FC<Props> = ({ user, partner, onComplete }) => {
  const [newTraits, setNewTraits] = useState<string[]>(['', '', '']);
  const [showHighFive, setShowHighFive] = useState(false);
  const [countdown, setCountdown] = useState(5);

  const preCommon = user.traits.filter(t => partner.traits.includes(t));

  useEffect(() => {
    if (showHighFive && countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else if (showHighFive && countdown === 0) {
      store.clearMatch(user.id);
      onComplete();
    }
  }, [showHighFive, countdown, user.id, onComplete]);

  const handleSubmit = () => {
    if (newTraits.some(t => t.trim() === '')) return;

    store.addConnection({
      id: `conn-${Date.now()}`,
      userIds: [user.id, partner.id],
      commonTraits: [...preCommon, ...newTraits]
    });

    if ('vibrate' in navigator) {
      navigator.vibrate([200, 100, 200]);
    }
    setShowHighFive(true);
  };

  if (showHighFive) {
    return (
      <div className="fixed inset-0 z-[110] bg-gradient-to-br from-orange-400 to-rose-400 flex flex-col items-center justify-center p-10 text-white animate-in zoom-in duration-500">
        <div className="animate-bounce">
            <i className="fa-solid fa-hands-clapping text-[10rem] mb-12 drop-shadow-2xl"></i>
        </div>
        <h2 className="text-5xl font-black mb-4 text-center">연결 완료!</h2>
        <p className="text-2xl font-bold mb-16 text-center text-white/90">신나게 하이파이브!</p>
        
        <div className="text-center space-y-6 bg-white/20 p-10 rounded-[3rem] backdrop-blur-xl border border-white/30 shadow-2xl">
            <p className="text-lg font-bold">서로의 공통점을 찾았습니다.<br/>잠시 후 다음 여정을 시작합니다.</p>
            <div className="text-8xl font-black tabular-nums scale-110">{countdown}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col space-y-10 animate-in slide-in-from-bottom duration-700">
      <div className="flex justify-between items-center bg-glass p-8 rounded-[3rem] shadow-xl relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-orange-100/30 to-rose-100/30"></div>
        <div className="text-center flex-1 relative z-10">
          <p className="text-[10px] text-stone-400 mb-2 uppercase font-black tracking-widest">나</p>
          <p className="text-xl font-black text-stone-800">{user.name}</p>
        </div>
        <div className="px-6 relative z-10">
            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-lg">
              <i className="fa-solid fa-link text-orange-500 text-2xl animate-pulse"></i>
            </div>
        </div>
        <div className="text-center flex-1 relative z-10">
          <p className="text-[10px] text-stone-400 mb-2 uppercase font-black tracking-widest">파트너</p>
          <p className="text-xl font-black text-rose-500">{partner.name}</p>
        </div>
      </div>

      <div className="space-y-6">
        <h3 className="text-center text-xs font-black text-stone-400 uppercase tracking-widest">자동 발견 공통점</h3>
        <div className="flex flex-wrap justify-center gap-2">
          {preCommon.length > 0 ? (
            preCommon.map((t, idx) => (
              <span key={idx} className="px-5 py-2 bg-orange-100 rounded-full text-orange-600 font-black text-xs shadow-sm border border-orange-50">
                #{t}
              </span>
            ))
          ) : (
            <div className="text-center py-4 bg-white/40 rounded-[2rem] px-10 border border-white">
                <p className="text-stone-400 italic text-sm">함께 이야기 나누며 공통점을 발굴해보세요!</p>
            </div>
          )}
        </div>
      </div>

      <div className="space-y-6 flex-1">
        <div className="text-center space-y-2">
            <h3 className="text-sm font-black text-orange-600 uppercase tracking-widest">새로운 연결 고리 찾기</h3>
            <p className="text-xs text-stone-400 font-bold">대화를 통해 3가지 공통점을 더 기록해볼까요?</p>
        </div>
        <div className="space-y-4">
          {newTraits.map((trait, idx) => (
            <div key={idx} className="relative">
              <span className="absolute left-6 top-1/2 -translate-y-1/2 text-orange-300 font-black text-xs">{idx + 1}</span>
              <input
                type="text"
                value={trait}
                onChange={(e) => {
                  const next = [...newTraits];
                  next[idx] = e.target.value;
                  setNewTraits(next);
                }}
                placeholder="공통점 발견..."
                className="w-full bg-white border border-stone-100 rounded-[1.5rem] py-5 pl-12 pr-6 focus:border-orange-400 focus:outline-none transition-all text-sm font-bold shadow-sm"
              />
            </div>
          ))}
        </div>
      </div>

      <div className="pb-10">
        <button
          onClick={handleSubmit}
          disabled={newTraits.some(t => t.trim() === '')}
          className="w-full py-6 bg-gradient-to-r from-orange-500 to-rose-500 rounded-[2rem] font-black text-lg text-white shadow-xl shadow-orange-200 active:scale-95 disabled:opacity-30 disabled:grayscale transition-all"
        >
          우리만의 고리 완성
        </button>
      </div>
    </div>
  );
};

export default MatchingSession;
