import React, { useState, useEffect } from 'react';
import { db } from '../services/db';
import { Supplier, Product } from '../types';
import { exportSupplierToPdf } from '../services/exporter';
import { 
  Building2, Search, Star, MessageSquare, Phone, Copy, Check, 
  FileText, Plus, Trash2, Package, MapPin, ExternalLink 
} from 'lucide-react';

interface StandsPageProps {
  onAddProductToSupplier: (supplierId: number) => void;
  onGoToQuickAdd: () => void;
}

export const StandsPage: React.FC<StandsPageProps> = ({ onAddProductToSupplier, onGoToQuickAdd }) => {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState('');
  const [phaseFilter, setPhaseFilter] = useState<'TODAS' | 'Fase 1' | 'Fase 2' | 'Fase 3'>('TODAS');
  const [copiedWeChat, setCopiedWeChat] = useState<string | null>(null);

  const loadData = async () => {
    const sups = await db.suppliers.reverse().toArray();
    const prods = await db.products.toArray();
    setSuppliers(sups);
    setProducts(prods);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCopyWeChat = (wechatId: string) => {
    navigator.clipboard.writeText(wechatId);
    setCopiedWeChat(wechatId);
    setTimeout(() => setCopiedWeChat(null), 2000);
  };

  const handleDeleteSupplier = async (id?: number) => {
    if (!id) return;
    if (confirm('Deseja realmente remover este fornecedor e todos os produtos dele?')) {
      await db.suppliers.delete(id);
      await db.products.where('supplierId').equals(id).delete();
      loadData();
    }
  };

  const filteredSuppliers = suppliers.filter((s) => {
    const matchesPhase = phaseFilter === 'TODAS' || s.phase === phaseFilter;
    const term = search.toLowerCase();
    const matchesSearch =
      s.companyName.toLowerCase().includes(term) ||
      s.standNumber.toLowerCase().includes(term) ||
      (s.contactPerson && s.contactPerson.toLowerCase().includes(term)) ||
      (s.wechatId && s.wechatId.toLowerCase().includes(term)) ||
      (s.tags && s.tags.some(t => t.toLowerCase().includes(term)));
    return matchesPhase && matchesSearch;
  });

  return (
    <div className="max-w-2xl mx-auto p-4 pb-28 space-y-4">
      {/* Topo com Título e Ação Rápida */}
      <div className="flex items-center justify-between">
        <div>
          <span className="text-[10px] font-mono uppercase bg-canton-gold/20 text-canton-goldBright px-2 py-0.5 rounded border border-canton-gold/30">
            Fornecedores & Pavilhões
          </span>
          <h2 className="font-display font-extrabold text-canton-cream text-xl mt-1">
            Stands Cadastrados
          </h2>
        </div>
        <button
          onClick={onGoToQuickAdd}
          className="bg-canton-gold text-black font-semibold text-xs px-3 py-2 rounded-xl flex items-center gap-1.5 shadow-md shadow-canton-gold/20 active:scale-95 transition-all"
        >
          <Plus className="w-4 h-4" /> Novo Stand
        </button>
      </div>

      {/* Barra de Busca e Filtro de Fases */}
      <div className="space-y-2">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-canton-dim" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por stand (ex: D14), empresa, tag ou WeChat..."
            className="w-full bg-canton-surface border border-canton-border rounded-xl pl-9 pr-4 py-2.5 text-xs text-canton-cream placeholder-canton-dim focus:outline-none focus:border-canton-gold"
          />
        </div>

        <div className="flex gap-1.5 overflow-x-auto pb-1">
          {['TODAS', 'Fase 1', 'Fase 2', 'Fase 3'].map((p) => (
            <button
              key={p}
              onClick={() => setPhaseFilter(p as any)}
              className={`text-[11px] px-3 py-1.5 rounded-lg border font-mono whitespace-nowrap transition-all ${
                phaseFilter === p
                  ? 'bg-canton-gold text-black border-canton-gold font-bold shadow'
                  : 'bg-canton-surface text-canton-dim border-canton-border hover:border-canton-gold'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Lista de Stands */}
      {filteredSuppliers.length === 0 ? (
        <div className="bg-canton-surface border border-canton-border rounded-2xl p-8 text-center space-y-3">
          <Building2 className="w-10 h-10 text-canton-dim mx-auto stroke-1" />
          <p className="text-sm text-canton-dim">Nenhum stand encontrado.</p>
          <button
            onClick={onGoToQuickAdd}
            className="text-xs text-canton-gold font-semibold underline underline-offset-4"
          >
            Cadastrar primeiro fornecedor agora
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredSuppliers.map((supplier) => {
            const supProducts = products.filter(p => p.supplierId === supplier.id);

            return (
              <div
                key={supplier.id}
                className="bg-canton-surface border border-canton-border hover:border-canton-gold/50 rounded-2xl p-4 space-y-3 transition-all shadow-lg shadow-black/20"
              >
                {/* Header do Card */}
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="bg-canton-gold text-black font-mono font-extrabold text-xs px-2 py-0.5 rounded shadow-sm">
                        {supplier.standNumber}
                      </span>
                      <span className="text-[11px] font-mono text-canton-dim">
                        {supplier.phase} • Hall {supplier.hall}
                      </span>
                    </div>

                    <h3 className="font-display font-bold text-canton-cream text-base leading-tight">
                      {supplier.companyName}
                    </h3>
                    {supplier.companyChinese && (
                      <p className="text-xs text-canton-dim font-sans">{supplier.companyChinese}</p>
                    )}
                  </div>

                  {/* Foto de Capa (Cartão ou Fachada) */}
                  {(supplier.businessCardPhoto || supplier.standPhoto) && (
                    <div className="w-14 h-14 rounded-xl overflow-hidden border border-canton-border shrink-0 bg-canton-dark">
                      <img
                        src={supplier.businessCardPhoto || supplier.standPhoto}
                        alt="Cartão/Stand"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                </div>

                {/* Contatos Rápidos (WeChat / WhatsApp / Contato) */}
                <div className="grid grid-cols-2 gap-2 text-xs font-mono bg-canton-dark/60 border border-canton-borderSoft rounded-xl p-2.5">
                  <div className="space-y-0.5">
                    <span className="text-[10px] text-canton-dim block">Contato / Vendedor</span>
                    <span className="text-canton-cream font-medium truncate block">
                      {supplier.contactPerson || 'Não informado'}
                    </span>
                  </div>

                  <div className="space-y-0.5">
                    <span className="text-[10px] text-canton-gold block">WeChat ID</span>
                    {supplier.wechatId ? (
                      <button
                        onClick={() => handleCopyWeChat(supplier.wechatId)}
                        className="flex items-center gap-1 text-canton-goldBright font-bold hover:underline"
                        title="Copiar WeChat ID"
                      >
                        {copiedWeChat === supplier.wechatId ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-400" /> Copiado!
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" /> {supplier.wechatId}
                          </>
                        )}
                      </button>
                    ) : (
                      <span className="text-canton-dim">Sem WeChat</span>
                    )}
                  </div>
                </div>

                {/* Tags */}
                {supplier.tags && supplier.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {supplier.tags.map((t, idx) => (
                      <span
                        key={idx}
                        className="text-[10px] px-2 py-0.5 rounded-md bg-canton-surface border border-canton-borderSoft text-canton-body font-medium"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                )}

                {/* Rodapé com Produtos e Ações */}
                <div className="flex items-center justify-between pt-2 border-t border-canton-borderSoft text-xs">
                  <div className="flex items-center gap-1.5 text-canton-gold font-mono">
                    <Package className="w-3.5 h-3.5" />
                    <span>{supProducts.length} {supProducts.length === 1 ? 'produto' : 'produtos'}</span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {/* Gerar PDF */}
                    <button
                      onClick={() => exportSupplierToPdf(supplier, products)}
                      className="px-2.5 py-1.5 rounded-lg border border-canton-border text-canton-cream hover:border-canton-gold flex items-center gap-1 font-mono text-[11px]"
                      title="Gerar Dossiê PDF para WhatsApp"
                    >
                      <FileText className="w-3 h-3 text-canton-gold" /> PDF
                    </button>

                    {/* Adicionar Produto */}
                    <button
                      onClick={() => onAddProductToSupplier(supplier.id!)}
                      className="px-2.5 py-1.5 rounded-lg bg-canton-surface border border-canton-gold/40 text-canton-goldBright hover:bg-canton-gold hover:text-black font-semibold flex items-center gap-1 text-[11px] transition-all"
                    >
                      <Plus className="w-3 h-3" /> Item
                    </button>

                    {/* Excluir */}
                    <button
                      onClick={() => handleDeleteSupplier(supplier.id)}
                      className="p-1.5 text-canton-dim hover:text-red-400 hover:bg-canton-dark rounded-lg transition-colors"
                      title="Excluir Stand"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
