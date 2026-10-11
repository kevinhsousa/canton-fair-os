export interface CbmCalculation {
  cbmPerCarton: number; // Volume de 1 caixa master em m³
  totalCartons: number;
  totalCbm: number; // Volume total da carga em m³
  totalGrossWeightKg: number;
  
  // Capacidades por tipo de container
  cartonsIn20GP: number;
  unitsIn20GP: number;
  cartonsIn40GP: number;
  unitsIn40GP: number;
  cartonsIn40HQ: number;
  unitsIn40HQ: number;
  
  // Peso cubado para aéreo
  airVolumetricWeightKg: number; // Divisor 6000
  airChargedWeightKg: number; // Maior entre peso real e cubado
}

export const CONTAINER_USABLE_CBM = {
  FCL_20: 28.0,   // Container 20 pés normal (capacidade teórica 33m³, útil 28m³)
  FCL_40: 58.0,   // Container 40 pés normal (capacidade teórica 67m³, útil 58m³)
  FCL_40HQ: 68.0  // Container 40 pés High Cube (teórica 76m³, útil 68m³)
};

export const CONTAINER_MAX_PAYLOAD_KG = {
  FCL_20: 21500,
  FCL_40: 26500,
  FCL_40HQ: 26500
};

export function calculateCbmAndContainers(
  lengthCm: number,
  widthCm: number,
  heightCm: number,
  unitsPerCarton: number,
  grossWeightKg: number,
  desiredQuantity: number = 0
): CbmCalculation {
  const l = Math.max(0.1, lengthCm || 0);
  const w = Math.max(0.1, widthCm || 0);
  const h = Math.max(0.1, heightCm || 0);
  const upc = Math.max(1, unitsPerCarton || 1);
  const weightPerCarton = Math.max(0.1, grossWeightKg || 0);

  // Volume de 1 caixa em m³
  const cbmPerCarton = (l * w * h) / 1000000;
  
  // Caixas e total para a quantidade desejada
  const totalCartons = desiredQuantity > 0 ? Math.ceil(desiredQuantity / upc) : 0;
  const totalCbm = totalCartons * cbmPerCarton;
  const totalGrossWeightKg = totalCartons * weightPerCarton;

  // Capacidades em container considerando limite volumétrico e limite de peso
  const cartonsByVolume20 = Math.floor(CONTAINER_USABLE_CBM.FCL_20 / cbmPerCarton);
  const cartonsByWeight20 = Math.floor(CONTAINER_MAX_PAYLOAD_KG.FCL_20 / weightPerCarton);
  const cartonsIn20GP = Math.min(cartonsByVolume20, cartonsByWeight20);
  const unitsIn20GP = cartonsIn20GP * upc;

  const cartonsByVolume40 = Math.floor(CONTAINER_USABLE_CBM.FCL_40 / cbmPerCarton);
  const cartonsByWeight40 = Math.floor(CONTAINER_MAX_PAYLOAD_KG.FCL_40 / weightPerCarton);
  const cartonsIn40GP = Math.min(cartonsByVolume40, cartonsByWeight40);
  const unitsIn40GP = cartonsIn40GP * upc;

  const cartonsByVolume40HQ = Math.floor(CONTAINER_USABLE_CBM.FCL_40HQ / cbmPerCarton);
  const cartonsByWeight40HQ = Math.floor(CONTAINER_MAX_PAYLOAD_KG.FCL_40HQ / weightPerCarton);
  const cartonsIn40HQ = Math.min(cartonsByVolume40HQ, cartonsByWeight40HQ);
  const unitsIn40HQ = cartonsIn40HQ * upc;

  // Cálculo Aéreo: Peso Cubado (Regra IATA padrão: L x W x H / 6000 por caixa)
  const airVolumetricWeightPerCarton = (l * w * h) / 6000;
  const airVolumetricWeightKg = totalCartons * airVolumetricWeightPerCarton;
  const airChargedWeightKg = Math.max(totalGrossWeightKg, airVolumetricWeightKg);

  return {
    cbmPerCarton: Number(cbmPerCarton.toFixed(4)),
    totalCartons,
    totalCbm: Number(totalCbm.toFixed(3)),
    totalGrossWeightKg: Number(totalGrossWeightKg.toFixed(2)),
    cartonsIn20GP,
    unitsIn20GP,
    cartonsIn40GP,
    unitsIn40GP,
    cartonsIn40HQ,
    unitsIn40HQ,
    airVolumetricWeightKg: Number(airVolumetricWeightKg.toFixed(2)),
    airChargedWeightKg: Number(airChargedWeightKg.toFixed(2))
  };
}
