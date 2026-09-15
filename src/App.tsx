import React, { useEffect } from 'react';
import { useAppStore } from '@/core/store/appStore';
import { Header } from '@/components/layout/Header';
import { PillarShell } from '@/components/layout/PillarShell';
import { ToastContainer } from '@/components/ui/ToastContainer';

export const App: React.FC = () => {
  const initApp = useAppStore((state) => state.initApp);
  const isInitialized = useAppStore((state) => state.isInitialized);

  useEffect(() => {
    initApp();
  }, [initApp]);

  if (!isInitialized) {
    return (
      <div className="min-h-screen bg-bg-primary flex flex-col items-center justify-center p-4">
        <div className="w-12 h-12 rounded-xl bg-accent/20 border-2 border-accent flex items-center justify-center text-accent text-2xl animate-pulse shadow-glow mb-4">
          🔮
        </div>
        <h1 className="text-base font-bold text-text-primary uppercase tracking-wider">
          ARCANA RPG Suite
        </h1>
        <p className="text-xs text-text-muted mt-1">Carregando banco local (Dexie.js)...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-primary text-text-primary flex flex-col select-none overflow-hidden">
      <Header />
      <main className="flex-1 overflow-hidden relative">
        <PillarShell />
      </main>
      <ToastContainer />
    </div>
  );
};

export default App;
