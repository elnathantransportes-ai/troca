import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Ad, User } from '../types';
import { toggleLike, isAdLiked } from '../services/mockFirebase';
import { Video, Zap, Star, DollarSign, MapPin, Share2, Sparkles, MoreVertical, AlertCircle, Play, Loader2 } from './IconComponents';

const useElementOnScreen = (options: IntersectionObserverInit, forceLoad: boolean = false): [React.RefObject<HTMLDivElement | null>, boolean, boolean] => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(forceLoad);
  const [hasLoaded, setHasLoaded] = useState(forceLoad);

  useEffect(() => {
    if (forceLoad) return; 

    const observer = new IntersectionObserver((entries) => {
      const [entry] = entries;
      setIsVisible(entry.isIntersecting);
      if (entry.isIntersecting) {
          setHasLoaded(true);
      }
    }, options);

    if (containerRef.current) observer.observe(containerRef.current);

    return () => {
      if (containerRef.current) observer.unobserve(containerRef.current);
    };
  }, [containerRef, options, forceLoad]);

  return [containerRef, isVisible, hasLoaded];
};

interface FeedItemProps {
  ad: Ad;
  onProposal: (ad: Ad) => void;
  currentUser: User | null;
  index?: number; 
}

const FeedItem: React.FC<FeedItemProps> = ({ ad, onProposal, currentUser, index = 0 }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const shouldForceLoad = index < 1; 
  const [containerRef, isVisible, hasLoaded] = useElementOnScreen({ root: null, rootMargin: "200px", threshold: 0.4 }, shouldForceLoad);
  
  // Videos precisam começar mutados para autoplay funcionar em navegadores modernos
  const [muted, setMuted] = useState(true); 
  const [paused, setPaused] = useState(false);
  const [isVideoReady, setIsVideoReady] = useState(false); 
  const [progress, setProgress] = useState(0);
  const [liked, setLiked] = useState(currentUser ? isAdLiked(ad.id, currentUser.id) : false);
  const [showHeart, setShowHeart] = useState(false);
  const [showPlayIcon, setShowPlayIcon] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const lastTap = useRef<number>(0);

  // Fallback seguro para imagem de capa
  const posterImage = useMemo(() => {
      // Se a imagem for um blob de vídeo ou string vazia, usa o avatar como fallback
      const isVideo = ad.imageUrl && (ad.imageUrl.includes('.mp4') || ad.imageUrl.includes('blob:'));
      return isVideo || !ad.imageUrl ? ad.ownerAvatar : ad.imageUrl;
  }, [ad.imageUrl, ad.ownerAvatar]);

  // Autoplay Logic
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (isVisible && !paused && hasLoaded) {
        video.muted = true; // Força mudo
        const playPromise = video.play();
        if (playPromise !== undefined) {
            playPromise.catch((err) => {
                console.warn("Autoplay bloqueado pelo navegador:", err);
                setPaused(true);
                setShowPlayIcon(true);
            });
        }
    } else {
        video.pause();
    }
  }, [isVisible, paused, hasLoaded]);

  const handleTimeUpdate = () => {
      if (videoRef.current) {
          const current = videoRef.current.currentTime;
          const duration = videoRef.current.duration;
          if (duration > 0) {
              setProgress((current / duration) * 100);
          }
          if (!isVideoReady && current > 0.1) setIsVideoReady(true);
      }
  };

  const handleInteraction = (e: React.MouseEvent | React.TouchEvent) => {
    const now = Date.now();
    if (now - lastTap.current < 300) {
        handleLike();
    } else {
        togglePlay();
    }
    lastTap.current = now;
  };

  const togglePlay = () => {
      if (videoRef.current) {
          if (videoRef.current.paused) {
              videoRef.current.play();
              setPaused(false);
              setShowPlayIcon(false);
          } else {
              videoRef.current.pause();
              setPaused(true);
              setShowPlayIcon(true);
          }
      }
  };

  const handleLike = () => {
      if (!currentUser) return;
      setLiked(prev => !prev);
      toggleLike(ad.id, currentUser.id);
      setShowHeart(true);
      setTimeout(() => setShowHeart(false), 1000);
  };

  const handleShare = async () => {
      if (navigator.share) {
          try { await navigator.share({ title: ad.title, text: `Olha isso: ${ad.title}`, url: window.location.href }); } catch (e) {}
      } else {
          navigator.clipboard.writeText(`${ad.title}`);
          alert("Link copiado!");
      }
  };

  return (
    <div ref={containerRef} className="relative w-full h-full bg-black overflow-hidden select-none snap-start">
        
        {/* VIDEO CONTAINER */}
        <div className="absolute inset-0 flex items-center justify-center bg-black z-0">
            {/* 1. LAYER DE CARREGAMENTO / POSTER */}
            {/* Fica visível até o video estar pronto (isVideoReady) */}
            <div className={`absolute inset-0 flex items-center justify-center z-10 bg-black transition-opacity duration-500 ${isVideoReady ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
                {/* Imagem de fundo borrada para preencher espaço */}
                <div 
                    className="absolute inset-0 bg-cover bg-center opacity-30 blur-xl"
                    style={{ backgroundImage: `url(${posterImage})` }}
                ></div>
                
                {/* Imagem principal centralizada */}
                <img 
                    src={posterImage} 
                    className="w-full h-full object-contain relative z-10" 
                    alt="Loading"
                />
                <Loader2 className="absolute z-20 w-10 h-10 text-white/50 animate-spin" />
            </div>

            {/* 2. VIDEO PLAYER */}
            {(hasLoaded || shouldForceLoad) && ad.videoUrl && (
                <video 
                    ref={videoRef}
                    src={ad.videoUrl} 
                    className="w-full h-full max-w-full max-h-full object-contain z-0"
                    loop 
                    muted={muted}
                    playsInline
                    webkit-playsinline="true"
                    preload="auto"
                    onTimeUpdate={handleTimeUpdate}
                    onLoadedData={() => setIsVideoReady(true)}
                    onClick={handleInteraction}
                />
            )}
        </div>

        {/* --- UI OVERLAYS (z-index 30+) --- */}
        
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/90 pointer-events-none z-30" />

        {/* Animações de Like/Play */}
        <div className="absolute inset-0 z-40 pointer-events-none flex items-center justify-center">
            {showHeart && <div className="text-8xl animate-bounce drop-shadow-2xl">❤️</div>}
            {showPlayIcon && <div className="bg-black/50 p-6 rounded-full backdrop-blur-md"><Play className="w-12 h-12 text-white fill-white" /></div>}
        </div>

        {/* Botão de Som */}
        <div className="absolute top-24 right-4 z-50">
            <button onClick={() => setMuted(!muted)} className="w-10 h-10 rounded-full flex items-center justify-center bg-black/40 backdrop-blur border border-white/10 text-white shadow-lg">
                {muted ? "🔇" : "🔊"}
            </button>
        </div>

        {/* Info Panel */}
        <div className="absolute bottom-32 left-4 right-20 z-50 text-left pointer-events-none">
            <div className="space-y-2">
                <div className="flex flex-wrap gap-2">
                    {ad.isHighlight && <span className="bg-amber-500 text-black text-[9px] font-black px-2 py-1 rounded-md uppercase animate-pulse"><Zap className="w-3 h-3 inline" /> Destaque</span>}
                    <span className="bg-blue-600/90 text-white text-[9px] font-black px-2 py-1 rounded-md uppercase">{ad.type === 'TRADE' ? 'Troca' : 'Venda'}</span>
                </div>
                
                <h2 className="text-2xl font-black text-white uppercase italic tracking-tighter drop-shadow-lg line-clamp-2">{ad.title}</h2>
                
                <div className="flex items-center gap-2">
                    <span className="text-green-400 font-black text-lg drop-shadow-md">R$ {ad.value}</span>
                    <span className="text-[10px] text-slate-300 font-bold uppercase bg-white/10 px-2 py-1 rounded-lg backdrop-blur-sm"><MapPin className="w-3 h-3 inline mr-1"/> {ad.ownerRegion}</span>
                </div>

                <div className="flex items-center gap-2 mt-1">
                    <div className="w-6 h-6 rounded-full border border-white bg-slate-800 overflow-hidden"><img src={ad.ownerAvatar} className="w-full h-full object-cover" /></div>
                    <span className="text-[10px] font-bold text-white uppercase">{ad.ownerName}</span>
                </div>
            </div>
        </div>

        {/* Action Sidebar */}
        <div className="absolute bottom-32 right-2 z-50 flex flex-col gap-4 items-center w-14">
            <div className="relative" onClick={(e) => { e.stopPropagation(); /* Go to Profile */ }}>
                <div className="w-12 h-12 rounded-full border-2 border-white p-0.5 bg-black"><img src={ad.ownerAvatar} className="w-full h-full rounded-full object-cover" /></div>
                <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 bg-indigo-500 rounded-full w-4 h-4 flex items-center justify-center text-[10px] text-white font-bold">+</div>
            </div>

            <button onClick={(e) => { e.stopPropagation(); handleLike(); }} className="flex flex-col items-center gap-1">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${liked ? 'bg-red-500/20 text-red-500' : 'bg-black/40 text-white'}`}>
                    <Star className={`w-6 h-6 ${liked ? 'fill-current' : ''}`} />
                </div>
                <span className="text-[9px] font-bold text-white">{ad.likes}</span>
            </button>
            
            <button onClick={(e) => { e.stopPropagation(); onProposal(ad); }} className="flex flex-col items-center gap-1">
                <div className="w-12 h-12 rounded-full bg-green-500 flex items-center justify-center shadow-lg animate-pulse hover:scale-110 transition-transform">
                    <DollarSign className="w-6 h-6 text-black fill-current" />
                </div>
                <span className="text-[8px] font-black text-green-400">NEGOCIAR</span>
            </button>

            <button onClick={(e) => { e.stopPropagation(); handleShare(); }} className="w-10 h-10 rounded-full bg-black/40 flex items-center justify-center text-white">
                <Share2 className="w-5 h-5" />
            </button>
        </div>

        {/* Progress Bar */}
        <div className="absolute bottom-0 left-0 w-full h-1 bg-white/10 z-50">
            <div className="h-full bg-red-500 transition-all duration-200" style={{ width: `${progress}%` }}></div>
        </div>
    </div>
  );
};

export default React.memo(FeedItem, (prev, next) => {
    return prev.ad.id === next.ad.id && prev.currentUser?.id === next.currentUser?.id;
});