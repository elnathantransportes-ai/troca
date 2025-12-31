import React, { useState, useEffect, useRef } from 'react';
import { User, ProductCondition, Ad, AdType, ModerationResult, UserPlan } from '../types';
import VideoRecorder from './VideoRecorder';
import { useStore } from '../services/mockStore';
import { paymentService, PixResponse } from '../services/paymentService';
import { geminiService, analyzeContentWithGemini } from '../services/geminiService';
import { Sparkles, Video, Zap, Shield, Loader2, Trophy, AlertCircle, DollarSign, Plus, Check, CheckCheck, Star } from './IconComponents';
import Confetti from './Confetti';

type VisibilidadeTipo = 'gratuito' | 'destaque_24h' | 'destaque_7d';

interface AdsViewProps {
  user?: User | null;
  onCancel?: () => void;
  onSuccess?: () => void;
  onUpdateUser?: (updated: User) => void;
  editingAd?: Ad | null;
  initialStep?: 'visibility';
}

const AdsView: React.FC<AdsViewProps> = ({ user: propUser, onCancel, onSuccess, editingAd, initialStep }) => {
  const { currentUser: storeUser, createAd, uploadMedia } = useStore();
  const user = propUser || storeUser;
  const isPremium = user?.plan === UserPlan.PREMIUM;
  
  // Se estamos apenas impulsionando um ad já ativo, não reseta status. 
  // Mas se estamos EDITANDO conteúdo, DEVE resetar.
  const isBoostingOnly = initialStep === 'visibility';

  const [step, setStep] = useState<'start' | 'video' | 'details' | 'visibility' | 'payment' | 'success'>(
    initialStep === 'visibility' ? 'visibility' : (editingAd ? 'details' : 'start')
  );
  
  const [videoPreview, setVideoPreview] = useState<string>(editingAd?.videoUrl || '');
  const [videoBlob, setVideoBlob] = useState<Blob | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<string>('');
  const [pixData, setPixData] = useState<PixResponse | null>(null);
  const pollingRef = useRef<number | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showConfetti, setShowConfetti] = useState(false);

  const [redirectCount, setRedirectCount] = useState(3);

  const [form, setForm] = useState({
    titulo: editingAd?.title || '',
    interesse: editingAd?.tradeInterest || '',
    descricao: editingAd?.description || '',
    valor: editingAd?.value ? formatCurrency(editingAd.value) : '',
    condicao: (editingAd?.condition as ProductCondition) || 'usado',
    tipo: (editingAd?.type as AdType) || 'TRADE'
  });

  useEffect(() => {
    return () => { if (pollingRef.current) clearInterval(pollingRef.current); };
  }, []);

  useEffect(() => {
    let interval: number;
    if (step === 'success') {
        interval = window.setInterval(() => {
            setRedirectCount((prev) => {
                if (prev <= 1) {
                    clearInterval(interval);
                    if (onSuccess) onSuccess(); 
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
    }
    return () => clearInterval(interval);
  }, [step, onSuccess]);

  function formatCurrency(value: number | string) {
      if (!value) return '';
      const num = Number(value);
      return new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2 }).format(num);
  }

  const handleCurrencyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      let value = e.target.value.replace(/\D/g, "");
      value = (Number(value) / 100).toFixed(2);
      setForm({ ...form, valor: formatCurrency(value) });
  };

  const handleVideoCaptured = (blob: Blob, url: string) => {
    setVideoPreview(url);
    setVideoBlob(blob);
    setStep('details');
  };

  const handleGalleryClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('video/')) {
        alert("Por favor, selecione apenas arquivos de vídeo.");
        return;
      }
      const url = URL.createObjectURL(file);
      setVideoPreview(url);
      setVideoBlob(file);
      setStep('details');
    }
  };

  const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  const handleAIImprovement = async () => {
    if (!form.titulo && !form.descricao) {
      alert("Escreva pelo menos um título ou rascunho da descrição para a IA trabalhar.");
      return;
    }
    setAiLoading(true);
    try {
      const result = await geminiService.generateAIDescription(
        form.titulo || "Item sem título",
        form.interesse || "Negociável",
        form.descricao || "Item em bom estado."
      );
      setForm(prev => ({ ...prev, titulo: result.titulo, descricao: result.descricao }));
    } catch (e) {
      alert("IA indisponível no momento.");
    } finally {
      setAiLoading(false);
    }
  };

  const validateForm = (): boolean => {
      if (!form.titulo) { alert("O Título é obrigatório."); return false; }
      if (!form.valor) { alert("O Valor Médio é obrigatório."); return false; }
      return true;
  };

  const goToVisibility = () => {
      if (validateForm()) setStep('visibility');
  };

  const publishAd = async (visibilidade: VisibilidadeTipo) => {
    if (!user) return;
    
    // Premium Logic: Bypass payment for highlights
    if (isPremium && visibilidade !== 'gratuito') {
        // Proceed directly as if paid
    } else if (visibilidade !== 'gratuito') {
        const confirmPayment = window.confirm(`Confirmar pagamento de ${visibilidade === 'destaque_24h' ? 'R$ 4,90' : 'R$ 17,90'}?`);
        if (!confirmPayment) return;
    }

    setIsUploading(true);
    setUploadStatus('Processando vídeo...');
    
    try {
      const adId = editingAd?.id || `ad_${Date.now()}`;
      let finalVideoUrl = videoPreview;
      
      // CRITICAL UPDATE: Upload Blob directly if new video, do NOT use Base64 for videos.
      if (videoBlob) {
        setUploadStatus('Enviando vídeo para nuvem...');
        try {
            // Use the exposed uploadMedia from store to bypass Base64 conversion
            finalVideoUrl = await uploadMedia(videoBlob, `ads/${adId}/video.mp4`);
        } catch(e) {
            console.error("Erro no upload do vídeo", e);
            alert("Erro ao enviar vídeo. Verifique sua conexão.");
            setIsUploading(false);
            return;
        }
      }

      setUploadStatus('Finalizando...');
      const cleanValue = parseFloat(form.valor.replace(/\./g, '').replace(',', '.')) || 0;
      
      let newStatus: any = 'PENDING';
      
      if (isBoostingOnly) {
          if (editingAd?.status === 'ACTIVE') {
              newStatus = 'ACTIVE';
          }
      } else {
          newStatus = 'PENDING';
      }

      const adData: Ad = {
        id: adId,
        title: (form.titulo || "ITEM").toUpperCase(),
        tradeInterest: form.interesse,
        description: form.descricao,
        category: 'Geral',
        value: cleanValue,
        condition: form.condicao,
        type: form.tipo,
        videoUrl: finalVideoUrl,
        // FIX: Do not use video URL as image URL because img tags can't render mp4
        // Use empty string or a static placeholder logic in components
        imageUrl: editingAd?.imageUrl && !editingAd.imageUrl.endsWith('.mp4') ? editingAd.imageUrl : '', 
        ownerId: user.id,
        ownerName: user.name,
        ownerAvatar: user.avatarUrl,
        ownerRegion: `${user.cidade || ''} - ${user.estado || ''}`,
        status: newStatus,
        isHighlight: visibilidade !== 'gratuito',
        likes: editingAd?.likes || 0,
        rating: editingAd?.rating || 0,
        views: editingAd?.views || 0,
        createdAt: editingAd?.createdAt || Date.now()
      };

      await createAd(adData);
      
      setIsUploading(false);
      setStep('success');
      setShowConfetti(true);
    } catch (error) {
      console.error(error);
      setIsUploading(false);
      alert("Ocorreu um erro ao publicar.");
    }
  };

  const ProgressBar = ({ current }: { current: string }) => {
      const steps = ['start', 'video', 'details', 'visibility', 'success'];
      const idx = steps.indexOf(current);
      const progress = Math.max(5, (idx / (steps.length - 2)) * 100); 
      if (current === 'success') return null;
      return (
          <div className="w-full h-1 bg-white/10 mt-4 rounded-full overflow-hidden">
              <div className="h-full bg-indigo-500 transition-all duration-500" style={{ width: `${Math.min(100, progress)}%` }}></div>
          </div>
      );
  };

  return (
    <div className="w-full min-h-full bg-[#020617] pb-32 text-white animate-in fade-in flex flex-col">
      {showConfetti && <Confetti />}
      <div className="sticky top-0 z-40 p-4 border-b border-white/5 bg-[#020617]/95 backdrop-blur-xl shadow-lg">
         <div className="flex items-center gap-4">
            <button onClick={onCancel} className="text-white/80 bg-white/5 p-2 rounded-xl font-black">✕</button>
            <h2 className="text-sm font-black text-white uppercase italic tracking-tighter">
                {isBoostingOnly ? 'IMPULSIONAR' : (editingAd ? 'EDITAR ANÚNCIO' : 'NOVO ANÚNCIO')}
            </h2>
         </div>
         <ProgressBar current={step} />
      </div>

      <div className="p-6 max-w-xl mx-auto w-full flex-1">
        {isUploading && (
           <div className="fixed inset-0 z-[1000] bg-black/90 flex flex-col items-center justify-center text-white">
              <Loader2 className="w-12 h-12 animate-spin mb-4" />
              <p className="font-black uppercase text-[10px] tracking-widest">{uploadStatus}</p>
           </div>
        )}

        {step === 'start' && (
          <div className="space-y-8 pt-4 text-center">
             <div className="p-6 bg-slate-900 rounded-[2rem] border border-white/5">
                <Video className="w-12 h-12 text-indigo-500 mx-auto mb-4" />
                <h3 className="text-2xl font-black uppercase text-white">Vídeo Obrigatório</h3>
                <p className="text-xs text-slate-400 mt-2">Mostre o produto real. Sem edições enganosas.</p>
             </div>
             <button onClick={() => setStep('video')} className="w-full py-6 bg-red-600 rounded-[2rem] font-black uppercase text-sm shadow-xl hover:scale-105 transition-transform flex items-center justify-center gap-2"><div className="w-4 h-4 bg-white rounded-full animate-pulse"></div> Gravar (35s)</button>
             <button onClick={handleGalleryClick} className="w-full py-4 bg-white/5 rounded-xl font-black uppercase text-xs">Galeria</button>
             <input type="file" ref={fileInputRef} accept="video/*" className="hidden" onChange={handleFileChange} />
          </div>
        )}

        {step === 'video' && <VideoRecorder onCapture={handleVideoCaptured} onClose={() => setStep('start')} />}
        
        {step === 'details' && (
          <div className="space-y-6">
             <div className="flex gap-4 items-center bg-slate-900/50 p-2 rounded-2xl border border-white/5">
                 <div className="w-16 h-16 bg-black rounded-xl overflow-hidden"><video src={videoPreview} className="w-full h-full object-cover" /></div>
                 <button onClick={() => setStep('start')} className="text-[10px] text-indigo-400 font-black uppercase underline">Trocar Vídeo</button>
             </div>
             <div className="grid grid-cols-2 gap-3">
                <select className="bg-black/40 border border-white/10 rounded-xl p-3 text-white text-xs font-bold uppercase" value={form.condicao} onChange={e => setForm({...form, condicao: e.target.value as any})}><option value="usado">Usado</option><option value="novo">Novo</option></select>
                <select className="bg-black/40 border border-white/10 rounded-xl p-3 text-white text-xs font-bold uppercase" value={form.tipo} onChange={e => setForm({...form, tipo: e.target.value as any})}><option value="TRADE">Troca</option><option value="SELL">Venda</option><option value="BOTH">Ambos</option></select>
             </div>
             <input type="text" placeholder="TÍTULO DO ITEM" className="w-full p-4 rounded-xl bg-white/5 border border-white/10 text-white font-black uppercase" value={form.titulo} onChange={e => setForm({...form, titulo: e.target.value})} />
             <div className="relative"><span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">R$</span><input type="text" placeholder="0,00" className="w-full pl-10 p-4 rounded-xl bg-white/5 border border-white/10 text-white font-black text-lg" value={form.valor} onChange={handleCurrencyChange} /></div>
             {(form.tipo !== 'SELL') && <input type="text" placeholder="INTERESSE DE TROCA" className="w-full p-4 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 font-bold uppercase" value={form.interesse} onChange={e => setForm({...form, interesse: e.target.value})} />}
             <div className="relative">
                <textarea rows={4} placeholder="Descrição..." className="w-full p-4 rounded-xl bg-white/5 border border-white/10 text-slate-300 text-xs font-bold resize-none" value={form.descricao} onChange={e => setForm({...form, descricao: e.target.value})} />
                <button type="button" onClick={handleAIImprovement} disabled={aiLoading} className="absolute bottom-2 right-2 bg-indigo-600 text-white px-3 py-1 rounded-lg text-[8px] font-black uppercase">{aiLoading ? '...' : 'IA ✨'}</button>
             </div>
             <button onClick={goToVisibility} className="w-full bg-white text-black py-5 rounded-[2rem] font-black uppercase shadow-xl hover:scale-105 transition-transform">Continuar</button>
          </div>
        )}

        {step === 'visibility' && (
           <div className="space-y-4 text-center pt-4">
              <button onClick={() => publishAd('gratuito')} className="w-full p-6 bg-white/5 border border-white/10 rounded-[2rem] flex justify-between items-center group hover:bg-white/10"><span className="font-black text-white uppercase">Padrão</span><span className="text-slate-500 font-bold">Grátis</span></button>
              
              <button onClick={() => publishAd('destaque_24h')} className="w-full p-6 bg-indigo-600 rounded-[2rem] flex justify-between items-center shadow-lg hover:scale-105 transition-transform">
                  <span className="font-black text-white uppercase flex items-center gap-2"><Zap className="w-4 h-4 fill-white"/> Destaque 24h</span>
                  <span className={`font-bold ${isPremium ? 'text-white' : 'text-indigo-200'}`}>
                      {isPremium ? 'GRÁTIS (Premium)' : 'R$ 4,90'}
                  </span>
              </button>
              
              <button onClick={() => publishAd('destaque_7d')} className="w-full p-6 bg-gradient-to-r from-amber-600 to-orange-600 rounded-[2rem] flex justify-between items-center shadow-lg hover:scale-105 transition-transform">
                  <span className="font-black text-white uppercase flex items-center gap-2"><Star className="w-4 h-4 fill-white"/> Elite 7 Dias</span>
                  <span className={`font-bold ${isPremium ? 'text-white' : 'text-amber-100'}`}>
                      {isPremium ? 'GRÁTIS (Premium)' : 'R$ 17,90'}
                  </span>
              </button>
           </div>
        )}

        {step === 'success' && (
          <div className="text-center py-20 space-y-6 animate-in zoom-in relative">
             <div className="w-24 h-24 bg-green-500 rounded-full flex items-center justify-center mx-auto shadow-[0_0_40px_#22c55e]"><CheckCheck className="w-12 h-12 text-black" /></div>
             <h2 className="text-3xl font-black text-white uppercase italic">Anúncio Enviado!</h2>
             <p className="text-xs font-bold text-slate-400 uppercase bg-slate-900 p-4 rounded-xl inline-block border border-white/10">
                 Seu vídeo foi enviado para o Painel de Controle (Admin).<br/>Aguarde aprovação.
             </p>
             <p className="text-[10px] text-slate-600 uppercase font-bold">Redirecionando para o Perfil em {redirectCount}s...</p>
             <button onClick={onSuccess} className="w-full bg-white text-black py-4 rounded-2xl font-black uppercase">Voltar ao Perfil</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdsView;