import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { User, Proposal, ChatMessage } from '../types';
import { getProposalsForUser, closeDeal, subscribeToData, getMessages, sendMessage, getUserById, getAds } from '../services/mockFirebase';
import { useToast } from './ToastContainer';
import { MessageSquare, Lock, Zap, MapPin, CheckCircle, Shield, Video, ImageIcon, AlertCircle, Mic, Play, MoreVertical, VerifiedBadge, Check, CheckCheck, Trophy, Star } from './IconComponents';
import Confetti from './Confetti';
import { useStore } from '../services/mockStore';

interface NegotiationViewProps {
  user: User | null;
}

type TabType = 'RECEIVED' | 'SENT';

// --- DEAL CELEBRATION COMPONENT ---
const DealOverlay: React.FC<{ 
    onClose: () => void; 
    myAvatar?: string; 
    theirAvatar?: string; 
    itemName?: string;
    itemImage?: string;
}> = ({ onClose, myAvatar, theirAvatar, itemName, itemImage }) => (
    <div className="absolute inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-xl animate-in fade-in duration-500 overflow-hidden" onClick={onClose}>
        <div className="absolute inset-0 bg-gradient-to-t from-green-900/40 via-transparent to-transparent"></div>
        
        {/* Background Rays */}
        <div className="absolute inset-0 flex items-center justify-center opacity-30">
             <div className="w-[200vw] h-[200vw] bg-[conic-gradient(from_0deg,transparent_0deg,transparent_20deg,#22c55e_40deg,transparent_60deg)] animate-[spin_8s_linear_infinite]"></div>
        </div>

        <div className="relative z-10 flex flex-col items-center text-center p-8 space-y-8 animate-in zoom-in-50 duration-700">
            <div className="relative mb-8">
                {/* Avatars Collision */}
                <div className="flex items-center justify-center -space-x-4">
                    <div className="w-24 h-24 rounded-full border-4 border-black bg-slate-800 overflow-hidden shadow-[0_0_30px_rgba(34,197,94,0.5)] z-10 animate-in slide-in-from-left-10 duration-700">
                        <img src={myAvatar} className="w-full h-full object-cover" />
                    </div>
                    <div className="absolute -top-10 z-20 animate-bounce">
                        <div className="bg-white p-2 rounded-full shadow-lg">
                            <CheckCircle className="w-8 h-8 text-green-600 fill-green-100" />
                        </div>
                    </div>
                    <div className="w-24 h-24 rounded-full border-4 border-black bg-slate-800 overflow-hidden shadow-[0_0_30px_rgba(34,197,94,0.5)] z-0 animate-in slide-in-from-right-10 duration-700">
                        <img src={theirAvatar} className="w-full h-full object-cover" />
                    </div>
                </div>
            </div>

            <div className="space-y-2">
                <h2 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white to-green-400 italic uppercase tracking-tighter drop-shadow-2xl animate-pulse">
                    NEGÓCIO<br/>FECHADO!
                </h2>
                <p className="text-white/80 font-bold uppercase tracking-widest text-xs">
                    Você garantiu: <span className="text-green-400">{itemName}</span>
                </p>
            </div>

            {/* Item Preview */}
            <div className="w-full max-w-[180px] aspect-square rounded-2xl border-2 border-white/20 overflow-hidden shadow-2xl relative group rotate-3 hover:rotate-0 transition-transform duration-500">
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent z-10"></div>
                {itemImage && <img src={itemImage} className="w-full h-full object-cover" />}
                <div className="absolute bottom-3 left-0 right-0 text-center z-20">
                    <span className="bg-green-600 text-white text-[9px] font-black uppercase px-3 py-1 rounded-full shadow-lg">
                        Confirmado
                    </span>
                </div>
            </div>

            <button className="bg-white text-black font-black uppercase text-xs px-10 py-4 rounded-full shadow-[0_0_40px_rgba(255,255,255,0.4)] hover:scale-105 active:scale-95 transition-all animate-in slide-in-from-bottom-10 fade-in delay-300">
                Ir para o Chat Seguro
            </button>
        </div>
    </div>
);

// --- MEMOIZED BUBBLE ---
const MessageBubble = React.memo(({ msg, isMe }: { msg: ChatMessage, isMe: boolean }) => {
    return (
        <div className={`flex ${isMe ? 'justify-end' : 'justify-start'} mb-2 group relative z-10 px-2`}>
            <div className={`max-w-[85%] md:max-w-[70%] rounded-2xl p-3 text-sm font-medium relative shadow-sm ${
                isMe 
                ? 'bg-indigo-600 text-white rounded-tr-none' 
                : 'bg-slate-800 text-slate-200 rounded-tl-none border border-white/5'
            }`}>
                {msg.type === 'image' && msg.mediaUrl ? (
                    <div className="mb-2 rounded-lg overflow-hidden border border-white/10 bg-black">
                        <img src={msg.mediaUrl} className="max-w-full h-auto max-h-60 object-contain" alt="Anexo" loading="lazy" />
                    </div>
                ) : (
                    <p className="leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                )}
                
                <div className={`flex items-center gap-1 justify-end mt-1 opacity-70`}>
                    <span className="text-[9px] font-mono">
                        {new Date(msg.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </span>
                    {isMe && (
                        <span>
                            {msg.read ? <CheckCheck className="w-3 h-3 text-blue-300" /> : <Check className="w-3 h-3" />}
                        </span>
                    )}
                </div>
            </div>
        </div>
    );
}, (prev, next) => prev.msg.id === next.msg.id && prev.msg.read === next.msg.read);

// --- DATE DIVIDER COMPONENT ---
const DateDivider = ({ date }: { date: string }) => (
    <div className="flex justify-center my-4 sticky top-2 z-0">
        <span className="bg-slate-900/80 backdrop-blur border border-white/10 text-slate-500 text-[9px] font-black uppercase px-3 py-1 rounded-full shadow-sm">
            {date}
        </span>
    </div>
);

const NegotiationView: React.FC<NegotiationViewProps> = ({ user }) => {
  const { sendMessage: storeSendMessage } = useStore();
  const { addToast } = useToast();
  const [activeTab, setActiveTab] = useState<TabType>('RECEIVED');
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [selectedProposalId, setSelectedProposalId] = useState<string | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [securityWarning, setSecurityWarning] = useState<string | null>(null);
  const [activeChatUser, setActiveChatUser] = useState<User | null>(null);
  
  // States for Deal Animation
  const [showConfetti, setShowConfetti] = useState(false);
  const [showDealOverlay, setShowDealOverlay] = useState(false);
  
  const [cachedAds, setCachedAds] = useState<any[]>([]);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  const refreshData = useCallback(() => {
    if (user) {
        const allProps = getProposalsForUser(user.id);
        setProposals(allProps);
        setCachedAds(getAds());
    }
  }, [user]);

  const refreshChat = useCallback(() => {
      if (selectedProposalId) {
          setChatMessages(getMessages(selectedProposalId));
      }
  }, [selectedProposalId]);

  useEffect(() => {
    refreshData();
    const unsubscribe = subscribeToData(() => {
       refreshData();
       refreshChat();
    });
    return () => unsubscribe();
  }, [refreshData, refreshChat]);

  useEffect(() => {
     refreshChat();
     if(selectedProposalId && user) {
         const proposal = proposals.find(p => p.id === selectedProposalId);
         if(proposal) {
             const otherId = proposal.adOwnerId === user.id ? proposal.bidderId : proposal.adOwnerId;
             const loadedUser = getUserById(otherId);
             setActiveChatUser(loadedUser || null);
         }
     } else {
         setActiveChatUser(null);
     }
  }, [selectedProposalId, proposals, user, refreshChat]);

  // Auto-scroll logic
  useEffect(() => {
     if (messagesEndRef.current) {
         messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
     }
  }, [chatMessages, selectedProposalId, isTyping]);

  // Auto-resize textarea
  useEffect(() => {
      if (textareaRef.current) {
          textareaRef.current.style.height = 'auto';
          textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 100) + 'px';
      }
  }, [inputText]);

  const handleCloseDeal = async () => {
      if (!selectedProposalId) return;
      if (window.confirm("⚠️ ATENÇÃO: Ao fechar negócio, este anúncio será removido do Explorer e todos os outros chats serão encerrados automaticamente. Confirmar?")) {
          try {
            await closeDeal(selectedProposalId);
            // Trigger Visuals
            setShowConfetti(true);
            setShowDealOverlay(true);
            
            setTimeout(() => setShowConfetti(false), 5000);
          } catch (e: any) {
            addToast(e.toString(), 'error');
          }
      }
  };

  const validateInput = (text: string) => {
      const phoneRegex = /(\(?\d{2}\)?\s?)?(9\s?)?\d{4}[-.\s]?\d{4}/;
      const linkRegex = /(http|www|\.com|@|instagram|insta|facebook|whats|zap)/i;

      if (phoneRegex.test(text) || linkRegex.test(text)) {
          setSecurityWarning("🚫 Bloqueio de Segurança: Telefones e links externos são proibidos no chat. Negocie dentro do app.");
          return false;
      }
      setSecurityWarning(null);
      return true;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const text = e.target.value;
      setInputText(text);
      validateInput(text);
  };

  const handleSendMessage = (content?: string) => {
      const textToSend = content || inputText;
      
      if (!textToSend.trim() || !selectedProposalId || !user) return;
      
      if (!validateInput(textToSend)) return;
      
      setInputText(''); 
      setSecurityWarning(null);
      if (textareaRef.current) textareaRef.current.style.height = 'auto';
      
      storeSendMessage(selectedProposalId, textToSend, 'text');
      
      setTimeout(() => setIsTyping(true), 1500); 
      setTimeout(() => setIsTyping(false), 3500);
  };

  const handleRecordAudio = () => {
      if (isRecording) {
          setIsRecording(false);
          if (selectedProposalId && user) {
              storeSendMessage(selectedProposalId, "Áudio (0:12)", 'text'); 
              addToast("Áudio enviado!", 'success');
          }
      } else {
          setIsRecording(true);
          setTimeout(() => { if (isRecording) setIsRecording(false); }, 5000);
      }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file && selectedProposalId && user) {
          const reader = new FileReader();
          reader.onloadend = () => {
              const base64 = reader.result as string;
              // Ensure we pass 'image' as type and the base64 as mediaUrl
              storeSendMessage(selectedProposalId, "Imagem enviada", 'image', base64);
              addToast("Imagem enviada!", 'success');
          };
          reader.readAsDataURL(file);
      }
  };

  const filteredProposals = useMemo(() => {
      return proposals.filter(p => {
          if (activeTab === 'RECEIVED') return p.adOwnerId === user?.id;
          return p.bidderId === user?.id; 
      });
  }, [proposals, activeTab, user?.id]);

  const selectedProposal = proposals.find(p => p.id === selectedProposalId);
  const linkedAd = cachedAds.find(a => a.id === selectedProposal?.adId);
  const isMyAd = selectedProposal?.adOwnerId === user?.id;
  const isWinner = selectedProposal?.status === 'WON';
  const isClosedForMe = (linkedAd?.status === 'SOLD' && !isWinner) || selectedProposal?.status === 'LOST';
  const canChat = !isClosedForMe; 

  const renderStars = (score: number) => (
      <div className="flex text-[8px] text-amber-400">
          {'★'.repeat(Math.min(5, Math.max(1, Math.round(score / 20))))}
      </div>
  );

  const groupedMessages = useMemo(() => {
      const groups: { date: string; msgs: ChatMessage[] }[] = [];
      let lastDate = '';
      
      chatMessages.forEach(msg => {
          const date = new Date(msg.createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
          const displayDate = date === new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }) ? 'HOJE' : date;
          
          if (displayDate !== lastDate) {
              groups.push({ date: displayDate, msgs: [] });
              lastDate = displayDate;
          }
          groups[groups.length - 1].msgs.push(msg);
      });
      return groups;
  }, [chatMessages]);

  const quickReplies = [
      "Está disponível?",
      "Qual o menor valor?",
      "Aceita troca?",
      "Onde podemos encontrar?",
      "Ok, combinado!"
  ];

  return (
    <div className="h-full bg-[#020617] flex flex-col md:flex-row overflow-hidden animate-in fade-in relative">
      {showConfetti && <Confetti />}
      
      {/* DEAL OVERLAY */}
      {showDealOverlay && user && (
          <DealOverlay 
            onClose={() => setShowDealOverlay(false)} 
            myAvatar={user.avatarUrl}
            theirAvatar={activeChatUser?.avatarUrl}
            itemName={linkedAd?.title || selectedProposal?.adTitle}
            itemImage={linkedAd?.imageUrl}
          />
      )}

      {/* --- SIDEBAR LIST --- */}
      <div className={`flex-1 md:flex-none md:w-96 bg-slate-900 border-r border-white/5 flex flex-col ${selectedProposalId ? 'hidden md:flex' : 'flex'}`}>
         <div className="p-6 bg-[#020617] space-y-4 shadow-xl z-10">
            <div>
                <h2 className="text-2xl font-black text-white uppercase italic tracking-tighter">Central de Trocas</h2>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                    {activeTab === 'RECEIVED' ? 'Propostas que você recebeu' : 'Propostas que você enviou'}
                </p>
            </div>
            <div className="flex bg-slate-800 p-1 rounded-xl">
                <button 
                    onClick={() => setActiveTab('RECEIVED')}
                    className={`flex-1 py-3 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'RECEIVED' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
                >
                    Recebidas 📥
                </button>
                <button 
                    onClick={() => setActiveTab('SENT')}
                    className={`flex-1 py-3 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'SENT' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
                >
                    Enviadas 📤
                </button>
            </div>
         </div>
         
         <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-2 pb-24">
            {filteredProposals.length === 0 && (
                <div className="text-center py-20 opacity-30 flex flex-col items-center">
                    <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mb-4">
                        <MessageSquare className="w-6 h-6 text-white" />
                    </div>
                    <p className="text-xs uppercase font-bold text-slate-400">
                        {activeTab === 'RECEIVED' ? 'Nenhuma oferta recebida' : 'Você não enviou propostas'}
                    </p>
                </div>
            )}
            
            {filteredProposals.map(p => {
                const isActive = p.id === selectedProposalId;
                const isOwner = p.adOwnerId === user?.id;
                const otherPartyId = isOwner ? p.bidderId : p.adOwnerId;
                const otherPartyName = isOwner ? p.bidderName : (getUserById(p.adOwnerId)?.name || 'Anunciante');
                const otherUser = getUserById(otherPartyId);
                const itemAd = cachedAds.find(a => a.id === p.adId);
                const itemClosed = (itemAd?.status === 'SOLD' && p.status !== 'WON') || p.status === 'LOST';

                let statusBadge = <span className="text-green-400 bg-green-900/30 px-2 py-1 rounded text-[8px] font-black uppercase">Ativo</span>;
                if (p.status === 'WON') statusBadge = <span className="text-amber-400 bg-amber-900/30 px-2 py-1 rounded text-[8px] font-black uppercase flex items-center gap-1"><Zap className="w-3 h-3" /> Fechado</span>;
                else if (itemClosed) statusBadge = <span className="text-red-400 bg-red-900/30 px-2 py-1 rounded text-[8px] font-black uppercase flex items-center gap-1"><Lock className="w-3 h-3" /> Encerrado</span>; 
                
                return (
                    <button 
                        key={p.id} 
                        onClick={() => setSelectedProposalId(p.id)}
                        className={`w-full text-left p-4 rounded-3xl transition-all border relative overflow-hidden group ${isActive ? 'bg-indigo-900/20 border-indigo-500/50' : 'bg-slate-800/40 border-transparent hover:bg-slate-800'}`}
                    >
                        <div className="relative z-10 flex gap-3">
                            <div className="relative">
                                <img src={otherUser?.avatarUrl || `https://ui-avatars.com/api/?name=${otherPartyName}`} className="w-10 h-10 rounded-full border border-white/10" alt="Avatar" />
                                {otherUser?.isVerified && <div className="absolute -bottom-1 -right-1 bg-blue-500 rounded-full p-0.5 border border-black"><VerifiedBadge className="w-2 h-2 text-white" /></div>}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-start mb-1">
                                    <div>
                                        <span className="font-black text-white text-xs truncate block uppercase">{otherPartyName}</span>
                                        {otherUser && renderStars(otherUser.reputation)}
                                    </div>
                                    <span className="text-[9px] text-slate-500 font-mono">
                                        {new Date(p.lastMessageAt || p.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                    </span>
                                </div>
                                <p className="text-[10px] text-slate-400 font-medium truncate mb-2">Item: <span className="text-indigo-300">{p.adTitle}</span></p>
                                <div className="flex justify-between items-center">{statusBadge}</div>
                            </div>
                        </div>
                        {isActive && <div className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-500"></div>}
                    </button>
                );
            })}
         </div>
      </div>

      {/* --- CHAT WINDOW --- */}
      <div className={`flex-1 flex flex-col bg-[#0b1121] relative h-full ${!selectedProposalId ? 'hidden md:flex' : 'flex'}`}>
         {!selectedProposalId ? (
             <div className="flex-1 flex flex-col items-center justify-center opacity-20 space-y-4 p-8 text-center">
                 <div className="w-32 h-32 bg-indigo-500/20 rounded-full flex items-center justify-center blur-xl absolute"></div>
                 <MessageSquare className="w-24 h-24 text-slate-600 relative z-10" />
                 <p className="font-black uppercase tracking-[0.2em] text-slate-400 relative z-10">Selecione uma negociação</p>
             </div>
         ) : (
             <>
                {/* --- CONTEXT HEADER --- */}
                <div className="bg-[#020617] border-b border-white/5 z-20 shadow-xl flex-shrink-0">
                    <div className="bg-slate-900/50 p-3 px-4 flex items-center gap-4 border-b border-white/5 backdrop-blur-md">
                        <button onClick={() => setSelectedProposalId(null)} className="md:hidden text-slate-400 p-2 rounded-full hover:bg-white/10">←</button>
                        
                        <div className="h-12 w-12 rounded-lg overflow-hidden bg-black border border-white/20 relative flex-shrink-0 group">
                            {linkedAd?.videoUrl ? (
                                <video src={linkedAd.videoUrl} className="w-full h-full object-cover opacity-80" />
                            ) : (
                                <img src={linkedAd?.imageUrl} className="w-full h-full object-cover opacity-80" />
                            )}
                            <div className="absolute inset-0 flex items-center justify-center"><Play className="w-4 h-4 text-white drop-shadow-md" /></div>
                        </div>

                        <div className="flex-1 min-w-0">
                            <h3 className="font-black text-white text-sm uppercase italic truncate">{linkedAd?.title || selectedProposal?.adTitle}</h3>
                            <div className="flex items-center gap-3 text-[10px] text-slate-400 font-bold uppercase mt-0.5">
                                <span className="text-green-400">R$ {linkedAd?.value}</span>
                                <span className="truncate flex items-center gap-1"><MapPin className="w-3 h-3" /> {linkedAd?.ownerRegion}</span>
                            </div>
                        </div>

                        <div>
                            {isWinner ? (
                                <div className="px-3 py-1.5 bg-amber-500 text-black rounded-lg text-[9px] font-black uppercase tracking-widest flex items-center gap-1 shadow-lg shadow-amber-500/20"><Zap className="w-3 h-3" /> Negócio Fechado</div>
                            ) : isClosedForMe ? (
                                <div className="px-3 py-1.5 bg-slate-800 text-slate-500 rounded-lg text-[9px] font-black uppercase tracking-widest flex items-center gap-1 border border-white/5"><Lock className="w-3 h-3" /> Indisponível</div>
                            ) : isMyAd ? (
                                <button onClick={handleCloseDeal} className="bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest shadow-lg active:scale-95 transition-all flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Fechar Negócio</button>
                            ) : (
                                <div className="px-3 py-1.5 bg-indigo-500/10 text-indigo-400 rounded-lg text-[9px] font-black uppercase tracking-widest border border-indigo-500/20">Aguardando</div>
                            )}
                        </div>
                    </div>

                    <div className="p-2 px-4 flex items-center justify-center bg-black/40 text-[10px] text-slate-400 font-bold uppercase tracking-widest gap-2">
                        <span>Conversando com:</span>
                        <div className="flex items-center gap-1 text-white">
                            <img src={activeChatUser?.avatarUrl} className="w-4 h-4 rounded-full" />
                            <span>{activeChatUser?.name}</span>
                            {activeChatUser?.isVerified && <VerifiedBadge className="w-3 h-3 text-blue-400" />}
                        </div>
                    </div>
                </div>

                {/* --- MESSAGES AREA --- */}
                <div ref={chatContainerRef} className="flex-1 overflow-y-auto custom-scrollbar p-0 space-y-0 relative bg-[#0b1121] pb-36">
                    <div className="absolute inset-0 opacity-5 bg-[radial-gradient(#4f46e5_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none"></div>

                    {/* Status Banner */}
                    <div className="w-full max-w-sm mx-auto mt-4 mb-4 relative z-10 px-4">
                        {isClosedForMe ? (
                            <div className="bg-slate-900/90 border border-red-500/30 rounded-3xl p-6 text-center backdrop-blur-md shadow-2xl">
                                <Lock className="w-8 h-8 text-red-500 mx-auto mb-3" />
                                <h4 className="text-red-400 font-black uppercase text-xs tracking-widest mb-1">Anúncio Fechado</h4>
                                <p className="text-[10px] text-slate-500">Este item foi negociado com outro usuário. Chat arquivado.</p>
                            </div>
                        ) : (
                            <div className="bg-slate-900/80 border border-white/5 rounded-3xl p-4 text-center backdrop-blur-sm">
                                <Shield className="w-6 h-6 text-indigo-500 mx-auto mb-2" />
                                <p className="text-[10px] text-slate-400 uppercase font-bold">Ambiente Monitorado por IA</p>
                                <p className="text-[9px] text-slate-600 mt-1">Telefones e links são bloqueados automaticamente.</p>
                                {isWinner && (
                                    <div className="mt-4 animate-in zoom-in bg-green-900/20 p-4 rounded-2xl border border-green-500/30">
                                        <p className="text-[10px] text-green-400 font-bold uppercase mb-2">Negociação Concluída! Contato Liberado.</p>
                                        <div className="text-xl text-white font-mono tracking-wider bg-black/40 py-2 rounded-xl border border-white/10 mb-3 select-all">
                                            {activeChatUser?.whatsapp || '(11) 9****-****'}
                                        </div>
                                        <a href={`https://wa.me/55${activeChatUser?.whatsapp?.replace(/\D/g, '')}`} target="_blank" rel="noreferrer" className="block w-full bg-[#25D366] hover:bg-[#20bd5a] text-white py-3 rounded-xl font-black uppercase text-xs tracking-widest shadow-lg active:scale-95 transition-all">Ir para WhatsApp</a>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Grouped Messages */}
                    {groupedMessages.map((group, idx) => (
                        <div key={idx}>
                            <DateDivider date={group.date} />
                            {group.msgs.map(msg => (
                                <MessageBubble key={msg.id} msg={msg} isMe={msg.senderId === user?.id} />
                            ))}
                        </div>
                    ))}
                    
                    {isTyping && (
                         <div className="flex justify-start animate-in fade-in px-4">
                             <div className="bg-slate-800 p-3 rounded-2xl rounded-tl-none border border-white/5 flex gap-1 items-center">
                                 <div className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce"></div>
                                 <div className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce delay-100"></div>
                                 <div className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce delay-200"></div>
                             </div>
                         </div>
                    )}
                    <div ref={messagesEndRef} className="h-1" />
                </div>

                {/* --- INPUT AREA --- */}
                <div className="absolute bottom-0 left-0 right-0 p-2 pb-24 md:pb-2 bg-gradient-to-t from-[#020617] via-[#020617] to-transparent z-30">
                    
                    {/* Smart Replies */}
                    {canChat && (
                        <div className="flex gap-2 overflow-x-auto no-scrollbar mb-2 px-2 mask-linear-fade">
                            {quickReplies.map((reply, i) => (
                                <button key={i} onClick={() => handleSendMessage(reply)} className="whitespace-nowrap px-3 py-1.5 bg-slate-800/80 border border-white/10 rounded-full text-[10px] font-bold text-slate-300 hover:bg-indigo-600 hover:text-white transition-colors active:scale-95 backdrop-blur-md">
                                    {reply}
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Warning */}
                    {securityWarning && (
                        <div className="absolute -top-12 left-4 right-4 bg-red-600 text-white text-[10px] font-bold uppercase p-3 rounded-xl shadow-xl flex items-center gap-2 animate-bounce">
                            <AlertCircle className="w-4 h-4" /> {securityWarning}
                        </div>
                    )}

                    <div className="flex items-end gap-2 relative bg-slate-900/90 backdrop-blur-md rounded-[2rem] border border-white/10 p-2 shadow-2xl">
                        {!canChat && (
                            <div className="absolute inset-0 bg-black/80 backdrop-blur-[2px] z-20 flex items-center justify-center rounded-[2rem]">
                                <span className="text-[10px] font-black uppercase text-red-400 bg-red-900/30 px-4 py-2 rounded-full border border-red-500/20 flex items-center gap-2">
                                    <Lock className="w-3 h-3" /> Chat Encerrado
                                </span>
                            </div>
                        )}
                        
                        <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileUpload} />
                        <button type="button" onClick={() => fileInputRef.current?.click()} className="p-3 rounded-full bg-slate-800 text-slate-400 hover:text-white transition-colors active:scale-95 border border-white/5 h-12 w-12 flex items-center justify-center flex-shrink-0">
                            <ImageIcon className="w-5 h-5" />
                        </button>
                        
                        <div className="flex-1 relative">
                            <textarea 
                                ref={textareaRef}
                                value={inputText}
                                onChange={handleInputChange}
                                onKeyDown={(e) => { if(e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(); } }}
                                placeholder={canChat ? "Digite sua mensagem..." : "Negociação encerrada"}
                                className={`w-full bg-transparent border-none py-3 px-2 text-white placeholder-slate-500 focus:ring-0 outline-none text-sm font-medium resize-none max-h-32 overflow-y-auto ${securityWarning ? 'text-red-400' : ''}`}
                                disabled={!canChat}
                                rows={1}
                            />
                        </div>
                        
                        {inputText.trim() ? (
                            <button 
                                onClick={() => handleSendMessage()}
                                className="bg-indigo-600 hover:bg-indigo-500 text-white p-3 rounded-full shadow-lg transition-all active:scale-90 flex items-center justify-center h-12 w-12 flex-shrink-0"
                            >
                                <MessageSquare className="w-5 h-5 fill-current" />
                            </button>
                        ) : (
                            <button 
                                onClick={handleRecordAudio}
                                className={`p-3 rounded-full transition-all active:scale-90 flex items-center justify-center h-12 w-12 flex-shrink-0 ${isRecording ? 'bg-red-500 text-white animate-pulse' : 'bg-slate-800 text-slate-400 hover:text-white'}`}
                            >
                                <Mic className="w-5 h-5" />
                            </button>
                        )}
                    </div>
                </div>
             </>
         )}
      </div>
    </div>
  );
};

export default NegotiationView;