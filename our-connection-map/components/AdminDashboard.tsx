
import React, { useEffect, useState, useMemo } from 'react';
import { Room, User } from '../types';
import { store } from '../services/store';
import ConnectionMap from './ConnectionMap';

interface Props {
  room: Room;
  onGoBack: () => void;
}

const AdminDashboard: React.FC<Props> = ({ room, onGoBack }) => {
  const [participantCount, setParticipantCount] = useState(0);
  const [showUserList, setShowUserList] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);

  // room.users가 undefined일 수 있으므로 안전하게 접근
  const users = room.users || {};
  const connections = room.connections || [];

  // 점수 기준 정렬된 사용자 순위
  const rankedUsers = useMemo(() => {
    return Object.values(users)
      .map(u => ({ ...u, score: u.score || 0 }))
      .sort((a, b) => b.score - a.score);
  }, [users]);

  // 총 연결 수
  const totalConnections = connections.length;

  // 현재 매칭 중인 그룹 수
  const activeMatchCount = useMemo(() => {
    const processedIds = new Set<string>();
    let count = 0;
    Object.values(users).forEach(u => {
      if (processedIds.has(u.id)) return;
      if (u.currentMatchId) {
        processedIds.add(u.id);
        processedIds.add(u.currentMatchId);
        count++;
      } else if (u.currentMatchIds?.length) {
        processedIds.add(u.id);
        u.currentMatchIds.forEach(id => processedIds.add(id));
        count++;
      }
    });
    return count;
  }, [users]);

  useEffect(() => {
    setParticipantCount(Object.keys(users).length);
  }, [users]);

  const handleStart = () => {
    store.updateRoomStatus('running');
    store.matchUsers();
  };

  const handleReset = () => {
    if (confirm("정말로 모든 데이터를 초기화하시겠습니까?")) {
      store.createRoom(room.name);
    }
  };

  const handleRemoveUser = (userId: string, name: string) => {
    if (confirm(`'${name}' 님을 내보내시겠습니까?`)) {
      store.removeUser(userId);
    }
  };

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <header className="p-6 bg-glass flex justify-between items-center z-30 shadow-sm">
        <div className="flex items-center space-x-6">
          <button onClick={onGoBack} className="w-10 h-10 bg-white rounded-full shadow-sm text-stone-400 hover:text-orange-500 transition-colors flex items-center justify-center">
            <i className="fa-solid fa-arrow-left"></i>
          </button>
          <div>
            <h1 className="text-2xl font-black text-stone-800">{room.name}</h1>
            <p className="text-[10px] text-orange-500 uppercase tracking-widest font-extrabold">Connection Map Dashboard</p>
          </div>
        </div>

        <div className="flex items-center space-x-6">
          <div className="text-right cursor-pointer group" onClick={() => setShowUserList(!showUserList)}>
            <p className="text-[10px] text-stone-400 font-bold uppercase">참여 인원</p>
            <p className="text-xl font-black text-rose-500 group-hover:scale-110 transition-transform">{participantCount}명</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] text-stone-400 font-bold uppercase">연결 수</p>
            <p className="text-xl font-black text-orange-500">{totalConnections}</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] text-stone-400 font-bold uppercase">대화 중</p>
            <p className="text-xl font-black text-violet-500">{activeMatchCount}팀</p>
          </div>
          <div className="text-right cursor-pointer group" onClick={() => setShowLeaderboard(!showLeaderboard)}>
            <p className="text-[10px] text-stone-400 font-bold uppercase">순위표</p>
            <p className="text-xl font-black text-emerald-500 group-hover:scale-110 transition-transform">
              <i className="fa-solid fa-trophy"></i>
            </p>
          </div>
          <div className="text-right">
            <p className="text-[10px] text-stone-400 font-bold uppercase">현재 상태</p>
            <p className="text-xl font-black text-stone-800">
              {room.status === 'waiting' ? '대기 중' : room.status === 'running' ? '진행 중' : '종료'}
            </p>
          </div>
          <div className="flex space-x-3">
            {room.status === 'waiting' ? (
              <button 
                onClick={handleStart}
                className="bg-gradient-to-r from-orange-400 to-rose-400 px-6 py-3 rounded-2xl font-bold text-white hover:shadow-lg hover:shadow-orange-200 transition-all"
              >
                연결고리 시작
              </button>
            ) : (
              <button 
                onClick={() => store.updateRoomStatus('completed')}
                className="bg-stone-800 px-6 py-3 rounded-2xl font-bold text-white hover:bg-stone-700 transition-all"
              >
                전체 종료
              </button>
            )}
            <button 
              onClick={handleReset}
              className="bg-white px-4 py-3 rounded-2xl text-sm font-bold text-stone-400 hover:text-rose-500 border border-stone-100 transition-all"
            >
              초기화
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 relative overflow-hidden">
        <ConnectionMap users={Object.values(users)} connections={connections} />

        {/* Floating Message */}
        <div className="absolute top-10 left-10 z-10 p-8 bg-glass rounded-[2rem] max-w-sm pointer-events-none shadow-xl border-white/60">
          <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center mb-4">
            <i className="fa-solid fa-quote-left text-orange-500 text-xs"></i>
          </div>
          <p className="text-lg font-medium leading-relaxed italic text-stone-700">
            "우리는 서로 다른 곳에서 왔지만, 보이지 않는 수많은 끈으로 이미 연결되어 있습니다."
          </p>
        </div>

        {/* User List Sidebar */}
        {showUserList && (
          <div className="absolute top-4 right-4 bottom-4 w-80 bg-glass-dark rounded-3xl z-40 p-6 overflow-y-auto shadow-2xl animate-in slide-in-from-right duration-300">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-xl font-black text-stone-800">참가자 목록</h2>
              <button onClick={() => setShowUserList(false)} className="w-8 h-8 rounded-full hover:bg-stone-100 transition-colors">
                <i className="fa-solid fa-xmark text-stone-400"></i>
              </button>
            </div>
            <div className="space-y-3">
              {Object.values(users).map((u: User) => {
                const isMatched = u.currentMatchId || u.currentMatchIds?.length;
                const isTriple = u.currentMatchIds?.length === 2;
                return (
                  <div key={u.id} className="bg-white p-4 rounded-2xl shadow-sm border border-stone-50 flex justify-between items-center group hover:border-orange-200 transition-all">
                    <div>
                      <p className="font-bold text-stone-800">{u.name}</p>
                      <p className="text-[10px] text-stone-400 uppercase font-bold">{u.department}</p>
                      <div className="flex items-center space-x-2 mt-1">
                        <span className={`w-1.5 h-1.5 rounded-full ${isTriple ? 'bg-violet-500' : isMatched ? 'bg-orange-500' : 'bg-emerald-400'}`}></span>
                        <span className="text-[10px] text-stone-400 font-medium">
                          {isTriple ? '3인 대화 중' : isMatched ? '대화 중' : '대기 중'}
                        </span>
                        <span className="text-[10px] text-emerald-500 font-bold">{u.score || 0}점</span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleRemoveUser(u.id, u.name)}
                      className="opacity-0 group-hover:opacity-100 text-stone-300 hover:text-rose-500 transition-all"
                    >
                      <i className="fa-solid fa-user-minus"></i>
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Leaderboard Sidebar */}
        {showLeaderboard && (
          <div className="absolute top-4 left-4 bottom-4 w-80 bg-glass-dark rounded-3xl z-40 p-6 overflow-y-auto shadow-2xl animate-in slide-in-from-left duration-300">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-xl font-black text-stone-800">
                <i className="fa-solid fa-trophy text-amber-500 mr-2"></i>
                실시간 순위
              </h2>
              <button onClick={() => setShowLeaderboard(false)} className="w-8 h-8 rounded-full hover:bg-stone-100 transition-colors">
                <i className="fa-solid fa-xmark text-stone-400"></i>
              </button>
            </div>

            {/* Top 3 Podium */}
            {rankedUsers.length >= 3 && (
              <div className="flex justify-center items-end space-x-2 mb-8">
                {/* 2nd Place */}
                <div className="text-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-slate-300 to-slate-400 rounded-full flex items-center justify-center mb-2 mx-auto shadow-lg">
                    <span className="text-2xl font-black text-white">{rankedUsers[1]?.name?.[0]}</span>
                  </div>
                  <div className="bg-slate-200 rounded-t-xl px-3 py-4 h-16">
                    <p className="text-xs font-bold text-slate-600 truncate w-14">{rankedUsers[1]?.name}</p>
                    <p className="text-sm font-black text-slate-700">{rankedUsers[1]?.score || 0}</p>
                  </div>
                </div>

                {/* 1st Place */}
                <div className="text-center -mt-4">
                  <div className="w-20 h-20 bg-gradient-to-br from-amber-400 to-yellow-500 rounded-full flex items-center justify-center mb-2 mx-auto shadow-xl ring-4 ring-amber-200">
                    <span className="text-3xl font-black text-white">{rankedUsers[0]?.name?.[0]}</span>
                  </div>
                  <div className="bg-gradient-to-br from-amber-100 to-yellow-100 rounded-t-xl px-3 py-4 h-20">
                    <i className="fa-solid fa-crown text-amber-500 text-lg mb-1"></i>
                    <p className="text-xs font-bold text-amber-700 truncate w-16">{rankedUsers[0]?.name}</p>
                    <p className="text-lg font-black text-amber-600">{rankedUsers[0]?.score || 0}</p>
                  </div>
                </div>

                {/* 3rd Place */}
                <div className="text-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-orange-300 to-orange-400 rounded-full flex items-center justify-center mb-2 mx-auto shadow-lg">
                    <span className="text-2xl font-black text-white">{rankedUsers[2]?.name?.[0]}</span>
                  </div>
                  <div className="bg-orange-100 rounded-t-xl px-3 py-4 h-12">
                    <p className="text-xs font-bold text-orange-600 truncate w-14">{rankedUsers[2]?.name}</p>
                    <p className="text-sm font-black text-orange-700">{rankedUsers[2]?.score || 0}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Full Rankings */}
            <div className="space-y-2">
              {rankedUsers.map((u, idx) => (
                <div
                  key={u.id}
                  className={`flex items-center p-3 rounded-xl transition-all ${
                    idx === 0 ? 'bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200' :
                    idx === 1 ? 'bg-gradient-to-r from-slate-50 to-gray-50 border border-slate-200' :
                    idx === 2 ? 'bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200' :
                    'bg-white border border-stone-100'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 font-black text-sm ${
                    idx === 0 ? 'bg-amber-500 text-white' :
                    idx === 1 ? 'bg-slate-400 text-white' :
                    idx === 2 ? 'bg-orange-400 text-white' :
                    'bg-stone-200 text-stone-500'
                  }`}>
                    {idx + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-stone-800 truncate">{u.name}</p>
                    <p className="text-[10px] text-stone-400">{u.department}</p>
                  </div>
                  <div className="text-right">
                    <p className={`text-lg font-black ${
                      idx === 0 ? 'text-amber-600' :
                      idx === 1 ? 'text-slate-600' :
                      idx === 2 ? 'text-orange-600' :
                      'text-stone-600'
                    }`}>{u.score}</p>
                    <p className="text-[10px] text-stone-400">{u.metUserIds?.length || 0}명 연결</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Scoring Info */}
            <div className="mt-6 p-4 bg-stone-100 rounded-2xl">
              <h3 className="text-xs font-black text-stone-500 uppercase mb-3">점수 계산법</h3>
              <div className="space-y-2 text-xs text-stone-600">
                <p><span className="font-bold text-orange-500">2인 매칭:</span> 공통점 1개당 10점</p>
                <p><span className="font-bold text-violet-500">3인 매칭:</span> 공통점 1개당 15점 (1.5배)</p>
              </div>
            </div>
          </div>
        )}

        <div className="absolute bottom-10 right-10 z-10 flex flex-col space-y-3">
            <div className="flex items-center space-x-3 bg-white/60 px-4 py-2 rounded-full border border-white">
                <div className="w-2 h-2 bg-orange-400 rounded-full animate-ping"></div>
                <span className="text-xs font-bold text-stone-500">실시간 데이터 시각화</span>
            </div>
            <div className="flex items-center space-x-3 bg-white/60 px-4 py-2 rounded-full border border-white">
                <div className="w-2 h-2 bg-rose-500 rounded-full"></div>
                <span className="text-xs font-bold text-stone-500">네트워크 맵 분석 중</span>
            </div>
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;
