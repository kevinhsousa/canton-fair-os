import React, { useState, useEffect } from 'react';
import { db } from '../services/db';
import { Supplier, Product, CantonPhase } from '../types';
import { PhotoPicker } from '../components/PhotoPicker';
import { calculateCbmAndContainers } from '../services/cbmEngine';
import { calculateLandedCost, DEFAULT_SIMULATION_PARAMS } from '../services/landedCostEngine';
import { runJevAnalysis } from '../services/jevEngine';
import { CheckCircle2, ChevronRight, ChevronLeft, Sparkles, Building2, Package, Calculator, Star, AlertTriangle } from 'lucide-react';

interface QuickAddPageProps {
  onSuccess: () => void;
  usdRate: number;
  rmbRate: number;
}

export const QuickAddPage: React.FC<QuickAddPageProps> = ({ onSuccess, usdRate, rmbRate }) => {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [existingSuppliers, setExistingSuppliers] = useState<Supplier[]>([]);
  const [selectedSupplierId, setSelectedSupplierId] = useState<string>('new');

  // Dados do Fornecedor / Stand
  const [phase, setPhase] = useState<CantonPhase>('Fase 1');
  const [hall, setHall] = useState('9.2');
  const [standNumber, setStandNumber] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [companyChinese, setCompanyChinese] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [wechatId, setWechatId] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [email, setEmail] = useState('');
  const [rating, setRating] = useState(4);
  const [tags, setTags] = useState<string[]>(['Fábrica Direta']);
  const [cardPhotos, setCardPhotos] = useState<string[]>([]);
  const [standPhotos, setStandPhotos] = useState<string[]>([]);

  // Dados do Produto
  const [productName, setProductName] = useState('');
  const [category, setCategory] = useState('Eletrônicos');
  const [fobPrice, setFobPrice] = useState('');
  const [currency, setCurrency] = useState<'USD' | 'RMB'>('USD');
  const [moq, setMoq] = useState('500');
  const [hsCode, setHsCode] = useState('');
  const [productPhotos, setProductPhotos] = useState<string[]>([]);

  // Dados de Embalagem & Carga
  const [unitsPerCarton, setUnitsPerCarton] = useState('20');
  const [cartonLengthCm, setCartonLengthCm] = useState('40');
  const [cartonWidthCm, setCartonWidthCm] = useState('30');
  const [cartonHeightCm, setCartonHeightCm] = useState('30');
  const [grossWeightKg, setGrossWeightKg] = useState('12');

  useEffect(() => {
    db.suppliers.toArray().then(setExistingSuppliers);
  }, []);

  // Simulação instantânea dos números de campo
  const parsedFob = parseFloat(fobPrice) || 0;
  const parsedMoq = parseInt(moq) || 500;
  const parsedUnits = parseInt(unitsPerCarton) || 1;
  const parsedL = parseFloat(cartonLengthCm) || 1;
  const parsedW = parseFloat(cartonWidthCm) || 1;
  const parsedH = parseFloat(cartonHeightCm) || 1;
  const parsedWeight = parseFloat(grossWeightKg) || 1;

  const cbmData = calculateCbmAndContainers(parsedL, parsedW, parsedH, parsedUnits, parsedWeight, parsedMoq);
  
  const simulationParams = {
    ...DEFAULT_SIMULATION_PARAMS,
    usdRate,
    rmbRate
  };

  const landedData = calculateLandedCost({
    fobPrice: parsedFob,
    currency,
    quantity: parsedMoq,
    unitsPerCarton: parsedUnits,
    cartonLengthCm: parsedL,
    cartonWidthCm: parsedW,
    cartonHeightCm: parsedH,
    grossWeightKg: parsedWeight,
    iiRate: 14.4,
    ipiRate: 9.75
  }, simulationParams);

  const jevData = runJevAnalysis(
    { name: productName, category, hsCode, moq: parsedMoq, cartonLengthCm: parsedL, cartonWidthCm: parsedW, cartonHeightCm: parsedH, unitsPerCarton: parsedUnits },
    landedData.unitCostSimplesBrl,
    landedData.suggestedSalePriceSimplesBrl,
    landedData.totalCbm
  );

  const toggleTag = (tag: string) => {
    if (tags.includes(tag)) {
      setTags(tags.filter(t => t !== tag));
    } else {
      setTags([...tags, tag]);
    }
  };

  const handleSave = async () => {
    if (!productName.trim()) {
      alert('Por favor, informe o nome do produto.');
      return;
    }

    let supplierIdToUse: number;

    if (selectedSupplierId === 'new') {
      if (!companyName.trim() && !standNumber.trim()) {
        alert('Informe ao menos o Nome da Empresa ou o Número do Stand.');
        return;
      }

      const newSupplier: Supplier = {
        syncId: `sup_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        phase,
        hall,
        standNumber: standNumber.trim() || 'S/N',
        companyName: companyName.trim() || `Stand ${standNumber}`,
        companyChinese,
        contactPerson,
        wechatId,
        whatsapp,
        email,
        rating,
        tags,
        businessCardPhoto: cardPhotos[0] || undefined,
        standPhoto: standPhotos[0] || undefined,
        createdAt: Date.now(),
        updatedAt: Date.now()
      };

      const insertedId = await db.suppliers.add(newSupplier);
      supplierIdToUse = Number(insertedId);
    } else {
      supplierIdToUse = parseInt(selectedSupplierId);
    }

    const newProduct: Product = {
      syncId: `prod_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      supplierId: supplierIdToUse,
      name: productName.trim(),
      category,
      photos: productPhotos,
      fobPrice: parsedFob,
      currency,
      moq: parsedMoq,
      hsCode,
      unitsPerCarton: parsedUnits,
      cartonLengthCm: parsedL,
      cartonWidthCm: parsedW,
      cartonHeightCm: parsedH,
      grossWeightKg: parsedWeight,
      innovationScore: jevData.innovationScore,
      dtcFitScore: jevData.dtcFitScore,
      regulatoryAlert: jevData.regulatoryAlert,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    await db.products.add(newProduct);
    onSuccess();
  };

  return (
    <div className="max-w-xl mx-auto p-4 pb-28 space-y-4">
      {/* Topo do Formulário */}
      <div className="flex items-center justify-between">
        <div>
          <span className="text-[10px] font-mono uppercase bg-canton-gold/20 text-canton-goldBright px-2 py-0.5 rounded border border-canton-gold/30">
            Canton Quick Register
          </span>
          <h2 className="font-display font-extrabold text-canton-cream text-xl mt-1">
            Cadastro Rápido de Stand
          </h2>
        </div>
        <div className="flex items-center gap-1 font-mono text-xs text-canton-gold">
          <span className={step >= 1 ? 'font-bold' : 'text-canton-dim'}>1</span>
          <span>•</span>
          <span className={step >= 2 ? 'font-bold' : 'text-canton-dim'}>2</span>
          <span>•</span>
          <span className={step >= 3 ? 'font-bold' : 'text-canton-dim'}>3</span>
        </div>
      </div>

      {/* ETAPA 1: STAND & FORNECEDOR */}
      {step === 1 && (
        <div className="space-y-4 animate-in fade-in duration-200">
          <div className="bg-canton-surface border border-canton-border rounded-2xl p-4 space-y-4">
            <h3 className="font-semibold text-canton-cream text-sm flex items-center gap-2">
              <Building2 className="w-4 h-4 text-canton-gold" /> Dados do Stand e Fornecedor
            </h3>

            {/* Selecionar Fornecedor Existente ou Novo */}
            {existingSuppliers.length > 0 && (
              <div>
                <label className="text-xs font-semibold text-canton-dim block mb-1">
                  Vincular a um Stand já cadastrado?
                </label>
                <select
                  value={selectedSupplierId}
                  onChange={(e) => setSelectedSupplierId(e.target.value)}
                  className="w-full bg-canton-dark border border-canton-border rounded-xl px-3 py-2 text-xs text-canton-cream focus:outline-none focus:border-canton-gold font-mono"
                >
                  <option value="new">+ Cadastrar Novo Stand</option>
                  {existingSuppliers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.standNumber} — {s.companyName} ({s.contactPerson || 'Sem contato'})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {selectedSupplierId === 'new' && (
              <>
                {/* Fase e Localização */}
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="text-[11px] font-semibold text-canton-gold block mb-1">Fase</label>
                    <select
                      value={phase}
                      onChange={(e) => setPhase(e.target.value as CantonPhase)}
                      className="w-full bg-canton-dark border border-canton-border rounded-xl px-2 py-2 text-xs text-canton-cream"
                    >
                      <option value="Fase 1">Fase 1</option>
                      <option value="Fase 2">Fase 2</option>
                      <option value="Fase 3">Fase 3</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-canton-gold block mb-1">Hall / Pavilhão</label>
                    <input
                      type="text"
                      value={hall}
                      onChange={(e) => setHall(e.target.value)}
                      placeholder="Ex: 9.2"
                      className="w-full bg-canton-dark border border-canton-border rounded-xl px-3 py-2 text-xs text-canton-cream font-mono"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-canton-gold block mb-1">Nº do Stand</label>
                    <input
                      type="text"
                      value={standNumber}
                      onChange={(e) => setStandNumber(e.target.value)}
                      placeholder="Ex: D14"
                      className="w-full bg-canton-dark border border-canton-border rounded-xl px-3 py-2 text-xs text-canton-cream font-mono font-bold"
                    />
                  </div>
                </div>

                {/* Nome da Empresa */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label className="text-[11px] font-semibold text-canton-dim block mb-1">Empresa (Inglês)</label>
                    <input
                      type="text"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      placeholder="Ex: Shenzhen Top Smart Co."
                      className="w-full bg-canton-dark border border-canton-border rounded-xl px-3 py-2 text-xs text-canton-cream font-medium"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-canton-dim block mb-1">Empresa (Chinês / Opcional)</label>
                    <input
                      type="text"
                      value={companyChinese}
                      onChange={(e) => setCompanyChinese(e.target.value)}
                      placeholder="Ex: 深圳市智能科技有限公司"
                      className="w-full bg-canton-dark border border-canton-border rounded-xl px-3 py-2 text-xs text-canton-cream"
                    />
                  </div>
                </div>

                {/* Contato Direto & WeChat */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[11px] font-semibold text-canton-dim block mb-1">Nome do Vendedor</label>
                    <input
                      type="text"
                      value={contactPerson}
                      onChange={(e) => setContactPerson(e.target.value)}
                      placeholder="Ex: David Zhang"
                      className="w-full bg-canton-dark border border-canton-border rounded-xl px-3 py-2 text-xs text-canton-cream"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-canton-gold block mb-1">WeChat ID</label>
                    <input
                      type="text"
                      value={wechatId}
                      onChange={(e) => setWechatId(e.target.value)}
                      placeholder="Ex: wx_david888"
                      className="w-full bg-canton-dark border border-canton-border rounded-xl px-3 py-2 text-xs text-canton-cream font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[11px] font-semibold text-canton-dim block mb-1">WhatsApp (+Código)</label>
                    <input
                      type="text"
                      value={whatsapp}
                      onChange={(e) => setWhatsapp(e.target.value)}
                      placeholder="+86 138 0000 0000"
                      className="w-full bg-canton-dark border border-canton-border rounded-xl px-3 py-2 text-xs text-canton-cream font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-canton-dim block mb-1">E-mail</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="sales@company.com"
                      className="w-full bg-canton-dark border border-canton-border rounded-xl px-3 py-2 text-xs text-canton-cream"
                    />
                  </div>
                </div>

                {/* Tags Rápidas */}
                <div>
                  <label className="text-[11px] font-semibold text-canton-dim block mb-1.5">Tags de Qualificação</label>
                  <div className="flex flex-wrap gap-1.5">
                    {['Fábrica Direta', 'OEM/ODM', 'Trading', 'Top Qualidade', 'Preço Agressivo', 'Patenteada'].map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => toggleTag(t)}
                        className={`text-[11px] px-2.5 py-1 rounded-lg border transition-all ${
                          tags.includes(t)
                            ? 'bg-canton-gold text-black border-canton-gold font-bold'
                            : 'bg-canton-dark text-canton-body border-canton-border hover:border-canton-gold'
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Fotos do Cartão e Fachada */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-canton-borderSoft">
                  <PhotoPicker
                    label="Cartão de Visita"
                    photos={cardPhotos}
                    onChange={setCardPhotos}
                    maxPhotos={2}
                  />
                  <PhotoPicker
                    label="Foto do Stand"
                    photos={standPhotos}
                    onChange={setStandPhotos}
                    maxPhotos={2}
                  />
                </div>
              </>
            )}
          </div>

          <button
            type="button"
            onClick={() => setStep(2)}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-canton-goldBright to-canton-gold text-black font-display font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-canton-gold/20 active:scale-95 transition-all"
          >
            Avançar para o Produto <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ETAPA 2: PRODUTO & PREÇO */}
      {step === 2 && (
        <div className="space-y-4 animate-in fade-in duration-200">
          <div className="bg-canton-surface border border-canton-border rounded-2xl p-4 space-y-4">
            <h3 className="font-semibold text-canton-cream text-sm flex items-center gap-2">
              <Package className="w-4 h-4 text-canton-gold" /> Produto e Cotação do Stand
            </h3>

            {/* Nome e Categoria */}
            <div>
              <label className="text-[11px] font-semibold text-canton-gold block mb-1">Nome do Produto</label>
              <input
                type="text"
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                placeholder="Ex: Fone Bluetooth TWS Noise Cancelling"
                className="w-full bg-canton-dark border border-canton-border rounded-xl px-3 py-2.5 text-xs text-canton-cream font-medium"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[11px] font-semibold text-canton-dim block mb-1">Categoria</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-canton-dark border border-canton-border rounded-xl px-3 py-2 text-xs text-canton-cream"
                >
                  <option value="Eletrônicos">Eletrônicos</option>
                  <option value="Utilidades Domésticas">Utilidades Domésticas</option>
                  <option value="Iluminação">Iluminação & LED</option>
                  <option value="Brinquedos">Brinquedos</option>
                  <option value="Ferramentas">Ferramentas</option>
                  <option value="Têxtil">Têxtil & Vestuário</option>
                  <option value="Bolsas & Acessórios">Bolsas & Mochilas</option>
                  <option value="Esportes">Esportes & Lazer</option>
                  <option value="Outros">Outros</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-canton-dim block mb-1">HS Code (6 dígitos)</label>
                <input
                  type="text"
                  value={hsCode}
                  onChange={(e) => setHsCode(e.target.value)}
                  placeholder="Ex: 851830"
                  className="w-full bg-canton-dark border border-canton-border rounded-xl px-3 py-2 text-xs text-canton-cream font-mono"
                />
              </div>
            </div>

            {/* Preço FOB e Moeda */}
            <div className="grid grid-cols-3 gap-2">
              <div className="col-span-2">
                <label className="text-[11px] font-semibold text-canton-gold block mb-1">Preço FOB Unitário</label>
                <input
                  type="number"
                  step="0.01"
                  value={fobPrice}
                  onChange={(e) => setFobPrice(e.target.value)}
                  placeholder="Ex: 4.80"
                  className="w-full bg-canton-dark border border-canton-border rounded-xl px-3 py-2 text-sm text-canton-gold font-mono font-bold"
                  required
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-canton-dim block mb-1">Moeda</label>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value as 'USD' | 'RMB')}
                  className="w-full bg-canton-dark border border-canton-border rounded-xl px-2 py-2 text-xs text-canton-cream font-bold"
                >
                  <option value="USD">USD ($)</option>
                  <option value="RMB">RMB (¥)</option>
                </select>
              </div>
            </div>

            {/* MOQ */}
            <div>
              <label className="text-[11px] font-semibold text-canton-dim block mb-1">MOQ (Pedido Mínimo de Peças)</label>
              <input
                type="number"
                value={moq}
                onChange={(e) => setMoq(e.target.value)}
                placeholder="Ex: 500"
                className="w-full bg-canton-dark border border-canton-border rounded-xl px-3 py-2 text-xs text-canton-cream font-mono"
              />
            </div>

            {/* Fotos do Produto */}
            <div className="pt-2 border-t border-canton-borderSoft">
              <PhotoPicker
                label="Fotos do Produto e Amostra"
                photos={productPhotos}
                onChange={setProductPhotos}
                maxPhotos={4}
              />
            </div>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="px-4 py-3.5 rounded-xl border border-canton-border text-canton-body text-xs font-semibold hover:bg-canton-navy flex items-center gap-1"
            >
              <ChevronLeft className="w-4 h-4" /> Voltar
            </button>
            <button
              type="button"
              onClick={() => setStep(3)}
              className="flex-1 py-3.5 rounded-xl bg-gradient-to-r from-canton-goldBright to-canton-gold text-black font-display font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-canton-gold/20 active:scale-95 transition-all"
            >
              Avançar para Carga & Custos <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ETAPA 3: EMBALAGEM, CBM & AUDITORIA FINAL */}
      {step === 3 && (
        <div className="space-y-4 animate-in fade-in duration-200">
          <div className="bg-canton-surface border border-canton-border rounded-2xl p-4 space-y-4">
            <h3 className="font-semibold text-canton-cream text-sm flex items-center gap-2">
              <Calculator className="w-4 h-4 text-canton-gold" /> Embalagem, CBM & Simulação Landed
            </h3>

            {/* Unidades por Caixa & Peso */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[11px] font-semibold text-canton-dim block mb-1">Peças por Caixa (pcs/ctn)</label>
                <input
                  type="number"
                  value={unitsPerCarton}
                  onChange={(e) => setUnitsPerCarton(e.target.value)}
                  placeholder="Ex: 20"
                  className="w-full bg-canton-dark border border-canton-border rounded-xl px-3 py-2 text-xs text-canton-cream font-mono"
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-canton-dim block mb-1">Peso Bruto Caixa (kg)</label>
                <input
                  type="number"
                  step="0.1"
                  value={grossWeightKg}
                  onChange={(e) => setGrossWeightKg(e.target.value)}
                  placeholder="Ex: 12"
                  className="w-full bg-canton-dark border border-canton-border rounded-xl px-3 py-2 text-xs text-canton-cream font-mono"
                />
              </div>
            </div>

            {/* Dimensões Caixa */}
            <div>
              <label className="text-[11px] font-semibold text-canton-gold block mb-1">
                Medidas da Caixa Master (cm: Comprimento × Largura × Altura)
              </label>
              <div className="grid grid-cols-3 gap-2">
                <input
                  type="number"
                  value={cartonLengthCm}
                  onChange={(e) => setCartonLengthCm(e.target.value)}
                  placeholder="Comp (cm)"
                  className="w-full bg-canton-dark border border-canton-border rounded-xl px-3 py-2 text-xs text-canton-cream font-mono text-center"
                />
                <input
                  type="number"
                  value={cartonWidthCm}
                  onChange={(e) => setCartonWidthCm(e.target.value)}
                  placeholder="Larg (cm)"
                  className="w-full bg-canton-dark border border-canton-border rounded-xl px-3 py-2 text-xs text-canton-cream font-mono text-center"
                />
                <input
                  type="number"
                  value={cartonHeightCm}
                  onChange={(e) => setCartonHeightCm(e.target.value)}
                  placeholder="Alt (cm)"
                  className="w-full bg-canton-dark border border-canton-border rounded-xl px-3 py-2 text-xs text-canton-cream font-mono text-center"
                />
              </div>
            </div>

            {/* Preview do CBM Calculado */}
            <div className="bg-canton-dark/70 border border-canton-borderSoft rounded-xl p-3 grid grid-cols-3 gap-2 text-center font-mono">
              <div>
                <span className="text-[9px] text-canton-dim block">CBM/Caixa</span>
                <span className="text-xs text-canton-gold font-bold">{cbmData.cbmPerCarton} m³</span>
              </div>
              <div>
                <span className="text-[9px] text-canton-dim block">Em 20' GP</span>
                <span className="text-xs text-canton-cream font-bold">{cbmData.unitsIn20GP} un</span>
              </div>
              <div>
                <span className="text-[9px] text-canton-dim block">Em 40' HQ</span>
                <span className="text-xs text-canton-goldBright font-bold">{cbmData.unitsIn40HQ} un</span>
              </div>
            </div>

            {/* Resumo Landed Cost no Brasil */}
            <div className="bg-canton-dark border border-canton-border rounded-xl p-3.5 space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs font-semibold text-canton-cream">Custo Landed Chegando no BR:</span>
                <span className="text-base font-mono font-bold text-canton-goldBright">
                  R$ {landedData.unitCostSimplesBrl.toFixed(2)} / un
                </span>
              </div>
              <div className="flex justify-between text-xs text-canton-dim font-mono">
                <span>P. Venda Sugerido (50% Margem):</span>
                <span className="text-canton-cream font-bold">R$ {landedData.suggestedSalePriceSimplesBrl.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-xs text-canton-dim font-mono">
                <span>Lucro Real (Líquido pós-crédito):</span>
                <span className="text-emerald-400 font-bold">R$ {landedData.unitCostLucroRealBrl.toFixed(2)}</span>
              </div>
            </div>

            {/* Alerta JEV Inteligente */}
            {jevData.regulatoryAlert !== 'NENHUMA' && (
              <div className="bg-amber-950/40 border border-amber-500/40 rounded-xl p-3 flex gap-2.5 text-xs text-amber-200">
                <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="block text-amber-300 font-bold font-mono">
                    ALERTA REGULATÓRIO: {jevData.regulatoryAlert}
                  </strong>
                  <p className="text-[11px] text-amber-200/90 mt-0.5 leading-snug">
                    {jevData.regulatoryDetails}
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setStep(2)}
              className="px-4 py-3.5 rounded-xl border border-canton-border text-canton-body text-xs font-semibold hover:bg-canton-navy flex items-center gap-1"
            >
              <ChevronLeft className="w-4 h-4" /> Voltar
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="flex-1 py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-400 text-black font-display font-extrabold text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 active:scale-95 transition-all"
            >
              <CheckCircle2 className="w-5 h-5" /> Salvar no Stand (Offline)
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
