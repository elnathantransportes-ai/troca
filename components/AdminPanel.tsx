import React, { useState, useEffect } from 'react';
import { useStore } from '../services/mockStore';
import { User, Ad, Transaction, AdminLog } from '../types';
import { distributePodiumRewards } from '../services/mockFirebase';
import { Shield, BadgeCheck, Activity, DollarSign, Zap, Trophy, Menu, X, MapPin, Sparkles, Video, AlertCircle, Trash2, Lock, Unlock, User as UserIcon } from './IconComponents';

export const AdminPanel: React.FC = () => {
  const { 
    currentUser: adminUser, 
    logout: onLogout, 
    items, 
    transactions, 
    users: allUsers, 
    logs: storeLogs, 
    updateItemStatus, 
    toggleUserBlock, 
    verifyUserDocument,
    resetSystem: hardResetDB,
    deleteItem,
    deleteUserMember
  } = useStore();

  const [activeTab, setActiveTab] = useState<'RESUMO' | 'MODERACAO' | 'FINANCEIRO' | 'USUARIOS' | 'PODIUM' | 'LOGS'>('RESUMO');
  const [pendingAds, setPendingAds] = useState<Ad[]>([]);
  const [logs, setLogs] = useState<AdminLog[]>([]);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [viewingDocUser, setViewingDocUser] = useState<User | null>(null);
  const [lastWinners, setLastWinners] = useState<{name: string, prize: string}[]>([]);
  
  // Rejection Logic State
  const [rejectingAd, setRejectingAd] = useState<Ad | null>(null);
  
  // Mobile Menu State
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    // Sync pending ads from global store, but respect local removals if necessary
    const currentPending = items.filter(i => i.status === 'PENDING' || i.status === 'PENDING_AI');
    setPendingAds(currentPending);
    setLogs(storeLogs);

    window.addEventListener('online', () => setIsOnline(true));
    window.addEventListener('offline', () => setIsOnline(false));
    return () => {
        window.removeEventListener('online', () => setIsOnline(true));
        window.removeEventListener('offline', () => setIsOnline(false));
    };
  }, [items, transactions, allUsers, storeLogs]);

  // Handler for Approval/Rejection with Instant UI Feedback
  const handleModerate = (ad: Ad, status: 'APPROVED' | 'REJECTED', reason?: string) => {
      if (!adminUser) return;
      
      // 1. Instant UI Removal
      setPendingAds(prev => prev.filter(i => i.id !== ad.id));
      
      // 2. Call Store (which updates Firebase)
      const newStatus = status === 'APPROVED' ? 'ACTIVE' : 'REJECTED';
      updateItemStatus(ad.id, newStatus, reason);
      
      setRejectingAd(null);
  };

  const handleForceDelete = async (adId: string) => {
      if (window.confirm("FORÇAR EXCLUSÃO: Isso vai apagar o vídeo e o anúncio permanentemente do banco de dados. Confirmar?")) {
          // 1. Instant UI Removal
          setPendingAds(prev => prev.filter(i => i.id !== adId));
          
          // 2. Call Store
          try {
              await deleteItem(adId);
          } catch(e) {
              alert("Erro ao excluir.");
          }
      }
  };

  // --- USER MANAGEMENT LOGIC ---
  const handleBlockToggle = (userId: string, currentStatus: string) => {
      if (!adminUser) return;
      const action = currentStatus === 'BLOCKED' ? 'Desbloquear' : 'BLOQUEAR';
      if (!window.confirm(`Tem certeza que deseja ${action} este usuário?`)) return;
      toggleUserBlock(adminUser.id, userId);
  };

  const handleDeleteMember = async (userId: string) => {
      if (!adminUser) return;
      const confirm1 = window.confirm("⚠️ PERIGO: Excluir um membro é IRREVERSÍVEL.\n\nIsso apagará a conta, os anúncios e todo o histórico dele.\n\nDeseja continuar?");
      if (!confirm1) return;
      
      const confirm2 = window.confirm("Última chance: Confirmar exclusão definitiva do usuário?");
      if(confirm2) {
          try {
              await deleteUserMember(userId);
              // UI will update automatically via store subscription
          } catch (e) {
              alert("Erro ao excluir usuário.");
          }
      }
  };

  const handleDocVerification = (approved: boolean) => {
      if (!adminUser || !viewingDocUser) return;
      verifyUserDocument(adminUser.id, viewingDocUser.id, approved);
      setViewingDocUser(null);
  };
  
  const handleSystemReset = () => {
      const confirm1 = window.confirm("⚠️ LIMPEZA TOTAL (RESET) \n\n1. Apagar TODOS os vídeos/anúncios antigos.\n2. Remover TODOS os usuários 'fakes' do Podium.\n3. Manter apenas este Admin.\n\nDeseja limpar o sistema agora?");
      if (confirm1) {
          hardResetDB();
          alert("Sistema limpo! O Podium e o Feed foram resetados.");
      }
  };

  const handleDistributeRewards = () => {
      if (!window.confirm("Deseja encerrar o ciclo do PODIUM e distribuir prêmios agora?")) return;
      const winners = distributePodiumRewards();
      setLastWinners(winners);
      alert(`Prêmios distribuídos com sucesso!`);
  };

  const calculateRevenue = () => transactions.reduce((acc, curr) => acc + curr.amount, 0);

  const NavContent = () => (
      <>
        <div>
          <div className="flex items-center gap-3 mb-6">
             <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white text-xl font-black shadow-lg shadow-indigo-600/30">T</div>
             <div>
                <h1 className="text-lg font-black uppercase italic tracking-tighter leading-none">CONTROLE</h1>
                <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Painel Administrativo</p>
             </div>
          </div>
          
          <div className="bg-slate-800/50 p-4 rounded-2xl border border-white/5 mb-2 relative overflow-hidden">
             <div className={`absolute top-2 right-2 w-2 h-2 rounded-full ${isOnline ? 'bg-green-500 shadow-[0_0_10px_#22c55e]' : 'bg-red-500'}`}></div>
             <p className="text-[9px] text-slate-400 uppercase font-bold">Status do Sistema</p>
             <p className="text-xs font-black text-white truncate mb-2">{isOnline ? 'ONLINE' : 'OFFLINE'}</p>
             <span className="text-[9px] bg-indigo-600 px-2 rounded text-white font-bold">{adminUser?.role}</span>
          </div>
        </div>

        <nav className="flex flex-col gap-2 flex-1 mt-4">
          {[
            { id: 'RESUMO', label: 'Visão Geral', icon: Activity },
            { id: 'MODERACAO', label: `Moderar Ads (${pendingAds.length})`, icon: Shield },
            { id: 'USUARIOS', label: `Membros (${allUsers.length})`, icon: BadgeCheck },
            { id: 'FINANCEIRO', label: 'Financeiro', icon: DollarSign },
            { id: 'PODIUM', label: 'Gestão Podium', icon: Trophy },
            { id: 'LOGS', label: 'Auditoria', icon: Zap }
          ].map(tab => (
            <button 
              key={tab.id} 
              onClick={() => { setActiveTab(tab.id as any); setMobileMenuOpen(false); }}
              className={`flex items-center gap-3 text-left px-4 py-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === tab.id ? 'bg-indigo-600 text-white shadow-xl translate-x-1' : 'text-slate-500 hover:bg-white/5 hover:text-white'}`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </nav>

        <div className="space-y-3 mt-4">
             <div className="p-4 rounded-2xl border border-red-500/20 bg-red-900/10">
                 <h4 className="text-[10px] font-black text-red-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                     <Zap className="w-3 h-3" /> Manutenção
                 </h4>
                 <button 
                    onClick={handleSystemReset}
                    className="w-full bg-red-600/20 hover:bg-red-600 text-red-200 hover:text-white py-3 rounded-lg text-[9px] font-black uppercase border border-red-500/30 transition-all text-center leading-tight"
                 >
                     RESETAR SISTEMA<br/>(APAGAR FAKES & VÍDEOS)
                 </button>
             </div>
             
            <button onClick={onLogout} className="w-full bg-slate-800 text-slate-400 border border-white/5 py-4 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-white/5 hover:text-white transition-colors">
                Encerrar Sessão
            </button>
        </div>
      </>
  );

  return (
    <div className="h-[100dvh] bg-[#020617] text-white flex flex-col md:flex-row fixed inset-0 z-[100] overflow-hidden">
      
      {/* MOBILE HEADER */}
      <div className="md:hidden flex items-center justify-between p-4 bg-slate-900 border-b border-white/5 z-20 sticky top-0">
          <div className="flex items-center gap-3">
             <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-black shadow-lg">T</div>
             <span className="font-black italic uppercase tracking-tighter text-sm">Painel Admin</span>
          </div>
          <button onClick={() => setMobileMenuOpen(true)} className="p-2 bg-white/5 rounded-lg text-white">
              <Menu className="w-6 h-6" />
          </button>
      </div>

      {/* MOBILE DRAWER OVERLAY */}
      {mobileMenuOpen && (
          <div className="fixed inset-0 z-[200] md:hidden bg-[#020617] animate-in slide-in-from-left duration-300 flex flex-col h-full">
              <div className="p-6 overflow-y-auto h-full pb-safe">
                  <div className="flex justify-end mb-4">
                      <button onClick={() => setMobileMenuOpen(false)} className="p-2 bg-white/10 rounded-full text-white">
                          <X className="w-6 h-6" />
                      </button>
                  </div>
                  <NavContent />
              </div>
          </div>
      )}

      {/* DESKTOP SIDEBAR */}
      <aside className="hidden md:flex w-72 bg-slate-900/50 border-r border-white/5 p-8 flex-col gap-4 flex-shrink-0 backdrop-blur-xl h-full overflow-y-auto admin-scrollbar">
        <NavContent />
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 p-6 md:p-12 overflow-y-auto admin-scrollbar relative h-full bg-[#020617] pb-safe">
          <div className="animate-in fade-in duration-500 pb-20 max-w-7xl mx-auto">
            {activeTab === 'RESUMO' && (
              <div className="space-y-12">
                 <div className="flex justify-between items-end">
                     <div>
                        <h2 className="text-3xl font-black uppercase italic tracking-tighter text-white">Dashboard</h2>
                     </div>
                 </div>
                 <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="bg-gradient-to-br from-slate-800 to-slate-900 p-8 rounded-[2rem] border border-white/5">
                       <h3 className="text-slate-500 font-black uppercase text-[9px] tracking-widest mb-2">Anúncios Totais</h3>
                       <p className="text-3xl font-black text-indigo-400 tracking-tight">{items.length}</p>
                    </div>
                    <div className="bg-gradient-to-br from-slate-800 to-slate-900 p-8 rounded-[2rem] border border-white/5">
                       <h3 className="text-slate-500 font-black uppercase text-[9px] tracking-widest mb-2">Usuários</h3>
                       <p className="text-3xl font-black text-emerald-400 tracking-tight">{allUsers.length}</p>
                    </div>
                 </div>
              </div>
            )}
            
            {activeTab === 'MODERACAO' && (
              <div className="space-y-8">
                <h2 className="text-3xl font-black uppercase italic tracking-tighter">Moderação de Anúncios</h2>
                <div className="grid grid-cols-1 gap-8">
                    {pendingAds.length === 0 && <p className="text-slate-500 text-center py-20">Nenhum anúncio pendente.</p>}
                    {pendingAds.map(ad => (
                      <div key={ad.id} className="bg-slate-900 rounded-[2.5rem] overflow-hidden border border-white/10 flex flex-col xl:flex-row group hover:border-indigo-500/30 transition-all">
                        <div className="xl:w-1/3 h-[500px] bg-black relative group border-b xl:border-b-0 xl:border-r border-white/5">
                          {ad.videoUrl ? (
                              <video 
                                src={ad.videoUrl} 
                                controls 
                                className="w-full h-full object-contain bg-black" 
                              />
                          ) : (
                              <div className="flex items-center justify-center h-full text-slate-500">Sem Vídeo</div>
                          )}
                        </div>
                        <div className="p-8 space-y-6 flex-1 flex flex-col">
                          <h4 className="font-black text-2xl uppercase italic truncate leading-tight">{ad.title}</h4>
                          <div className="grid grid-cols-2 gap-4 mt-auto">
                            <button onClick={() => handleModerate(ad, 'APPROVED')} className="bg-green-500 text-black py-5 rounded-2xl font-black uppercase text-xs active:scale-95 transition-transform">APROVAR</button>
                            <button onClick={() => setRejectingAd(ad)} className="bg-red-500/10 text-red-500 py-5 rounded-2xl font-black uppercase text-xs active:scale-95 transition-transform">REPROVAR</button>
                            <button onClick={() => handleForceDelete(ad.id)} className="col-span-2 bg-slate-800 text-slate-400 py-3 rounded-2xl font-black uppercase text-[10px] hover:bg-red-900/50 hover:text-red-400 flex items-center justify-center gap-2 active:scale-95 transition-transform"><Trash2 className="w-3 h-3" /> FORÇAR EXCLUSÃO</button>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {activeTab === 'USUARIOS' && (
                <div className="space-y-8">
                    <h2 className="text-3xl font-black uppercase italic tracking-tighter">Gestão de Membros</h2>
                    <div className="grid grid-cols-1 gap-4">
                        {allUsers.map(user => (
                            <div key={user.id} className="bg-slate-900 p-6 rounded-[2rem] border border-white/5 flex flex-col md:flex-row items-center gap-6 group hover:bg-slate-800/50 transition-colors">
                                <div className="relative">
                                    <div className="w-20 h-20 rounded-full bg-slate-800 overflow-hidden border-2 border-white/10">
                                        <img src={user.avatarUrl} className="w-full h-full object-cover" />
                                    </div>
                                    <div className={`absolute bottom-0 right-0 w-5 h-5 rounded-full border-4 border-slate-900 ${user.accountStatus === 'BLOCKED' ? 'bg-red-500' : 'bg-green-500'}`}></div>
                                </div>
                                
                                <div className="flex-1 text-center md:text-left space-y-1">
                                    <h4 className="font-black text-lg text-white uppercase italic flex items-center justify-center md:justify-start gap-2">
                                        {user.name}
                                        {user.role === 'ADMIN' && <Shield className="w-4 h-4 text-indigo-400" />}
                                    </h4>
                                    <p className="text-xs text-slate-500 font-mono">{user.email}</p>
                                    <div className="flex items-center justify-center md:justify-start gap-2 pt-2">
                                        <span className={`px-2 py-1 rounded text-[9px] font-black uppercase tracking-widest ${user.plan === 'PREMIUM' ? 'bg-amber-500/20 text-amber-400' : 'bg-slate-700 text-slate-400'}`}>
                                            {user.plan}
                                        </span>
                                        <span className={`px-2 py-1 rounded text-[9px] font-black uppercase tracking-widest ${user.documentStatus === 'VERIFIED' ? 'bg-blue-500/20 text-blue-400' : 'bg-slate-700 text-slate-400'}`}>
                                            {user.documentStatus === 'VERIFIED' ? 'Verificado' : 'Não Verificado'}
                                        </span>
                                    </div>
                                </div>

                                <div className="flex gap-2">
                                    {user.role !== 'ADMIN' && (
                                        <>
                                            <button 
                                                onClick={() => handleBlockToggle(user.id, user.accountStatus)}
                                                className={`p-3 rounded-xl border transition-all active:scale-95 ${user.accountStatus === 'BLOCKED' ? 'bg-green-500/10 border-green-500/30 text-green-400 hover:bg-green-500/20' : 'bg-amber-500/10 border-amber-500/30 text-amber-400 hover:bg-amber-500/20'}`}
                                                title={user.accountStatus === 'BLOCKED' ? 'Desbloquear' : 'Bloquear'}
                                            >
                                                {user.accountStatus === 'BLOCKED' ? <Unlock className="w-5 h-5" /> : <Lock className="w-5 h-5" />}
                                            </button>
                                            
                                            <button 
                                                onClick={() => handleDeleteMember(user.id)}
                                                className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 transition-all active:scale-95"
                                                title="Excluir Membro"
                                            >
                                                <Trash2 className="w-5 h-5" />
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
          </div>
      </main>
    </div>
  );
};