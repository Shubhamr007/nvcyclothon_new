/**
 * Default operational budget and revenue streams for NV Cyclothon.
 */

const DEFAULT_EVENT_BUDGET = {
  sponsorships: [
    { id: "sp-1", name: "Title Sponsor (e.g. Hero / Decathlon)", amount: 300000, category: "title", confirmed: true },
    { id: "sp-2", name: "Powered-By Partner", amount: 150000, category: "powered_by", confirmed: true },
    { id: "sp-3", name: "Hydration & Energy Partner (Red Bull / Fast&Up)", amount: 75000, category: "associate", confirmed: false },
    { id: "sp-4", name: "Banking & Payment Partner", amount: 50000, category: "banking", confirmed: true },
  ],
  vendors: [
    { id: "vn-1", name: "Sports Nutrition & Cycling Gear Expo (5 Stalls)", amount: 35000, confirmed: true },
    { id: "vn-2", name: "Food & Beverage Pavilion (4 Stalls)", amount: 20000, confirmed: true },
  ],
  delegations: [
    { id: "del-1", name: "Corporate Bulk Delegation (3 Companies)", amount: 65000, confirmed: true },
  ],
  expense_categories: [
    {
      id: "prizes",
      title: "Prize Pools & Podium Awards",
      color: "#f59e0b",
      items: [
        { id: "pz-1", label: "60 Km Road Challenge Podium (1st, 2nd, 3rd Cash)", amount: 60000 },
        { id: "pz-2", label: "30 Km MTB Challenge Podium (1st, 2nd, 3rd Cash)", amount: 30000 },
        { id: "pz-3", label: "Youngest, Veteran & Special Category Trophies", amount: 10000 },
      ],
    },
    {
      id: "routes",
      title: "Route Clearances & Traffic Police (Grabbing Routes)",
      color: "#3b82f6",
      items: [
        { id: "rt-1", label: "Traffic Police Coordination, Permissions & Marshals", amount: 25000 },
        { id: "rt-2", label: "Road Barricades, Cones & High-Visibility Directional Signage", amount: 20000 },
        { id: "rt-3", label: "Pilot Lead Vehicle + Trailing Broom Wagon / Rescue Van", amount: 20000 },
      ],
    },
    {
      id: "media",
      title: "Media, Marketing & Production",
      color: "#a855f7",
      items: [
        { id: "md-1", label: "Professional Sports Photography & 4K Drone Pilot", amount: 35000 },
        { id: "md-2", label: "Start/Finish Line Truss Arch, Stage Backdrop & Podium", amount: 25000 },
        { id: "md-3", label: "Audio Stage Sound System, DJ & Professional Emcee", amount: 15000 },
        { id: "md-4", label: "Regional Media Press Releases, Posters & City Hoardings", amount: 12000 },
      ],
    },
    {
      id: "volunteers",
      title: "Volunteer Operations & Welfare",
      color: "#10b981",
      items: [
        { id: "vl-1", label: "60 Volunteer Official T-Shirts & Reflective Vests", amount: 18000 },
        { id: "vl-2", label: "Morning Breakfast Packs, Energy Bars, Lunch Boxes & Water", amount: 20000 },
        { id: "vl-3", label: "Volunteer Certificates, Lanyards & Travel Stipend", amount: 10000 },
      ],
    },
    {
      id: "logistics",
      title: "Race Logistics & Participant Kits",
      color: "#f43f5e",
      items: [
        { id: "lg-1", label: "Custom Sublimated Event Jerseys & Timing-Chip Bibs", amount: 110000, unitCost: 280, isVariable: true },
        { id: "lg-2", label: "Heavy Cast-Metal Finisher Medals with Custom Lanyards", amount: 45000, unitCost: 120, isVariable: true },
        { id: "lg-3", label: "4 Route Hydration Stations (Water, Electrolytes, Fruit, Ice)", amount: 25000, unitCost: 60, isVariable: true },
        { id: "lg-4", label: "Emergency Medical Support: On-duty Doctor + 2 Ambulances", amount: 20000, isVariable: false },
      ],
    },
    {
      id: "operations",
      title: "Venue Operations & Contingency Reserve",
      color: "#64748b",
      items: [
        { id: "op-1", label: "Portable Bio-Toilets & Post-Event Clean-up Crew", amount: 20000 },
        { id: "op-2", label: "Two-Way Walkie-Talkies for Route Safety Marshals", amount: 8000 },
        { id: "op-3", label: "Contingency Emergency Reserve (Unforeseen Costs)", amount: 20000 },
      ],
    },
  ],
};

function calculateFinancialTotals(registrations = [], budget = DEFAULT_EVENT_BUDGET) {
  let regRevenuePaise = 0;
  let paidCount = 0;
  let pendingCount = 0;
  let pendingPaise = 0;
  const categoryBreakdown = {};

  for (const r of registrations) {
    let feePaise = Number(r.registration_fee_paise);
    if (Number.isNaN(feePaise) || feePaise <= 0) {
      if (r.ride_category?.includes("60")) feePaise = 109900;
      else if (r.ride_category?.includes("30")) feePaise = 99900;
      else if (r.ride_category?.includes("10")) feePaise = 49900;
      else feePaise = 29900;
    }
    const cat = r.ride_category || "Standard";
    if (!categoryBreakdown[cat]) {
      categoryBreakdown[cat] = { count: 0, collectedPaise: 0 };
    }

    if (r.payment_status === "paid") {
      paidCount += 1;
      regRevenuePaise += feePaise;
      categoryBreakdown[cat].count += 1;
      categoryBreakdown[cat].collectedPaise += feePaise;
    } else {
      pendingCount += 1;
      pendingPaise += feePaise;
    }
  }

  const regRevenue = Math.round(regRevenuePaise / 100);
  const pendingRevenue = Math.round(pendingPaise / 100);

  const confirmedRevenue = (items) => (items || []).reduce((sum, item) => sum + (item.confirmed ? Number(item.amount) || 0 : 0), 0);
  const plannedRevenue = (items) => (items || []).reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
  const sponsorRevenue = confirmedRevenue(budget.sponsorships);
  const vendorRevenue = confirmedRevenue(budget.vendors);
  const delegationRevenue = confirmedRevenue(budget.delegations);
  const plannedCommercialRevenue = plannedRevenue(budget.sponsorships) + plannedRevenue(budget.vendors) + plannedRevenue(budget.delegations);

  const grossRevenue = regRevenue + sponsorRevenue + vendorRevenue + delegationRevenue;

  let grossExpenses = 0;
  const categoryExpenses = {};
  for (const cat of (budget.expense_categories || [])) {
    let catTotal = 0;
    for (const item of (cat.items || [])) {
      catTotal += Number(item.amount) || 0;
    }
    categoryExpenses[cat.id] = catTotal;
    grossExpenses += catTotal;
  }

  const netProfit = grossRevenue - grossExpenses;
  const profitMargin = grossRevenue > 0 ? Math.round((netProfit / grossRevenue) * 100) : 0;
  const avgTicket = paidCount > 0 ? Math.round(regRevenue / paidCount) : 850;
  const costPerRider = paidCount > 0 ? Math.round(grossExpenses / paidCount) : 0;

  const DEFAULT_UNIT_VARIABLE_COST = 460;
  let totalVariableBudget = 0;
  let unitVarSum = 0;
  for (const cat of (budget.expense_categories || [])) {
    for (const item of (cat.items || [])) {
      if (item.isVariable && item.unitCost) {
        unitVarSum += Number(item.unitCost) || 0;
        totalVariableBudget += Number(item.amount) || 0;
      }
    }
  }

  const variableCostPerRider = unitVarSum > 0 ? unitVarSum : DEFAULT_UNIT_VARIABLE_COST;
  const fixedExpenses = Math.max(0, grossExpenses - totalVariableBudget);
  const confirmedCommercial = sponsorRevenue + vendorRevenue + delegationRevenue;
  const pipelineCommercialRevenue = Math.max(0, plannedCommercialRevenue - confirmedCommercial);
  const netFixedToCover = Math.max(0, fixedExpenses - confirmedCommercial);
  const contributionMarginPerRider = Math.max(100, avgTicket - variableCostPerRider);
  const breakEvenRiders = netFixedToCover === 0 ? 0 : Math.ceil(netFixedToCover / contributionMarginPerRider);

  return {
    regRevenue,
    pendingRevenue,
    paidCount,
    pendingCount,
    categoryBreakdown,
    sponsorships: budget.sponsorships || [],
    vendors: budget.vendors || [],
    delegations: budget.delegations || [],
    expense_categories: budget.expense_categories || [],
    expenseCategories: budget.expense_categories || [],
    sponsorRevenue,
    vendorRevenue,
    delegationRevenue,
    confirmedCommercialRevenue: confirmedCommercial,
    plannedCommercialRevenue,
    pipelineCommercialRevenue,
    grossRevenue,
    grossExpenses,
    categoryExpenses,
    netProfit,
    profitMargin,
    avgTicket,
    costPerRider,
    variableCostPerRider,
    fixedExpenses,
    breakEvenRiders,
    updated_at: budget.updated_at || null,
  };
}

module.exports = {
  DEFAULT_EVENT_BUDGET,
  calculateFinancialTotals,
};
