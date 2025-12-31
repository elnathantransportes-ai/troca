import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Ad, Proposal, User, AdType, ProductCondition } from '../types';
import { getAds, sendProposal, subscribeToData, rateAd } from '../services/mockFirebase';
import { paymentService, PixResponse } from '../services/paymentService';
import { MapPin, Zap, Search, Star, Radar, DollarSign, Shield, Loader2, Check, Filter, Sparkles, Lock, Video, RefreshCcw } from './IconComponents';
import FeedItem from './FeedItem';
import { FeedItemSkeleton } from './Skeleton';
import Confetti from './Confetti';

interface CatalogoViewProps {
  user: User | null;
}

const PAGE_SIZE = 5;

// Radar View Component (Visualização Alternativa)
const RadarView: React.FC<{ items: Ad[], onSelect: (ad: Ad) => void }> = ({ items, onSelect }) => {
    return (
        <div className="h-full w-full bg-[#020617] flex items-center justify-center relative overflow-hidden animate-in fade-in duration-700">
            <div className="absolute inset-0 flex items-center justify-center opacity-20 pointer-events-none">
                <div className="w-[80vw] h-[80vw] border border-green-500 rounded-full animate-pulse"></div>
                <div className="w-[60vw] h-[60vw] border border-green-500 rounded-full absolute"></div>
                <div className="w-[40vw] h-[40vw] border border-green-500 rounded-full absolute"></div>
                <div className="absolute w-full h-[2px] bg-green-500/50 animate-[spin_4s_linear_infinite]"></div>
            </div>
            <div className="w-4 h-4 bg-blue-500 rounded-full shadow-[0_0_15px_#3b82f6] z-20 relative">
                <div className="absolute inset-0 bg-blue-500 rounded-full animate-ping opacity-50"></div>
            </div>
            {items.slice(0, 15).map((item, idx) => {
                const angle = (idx * 137.5) * (Math.PI / 180); 
                const distance = 20 + (idx % 4) * 15; 
                const top = 50 + Math.sin(angle) * distance;
                const left = 50 + Math.cos(angle) * distance;
                return (
                    <button
                        key={item.id}
                        onClick={() => onSelect(item)}
                        className="absolute w-8 h-8 rounded-full border-2 border-white/50 bg-black/50 overflow-hidden hover:scale-150 hover:z-50 transition-all shadow-[0_0_10px_rgba(255,255,255,0.3)] z-10"
                        style={{ top: `${top}%`, left: `${left}%` }}
                    >
                        <img src={item.imageUrl || item.ownerAvatar} className="w-full h-full object-cover" />
                    </button>
                );
            })}
            <div className="absolute bottom-24 bg-black/60 backdrop-blur px-4 py-2 rounded-full text-[10px] font-black uppercase text-green-400 border border-green-500/30 flex items-center gap-2">
                <Radar className="w-3 h-3 animate-spin" /> Escaneando Área
            </div>
        </div>
    );
};

const CatalogoView: React.FC<CatalogoViewProps> = ({ user }) => {
  // State Basics
  const [searchTerm, setSearchTerm] = useState('');
  const [allAds, setAllAds] = useState<Ad[]>([]);
  const [displayedAds, setDisplayedAds] = useState<Ad[]>([]);
  const [selectedAd, setSelectedAd] = useState<Ad | null>(null);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'LIST' | 'RADAR'>('LIST');
  
  // Pagination
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  // Payment & Interaction
  const [paymentStep, setPaymentStep] = useState<'NONE' | 'PROCESSING' | 'QRCODE' | 'SUCCESS'>('NONE');
  const [pixData, setPixData] = useState<PixResponse | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [proposalRating, setProposalRating] = useState(5);

  // Filters State
  const [showFilters, setShowFilters] = useState(false);
  const [filterType, setFilterType] = useState<AdType | 'ALL'>('ALL');
  const [filterMinPrice, setFilterMinPrice] = useState('');
  const [filterMaxPrice, setFilterMaxPrice] = useState('');
  const [filterCategory, setFilterCategory] = useState('ALL');
  const [filterCondition, setFilterCondition] = useState<ProductCondition | 'ALL'>('ALL');
  const [filterRegion, setFilterRegion] = useState('');

  const pollingRef = useRef<number | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Load Filters from LocalStorage on Mount
  useEffect(() => {
      const savedFilters = localStorage.getItem('tt_filters');
      if (savedFilters) {
          try {
              const parsed = JSON.parse(savedFilters);
              setFilterType(parsed.filterType || 'ALL');
              setFilterCategory(parsed.filterCategory || 'ALL');
              setFilterCondition(parsed.filterCondition || 'ALL');
              setFilterRegion(parsed.filterRegion || '');
              if (parsed.filterMinPrice) setFilterMinPrice(parsed.filterMinPrice);
              if (parsed.filterMaxPrice) setFilterMaxPrice(parsed.filterMaxPrice);
          } catch (e) { console.error("Error loading filters", e); }
      }
  }, []);

  // Save Filters to LocalStorage on Change
  useEffect(() => {
      const filters = { filterType, filterCategory, filterCondition, filterRegion, filterMinPrice, filterMaxPrice };
      localStorage.setItem('tt_filters', JSON.stringify(filters));
  }, [filterType, filterCategory, filterCondition, filterRegion, filterMinPrice, filterMaxPrice]);

  const calculateAdScore = useCallback((ad: Ad) => {
      let score = 0;
      if (ad.isHighlight) score += 5000;
      if (user?.cidade && ad.ownerRegion && ad.ownerRegion.toLowerCase().includes(user.cidade.toLowerCase())) {
          score += 2000;
      }
      score += (ad.rating || 0) * 500;
      score += (ad.likes || 0) * 10;
      score += (ad.views || 0) * 1;
      const hoursSinceCreation = (Date.now() - ad.createdAt) / (1000 * 60 * 60);
      score -= hoursSinceCreation * 2;
      return score;
  }, [user]);

  const processAds = useCallback((adsData: Ad[]) => {
      const term = searchTerm.toLowerCase();
      const filtered = adsData.filter(ad => {
        const matchesSearch = 
          ad.title.toLowerCase().includes(term) ||
          (ad.description && ad.description.toLowerCase().includes(term)) ||
          (ad.tradeInterest && ad.tradeInterest.toLowerCase().includes(term)) ||
          (ad.category && ad.category.toLowerCase().includes(term));
        
        const matchesType = filterType === 'ALL' || ad.type === filterType || ad.type === 'BOTH';
        const matchesCondition = filterCondition === 'ALL' || ad.condition === filterCondition;
        const matchesCategory = filterCategory === 'ALL' || ad.category === filterCategory;
        const matchesRegion = !filterRegion || (ad.ownerRegion && ad.ownerRegion.toLowerCase().includes(filterRegion.toLowerCase()));
        const min = filterMinPrice ? parseFloat(filterMinPrice) : 0;
        const max = filterMaxPrice ? parseFloat(filterMaxPrice) : Infinity;
        const matchesPrice = ad.value >= min && ad.value <= max;

        return matchesSearch && matchesType && matchesPrice && matchesCategory && matchesCondition && matchesRegion;
      });
      return filtered.sort((a, b) => calculateAdScore(b) - calculateAdScore(a));
  }, [searchTerm, filterType, filterMinPrice, filterMaxPrice, filterCategory, filterCondition, filterRegion, calculateAdScore]);

  useEffect(() => {
    const rawAds = getAds('ACTIVE');
    const processed = processAds(rawAds);
    setAllAds(processed);
    setDisplayedAds(processed.slice(0, PAGE_SIZE));
    setPage(1);
    setHasMore(processed.length > PAGE_SIZE);
    setLoading(false);

    const unsubscribe = subscribeToData(() => { 
        const updatedRaw = getAds('ACTIVE');
        const updatedProcessed = processAds(updatedRaw);
        setAllAds(updatedProcessed);
        setDisplayedAds(prev => updatedProcessed.slice(0, Math.max(prev.length, PAGE_SIZE)));
    });
    return () => unsubscribe();
  }, [processAds]); 

  const handleScroll = () => {
      if (!scrollContainerRef.current) return;
      const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
      if (scrollHeight - scrollTop <= clientHeight + 300 && hasMore) {
          loadMoreItems();
      }
  };

  const loadMoreItems = () => {
      const nextCount = (page + 1) * PAGE_SIZE;
      if (displayedAds.length < allAds.length) {
          setDisplayedAds(allAds.slice(0, nextCount));
          setPage(p => p + 1);
          setHasMore(allAds.length > nextCount);
      } else {
          setHasMore(false);
      }
  };

  useEffect(() => {
      return () => { if (pollingRef.current) clearInterval(pollingRef.current); };
  }, []);

  const handleInitiateProposal = async () => {
    if (!user || !selectedAd) return;
    if (selectedAd.ownerId === user.id) {
      alert("Você não pode ofertar no seu próprio item.");
      return;
    }
    if (user.plan === 'PREMIUM') executeProposalSubmission();
    else startPaymentFlow();
  };

  const startPaymentFlow = async () => {
      if (!user) return;
      setPaymentStep('PROCESSING');
      try {
          const response = await paymentService.createPixPayment(0.49, "Taxa de Negociação - Troca Troca", user.email, user.name, user.cpf || '00000000000');
          setPixData(response);
          setPaymentStep('QRCODE');
          startPolling(response.id);
      } catch (e) {
          alert("Erro ao gerar pagamento.");
          setPaymentStep('NONE');
      }
  };

  const startPolling = (paymentId: number) => {
    if (pollingRef.current) clearInterval(pollingRef.current);
    pollingRef.current = window.setInterval(async () => checkStatus(paymentId, false), 5000);
  };

  const checkStatus = async (paymentId: number, manual: boolean) => {
      const status = await paymentService.checkPaymentStatus(paymentId);
      if (status === 'approved') { 
        if (pollingRef.current) clearInterval(pollingRef.current);
        setPaymentStep('SUCCESS');
        setShowConfetti(true);
        setTimeout(() => executeProposalSubmission(), 1500);
      } else if (manual) {
          alert("Pagamento ainda não confirmado.");
      }
  };

  const executeProposalSubmission = async () => {
    if (!user || !selectedAd) return;
    setIsProcessing(true);
    try {
      const proposal: Proposal = {
        id: `prop_${Date.now()}`,
        adId: selectedAd.id,
        adTitle: selectedAd.title,
        adOwnerId: selectedAd.ownerId,
        bidderId: user.id,
        bidderName: user.name,
        message: "Olá! Vi seu anúncio no Explorer e tenho interesse. Taxa de conexão paga.",
        status: 'PENDING',
        contactUnlocked: true,
        createdAt: Date.now()
      };
      sendProposal(proposal);
      rateAd(selectedAd.id, user.id, proposalRating);
      setIsProcessing(false);
      setPaymentStep('NONE');
      setSelectedAd(null);
      setShowSuccess(true);
      setTimeout(() => { setShowSuccess(false); setShowConfetti(false); }, 4000); 
    } catch (e) {
      setIsProcessing(false);
      setPaymentStep('NONE');
      alert("Falha ao registrar interesse.");
    }
  };

  const trendingTags = ["🔥 iPhone", "🎮 PS5", "🚗 Carros", "💻 MacBook", "🎸 Instrumentos", "👗 Moda"];

  return (
    // FIX: Using absolute inset-0 guarantees it fills the parent completely, solving the vertical cropping/overflow.
    <div className="absolute inset-0 flex flex-col bg-[#020617] overflow-hidden">
      {showConfetti && <Confetti />}
      
      <div className="absolute top-0 left-0 right-0 z-40 p-4 pt-6 bg-gradient-to-b from-black/90 via-black/60 to-transparent pointer-events-none transition-all duration-300">
        <div className="pointer-events-auto flex items-center gap-3">
           <button 
             onClick={() => setViewMode(viewMode === 'LIST' ? 'RADAR' : 'LIST')}
             className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-lg transition-all active:scale-95 border ${viewMode === 'RADAR' ? 'bg-green-600 border-green-500 text-white' : 'bg-white/10 border-white/10 text-white backdrop-blur'}`}
           >
             <Radar className={`w-5 h-5 ${viewMode === 'RADAR' ? 'animate-spin' : ''}`} />
           </button>

           <div className="relative group flex-1">
               <input 
                 type="text" placeholder="BUSCAR ITEM, TAG..." 
                 className="w-full bg-white/10 backdrop-blur-xl border border-white/10 rounded-2xl py-3 pl-10 pr-4 text-white text-xs font-bold outline-none focus:bg-black/80 focus:border-white/30 transition-all uppercase placeholder-white/40 shadow-lg"
                 value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
               />
               <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/60 w-4 h-4" />
           </div>

           <button 
             onClick={() => setShowFilters(true)}
             className={`w-10 h-10 flex items-center justify-center rounded-xl backdrop-blur-xl border transition-all shadow-lg ${filterType !== 'ALL' || filterMinPrice || filterMaxPrice || filterCategory !== 'ALL' || filterCondition !== 'ALL' ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-white/10 border-white/10 text-white hover:bg-white/20'}`}
           >
             <Filter className="w-5 h-5" />
           </button>
        </div>

        {!searchTerm && viewMode === 'LIST' && (
            <div className="pointer-events-auto flex gap-2 overflow-x-auto no-scrollbar mt-3 pb-2 mask-linear-fade">
                {trendingTags.map(tag => (
                    <button 
                        key={tag}
                        onClick={() => setSearchTerm(tag.replace(/[^a-zA-Z0-9 ]/g, "").trim())}
                        className="whitespace-nowrap px-3 py-1.5 bg-white/5 border border-white/5 rounded-full text-[9px] font-black uppercase text-slate-300 hover:bg-white/10 hover:text-white transition-colors backdrop-blur-md"
                    >
                        {tag}
                    </button>
                ))}
            </div>
        )}
      </div>

      {loading ? (
        <div className="h-full w-full overflow-hidden">
           <FeedItemSkeleton />
        </div>
      ) : (
        <>
            {viewMode === 'LIST' ? (
                // FIX: Container is full height of the absolute parent.
                <div 
                    ref={scrollContainerRef}
                    onScroll={handleScroll}
                    className="flex-1 w-full h-full overflow-y-scroll snap-y snap-mandatory custom-scrollbar scroll-smooth relative"
                >
                {displayedAds.length > 0 ? (
                    <>
                        {displayedAds.map((ad, idx) => (
                            // FIX: Item is strictly h-full of the container, ensuring 100% viewport match inside the app layout
                            <div key={ad.id} className="w-full h-full snap-start relative flex-shrink-0">
                                <FeedItem ad={ad} onProposal={setSelectedAd} currentUser={user} index={idx} />
                            </div>
                        ))}
                        {hasMore && (
                            <div className="w-full h-24 flex items-center justify-center snap-end bg-black">
                                <Loader2 className="w-6 h-6 text-indigo-500 animate-spin" />
                            </div>
                        )}
                        {!hasMore && displayedAds.length > 5 && (
                            <div className="w-full h-24 flex items-center justify-center snap-end bg-black text-slate-600 text-[10px] font-bold uppercase">
                                Você chegou ao fim
                            </div>
                        )}
                    </>
                ) : (
                    <div className="h-full flex flex-col items-center justify-center text-center p-10 opacity-40">
                        <Search className="w-16 h-16 mb-4 text-slate-600" />
                        <p className="font-black text-xs uppercase tracking-widest text-slate-500 mb-4">Nenhum item encontrado.</p>
                        <button onClick={() => {
                            setFilterType('ALL'); setSearchTerm(''); setFilterMinPrice(''); setFilterMaxPrice(''); setFilterCategory('ALL'); setFilterCondition('ALL'); setFilterRegion('');
                        }} className="text-indigo-400 text-[10px] font-bold underline">Limpar Filtros</button>
                    </div>
                )}
                </div>
            ) : (
                <RadarView items={displayedAds} onSelect={setSelectedAd} />
            )}
        </>
      )}

      {showFilters && (
        <div className="fixed inset-0 z-[2000] bg-black/80 backdrop-blur-xl flex items-end md:items-center justify-center p-4 animate-in fade-in">
           <div className="bg-[#0f172a]/95 w-full max-w-sm rounded-[2.5rem] p-8 border border-white/10 shadow-2xl space-y-5 animate-in slide-in-from-bottom-10 ring-1 ring-white/5 max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-2">
                 <h3 className="text-xl font-black text-white uppercase italic tracking-tighter">Filtros Explorer</h3>
                 <button onClick={() => setShowFilters(false)} className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10">✕</button>
              </div>
              <div className="pt-2">
                  <button onClick={() => setShowFilters(false)} className="w-full py-4 bg-white text-black rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-slate-200 transition-all shadow-[0_0_20px_rgba(255,255,255,0.3)] active:scale-95">Aplicar Filtros</button>
              </div>
           </div>
        </div>
      )}

      {selectedAd && (
        <div className="fixed inset-0 z-[2000] bg-black/90 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
           <div className="bg-[#0f172a] w-full max-w-sm rounded-[3rem] overflow-hidden shadow-2xl flex flex-col relative max-h-[90vh] border border-white/10 animate-in zoom-in-95 duration-300">
              <button onClick={() => { setSelectedAd(null); setPaymentStep('NONE'); }} className="absolute top-6 right-6 w-10 h-10 bg-black/50 backdrop-blur text-white rounded-full flex items-center justify-center font-black z-20 active:scale-90 transition-all border border-white/10 hover:bg-white/10">✕</button>
              
              <div className="h-48 bg-black relative flex-shrink-0">
                 {selectedAd.videoUrl ? (
                    <video src={selectedAd.videoUrl} autoPlay loop playsInline className="w-full h-full object-cover opacity-60" />
                 ) : (
                    <img src={selectedAd.imageUrl} className="w-full h-full object-cover opacity-60" />
                 )}
                 <div className="absolute inset-0 bg-gradient-to-t from-[#0f172a] to-transparent"></div>
                 <div className="absolute inset-0 flex items-center justify-center">
                    <div className="p-1 rounded-full border-2 border-indigo-500 shadow-[0_0_30px_rgba(99,102,241,0.5)]">
                         <img src={selectedAd.ownerAvatar} className="w-20 h-20 rounded-full border-2 border-white" />
                    </div>
                 </div>
              </div>

              <div className="p-8 pt-0 flex flex-col flex-1 overflow-y-auto custom-scrollbar text-center relative z-10">
                 {paymentStep === 'NONE' && (
                    <>
                        <div className="space-y-1 mb-6">
                            <h4 className="text-2xl font-black text-white uppercase italic tracking-tighter leading-none drop-shadow-lg">{selectedAd.title}</h4>
                            <p className="text-[9px] font-black text-indigo-400 uppercase tracking-widest bg-indigo-500/10 inline-block px-3 py-1 rounded-full">Anunciado por {selectedAd.ownerName}</p>
                        </div>
                        <div className="bg-white/5 p-5 rounded-[2rem] border border-white/5 italic font-medium text-slate-300 text-[11px] leading-relaxed mb-6 shadow-inner">"{selectedAd.description}"</div>
                        <div className="mt-auto space-y-2">
                            <button onClick={handleInitiateProposal} disabled={isProcessing || selectedAd.ownerId === user?.id} className={`w-full py-5 rounded-[2rem] font-black text-xs uppercase tracking-[0.2em] shadow-2xl active:scale-95 transition-all ${selectedAd.ownerId === user?.id ? 'bg-slate-800 text-slate-500 cursor-not-allowed' : 'bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:brightness-110 shadow-green-500/30'}`}>
                                {isProcessing ? 'Processando...' : selectedAd.ownerId === user?.id ? 'SEU ITEM' : 'ENVIAR PROPOSTA 💬'}
                            </button>
                            {user?.plan === 'FREE' && selectedAd.ownerId !== user?.id && <div className="flex items-center justify-center gap-1 text-[9px] text-slate-500 font-bold uppercase"><Lock className="w-3 h-3" /> Taxa única de conexão: <span className="text-green-400">R$ 0,49</span></div>}
                        </div>
                    </>
                 )}
                 {(paymentStep === 'QRCODE' || paymentStep === 'PROCESSING' || paymentStep === 'SUCCESS') && (
                     <div className="flex flex-col items-center justify-center flex-1 space-y-6 pt-4 animate-in fade-in">
                         {paymentStep === 'QRCODE' && pixData ? (
                             <>
                                <h4 className="text-xl font-black text-white uppercase italic">Taxa de Conexão</h4>
                                <div className="bg-white p-4 rounded-2xl shadow-[0_0_30px_rgba(255,255,255,0.1)] border-4 border-indigo-500"><img src={`data:image/png;base64,${pixData.qr_code_base64}`} className="w-40 h-40 object-contain" alt="QR" /></div>
                                <button onClick={() => { navigator.clipboard.writeText(pixData.qr_code); alert("Copiado!"); }} className="w-full py-4 bg-indigo-600 text-white rounded-xl font-black text-[10px] uppercase shadow-lg active:scale-95 flex items-center justify-center gap-2"><DollarSign className="w-4 h-4" /> Copiar PIX</button>
                                
                                <button 
                                    onClick={() => checkStatus(pixData.id, true)} 
                                    className="w-full py-4 bg-green-600 text-white rounded-xl font-black text-[10px] uppercase shadow-lg active:scale-95 flex items-center justify-center gap-2 hover:bg-green-500 border border-green-400/50"
                                >
                                    <Check className="w-4 h-4 text-black" /> JÁ FIZ O PIX / VERIFICAR AGORA
                                </button>
                                
                                <p className="text-[9px] font-black text-slate-500 uppercase animate-pulse">Aguardando confirmação bancária...</p>
                             </>
                         ) : (
                             <>
                                {paymentStep === 'SUCCESS' ? <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center shadow-[0_0_40px_#22c55e] animate-bounce"><Check className="w-10 h-10 text-black" /></div> : <Loader2 className="w-12 h-12 text-indigo-500 animate-spin" />}
                                <p className="font-black text-xs uppercase tracking-widest text-white">{paymentStep === 'SUCCESS' ? 'Pagamento Aprovado!' : 'Processando...'}</p>
                             </>
                         )}
                     </div>
                 )}
              </div>
           </div>
        </div>
      )}

      {showSuccess && (
        <div className="fixed inset-0 z-[3000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
            <div className="bg-[#0f172a] p-8 rounded-[2.5rem] border border-white/10 shadow-2xl flex flex-col items-center text-center max-w-sm w-full animate-in zoom-in-95 relative overflow-hidden">
                <div className="w-24 h-24 bg-green-500 rounded-full flex items-center justify-center mb-4 shadow-[0_0_40px_#22c55e] z-10 animate-bounce"><Check className="w-12 h-12 text-black" /></div>
                <h2 className="text-2xl font-black text-white uppercase italic tracking-tighter mb-2 z-10">Proposta Enviada!</h2>
                <p className="text-slate-400 text-xs font-bold uppercase tracking-wide z-10">O dono do item será notificado.</p>
            </div>
        </div>
      )}
    </div>
  );
};

export default CatalogoView;