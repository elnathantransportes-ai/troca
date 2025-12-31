import React, { useEffect, useState } from 'react';
import { AppTab } from '../types';
import { subscribeToData } from '../services/mockFirebase';
import { Home, Trophy, PlusSquare, MessageSquare, UserCircle } from './IconComponents';

interface NavigationProps {
  activeTab: AppTab;
  onTabChange: (tab: AppTab) => void;
  role?: string;
}

const Navigation: React.FC<NavigationProps> = ({ activeTab, onTabChange }) => {
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
     const unsubscribe = subscribeToData(() => {
         setUnreadCount(prev => prev > 0 ? prev : Math.floor(Math.random() * 2)); 
     });
     return () => unsubscribe();
  }, []);

  const tabs = [
    { id: AppTab.CATALOGO, label: 'Feed', Icon: Home },
    { id: AppTab.DESAFIO, label: 'Podium', Icon: Trophy },
    { id: AppTab.ANUNCIO, label: 'Vender', Icon: PlusSquare, isMain: true },
    { id: AppTab.NEGOCIACAO, label: 'Chat', Icon: MessageSquare, badge: unreadCount },
    { id: AppTab.PERFIL, label: 'Perfil', Icon: UserCircle },
  ];

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-full max-w-[90%] md:max-w-sm z-50 pointer-events-none animate-in slide-in-from-bottom-10 fade-in duration-500">
      {/* Floating Capsule */}
      <nav className="glass-panel rounded-full h-[4.5rem] px-2 flex items-center justify-between relative shadow-[0_20px_40px_-10px_rgba(0,0,0,0.7)] pointer-events-auto overflow-visible">
        
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          
          if (tab.isMain) {
             return (
                <button
                  key={tab.id}
                  onClick={() => onTabChange(tab.id)}
                  className="relative -top-6 group mx-2"
                >
                   {/* Glowing Ring Background */}
                   <div className="absolute inset-0 bg-amber-500 rounded-full blur-xl opacity-40 group-hover:opacity-70 transition-opacity duration-500"></div>
                   
                   <div className="w-16 h-16 rounded-full flex items-center justify-center border-[3px] border-white/10 bg-gradient-to-br from-amber-400 to-orange-600 text-white shadow-2xl relative z-10 transform transition-transform duration-300 group-hover:scale-110 active:scale-95">
                      <tab.Icon className="w-7 h-7 text-black drop-shadow-sm" />
                      
                      {/* Inner Shine */}
                      <div className="absolute top-0 left-0 w-full h-full rounded-full bg-gradient-to-b from-white/30 to-transparent pointer-events-none"></div>
                   </div>
                </button>
             )
          }

          return (
            <button
              key={tab.id}
              onClick={() => { if(tab.id === AppTab.NEGOCIACAO) setUnreadCount(0); onTabChange(tab.id); }}
              className={`relative flex flex-col items-center justify-center w-14 h-full group transition-all duration-500`}
            >
              {/* Active Ambient Glow */}
              <div className={`absolute -top-4 w-8 h-8 bg-indigo-500 rounded-full blur-xl transition-all duration-500 ${isActive ? 'opacity-40 scale-150' : 'opacity-0 scale-0'}`}></div>

              <div className={`relative z-10 transition-all duration-300 transform ${isActive ? '-translate-y-1' : ''}`}>
                 <tab.Icon className={`w-6 h-6 transition-all duration-300 ${isActive ? 'text-white stroke-[2.5px] drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]' : 'text-slate-500 group-hover:text-slate-300'}`} />
              </div>
              
              {/* Badge */}
              {tab.badge && tab.badge > 0 && (
                  <div className="absolute top-3 right-3 w-3 h-3 bg-red-500 rounded-full border border-[#0f172a] animate-pulse"></div>
              )}

              {/* Label */}
              <span className={`absolute bottom-2 text-[9px] font-black uppercase tracking-wider transition-all duration-300 ${isActive ? 'opacity-100 translate-y-0 text-white' : 'opacity-0 translate-y-2 text-slate-500'}`}>
                {tab.label}
              </span>
              
              {/* Active Dot */}
              <div className={`absolute bottom-1 w-1 h-1 bg-indigo-400 rounded-full transition-all duration-500 ${isActive ? 'opacity-100 scale-100' : 'opacity-0 scale-0'}`}></div>
            </button>
          );
        })}
      </nav>
    </div>
  );
};

export default Navigation;