import React, { useState, useEffect } from 'react';
import { Wifi, WifiOff, FileSpreadsheet, RefreshCw, LogOut, User, Building2 } from 'lucide-react';
import { db } from '../services/db';
import { exportToExcel } from '../services/exporter';
import { AuthUser, syncWithCloud, clearStoredUser } from '../services/syncService';

interface HeaderProps {
  usdRate: number;
  setUsdRate: (rate: number) => void;
  rmbRate: number;
  setRmbRate: (rate: number) => void;
  currentUser: AuthUser;
  onLogout: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  usdRate,
  setUsdRate,
  rmbRate,
  setRmbRate,
  currentUser,
  onLogout
}) => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showCurrencyModal, setShowCurrencyModal] = useState(false);
  const [tempUsd, setTempUsd] = useState(usdRate.toString());
  const [tempRmb, setTempRmb] = useState(rmbRate.toString());
  const [stats, setStats] = useState({ suppliers: 0, products: 0 });
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatusMsg, setSyncStatusMsg] = useState<string | null>(null);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    const loadStats = async () => {
      const sCount = await db.suppliers.count();
      const pCount = await db.products.count();
      setStats({ suppliers: sCount, products: pCount });
    };

    loadStats();
    const interval = setInterval(loadStats, 4000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, []);

  const handleManualSync = async () => {
    if (isSyncing) return;
    setIsSyncing(true);
    setSyncStatusMsg('Sincronizando...');

    const res = await syncWithCloud(currentUser);
    setIsSyncing(false);
    setSyncStatusMsg(res.message);

    const sCount = await db.suppliers.count();
    const pCount = await db.products.count();
    setStats({ suppliers: sCount, products: pCount });

    setTimeout(() => setSyncStatusMsg(null), 3500);
  };

  const handleExport = async () => {
    const allSuppliers = await db.suppliers.toArray();
    const allProducts = await db.products.toArray();
    if (allSuppliers.length === 0 && allProducts.length === 0) {
      alert('Nenhum fornecedor ou produto cadastrado ainda.');
      return;
    }
    exportToExcel(allSuppliers, allProducts);
  };

  const handleSaveCurrency = (e: React.FormEvent) => {
    e.preventDefault();
    const u = parseFloat(tempUsd);
    const r = parseFloat(tempRmb);
    if (!isNaN(u) && u > 0) setUsdRate(u);
    if (!isNaN(r) && r > 0) setRmbRate(r);
    setShowCurrencyModal(false);
  };

  return (
    <>
      <header className="sticky top-0 z-40 bg-[#0B142B]/95 backdrop-blur-md border-b border-canton-borderSoft px-4 py-3">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-3">
          {/* Logo & Marca */}
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-canton-goldBright to-canton-gold flex items-center justify-center shadow-lg shadow-canton-gold/20">
              <Building2 className="w-5 h-5 text-black" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-display font-extrabold text-canton-cream text-base tracking-tight leading-none">
                  CANTON FAIR <span className="text-canton-gold">OS</span>
                </span>
                <span className="text-[10px] bg-canton-gold/15 text-canton-goldBright border border-canton-gold/30 px-1.5 py-0.5 rounded font-mono font-medium">
                  {currentUser.displayName}
                </span>
              </div>
              <p className="text-[11px] text-canton-dim flex items-center gap-2 mt-0.5 font-mono">
                <span>{stats.suppliers} Stands</span>
                <span>•</span>
                <span>{stats.products} Itens</span>
              </p>
            </div>
          </div>

          {/* Moedas & Ações */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Botão Sincronizar Nuvem */}
            <button
              onClick={handleManualSync}
              disabled={isSyncing}
              className={`bg-canton-surface border border-canton-border hover:border-canton-gold text-canton-cream rounded-lg px-2.5 py-1.5 text-xs flex items-center gap-1.5 active:scale-95 transition-all ${
                isSyncing ? 'animate-pulse text-canton-gold' : ''
              }`}
              title="Sincronizar contatos com o Hub Central da equipe"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-canton-gold ${isSyncing ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline font-mono">Sync</span>
            </button>

            {/* Botão Câmbio */}
            <button
              onClick={() => setShowCurrencyModal(true)}
              className="bg-canton-surface border border-canton-border rounded-lg px-2.5 py-1 text-left flex items-center gap-1.5 active:scale-95 transition-transform"
              title="Ajustar Cotação USD e RMB"
            >
              <div className="text-[10px] text-canton-gold font-mono leading-tight">
                <div>USD R$ {usdRate.toFixed(2)}</div>
                <div className="text-canton-dim">RMB $ {(1 / rmbRate).toFixed(2)}</div>
              </div>
            </button>

            {/* Exportar Excel */}
            <button
              onClick={handleExport}
              className="bg-gradient-to-r from-canton-goldBright to-canton-gold text-black font-semibold text-xs px-2.5 py-1.5 rounded-lg flex items-center gap-1 shadow-md shadow-canton-gold/15 active:scale-95 transition-all"
              title="Exportar tudo em XLSX"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Exportar</span>
            </button>

            {/* Logout */}
            <button
              onClick={onLogout}
              className="p-1.5 text-canton-dim hover:text-red-400 rounded-lg hover:bg-canton-surface transition-colors"
              title="Sair da conta"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Notificação flutuante de sincronização */}
        {syncStatusMsg && (
          <div className="text-center text-[11px] font-mono text-canton-gold bg-canton-surface border-t border-canton-border py-1 mt-2 -mx-4 animate-in fade-in duration-150">
            {syncStatusMsg}
          </div>
        )}
      </header>

      {/* Modal de Cotação Cambial */}
      {showCurrencyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="bg-canton-surface border border-canton-border rounded-2xl p-5 max-w-sm w-full space-y-4 shadow-2xl">
            <h3 className="font-display font-bold text-canton-cream text-lg">Cotações da Feira</h3>
            <p className="text-xs text-canton-dim">
              Atualize as taxas do dia para converter FOB RMB e FOB USD em Reais brasileiros com exatidão.
            </p>

            <form onSubmit={handleSaveCurrency} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-canton-gold uppercase tracking-wider block mb-1">
                  Cotação USD / BRL (R$)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={tempUsd}
                  onChange={(e) => setTempUsd(e.target.value)}
                  className="w-full bg-canton-dark border border-canton-border rounded-xl px-3 py-2 text-canton-cream font-mono text-sm focus:outline-none focus:border-canton-gold"
                  placeholder="Ex: 5.45"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-canton-gold uppercase tracking-wider block mb-1">
                  Cotação USD / RMB (¥ por USD)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={tempRmb}
                  onChange={(e) => setTempRmb(e.target.value)}
                  className="w-full bg-canton-dark border border-canton-border rounded-xl px-3 py-2 text-canton-cream font-mono text-sm focus:outline-none focus:border-canton-gold"
                  placeholder="Ex: 7.20"
                  required
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCurrencyModal(false)}
                  className="flex-1 px-4 py-2 rounded-xl border border-canton-border text-canton-body text-xs font-semibold hover:bg-canton-navy transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 rounded-xl bg-canton-gold text-black text-xs font-bold hover:bg-canton-goldBright transition-colors"
                >
                  Salvar Taxas
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};
