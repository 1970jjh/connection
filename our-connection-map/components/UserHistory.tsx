
import React from 'react';
import { User, Room, Connection } from '../types';

interface Props {
  user: User;
  room: Room;
}

const UserHistory: React.FC<Props> = ({ user, room }) => {
  const myConnections = room.connections.filter(c => c.userIds.includes(user.id));

  return (
    <div className="flex-1 flex flex-col space-y-8 animate-in fade-in duration-500 overflow-y-auto pb-32">
      <div className="space-y-2">
        <h2 className="text-3xl font-black text-stone-800">연결된 동료들</h2>
        <p className="text-stone-500 font-medium">소중한 인연이 벌써 {myConnections.length}명이나 생겼어요!</p>
      </div>

      <div className="space-y-5">
        {myConnections.length > 0 ? (
          myConnections.map((conn) => {
            const partnerId = conn.userIds.find(id => id !== user.id);
            const partner = room.users[partnerId!];
            
            if (!partner) return null;

            return (
              <div key={conn.id} className="bg-glass rounded-[2.5rem] p-8 flex flex-col space-y-6 shadow-lg border-white transition-transform active:scale-[0.98]">
                <div className="flex items-center space-x-5">
                  <div className="w-16 h-16 bg-gradient-to-br from-orange-100 to-rose-100 border-4 border-white rounded-[1.5rem] flex items-center justify-center text-orange-500 font-black text-xl shadow-inner">
                    {partner.name[0]}
                  </div>
                  <div>
                    <h3 className="font-black text-stone-800 text-xl">{partner.name}</h3>
                    <p className="text-[10px] text-orange-500 font-black uppercase tracking-widest">{partner.department}</p>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <p className="text-[10px] text-stone-400 font-black uppercase tracking-widest">Shared Common Points</p>
                  <div className="flex flex-wrap gap-2">
                    {conn.commonTraits.map((t, idx) => (
                      <span key={idx} className="px-4 py-2 bg-white/60 rounded-2xl text-[11px] font-bold text-rose-500 shadow-sm border border-rose-50">
                        #{t}
                      </span>
                    ))}
                  </div>
                </div>
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
                <p className="text-stone-300 text-sm">잠시만 기다려주시면<br/>새로운 동료를 매칭해 드릴게요!</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserHistory;
