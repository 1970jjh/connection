
import React from 'react';
import { User, Room, Connection } from '../types';

interface Props {
  user: User;
  room: Room;
}

const UserHistory: React.FC<Props> = ({ user, room }) => {
  const myConnections = room.connections.filter(c => c.userIds.includes(user.id));

  // 연결된 고유한 사람 수 계산
  const uniquePartnerCount = new Set(
    myConnections.flatMap(c => c.userIds.filter(id => id !== user.id))
  ).size;

  return (
    <div className="flex-1 flex flex-col space-y-8 animate-in fade-in duration-500 overflow-y-auto pb-32">
      <div className="space-y-2">
        <h2 className="text-3xl font-black text-stone-800">연결된 동료들</h2>
        <p className="text-stone-500 font-medium">
          소중한 인연이 벌써 {uniquePartnerCount}명이나 생겼어요!
        </p>
        <div className="flex items-center gap-4 mt-2">
          <span className="px-3 py-1 bg-emerald-100 rounded-full text-emerald-600 text-xs font-bold">
            <i className="fa-solid fa-star mr-1"></i>
            내 점수: {user.score || 0}점
          </span>
          <span className="px-3 py-1 bg-orange-100 rounded-full text-orange-600 text-xs font-bold">
            {myConnections.length}회 연결
          </span>
        </div>
      </div>

      <div className="space-y-5">
        {myConnections.length > 0 ? (
          myConnections.map((conn) => {
            const partnerIds = conn.userIds.filter(id => id !== user.id);
            const partners = partnerIds.map(id => room.users[id]).filter(Boolean);
            const isTriple = conn.groupSize === 3 || partners.length === 2;

            if (partners.length === 0) return null;

            return (
              <div
                key={conn.id}
                className={`bg-glass rounded-[2.5rem] p-8 flex flex-col space-y-6 shadow-lg border-white transition-transform active:scale-[0.98] ${
                  isTriple ? 'ring-2 ring-violet-200' : ''
                }`}
              >
                {/* 그룹 배지 */}
                {isTriple && (
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1 bg-violet-100 rounded-full text-violet-600 text-xs font-bold">
                      <i className="fa-solid fa-users mr-1"></i>
                      트리플 연결 (1.5배 점수!)
                    </span>
                  </div>
                )}

                {/* 파트너 목록 */}
                <div className={`flex ${partners.length > 1 ? 'flex-wrap gap-4' : 'items-center space-x-5'}`}>
                  {partners.map((partner) => (
                    <div key={partner.id} className="flex items-center space-x-4">
                      <div className={`w-14 h-14 ${
                        isTriple
                          ? 'bg-gradient-to-br from-violet-100 to-purple-100'
                          : 'bg-gradient-to-br from-orange-100 to-rose-100'
                        } border-4 border-white rounded-[1.5rem] flex items-center justify-center ${
                          isTriple ? 'text-violet-500' : 'text-orange-500'
                        } font-black text-lg shadow-inner`}
                      >
                        {partner.name[0]}
                      </div>
                      <div>
                        <h3 className="font-black text-stone-800 text-lg">{partner.name}</h3>
                        <p className={`text-[10px] ${isTriple ? 'text-violet-500' : 'text-orange-500'} font-black uppercase tracking-widest`}>
                          {partner.department}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* 공통점 */}
                <div className="space-y-3">
                  <p className="text-[10px] text-stone-400 font-black uppercase tracking-widest">
                    {isTriple ? 'Triple Common Points' : 'Shared Common Points'}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {conn.commonTraits.map((t, idx) => (
                      <span
                        key={idx}
                        className={`px-4 py-2 ${
                          isTriple
                            ? 'bg-violet-50 text-violet-500 border-violet-100'
                            : 'bg-white/60 text-rose-500 border-rose-50'
                        } rounded-2xl text-[11px] font-bold shadow-sm border`}
                      >
                        #{t}
                      </span>
                    ))}
                  </div>
                </div>

                {/* 개별 작성 내역 표시 */}
                {conn.individualTraits && Object.keys(conn.individualTraits).length > 0 && (
                  <div className="pt-4 border-t border-stone-100">
                    <p className="text-[10px] text-stone-300 font-bold uppercase tracking-widest mb-3">
                      개별 작성 내역
                    </p>
                    <div className="space-y-2">
                      {Object.entries(conn.individualTraits).map(([authorId, traits]) => {
                        const author = room.users[authorId];
                        const isMe = authorId === user.id;
                        return (
                          <div key={authorId} className="flex items-start gap-2">
                            <span className={`text-xs font-bold ${isMe ? 'text-emerald-500' : 'text-stone-400'}`}>
                              {isMe ? '나' : author?.name || '?'}:
                            </span>
                            <div className="flex flex-wrap gap-1">
                              {traits.map((t, idx) => (
                                <span key={idx} className="text-xs text-stone-500">
                                  #{t}
                                </span>
                              ))}
                            </div>
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
          <div className="flex flex-col items-center justify-center py-24 space-y-6">
            <div className="w-24 h-24 bg-white/40 rounded-full flex items-center justify-center border border-white">
              <i className="fa-solid fa-face-smile text-6xl text-orange-200"></i>
            </div>
            <div className="text-center space-y-2">
              <p className="text-stone-400 font-bold">아직 발견된 고리가 없어요.</p>
              <p className="text-stone-300 text-sm">
                잠시만 기다려주시면<br/>새로운 동료를 매칭해 드릴게요!
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserHistory;
