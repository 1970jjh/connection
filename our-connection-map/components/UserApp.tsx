
import React, { useState, useEffect, useRef } from 'react';
import { User, Room } from '../types';
import { store } from '../services/store';
import TraitsForm from './TraitsForm';
import MatchingSession from './MatchingSession';
import UserHistory from './UserHistory';

interface Props {
  user: User;
  room: Room;
  onGoBack: () => void;
}

type UserTab = 'connect' | 'history' | 'profile';

const UserApp: React.FC<Props> = ({ user, room, onGoBack }) => {
  const [activeTab, setActiveTab] = useState<UserTab>('connect');
  const [currentUser, setCurrentUser] = useState<User>(user);
  const [hasInitialized, setHasInitialized] = useState(user.traits.length === 10);
  const [showMatchSplash, setShowMatchSplash] = useState(false);
  const prevMatchId = useRef<string | undefined>(undefined);
  const isFirstRender = useRef(true);

  // room.users가 undefined일 수 있으므로 안전하게 접근
  const users = room.users || {};

  useEffect(() => {
    const updatedUser = users[user.id];
    if (updatedUser) {
      setCurrentUser(updatedUser);
      isFirstRender.current = false;
      if (updatedUser.traits.length === 10 && !hasInitialized) {
        setHasInitialized(true);
      }

      if (updatedUser.currentMatchId && updatedUser.currentMatchId !== prevMatchId.current) {
        setShowMatchSplash(true);
        if ('vibrate' in navigator) {
          navigator.vibrate([100, 50, 100]);
        }
        setTimeout(() => setShowMatchSplash(false), 2500);
      }
      prevMatchId.current = updatedUser.currentMatchId;
    } else if (!isFirstRender.current) {
      // 첫 렌더링이 아닐 때만 (이미 있던 사용자가 삭제된 경우)
      onGoBack();
    }
  }, [users, user.id, hasInitialized, onGoBack]);

  const handleTraitsSubmit = (traits: string[]) => {
    store.updateUser({ id: user.id, traits });
    setHasInitialized(true);
    setActiveTab('connect');
  };

  const renderContent = () => {
    if (!hasInitialized) {
      return <TraitsForm onSubmit={handleTraitsSubmit} />;
    }

    if (currentUser.currentMatchId && room.status === 'running') {
      return (
        <MatchingSession 
          user={currentUser} 
          partner={room.users[currentUser.currentMatchId!]} 
          onComplete={() => {}}
        />
      );
    }

    switch (activeTab) {
      case 'history':
        return <UserHistory user={currentUser} room={room} />;
      case 'profile':
        return <TraitsForm initialTraits={currentUser.traits} onSubmit={handleTraitsSubmit} isEdit />;
      case 'connect':
      default:
        return (
          <div className="flex-1 flex flex-col items-center justify-center space-y-10 animate-in fade-in zoom-in duration-500 pb-20">
            <div className="relative">
                <div className="w-56 h-56 bg-white/40 rounded-full flex items-center justify-center border-4 border-white/60 shadow-xl shadow-orange-100">
                    <div className="w-48 h-48 border-[6px] border-orange-400 border-t-transparent rounded-full animate-spin"></div>
                </div>
                <div className="w-24 h-24 bg-white rounded-full absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 shadow-lg flex items-center justify-center">
                  <i className="fa-solid fa-heart text-4xl text-rose-500 animate-pulse"></i>
                </div>
            </div>
            
            <div className="text-center space-y-3">
                <h2 className="text-3xl font-black text-stone-800">새로운 인연을<br/>기다리고 있어요</h2>
                <p className="text-stone-500 font-medium">강사님이 "연결고리"를 시작하면<br/>자동으로 동료가 매칭됩니다.</p>
            </div>

            <div className="bg-glass p-8 rounded-[2.5rem] w-full shadow-lg border-white">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xs text-orange-600 font-black uppercase tracking-widest">My Discovery</h3>
                    <span className="bg-orange-100 text-orange-600 px-3 py-1 rounded-full font-black text-[10px]">{currentUser.metUserIds.length}명 연결됨</span>
                </div>
                <div className="flex flex-wrap gap-2">
                    {currentUser.traits.map((t, idx) => (
                        <span key={idx} className="px-4 py-2 bg-white/80 rounded-2xl text-[11px] font-bold text-stone-600 shadow-sm border border-stone-50">#{t}</span>
                    ))}
                </div>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen flex flex-col p-6 relative overflow-hidden">
      {/* Match Splash */}
      {showMatchSplash && currentUser.currentMatchId && room.users[currentUser.currentMatchId] && (
        <div className="fixed inset-0 z-[100] bg-white/90 backdrop-blur-3xl flex flex-col items-center justify-center p-10 animate-in fade-in duration-300">
          <div className="relative mb-10">
            <div className="absolute inset-0 bg-orange-400/20 blur-3xl animate-pulse"></div>
            <div className="relative w-40 h-40 bg-gradient-to-tr from-orange-400 to-rose-400 rounded-[3rem] flex items-center justify-center shadow-2xl shadow-orange-200 animate-in zoom-in duration-500">
              <i className="fa-solid fa-sparkles text-6xl text-white"></i>
            </div>
          </div>
          <h2 className="text-4xl font-black text-center mb-4 text-stone-800 animate-in slide-in-from-bottom duration-700">
            두근두근,<br/><span className="warm-text">연결되었습니다!</span>
          </h2>
          <div className="text-center mt-8 animate-in slide-in-from-bottom duration-700 delay-300">
            <p className="text-stone-400 font-bold text-sm mb-2 uppercase tracking-widest">Match with</p>
            <p className="text-3xl font-black text-stone-800">
              {room.users[currentUser.currentMatchId].name} <span className="text-xl font-medium text-stone-400">님</span>
            </p>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex justify-between items-center mb-8 z-10">
        <div className="flex items-center space-x-3 bg-glass px-4 py-2 rounded-2xl">
            <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-rose-400 rounded-2xl flex items-center justify-center text-sm font-black text-white shadow-md">
                {currentUser.name[0]}
            </div>
            <div>
                <p className="text-sm font-black text-stone-800 leading-tight">{currentUser.name}</p>
                <p className="text-[10px] text-orange-500 font-black uppercase tracking-tighter">{currentUser.department}</p>
            </div>
        </div>
        <button onClick={onGoBack} className="w-10 h-10 bg-white/60 rounded-full flex items-center justify-center text-stone-400 border border-white">
          <i className="fa-solid fa-power-off text-sm"></i>
        </button>
      </div>

      <div className="flex-1 flex flex-col z-10">
        {renderContent()}
      </div>

      {/* Navigation */}
      {hasInitialized && !currentUser.currentMatchId && (
        <nav className="fixed bottom-6 left-6 right-6 h-20 bg-glass-dark rounded-[2rem] flex items-center justify-around px-4 z-50 shadow-2xl border-white">
          <button 
            onClick={() => setActiveTab('connect')}
            className={`flex flex-col items-center space-y-1 transition-all flex-1 ${activeTab === 'connect' ? 'text-orange-500' : 'text-stone-300'}`}
          >
            <i className={`fa-solid fa-link text-xl ${activeTab === 'connect' ? 'scale-110' : ''}`}></i>
            <span className="text-[10px] font-black uppercase">연결</span>
          </button>
          <button 
            onClick={() => setActiveTab('history')}
            className={`flex flex-col items-center space-y-1 transition-all flex-1 ${activeTab === 'history' ? 'text-rose-500' : 'text-stone-300'}`}
          >
            <i className="fa-solid fa-compass text-xl"></i>
            <span className="text-[10px] font-black uppercase">기록</span>
          </button>
          <button 
            onClick={() => setActiveTab('profile')}
            className={`flex flex-col items-center space-y-1 transition-all flex-1 ${activeTab === 'profile' ? 'text-amber-600' : 'text-stone-300'}`}
          >
            <i className="fa-solid fa-user-gear text-xl"></i>
            <span className="text-[10px] font-black uppercase">프로필</span>
          </button>
        </nav>
      )}
    </div>
  );
};

export default UserApp;
