
import React, { useEffect, useState, useMemo } from 'react';
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
  const [showConnectionDetails, setShowConnectionDetails] = useState(false);

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

  // PDF 다운로드 함수 (HTML로 생성 후 인쇄)
  const handleDownloadPDF = () => {
    const date = new Date().toLocaleDateString('ko-KR');
    const userList = Object.values(users);

    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${room.name} - 연결고리 기록</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Malgun Gothic', sans-serif; padding: 40px; color: #333; }
    .header { text-align: center; margin-bottom: 40px; padding-bottom: 20px; border-bottom: 3px solid #f97316; }
    .header h1 { font-size: 28px; color: #1f2937; margin-bottom: 8px; }
    .header p { color: #6b7280; font-size: 14px; }
    .stats { display: flex; justify-content: center; gap: 40px; margin: 20px 0; }
    .stat { text-align: center; }
    .stat-value { font-size: 32px; font-weight: bold; color: #f97316; }
    .stat-label { font-size: 12px; color: #6b7280; }
    .section { margin: 30px 0; }
    .section-title { font-size: 18px; font-weight: bold; color: #1f2937; margin-bottom: 15px; padding-bottom: 8px; border-bottom: 2px solid #fed7aa; }
    .connection-card { background: #fff7ed; border-radius: 12px; padding: 20px; margin-bottom: 15px; border: 1px solid #fed7aa; }
    .connection-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
    .connection-members { font-weight: bold; color: #ea580c; }
    .connection-badge { background: #f97316; color: white; padding: 4px 12px; border-radius: 20px; font-size: 12px; }
    .triple-badge { background: #8b5cf6; }
    .traits-title { font-size: 12px; color: #6b7280; margin: 12px 0 8px 0; font-weight: bold; }
    .traits { display: flex; flex-wrap: wrap; gap: 8px; }
    .trait { background: white; border: 1px solid #fed7aa; padding: 4px 12px; border-radius: 20px; font-size: 13px; color: #ea580c; }
    .individual-section { margin-top: 15px; padding-top: 15px; border-top: 1px dashed #fed7aa; }
    .individual-item { margin: 8px 0; }
    .individual-name { font-weight: bold; color: #374151; font-size: 13px; }
    .individual-traits { color: #6b7280; font-size: 12px; margin-left: 16px; }
    .ranking { margin-top: 30px; }
    .ranking-item { display: flex; align-items: center; padding: 12px; background: white; border-radius: 8px; margin-bottom: 8px; border: 1px solid #e5e7eb; }
    .ranking-num { width: 30px; height: 30px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; margin-right: 12px; font-size: 14px; }
    .rank-1 { background: #fbbf24; color: white; }
    .rank-2 { background: #9ca3af; color: white; }
    .rank-3 { background: #f97316; color: white; }
    .rank-other { background: #e5e7eb; color: #6b7280; }
    .ranking-info { flex: 1; }
    .ranking-name { font-weight: bold; }
    .ranking-dept { font-size: 12px; color: #6b7280; }
    .ranking-score { font-weight: bold; color: #f97316; }
    .footer { margin-top: 40px; text-align: center; color: #9ca3af; font-size: 12px; border-top: 1px solid #e5e7eb; padding-top: 20px; }
    @media print { body { padding: 20px; } .connection-card { break-inside: avoid; } }
  </style>
</head>
<body>
  <div class="header">
    <h1>${room.name}</h1>
    <p>연결고리 활동 기록</p>
    <p>${date}</p>
  </div>

  <div class="stats">
    <div class="stat">
      <div class="stat-value">${userList.length}</div>
      <div class="stat-label">참가자</div>
    </div>
    <div class="stat">
      <div class="stat-value">${connections.length}</div>
      <div class="stat-label">총 연결</div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">📊 순위표</div>
    ${rankedUsers.slice(0, 10).map((u, idx) => `
      <div class="ranking-item">
        <div class="ranking-num ${idx === 0 ? 'rank-1' : idx === 1 ? 'rank-2' : idx === 2 ? 'rank-3' : 'rank-other'}">${idx + 1}</div>
        <div class="ranking-info">
          <div class="ranking-name">${u.name}</div>
          <div class="ranking-dept">${u.department} · ${u.metUserIds?.length || 0}명 연결</div>
        </div>
        <div class="ranking-score">${u.score}점</div>
      </div>
    `).join('')}
  </div>

  <div class="section">
    <div class="section-title">🔗 모든 연결 기록 (${connections.length}개)</div>
    ${connections.map((conn, idx) => {
      const members = conn.userIds.map(id => users[id]).filter(Boolean);
      const isTriple = conn.groupSize === 3 || conn.userIds.length === 3;
      return `
        <div class="connection-card">
          <div class="connection-header">
            <div class="connection-members">${members.map(m => m.name).join(' ↔ ')}</div>
            <span class="connection-badge ${isTriple ? 'triple-badge' : ''}">${isTriple ? '트리플' : '2인'} 연결</span>
          </div>
          <div class="traits-title">함께 발견한 공통점</div>
          <div class="traits">
            ${conn.commonTraits.length > 0 ? conn.commonTraits.map(t => `<span class="trait">#${t}</span>`).join('') : '<span style="color: #9ca3af; font-size: 13px;">공통점 없음</span>'}
          </div>
          ${conn.individualTraits && Object.keys(conn.individualTraits).length > 0 ? `
            <div class="individual-section">
              <div class="traits-title">개별 작성 내역</div>
              ${Object.entries(conn.individualTraits).map(([authorId, traits]) => {
                const author = users[authorId];
                return `
                  <div class="individual-item">
                    <span class="individual-name">${author?.name || '?'}:</span>
                    <span class="individual-traits">${(traits as string[]).map(t => '#' + t).join(' ')}</span>
                  </div>
                `;
              }).join('')}
            </div>
          ` : ''}
        </div>
      `;
    }).join('')}
  </div>

  <div class="footer">
    <p>연결고리 - 우리들의 연결고리</p>
    <p>Generated on ${date}</p>
  </div>
</body>
</html>
    `;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(htmlContent);
      printWindow.document.close();
      printWindow.onload = () => {
        printWindow.print();
      };
    }
  };

  // 텍스트 파일 다운로드 함수
  const handleDownloadTxt = () => {
    const date = new Date().toLocaleDateString('ko-KR');
    const userList = Object.values(users);
    const lines: string[] = [];

    lines.push(`=======================================`);
    lines.push(`  ${room.name}`);
    lines.push(`  연결고리 전체 기록`);
    lines.push(`=======================================`);
    lines.push(``);
    lines.push(`날짜: ${date}`);
    lines.push(`총 참가자: ${userList.length}명`);
    lines.push(`총 연결: ${connections.length}회`);
    lines.push(``);

    lines.push(`---------------------------------------`);
    lines.push(`  순위표 (상위 10명)`);
    lines.push(`---------------------------------------`);
    rankedUsers.slice(0, 10).forEach((u, idx) => {
      lines.push(`  ${idx + 1}위. ${u.name} (${u.department}) - ${u.score}점 (${u.metUserIds?.length || 0}명 연결)`);
    });
    lines.push(``);

    lines.push(`=======================================`);
    lines.push(`  모든 연결 기록`);
    lines.push(`=======================================`);

    connections.forEach((conn, idx) => {
      const members = conn.userIds.map(id => users[id]).filter(Boolean);
      const isTriple = conn.groupSize === 3 || conn.userIds.length === 3;

      lines.push(``);
      lines.push(`---------------------------------------`);
      lines.push(`  연결 #${idx + 1} ${isTriple ? '(트리플 연결)' : '(2인 연결)'}`);
      lines.push(`---------------------------------------`);
      lines.push(`  참가자: ${members.map(m => `${m.name} (${m.department})`).join(', ')}`);
      lines.push(``);
      lines.push(`  [함께 발견한 공통점]`);
      if (conn.commonTraits.length > 0) {
        conn.commonTraits.forEach(t => {
          lines.push(`    • ${t}`);
        });
      } else {
        lines.push(`    (없음)`);
      }

      if (conn.individualTraits && Object.keys(conn.individualTraits).length > 0) {
        lines.push(``);
        lines.push(`  [개별 작성 내역]`);
        Object.entries(conn.individualTraits).forEach(([authorId, traits]) => {
          const author = users[authorId];
          lines.push(`    ${author?.name || '?'}:`);
          (traits as string[]).forEach(t => {
            lines.push(`      - ${t}`);
          });
        });
      }
    });

    lines.push(``);
    lines.push(`=======================================`);
    lines.push(`  연결고리 - 우리들의 연결고리`);
    lines.push(`=======================================`);

    const content = lines.join('\n');
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `연결고리_전체기록_${date.replace(/\./g, '-')}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
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
            {/* 연결 기록 보기 버튼 */}
            <button
              onClick={() => setShowConnectionDetails(!showConnectionDetails)}
              className={`px-4 py-3 rounded-2xl text-sm font-bold border transition-all ${
                showConnectionDetails
                  ? 'bg-violet-500 text-white border-violet-500'
                  : 'bg-white text-violet-500 border-violet-200 hover:border-violet-400'
              }`}
            >
              <i className="fa-solid fa-link mr-2"></i>
              연결 기록
            </button>
            {/* 다운로드 버튼 그룹 */}
            {connections.length > 0 && (
              <div className="flex space-x-2">
                <button
                  onClick={handleDownloadPDF}
                  className="px-4 py-3 rounded-2xl text-sm font-bold bg-rose-500 text-white hover:bg-rose-600 transition-all"
                  title="PDF로 인쇄/저장"
                >
                  <i className="fa-solid fa-file-pdf mr-2"></i>
                  PDF
                </button>
                <button
                  onClick={handleDownloadTxt}
                  className="px-4 py-3 rounded-2xl text-sm font-bold bg-emerald-500 text-white hover:bg-emerald-600 transition-all"
                  title="텍스트 파일 다운로드"
                >
                  <i className="fa-solid fa-download mr-2"></i>
                  TXT
                </button>
              </div>
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

        {/* Connection Details Sidebar */}
        {showConnectionDetails && (
          <div className="absolute top-4 right-4 bottom-4 w-96 bg-glass-dark rounded-3xl z-40 p-6 overflow-y-auto shadow-2xl animate-in slide-in-from-right duration-300">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-black text-stone-800">
                <i className="fa-solid fa-link text-violet-500 mr-2"></i>
                연결 기록
              </h2>
              <button onClick={() => setShowConnectionDetails(false)} className="w-8 h-8 rounded-full hover:bg-stone-100 transition-colors">
                <i className="fa-solid fa-xmark text-stone-400"></i>
              </button>
            </div>

            {/* 요약 정보 */}
            <div className="bg-gradient-to-r from-violet-50 to-purple-50 p-4 rounded-2xl mb-6 border border-violet-100">
              <div className="flex justify-around text-center">
                <div>
                  <p className="text-2xl font-black text-violet-600">{connections.length}</p>
                  <p className="text-xs text-stone-500">총 연결</p>
                </div>
                <div>
                  <p className="text-2xl font-black text-orange-500">
                    {connections.filter(c => c.groupSize === 2 || c.userIds.length === 2).length}
                  </p>
                  <p className="text-xs text-stone-500">2인 연결</p>
                </div>
                <div>
                  <p className="text-2xl font-black text-purple-500">
                    {connections.filter(c => c.groupSize === 3 || c.userIds.length === 3).length}
                  </p>
                  <p className="text-xs text-stone-500">트리플 연결</p>
                </div>
              </div>
            </div>

            {/* 연결 목록 */}
            <div className="space-y-4">
              {connections.length > 0 ? (
                connections.map((conn, idx) => {
                  const members = conn.userIds.map(id => users[id]).filter(Boolean);
                  const isTriple = conn.groupSize === 3 || conn.userIds.length === 3;

                  return (
                    <div
                      key={conn.id || idx}
                      className={`bg-white p-4 rounded-2xl shadow-sm border transition-all hover:shadow-md ${
                        isTriple ? 'border-violet-200' : 'border-orange-100'
                      }`}
                    >
                      {/* 헤더 */}
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                            isTriple ? 'bg-violet-100 text-violet-600' : 'bg-orange-100 text-orange-600'
                          }`}>
                            #{idx + 1}
                          </span>
                          <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                            isTriple ? 'bg-purple-100 text-purple-600' : 'bg-rose-100 text-rose-600'
                          }`}>
                            {isTriple ? '트리플' : '2인'}
                          </span>
                        </div>
                      </div>

                      {/* 참가자 */}
                      <div className="flex flex-wrap gap-2 mb-3">
                        {members.map(member => (
                          <div key={member.id} className="flex items-center gap-1 bg-stone-50 px-2 py-1 rounded-lg">
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white ${
                              isTriple ? 'bg-violet-400' : 'bg-orange-400'
                            }`}>
                              {member.name[0]}
                            </div>
                            <span className="text-sm font-medium text-stone-700">{member.name}</span>
                          </div>
                        ))}
                      </div>

                      {/* 공통점 */}
                      {conn.commonTraits.length > 0 && (
                        <div className="mb-3">
                          <p className="text-[10px] text-stone-400 font-bold uppercase mb-2">공통점</p>
                          <div className="flex flex-wrap gap-1">
                            {conn.commonTraits.map((trait, tIdx) => (
                              <span
                                key={tIdx}
                                className={`px-2 py-1 rounded-lg text-xs font-medium ${
                                  isTriple ? 'bg-violet-50 text-violet-600' : 'bg-orange-50 text-orange-600'
                                }`}
                              >
                                #{trait}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* 개별 작성 내역 */}
                      {conn.individualTraits && Object.keys(conn.individualTraits).length > 0 && (
                        <div className="pt-3 border-t border-stone-100">
                          <p className="text-[10px] text-stone-400 font-bold uppercase mb-2">개별 작성</p>
                          <div className="space-y-1">
                            {Object.entries(conn.individualTraits).map(([authorId, traits]) => {
                              const author = users[authorId];
                              return (
                                <div key={authorId} className="text-xs">
                                  <span className="font-bold text-stone-600">{author?.name || '?'}:</span>
                                  <span className="text-stone-500 ml-1">
                                    {(traits as string[]).map(t => '#' + t).join(' ')}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-stone-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <i className="fa-solid fa-link-slash text-2xl text-stone-300"></i>
                  </div>
                  <p className="text-stone-400 font-medium">아직 연결 기록이 없습니다</p>
                  <p className="text-stone-300 text-sm mt-1">연결고리를 시작하면 기록이 표시됩니다</p>
                </div>
              )}
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
