
import React, { useState, useEffect, useRef } from 'react';
import { User, Room } from '../types';
import { store } from '../services/store';
import TraitsForm from './TraitsForm';
import MatchingSession from './MatchingSession';
import UserHistory from './UserHistory';
import ConnectionMap from './ConnectionMap';

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
  const [remainingTime, setRemainingTime] = useState<number | null>(null);
  const [selectedUserTraits, setSelectedUserTraits] = useState<User | null>(null);
  const prevMatchId = useRef<string | undefined>(undefined);
  const isFirstRender = useRef(true);

  // room.users가 undefined일 수 있으므로 안전하게 접근
  const users = room.users || {};
  const usersList = Object.values(users);

  // 타이머 카운트다운
  useEffect(() => {
    if (!room.timerEndAt || room.status !== 'running') {
      setRemainingTime(null);
      return;
    }

    const updateTimer = () => {
      const now = Date.now();
      const remaining = Math.max(0, Math.floor((room.timerEndAt! - now) / 1000));
      setRemainingTime(remaining);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [room.timerEndAt, room.status]);

  // 시간 포맷팅
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    const updatedUser = users[user.id];
    if (updatedUser) {
      setCurrentUser(updatedUser);
      isFirstRender.current = false;
      if (updatedUser.traits.length === 10 && !hasInitialized) {
        setHasInitialized(true);
      }

      // 2인 또는 3인 매칭 감지
      const currentMatchKey = updatedUser.currentMatchIds?.length
        ? updatedUser.currentMatchIds.sort().join('-')
        : updatedUser.currentMatchId || '';

      if (currentMatchKey && currentMatchKey !== prevMatchId.current) {
        setShowMatchSplash(true);
        if ('vibrate' in navigator) {
          navigator.vibrate([100, 50, 100]);
        }
        setTimeout(() => setShowMatchSplash(false), 2500);
      }
      prevMatchId.current = currentMatchKey;
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

  // 현재 매칭된 파트너들 가져오기
  const getPartners = (): User[] => {
    if (currentUser.currentMatchIds?.length) {
      // 3인 매칭
      return currentUser.currentMatchIds
        .map(id => room.users[id])
        .filter(Boolean);
    } else if (currentUser.currentMatchId && room.users[currentUser.currentMatchId]) {
      // 2인 매칭
      return [room.users[currentUser.currentMatchId]];
    }
    return [];
  };

  const isMatched = currentUser.currentMatchId || currentUser.currentMatchIds?.length;
  const partners = getPartners();

  // 내 순위 계산
  const getMyRank = () => {
    const sortedUsers = [...usersList].sort((a, b) => (b.score || 0) - (a.score || 0));
    return sortedUsers.findIndex(u => u.id === currentUser.id) + 1;
  };

  const renderContent = () => {
    if (!hasInitialized) {
      return <TraitsForm onSubmit={handleTraitsSubmit} />;
    }

    // 종료된 경우 - 연결맵과 결과 표시
    if (room.status === 'completed') {
      const myRank = getMyRank();
      const myConnections = room.connections.filter(c => c.userIds.includes(currentUser.id));

      return (
        <div className="flex-1 flex flex-col animate-in fade-in duration-500 -mx-6 -mt-4">
          {/* 결과 헤더 */}
          <div className="bg-gradient-to-r from-orange-400 to-rose-400 p-6 text-white">
            <h2 className="text-2xl font-black mb-2">연결고리 완료!</h2>
            <div className="flex items-center gap-4 text-white/90">
              <span className="bg-white/20 px-3 py-1 rounded-full text-sm font-bold">
                <i className="fa-solid fa-trophy mr-1"></i>
                {myRank}위
              </span>
              <span className="bg-white/20 px-3 py-1 rounded-full text-sm font-bold">
                <i className="fa-solid fa-star mr-1"></i>
                {currentUser.score || 0}점
              </span>
              <span className="bg-white/20 px-3 py-1 rounded-full text-sm font-bold">
                <i className="fa-solid fa-link mr-1"></i>
                {myConnections.length}회 연결
              </span>
            </div>
          </div>

          {/* 연결맵 */}
          <div className="flex-1 relative bg-gradient-to-b from-orange-50 to-rose-50">
            <ConnectionMap users={usersList} connections={room.connections} />

            {/* 사용자 클릭 안내 */}
            <div className="absolute bottom-4 left-4 right-4 bg-white/80 backdrop-blur-sm rounded-2xl p-4 text-center">
              <p className="text-sm text-stone-600 font-medium">
                <i className="fa-solid fa-hand-pointer mr-2 text-orange-400"></i>
                아래에서 이름을 터치하면 특징을 볼 수 있어요
              </p>
            </div>
          </div>

          {/* 참가자 리스트 (스크롤) */}
          <div className="bg-white p-4 border-t border-stone-100">
            <p className="text-xs text-stone-400 font-bold uppercase tracking-widest mb-3">참가자 ({usersList.length}명)</p>
            <div className="flex gap-2 overflow-x-auto pb-2">
              {[...usersList].sort((a, b) => (b.score || 0) - (a.score || 0)).map((u, idx) => (
                <button
                  key={u.id}
                  onClick={() => setSelectedUserTraits(u)}
                  className={`flex-shrink-0 flex items-center gap-2 px-3 py-2 rounded-xl border transition-all ${
                    u.id === currentUser.id
                      ? 'bg-orange-50 border-orange-200'
                      : 'bg-stone-50 border-stone-100 hover:bg-orange-50'
                  }`}
                >
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                    idx < 3 ? 'bg-amber-400 text-white' : 'bg-stone-200 text-stone-600'
                  }`}>
                    {idx + 1}
                  </span>
                  <span className="font-bold text-sm text-stone-700">{u.name}</span>
                  <span className="text-xs text-emerald-600 font-bold">{u.score || 0}점</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      );
    }

    if (isMatched && partners.length > 0 && room.status === 'running') {
      return (
        <MatchingSession
          user={currentUser}
          partners={partners}
          onComplete={() => {}}
        />
      );
    }

    // 진행 중이지만 매칭되지 않은 경우 - 대기 메시지
    if (room.status === 'running' && !isMatched) {
      return (
        <div className="flex-1 flex flex-col items-center justify-center space-y-10 animate-in fade-in zoom-in duration-500 pb-20">
          <div className="relative">
            <div className="w-56 h-56 bg-emerald-50 rounded-full flex items-center justify-center border-4 border-emerald-100 shadow-xl shadow-emerald-100">
              <div className="w-48 h-48 border-[6px] border-emerald-400 border-t-transparent rounded-full animate-spin"></div>
            </div>
            <div className="w-24 h-24 bg-white rounded-full absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 shadow-lg flex items-center justify-center">
              <i className="fa-solid fa-hourglass-half text-4xl text-emerald-500 animate-pulse"></i>
            </div>
          </div>

          <div className="text-center space-y-3">
            <h2 className="text-3xl font-black text-stone-800">잠시만<br/>기다려주세요</h2>
            <p className="text-stone-500 font-medium">다른 동료들이 대화를 마치면<br/>바로 새로운 매칭이 시작됩니다!</p>
          </div>

          {/* 현재 상태 표시 */}
          <div className="bg-glass p-6 rounded-[2rem] w-full shadow-lg">
            <div className="flex justify-between items-center mb-4">
              <span className="text-xs text-emerald-600 font-black uppercase tracking-widest">현재 진행 상황</span>
              {remainingTime !== null && (
                <span className={`px-3 py-1 rounded-full text-sm font-bold ${
                  remainingTime < 60 ? 'bg-red-100 text-red-600 animate-pulse' : 'bg-emerald-100 text-emerald-600'
                }`}>
                  <i className="fa-solid fa-clock mr-1"></i>
                  {formatTime(remainingTime)}
                </span>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4 text-center">
              <div className="bg-white/60 rounded-xl p-3">
                <p className="text-2xl font-black text-stone-800">{currentUser.metUserIds.length}</p>
                <p className="text-xs text-stone-400 font-bold">만난 동료</p>
              </div>
              <div className="bg-white/60 rounded-xl p-3">
                <p className="text-2xl font-black text-emerald-600">{currentUser.score || 0}</p>
                <p className="text-xs text-stone-400 font-bold">내 점수</p>
              </div>
            </div>
          </div>
        </div>
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
      {/* User Traits Modal */}
      {selectedUserTraits && (
        <div
          className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm flex items-center justify-center p-6 animate-in fade-in duration-200"
          onClick={() => setSelectedUserTraits(null)}
        >
          <div
            className="bg-white rounded-[2rem] p-8 max-w-md w-full shadow-2xl animate-in zoom-in duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 bg-gradient-to-br from-orange-400 to-rose-400 rounded-2xl flex items-center justify-center text-2xl font-black text-white shadow-lg">
                {selectedUserTraits.name[0]}
              </div>
              <div>
                <h3 className="text-xl font-black text-stone-800">{selectedUserTraits.name}</h3>
                <p className="text-sm text-orange-500 font-bold">{selectedUserTraits.department}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-emerald-600 font-bold">{selectedUserTraits.score || 0}점</span>
                  <span className="text-xs text-stone-400">|</span>
                  <span className="text-xs text-stone-500 font-medium">{selectedUserTraits.metUserIds?.length || 0}명 연결</span>
                </div>
              </div>
            </div>

            <div className="mb-6">
              <p className="text-xs text-stone-400 font-bold uppercase tracking-widest mb-3">
                {selectedUserTraits.id === currentUser.id ? '나의 10가지 특징' : `${selectedUserTraits.name}님의 10가지 특징`}
              </p>
              <div className="flex flex-wrap gap-2">
                {selectedUserTraits.traits.map((t, idx) => (
                  <span
                    key={idx}
                    className="px-4 py-2 bg-orange-50 text-orange-600 rounded-xl text-sm font-bold"
                  >
                    #{t}
                  </span>
                ))}
              </div>
            </div>

            <button
              onClick={() => setSelectedUserTraits(null)}
              className="w-full py-3 bg-stone-100 text-stone-600 rounded-xl font-bold hover:bg-stone-200 transition-colors"
            >
              닫기
            </button>
          </div>
        </div>
      )}

      {/* Match Splash */}
      {showMatchSplash && partners.length > 0 && (
        <div className={`fixed inset-0 z-[100] ${partners.length === 2 ? 'bg-violet-50/90' : 'bg-white/90'} backdrop-blur-3xl flex flex-col items-center justify-center p-10 animate-in fade-in duration-300`}>
          <div className="relative mb-10">
            <div className={`absolute inset-0 ${partners.length === 2 ? 'bg-violet-400/20' : 'bg-orange-400/20'} blur-3xl animate-pulse`}></div>
            <div className={`relative w-40 h-40 ${partners.length === 2 ? 'bg-gradient-to-tr from-violet-400 to-purple-400' : 'bg-gradient-to-tr from-orange-400 to-rose-400'} rounded-[3rem] flex items-center justify-center shadow-2xl ${partners.length === 2 ? 'shadow-violet-200' : 'shadow-orange-200'} animate-in zoom-in duration-500`}>
              <i className={`fa-solid ${partners.length === 2 ? 'fa-users' : 'fa-sparkles'} text-6xl text-white`}></i>
            </div>
          </div>
          <h2 className="text-4xl font-black text-center mb-4 text-stone-800 animate-in slide-in-from-bottom duration-700">
            {partners.length === 2 ? (
              <>두근두근,<br/><span className="text-violet-500">트리플 연결!</span></>
            ) : (
              <>두근두근,<br/><span className="warm-text">연결되었습니다!</span></>
            )}
          </h2>
          <div className="text-center mt-8 animate-in slide-in-from-bottom duration-700 delay-300">
            <p className="text-stone-400 font-bold text-sm mb-2 uppercase tracking-widest">
              {partners.length === 2 ? 'Match with (3인 그룹)' : 'Match with'}
            </p>
            <div className="space-y-2">
              {partners.map((partner, idx) => (
                <p key={partner.id} className={`text-2xl font-black ${partners.length === 2 ? 'text-violet-600' : 'text-stone-800'}`}>
                  {partner.name} <span className="text-lg font-medium text-stone-400">님</span>
                </p>
              ))}
            </div>
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
        <div className="flex items-center gap-2">
          {/* 진행 중일 때 타이머 표시 */}
          {room.status === 'running' && remainingTime !== null && (
            <div className={`px-4 py-2 rounded-2xl flex items-center gap-2 font-bold text-sm ${
              remainingTime < 60
                ? 'bg-red-100 text-red-600 animate-pulse'
                : 'bg-emerald-100 text-emerald-600'
            }`}>
              <i className="fa-solid fa-clock"></i>
              <span>{formatTime(remainingTime)}</span>
            </div>
          )}
          <button onClick={onGoBack} className="w-10 h-10 bg-white/60 rounded-full flex items-center justify-center text-stone-400 border border-white">
            <i className="fa-solid fa-power-off text-sm"></i>
          </button>
        </div>
      </div>

      <div className="flex-1 flex flex-col z-10">
        {renderContent()}
      </div>

      {/* Navigation */}
      {hasInitialized && !isMatched && (
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
