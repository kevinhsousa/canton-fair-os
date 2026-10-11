# 🇨🇳 Canton Fair OS — Trade & Landed Cost Intelligence

Plataforma de alta performance para operação de campo na **Canton Fair (Pazhou, Guangzhou)**, com cadastro ágil de fornecedores, fotos de stands, cubagem CBM, calculadora aduaneira completa (Landed Cost Brasil) e **JEV Decision Engine (TypeSafe AI)**.

---

## ⚡ Principais Capacidades

1. **📱 100% Offline-First (PWA):**
   - Armazenamento local no aparelho via **IndexedDB (Dexie.js)**.
   - Compressão automática de fotos em WebP client-side (reduzindo fotos pesadas para ~120KB).
   - Funciona perfeitamente mesmo sem internet no pavilhão de Guangzhou.

2. **🧮 Motor de Landed Cost (Receita Federal Oficial):**
   - Conversão de moedas: FOB USD e FOB RMB para Real (BRL).
   - Cálculo do Valor Aduaneiro CIF (FOB + Frete + Seguro).
   - Impostos Federais: II, IPI, PIS (2,1%), COFINS (9,65%), Siscomex e AFRMM (8% sobre frete marítimo).
   - ICMS Importação "por dentro" oficial para SC (TTD 4%/10%), PR e SP.
   - Comparativo Simples Nacional vs Lucro Real (com recuperação de créditos fiscais).
   - Preço de Venda Sugerido e Projeção de Lucro por Lote/Container.

3. **📦 Engenharia de Carga & CBM:**
   - Volume de caixa em m³: $\frac{C \times L \times A}{1.000.000}$.
   - Capacidade automática em Container 20' GP, 40' GP, 40' HQ, LCL marítimo e Aéreo cargo.

4. **⚡ JEV Decision Engine (TypeSafe AI):**
   - Score de Inovação & Diferenciação (0 a 100).
   - Score DTC Fit para e-commerce (margem landed, cubagem e densidade de valor).
   - Alertas Regulatórios compulsórios: **ANATEL**, **INMETRO**, **ANVISA**.
   - Smart-Ifs para negociação no stand (MOQ, desconto de volume, modal ideal).

5. **📊 Exportação Executiva:**
   - Planilha **Excel (XLSX)** estruturada com todos os fornecedores, custos e contatos.
   - **Dossiê em PDF** por stand pronto para despachar via WhatsApp.

---

## 🚀 Como Executar

### Na VPS Netcup (Produção / Acesso Remoto)
```bash
# Rodar na VPS
cd ~/workspace/canton-intel
npm run build
npx serve -s dist -l 8077
```

### Localmente (Desenvolvimento)
```bash
cd "C:\Users\Kevin de Sousa\Documents\01-CUBE-GIT\canton-intel"
npm install
npm run dev
```

---

## 🏛️ Estrutura do Projeto
- `src/services/db.ts`: Banco local IndexedDB (Dexie.js)
- `src/services/landedCostEngine.ts`: Motor tributário e aduaneiro da Receita Federal
- `src/services/cbmEngine.ts`: Cubagem e engenharia de containers
- `src/services/jevEngine.ts`: Motor de inteligência de decisão JEV
- `src/services/exporter.ts`: Exportador Excel e PDF
- `src/pages/`: QuickAdd, Stands, Products, Calculator e JevRanking
