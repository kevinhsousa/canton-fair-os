import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { BottomNav, NavTab } from './components/BottomNav';
import { StandsPage } from './pages/StandsPage';
import { QuickAddPage } from './pages/QuickAddPage';
import { ProductsPage } from './pages/ProductsPage';
import { CalculatorPage } from './pages/CalculatorPage';
import { JevRankingPage } from './pages/JevRankingPage';
import { LoginPage } from './components/LoginPage';
import { getStoredUser, clearStoredUser, syncWithCloud, AuthUser } from './services/syncService';
import { db } from './services/db';

export const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(getStoredUser());
  const [activeTab, setActiveTab] = useState<NavTab>('stands');
  const [usdRate, setUsdRate] = useState<number>(5.45);
  const [rmbRate, setRmbRate] = useState<number>(7.20);

  // Sincronização inicial ao carregar
  useEffect(() => {
    if (currentUser) {
      syncWithCloud(currentUser).catch((err) => {
        console.log('Sync offline fallback:', err);
      });
    }
  }, [currentUser]);

  const handleLogout = () => {
    clearStoredUser();
    setCurrentUser(null);
  };

  const handleLoginSuccess = (user: AuthUser) => {
    setCurrentUser(user);
    syncWithCloud(user).catch(() => {});
  };

  if (!currentUser) {
    return <LoginPage onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="min-h-screen bg-[#070D1E] text-canton-body">
      {/* Header Superior */}
      <Header
        usdRate={usdRate}
        setUsdRate={setUsdRate}
        rmbRate={rmbRate}
        setRmbRate={setRmbRate}
        currentUser={currentUser}
        onLogout={handleLogout}
      />

      {/* Conteúdo Dinâmico das Telas */}
      <main className="max-w-5xl mx-auto">
        {activeTab === 'stands' && (
          <StandsPage
            onAddProductToSupplier={() => setActiveTab('quick-add')}
            onGoToQuickAdd={() => setActiveTab('quick-add')}
          />
        )}

        {activeTab === 'quick-add' && (
          <QuickAddPage
            onSuccess={() => {
              setActiveTab('stands');
              syncWithCloud(currentUser).catch(() => {});
            }}
            usdRate={usdRate}
            rmbRate={rmbRate}
          />
        )}

        {activeTab === 'products' && (
          <ProductsPage
            usdRate={usdRate}
            rmbRate={rmbRate}
            onGoToQuickAdd={() => setActiveTab('quick-add')}
          />
        )}

        {activeTab === 'calc' && (
          <CalculatorPage
            usdRate={usdRate}
            rmbRate={rmbRate}
          />
        )}

        {activeTab === 'jev' && (
          <JevRankingPage
            usdRate={usdRate}
            rmbRate={rmbRate}
            onGoToProduct={() => setActiveTab('products')}
          />
        )}
      </main>

      {/* Navegação Inferior de Polegar */}
      <BottomNav activeTab={activeTab} onChangeTab={setActiveTab} />
    </div>
  );
};

export default App;
