import React, { useState, useEffect } from 'react';
import { db } from '../services/db';
import { Product, Supplier, LandedCostBreakdown } from '../types';
import { calculateLandedCost, DEFAULT_SIMULATION_PARAMS } from '../services/landedCostEngine';
import { calculateCbmAndContainers } from '../services/cbmEngine';
import { LandedCostDetailModal } from '../components/LandedCostDetailModal';
import { 
  Package, Search, DollarSign, Box, Ship, Eye, Trash2, 
  Sparkles, AlertTriangle, ArrowUpDown, ChevronRight 
} from 'lucide-react';

interface ProductsPageProps {
  usdRate: number;
  rmbRate: number;
  onGoToQuickAdd: () => void;
}

export const ProductsPage: React.FC<ProductsPageProps> = ({ usdRate, rmbRate, onGoToQuickAdd }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('TODAS');
  const [sortBy, setSortBy] = useState<'NEWEST' | 'PRICE_ASC' | 'JEV_SCORE'>('NEWEST');

  // Modal de Auditoria
  const [modalOpen, setModalOpen] = useState(false);
  const [activeBreakdown, setActiveBreakdown] = useState<LandedCostBreakdown | null>(null);
  const [activeProductName, setActiveProductName] = useState('');
  const [activeSupplierName, setActiveSupplierName] = useState('');
  const [activeStandNumber, setActiveStandNumber] = useState('');

  const loadData = async () => {
    const prods = await db.products.reverse().toArray();
    const sups = await db.suppliers.toArray();
    setProducts(prods);
    setSuppliers(sups);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleDeleteProduct = async (id?: number) => {
    if (!id) return;
    if (confirm('Deseja excluir este produto?')) {
      await db.products.delete(id);
      loadData();
    }
  };

  const handleOpenAudit = (product: Product, supplier?: Supplier) => {
    const simulationParams = {
      ...DEFAULT_SIMULATION_PARAMS,
      usdRate,
      rmbRate
    };

    const breakdown = calculateLandedCost({
      fobPrice: product.fobPrice,
      currency: product.currency,
      quantity: product.moq || 500,
      unitsPerCarton: product.unitsPerCarton || 10,
      cartonLengthCm: product.cartonLengthCm || 40,
      cartonWidthCm: product.cartonWidthCm || 30,
      cartonHeightCm: product.cartonHeightCm || 30,
      grossWeightKg: product.grossWeightKg || 10,
      iiRate: 14.4,
      ipiRate: 9.75
    }, simulationParams);

    setActiveBreakdown(breakdown);
    setActiveProductName(product.name);
    setActiveSupplierName(supplier ? supplier.companyName : '');
    setActiveStandNumber(supplier ? supplier.standNumber : '');
    setModalOpen(true);
  };

  const filteredProducts = products.filter((p) => {
    const matchesCategory = selectedCategory === 'TODAS' || p.category === selectedCategory;
    const term = search.toLowerCase();
    const s = suppliers.find(sup => sup.id === p.supplierId);
    const matchesSearch =
      p.name.toLowerCase().includes(term) ||
      (p.hsCode && p.hsCode.toLowerCase().includes(term)) ||
      (s && (s.companyName.toLowerCase().includes(term) || s.standNumber.toLowerCase().includes(term)));
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="max-w-2xl mx-auto p-4 pb-28 space-y-4">
      {/* Topo da Página */}
      <div className="flex items-center justify-between">
        <div>
          <span className="text-[10px] font-mono uppercase bg-canton-gold/20 text-canton-goldBright px-2 py-0.5 rounded border border-canton-gold/30">
            Catálogo & CBM
          </span>
          <h2 className="font-display font-extrabold text-canton-cream text-xl mt-1">
            Produtos Fotografados
          </h2>
        </div>
        <button
          onClick={onGoToQuickAdd}
          className="bg-canton-gold text-black font-semibold text-xs px-3 py-2 rounded-xl flex items-center gap-1.5 shadow-md shadow-canton-gold/20 active:scale-95 transition-all"
        >
          + Novo Produto
        </button>
      </div>

      {/* Busca e Filtros */}
      <div className="space-y-2">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-canton-dim" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por produto, stand ou HS Code..."
            className="w-full bg-canton-surface border border-canton-border rounded-xl pl-9 pr-4 py-2.5 text-xs text-canton-cream placeholder-canton-dim focus:outline-none focus:border-canton-gold"
          />
        </div>

        <div className="flex gap-1.5 overflow-x-auto pb-1">
          {['TODAS', 'Eletrônicos', 'Utilidades Domésticas', 'Iluminação', 'Brinquedos', 'Ferramentas', 'Bolsas & Acessórios'].map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`text-[11px] px-3 py-1.5 rounded-lg border font-mono whitespace-nowrap transition-all ${
                selectedCategory === cat
                  ? 'bg-canton-gold text-black border-canton-gold font-bold shadow'
                  : 'bg-canton-surface text-canton-dim border-canton-border hover:border-canton-gold'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Lista de Produtos */}
      {filteredProducts.length === 0 ? (
        <div className="bg-canton-surface border border-canton-border rounded-2xl p-8 text-center space-y-3">
          <Package className="w-10 h-10 text-canton-dim mx-auto stroke-1" />
          <p className="text-sm text-canton-dim">Nenhum produto cadastrado nesta categoria.</p>
          <button
            onClick={onGoToQuickAdd}
            className="text-xs text-canton-gold font-semibold underline underline-offset-4"
          >
            Cadastrar primeiro produto no stand
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredProducts.map((product) => {
            const supplier = suppliers.find(s => s.id === product.supplierId);
            const cbm = calculateCbmAndContainers(
              product.cartonLengthCm,
              product.cartonWidthCm,
              product.cartonHeightCm,
              product.unitsPerCarton,
              product.grossWeightKg,
              product.moq
            );

            const simulationParams = {
              ...DEFAULT_SIMULATION_PARAMS,
              usdRate,
              rmbRate
            };

            const landed = calculateLandedCost({
              fobPrice: product.fobPrice,
              currency: product.currency,
              quantity: product.moq,
              unitsPerCarton: product.unitsPerCarton,
              cartonLengthCm: product.cartonLengthCm,
              cartonWidthCm: product.cartonWidthCm,
              cartonHeightCm: product.cartonHeightCm,
              grossWeightKg: product.grossWeightKg,
              iiRate: 14.4,
              ipiRate: 9.75
            }, simulationParams);

            return (
              <div
                key={product.id}
                className="bg-canton-surface border border-canton-border hover:border-canton-gold/50 rounded-2xl p-4 space-y-3 transition-all shadow-lg shadow-black/20"
              >
                {/* Cabeçalho do Card */}
                <div className="flex gap-3 items-start">
                  {/* Foto do Produto */}
                  <div className="w-20 h-20 rounded-xl overflow-hidden border border-canton-border shrink-0 bg-canton-dark flex items-center justify-center">
                    {product.photos && product.photos.length > 0 ? (
                      <img src={product.photos[0]} alt={product.name} className="w-full h-full object-cover" />
                    ) : (
                      <Package className="w-7 h-7 text-canton-dim stroke-1" />
                    )}
                  </div>

                  {/* Informações Principais */}
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] bg-canton-gold/15 text-canton-goldBright border border-canton-gold/30 px-2 py-0.5 rounded font-mono font-bold">
                        {product.category}
                      </span>
                      {supplier && (
                        <span className="text-[11px] font-mono text-canton-cream font-bold">
                          Stand {supplier.standNumber}
                        </span>
                      )}
                    </div>

                    <h3 className="font-display font-bold text-canton-cream text-base leading-tight truncate">
                      {product.name}
                    </h3>

                    {supplier && (
                      <p className="text-xs text-canton-dim truncate">{supplier.companyName}</p>
                    )}
                  </div>
                </div>

                {/* Preços e CBM */}
                <div className="grid grid-cols-3 gap-2 bg-canton-dark/70 border border-canton-borderSoft rounded-xl p-2.5 text-center font-mono">
                  <div>
                    <span className="text-[9px] text-canton-dim block">FOB Unitário</span>
                    <span className="text-xs text-canton-gold font-bold">
                      {product.currency} {product.fobPrice.toFixed(2)}
                    </span>
                  </div>

                  <div>
                    <span className="text-[9px] text-canton-dim block">Landed BR (Simples)</span>
                    <span className="text-xs text-canton-goldBright font-extrabold">
                      R$ {landed.unitCostSimplesBrl.toFixed(2)}
                    </span>
                  </div>

                  <div>
                    <span className="text-[9px] text-canton-dim block">Em 40' HQ</span>
                    <span className="text-xs text-canton-cream font-bold">
                      {cbm.unitsIn40HQ} un
                    </span>
                  </div>
                </div>

                {/* Tags JEV e Alertas */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                  <div className="flex items-center gap-1.5">
                    {product.innovationScore && (
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-950/40 border border-purple-500/30 text-purple-300">
                        JEV Inovação: {product.innovationScore}
                      </span>
                    )}
                    {product.regulatoryAlert && product.regulatoryAlert !== 'NENHUMA' && (
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-950/40 border border-amber-500/40 text-amber-300 flex items-center gap-1 font-bold">
                        <AlertTriangle className="w-3 h-3" /> {product.regulatoryAlert}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleOpenAudit(product, supplier)}
                      className="px-2.5 py-1 rounded-lg bg-canton-navy border border-canton-gold/40 text-canton-gold font-mono text-[11px] hover:bg-canton-gold hover:text-black transition-all flex items-center gap-1"
                    >
                      <Eye className="w-3 h-3" /> Auditoria Landed
                    </button>

                    <button
                      onClick={() => handleDeleteProduct(product.id)}
                      className="p-1 text-canton-dim hover:text-red-400 transition-colors"
                      title="Excluir Produto"
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

      {/* Modal de Detalhamento Aduaneiro */}
      {activeBreakdown && (
        <LandedCostDetailModal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          productName={activeProductName}
          breakdown={activeBreakdown}
          supplierName={activeSupplierName}
          standNumber={activeStandNumber}
        />
      )}
    </div>
  );
};
