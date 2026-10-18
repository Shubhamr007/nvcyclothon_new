/**
 * Financial calculation models and baseline budget defaults for NV Cyclothon.
 */

export const DEFAULT_SPONSORSHIPS = [
  { id: "sp-1", name: "Title Sponsor (e.g. Hero / Decathlon)", amount: 300000, category: "title", confirmed: true },
  { id: "sp-2", name: "Powered-By Partner", amount: 150000, category: "powered_by", confirmed: true },
  { id: "sp-3", name: "Hydration & Energy Partner (Red Bull / Fast&Up)", amount: 75000, category: "associate", confirmed: false },
  { id: "sp-4", name: "Banking & Payment Partner", amount: 50000, category: "banking", confirmed: true },
];

export const DEFAULT_VENDORS = [
  { id: "vn-1", name: "Sports Nutrition & Cycling Gear Expo (5 Stalls)", amount: 35000, confirmed: true },
  { id: "vn-2", name: "Food & Beverage Pavilion (4 Stalls)", amount: 20000, confirmed: true },
];

export const DEFAULT_DELEGATIONS_REVENUE = [
  { id: "del-1", name: "Corporate Bulk Delegation (3 Companies)", amount: 65000, confirmed: true },
];

export const DEFAULT_EXPENSE_CATEGORIES = [
  {
    id: "prizes",
    title: "Prize Pools & Podium Awards",
    icon: "Award",
    color: "amber",
    items: [
      { id: "pz-1", label: "60 Km Road Challenge Podium (1st, 2nd, 3rd Cash)", amount: 60000 },
      { id: "pz-2", label: "30 Km MTB Challenge Podium (1st, 2nd, 3rd Cash)", amount: 30000 },
      { id: "pz-3", label: "Youngest, Veteran & Special Category Trophies", amount: 10000 },
    ],
  },
  {
    id: "routes",
    title: "Route Clearances & Traffic Police (Grabbing Routes)",
    icon: "ShieldAlert",
    color: "blue",
    items: [
      { id: "rt-1", label: "Traffic Police Coordination, Permissions & Marshals", amount: 25000 },
      { id: "rt-2", label: "Road Barricades, Cones & High-Visibility Directional Signage", amount: 20000 },
      { id: "rt-3", label: "Pilot Lead Vehicle + Trailing Broom Wagon / Rescue Van", amount: 20000 },
    ],
  },
  {
    id: "media",
    title: "Media, Marketing & Production",
    icon: "Camera",
    color: "purple",
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
    icon: "Users",
    color: "emerald",
    items: [
      { id: "vl-1", label: "60 Volunteer Official T-Shirts & Reflective Vests", amount: 18000 },
      { id: "vl-2", label: "Morning Breakfast Packs, Energy Bars, Lunch Boxes & Water", amount: 20000 },
      { id: "vl-3", label: "Volunteer Certificates, Lanyards & Travel Stipend", amount: 10000 },
    ],
  },
  {
    id: "logistics",
    title: "Race Logistics & Participant Kits",
    icon: "Package",
    color: "rose",
    items: [
      { id: "lg-1", label: "Custom Sublimated Event Jerseys & Timing-Chip Bibs", amount: 110000, unitCost: 280, isVariable: true, variablePerRider: 280 },
      { id: "lg-2", label: "Heavy Cast-Metal Finisher Medals with Custom Lanyards", amount: 45000, unitCost: 120, isVariable: true, variablePerRider: 120 },
      { id: "lg-3", label: "4 Route Hydration Stations (Water, Electrolytes, Fruit, Ice)", amount: 25000, unitCost: 60, isVariable: true, variablePerRider: 60 },
      { id: "lg-4", label: "Emergency Medical Support: On-duty Doctor + 2 Ambulances", amount: 20000, isVariable: false },
    ],
  },
  {
    id: "operations",
    title: "Venue Operations & Contingency Reserve",
    icon: "Settings",
    color: "slate",
    items: [
      { id: "op-1", label: "Portable Bio-Toilets & Post-Event Clean-up Crew", amount: 20000 },
      { id: "op-2", label: "Two-Way Walkie-Talkies for Route Safety Marshals", amount: 8000 },
      { id: "op-3", label: "Contingency Emergency Reserve (Unforeseen Costs)", amount: 20000 },
    ],
  },
];

export function computeFinancialSummary({
  riders = [],
  sponsorships = DEFAULT_SPONSORSHIPS,
  vendors = DEFAULT_VENDORS,
  delegations = DEFAULT_DELEGATIONS_REVENUE,
  expenseCategories = DEFAULT_EXPENSE_CATEGORIES,
  basePaidCount,
  baseRegRevenue,
}) {
  // 1. Inflows
  let regRevenue = typeof baseRegRevenue === "number" ? baseRegRevenue : 0;
  let paidCount = typeof basePaidCount === "number" ? basePaidCount : 0;

  if (typeof baseRegRevenue !== "number") {
    riders.forEach((r) => {
      let feePaise = Number(r.registration_fee_paise);
      if (Number.isNaN(feePaise) || feePaise <= 0) {
        if (r.ride_category?.includes("60")) feePaise = 109900;
        else if (r.ride_category?.includes("30")) feePaise = 99900;
        else if (r.ride_category?.includes("10")) feePaise = 49900;
        else feePaise = 29900;
      }
      if (r.payment_status === "paid") {
        paidCount += 1;
        regRevenue += feePaise / 100;
      }
    });
  }

  const confirmedRevenue = (items) => items.reduce((sum, item) => sum + (item.confirmed ? Number(item.amount) || 0 : 0), 0);
  const plannedRevenue = (items) => items.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
  const sponsorRevenue = confirmedRevenue(sponsorships);
  const vendorRevenue = confirmedRevenue(vendors);
  const delegationRevenue = confirmedRevenue(delegations);
  const plannedCommercialRevenue = plannedRevenue(sponsorships) + plannedRevenue(vendors) + plannedRevenue(delegations);

  const grossRevenue = regRevenue + sponsorRevenue + vendorRevenue + delegationRevenue;

  // 2. Outflows
  let grossExpenses = 0;
  const categoryExpenses = {};

  expenseCategories.forEach((cat) => {
    let catTotal = 0;
    cat.items.forEach((item) => {
      catTotal += Number(item.amount) || 0;
    });
    categoryExpenses[cat.id] = catTotal;
    grossExpenses += catTotal;
  });

  // 3. Profitability & Unit Economics
  const netProfit = grossRevenue - grossExpenses;
  const profitMargin = grossRevenue > 0 ? Math.round((netProfit / grossRevenue) * 100) : 0;
  const avgTicket = paidCount > 0 ? Math.round(regRevenue / paidCount) : 850;
  const costPerRider = paidCount > 0 ? Math.round(grossExpenses / paidCount) : 0;

  // Fixed vs Variable estimation for Break-Even:
  // Variable cost per rider ≈ ₹460 (Jersey ₹280 + Medal ₹120 + Hydration ₹60)
  let totalVariableBudget = 0;
  let unitVarSum = 0;
  expenseCategories.forEach((cat) => {
    (cat.items || []).forEach((item) => {
      const uCost = Number(item.unitCost || item.variablePerRider) || 0;
      if (item.isVariable || uCost > 0) {
        unitVarSum += uCost;
        totalVariableBudget += Number(item.amount) || 0;
      }
    });
  });

  const variableCostPerRider = unitVarSum > 0 ? unitVarSum : 460;
  const fixedExpenses = Math.max(0, grossExpenses - totalVariableBudget);
  const confirmedCommercialRevenue = sponsorRevenue + vendorRevenue + delegationRevenue;
  const pipelineCommercialRevenue = Math.max(0, plannedCommercialRevenue - confirmedCommercialRevenue);
  const netFixedToCover = Math.max(0, fixedExpenses - confirmedCommercialRevenue);
  const contributionMarginPerRider = Math.max(100, avgTicket - variableCostPerRider);
  const breakEvenRiders = netFixedToCover === 0 ? 0 : Math.ceil(netFixedToCover / contributionMarginPerRider);

  return {
    regRevenue: Math.round(regRevenue),
    sponsorRevenue,
    vendorRevenue,
    delegationRevenue,
    confirmedCommercialRevenue,
    plannedCommercialRevenue,
    pipelineCommercialRevenue,
    grossRevenue,
    grossExpenses,
    categoryExpenses,
    netProfit,
    profitMargin,
    paidCount,
    avgTicket,
    costPerRider,
    variableCostPerRider,
    fixedExpenses,
    breakEvenRiders,
    expense_categories: expenseCategories,
    expenseCategories: expenseCategories,
  };
}
