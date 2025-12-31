
import React, { useState, useEffect } from 'react';
import { store } from './services/store';
import { AppState, User, Room } from './types';
import AdminDashboard from './components/AdminDashboard';
import UserApp from './components/UserApp';

const ADMIN_PASSWORD = "6749467";

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>(() => {
    const room = store.getRoom();
    return {
      activeRoom: room,
      currentUser: null,
      view: 'landing',
    };
  });

  useEffect(() => {
    const unsubscribe = store.subscribe(() => {
      const room = store.getRoom();
      setAppState(prev => ({ 
        ...prev, 
        activeRoom: room 
      }));
    });
    return unsubscribe;
  }, []);

  const handleCreateRoom = () => {
    const password = prompt("관리자 비밀번호를 입력하세요:");
    if (password === ADMIN_PASSWORD) {
      const name = prompt("개설할 과정명(방)을 입력하세요:");
      if (name) {
        const room = store.createRoom(name);
        setAppState({
          activeRoom: room,
          currentUser: null,
          view: 'admin'
        });
      }
    } else if (password !== null) {
      alert("비밀번호가 틀렸습니다.");
    }
  };

  const handleJoinRoom = (roomName: string, name: string, dept: string) => {
    const room = store.getRoom();
    if (room && (room.name.trim() === roomName.trim())) {
      const newUser: User = {
        id: `user-${Date.now()}`,
        name,
        department: dept,
        traits: [],
        isOnline: true,
        metUserIds: [],
      };
      store.addUser(newUser);
      setAppState({
        activeRoom: room,
        currentUser: newUser,
        view: 'user'
      });
    } else {
      alert(room ? `방 이름이 일치하지 않습니다. (현재 개설된 방: ${room.name})` : "개설된 방이 없습니다. 관리자에게 문의하세요.");
    }
  };

  const onJoinClick = () => {
    const room = store.getRoom();
    if (!room) {
      alert("현재 개설된 방이 없습니다. 강사님이 먼저 방을 개설해야 합니다.");
      return;
    }

    const roomName = prompt(`입장할 과정명(방)을 입력하세요:\n(현재 개설된 방: ${room.name})`);
    if (roomName) {
      const name = prompt("본인의 이름을 입력하세요:");
      if (!name) return;
      const dept = prompt("소속(회사/부서 등)을 입력하세요:");
      if (!dept) return;
      handleJoinRoom(roomName, name, dept);
    }
  };

  if (appState.view === 'admin' && appState.activeRoom) {
    return <AdminDashboard room={appState.activeRoom} onGoBack={() => setAppState(prev => ({ ...prev, view: 'landing' }))} />;
  }

  if (appState.view === 'user' && appState.currentUser && appState.activeRoom) {
    return <UserApp user={appState.currentUser} room={appState.activeRoom} onGoBack={() => setAppState(prev => ({ ...prev, view: 'landing' }))} />;
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 space-y-12">
      <div className="text-center space-y-4">
        <h1 className="text-6xl font-black warm-text italic tracking-tighter drop-shadow-sm">OUR CONNECTION</h1>
        <p className="text-orange-600/60 text-lg uppercase tracking-widest font-bold">너와 나의 연결고리</p>
      </div>

      <div className="grid md:grid-cols-2 gap-8 w-full max-w-4xl">
        {/* User Entry (Left) */}
        <div className="bg-glass p-8 rounded-[2.5rem] flex flex-col items-center space-y-6 hover:translate-y-[-4px] transition-all duration-300">
          <div className="w-20 h-20 bg-orange-100 rounded-3xl flex items-center justify-center">
            <i className="fa-solid fa-mobile-screen text-4xl text-orange-500"></i>
          </div>
          <h2 className="text-2xl font-extrabold text-stone-800">참가자 (모바일)</h2>
          <p className="text-center text-stone-500 leading-relaxed">교육생으로 입장하여<br/>동료들과 공통점을 찾고 연결됩니다.</p>
          <button 
            onClick={onJoinClick}
            className="w-full bg-gradient-to-r from-orange-400 to-rose-400 py-4 rounded-2xl font-bold text-white shadow-lg shadow-orange-200 hover:shadow-orange-300 transition-all active:scale-[0.98]"
          >
            참가하기
          </button>
        </div>

        {/* Admin Entry (Right) */}
        <div className="bg-glass p-8 rounded-[2.5rem] flex flex-col items-center space-y-6 hover:translate-y-[-4px] transition-all duration-300">
          <div className="w-20 h-20 bg-amber-100 rounded-3xl flex items-center justify-center">
            <i className="fa-solid fa-chalkboard-user text-4xl text-amber-600"></i>
          </div>
          <h2 className="text-2xl font-extrabold text-stone-800">강사 / 관리자</h2>
          <p className="text-center text-stone-500 leading-relaxed">새로운 교육 과정을 개설하고<br/>커넥션 맵을 실시간으로 확인합니다.</p>
          <button 
            onClick={handleCreateRoom}
            className="w-full bg-stone-800 py-4 rounded-2xl font-bold text-white hover:bg-stone-700 transition-all shadow-lg shadow-stone-200 active:scale-[0.98]"
          >
            과정 개설하기
          </button>
        </div>
      </div>
      
      {appState.activeRoom && (
        <div className="mt-8 text-center animate-bounce">
            <p className="text-xs text-stone-400 uppercase tracking-widest font-bold">현재 활성화된 방</p>
            <p className="text-rose-500 font-extrabold text-xl">{appState.activeRoom.name}</p>
        </div>
      )}
    </div>
  );
};

export default App;
