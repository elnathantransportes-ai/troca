import React, { useState, useEffect, useRef } from 'react';
import { User, Ad, UserPlan } from '../types';
import AdsView from './AdsView';
import CameraCapture from './CameraCapture';
import { 
  getAds, 
  updateUser, 
  subscribeToData 
} from '../services/mockFirebase';
import { useStore } from '../services/mockStore';
import { paymentService, PixResponse } from '../services/paymentService';
import { geminiService } from '../services/geminiService';
import { Zap, Video, Shield, VerifiedBadge, MapPin, DollarSign, Star, Trophy, Crown, Edit, Trash2, Clock, AlertCircle, CheckCircle, Lock, Loader2, LogOut, Check } from './IconComponents';
import Confetti from './Confetti';

interface ProfileViewProps {
  user: User | null;
  onLogout: () => void;
  onUpdateUser: (user: User) => void;
  onShowRanking?: () => void;
}

const LevelProgress: React.FC<{ reputation: number }> = ({ reputation }) => {
    let levelName = 'Novato';
    let min = 0;
    let max = 20;
    let color = 'bg-slate-500';
    let icon = <Shield className="w-3 h-3" />;

    if (reputation >= 20) { levelName = 'Explorador'; min = 20; max = 50; color = 'bg-blue-500'; icon = <MapPin className="w-3 h-3" />; }
    if (reputation >= 50) { levelName = 'Negociador'; min = 50; max = 100; color = 'bg-green-500'; icon = <Zap className="w-3 h-3" />; }
    if (reputation >= 100) { levelName = 'Elite'; min = 100; max = 200; color = 'bg-amber-500'; icon = <Star className="w-3 h-3" />; }
    if (reputation >= 200) { levelName = 'Lenda'; min = 200; max = 1000; color = 'bg-purple-600'; icon = <Crown className="w-3 h-3" />; }

    const percentage = Math.min(100, Math.max(0, ((reputation - min) / (max - min)) * 100));

    return (
        <div className="w-full max-w-xs mx-auto mt-6 bg-slate-900/50 p-4 rounded-2xl border border-white/5 backdrop-blur-sm shadow-xl">
            <div className="flex justify-between items-center mb-2">
                <span className={`text-[10px] font-black uppercase tracking-widest flex items-center gap-1 text-white`}>
                    {icon} Nível: <span className={`${color.replace('bg-', 'text-')}`}>{levelName}</span>
                </span>
                <span className="text-[9px] font-mono text-slate-400">{reputation} / {max} XP</span>
            </div>
            
            <div className="h-2 w-full bg-black rounded-full overflow-hidden border border-white/5 relative">
                <div 
                    className={`h-full ${color} transition-all duration-1000 ease-out relative`} 
                    style={{ width: `${percentage}%` }}
                >
                    {/* Shimmer Effect on Progress Bar */}
                    <div className="absolute inset-0 bg-white/30 w-full h-full animate-[shimmer_2s_infinite] skew-x-[-20deg]"></div>
                </div>
            </div>
            
            <p className="text-[8px] text-slate-500 mt-2 text-center uppercase font-bold">
                {max - reputation} XP para o próximo nível
            </p>
        </div>
    );
};

const ProfileView: React.FC<ProfileViewProps> = ({ user: initialUser, onLogout, onUpdateUser, onShowRanking }) => {
  const { deleteItem } = useStore();
  const [user, setUser] = useState<User | null>(initialUser);
  const [userAds, setUserAds] = useState<Ad[]>([]);
  const [editingAd, setEditingAd] = useState<Ad | null>(null);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  
  // Image Processing State
  const [isAnalyzingImage, setIsAnalyzingImage] = useState(false);
  
  // Premium Checkout State
  const [showCheckout, setShowCheckout] = useState(false);
  const [checkoutStep, setCheckoutStep] = useState<'options' | 'pix' | 'success'>('options');
  const [pixData, setPixData] = useState<PixResponse | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);

  // Profile Edit Form
  const [editForm, setEditForm] = useState({
    nome: initialUser?.name || '',
    whatsapp: initialUser?.whatsapp || '',
    foto: initialUser?.avatar || '',
    bairro: initialUser?.bairro || '',
    cidade: initialUser?.cidade || '',
    estado: initialUser?.estado || '',
    cpf: initialUser?.cpf || ''
  });
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pollingRef = useRef<number | null>(null);

  const refreshAds = () => {
    if (initialUser) {
        const allAds = getAds(); 
        const myAds = allAds.filter(a => a.ownerId === initialUser.id);
        setUserAds(myAds.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
    }
  };

  useEffect(() => {
    if (!initialUser) return;
    setUser(initialUser);
    setEditForm(prev => ({
        ...prev, 
        nome: initialUser.name,
        whatsapp: initialUser.whatsapp || '',
        foto: initialUser.avatar,
        bairro: initialUser.bairro || '',
        cidade: initialUser.cidade || '',
        estado: initialUser.estado || '',
        cpf: initialUser.cpf || ''
    }));
    
    refreshAds();
    const unsubscribe = subscribeToData(() => refreshAds());
    
    return () => {
      unsubscribe();
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [initialUser]);

  const handleActionDeleteAd = async (e: React.MouseEvent, adId: string) => {
    e.preventDefault();
    if (!window.confirm("🗑️ ATENÇÃO: Excluir este anúncio removerá ele do Explorer e das negociações. Confirmar?")) return;
    try {
        await deleteItem(adId);
        // refreshAds will be triggered by the store update or subscribe, but we can also manually filter for instant feedback in this view state
        setUserAds(prev => prev.filter(a => a.id !== adId));
    } catch (e) {
        alert("Erro ao excluir.");
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setIsProcessing(true);
    try {
      const updatedUser: User = { 
          ...user, 
          name: editForm.nome,
          avatar: editForm.foto,
          whatsapp: editForm.whatsapp,
          bairro: editForm.bairro,
          cidade: editForm.cidade,
          estado: editForm.estado
      };
      
      updateUser(updatedUser);
      onUpdateUser(updatedUser);
      setUser(updatedUser);
      setIsEditingProfile(false);
    } catch (err) { 
      alert("Erro ao atualizar perfil.");
    } finally { 
      setIsProcessing(false); 
    }
  };

  const handleGalleryClick = () => {
    fileInputRef.current?.click();
  };

  const processProfileImage = async (base64: string) => {
      setIsAnalyzingImage(true);
      try {
          const check = await geminiService.verifyHumanFace(base64);
          if (check.isHuman) {
              setEditForm(prev => ({ ...prev, foto: base64 }));
          } else {
              alert(`🚫 FOTO RECUSADA PELA IA\n\nMotivo: ${check.reason || "Não foi detectado um rosto humano claro."}\n\nPor favor, use uma foto real sua.`);
          }
      } catch (e) {
          alert("Erro ao verificar imagem. Tente novamente.");
      } finally {
          setIsAnalyzingImage(false);
          setShowCamera(false);
      }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        processProfileImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // --- PREMIUM FLOW ---
  const startPremiumPayment = async () => {
    if (!user) return;
    
    if (!user.cpf) {
        setPaymentError("CPF Obrigatório para gerar PIX. Edite seu perfil.");
        return;
    }

    setIsProcessing(true);
    setPaymentError(null);
    try {
      const response = await paymentService.createPixPayment(
          199.00, 
          "Assinatura Premium Elite", 
          user.email, 
          user.name, 
          user.cpf
      );
      setPixData(response);
      setCheckoutStep('pix');
      startPolling(response.id);
    } catch (e: any) { 
        console.error(e);
        setPaymentError(e.message || "Erro ao conectar com Mercado Pago. Verifique sua conexão.");
    } finally { 
      setIsProcessing(false); 
    }
  };

  const startPolling = (paymentId: number) => {
    if (pollingRef.current) clearInterval(pollingRef.current);
    pollingRef.current = window.setInterval(async () => {
        // Silent poll
        checkStatus(paymentId, false);
    }, 5000);
  };

  const checkStatus = async (paymentId: number, manual: boolean) => {
      const status = await paymentService.checkPaymentStatus(paymentId);
      
      if (status === 'approved') {
        if (pollingRef.current) clearInterval(pollingRef.current);
        handlePaymentSuccess();
      } else if (manual) {
          alert("Pagamento ainda não confirmado. Verifique seu app do banco e tente novamente.");
      }
  };

  const handlePaymentSuccess = async () => {
    if (!user) return;
    setShowConfetti(true);
    setCheckoutStep('success');
    
    // Slight delay to update data, ensuring user sees the "Success" state clearly
    const updatedUser: User = { 
        ...user, 
        plan: UserPlan.PREMIUM, 
        isVerified: true, 
        planStartedAt: Date.now(),
        reputation: 100 
    };
    updateUser(updatedUser);
    onUpdateUser(updatedUser);
    setUser(updatedUser);
    
    setTimeout(() => {
        setShowCheckout(false);
        setShowConfetti(false);
    }, 4500); 
  };

  const isPremium = user?.plan === UserPlan.PREMIUM;

  if (editingAd) {
    return (
        <AdsView 
            user={user} 
            editingAd={editingAd} 
            onCancel={() => setEditingAd(null)} 
            onSuccess={() => { setEditingAd(null); refreshAds(); }} 
            onUpdateUser={onUpdateUser} 
        />
    );
  }

  return (
    <div className="pb-32 bg-[#020617] min-h-screen animate-in fade-in relative text-slate-200">
      
      {/* --- HEADER (Sem botão Sair no topo) --- */}
      <div className="relative">
          <div className={`h-48 w-full ${isPremium ? 'bg-gradient-to-b from-amber-600 to-[#020617]' : 'bg-gradient-to-b from-indigo-900 to-[#020617]'} opacity-40`}></div>
          
          <div className="px-6 -mt-20 relative z-10">
              <div className="flex flex-col items-center">
                  {/* Avatar Circle */}
                  <div className="relative group">
                      <div className={`w-36 h-36 rounded-full p-1 ${isPremium ? 'bg-gradient-to-tr from-amber-300 via-yellow-500 to-amber-600' : 'bg-gradient-to-tr from-indigo-400 to-cyan-400'} shadow-2xl`}>
                          <div className="w-full h-full rounded-full overflow-hidden border-4 border-[#020617] bg-slate-800 relative">
                              <img src={editForm.foto || user?.avatar} className={`w-full h-full object-cover transition-opacity ${isAnalyzingImage ? 'opacity-50' : 'opacity-100'}`} alt="Perfil" />
                              
                              {/* Loading Indicator */}
                              {isAnalyzingImage && (
                                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 z-30">
                                      <Loader2 className="w-8 h-8 text-white animate-spin" />
                                      <span className="text-[8px] font-black uppercase tracking-widest mt-1">IA Verificando...</span>
                                  </div>
                              )}

                              {isEditingProfile && !isAnalyzingImage && (
                                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center gap-4 animate-in fade-in cursor-pointer">
                                      <button type="button" onClick={() => setShowCamera(true)} className="p-2 bg-white/20 rounded-full hover:bg-white/40 border border-white/10 shadow-lg"><span className="text-xl">📸</span></button>
                                      <button type="button" onClick={handleGalleryClick} className="p-2 bg-white/20 rounded-full hover:bg-white/40 border border-white/10 shadow-lg"><span className="text-xl">🖼️</span></button>
                                      <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" />
                                  </div>
                              )}
                          </div>
                      </div>
                      {isPremium && (
                          <div className="absolute -bottom-2 -right-2 bg-amber-500 text-black p-2 rounded-full border-4 border-[#020617]">
                              <Star className="w-4 h-4 fill-black" />
                          </div>
                      )}
                  </div>

                  <div className="mt-4 text-center space-y-1">
                      <h2 className="text-2xl font-black text-white uppercase italic tracking-tighter flex items-center justify-center gap-2">
                          {user?.name}
                          {user?.isVerified && <VerifiedBadge className="w-5 h-5 text-blue-400" />}
                      </h2>
                      
                      <div className="flex items-center justify-center gap-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                          <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {user?.cidade || 'Brasil'} - {user?.estado || 'BR'}</span>
                          {isPremium ? (
                              <span className="text-amber-400 flex items-center gap-1"><Zap className="w-3 h-3" /> Membro Elite</span>
                          ) : (
                              <span className="text-slate-500">Membro Gratuito</span>
                          )}
                      </div>
                  </div>

                  {!isEditingProfile && user && <LevelProgress reputation={user.reputation || 0} />}

                  {!isEditingProfile && (
                      <button 
                        onClick={() => setIsEditingProfile(true)} 
                        className="mt-6 px-6 py-2 rounded-full border border-white/10 bg-white/5 text-[10px] font-black uppercase tracking-widest text-slate-300 hover:bg-white/10 active:scale-95 transition-all"
                      >
                        Editar Perfil
                      </button>
                  )}
              </div>
          </div>
      </div>

      <div className="px-6 mt-8 max-w-xl mx-auto space-y-10">

        {/* --- PREMIUM BANNER CTA (Explicitly showing price + Shine Effect) --- */}
        {!isEditingProfile && (
            <div className={`rounded-[2.5rem] p-6 relative overflow-hidden shadow-2xl group ${isPremium ? 'bg-gradient-to-r from-slate-800 to-slate-900 border border-amber-500/30' : 'bg-gradient-to-r from-amber-600 to-orange-600'}`}>
                {/* HOLOGRAPHIC SHINE EFFECT */}
                {!isPremium && (
                    <div className="absolute inset-0 w-full h-full animate-[shimmer_3s_infinite_linear] bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-[-20deg] pointer-events-none"></div>
                )}
                
                <div className="absolute top-0 right-0 p-4 opacity-20">
                    <Crown className="w-24 h-24 text-white rotate-12" />
                </div>
                <div className="relative z-10">
                    <h3 className="text-2xl font-black text-white uppercase italic tracking-tighter mb-2">{isPremium ? 'Membro Elite Ativo' : 'Seja Premium Elite'}</h3>
                    <ul className="space-y-2 mb-6">
                        <li className={`flex items-center gap-2 text-[10px] font-bold uppercase tracking-wide ${isPremium ? 'text-slate-400' : 'text-amber-100'}`}>
                            <Check className="w-3 h-3 bg-white text-black rounded-full p-0.5" /> Isenção total de taxas (R$ 0,49)
                        </li>
                        <li className={`flex items-center gap-2 text-[10px] font-bold uppercase tracking-wide ${isPremium ? 'text-slate-400' : 'text-amber-100'}`}>
                            <Check className="w-3 h-3 bg-white text-black rounded-full p-0.5" /> Destaques Grátis e Prioridade
                        </li>
                    </ul>
                    <div className="flex items-center justify-between mt-4">
                        <div>
                            {/* PREÇO SEMPRE VISÍVEL COMO REFERÊNCIA */}
                            {!isPremium && <span className="block text-[10px] text-amber-200 font-bold uppercase line-through">R$ 249,00</span>}
                            <span className="block text-2xl font-black text-white">R$ 199,00 <span className="text-xs font-bold">/mês</span></span>
                        </div>
                        {isPremium ? (
                             <div className="px-6 py-3 rounded-xl font-black uppercase text-xs tracking-widest bg-white/10 text-white border border-white/20">
                                 Assinatura Ativa
                             </div>
                        ) : (
                            <button 
                                onClick={() => setShowCheckout(true)}
                                className="bg-white text-amber-600 px-6 py-3 rounded-xl font-black uppercase text-xs tracking-widest shadow-lg active:scale-95 transition-transform hover:bg-amber-50"
                            >
                                Assinar Agora
                            </button>
                        )}
                    </div>
                </div>
            </div>
        )}

        {/* --- EDIT PROFILE FORM --- */}
        {isEditingProfile && (
            <form onSubmit={handleSaveProfile} className="bg-slate-900 p-6 rounded-[2rem] border border-white/10 space-y-5 animate-in zoom-in-95">
                <div className="flex items-center gap-2 mb-2">
                    <Shield className="w-4 h-4 text-indigo-400" />
                    <h3 className="text-xs font-black uppercase text-white tracking-widest">Dados do Perfil</h3>
                </div>
                
                <div className="space-y-3">
                    <div>
                        <label className="text-[9px] font-bold text-slate-500 uppercase ml-2 mb-1 block">Nome Completo</label>
                        <input 
                            type="text" 
                            className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white text-xs font-bold outline-none focus:border-indigo-500"
                            value={editForm.nome}
                            onChange={e => setEditForm({...editForm, nome: e.target.value})}
                        />
                    </div>
                    
                    {/* CPF LOCKED */}
                    <div className="opacity-60 relative">
                        <label className="text-[9px] font-bold text-slate-500 uppercase ml-2 mb-1 block flex items-center gap-1"><Lock className="w-3 h-3" /> CPF (Não Editável)</label>
                        <input 
                            type="text" 
                            disabled
                            className="w-full bg-slate-800/50 border border-white/5 rounded-xl p-3 text-slate-400 text-xs font-bold cursor-not-allowed"
                            value={editForm.cpf}
                        />
                    </div>

                    <div>
                        <label className="text-[9px] font-bold text-slate-500 uppercase ml-2 mb-1 block">WhatsApp</label>
                        <input 
                            type="text" 
                            className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white text-xs font-bold outline-none focus:border-indigo-500"
                            value={editForm.whatsapp}
                            onChange={e => setEditForm({...editForm, whatsapp: e.target.value})}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                        <div>
                            <label className="text-[9px] font-bold text-slate-500 uppercase ml-2 mb-1 block">Cidade</label>
                            <input 
                                type="text" 
                                className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white text-xs font-bold outline-none focus:border-indigo-500"
                                value={editForm.cidade}
                                onChange={e => setEditForm({...editForm, cidade: e.target.value})}
                            />
                        </div>
                        <div>
                            <label className="text-[9px] font-bold text-slate-500 uppercase ml-2 mb-1 block">Estado</label>
                            <input 
                                type="text" 
                                className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white text-xs font-bold outline-none focus:border-indigo-500 uppercase text-center"
                                maxLength={2}
                                value={editForm.estado}
                                onChange={e => setEditForm({...editForm, estado: e.target.value.toUpperCase()})}
                            />
                        </div>
                    </div>
                </div>

                <div className="flex gap-3 pt-2">
                    <button type="button" onClick={() => setIsEditingProfile(false)} className="flex-1 py-3 bg-white/5 text-slate-400 rounded-xl font-black text-[10px] uppercase active:scale-95 transition-transform">Cancelar</button>
                    <button type="submit" disabled={isProcessing} className="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-black text-[10px] uppercase shadow-lg shadow-indigo-900/40 active:scale-95 transition-transform">Salvar Alterações</button>
                </div>
            </form>
        )}

        {/* --- MY ADS SECTION --- */}
        {!isEditingProfile && (
            <div className="space-y-6">
                <div className="flex items-center justify-between px-2">
                    <h3 className="text-xl font-black text-white uppercase italic tracking-tighter">Meus Anúncios</h3>
                    <span className="text-[10px] font-bold text-slate-500 bg-white/5 px-2 py-1 rounded">{userAds.length} Itens</span>
                </div>

                {userAds.length > 0 ? (
                    <div className="grid grid-cols-1 gap-4">
                        {userAds.map(ad => (
                            <div key={ad.id} className="bg-slate-900 border border-white/5 rounded-[2rem] p-4 flex gap-4 relative overflow-hidden group">
                                {/* Thumbnail */}
                                <div className="w-24 h-32 bg-black rounded-2xl flex-shrink-0 relative overflow-hidden border border-white/10">
                                    {ad.videoUrl ? (
                                        <video 
                                          src={ad.videoUrl} 
                                          className="w-full h-full object-cover" 
                                          controls 
                                          poster={ad.imageUrl}
                                        />
                                    ) : (
                                        <img src={ad.imageUrl} className="w-full h-full object-cover opacity-80" />
                                    )}
                                    <div className="absolute inset-0 flex items-center justify-center bg-black/10 pointer-events-none">
                                        <Video className="w-6 h-6 text-white/50" />
                                    </div>
                                    {ad.isHighlight && <div className="absolute top-0 right-0 p-1 bg-amber-500"><Zap className="w-3 h-3 text-black" /></div>}
                                </div>

                                {/* Info & Logic Status */}
                                <div className="flex-1 flex flex-col justify-between py-1 min-w-0">
                                    <div>
                                        {/* STATUS BADGES */}
                                        <div className="flex items-center justify-between mb-2">
                                            {(ad.status === 'PENDING' || ad.status === 'PENDING_AI') && (
                                                <span className="bg-yellow-500/10 text-yellow-500 border border-yellow-500/20 px-2 py-1 rounded text-[8px] font-black uppercase flex items-center gap-1">
                                                    <Clock className="w-3 h-3" /> ⏳ Em Análise
                                                </span>
                                            )}
                                            
                                            {ad.status === 'ACTIVE' && (
                                                <span className="bg-green-500/10 text-green-400 border border-green-500/20 px-2 py-1 rounded text-[8px] font-black uppercase flex items-center gap-1">
                                                    <CheckCircle className="w-3 h-3" /> ✅ Aprovado
                                                </span>
                                            )}

                                            {ad.status === 'REJECTED' && (
                                                <span className="bg-red-500/10 text-red-400 border border-red-500/20 px-2 py-1 rounded text-[8px] font-black uppercase flex items-center gap-1">
                                                    <AlertCircle className="w-3 h-3" /> ❌ Reprovado
                                                </span>
                                            )}

                                            <span className="text-[9px] text-slate-500 font-bold">{ad.views} Views</span>
                                        </div>

                                        <h4 className="font-black text-white uppercase italic truncate text-lg leading-tight">{ad.title}</h4>
                                        <p className="text-[10px] text-slate-400 font-bold mt-1">R$ {ad.value}</p>
                                    </div>

                                    {/* Actions Buttons */}
                                    <div className="flex gap-2 mt-3">
                                        <button 
                                            onClick={() => setEditingAd(ad)}
                                            className="flex-1 py-2 bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-400 rounded-lg text-[9px] font-black uppercase transition-colors border border-indigo-500/20 active:scale-95 flex items-center justify-center gap-1"
                                        >
                                            <Edit className="w-3 h-3" /> ✏️ Editar
                                        </button>
                                        <button 
                                            onClick={(e) => handleActionDeleteAd(e, ad.id)}
                                            className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg text-[9px] font-black uppercase transition-colors border border-red-500/20 active:scale-95 flex items-center justify-center gap-1"
                                        >
                                            <Trash2 className="w-3 h-3" /> 🗑️ Excluir
                                        </button>
                                    </div>
                                    
                                    {ad.status === 'REJECTED' && (
                                        <p className="text-[8px] text-red-400 mt-2 bg-red-900/20 p-1 rounded">
                                            Motivo: {ad.moderationReason || 'Violação das regras'}
                                        </p>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-16 bg-white/5 rounded-[3rem] border border-dashed border-white/10">
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Nenhum anúncio criado</p>
                    </div>
                )}
            </div>
        )}

        {/* LOGOUT BUTTON FOOTER */}
        {!isEditingProfile && (
            <div className="mt-12 mb-4">
                <button 
                    onClick={onLogout}
                    className="w-full bg-red-900/20 hover:bg-red-900/40 text-red-400 border border-red-900/30 py-4 rounded-[2rem] font-black uppercase text-xs tracking-widest flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg"
                >
                    <LogOut className="w-4 h-4" /> SAIR DA CONTA
                </button>
                <p className="text-[8px] text-slate-600 text-center mt-3 uppercase font-bold">Troca Troca v1.0 • ID: {user?.id}</p>
            </div>
        )}

      </div>

      {showCamera && <CameraCapture onCapture={processProfileImage} onClose={() => setShowCamera(false)} />}
      
      {/* PREMIUM CHECKOUT MODAL */}
      {showCheckout && (
        <div className="fixed inset-0 z-[2000] bg-black/90 backdrop-blur-xl flex items-center justify-center p-6 animate-in fade-in">
          <div className="bg-slate-900 w-full max-w-sm rounded-[3rem] border border-white/10 overflow-hidden shadow-2xl animate-in zoom-in-95 relative">
             {showConfetti && <Confetti />}
             
             <div className="p-6 bg-[#009EE3] flex justify-between items-center text-white shadow-lg relative z-10">
                <span className="font-black italic uppercase tracking-widest text-[11px] flex items-center gap-1">
                    <DollarSign className="w-4 h-4" /> Mercado Pago
                </span>
                <button onClick={() => setShowCheckout(false)} className="text-white/80 hover:text-white font-bold text-xl px-2">✕</button>
             </div>
             
             <div className="p-8 text-center space-y-8">
                {checkoutStep === 'options' && (
                  <div className="space-y-6">
                    <div className="space-y-2">
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Valor da Assinatura</p>
                        <p className="text-6xl font-black text-white tracking-tighter">R$ 199<span className="text-lg text-slate-500">,00</span></p>
                    </div>
                    <button onClick={startPremiumPayment} disabled={isProcessing} className="w-full bg-[#009EE3] hover:bg-[#0089c4] text-white py-5 rounded-2xl font-black uppercase text-xs tracking-widest shadow-lg shadow-cyan-900/30 active:scale-95 transition-all disabled:opacity-50">{isProcessing ? 'Gerando QR Code...' : 'Pagar com PIX'}</button>
                    {/* Mensagem de Erro mais amigável e visível */}
                    {paymentError && (
                        <div className="bg-red-500/10 border border-red-500/20 p-3 rounded-xl animate-in fade-in">
                            <p className="text-[10px] font-bold text-red-300 uppercase flex items-center justify-center gap-1">
                                <AlertCircle className="w-3 h-3"/> Erro
                            </p>
                            <p className="text-[9px] text-red-200 mt-1 leading-tight">{paymentError}</p>
                        </div>
                    )}
                  </div>
                )}
                
                {checkoutStep === 'pix' && pixData && (
                  <div className="space-y-6 animate-in slide-in-from-bottom-4">
                    <div className="bg-white p-4 rounded-2xl inline-block shadow-inner"><img src={`data:image/png;base64,${pixData.qr_code_base64}`} className="w-48 h-48 object-contain" alt="QR" /></div>
                    <button onClick={() => { navigator.clipboard.writeText(pixData.qr_code); alert("Código Copiado!"); }} className="w-full py-4 bg-slate-800 text-white rounded-xl font-black text-[10px] uppercase border border-white/10 hover:bg-slate-700 transition-colors">Copiar Código Pix</button>
                    
                    {/* Botão de Verificação Manual */}
                    <button 
                        onClick={() => checkStatus(pixData.id, true)} 
                        className="w-full py-4 bg-green-600 text-white rounded-xl font-black text-[10px] uppercase shadow-lg active:scale-95 flex items-center justify-center gap-2 hover:bg-green-500 border border-green-400/50"
                    >
                        <Check className="w-4 h-4 text-black" /> JÁ FIZ O PIX / VERIFICAR AGORA
                    </button>

                    <p className="text-[9px] text-slate-500 animate-pulse">Aguardando confirmação bancária...</p>
                  </div>
                )}
                
                {checkoutStep === 'success' && (
                    <div className="py-10 space-y-6 animate-in zoom-in relative z-20">
                        <div className="w-20 h-20 bg-green-500 text-black rounded-full flex items-center justify-center text-4xl mx-auto shadow-[0_0_40px_#22c55e] animate-bounce">✓</div>
                        <h5 className="font-black text-2xl uppercase italic text-white tracking-tighter">Bem-vindo à Elite!</h5>
                        <p className="text-xs text-slate-400 font-bold uppercase">Sua conta foi verificada.</p>
                    </div>
                )}
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfileView;