import { LandedCostBreakdown, SimulationParams } from '../types';
import { calculateCbmAndContainers } from './cbmEngine';

export interface ProductCalcInput {
  fobPrice: number;
  currency: 'USD' | 'RMB';
  quantity: number;
  unitsPerCarton: number;
  cartonLengthCm: number;
  cartonWidthCm: number;
  cartonHeightCm: number;
  grossWeightKg: number;
  iiRate: number; // Ex: 14.4%
  ipiRate: number; // Ex: 9.75%
  pisRate?: number; // Padrão: 2.1%
  cofinsRate?: number; // Padrão: 9.65%
}

export const DEFAULT_SIMULATION_PARAMS: SimulationParams = {
  usdRate: 5.45,
  rmbRate: 7.20,
  modal: 'FCL_40HQ',
  freightCostUsd: 4500, // Frete marítimo 40HQ médio Santos/Itajaí
  insurancePercent: 0.35, // 0.35% de seguro internacional
  icmsState: 'SC_TTD',
  icmsRate: 4.0, // TTD Santa Catarina benefício de importação 4% ou 10%
  portExpensesBrl: 3500, // Capatazia + Armazenagem portuária
  brokerFeeBrl: 1800, // Honorários de despachante aduaneiro
  siscomexBrl: 115.67, // Taxa de utilização do Siscomex
  afrmmPercent: 8.0, // AFRMM (8% sobre frete marítimo internacional)
  targetMarginPercent: 50.0 // Margem bruta desejada na venda
};

export function calculateLandedCost(
  product: ProductCalcInput,
  params: SimulationParams = DEFAULT_SIMULATION_PARAMS
): LandedCostBreakdown {
  const qty = Math.max(1, product.quantity || 1);
  
  // 1. Converter FOB unitário e total para USD e BRL
  let fobUnitUsd = product.fobPrice;
  if (product.currency === 'RMB') {
    const rmbDiv = params.rmbRate > 0 ? params.rmbRate : 7.20;
    fobUnitUsd = product.fobPrice / rmbDiv;
  }
  const fobTotalUsd = fobUnitUsd * qty;
  const fobTotalBrl = fobTotalUsd * params.usdRate;

  // 2. Análise de CBM e rateio de Frete Internacional
  const cbmData = calculateCbmAndContainers(
    product.cartonLengthCm,
    product.cartonWidthCm,
    product.cartonHeightCm,
    product.unitsPerCarton,
    product.grossWeightKg,
    qty
  );

  let freightTotalUsd = 0;
  let isMaritime = true;

  switch (params.modal) {
    case 'FCL_20':
      freightTotalUsd = params.freightCostUsd || 3200;
      isMaritime = true;
      break;
    case 'FCL_40HQ':
      freightTotalUsd = params.freightCostUsd || 4500;
      isMaritime = true;
      break;
    case 'LCL':
      // Custo por CBM (mínimo 1 CBM)
      const billedCbm = Math.max(1, cbmData.totalCbm);
      const lclRatePerCbm = params.freightCostUsd > 0 ? params.freightCostUsd : 65; // USD 65/CBM
      freightTotalUsd = billedCbm * lclRatePerCbm;
      isMaritime = true;
      break;
    case 'AIR':
      // Custo por kg cobrado
      const airRatePerKg = params.freightCostUsd > 0 ? params.freightCostUsd : 8.5; // USD 8.5/kg
      freightTotalUsd = cbmData.airChargedWeightKg * airRatePerKg;
      isMaritime = false;
      break;
  }

  const freightTotalBrl = freightTotalUsd * params.usdRate;

  // 3. Seguro Internacional e Valor Aduaneiro (CIF)
  const insuranceBrl = fobTotalBrl * ((params.insurancePercent || 0.35) / 100);
  const cifBrl = fobTotalBrl + freightTotalBrl + insuranceBrl;

  // 4. Impostos Federais
  const iiRate = (product.iiRate || 0) / 100;
  const iiBrl = cifBrl * iiRate;

  const ipiRate = (product.ipiRate || 0) / 100;
  const ipiBrl = (cifBrl + iiBrl) * ipiRate;

  const pisRate = ((product.pisRate !== undefined ? product.pisRate : 2.1) || 2.1) / 100;
  const pisBrl = cifBrl * pisRate;

  const cofinsRate = ((product.cofinsRate !== undefined ? product.cofinsRate : 9.65) || 9.65) / 100;
  const cofinsBrl = cifBrl * cofinsRate;

  const siscomexBrl = params.siscomexBrl || 115.67;

  // 5. AFRMM (Adicional ao Frete para Renovação da Marinha Mercante: 8% sobre frete marítimo)
  const afrmmBrl = isMaritime ? freightTotalBrl * ((params.afrmmPercent || 8.0) / 100) : 0;

  // 6. Despesas Operacionais e Portuárias Locais
  const portExpensesBrl = params.portExpensesBrl || 0;
  const brokerFeeBrl = params.brokerFeeBrl || 0;
  const totalLocalExpensesBrl = portExpensesBrl + brokerFeeBrl;

  // 7. ICMS Importação (Cálculo Oficial "Por Dentro")
  // Base = (CIF + II + IPI + PIS + COFINS + Siscomex + Despesas + AFRMM) / (1 - Alíquota ICMS)
  const icmsAliq = (params.icmsRate || 4.0) / 100;
  const icmsDivisor = Math.max(0.01, 1 - icmsAliq);
  const numeradorICMS = cifBrl + iiBrl + ipiBrl + pisBrl + cofinsBrl + siscomexBrl + totalLocalExpensesBrl + afrmmBrl;
  const icmsBaseBrl = numeradorICMS / icmsDivisor;
  const icmsBrl = icmsBaseBrl * icmsAliq;

  // 8. Custo Total no Simples Nacional / MEI (Tudo vira custo direto da mercadoria)
  const totalCostSimplesBrl = cifBrl + iiBrl + ipiBrl + pisBrl + cofinsBrl + siscomexBrl + afrmmBrl + totalLocalExpensesBrl + icmsBrl;
  const unitCostSimplesBrl = totalCostSimplesBrl / qty;

  // 9. Custo no Lucro Real (Com recuperação de créditos)
  // Crédito PIS (1.65%) + COFINS (7.6%) + ICMS integral
  const pisCreditBrl = cifBrl * 0.0165;
  const cofinsCreditBrl = cifBrl * 0.0760;
  const icmsCreditBrl = icmsBrl;
  const taxCreditsBrl = pisCreditBrl + cofinsCreditBrl + icmsCreditBrl;

  const totalCostLucroRealBrl = totalCostSimplesBrl - taxCreditsBrl;
  const unitCostLucroRealBrl = totalCostLucroRealBrl / qty;

  // 10. Formação de Preço de Venda
  // Preço com margem sobre venda: Preço = Custo / (1 - Margem%)
  const marginFrac = Math.min(0.95, Math.max(0.05, (params.targetMarginPercent || 50) / 100));
  const suggestedSalePriceSimplesBrl = unitCostSimplesBrl / (1 - marginFrac);
  const suggestedSalePriceLucroRealBrl = unitCostLucroRealBrl / (1 - marginFrac);
  const projectedProfitBrl = (suggestedSalePriceSimplesBrl * qty) - totalCostSimplesBrl;

  // Capacidade do container
  let capacityPercent = 0;
  if (params.modal === 'FCL_20') {
    capacityPercent = Math.min(100, (cbmData.totalCbm / 28.0) * 100);
  } else if (params.modal === 'FCL_40HQ') {
    capacityPercent = Math.min(100, (cbmData.totalCbm / 68.0) * 100);
  }

  return {
    quantity: qty,
    fobTotalUsd: Number(fobTotalUsd.toFixed(2)),
    fobTotalBrl: Number(fobTotalBrl.toFixed(2)),
    freightTotalUsd: Number(freightTotalUsd.toFixed(2)),
    freightTotalBrl: Number(freightTotalBrl.toFixed(2)),
    insuranceBrl: Number(insuranceBrl.toFixed(2)),
    cifBrl: Number(cifBrl.toFixed(2)),
    iiRate: product.iiRate || 0,
    iiBrl: Number(iiBrl.toFixed(2)),
    ipiRate: product.ipiRate || 0,
    ipiBrl: Number(ipiBrl.toFixed(2)),
    pisRate: (product.pisRate !== undefined ? product.pisRate : 2.1) || 2.1,
    pisBrl: Number(pisBrl.toFixed(2)),
    cofinsRate: (product.cofinsRate !== undefined ? product.cofinsRate : 9.65) || 9.65,
    cofinsBrl: Number(cofinsBrl.toFixed(2)),
    siscomexBrl: Number(siscomexBrl.toFixed(2)),
    afrmmBrl: Number(afrmmBrl.toFixed(2)),
    portExpensesBrl: Number(portExpensesBrl.toFixed(2)),
    brokerFeeBrl: Number(brokerFeeBrl.toFixed(2)),
    icmsBaseBrl: Number(icmsBaseBrl.toFixed(2)),
    icmsRate: params.icmsRate,
    icmsBrl: Number(icmsBrl.toFixed(2)),
    totalCostSimplesBrl: Number(totalCostSimplesBrl.toFixed(2)),
    unitCostSimplesBrl: Number(unitCostSimplesBrl.toFixed(2)),
    taxCreditsBrl: Number(taxCreditsBrl.toFixed(2)),
    totalCostLucroRealBrl: Number(totalCostLucroRealBrl.toFixed(2)),
    unitCostLucroRealBrl: Number(unitCostLucroRealBrl.toFixed(2)),
    suggestedSalePriceSimplesBrl: Number(suggestedSalePriceSimplesBrl.toFixed(2)),
    suggestedSalePriceLucroRealBrl: Number(suggestedSalePriceLucroRealBrl.toFixed(2)),
    projectedProfitBrl: Number(projectedProfitBrl.toFixed(2)),
    cbmPerCarton: cbmData.cbmPerCarton,
    totalCbm: cbmData.totalCbm,
    totalGrossWeightKg: cbmData.totalGrossWeightKg,
    containerCapacityUtilizationPercent: Number(capacityPercent.toFixed(1))
  };
}
