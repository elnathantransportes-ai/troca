import React, { useState, useEffect } from 'react';
import { User, Ad } from '../types';
import { getPodiumAds, subscribeToData } from '../services/mockFirebase';
import { Trophy, Star, Shield, VerifiedBadge, MapPin, Zap, Video } from './IconComponents';

interface ChallengeViewProps {
  user: User | null;
}

const renderStars = (rating: number) => {
    const fullStars = Math.floor(rating);
    return (
      <div className="flex gap-0.5">
        {[...Array(5)].map((_, i) => (
          <span key={i} className={`text-xs ${i < fullStars ? 'text-amber-400' : 'text-slate-700'}`}>★</span>
        ))}
      </div>
    );
};

const TopOneCard: React.FC<{ ad: Ad }> = ({ ad }) => (
    <div className="relative group perspective-1000 mb-10 mt-6">
        <div className="absolute inset-0 bg-gradient-to-t from-amber-500 via-yellow-400 to-amber-600 rounded-[3rem] blur-xl opacity-40 group-hover:opacity-60 transition-opacity animate-pulse"></div>
        
        <div className="relative bg-gradient-to-b from-[#1a1500] to-black border-2 border-amber-500 rounded-[3rem] overflow-hidden shadow-[0_0_50px_rgba(251,191,36,0.2)]">
            {/* Medal Header */}
            <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-b from-amber-500/20 to-transparent z-10 flex justify-center pt-4">
                <div className="flex items-center gap-2 bg-amber-500 text-black px-6 py-2 rounded-full font-black uppercase text-[10px] tracking-widest shadow-lg shadow-amber-500/50">
                    <Trophy className="w-4 h-4" /> 1º Lugar Ouro
                </div>
            </div>

            {/* Video Content */}
            <div className="aspect-[4/5] relative">
                {ad.videoUrl ? (
                  <video src={ad.videoUrl} autoPlay muted loop playsInline className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                ) : (
                  <img src={ad.imageUrl} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent"></div>
                
                <div className="absolute bottom-0 left-0 right-0 p-8 space-y-3">
                    <div className="flex items-center gap-2">
                       <h3 className="text-2xl font-black text-white italic uppercase leading-none drop-shadow-md">{ad.title}</h3>
                       {ad.isHighlight && <Zap className="w-5 h-5 text-amber-400 animate-bounce" />}
                    </div>
                    
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <img src={ad.ownerAvatar} className="w-10 h-10 rounded-full border-2 border-amber-500" />
                            <div className="flex flex-col">
                                <span className="text-xs font-bold text-white flex items-center gap-1">
                                    {ad.ownerName} {ad.ownerVerified && <VerifiedBadge className="w-3 h-3 text-blue-400" />}
                                </span>
                                <span className="text-[9px] font-black text-amber-500 uppercase flex items-center gap-1">
                                    <MapPin className="w-3 h-3" /> {ad.ownerRegion}
                                </span>
                            </div>
                        </div>
                        <div className="text-right">
                            <span className="text-3xl font-black text-amber-400">{ad.rating.toFixed(1)}</span>
                            {renderStars(ad.rating)}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
);

const PodiumCard: React.FC<{ ad: Ad, rank: number }> = ({ ad, rank }) => {
    const isSilver = rank === 2;
    const theme = isSilver 
      ? { border: 'border-slate-300', text: 'text-slate-300', bg: 'bg-slate-300', gradient: 'from-slate-700 to-slate-900', shadow: 'shadow-slate-500/20' }
      : { border: 'border-orange-700', text: 'text-orange-400', bg: 'bg-orange-700', gradient: 'from-orange-900 to-black', shadow: 'shadow-orange-700/20' };

    return (
      <div className={`relative flex items-center p-4 rounded-[2.5rem] border ${theme.border} bg-black overflow-hidden mb-4 group`}>
          {/* Rank Number */}
          <div className={`absolute -left-2 top-0 bottom-0 w-16 bg-gradient-to-r ${theme.gradient} flex items-center justify-center font-black text-2xl italic text-white z-0 skew-x-[-10deg]`}>
              <span className="skew-x-[10deg]">{rank}</span>
          </div>

          <div className="flex-1 ml-16 flex items-center justify-between relative z-10 pl-4">
              <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl overflow-hidden border border-white/10 relative shadow-lg">
                      {ad.videoUrl ? (
                           <video src={ad.videoUrl} muted loop playsInline className="w-full h-full object-cover" />
                      ) : (
                           <img src={ad.imageUrl} className="w-full h-full object-cover" />
                      )}
                  </div>
                  <div>
                      <h4 className="font-black text-white uppercase italic text-sm leading-tight line-clamp-1">{ad.title}</h4>
                      <div className="flex items-center gap-1 mt-1">
                          <img src={ad.ownerAvatar} className="w-4 h-4 rounded-full" />
                          <span className="text-[9px] text-slate-400 font-bold uppercase truncate max-w-[100px]">{ad.ownerName}</span>
                      </div>
                  </div>
              </div>

              <div className="text-right">
                  <span className={`text-xl font-black ${theme.text}`}>{ad.rating.toFixed(1)}</span>
                  <span className="text-[8px] font-black text-slate-600 uppercase block">Score</span>
              </div>
          </div>
          
          {/* Highlight Shine */}
          <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
      </div>
    );
};

const StandardRankCard: React.FC<{ ad: Ad, rank: number }> = ({ ad, rank }) => (
    <div className="flex items-center p-4 rounded-3xl bg-[#0f172a] border border-white/5 mb-3 hover:bg-white/5 transition-colors">
        <span className="font-black text-slate-600 text-lg w-8 text-center">{rank}</span>
        <div className="w-10 h-10 rounded-xl bg-black overflow-hidden border border-white/10 mx-3">
           {ad.videoUrl ? (
             <video src={ad.videoUrl} className="w-full h-full object-cover opacity-60" />
           ) : (
             <img src={ad.imageUrl} className="w-full h-full object-cover opacity-60" />
           )}
        </div>
        <div className="flex-1 min-w-0">
           <p className="text-xs font-bold text-white truncate uppercase">{ad.title}</p>
           <p className="text-[9px] text-slate-500 uppercase">{ad.ownerRegion}</p>
        </div>
        <div className="text-right pl-2">
           <span className="text-sm font-black text-indigo-400">{ad.rating.toFixed(1)}</span>
        </div>
    </div>
);

const ChallengeView: React.FC<ChallengeViewProps> = ({ user }) => {
  const [podiumAds, setPodiumAds] = useState<Ad[]>([]);
  const [userRank, setUserRank] = useState<number | null>(null);

  useEffect(() => {
    refreshPodium();
    const unsubscribe = subscribeToData(refreshPodium);
    return () => unsubscribe();
  }, [user]);

  const refreshPodium = () => {
      const ads = getPodiumAds();
      setPodiumAds(ads);

      if (user) {
          // Check if user is in top 7
          const rank = ads.findIndex(a => a.ownerId === user.id);
          if (rank !== -1) {
              setUserRank(rank + 1);
          } else {
              setUserRank(null);
          }
      }
  };

  return (
    <div className="animate-in fade-in pb-44 bg-[#020617] min-h-full">
      {/* Header */}
      <div className="pt-12 px-6 text-center space-y-2">
          <h1 className="text-5xl font-black italic uppercase tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-amber-100 via-amber-400 to-amber-600 drop-shadow-2xl">
            PODIUM
          </h1>
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em]">Top 7 Anúncios da Semana</p>
      </div>

      <div className="p-6 max-w-xl mx-auto">
          {podiumAds.length > 0 ? (
              <>
                  {podiumAds[0] && <TopOneCard ad={podiumAds[0]} />}
                  
                  <div className="space-y-1">
                      {podiumAds.slice(1, 3).map((ad, idx) => (
                          <PodiumCard key={ad.id} ad={ad} rank={idx + 2} />
                      ))}
                  </div>

                  <div className="mt-8 space-y-1">
                      <p className="text-[10px] text-slate-600 font-bold uppercase tracking-widest px-2 mb-2">Honra ao Mérito</p>
                      {podiumAds.slice(3, 7).map((ad, idx) => (
                          <StandardRankCard key={ad.id} ad={ad} rank={idx + 4} />
                      ))}
                  </div>
              </>
          ) : (
              <div className="text-center py-20 opacity-40">
                  <Trophy className="w-20 h-20 mx-auto text-slate-700 mb-4" />
                  <p className="text-xs font-black uppercase text-slate-500">Ranking sendo calculado...</p>
              </div>
          )}

          {/* User Rank Sticky Bar */}
          {user && !userRank && (
              <div className="fixed bottom-24 left-6 right-6 max-w-xl mx-auto bg-slate-900/90 backdrop-blur-md border-t border-indigo-500/50 p-4 rounded-2xl shadow-2xl flex items-center justify-between z-20 animate-in slide-in-from-bottom-10">
                  <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-black rounded-full flex items-center justify-center font-black text-slate-500 text-xs border border-white/10">
                          -
                      </div>
                      <div>
                          <p className="text-[10px] font-black text-indigo-400 uppercase">Você ainda não está no Top 7</p>
                          <p className="text-[9px] text-slate-400">Impulsione seus anúncios para subir!</p>
                      </div>
                  </div>
                  <button className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest shadow-lg active:scale-95">
                      Subir Ranking 🚀
                  </button>
              </div>
          )}
      </div>

      <div className="mt-12 p-8 text-center opacity-40">
           <Shield className="w-8 h-8 mx-auto text-slate-600 mb-2" />
           <p className="text-[8px] font-black text-slate-600 uppercase tracking-widest max-w-[200px] mx-auto">
               Ranking atualizado em tempo real baseado em avaliações, visualizações e destaque.
           </p>
      </div>
    </div>
  );
};

export default ChallengeView;