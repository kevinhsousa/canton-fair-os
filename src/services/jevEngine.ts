import { Product } from '../types';

export interface JevDecisionOutput {
  innovationScore: number; // 0 a 100
  dtcFitScore: number; // 0 a 100
  verdict: 'GO' | 'CAUTION' | 'KILL';
  regulatoryAlert: 'ANATEL' | 'INMETRO' | 'ANVISA' | 'NENHUMA';
  regulatoryDetails: string;
  insights: string[];
  smartIfs: {
    compensaContainerFechado: boolean;
    riscoCubagemFreteNacional: boolean;
    margemExcelenteDtc: boolean;
    negociarMoqMaior: boolean;
  };
}

export function runJevAnalysis(
  product: Partial<Product>,
  unitCostLandedBrl: number,
  suggestedSalePriceBrl: number,
  totalCbm: number
): JevDecisionOutput {
  const name = (product.name || '').toLowerCase();
  const desc = (product.description || '').toLowerCase();
  const category = (product.category || '').toLowerCase();
  const hs = (product.hsCode || '').replace(/\D/g, '');

  const textToScan = `${name} ${desc} ${category}`;

  // 1. Detecção Regulatória Forense (Sistema 1)
  let regulatoryAlert: 'ANATEL' | 'INMETRO' | 'ANVISA' | 'NENHUMA' = 'NENHUMA';
  let regulatoryDetails = 'Sem órgão anuente direto obrigatório na alfândega.';

  const isWireless = textToScan.includes('bluetooth') || textToScan.includes('wireless') || 
                      textToScan.includes('wifi') || textToScan.includes('fone') || 
                      textToScan.includes('tws') || textToScan.includes('carregador') || 
                      textToScan.includes('power bank') || hs.startsWith('8517') || hs.startsWith('8518') || hs.startsWith('8504');

  const isInmetro = textToScan.includes('brinquedo') || textToScan.includes('toy') || 
                     textToScan.includes('led') || textToScan.includes('lâmpada') || 
                     textToScan.includes('luminária') || textToScan.includes('térmica') || 
                     textToScan.includes('eletro') || textToScan.includes('furadeira') || 
                     textToScan.includes('ferramenta') || textToScan.includes('bicicleta') || 
                     hs.startsWith('9503') || hs.startsWith('9405') || hs.startsWith('9617') || hs.startsWith('8467');

  const isAnvisa = textToScan.includes('cosmético') || textToScan.includes('pele') || 
                    textToScan.includes('massagem') || textToScan.includes('saúde') || 
                    textToScan.includes('alimento') || textToScan.includes('suplemento');

  if (isWireless) {
    regulatoryAlert = 'ANATEL';
    regulatoryDetails = 'Exige homologação ANATEL compulsória (módulo transmissor de RF / bateria de lítio). Orçamento de certificação: R$ 8.000 a 18.000.';
  } else if (isInmetro) {
    regulatoryAlert = 'INMETRO';
    regulatoryDetails = 'Exige certificação INMETRO de segurança/eficiência (ensaios em laboratório acreditado no Brasil e auditoria de fábrica na China).';
  } else if (isAnvisa) {
    regulatoryAlert = 'ANVISA';
    regulatoryDetails = 'Exige registro ou notificação na ANVISA e empresa importadora com AFE (Autorização de Funcionamento).';
  }

  // 2. Score de Inovação & Diferenciação (0 - 100)
  let innovationScore = 50; // Base neutra
  if (textToScan.includes('patente') || textToScan.includes('patented') || textToScan.includes('exclusivo')) innovationScore += 25;
  if (textToScan.includes('smart') || textToScan.includes('ia') || textToScan.includes('ai') || textToScan.includes('sensor')) innovationScore += 15;
  if (textToScan.includes('design') || textToScan.includes('novo') || textToScan.includes('inovador')) innovationScore += 10;
  if (textToScan.includes('comum') || textToScan.includes('básico') || textToScan.includes('genérico')) innovationScore -= 20;
  if (product.innovationScore && product.innovationScore > 0) {
    innovationScore = product.innovationScore;
  }
  innovationScore = Math.max(10, Math.min(98, innovationScore));

  // 3. Score de Fit E-commerce DTC (0 - 100)
  // Taylor Holiday & Allan framework: relação entre markup (P.Venda / Custo Landed), peso e volume
  let dtcFitScore = 60;
  const markup = unitCostLandedBrl > 0 ? suggestedSalePriceBrl / unitCostLandedBrl : 1;
  
  if (markup >= 3.0) dtcFitScore += 20;
  else if (markup >= 2.0) dtcFitScore += 10;
  else dtcFitScore -= 20;

  // Penalidade de cubagem pesada no frete Correios/Melhor Envio
  const cbmUnit = ((product.cartonLengthCm || 1) * (product.cartonWidthCm || 1) * (product.cartonHeightCm || 1)) / 1000000 / (product.unitsPerCarton || 1);
  if (cbmUnit > 0.04) {
    dtcFitScore -= 25; // Produto volumoso (sofre no frete do e-commerce nacional)
  } else if (cbmUnit < 0.005) {
    dtcFitScore += 15; // Produto pocket (baixo custo de frete)
  }

  if (regulatoryAlert !== 'NENHUMA') {
    dtcFitScore -= 15; // Barreira de entrada e custo fixo de laudos
  }
  dtcFitScore = Math.max(10, Math.min(99, dtcFitScore));

  // 4. Veredito Geral
  let verdict: 'GO' | 'CAUTION' | 'KILL' = 'GO';
  if (dtcFitScore < 45 || (regulatoryAlert === 'INMETRO' && (product.moq || 0) < 1000)) {
    verdict = 'CAUTION';
  }
  if (markup < 1.6 || (regulatoryAlert === 'INMETRO' && hs.startsWith('9503'))) {
    // Brinquedos com alíquota de 35% e custo pesadíssimo de laudo
    verdict = 'CAUTION';
  }

  // 5. Insights Acionáveis para Negociação no Stand
  const insights: string[] = [];
  if (markup >= 3.0) {
    insights.push(`🔥 Excelente Landed Markup (${markup.toFixed(1)}x): Dá fôlego para gastar com tráfego pago (CPA de até R$ ${(suggestedSalePriceBrl * 0.35).toFixed(0)}).`);
  } else {
    insights.push(`⚠️ Landed Markup justo (${markup.toFixed(1)}x): Requer negociação agressiva de FOB no stand ou venda B2B por atacado.`);
  }

  if (totalCbm >= 20 && totalCbm <= 30) {
    insights.push(`🚢 Volume ideal para fechar 1 Container de 20' GP (~${totalCbm.toFixed(1)} m³). Dilui o frete marítimo.`);
  } else if (totalCbm < 10) {
    insights.push(`📦 Volume baixo (${totalCbm.toFixed(1)} m³): Simular em LCL (carga consolidada) para não pagar espaço vazio de container.`);
  }

  if ((product.moq || 0) > 2000) {
    insights.push(`🤝 MOQ alto (${product.moq} pcs): Peça desconto escalonado (ex: "se eu levar 40HQ, qual o menor preço?").`);
  }

  return {
    innovationScore,
    dtcFitScore,
    verdict,
    regulatoryAlert,
    regulatoryDetails,
    insights,
    smartIfs: {
      compensaContainerFechado: totalCbm >= 20,
      riscoCubagemFreteNacional: cbmUnit > 0.03,
      margemExcelenteDtc: markup >= 2.8,
      negociarMoqMaior: (product.moq || 0) >= 1000 && markup < 2.5
    }
  };
}
