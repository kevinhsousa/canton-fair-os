export type CantonPhase = 'Fase 1' | 'Fase 2' | 'Fase 3';

export interface Supplier {
  id?: number;
  syncId: string;
  phase: CantonPhase;
  complexArea?: string; // Área A, B, C, D
  hall: string; // Ex: 9.2, 14.1
  standNumber: string; // Ex: D14, G22
  companyName: string;
  companyChinese?: string;
  contactPerson: string;
  wechatId: string;
  whatsapp?: string;
  email?: string;
  phone?: string;
  website?: string;
  businessCardPhoto?: string; // Base64
  standPhoto?: string; // Base64
  tags: string[]; // ['Fábrica Direta', 'OEM/ODM', 'Trading', 'Top Qualidade', 'Preço Agressivo']
  notes?: string;
  rating: number; // 1 a 5 estrelas
  createdAt: number;
  updatedAt: number;
}

export interface Product {
  id?: number;
  syncId: string;
  supplierId: number; // Chave estrangeira para Supplier
  supplierName?: string;
  standNumber?: string;
  name: string;
  category: string;
  description?: string;
  photos: string[]; // Base64 strings
  fobPrice: number;
  currency: 'USD' | 'RMB';
  moq: number; // Quantidade mínima
  leadTimeDays?: number;
  
  // Classificação Fiscal
  hsCode?: string; // 6 dígitos
  ncm?: string; // 8 dígitos oficiais
  
  // Embalagem e Logística
  unitsPerCarton: number; // Peças por caixa master
  cartonLengthCm: number;
  cartonWidthCm: number;
  cartonHeightCm: number;
  grossWeightKg: number;
  netWeightKg?: number;
  
  // Inteligência & JEV
  innovationScore?: number; // 0 a 100
  dtcFitScore?: number; // 0 a 100
  regulatoryAlert?: string; // 'ANATEL' | 'INMETRO' | 'ANVISA' | 'NENHUMA'
  jevNotes?: string;
  
  createdAt: number;
  updatedAt: number;
}

export type FreightModal = 'FCL_20' | 'FCL_40HQ' | 'LCL' | 'AIR';
export type TaxRegime = 'SIMPLES' | 'LUCRO_REAL';

export interface SimulationParams {
  usdRate: number; // Câmbio USD -> BRL (ex: 5.45)
  rmbRate: number; // Câmbio RMB -> USD (ex: 7.20)
  modal: FreightModal;
  freightCostUsd: number; // Frete internacional total ou por CBM/kg
  insurancePercent: number; // Ex: 0.3%
  icmsState: 'SC_TTD' | 'SC_NORMAL' | 'PR_IMPORT' | 'SP_NORMAL';
  icmsRate: number; // Ex: 4.0, 10.0, 17.0, 18.0
  portExpensesBrl: number; // Capatazia, armazenagem, liberação BL
  brokerFeeBrl: number; // Despachante aduaneiro
  siscomexBrl: number; // Taxa Siscomex
  afrmmPercent: number; // 8% sobre frete marítimo
  targetMarginPercent: number; // Margem desejada na venda (ex: 50%)
}

export interface LandedCostBreakdown {
  quantity: number;
  fobTotalUsd: number;
  fobTotalBrl: number;
  freightTotalUsd: number;
  freightTotalBrl: number;
  insuranceBrl: number;
  cifBrl: number; // Valor Aduaneiro
  
  // Impostos Federais
  iiRate: number;
  iiBrl: number;
  ipiRate: number;
  ipiBrl: number;
  pisRate: number;
  pisBrl: number;
  cofinsRate: number;
  cofinsBrl: number;
  siscomexBrl: number;
  afrmmBrl: number;
  
  // Despesas Operacionais e Portuárias
  portExpensesBrl: number;
  brokerFeeBrl: number;
  
  // ICMS Estadual
  icmsBaseBrl: number;
  icmsRate: number;
  icmsBrl: number;
  
  // Custo Total Landed
  totalCostSimplesBrl: number;
  unitCostSimplesBrl: number;
  
  // Lucro Real (Com créditos de PIS/COFINS/ICMS)
  taxCreditsBrl: number;
  totalCostLucroRealBrl: number;
  unitCostLucroRealBrl: number;
  
  // Preços sugeridos
  suggestedSalePriceSimplesBrl: number;
  suggestedSalePriceLucroRealBrl: number;
  projectedProfitBrl: number;
  
  // CBM & Capacidade
  cbmPerCarton: number;
  totalCbm: number;
  totalGrossWeightKg: number;
  containerCapacityUtilizationPercent?: number;
}
