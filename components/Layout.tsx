import React, { ReactNode } from 'react';
import { useStore } from '../services/mockStore';
import { Home, Repeat, MessageCircle, Trophy, User, ShieldAlert, LogOut, Menu } from 'lucide-react';
import { UserRole } from '../types';

interface LayoutProps {
  children: ReactNode;
  currentView: string;
  setView: (view: string) => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, currentView, setView }) => {
  const { currentUser, logout, chats } = useStore();

  const unreadChats = chats.filter(c => 
    c.participants.includes(currentUser?.id || '') && 
    c.messages.length > 0 && 
    c.messages[c.messages.length-1].senderId !== currentUser?.id
  ).length;

  const NavItem = ({ id, icon: Icon, label, badge }: any) => (
    <button
      onClick={() => setView(id)}
      className={`flex flex-col md:flex-row items-center md:gap-3 p-2 md:px-4 md:py-3 rounded-xl transition-all relative group ${
        currentView === id 
        ? 'text-indigo-600 md:bg-indigo-50 font-semibold' 
        : 'text-gray-400 hover:text-indigo-500 hover:bg-gray-50'
      }`}
    >
      <div className="relative transition-transform duration-200 group-active:scale-90">
        <Icon className={`w-6 h-6 md:w-5 md:h-5 ${currentView === id ? 'fill-current opacity-20' : ''}`} />
        <Icon className="w-6 h-6 md:w-5 md:h-5 absolute top-0 left-0" />
        {badge > 0 && <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center border-2 border-white">{badge}</span>}
      </div>
      <span className="text-[10px] md:text-sm mt-1 md:mt-0 font-medium">{label}</span>
      
      {/* Mobile Active Indicator */}
      {currentView === id && (
          <div className="md:hidden absolute -top-2 left-1/2 transform -translate-x-1/2 w-8 h-1 bg-indigo-600 rounded-b-full shadow-[0_0_10px_rgba(79,70,229,0.5)]"></div>
      )}
    </button>
  );

  return (
    <div className="flex h-screen bg-gray-50 font-sans overflow-hidden">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 bg-white border-r h-full p-4 z-20 shadow-sm">
        <div className="flex items-center gap-2 px-2 mb-8 mt-2">
          <div className="bg-gradient-to-br from-indigo-600 to-purple-600 text-white p-2 rounded-lg font-bold text-xl shadow-lg">TT</div>
          <h1 className="text-xl font-bold text-gray-800 tracking-tight">TROCA TROCA</h1>
        </div>
        
        <nav className="flex-1 space-y-1">
          <NavItem id="feed" icon={Home} label="Início" />
          <NavItem id="trades" icon={Repeat} label="Trocas" />
          <NavItem id="chat" icon={MessageCircle} label="Chat" badge={unreadChats} />
          <NavItem id="podium" icon={Trophy} label="Podium" />
          <NavItem id="profile" icon={User} label="Perfil" />
          {currentUser?.role === UserRole.ADMIN && (
             <NavItem id="admin" icon={ShieldAlert} label="Painel Admin" />
          )}
        </nav>

        <div className="border-t pt-4 mt-auto">
          <button onClick={logout} className="flex items-center gap-3 text-gray-500 hover:text-red-600 px-4 py-3 w-full rounded-lg transition-colors hover:bg-red-50">
            <LogOut className="w-5 h-5" /> 
            <span className="font-medium">Sair</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto relative no-scrollbar bg-gray-50/50 safe-area-pt safe-area-pb pb-24 md:pb-0">
        <div className="max-w-7xl mx-auto h-full">
            {children}
        </div>
      </main>

      {/* Mobile Bottom Nav - Glassmorphism */}
      <div className="md:hidden fixed bottom-0 left-0 w-full bg-white/80 backdrop-blur-lg border-t border-gray-200/50 shadow-[0_-8px_30px_rgba(0,0,0,0.04)] z-50 px-6 py-2 pb-safe flex justify-between items-center safe-area-pb">
        <NavItem id="feed" icon={Home} label="Início" />
        <NavItem id="trades" icon={Repeat} label="Trocas" />
        <NavItem id="chat" icon={MessageCircle} label="Chat" badge={unreadChats} />
        <NavItem id="podium" icon={Trophy} label="Rank" />
        {currentUser?.role === UserRole.ADMIN ? (
             <NavItem id="admin" icon={ShieldAlert} label="Admin" />
        ) : (
            <NavItem id="profile" icon={User} label="Perfil" />
        )}
      </div>
    </div>
  );
};