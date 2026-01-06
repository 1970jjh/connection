
import React, { useEffect, useState, useMemo, useRef } from 'react';
import { Room, User, Connection } from '../types';
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
  const [showStartModal, setShowStartModal] = useState(false);
  const [showResultsPopup, setShowResultsPopup] = useState(false);
  const [timerMinutes, setTimerMinutes] = useState(10);
  const [remainingTime, setRemainingTime] = useState<number | null>(null);
  const [isMusicPlaying, setIsMusicPlaying] = useState(false);
  const [selectedUserForTraits, setSelectedUserForTraits] = useState<User | null>(null);
  const youtubeRef = useRef<HTMLIFrameElement>(null);

  const users = room.users || {};
  const connections = room.connections || [];

  // 점수 기준 정렬된 사용자 순위
  const rankedUsers = useMemo(() => {
    return Object.values(users)
      .map(u => ({ ...u, score: u.score || 0 }))
      .sort((a, b) => b.score - a.score);
  }, [users]);

  const totalConnections = connections.length;

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

  // 타이머 카운트다운
  useEffect(() => {
    if (room.status !== 'running' || !room.timerEndAt) {
      setRemainingTime(null);
      return;
    }

    const updateTimer = () => {
      const now = Date.now();
      const remaining = Math.max(0, Math.floor((room.timerEndAt! - now) / 1000));
      setRemainingTime(remaining);

      if (remaining <= 0) {
        store.updateRoomStatus('completed');
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [room.status, room.timerEndAt]);

  // 종료 시 결과 팝업 표시
  useEffect(() => {
    if (room.status === 'completed') {
      setShowResultsPopup(true);
    }
  }, [room.status]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleStart = () => {
    setShowStartModal(true);
  };

  const handleConfirmStart = () => {
    const durationInSeconds = timerMinutes * 60;
    store.updateRoomStatus('running', durationInSeconds);
    store.matchUsers();
    setShowStartModal(false);
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

  const toggleMusic = () => {
    const iframe = youtubeRef.current;
    if (iframe) {
      iframe.contentWindow?.postMessage(
        JSON.stringify({
          event: 'command',
          func: isMusicPlaying ? 'pauseVideo' : 'playVideo'
        }),
        '*'
      );
      setIsMusicPlaying(!isMusicPlaying);
    }
  };

  // PDF 다운로드 기능
  const handleDownloadPDF = () => {
    const userList = Object.values(users);
    const content = generatePDFContent(room.name, userList, connections);

    // HTML을 새 창에서 열어 인쇄/PDF 저장
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(content);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => printWindow.print(), 500);
    }
  };

  const generatePDFContent = (roomName: string, userList: User[], conns: Connection[]) => {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>${roomName} - 연결고리 결과</title>
        <style>
          body { font-family: 'Malgun Gothic', sans-serif; padding: 40px; max-width: 800px; margin: 0 auto; }
          h1 { color: #ea580c; border-bottom: 3px solid #ea580c; padding-bottom: 10px; }
          h2 { color: #1f2937; margin-top: 30px; }
          .user-card { background: #f9fafb; border-radius: 12px; padding: 16px; margin: 12px 0; border: 1px solid #e5e7eb; }
          .user-name { font-size: 18px; font-weight: bold; color: #1f2937; }
          .user-dept { font-size: 12px; color: #6b7280; margin-bottom: 8px; }
          .user-score { font-size: 14px; color: #10b981; font-weight: bold; }
          .traits { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 10px; }
          .trait { background: #fed7aa; color: #c2410c; padding: 4px 10px; border-radius: 20px; font-size: 12px; }
          .connection { background: #fef3c7; border-radius: 12px; padding: 16px; margin: 12px 0; border: 1px solid #fcd34d; }
          .connection-users { font-weight: bold; color: #92400e; }
          .common-traits { margin-top: 8px; }
          .ranking { display: flex; align-items: center; gap: 12px; padding: 8px 0; border-bottom: 1px solid #e5e7eb; }
          .rank-num { width: 30px; height: 30px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; color: white; }
          .rank-1 { background: linear-gradient(135deg, #f59e0b, #fbbf24); }
          .rank-2 { background: linear-gradient(135deg, #6b7280, #9ca3af); }
          .rank-3 { background: linear-gradient(135deg, #ea580c, #fb923c); }
          .rank-other { background: #d1d5db; color: #4b5563; }
          @media print { body { padding: 20px; } }
        </style>
      </head>
      <body>
        <h1>🔗 ${roomName}</h1>
        <p style="color: #6b7280;">연결고리 활동 결과 보고서 | ${new Date().toLocaleDateString('ko-KR')}</p>

        <h2>🏆 최종 순위</h2>
        ${userList.sort((a, b) => (b.score || 0) - (a.score || 0)).map((u, idx) => `
          <div class="ranking">
            <div class="rank-num ${idx === 0 ? 'rank-1' : idx === 1 ? 'rank-2' : idx === 2 ? 'rank-3' : 'rank-other'}">${idx + 1}</div>
            <div style="flex: 1;">
              <div style="font-weight: bold;">${u.name}</div>
              <div style="font-size: 12px; color: #6b7280;">${u.department}</div>
            </div>
            <div style="font-weight: bold; color: #10b981;">${u.score || 0}점</div>
          </div>
        `).join('')}

        <h2>👥 참가자 프로필 (${userList.length}명)</h2>
        ${userList.map(u => `
          <div class="user-card">
            <div class="user-name">${u.name}</div>
            <div class="user-dept">${u.department}</div>
            <div class="user-score">점수: ${u.score || 0}점 | 연결: ${u.metUserIds?.length || 0}명</div>
            <div class="traits">
              ${u.traits.map(t => `<span class="trait">#${t}</span>`).join('')}
            </div>
          </div>
        `).join('')}

        <h2>🤝 연결 기록 (${conns.length}회)</h2>
        ${conns.map(conn => {
          const connUsers = conn.userIds.map(id => users[id]).filter(Boolean);
          return `
            <div class="connection">
              <div class="connection-users">
                ${conn.groupSize === 3 ? '🔺 트리플 연결: ' : ''}
                ${connUsers.map(u => u.name).join(' ↔ ')}
              </div>
              <div class="common-traits">
                <strong>공통점:</strong>
                ${conn.commonTraits.map(t => `<span class="trait">#${t}</span>`).join(' ')}
              </div>
            </div>
          `;
        }).join('')}
      </body>
      </html>
    `;
  };

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      {/* Hidden YouTube Player */}
      <iframe
        ref={youtubeRef}
        className="hidden"
        src="https://www.youtube.com/embed/oxtWV19Dl94?enablejsapi=1&autoplay=0&loop=1&playlist=oxtWV19Dl94"
        allow="autoplay"
      />

      <header className="p-6 bg-glass flex justify-between items-center z-30 shadow-sm">
        <div className="flex items-center space-x-6">
          <button onClick={onGoBack} className="w-10 h-10 bg-white rounded-full shadow-sm text-stone-400 hover:text-orange-500 transition-colors flex items-center justify-center">
            <i className="fa-solid fa-arrow-left"></i>
          </button>
          <div>
            <h1 className="text-2xl font-black text-stone-800">{room.name}</h1>
            <p className="text-[10px] text-orange-500 uppercase tracking-widest font-extrabold">Connection Map Dashboard</p>
          </div>
          {/* 배경음악 토글 */}
          <button
            onClick={toggleMusic}
            className={`w-10 h-10 rounded-full shadow-sm flex items-center justify-center transition-all ${
              isMusicPlaying ? 'bg-orange-500 text-white' : 'bg-white text-stone-400 hover:text-orange-500'
            }`}
          >
            <i className={`fa-solid ${isMusicPlaying ? 'fa-volume-high' : 'fa-volume-xmark'}`}></i>
          </button>
        </div>

        <div className="flex items-center space-x-4">
          {/* 타이머 표시 */}
          {room.status === 'running' && remainingTime !== null && (
            <div className={`px-6 py-2 rounded-2xl font-black text-2xl tabular-nums ${
              remainingTime <= 60 ? 'bg-rose-500 text-white animate-pulse' : 'bg-stone-800 text-white'
            }`}>
              <i className="fa-solid fa-clock mr-2"></i>
              {formatTime(remainingTime)}
            </div>
          )}

          <div className="text-right cursor-pointer group" onClick={() => setShowUserList(!showUserList)}>
            <p className="text-[10px] text-stone-400 font-bold uppercase">참여</p>
            <p className="text-lg font-black text-rose-500 group-hover:scale-110 transition-transform">{participantCount}</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] text-stone-400 font-bold uppercase">연결</p>
            <p className="text-lg font-black text-orange-500">{totalConnections}</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] text-stone-400 font-bold uppercase">대화</p>
            <p className="text-lg font-black text-violet-500">{activeMatchCount}</p>
          </div>
          <div className="text-right cursor-pointer group" onClick={() => setShowLeaderboard(!showLeaderboard)}>
            <p className="text-[10px] text-stone-400 font-bold uppercase">순위</p>
            <p className="text-lg font-black text-emerald-500 group-hover:scale-110 transition-transform">
              <i className="fa-solid fa-trophy"></i>
            </p>
          </div>

          <div className="flex space-x-2">
            {room.status === 'waiting' ? (
              <button
                onClick={handleStart}
                className="bg-gradient-to-r from-orange-400 to-rose-400 px-5 py-2.5 rounded-2xl font-bold text-white hover:shadow-lg hover:shadow-orange-200 transition-all"
              >
                <i className="fa-solid fa-play mr-2"></i>연결고리 시작
              </button>
            ) : room.status === 'running' ? (
              <button
                onClick={() => store.updateRoomStatus('completed')}
                className="bg-stone-800 px-5 py-2.5 rounded-2xl font-bold text-white hover:bg-stone-700 transition-all"
              >
                <i className="fa-solid fa-stop mr-2"></i>전체 종료
              </button>
            ) : (
              <>
                <button
                  onClick={() => setShowResultsPopup(true)}
                  className="bg-emerald-500 px-5 py-2.5 rounded-2xl font-bold text-white hover:bg-emerald-600 transition-all"
                >
                  <i className="fa-solid fa-trophy mr-2"></i>결과 보기
                </button>
                <button
                  onClick={handleDownloadPDF}
                  className="bg-blue-500 px-5 py-2.5 rounded-2xl font-bold text-white hover:bg-blue-600 transition-all"
                >
                  <i className="fa-solid fa-file-pdf mr-2"></i>PDF
                </button>
              </>
            )}
            <button
              onClick={handleReset}
              className="bg-white px-4 py-2.5 rounded-2xl text-sm font-bold text-stone-400 hover:text-rose-500 border border-stone-100 transition-all"
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

            {rankedUsers.length >= 3 && (
              <div className="flex justify-center items-end space-x-2 mb-8">
                <div className="text-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-slate-300 to-slate-400 rounded-full flex items-center justify-center mb-2 mx-auto shadow-lg">
                    <span className="text-2xl font-black text-white">{rankedUsers[1]?.name?.[0]}</span>
                  </div>
                  <div className="bg-slate-200 rounded-t-xl px-3 py-4 h-16">
                    <p className="text-xs font-bold text-slate-600 truncate w-14">{rankedUsers[1]?.name}</p>
                    <p className="text-sm font-black text-slate-700">{rankedUsers[1]?.score || 0}</p>
                  </div>
                </div>
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

      {/* Start Modal with Timer Setting */}
      {showStartModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowStartModal(false)}></div>
          <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in duration-300">
            <div className="bg-gradient-to-r from-orange-400 to-rose-400 text-white p-6">
              <h2 className="text-2xl font-black">연결고리 시작</h2>
              <p className="text-white/80 text-sm mt-1">진행 시간을 설정해주세요</p>
            </div>
            <div className="p-8 space-y-6">
              <div>
                <label className="block text-xs font-black text-stone-400 uppercase tracking-widest mb-3">
                  전체 진행 시간
                </label>
                <div className="flex items-center gap-4">
                  <input
                    type="range"
                    min={5}
                    max={60}
                    step={5}
                    value={timerMinutes}
                    onChange={(e) => setTimerMinutes(Number(e.target.value))}
                    className="flex-1 h-2 bg-stone-200 rounded-lg appearance-none cursor-pointer accent-orange-500"
                  />
                  <div className="w-24 text-center py-3 bg-stone-100 rounded-2xl font-black text-2xl text-stone-800">
                    {timerMinutes}분
                  </div>
                </div>
                <div className="flex justify-between text-xs text-stone-400 mt-2">
                  <span>5분</span>
                  <span>30분</span>
                  <span>60분</span>
                </div>
              </div>

              <div className="bg-orange-50 p-4 rounded-2xl">
                <p className="text-sm text-orange-700">
                  <i className="fa-solid fa-info-circle mr-2"></i>
                  시간이 종료되면 자동으로 과정이 종료됩니다.
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowStartModal(false)}
                  className="flex-1 py-4 rounded-2xl font-bold text-stone-400 bg-stone-100 hover:bg-stone-200 transition-all"
                >
                  취소
                </button>
                <button
                  onClick={handleConfirmStart}
                  className="flex-[2] py-4 rounded-2xl font-bold text-white bg-gradient-to-r from-orange-500 to-rose-500 hover:shadow-lg hover:shadow-orange-200 transition-all"
                >
                  <i className="fa-solid fa-play mr-2"></i>
                  시작하기
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Results Popup */}
      {showResultsPopup && room.status === 'completed' && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm"></div>
          <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden animate-in zoom-in duration-300">
            <button
              onClick={() => setShowResultsPopup(false)}
              className="absolute top-4 right-4 z-10 w-10 h-10 bg-white/80 rounded-full flex items-center justify-center hover:bg-white transition-colors"
            >
              <i className="fa-solid fa-xmark text-stone-500"></i>
            </button>

            <div className="bg-gradient-to-r from-amber-400 to-yellow-500 text-white p-8 text-center">
              <i className="fa-solid fa-trophy text-6xl mb-4"></i>
              <h2 className="text-3xl font-black">연결고리 완료!</h2>
              <p className="text-white/80 mt-2">{room.name}</p>
            </div>

            <div className="p-8 overflow-y-auto max-h-[50vh]">
              <h3 className="text-lg font-black text-stone-800 mb-4">
                <i className="fa-solid fa-medal text-amber-500 mr-2"></i>
                최종 순위
              </h3>

              {rankedUsers.length >= 3 && (
                <div className="flex justify-center items-end space-x-4 mb-8">
                  <div className="text-center">
                    <div className="w-20 h-20 bg-gradient-to-br from-slate-300 to-slate-400 rounded-full flex items-center justify-center mb-2 mx-auto shadow-lg">
                      <span className="text-3xl font-black text-white">{rankedUsers[1]?.name?.[0]}</span>
                    </div>
                    <p className="font-bold text-stone-800">{rankedUsers[1]?.name}</p>
                    <p className="text-2xl font-black text-slate-600">{rankedUsers[1]?.score || 0}점</p>
                    <p className="text-xs text-stone-400">2위</p>
                  </div>
                  <div className="text-center -mt-8">
                    <i className="fa-solid fa-crown text-amber-500 text-3xl mb-2"></i>
                    <div className="w-24 h-24 bg-gradient-to-br from-amber-400 to-yellow-500 rounded-full flex items-center justify-center mb-2 mx-auto shadow-xl ring-4 ring-amber-200">
                      <span className="text-4xl font-black text-white">{rankedUsers[0]?.name?.[0]}</span>
                    </div>
                    <p className="font-bold text-stone-800 text-lg">{rankedUsers[0]?.name}</p>
                    <p className="text-3xl font-black text-amber-600">{rankedUsers[0]?.score || 0}점</p>
                    <p className="text-xs text-amber-600 font-bold">1위</p>
                  </div>
                  <div className="text-center">
                    <div className="w-20 h-20 bg-gradient-to-br from-orange-300 to-orange-400 rounded-full flex items-center justify-center mb-2 mx-auto shadow-lg">
                      <span className="text-3xl font-black text-white">{rankedUsers[2]?.name?.[0]}</span>
                    </div>
                    <p className="font-bold text-stone-800">{rankedUsers[2]?.name}</p>
                    <p className="text-2xl font-black text-orange-600">{rankedUsers[2]?.score || 0}점</p>
                    <p className="text-xs text-stone-400">3위</p>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-orange-50 p-4 rounded-2xl text-center">
                  <p className="text-3xl font-black text-orange-600">{participantCount}</p>
                  <p className="text-xs text-orange-500 font-bold">총 참가자</p>
                </div>
                <div className="bg-rose-50 p-4 rounded-2xl text-center">
                  <p className="text-3xl font-black text-rose-600">{totalConnections}</p>
                  <p className="text-xs text-rose-500 font-bold">총 연결</p>
                </div>
              </div>

              <button
                onClick={handleDownloadPDF}
                className="w-full py-4 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-2xl font-bold text-white hover:shadow-lg transition-all"
              >
                <i className="fa-solid fa-file-pdf mr-2"></i>
                결과 PDF 다운로드
              </button>
            </div>
          </div>
        </div>
      )}

      {/* User Traits Modal */}
      {selectedUserForTraits && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setSelectedUserForTraits(null)}></div>
          <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in duration-300">
            <div className="bg-gradient-to-r from-orange-400 to-rose-400 text-white p-6">
              <h2 className="text-2xl font-black">{selectedUserForTraits.name}</h2>
              <p className="text-white/80 text-sm mt-1">{selectedUserForTraits.department}</p>
            </div>
            <div className="p-6">
              <h3 className="text-xs font-black text-stone-400 uppercase tracking-widest mb-4">10가지 특징</h3>
              <div className="flex flex-wrap gap-2">
                {selectedUserForTraits.traits.map((t, idx) => (
                  <span key={idx} className="px-4 py-2 bg-orange-100 rounded-full text-orange-600 font-bold text-sm">
                    #{t}
                  </span>
                ))}
              </div>
              <button
                onClick={() => setSelectedUserForTraits(null)}
                className="w-full mt-6 py-3 bg-stone-100 rounded-2xl font-bold text-stone-500 hover:bg-stone-200 transition-all"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
