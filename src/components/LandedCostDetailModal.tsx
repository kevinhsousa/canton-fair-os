import React from 'react';
import { X, ShieldCheck, AlertTriangle, ArrowRight, DollarSign, Box, Ship } from 'lucide-react';
import { LandedCostBreakdown } from '../types';

interface LandedCostDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  productName: string;
  breakdown: LandedCostBreakdown;
  supplierName?: string;
  standNumber?: string;
}

export const LandedCostDetailModal: React.FC<LandedCostDetailModalProps> = ({
  isOpen,
  onClose,
  productName,
  breakdown,
  supplierName,
  standNumber
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-sm overflow-y-auto">
      <div className="bg-canton-surface border border-canton-border rounded-2xl max-w-lg w-full p-5 space-y-4 shadow-2xl my-auto max-h-[92vh] overflow-y-auto">
        {/* Topo do Modal */}
        <div className="flex justify-between items-start border-b border-canton-borderSoft pb-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono uppercase bg-canton-gold/20 text-canton-goldBright px-2 py-0.5 rounded border border-canton-gold/30">
                Auditoria Aduaneira
              </span>
              {standNumber && (
                <span className="text-xs font-mono text-canton-dim">Stand: {standNumber}</span>
              )}
            </div>
            <h3 className="font-display font-bold text-canton-cream text-lg mt-1">
              {productName}
            </h3>
            {supplierName && (
              <p className="text-xs text-canton-dim font-medium">{supplierName}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-canton-dim hover:text-canton-cream hover:bg-canton-dark"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Card Destaque: Custo Unitário Landed no Brasil */}
        <div className="grid grid-cols-2 gap-3 bg-canton-dark/80 border border-canton-border rounded-xl p-3.5">
          <div className="space-y-1">
            <span className="text-[10px] font-mono text-canton-gold uppercase tracking-wider block">
              Simples Nacional / MEI
            </span>
            <div className="text-xl sm:text-2xl font-mono font-bold text-canton-cream">
              R$ {breakdown.unitCostSimplesBrl.toFixed(2)}
            </div>
            <p className="text-[10px] text-canton-dim">
              P. Venda Sugerido: <strong className="text-canton-goldBright font-mono">R$ {breakdown.suggestedSalePriceSimplesBrl.toFixed(2)}</strong>
            </p>
          </div>

          <div className="space-y-1 border-l border-canton-borderSoft pl-3">
            <span className="text-[10px] font-mono text-emerald-400 uppercase tracking-wider block">
              Lucro Real (Líquido)
            </span>
            <div className="text-xl sm:text-2xl font-mono font-bold text-emerald-400">
              R$ {breakdown.unitCostLucroRealBrl.toFixed(2)}
            </div>
            <p className="text-[10px] text-canton-dim">
              Crédito PIS/COFINS/ICMS: <strong className="text-emerald-400 font-mono">R$ {(breakdown.taxCreditsBrl / breakdown.quantity).toFixed(2)}/un</strong>
            </p>
          </div>
        </div>

        {/* Detalhamento Cadeia Aduaneira */}
        <div className="space-y-2 text-xs">
          <h4 className="font-semibold text-canton-cream uppercase tracking-wider text-[11px] flex items-center gap-1.5">
            <Ship className="w-3.5 h-3.5 text-canton-gold" /> Composição do Valor Aduaneiro (CIF)
          </h4>

          <div className="bg-canton-navy/70 border border-canton-borderSoft rounded-xl p-3 space-y-1.5 font-mono">
            <div className="flex justify-between">
              <span className="text-canton-dim">FOB Total ({breakdown.quantity} peças):</span>
              <span className="text-canton-cream">USD {breakdown.fobTotalUsd.toFixed(2)} (R$ {breakdown.fobTotalBrl.toFixed(2)})</span>
            </div>
            <div className="flex justify-between">
              <span className="text-canton-dim">Frete Internacional:</span>
              <span className="text-canton-cream">USD {breakdown.freightTotalUsd.toFixed(2)} (R$ {breakdown.freightTotalBrl.toFixed(2)})</span>
            </div>
            <div className="flex justify-between">
              <span className="text-canton-dim">Seguro Internacional:</span>
              <span className="text-canton-cream">R$ {breakdown.insuranceBrl.toFixed(2)}</span>
            </div>
            <div className="flex justify-between pt-1 border-t border-canton-borderSoft font-bold">
              <span className="text-canton-gold">Valor Aduaneiro CIF:</span>
              <span className="text-canton-goldBright">R$ {breakdown.cifBrl.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Tributos Federais e Estaduais */}
        <div className="space-y-2 text-xs">
          <h4 className="font-semibold text-canton-cream uppercase tracking-wider text-[11px] flex items-center gap-1.5">
            <DollarSign className="w-3.5 h-3.5 text-canton-gold" /> Tributos & Taxas Oficiais
          </h4>

          <div className="bg-canton-navy/70 border border-canton-borderSoft rounded-xl p-3 space-y-1.5 font-mono">
            <div className="flex justify-between">
              <span className="text-canton-dim">II ({breakdown.iiRate}%):</span>
              <span className="text-canton-cream">R$ {breakdown.iiBrl.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-canton-dim">IPI ({breakdown.ipiRate}%):</span>
              <span className="text-canton-cream">R$ {breakdown.ipiBrl.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-canton-dim">PIS Importação ({breakdown.pisRate}%):</span>
              <span className="text-canton-cream">R$ {breakdown.pisBrl.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-canton-dim">COFINS Importação ({breakdown.cofinsRate}%):</span>
              <span className="text-canton-cream">R$ {breakdown.cofinsBrl.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-canton-dim">Taxa Siscomex:</span>
              <span className="text-canton-cream">R$ {breakdown.siscomexBrl.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-canton-dim">AFRMM Marinha Mercante (8% frete):</span>
              <span className="text-canton-cream">R$ {breakdown.afrmmBrl.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-canton-dim">Despesas Portuárias & Despachante:</span>
              <span className="text-canton-cream">R$ {(breakdown.portExpensesBrl + breakdown.brokerFeeBrl).toFixed(2)}</span>
            </div>
            <div className="flex justify-between pt-1 border-t border-canton-borderSoft">
              <span className="text-canton-dim">ICMS ({breakdown.icmsRate}% por dentro):</span>
              <span className="text-amber-400 font-bold">R$ {breakdown.icmsBrl.toFixed(2)}</span>
            </div>
            <div className="flex justify-between pt-1 border-t border-canton-border text-[13px] font-bold">
              <span className="text-canton-cream">Custo Total Desembolsado:</span>
              <span className="text-canton-goldBright">R$ {breakdown.totalCostSimplesBrl.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Cubagem & Containers */}
        <div className="bg-canton-dark/60 border border-canton-borderSoft rounded-xl p-3 text-xs space-y-1 font-mono">
          <div className="flex justify-between">
            <span className="text-canton-dim">CBM Total da Carga:</span>
            <span className="text-canton-cream font-bold">{breakdown.totalCbm.toFixed(2)} m³</span>
          </div>
          <div className="flex justify-between">
            <span className="text-canton-dim">Peso Bruto Total:</span>
            <span className="text-canton-cream">{breakdown.totalGrossWeightKg.toFixed(1)} kg</span>
          </div>
          {breakdown.containerCapacityUtilizationPercent !== undefined && breakdown.containerCapacityUtilizationPercent > 0 && (
            <div className="flex justify-between">
              <span className="text-canton-dim">Ocupação do Container:</span>
              <span className="text-emerald-400 font-bold">{breakdown.containerCapacityUtilizationPercent}%</span>
            </div>
          )}
        </div>

        <button
          onClick={onClose}
          className="w-full py-2.5 rounded-xl bg-canton-gold text-black font-display font-bold text-xs hover:bg-canton-goldBright transition-colors"
        >
          Fechar Auditoria
        </button>
      </div>
    </div>
  );
};
