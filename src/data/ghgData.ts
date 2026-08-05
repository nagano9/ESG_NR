
export const ghgSummary2025 = {
  totalEmissions: 479.231495,
  revenue: 1026.84, // Miliar Rupiah
  intensity: 0.466705, // tCO2e / Miliar Rupiah
  previousYearEmissions: 285.82,
  changePercentage: 40.36,
  intensityChange: 34.51,
  scopes: [
    { label: "Scope 1 (Direct)", value: 24.267251, percentage: 5.06 },
    { label: "Scope 2 (Electricity)", value: 70.768236, percentage: 14.77 },
    { label: "Scope 3 (Supply Chain)", value: 384.196008, percentage: 80.17 },
  ],
  scope3Breakdown: [
    { cat: "C1: Purchased Goods", value: 31.72958 },
    { cat: "C5: Waste", value: 1.98688 },
    { cat: "C6: Business Travel", value: 198.54923 },
    { cat: "C7: Commuting", value: 148.037858 },
    { cat: "C8: Leased Assets", value: 3.89246 },
  ],
  investmentPortfolio: 1465502.64, // Scope 3 Cat 15
};

export const jvcEntities = [
  { 
    name: "PT Shenhua Guohua PJB", 
    equity: "30%", 
    emissions: 864767.43, 
    debtEmissions: 2878.46, 
    status: "Operasional",
    partner: "Shenhua Guohua",
    category: "Coal/Hybrid"
  },
  { 
    name: "PT PJB Masdar Solar Energi", 
    equity: "51%", 
    emissions: 19757.06, 
    debtEmissions: 117.51, 
    status: "Operasional",
    partner: "Masdar",
    category: "Solar"
  },
  { 
    name: "PT North Sumatera Hydro Energy", 
    equity: "25%", 
    emissions: 439352.06, 
    debtEmissions: 0, 
    status: "Konstruksi",
    partner: "Sinohydro",
    category: "Hydro"
  },
  { 
    name: "PT Nusantara Sembcorp Solar", 
    equity: "51%", 
    emissions: 12265.43, 
    debtEmissions: 0, 
    status: "Operasional",
    partner: "Sembcorp",
    category: "Solar"
  },
  { 
    name: "PT Sumbagselenergi Sakti Pewali", 
    equity: "10%", 
    emissions: 99164.73, 
    debtEmissions: 0, 
    status: "Konstruksi",
    partner: "Local",
    category: "Coal"
  },
  { 
    name: "PT Nusantara Guodian Karangkates", 
    equity: "51%", 
    emissions: 14170.37, 
    debtEmissions: 0, 
    status: "Konstruksi",
    partner: "Guodian",
    category: "Solar"
  }
];
