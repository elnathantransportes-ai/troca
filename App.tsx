import React, { useState, useEffect, Suspense } from 'react';
import { ViewState, AppTab, User } from './types';
import { markTutorialSeen } from './services/mockFirebase';
import { ToastProvider } from './components/ToastContainer';
import Navigation from './components/Navigation';
import { Auth } from './components/Auth';
import { useStore } from './services/mockStore';
import { Loader2 } from './components/IconComponents';
import InstallPrompt from './components/InstallPrompt';

// Lazy Load Components (Code Splitting)
const CatalogoView = React.lazy(() => import('./components/CatalogoView'));
const AdsView = React.lazy(() => import('./components/AdsView'));
const NegotiationView = React.lazy(() => import('./components/NegotiationView'));
const ChallengeView = React.lazy(() => import('./components/ChallengeView'));
const ProfileView = React.lazy(() => import('./components/ProfileView'));
const AdminPanel = React.lazy(() => import('./components/AdminPanel').then(module => ({ default: module.AdminPanel })));
const Tutorial = React.lazy(() => import('./components/Tutorial'));

const LoadingScreen = () => (
  <div className="h-full flex flex-col items-center justify-center bg-[#020617] text-white">
     <Loader2 className="w-8 h-8 animate-spin text-indigo-500 mb-2" />
     <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Carregando...</p>
  </div>
);

const App: React.FC = () => {
  const { currentUser, setSessionUser, logout, isLoading } = useStore();
  const [viewState, setViewState] = useState<ViewState>(ViewState.AUTH);
  const [activeTab, setActiveTab] = useState<AppTab>(AppTab.CATALOGO);
  const [showTutorial, setShowTutorial] = useState(false);

  // Hardware Back Button Support (Android/History)
  useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
        if (event.state && event.state.tab) {
            setActiveTab(event.state.tab);
        } else if (viewState === ViewState.MAIN) {
            // Default to catalog on back if no state
            setActiveTab(AppTab.CATALOGO);
        }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [viewState]);

  const handleTabChange = (newTab: AppTab) => {
      setActiveTab(newTab);
      // Push state to allow back button to work
      window.history.pushState({ tab: newTab }, '', `?tab=${newTab}`);
  };

  // Sync ViewState with Auth State
  useEffect(() => {
    if (!isLoading) {
      if (currentUser) {
        if (currentUser.role === 'ADMIN') {
          setViewState(ViewState.ADMIN);
        } else {
          setViewState(ViewState.MAIN);
          if (currentUser.vistoTutorial === false) {
            setShowTutorial(true);
          }
        }
      } else {
        setViewState(ViewState.AUTH);
      }
    }
  }, [currentUser, isLoading]);

  // Security Guard for Admin
  useEffect(() => {
    if (viewState === ViewState.ADMIN && currentUser && currentUser.role !== 'ADMIN') {
       console.warn("Tentativa de acesso não autorizado ao Admin.");
       setViewState(ViewState.MAIN);
    }
  }, [viewState, currentUser]);

  const handleLogin = (loggedUser: User) => {
    setSessionUser(loggedUser);
  };

  const handleLogout = () => {
    logout();
    setViewState(ViewState.AUTH);
    setActiveTab(AppTab.CATALOGO);
    setShowTutorial(false);
  };

  const handleFinishTutorial = () => {
    if (currentUser) {
      markTutorialSeen(currentUser.id);
    }
    setShowTutorial(false);
  };

  const renderMainContent = () => {
    return (
      <Suspense fallback={<LoadingScreen />}>
        {activeTab === AppTab.CATALOGO && <CatalogoView user={currentUser} />}
        {activeTab === AppTab.ANUNCIO && <AdsView user={currentUser} onCancel={() => handleTabChange(AppTab.CATALOGO)} onSuccess={() => handleTabChange(AppTab.PERFIL)} />}
        {activeTab === AppTab.NEGOCIACAO && <NegotiationView user={currentUser} />}
        {activeTab === AppTab.DESAFIO && <ChallengeView user={currentUser} />}
        {activeTab === AppTab.PERFIL && <ProfileView user={currentUser} onLogout={handleLogout} onUpdateUser={setSessionUser} />}
      </Suspense>
    );
  };

  if (isLoading) {
    return (
      <div className="h-screen bg-[#020617] flex items-center justify-center text-white">
        <Loader2 className="w-10 h-10 animate-spin text-indigo-500" />
      </div>
    );
  }

  return (
    <ToastProvider>
        <div className="flex justify-center h-[100dvh] bg-black font-sans text-gray-100 overflow-hidden select-none">
        <div className="w-full max-w-md h-full bg-gray-900 flex flex-col relative shadow-2xl overflow-hidden">
            
            {viewState === ViewState.AUTH && <Auth onLogin={handleLogin} />}
            
            {viewState === ViewState.ADMIN && currentUser?.role === 'ADMIN' && (
                <Suspense fallback={<LoadingScreen />}>
                    <AdminPanel />
                </Suspense>
            )}
            
            {viewState === ViewState.MAIN && (
            <>
                <main 
                className={`flex-1 relative pb-0 custom-scrollbar scroll-smooth bg-[#020617] ${activeTab === AppTab.CATALOGO ? 'overflow-hidden' : 'overflow-y-auto'}`}
                id="main-scroll-container"
                >
                {renderMainContent()}
                </main>
                
                <Navigation activeTab={activeTab} onTabChange={handleTabChange} role={currentUser?.role || 'USER'} />
                <InstallPrompt />
                
                {showTutorial && (
                  <Suspense fallback={null}>
                    <Tutorial onFinish={handleFinishTutorial} />
                  </Suspense>
                )}
            </>
            )}

        </div>
        </div>
    </ToastProvider>
  );
};

export default App;