
import React, { useEffect, useState } from 'react';
import { Room, User } from '../types';
import { store } from '../services/store';
import ConnectionMap from './ConnectionMap';

interface Props {
  room: Room;
  onGoBack: () => void;
}

const AdminDashboard: React.FC<Props> = ({ room, onGoBack }) => {
  const [participantCount, setParticipantCount] = useState(0);
  const [readyCount, setReadyCount] = useState(0);
  const [showUserList, setShowUserList] = useState(false);

  // room.users가 undefined일 수 있으므로 안전하게 접근
  const users = room.users || {};
  const connections = room.connections || [];

  useEffect(() => {
    const userList = Object.values(users);
    setParticipantCount(userList.length);
    // 특징 10개를 모두 입력한 사용자 수
    setReadyCount(userList.filter((u: User) => u.traits?.length === 10).length);
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

        <div className="flex items-center space-x-8">
          <div className="text-right cursor-pointer group" onClick={() => setShowUserList(!showUserList)}>
            <p className="text-[10px] text-stone-400 font-bold uppercase">참여 인원</p>
            <p className="text-xl font-black text-rose-500 group-hover:scale-110 transition-transform">{participantCount}명</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] text-stone-400 font-bold uppercase">준비 완료</p>
            <p className="text-xl font-black text-emerald-500">{readyCount}명</p>
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
                const traitsCount = u.traits?.length || 0;
                const isReady = traitsCount === 10;
                return (
                  <div key={u.id} className="bg-white p-4 rounded-2xl shadow-sm border border-stone-50 flex justify-between items-center group hover:border-orange-200 transition-all">
                    <div>
                      <p className={`font-bold ${u.currentMatchId ? 'text-rose-500' : isReady ? 'text-emerald-600' : 'text-stone-400'}`}>{u.name}</p>
                      <p className="text-[10px] text-stone-400 uppercase font-bold">{u.department}</p>
                      <div className="flex items-center space-x-1 mt-1">
                        <span className={`w-1.5 h-1.5 rounded-full ${u.currentMatchId ? 'bg-rose-500 animate-pulse' : isReady ? 'bg-emerald-400' : 'bg-gray-300'}`}></span>
                        <span className="text-[10px] text-stone-400 font-medium">
                          {u.currentMatchId ? '대화 중' : isReady ? '준비 완료' : `특징 ${traitsCount}/10`}
                        </span>
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

        <div className="absolute bottom-10 right-10 z-10 flex flex-col space-y-3">
            <div className="bg-white/80 px-4 py-3 rounded-2xl border border-white shadow-sm">
              <p className="text-[10px] text-stone-400 font-bold uppercase mb-2">참가자 상태</p>
              <div className="flex flex-col space-y-2">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
                  <span className="text-xs font-medium text-stone-600">특징 입력 중</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-emerald-500 rounded-full"></div>
                  <span className="text-xs font-medium text-stone-600">특징 완료 (매칭 대기)</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-rose-500 rounded-full animate-pulse"></div>
                  <span className="text-xs font-medium text-stone-600">대화 중</span>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-3 bg-white/60 px-4 py-2 rounded-full border border-white">
                <div className="w-2 h-2 bg-emerald-400 rounded-full animate-ping"></div>
                <span className="text-xs font-bold text-stone-500">실시간 데이터 시각화</span>
            </div>
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;
