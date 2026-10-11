import React, { useState, useEffect } from 'react';
import { db } from '../services/db';
import { Product, Supplier } from '../types';
import { runJevAnalysis } from '../services/jevEngine';
import { calculateLandedCost, DEFAULT_SIMULATION_PARAMS } from '../services/landedCostEngine';
import { 
  Zap, Trophy, AlertTriangle, CheckCircle, ShieldAlert, 
  TrendingUp, Sparkles, Building2, Package, ArrowRight 
} from 'lucide-react';

interface JevRankingPageProps {
  usdRate: number;
  rmbRate: number;
  onGoToProduct: () => void;
}

export const JevRankingPage: React.FC<JevRankingPageProps> = ({ usdRate, rmbRate, onGoToProduct }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);

  useEffect(() => {
    const load = async () => {
      const prods = await db.products.toArray();
      const sups = await db.suppliers.toArray();
      setProducts(prods);
      setSuppliers(sups);
    };
    load();
  }, []);

  // Calcular score de todos os produtos
  const scoredProducts = products.map((product) => {
    const supplier = suppliers.find(s => s.id === product.supplierId);
    
    const simulationParams = {
      ...DEFAULT_SIMULATION_PARAMS,
      usdRate,
      rmbRate
    };

    const landed = calculateLandedCost({
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

    const jev = runJevAnalysis(
      product,
      landed.unitCostSimplesBrl,
      landed.suggestedSalePriceSimplesBrl,
      landed.totalCbm
    );

    return {
      product,
      supplier,
      landed,
      jev,
      compositeScore: Math.round((jev.innovationScore * 0.4) + (jev.dtcFitScore * 0.6))
    };
  });

  // Ordenar pelo Score Composto JEV Decrescente
  scoredProducts.sort((a, b) => b.compositeScore - a.compositeScore);

  const top3 = scoredProducts.slice(0, 3);
  const remaining = scoredProducts.slice(3);

  return (
    <div className="max-w-2xl mx-auto p-4 pb-28 space-y-4">
      {/* Topo do Dashboard */}
      <div className="flex items-center justify-between">
        <div>
          <span className="text-[10px] font-mono uppercase bg-canton-gold/20 text-canton-goldBright px-2 py-0.5 rounded border border-canton-gold/30 flex items-center gap-1 w-fit">
            <Zap className="w-3 h-3 text-canton-gold" /> JEV Decision Engine
          </span>
          <h2 className="font-display font-extrabold text-canton-cream text-xl mt-1">
            Ranking de Oportunidades
          </h2>
        </div>
      </div>

      {/* Introdução do Motor JEV */}
      <div className="bg-gradient-to-r from-[#101D3E] to-[#0E1A38] border border-canton-border rounded-2xl p-4 text-xs space-y-1.5 shadow-lg">
        <p className="text-canton-cream font-medium">
          O <strong>JEV Engine (TypeSafe AI)</strong> cruza a relação de <strong>Markup Landed BR</strong>, 
          cubagem para frete nacional de e-commerce, barreiras regulatórias (INMETRO/ANATEL) e singularidade do produto.
        </p>
        <p className="text-[11px] text-canton-dim font-mono">
          Ranqueando as maiores margens de contribuição e produtos com maior probabilidade de tração DTC.
        </p>
      </div>

      {/* Se não houver produtos cadastrados */}
      {scoredProducts.length === 0 ? (
        <div className="bg-canton-surface border border-canton-border rounded-2xl p-8 text-center space-y-3">
          <Trophy className="w-10 h-10 text-canton-dim mx-auto stroke-1" />
          <p className="text-sm text-canton-dim">Cadastre seus primeiros produtos na feira para rodar o ranking de inteligência.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* TOP 3 PODIUM */}
          <div className="space-y-3">
            <h3 className="text-xs font-mono uppercase tracking-wider text-canton-gold flex items-center gap-1.5">
              <Trophy className="w-4 h-4 text-canton-gold" /> Top 3 Oportunidades da Canton Fair
            </h3>

            <div className="space-y-3">
              {top3.map((item, index) => (
                <div
                  key={item.product.id}
                  className="bg-canton-surface border-2 border-canton-gold/60 rounded-2xl p-4 space-y-3 shadow-xl relative overflow-hidden"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-canton-gold text-black font-mono font-extrabold flex items-center justify-center text-sm shrink-0 shadow-md">
                        #{index + 1}
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 px-2 py-0.5 rounded font-mono font-bold">
                            Score: {item.compositeScore}/100
                          </span>
                          {item.supplier && (
                            <span className="text-xs font-mono text-canton-dim">
                              Stand {item.supplier.standNumber}
                            </span>
                          )}
                        </div>

                        <h4 className="font-display font-bold text-canton-cream text-base mt-0.5">
                          {item.product.name}
                        </h4>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] font-mono text-canton-dim block">Landed BR</span>
                      <span className="text-sm font-mono font-bold text-canton-goldBright">
                        R$ {item.landed.unitCostSimplesBrl.toFixed(2)}
                      </span>
                    </div>
                  </div>

                  {/* Detalhes de Scores */}
                  <div className="grid grid-cols-3 gap-2 bg-canton-dark/70 border border-canton-borderSoft rounded-xl p-2.5 text-center text-xs font-mono">
                    <div>
                      <span className="text-[9px] text-canton-dim block">Inovação</span>
                      <span className="text-canton-cream font-bold">{item.jev.innovationScore}/100</span>
                    </div>
                    <div>
                      <span className="text-[9px] text-canton-dim block">DTC Fit</span>
                      <span className="text-emerald-400 font-bold">{item.jev.dtcFitScore}/100</span>
                    </div>
                    <div>
                      <span className="text-[9px] text-canton-dim block">Veredito</span>
                      <span className={`font-bold ${item.jev.verdict === 'GO' ? 'text-emerald-400' : 'text-amber-400'}`}>
                        {item.jev.verdict}
                      </span>
                    </div>
                  </div>

                  {/* Insights de Campo */}
                  {item.jev.insights.length > 0 && (
                    <div className="bg-canton-navy/60 rounded-xl p-2.5 space-y-1 text-xs">
                      {item.jev.insights.map((insight, idx) => (
                        <p key={idx} className="text-canton-body text-[11px] leading-snug">
                          {insight}
                        </p>
                      ))}
                    </div>
                  )}

                  {/* Alerta Regulatório se houver */}
                  {item.jev.regulatoryAlert !== 'NENHUMA' && (
                    <div className="flex items-center gap-1.5 text-amber-300 text-xs font-mono bg-amber-950/30 border border-amber-500/30 px-2.5 py-1.5 rounded-lg">
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                      <span>Exige {item.jev.regulatoryAlert} no Brasil</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* DEMAIS ITENS DO RANKING */}
          {remaining.length > 0 && (
            <div className="space-y-2 pt-2">
              <h3 className="text-xs font-mono uppercase tracking-wider text-canton-dim">
                Outros Produtos Avaliados
              </h3>

              <div className="space-y-2">
                {remaining.map((item, index) => (
                  <div
                    key={item.product.id}
                    className="bg-canton-surface border border-canton-border rounded-xl p-3 flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="font-mono text-canton-dim text-xs">#{index + 4}</span>
                      <div>
                        <div className="font-bold text-canton-cream">{item.product.name}</div>
                        <div className="text-[10px] text-canton-dim font-mono">
                          Stand {item.supplier?.standNumber || 'S/N'} • Score {item.compositeScore}
                        </div>
                      </div>
                    </div>

                    <div className="text-right font-mono">
                      <div className="text-canton-gold font-bold">
                        R$ {item.landed.unitCostSimplesBrl.toFixed(2)}
                      </div>
                      <div className="text-[10px] text-canton-dim">
                        FOB {item.product.currency} {item.product.fobPrice.toFixed(2)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
