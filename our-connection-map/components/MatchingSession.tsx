
import React, { useState, useEffect } from 'react';
import { User } from '../types';
import { store } from '../services/store';

interface Props {
  user: User;
  partners: User[]; // 2인 또는 3인 그룹 지원
  onComplete: () => void;
}

const MatchingSession: React.FC<Props> = ({ user, partners, onComplete }) => {
  const [newTraits, setNewTraits] = useState<string[]>(['', '', '']);
  const [showHighFive, setShowHighFive] = useState(false);
  const [countdown, setCountdown] = useState(5);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [allSubmitted, setAllSubmitted] = useState(false);
  const [submittedUserIds, setSubmittedUserIds] = useState<string[]>([]);

  const groupSize = partners.length + 1;
  const allUserIds = [user.id, ...partners.map(p => p.id)].sort();
  const connectionId = `conn-${allUserIds.join('-')}`;

  // 모든 파트너의 특성과 공통점 찾기
  const preCommon = user.traits.filter(t =>
    partners.every(p => p.traits.includes(t))
  );

  // 현재 연결 상태 확인 (이미 제출했는지, 모든 파트너가 제출했는지)
  useEffect(() => {
    const checkSubmissionStatus = () => {
      const existingConn = store.findConnectionByUsers(allUserIds);
      if (existingConn?.submittedBy) {
        setSubmittedUserIds(existingConn.submittedBy);
        if (existingConn.submittedBy.includes(user.id)) {
          setHasSubmitted(true);
        }
        // 모든 참가자가 제출했는지 확인
        if (existingConn.submittedBy.length === groupSize) {
          setAllSubmitted(true);
        }
      }
    };

    checkSubmissionStatus();

    // store 변경 구독하여 실시간으로 제출 상태 확인
    const unsubscribe = store.subscribe(() => {
      checkSubmissionStatus();
    });

    return () => unsubscribe();
  }, [allUserIds, user.id, groupSize]);

  // 모든 참가자가 제출하면 축하 화면 표시
  useEffect(() => {
    if (hasSubmitted && allSubmitted && !showHighFive) {
      setShowHighFive(true);
      if ('vibrate' in navigator) {
        navigator.vibrate([200, 100, 200]);
      }
    }
  }, [hasSubmitted, allSubmitted, showHighFive]);

  useEffect(() => {
    if (showHighFive && countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else if (showHighFive && countdown === 0) {
      store.clearMatch(user.id);
      onComplete();
    }
  }, [showHighFive, countdown, user.id, onComplete]);

  const handleSubmit = async () => {
    if (newTraits.some(t => t.trim() === '') || isSubmitting) return;

    setIsSubmitting(true);

    try {
      await store.addConnection(
        {
          id: connectionId,
          userIds: allUserIds,
          commonTraits: [...preCommon],
          submittedBy: [],
          individualTraits: {},
          groupSize,
          createdAt: Date.now()
        },
        user.id,
        newTraits.map(t => t.trim())
      );

      if ('vibrate' in navigator) {
        navigator.vibrate([100, 50, 100]);
      }
      setHasSubmitted(true);
      // showHighFive는 모든 파트너가 제출하면 자동으로 설정됨
    } catch (error) {
      console.error('제출 오류:', error);
      setIsSubmitting(false);
    }
  };

  if (showHighFive) {
    return (
      <div className="fixed inset-0 z-[110] bg-gradient-to-br from-orange-400 to-rose-400 flex flex-col items-center justify-center p-10 text-white animate-in zoom-in duration-500">
        <div className="animate-bounce">
          <i className={`fa-solid ${groupSize === 3 ? 'fa-people-group' : 'fa-hands-clapping'} text-[10rem] mb-12 drop-shadow-2xl`}></i>
        </div>
        <h2 className="text-5xl font-black mb-4 text-center">
          {groupSize === 3 ? '트리플 연결!' : '연결 완료!'}
        </h2>
        <p className="text-2xl font-bold mb-16 text-center text-white/90">
          {groupSize === 3 ? '세 명이 함께 하이파이브!' : '신나게 하이파이브!'}
        </p>

        <div className="text-center space-y-6 bg-white/20 p-10 rounded-[3rem] backdrop-blur-xl border border-white/30 shadow-2xl">
          <p className="text-lg font-bold">
            {groupSize === 3 ? '세 사람의 공통점을 찾았습니다.' : '서로의 공통점을 찾았습니다.'}
            <br/>잠시 후 다음 여정을 시작합니다.
          </p>
          <div className="text-8xl font-black tabular-nums scale-110">{countdown}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col space-y-8 animate-in slide-in-from-bottom duration-700">
      {/* 그룹 정보 */}
      <div className={`flex justify-between items-center bg-glass p-6 rounded-[3rem] shadow-xl relative overflow-hidden ${groupSize === 3 ? 'bg-gradient-to-r from-violet-100/30 to-purple-100/30' : ''}`}>
        <div className="absolute inset-0 bg-gradient-to-r from-orange-100/30 to-rose-100/30"></div>

        <div className="text-center flex-1 relative z-10">
          <p className="text-[10px] text-stone-400 mb-2 uppercase font-black tracking-widest">나</p>
          <p className="text-lg font-black text-stone-800">{user.name}</p>
        </div>

        <div className="px-4 relative z-10">
          <div className={`w-12 h-12 ${groupSize === 3 ? 'bg-violet-100' : 'bg-white'} rounded-full flex items-center justify-center shadow-lg`}>
            <i className={`fa-solid ${groupSize === 3 ? 'fa-users' : 'fa-link'} ${groupSize === 3 ? 'text-violet-500' : 'text-orange-500'} text-xl animate-pulse`}></i>
          </div>
        </div>

        {partners.map((partner, idx) => (
          <div key={partner.id} className="text-center flex-1 relative z-10">
            <p className="text-[10px] text-stone-400 mb-2 uppercase font-black tracking-widest">
              파트너 {partners.length > 1 ? idx + 1 : ''}
            </p>
            <p className={`text-lg font-black ${groupSize === 3 ? 'text-violet-600' : 'text-rose-500'}`}>{partner.name}</p>
          </div>
        ))}
      </div>

      {/* 3인 그룹 안내 */}
      {groupSize === 3 && (
        <div className="bg-violet-100 p-4 rounded-2xl text-center">
          <p className="text-violet-700 font-bold text-sm">
            <i className="fa-solid fa-star mr-2"></i>
            세 명이 함께하는 특별한 연결! 1.5배 점수 보너스!
          </p>
        </div>
      )}

      {/* 자동 발견 공통점 */}
      <div className="space-y-4">
        <h3 className="text-center text-xs font-black text-stone-400 uppercase tracking-widest">
          {groupSize === 3 ? '세 사람의 공통점' : '자동 발견 공통점'}
        </h3>
        <div className="flex flex-wrap justify-center gap-2">
          {preCommon.length > 0 ? (
            preCommon.map((t, idx) => (
              <span key={idx} className={`px-5 py-2 ${groupSize === 3 ? 'bg-violet-100 text-violet-600 border-violet-50' : 'bg-orange-100 text-orange-600 border-orange-50'} rounded-full font-black text-xs shadow-sm border`}>
                #{t}
              </span>
            ))
          ) : (
            <div className="text-center py-4 bg-white/40 rounded-[2rem] px-10 border border-white">
              <p className="text-stone-400 italic text-sm">
                {groupSize === 3 ? '세 사람이 함께 이야기하며 공통점을 발굴해보세요!' : '함께 이야기 나누며 공통점을 발굴해보세요!'}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* 개별 작성 안내 */}
      {hasSubmitted ? (
        <div className="flex-1 flex flex-col items-center justify-center space-y-6">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
            <i className="fa-solid fa-check text-4xl text-green-500"></i>
          </div>
          <p className="text-lg font-bold text-stone-600">제출 완료!</p>

          {/* 제출 현황 표시 */}
          <div className="bg-white/60 rounded-2xl p-4 w-full max-w-xs">
            <p className="text-xs text-stone-400 font-bold uppercase tracking-widest mb-3 text-center">
              제출 현황 ({submittedUserIds.length}/{groupSize})
            </p>
            <div className="space-y-2">
              {/* 나 */}
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-stone-600">{user.name} (나)</span>
                <i className="fa-solid fa-check-circle text-green-500"></i>
              </div>
              {/* 파트너들 */}
              {partners.map(partner => (
                <div key={partner.id} className="flex items-center justify-between">
                  <span className="text-sm font-bold text-stone-600">{partner.name}</span>
                  {submittedUserIds.includes(partner.id) ? (
                    <i className="fa-solid fa-check-circle text-green-500"></i>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-stone-400">작성 중</span>
                      <i className="fa-solid fa-spinner animate-spin text-orange-400"></i>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <p className="text-sm text-stone-400 text-center">
            모든 파트너가 제출을 완료하면<br/>함께 다음 단계로 넘어갑니다.
          </p>
        </div>
      ) : (
        <>
          {/* 새로운 공통점 입력 */}
          <div className="space-y-4 flex-1">
            <div className="text-center space-y-2">
              <h3 className={`text-sm font-black ${groupSize === 3 ? 'text-violet-600' : 'text-orange-600'} uppercase tracking-widest`}>
                새로운 연결 고리 찾기
              </h3>
              <p className="text-xs text-stone-400 font-bold">
                {groupSize === 3
                  ? '대화를 통해 세 사람의 공통점 3가지를 기록해주세요!'
                  : '대화를 통해 3가지 공통점을 더 기록해볼까요?'}
              </p>
              <p className="text-xs text-stone-300">
                (각자 따로 작성해도 됩니다. 모든 답변이 기록됩니다.)
              </p>
            </div>
            <div className="space-y-3">
              {newTraits.map((trait, idx) => (
                <div key={idx} className="relative">
                  <span className={`absolute left-6 top-1/2 -translate-y-1/2 ${groupSize === 3 ? 'text-violet-300' : 'text-orange-300'} font-black text-xs`}>
                    {idx + 1}
                  </span>
                  <input
                    type="text"
                    value={trait}
                    onChange={(e) => {
                      const next = [...newTraits];
                      next[idx] = e.target.value;
                      setNewTraits(next);
                    }}
                    placeholder="공통점 발견..."
                    className={`w-full bg-white border border-stone-100 rounded-[1.5rem] py-4 pl-12 pr-6 focus:border-${groupSize === 3 ? 'violet' : 'orange'}-400 focus:outline-none transition-all text-sm font-bold shadow-sm`}
                    disabled={isSubmitting}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* 제출 버튼 */}
          <div className="pb-10">
            <button
              onClick={handleSubmit}
              disabled={newTraits.some(t => t.trim() === '') || isSubmitting}
              className={`w-full py-5 ${groupSize === 3
                ? 'bg-gradient-to-r from-violet-500 to-purple-500 shadow-violet-200'
                : 'bg-gradient-to-r from-orange-500 to-rose-500 shadow-orange-200'} rounded-[2rem] font-black text-lg text-white shadow-xl active:scale-95 disabled:opacity-30 disabled:grayscale transition-all`}
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center gap-2">
                  <i className="fa-solid fa-spinner animate-spin"></i>
                  제출 중...
                </span>
              ) : (
                groupSize === 3 ? '세 사람의 고리 완성' : '우리만의 고리 완성'
              )}
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default MatchingSession;
