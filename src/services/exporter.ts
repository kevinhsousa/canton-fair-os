import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Supplier, Product } from '../types';
import { calculateLandedCost, DEFAULT_SIMULATION_PARAMS } from './landedCostEngine';

export function exportToExcel(suppliers: Supplier[], products: Product[]) {
  const wb = XLSX.utils.book_new();

  // 1. Aba Fornecedores
  const suppliersData = suppliers.map(s => ({
    'Fase': s.phase,
    'Hall / Pavilhão': s.hall,
    'Stand': s.standNumber,
    'Empresa': s.companyName,
    'Empresa (Chinês)': s.companyChinese || '',
    'Contato': s.contactPerson,
    'WeChat': s.wechatId,
    'WhatsApp': s.whatsapp || '',
    'E-mail': s.email || '',
    'Avaliação (1-5)': s.rating,
    'Tags': (s.tags || []).join(', '),
    'Notas': s.notes || '',
    'Cadastrado em': new Date(s.createdAt).toLocaleDateString('pt-BR')
  }));
  const wsSuppliers = XLSX.utils.json_to_sheet(suppliersData);
  XLSX.utils.book_append_sheet(wb, wsSuppliers, 'Fornecedores');

  // 2. Aba Produtos & Custos
  const productsData = products.map(p => {
    const s = suppliers.find(sup => sup.id === p.supplierId);
    
    // Simulação Landed Cost Padrão
    const landed = calculateLandedCost({
      fobPrice: p.fobPrice,
      currency: p.currency,
      quantity: p.moq || 500,
      unitsPerCarton: p.unitsPerCarton || 10,
      cartonLengthCm: p.cartonLengthCm || 40,
      cartonWidthCm: p.cartonWidthCm || 30,
      cartonHeightCm: p.cartonHeightCm || 30,
      grossWeightKg: p.grossWeightKg || 10,
      iiRate: 14.4,
      ipiRate: 9.75
    }, DEFAULT_SIMULATION_PARAMS);

    return {
      'Produto': p.name,
      'Categoria': p.category,
      'Fornecedor': s ? s.companyName : (p.supplierName || ''),
      'Stand': s ? s.standNumber : (p.standNumber || ''),
      'FOB Unitário': `${p.currency} ${p.fobPrice.toFixed(2)}`,
      'MOQ': p.moq,
      'Unidades/Caixa': p.unitsPerCarton,
      'Medidas Caixa (cm)': `${p.cartonLengthCm}x${p.cartonWidthCm}x${p.cartonHeightCm}`,
      'CBM por Caixa': landed.cbmPerCarton,
      'Custo Landed BR (Simples)': `R$ ${landed.unitCostSimplesBrl.toFixed(2)}`,
      'Custo Landed BR (Lucro Real)': `R$ ${landed.unitCostLucroRealBrl.toFixed(2)}`,
      'Preço Venda Sugerido (50% Margem)': `R$ ${landed.suggestedSalePriceSimplesBrl.toFixed(2)}`,
      'JEV Inovação (0-100)': p.innovationScore || '-',
      'JEV Fit DTC (0-100)': p.dtcFitScore || '-',
      'Alerta Regulatório': p.regulatoryAlert || 'NENHUMA'
    };
  });
  const wsProducts = XLSX.utils.json_to_sheet(productsData);
  XLSX.utils.book_append_sheet(wb, wsProducts, 'Produtos & Landed Cost');

  // Download do arquivo
  XLSX.writeFile(wb, `Canton_Fair_Relatorio_${new Date().toISOString().split('T')[0]}.xlsx`);
}

export function exportSupplierToPdf(supplier: Supplier, products: Product[]) {
  const doc = new jsPDF();

  // Cabeçalho institucional
  doc.setFillColor(11, 20, 43); // #0B142B
  doc.rect(0, 0, 210, 40, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(217, 180, 91); // #D9B45B
  doc.setFontSize(18);
  doc.text('CANTON FAIR OS — DOSSIÊ DE FORNECEDOR', 14, 18);

  doc.setTextColor(244, 237, 220); // Cream
  doc.setFontSize(12);
  doc.text(`${supplier.companyName} (${supplier.standNumber})`, 14, 28);
  doc.setFontSize(9);
  doc.setTextColor(169, 180, 201);
  doc.text(`Fase: ${supplier.phase} | Hall: ${supplier.hall} | Contato: ${supplier.contactPerson}`, 14, 35);

  // Informações de Contato
  doc.setTextColor(30, 41, 59);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('Dados de Comunicação Direta:', 14, 50);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(`• WeChat ID: ${supplier.wechatId || 'Não informado'}`, 14, 58);
  doc.text(`• WhatsApp: ${supplier.whatsapp || 'Não informado'}`, 14, 65);
  doc.text(`• E-mail: ${supplier.email || 'Não informado'}`, 14, 72);
  doc.text(`• Tags: ${(supplier.tags || []).join(', ') || 'Nenhuma tag'}`, 14, 79);

  if (supplier.notes) {
    doc.text(`• Observações: ${supplier.notes}`, 14, 86);
  }

  // Tabela de Produtos do Fornecedor
  const supProducts = products.filter(p => p.supplierId === supplier.id);

  const tableData = supProducts.map(p => {
    const landed = calculateLandedCost({
      fobPrice: p.fobPrice,
      currency: p.currency,
      quantity: p.moq || 500,
      unitsPerCarton: p.unitsPerCarton || 10,
      cartonLengthCm: p.cartonLengthCm || 40,
      cartonWidthCm: p.cartonWidthCm || 30,
      cartonHeightCm: p.cartonHeightCm || 30,
      grossWeightKg: p.grossWeightKg || 10,
      iiRate: 14.4,
      ipiRate: 9.75
    }, DEFAULT_SIMULATION_PARAMS);

    return [
      p.name,
      p.category,
      `${p.currency} ${p.fobPrice.toFixed(2)}`,
      p.moq,
      `${p.cartonLengthCm}x${p.cartonWidthCm}x${p.cartonHeightCm}`,
      `R$ ${landed.unitCostSimplesBrl.toFixed(2)}`,
      `R$ ${landed.suggestedSalePriceSimplesBrl.toFixed(2)}`,
      p.regulatoryAlert || 'LIVRE'
    ];
  });

  autoTable(doc, {
    startY: supplier.notes ? 95 : 88,
    head: [['Produto', 'Cat', 'FOB', 'MOQ', 'Caixa (cm)', 'Landed BR', 'P. Venda (50%)', 'Órgão']],
    body: tableData,
    theme: 'striped',
    headStyles: { fillColor: [11, 20, 43], textColor: [217, 180, 91] },
    styles: { fontSize: 8, cellPadding: 3 }
  });

  // Salvar PDF
  doc.save(`Dossie_${supplier.standNumber}_${supplier.companyName.replace(/\s+/g, '_')}.pdf`);
}
