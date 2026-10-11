import React, { useState, useEffect } from 'react';
import { calculateLandedCost, DEFAULT_SIMULATION_PARAMS } from '../services/landedCostEngine';
import { calculateCbmAndContainers } from '../services/cbmEngine';
import { FreightModal, SimulationParams } from '../types';
import { LandedCostDetailModal } from '../components/LandedCostDetailModal';
import { 
  Calculator, Ship, Plane, DollarSign, Box, Percent, 
  HelpCircle, Eye, ArrowRight, Sparkles 
} from 'lucide-react';

interface CalculatorPageProps {
  usdRate: number;
  rmbRate: number;
}

export const CalculatorPage: React.FC<CalculatorPageProps> = ({ usdRate, rmbRate }) => {
  // Inputs do Produto
  const [fobPrice, setFobPrice] = useState('5.50');
  const [currency, setCurrency] = useState<'USD' | 'RMB'>('USD');
  const [quantity, setQuantity] = useState('1000');
  const [unitsPerCarton, setUnitsPerCarton] = useState('20');
  const [cartonLengthCm, setCartonLengthCm] = useState('45');
  const [cartonWidthCm, setCartonWidthCm] = useState('35');
  const [cartonHeightCm, setCartonHeightCm] = useState('30');
  const [grossWeightKg, setGrossWeightKg] = useState('14');

  // Tributos Oficiais
  const [iiRate, setIiRate] = useState('14.4');
  const [ipiRate, setIpiRate] = useState('9.75');
  const [pisRate, setPisRate] = useState('2.1');
  const [cofinsRate, setCofinsRate] = useState('9.65');

  // Modal Logístico e Despesas
  const [modal, setModal] = useState<FreightModal>('FCL_40HQ');
  const [freightCostUsd, setFreightCostUsd] = useState('4500');
  const [icmsChoice, setIcmsChoice] = useState<'SC_TTD' | 'SC_NORMAL' | 'PR_IMPORT' | 'SP_NORMAL'>('SC_TTD');
  const [targetMargin, setTargetMargin] = useState('50');

  // Modal de Auditoria Detalhada
  const [showModal, setShowModal] = useState(false);

  // Ajustar frete padrão conforme o modal muda
  const handleModalChange = (newModal: FreightModal) => {
    setModal(newModal);
    if (newModal === 'FCL_20') setFreightCostUsd('3200');
    else if (newModal === 'FCL_40HQ') setFreightCostUsd('4500');
    else if (newModal === 'LCL') setFreightCostUsd('65'); // USD por CBM
    else if (newModal === 'AIR') setFreightCostUsd('8.5'); // USD por kg
  };

  let icmsAliq = 4.0;
  if (icmsChoice === 'SC_TTD') icmsAliq = 4.0;
  else if (icmsChoice === 'PR_IMPORT') icmsAliq = 4.0;
  else if (icmsChoice === 'SC_NORMAL') icmsAliq = 17.0;
  else if (icmsChoice === 'SP_NORMAL') icmsAliq = 18.0;

  const simParams: SimulationParams = {
    ...DEFAULT_SIMULATION_PARAMS,
    usdRate,
    rmbRate,
    modal,
    freightCostUsd: parseFloat(freightCostUsd) || 0,
    icmsState: icmsChoice,
    icmsRate: icmsAliq,
    targetMarginPercent: parseFloat(targetMargin) || 50
  };

  const parsedQty = parseInt(quantity) || 1;
  const parsedFob = parseFloat(fobPrice) || 0;
  const parsedUnits = parseInt(unitsPerCarton) || 1;
  const parsedL = parseFloat(cartonLengthCm) || 1;
  const parsedW = parseFloat(cartonWidthCm) || 1;
  const parsedH = parseFloat(cartonHeightCm) || 1;
  const parsedWeight = parseFloat(grossWeightKg) || 1;

  const cbm = calculateCbmAndContainers(parsedL, parsedW, parsedH, parsedUnits, parsedWeight, parsedQty);

  const breakdown = calculateLandedCost({
    fobPrice: parsedFob,
    currency,
    quantity: parsedQty,
    unitsPerCarton: parsedUnits,
    cartonLengthCm: parsedL,
    cartonWidthCm: parsedW,
    cartonHeightCm: parsedH,
    grossWeightKg: parsedWeight,
    iiRate: parseFloat(iiRate) || 0,
    ipiRate: parseFloat(ipiRate) || 0,
    pisRate: parseFloat(pisRate) || 2.1,
    cofinsRate: parseFloat(cofinsRate) || 9.65
  }, simParams);

  return (
    <div className="max-w-2xl mx-auto p-4 pb-28 space-y-4">
      {/* Topo da Calculadora */}
      <div className="flex items-center justify-between">
        <div>
          <span className="text-[10px] font-mono uppercase bg-canton-gold/20 text-canton-goldBright px-2 py-0.5 rounded border border-canton-gold/30">
            Simulador de Importação
          </span>
          <h2 className="font-display font-extrabold text-canton-cream text-xl mt-1">
            Calculadora Landed Cost
          </h2>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="bg-canton-surface border border-canton-gold/40 text-canton-gold hover:bg-canton-gold hover:text-black font-semibold text-xs px-3 py-2 rounded-xl flex items-center gap-1.5 transition-all"
        >
          <Eye className="w-3.5 h-3.5" /> Ver DRE Aduaneira
        </button>
      </div>

      {/* CARD PRINCIPAL COM RESULTADO EM DESTAQUE */}
      <div className="bg-gradient-to-br from-[#101D3E] to-[#0E1A38] border-2 border-canton-gold/40 rounded-2xl p-5 shadow-2xl space-y-4 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-canton-gold/5 rounded-full blur-2xl pointer-events-none" />

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <span className="text-[11px] font-mono uppercase tracking-wider text-canton-gold block">
              Custo Landed Unitário (BR)
            </span>
            <div className="text-2xl sm:text-3xl font-mono font-extrabold text-canton-cream">
              R$ {breakdown.unitCostSimplesBrl.toFixed(2)}
            </div>
            <p className="text-[11px] text-canton-dim">
              No Simples Nacional / MEI
            </p>
          </div>

          <div className="space-y-1 border-l border-canton-borderSoft pl-4">
            <span className="text-[11px] font-mono uppercase tracking-wider text-emerald-400 block">
              P. Venda Sugerido ({targetMargin}%)
            </span>
            <div className="text-2xl sm:text-3xl font-mono font-extrabold text-canton-goldBright">
              R$ {breakdown.suggestedSalePriceSimplesBrl.toFixed(2)}
            </div>
            <p className="text-[11px] text-canton-dim font-mono">
              Lucro Total: <strong className="text-emerald-400">R$ {breakdown.projectedProfitBrl.toFixed(0)}</strong>
            </p>
          </div>
        </div>

        {/* Resumo Rápido de Carga & Impostos */}
        <div className="grid grid-cols-3 gap-2 bg-canton-dark/70 border border-canton-borderSoft rounded-xl p-2.5 text-center text-xs font-mono">
          <div>
            <span className="text-[9px] text-canton-dim block">Valor Aduaneiro CIF</span>
            <span className="text-canton-cream font-bold">R$ {breakdown.cifBrl.toFixed(0)}</span>
          </div>
          <div>
            <span className="text-[9px] text-canton-dim block">Tributos Totais</span>
            <span className="text-amber-400 font-bold">
              R$ {(breakdown.iiBrl + breakdown.ipiBrl + breakdown.pisBrl + breakdown.cofinsBrl + breakdown.icmsBrl).toFixed(0)}
            </span>
          </div>
          <div>
            <span className="text-[9px] text-canton-dim block">Volume da Carga</span>
            <span className="text-canton-gold font-bold">{breakdown.totalCbm.toFixed(1)} m³</span>
          </div>
        </div>
      </div>

      {/* FORMULÁRIO DE PARÂMETROS DA SIMULAÇÃO */}
      <div className="bg-canton-surface border border-canton-border rounded-2xl p-4 space-y-4">
        <h3 className="font-semibold text-canton-cream text-sm flex items-center gap-2">
          <DollarSign className="w-4 h-4 text-canton-gold" /> Parâmetros de Compra & Quantidade
        </h3>

        {/* FOB, Moeda e Quantidade */}
        <div className="grid grid-cols-3 gap-2">
          <div className="col-span-2">
            <label className="text-[11px] font-semibold text-canton-gold block mb-1">Preço FOB Unitário</label>
            <input
              type="number"
              step="0.01"
              value={fobPrice}
              onChange={(e) => setFobPrice(e.target.value)}
              className="w-full bg-canton-dark border border-canton-border rounded-xl px-3 py-2 text-sm text-canton-cream font-mono font-bold"
            />
          </div>

          <div>
            <label className="text-[11px] font-semibold text-canton-dim block mb-1">Moeda</label>
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value as any)}
              className="w-full bg-canton-dark border border-canton-border rounded-xl px-2 py-2 text-xs text-canton-cream font-bold"
            >
              <option value="USD">USD ($)</option>
              <option value="RMB">RMB (¥)</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-[11px] font-semibold text-canton-dim block mb-1">Quantidade Total (unidades)</label>
            <input
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="w-full bg-canton-dark border border-canton-border rounded-xl px-3 py-2 text-xs text-canton-cream font-mono"
            />
          </div>

          <div>
            <label className="text-[11px] font-semibold text-canton-dim block mb-1">Margem Desejada (%)</label>
            <input
              type="number"
              value={targetMargin}
              onChange={(e) => setTargetMargin(e.target.value)}
              className="w-full bg-canton-dark border border-canton-border rounded-xl px-3 py-2 text-xs text-canton-cream font-mono"
            />
          </div>
        </div>
      </div>

      {/* MODAL LOGÍSTICO & FRETE */}
      <div className="bg-canton-surface border border-canton-border rounded-2xl p-4 space-y-4">
        <h3 className="font-semibold text-canton-cream text-sm flex items-center gap-2">
          <Ship className="w-4 h-4 text-canton-gold" /> Modalidade de Envio & Frete Internacional
        </h3>

        {/* Seleção do Modal */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {[
            { id: 'FCL_20', label: "Container 20'", sub: 'Até 28 m³' },
            { id: 'FCL_40HQ', label: "Container 40'HQ", sub: 'Até 68 m³' },
            { id: 'LCL', label: 'LCL Marítimo', sub: 'Por m³ (CBM)' },
            { id: 'AIR', label: 'Aéreo Cargo', sub: 'Por kg cubado' }
          ].map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => handleModalChange(m.id as FreightModal)}
              className={`p-2.5 rounded-xl border text-left transition-all ${
                modal === m.id
                  ? 'bg-canton-gold text-black border-canton-gold font-bold shadow'
                  : 'bg-canton-dark text-canton-body border-canton-border hover:border-canton-gold'
              }`}
            >
              <div className="text-xs font-semibold">{m.label}</div>
              <div className={`text-[10px] ${modal === m.id ? 'text-black/80' : 'text-canton-dim'}`}>
                {m.sub}
              </div>
            </button>
          ))}
        </div>

        {/* Custo do Frete */}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-[11px] font-semibold text-canton-dim block mb-1">
              {modal === 'LCL' ? 'Frete USD por CBM' : modal === 'AIR' ? 'Frete USD por kg' : 'Frete USD Total'}
            </label>
            <input
              type="number"
              value={freightCostUsd}
              onChange={(e) => setFreightCostUsd(e.target.value)}
              className="w-full bg-canton-dark border border-canton-border rounded-xl px-3 py-2 text-xs text-canton-cream font-mono"
            />
          </div>

          <div>
            <label className="text-[11px] font-semibold text-canton-dim block mb-1">Estado de Desembaraço (ICMS)</label>
            <select
              value={icmsChoice}
              onChange={(e) => setIcmsChoice(e.target.value as any)}
              className="w-full bg-canton-dark border border-canton-border rounded-xl px-2 py-2 text-xs text-canton-cream"
            >
              <option value="SC_TTD">Santa Catarina TTD (4%)</option>
              <option value="PR_IMPORT">Paraná Importação (4%)</option>
              <option value="SC_NORMAL">Santa Catarina Normal (17%)</option>
              <option value="SP_NORMAL">São Paulo Normal (18%)</option>
            </select>
          </div>
        </div>
      </div>

      {/* ALÍQUOTAS DE IMPOSTOS */}
      <div className="bg-canton-surface border border-canton-border rounded-2xl p-4 space-y-3">
        <h3 className="font-semibold text-canton-cream text-sm flex items-center gap-2">
          <Percent className="w-4 h-4 text-canton-gold" /> Alíquotas Federais (II & IPI)
        </h3>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-[11px] font-semibold text-canton-dim block mb-1">II - Imposto de Importação (%)</label>
            <input
              type="number"
              step="0.1"
              value={iiRate}
              onChange={(e) => setIiRate(e.target.value)}
              className="w-full bg-canton-dark border border-canton-border rounded-xl px-3 py-2 text-xs text-canton-cream font-mono"
            />
          </div>

          <div>
            <label className="text-[11px] font-semibold text-canton-dim block mb-1">IPI (%)</label>
            <input
              type="number"
              step="0.1"
              value={ipiRate}
              onChange={(e) => setIpiRate(e.target.value)}
              className="w-full bg-canton-dark border border-canton-border rounded-xl px-3 py-2 text-xs text-canton-cream font-mono"
            />
          </div>
        </div>
      </div>

      {/* Modal de Auditoria Detalhada */}
      <LandedCostDetailModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        productName="Simulação Dinâmica"
        breakdown={breakdown}
      />
    </div>
  );
};
