
import React, { useState, useMemo } from 'react';
import { User, Room } from '../types';
import { store } from '../services/store';

interface Props {
  user: User;
  room: Room;
  onClose: () => void;
  onStartSession: (partners: User[]) => void;
}

const ManualConnect: React.FC<Props> = ({ user, room, onClose, onStartSession }) => {
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [step, setStep] = useState<'select' | 'confirm'>('select');

  const users = room.users || {};

  // 선택 가능한 참가자 목록 (본인 제외)
  const availableUsers = useMemo(() => {
    return Object.values(users)
      .filter(u => u.id !== user.id)
      .sort((a, b) => {
        // 이미 만난 사람은 뒤로
        const aIsMet = user.metUserIds?.includes(a.id) ? 1 : 0;
        const bIsMet = user.metUserIds?.includes(b.id) ? 1 : 0;
        if (aIsMet !== bIsMet) return aIsMet - bIsMet;
        // 이름순 정렬
        return a.name.localeCompare(b.name);
      });
  }, [users, user.id, user.metUserIds]);

  const selectedUsers = useMemo(() => {
    return selectedUserIds.map(id => users[id]).filter(Boolean);
  }, [selectedUserIds, users]);

  const toggleUser = (userId: string) => {
    setSelectedUserIds(prev => {
      if (prev.includes(userId)) {
        return prev.filter(id => id !== userId);
      }
      // 최대 2명까지 선택 가능 (3인 연결)
      if (prev.length >= 2) {
        return [...prev.slice(1), userId];
      }
      return [...prev, userId];
    });
  };

  const handleStartManualSession = async () => {
    if (selectedUsers.length === 0) return;

    // 수동 매칭 시작
    await store.startManualMatch(user.id, selectedUserIds);
    onStartSession(selectedUsers);
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/50 flex items-center justify-center p-4 animate-in fade-in duration-300">
      <div className="bg-white rounded-3xl w-full max-w-md max-h-[80vh] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
        {/* 헤더 */}
        <div className="bg-gradient-to-r from-teal-500 to-emerald-500 p-6 text-white">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-xl font-black mb-1">
                <i className="fa-solid fa-user-plus mr-2"></i>
                직접 연결하기
              </h2>
              <p className="text-teal-100 text-sm">
                함께 대화할 파트너를 선택하세요
              </p>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 transition-colors"
            >
              <i className="fa-solid fa-xmark"></i>
            </button>
          </div>
        </div>

        {step === 'select' ? (
          <>
            {/* 선택 안내 */}
            <div className="p-4 bg-teal-50 border-b border-teal-100">
              <div className="flex items-center gap-3">
                <div className="flex -space-x-2">
                  {selectedUsers.length > 0 ? (
                    selectedUsers.map(u => (
                      <div
                        key={u.id}
                        className="w-10 h-10 bg-teal-500 rounded-full flex items-center justify-center text-white font-bold border-2 border-white"
                      >
                        {u.name[0]}
                      </div>
                    ))
                  ) : (
                    <>
                      <div className="w-10 h-10 bg-stone-200 rounded-full flex items-center justify-center text-stone-400 border-2 border-white">
                        <i className="fa-solid fa-user"></i>
                      </div>
                      <div className="w-10 h-10 bg-stone-200 rounded-full flex items-center justify-center text-stone-400 border-2 border-white">
                        <i className="fa-solid fa-question"></i>
                      </div>
                    </>
                  )}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold text-teal-700">
                    {selectedUsers.length === 0
                      ? '파트너를 선택해주세요'
                      : selectedUsers.length === 1
                      ? `${selectedUsers[0].name}님과 2인 연결`
                      : `${selectedUsers.map(u => u.name).join(', ')}님과 3인 연결`}
                  </p>
                  <p className="text-xs text-teal-600">
                    1~2명 선택 가능 (2인 또는 3인 연결)
                  </p>
                </div>
              </div>
            </div>

            {/* 참가자 목록 */}
            <div className="p-4 overflow-y-auto" style={{ maxHeight: '40vh' }}>
              <div className="space-y-2">
                {availableUsers.length > 0 ? (
                  availableUsers.map(u => {
                    const isSelected = selectedUserIds.includes(u.id);
                    const isMet = user.metUserIds?.includes(u.id);
                    const isInMatch = u.currentMatchId || u.currentMatchIds?.length;

                    return (
                      <button
                        key={u.id}
                        onClick={() => toggleUser(u.id)}
                        disabled={isInMatch}
                        className={`w-full p-4 rounded-2xl border-2 transition-all text-left flex items-center gap-3 ${
                          isSelected
                            ? 'border-teal-500 bg-teal-50'
                            : isInMatch
                            ? 'border-stone-100 bg-stone-50 opacity-50 cursor-not-allowed'
                            : 'border-stone-100 hover:border-teal-300 hover:bg-teal-50/50'
                        }`}
                      >
                        <div
                          className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold ${
                            isSelected
                              ? 'bg-teal-500 text-white'
                              : isMet
                              ? 'bg-amber-100 text-amber-600'
                              : 'bg-stone-100 text-stone-500'
                          }`}
                        >
                          {u.name[0]}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-stone-800">{u.name}</span>
                            {isMet && (
                              <span className="px-2 py-0.5 bg-amber-100 text-amber-600 rounded-full text-[10px] font-bold">
                                이전에 만남
                              </span>
                            )}
                            {isInMatch && (
                              <span className="px-2 py-0.5 bg-rose-100 text-rose-600 rounded-full text-[10px] font-bold">
                                대화 중
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-stone-400">{u.department}</p>
                        </div>
                        <div
                          className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                            isSelected
                              ? 'border-teal-500 bg-teal-500 text-white'
                              : 'border-stone-300'
                          }`}
                        >
                          {isSelected && <i className="fa-solid fa-check text-xs"></i>}
                        </div>
                      </button>
                    );
                  })
                ) : (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 bg-stone-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <i className="fa-solid fa-users-slash text-2xl text-stone-300"></i>
                    </div>
                    <p className="text-stone-400 font-medium">연결 가능한 참가자가 없습니다</p>
                  </div>
                )}
              </div>
            </div>

            {/* 하단 버튼 */}
            <div className="p-4 border-t border-stone-100">
              <button
                onClick={() => setStep('confirm')}
                disabled={selectedUsers.length === 0}
                className="w-full py-4 bg-gradient-to-r from-teal-500 to-emerald-500 text-white rounded-2xl font-bold text-lg shadow-lg shadow-teal-200 disabled:opacity-30 disabled:shadow-none transition-all active:scale-95"
              >
                {selectedUsers.length === 0
                  ? '파트너를 선택해주세요'
                  : `${selectedUsers.length === 1 ? '2인' : '3인'} 연결 시작`}
              </button>
            </div>
          </>
        ) : (
          <>
            {/* 확인 화면 */}
            <div className="p-6 text-center">
              <div className="flex justify-center -space-x-4 mb-6">
                <div className="w-16 h-16 bg-teal-500 rounded-full flex items-center justify-center text-2xl font-bold text-white border-4 border-white shadow-lg">
                  {user.name[0]}
                </div>
                {selectedUsers.map(u => (
                  <div
                    key={u.id}
                    className="w-16 h-16 bg-emerald-500 rounded-full flex items-center justify-center text-2xl font-bold text-white border-4 border-white shadow-lg"
                  >
                    {u.name[0]}
                  </div>
                ))}
              </div>

              <h3 className="text-xl font-black text-stone-800 mb-2">연결을 시작할까요?</h3>
              <p className="text-stone-500 mb-6">
                <span className="font-bold text-teal-600">{user.name}</span>님과{' '}
                <span className="font-bold text-emerald-600">
                  {selectedUsers.map(u => u.name).join(', ')}
                </span>
                님의 연결
              </p>

              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-6 text-left">
                <div className="flex items-start gap-3">
                  <i className="fa-solid fa-circle-info text-amber-500 mt-0.5"></i>
                  <div className="text-sm text-amber-700">
                    <p className="font-bold mb-1">안내사항</p>
                    <ul className="text-xs space-y-1 text-amber-600">
                      <li>- 선택한 파트너와 직접 대화하며 공통점을 찾아주세요</li>
                      <li>- 상대방도 같은 화면에서 공통점을 작성합니다</li>
                      <li>- 작성이 완료되면 점수가 반영됩니다</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setStep('select')}
                  className="flex-1 py-4 bg-stone-100 text-stone-600 rounded-2xl font-bold transition-all hover:bg-stone-200"
                >
                  다시 선택
                </button>
                <button
                  onClick={handleStartManualSession}
                  className="flex-1 py-4 bg-gradient-to-r from-teal-500 to-emerald-500 text-white rounded-2xl font-bold shadow-lg shadow-teal-200 transition-all active:scale-95"
                >
                  연결 시작!
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ManualConnect;
