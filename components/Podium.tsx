import React from 'react';
import { useStore } from '../services/mockStore';
import { Trophy, Medal, Crown, User as UserIcon } from 'lucide-react';

export const Podium: React.FC = () => {
  const { users } = useStore();

  // Sort logic: reputation + trades. Filter out potential broken users.
  const sortedUsers = [...users]
    .filter(u => u && u.name) // Safety check
    .sort((a, b) => ((b.reputation || 0) + (b.tradesCompleted || 0) * 5) - ((a.reputation || 0) + (a.tradesCompleted || 0) * 5))
    .slice(0, 10);

  const [first, second, third, ...rest] = sortedUsers;

  const renderPodiumStep = (user: typeof users[0], place: number, height: string, color: string, icon: React.ReactNode) => {
    if (!user) return null;
    return (
        <div className="flex flex-col items-center z-10 mx-1 md:mx-4">
        <div className="mb-2 relative">
            <div className={`rounded-full border-4 object-cover shadow-lg overflow-hidden bg-slate-800 ${place === 1 ? 'w-20 h-20 border-yellow-400' : place === 2 ? 'w-16 h-16 border-gray-300' : 'w-16 h-16 border-amber-600'}`}>
                <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" />
            </div>
            <div className="absolute -top-3 -right-3 bg-white rounded-full p-1 shadow">
                {icon}
            </div>
        </div>
        <div className="text-center mb-1 max-w-[80px]">
            <p className="font-bold text-white text-xs truncate w-full">{user.name.split(' ')[0]}</p>
            <p className="text-white/60 text-[9px] font-bold">{user.reputation} pts</p>
        </div>
        <div className={`w-20 md:w-24 ${height} ${color} rounded-t-xl shadow-2xl flex items-end justify-center pb-4 text-white font-black text-3xl opacity-90 backdrop-blur-sm border-t border-white/20`}>
            {place}
        </div>
        </div>
    );
  };

  return (
    <div className="pb-24 bg-[#020617] min-h-full">
      {/* Top Section Gradient */}
      <div className="bg-gradient-to-b from-indigo-900 via-indigo-800 to-[#020617] pt-8 pb-4 px-4 rounded-b-[3rem] shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
        
        <h2 className="text-3xl font-black text-center text-white mb-1 flex items-center justify-center gap-2 italic tracking-tighter">
            <Trophy className="text-yellow-400 w-8 h-8"/> PODIUM
        </h2>
        <p className="text-center text-indigo-200 text-[10px] font-bold uppercase tracking-[0.3em] mb-8 opacity-70">Ranking Semanal</p>
        
        {sortedUsers.length > 0 ? (
            <div className="flex justify-center items-end mt-4 mb-0">
            {/* Second Place */}
            {second ? renderPodiumStep(second, 2, 'h-28', 'bg-gradient-to-b from-slate-300 to-slate-500', <Medal className="w-4 h-4 text-slate-700 fill-slate-300"/>) : <div className="w-24"></div>}
            
            {/* First Place */}
            {first ? renderPodiumStep(first, 1, 'h-36', 'bg-gradient-to-b from-yellow-300 to-yellow-600', <Crown className="w-6 h-6 text-yellow-800 fill-yellow-400"/>) : <div className="w-24"></div>}
            
            {/* Third Place */}
            {third ? renderPodiumStep(third, 3, 'h-20', 'bg-gradient-to-b from-amber-600 to-amber-800', <Medal className="w-4 h-4 text-amber-900 fill-amber-700"/>) : <div className="w-24"></div>}
            </div>
        ) : (
            <div className="py-12 text-center">
                <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
                    <Trophy className="w-8 h-8 text-white/20" />
                </div>
                <p className="text-white/40 text-xs font-bold uppercase tracking-widest">Ranking Iniciando...</p>
                <p className="text-white/20 text-[9px] mt-1">Seja o primeiro a negociar!</p>
            </div>
        )}
      </div>

      {/* Rewards Info */}
      {sortedUsers.length > 0 && (
          <div className="px-4 -mt-4 relative z-20">
            <div className="bg-[#0f172a] border border-white/10 rounded-2xl shadow-xl p-4 grid grid-cols-3 gap-2 text-center text-[10px] divide-x divide-white/5">
            <div>
                <span className="block font-black text-yellow-400 text-lg">1º</span>
                <span className="text-slate-400 uppercase font-bold">Premium Grátis</span>
            </div>
            <div>
                <span className="block font-black text-slate-300 text-lg">2º</span>
                <span className="text-slate-400 uppercase font-bold">Destaque 7h</span>
            </div>
            <div>
                <span className="block font-black text-amber-600 text-lg">3º</span>
                <span className="text-slate-400 uppercase font-bold">Destaque 24h</span>
            </div>
            </div>
        </div>
      )}

      {/* List */}
      <div className="px-4 mt-6 space-y-3">
        {rest.map((user, idx) => (
          <div key={user.id} className="bg-[#0f172a] rounded-2xl p-4 shadow-md flex items-center gap-4 border border-white/5 hover:border-indigo-500/30 transition-colors">
            <span className="font-black text-slate-600 w-6 text-center text-lg">{idx + 4}</span>
            <div className="w-10 h-10 rounded-full bg-slate-800 overflow-hidden border border-white/10">
                <img src={user.avatarUrl} alt="" className="w-full h-full object-cover" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-white text-sm truncate">{user.name}</p>
              <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-[9px] text-slate-500 font-bold uppercase bg-white/5 px-2 py-0.5 rounded">{user.tradesCompleted} trocas</span>
              </div>
            </div>
            <div className="text-right">
                <span className="block font-black text-indigo-400 text-sm">{user.reputation}</span>
                <span className="text-[8px] text-slate-600 font-bold uppercase">Pontos</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};