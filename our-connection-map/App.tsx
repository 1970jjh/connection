
import React, { useState, useEffect } from 'react';
import { store } from './services/store';
import { AppState, User, Room } from './types';
import AdminDashboard from './components/AdminDashboard';
import UserApp from './components/UserApp';

const ADMIN_PASSWORD = "6749467";

// 관리자 로그인 모달
const AdminLoginModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (roomName: string) => void;
}> = ({ isOpen, onClose, onSuccess }) => {
  const [step, setStep] = useState<'password' | 'roomName'>('password');
  const [password, setPassword] = useState('');
  const [roomName, setRoomName] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handlePasswordSubmit = () => {
    if (password === ADMIN_PASSWORD) {
      setStep('roomName');
      setError('');
    } else {
      setError('비밀번호가 틀렸습니다.');
    }
  };

  const handleRoomSubmit = () => {
    if (roomName.trim()) {
      onSuccess(roomName.trim());
      // Reset
      setStep('password');
      setPassword('');
      setRoomName('');
      setError('');
    }
  };

  const handleClose = () => {
    setStep('password');
    setPassword('');
    setRoomName('');
    setError('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={handleClose}></div>

      {/* Modal */}
      <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in duration-300">
        {/* Header */}
        <div className="bg-stone-800 text-white p-6 flex items-center justify-between">
          <h2 className="text-xl font-black tracking-wide">ADMIN ACCESS</h2>
          <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center">
            <i className="fa-solid fa-lock text-white/80"></i>
          </div>
        </div>

        {/* Content */}
        <div className="p-8">
          {step === 'password' ? (
            <div className="space-y-6">
              <div>
                <label className="block text-xs font-black text-stone-400 uppercase tracking-widest mb-3">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); setError(''); }}
                    onKeyDown={(e) => e.key === 'Enter' && handlePasswordSubmit()}
                    placeholder="비밀번호 입력"
                    className="w-full bg-stone-50 border-2 border-stone-200 rounded-2xl py-4 px-5 pr-12 text-lg font-bold focus:border-orange-400 focus:outline-none transition-all"
                    autoFocus
                  />
                  <button
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
                  >
                    <i className={`fa-solid ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                  </button>
                </div>
                {error && (
                  <p className="mt-3 text-rose-500 text-sm font-bold flex items-center gap-2">
                    <i className="fa-solid fa-circle-exclamation"></i>
                    {error}
                  </p>
                )}
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleClose}
                  className="flex-1 py-4 rounded-2xl font-bold text-stone-400 bg-stone-100 hover:bg-stone-200 transition-all"
                >
                  <i className="fa-solid fa-arrow-left mr-2"></i>
                  취소
                </button>
                <button
                  onClick={handlePasswordSubmit}
                  className="flex-[2] py-4 rounded-2xl font-bold text-white bg-gradient-to-r from-rose-500 to-orange-500 hover:shadow-lg hover:shadow-orange-200 transition-all active:scale-[0.98]"
                >
                  로그인
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <i className="fa-solid fa-check text-3xl text-green-500"></i>
                </div>
                <p className="text-green-600 font-bold">인증 완료!</p>
              </div>

              <div>
                <label className="block text-xs font-black text-stone-400 uppercase tracking-widest mb-3">
                  과정명 (방 이름)
                </label>
                <input
                  type="text"
                  value={roomName}
                  onChange={(e) => setRoomName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleRoomSubmit()}
                  placeholder="예: 12월 리더십 과정"
                  className="w-full bg-stone-50 border-2 border-stone-200 rounded-2xl py-4 px-5 text-lg font-bold focus:border-orange-400 focus:outline-none transition-all"
                  autoFocus
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setStep('password')}
                  className="flex-1 py-4 rounded-2xl font-bold text-stone-400 bg-stone-100 hover:bg-stone-200 transition-all"
                >
                  <i className="fa-solid fa-arrow-left mr-2"></i>
                  뒤로
                </button>
                <button
                  onClick={handleRoomSubmit}
                  disabled={!roomName.trim()}
                  className="flex-[2] py-4 rounded-2xl font-bold text-white bg-gradient-to-r from-rose-500 to-orange-500 hover:shadow-lg hover:shadow-orange-200 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  과정 개설
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-stone-50 px-8 py-4 text-center">
          <p className="text-xs text-stone-400 font-bold uppercase tracking-widest">Secure Area</p>
        </div>
      </div>
    </div>
  );
};

// 참가자 입장 모달
const JoinRoomModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onJoin: (roomName: string, name: string, dept: string) => void;
  currentRoom: Room | null;
}> = ({ isOpen, onClose, onJoin, currentRoom }) => {
  const [roomName, setRoomName] = useState('');
  const [name, setName] = useState('');
  const [dept, setDept] = useState('');
  const [step, setStep] = useState(1);

  const handleSubmit = () => {
    if (roomName.trim() && name.trim() && dept.trim()) {
      onJoin(roomName.trim(), name.trim(), dept.trim());
      // Reset
      setRoomName('');
      setName('');
      setDept('');
      setStep(1);
    }
  };

  const handleClose = () => {
    setRoomName('');
    setName('');
    setDept('');
    setStep(1);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={handleClose}></div>

      <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in duration-300">
        {/* Header */}
        <div className="bg-gradient-to-r from-orange-400 to-rose-400 text-white p-6">
          <h2 className="text-xl font-black tracking-wide">참가자 입장</h2>
          <p className="text-white/80 text-sm mt-1">동료들과 연결될 준비가 되셨나요?</p>
        </div>

        {/* Progress */}
        <div className="flex px-8 pt-6">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex-1 flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                step >= s ? 'bg-orange-500 text-white' : 'bg-stone-200 text-stone-400'
              }`}>
                {step > s ? <i className="fa-solid fa-check text-xs"></i> : s}
              </div>
              {s < 3 && <div className={`flex-1 h-1 mx-2 rounded ${step > s ? 'bg-orange-500' : 'bg-stone-200'}`}></div>}
            </div>
          ))}
        </div>

        {/* Content */}
        <div className="p-8">
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <label className="block text-xs font-black text-stone-400 uppercase tracking-widest mb-3">
                  과정명 (방 이름)
                </label>
                <input
                  type="text"
                  value={roomName}
                  onChange={(e) => setRoomName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && roomName.trim() && setStep(2)}
                  placeholder="강사님이 알려주신 과정명"
                  className="w-full bg-stone-50 border-2 border-stone-200 rounded-2xl py-4 px-5 text-lg font-bold focus:border-orange-400 focus:outline-none transition-all"
                  autoFocus
                />
                {currentRoom && (
                  <p className="mt-3 text-sm text-orange-500 font-bold">
                    <i className="fa-solid fa-info-circle mr-2"></i>
                    현재 개설된 방: {currentRoom.name}
                  </p>
                )}
              </div>
              <div className="flex gap-3">
                <button onClick={handleClose} className="flex-1 py-4 rounded-2xl font-bold text-stone-400 bg-stone-100 hover:bg-stone-200 transition-all">취소</button>
                <button
                  onClick={() => setStep(2)}
                  disabled={!roomName.trim()}
                  className="flex-[2] py-4 rounded-2xl font-bold text-white bg-gradient-to-r from-orange-400 to-rose-400 transition-all active:scale-[0.98] disabled:opacity-50"
                >
                  다음
                </button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <div>
                <label className="block text-xs font-black text-stone-400 uppercase tracking-widest mb-3">
                  이름
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && name.trim() && setStep(3)}
                  placeholder="본인의 실명"
                  className="w-full bg-stone-50 border-2 border-stone-200 rounded-2xl py-4 px-5 text-lg font-bold focus:border-orange-400 focus:outline-none transition-all"
                  autoFocus
                />
              </div>
              <div className="flex gap-3">
                <button onClick={() => setStep(1)} className="flex-1 py-4 rounded-2xl font-bold text-stone-400 bg-stone-100 hover:bg-stone-200 transition-all">
                  <i className="fa-solid fa-arrow-left mr-2"></i>뒤로
                </button>
                <button
                  onClick={() => setStep(3)}
                  disabled={!name.trim()}
                  className="flex-[2] py-4 rounded-2xl font-bold text-white bg-gradient-to-r from-orange-400 to-rose-400 transition-all active:scale-[0.98] disabled:opacity-50"
                >
                  다음
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6">
              <div>
                <label className="block text-xs font-black text-stone-400 uppercase tracking-widest mb-3">
                  소속
                </label>
                <input
                  type="text"
                  value={dept}
                  onChange={(e) => setDept(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && dept.trim() && handleSubmit()}
                  placeholder="회사/부서/팀"
                  className="w-full bg-stone-50 border-2 border-stone-200 rounded-2xl py-4 px-5 text-lg font-bold focus:border-orange-400 focus:outline-none transition-all"
                  autoFocus
                />
              </div>
              <div className="flex gap-3">
                <button onClick={() => setStep(2)} className="flex-1 py-4 rounded-2xl font-bold text-stone-400 bg-stone-100 hover:bg-stone-200 transition-all">
                  <i className="fa-solid fa-arrow-left mr-2"></i>뒤로
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={!dept.trim()}
                  className="flex-[2] py-4 rounded-2xl font-bold text-white bg-gradient-to-r from-orange-400 to-rose-400 transition-all active:scale-[0.98] disabled:opacity-50"
                >
                  입장하기
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// 알림 모달
const AlertModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string;
  type?: 'error' | 'info';
}> = ({ isOpen, onClose, title, message, type = 'error' }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose}></div>
      <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in duration-300 p-8 text-center">
        <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${
          type === 'error' ? 'bg-rose-100' : 'bg-blue-100'
        }`}>
          <i className={`fa-solid ${type === 'error' ? 'fa-circle-exclamation text-rose-500' : 'fa-info-circle text-blue-500'} text-3xl`}></i>
        </div>
        <h3 className="text-xl font-black text-stone-800 mb-2">{title}</h3>
        <p className="text-stone-500 mb-6">{message}</p>
        <button
          onClick={onClose}
          className="w-full py-4 rounded-2xl font-bold text-white bg-stone-800 hover:bg-stone-700 transition-all"
        >
          확인
        </button>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>(() => {
    const room = store.getRoom();
    return {
      activeRoom: room,
      currentUser: null,
      view: 'landing',
    };
  });

  // Modal states
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [alert, setAlert] = useState<{ show: boolean; title: string; message: string; type: 'error' | 'info' }>({
    show: false, title: '', message: '', type: 'error'
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

  const handleCreateRoom = async (roomName: string) => {
    const room = await store.createRoom(roomName);
    setShowAdminModal(false);
    setAppState({
      activeRoom: room,
      currentUser: null,
      view: 'admin'
    });
  };

  const handleJoinRoom = async (roomName: string, name: string, dept: string) => {
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
      await store.addUser(newUser);
      setShowJoinModal(false);
      setAppState({
        activeRoom: room,
        currentUser: newUser,
        view: 'user'
      });
    } else {
      setShowJoinModal(false);
      setAlert({
        show: true,
        title: '입장 실패',
        message: room ? `방 이름이 일치하지 않습니다.\n(현재 개설된 방: ${room.name})` : "개설된 방이 없습니다. 강사님에게 문의하세요.",
        type: 'error'
      });
    }
  };

  const onJoinClick = () => {
    const room = store.getRoom();
    if (!room) {
      setAlert({
        show: true,
        title: '방이 없습니다',
        message: '현재 개설된 방이 없습니다. 강사님이 먼저 방을 개설해야 합니다.',
        type: 'info'
      });
      return;
    }
    setShowJoinModal(true);
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
            onClick={() => setShowAdminModal(true)}
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

      {/* Modals */}
      <AdminLoginModal
        isOpen={showAdminModal}
        onClose={() => setShowAdminModal(false)}
        onSuccess={handleCreateRoom}
      />
      <JoinRoomModal
        isOpen={showJoinModal}
        onClose={() => setShowJoinModal(false)}
        onJoin={handleJoinRoom}
        currentRoom={appState.activeRoom}
      />
      <AlertModal
        isOpen={alert.show}
        onClose={() => setAlert(prev => ({ ...prev, show: false }))}
        title={alert.title}
        message={alert.message}
        type={alert.type}
      />
    </div>
  );
};

export default App;
