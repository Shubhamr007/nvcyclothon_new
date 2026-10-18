/**
 * Admin Operations Co-Pilot AI Service for NV Cyclothon.
 * Connects Ollama to live database state for accurate operational assistance.
 */

const { callOllamaChat } = require("./ollama");
const { retrieveAugmentedContext } = require("./rag");

async function buildAdminContext(repository, userQuery = "") {
  const [
    analytics = {},
    pvAnalytics = {},
    settings = {},
    finance = {},
    registrations = [],
    volunteers = [],
    partners = [],
    vendors = [],
    delegations = [],
    organizingMembers = [],
  ] = await Promise.all([
    repository.getAnalytics ? repository.getAnalytics().catch(() => ({})) : {},
    repository.getPartnerVendorAnalytics ? repository.getPartnerVendorAnalytics().catch(() => ({})) : {},
    repository.getSiteSettings ? repository.getSiteSettings().catch(() => ({})) : {},
    repository.getFinanceSummary ? repository.getFinanceSummary().catch(() => ({})) : {},
    repository.listRegistrations ? repository.listRegistrations({ limit: 50 }).catch(() => []) : [],
    repository.listVolunteerAccounts ? repository.listVolunteerAccounts().catch(() => []) : [],
    repository.listPartnerApplications ? repository.listPartnerApplications({ limit: 30 }).catch(() => []) : [],
    repository.listVendorApplications ? repository.listVendorApplications({ limit: 30 }).catch(() => []) : [],
    repository.listDelegations ? repository.listDelegations().catch(() => []) : [],
    repository.listOrganizingMembers ? repository.listOrganizingMembers().catch(() => []) : [],
  ]);

  let matchedRegistrations = registrations;
  if (userQuery && repository.listRegistrations) {
    const cleanQuery = String(userQuery).replace(/[?.,!]/g, "").trim();
    const words = cleanQuery.split(/\s+/).filter(
      (w) => w.length >= 3 && !/^(the|what|who|show|list|tell|about|give|with|from|have|been|data|participants?|riders?|registered|status|table|details)$/i.test(w)
    );
    if (words.length > 0 && words.length <= 3) {
      try {
        const searchResults = await repository.listRegistrations({ search: words.join(" "), limit: 20 });
        if (Array.isArray(searchResults) && searchResults.length > 0) {
          const existingIds = new Set(matchedRegistrations.map((r) => r.id));
          const additions = searchResults.filter((r) => !existingIds.has(r.id));
          matchedRegistrations = [...matchedRegistrations, ...additions];
        }
      } catch {
        // Fallback to base registrations list
      }
    }
  }

  return {
    analytics,
    pvAnalytics,
    settings,
    finance,
    registrations: matchedRegistrations,
    volunteers,
    partners,
    vendors,
    delegations,
    organizingMembers,
  };
}

function getAdminCoPilotSystemPrompt({
  analytics = {},
  pvAnalytics = {},
  settings = {},
  finance = {},
  registrations = [],
  volunteers = [],
  partners = [],
  vendors = [],
  delegations = [],
  organizingMembers = [],
}) {
  const eventDate = settings.event_date || "22 November 2026";
  const eventLocation = settings.event_location || "Rewa, Madhya Pradesh";
  const venue = "SAF Ground, Rewa, MP";
  const totalRevInr = Math.round((analytics.total_revenue_paise || 0) / 100).toLocaleString("en-IN");
  const grossFinRev = Number(finance.grossRevenue || 0).toLocaleString("en-IN");
  const grossFinExp = Number(finance.grossExpenses || 0).toLocaleString("en-IN");
  const netSurplus = Number(finance.netProfit || 0).toLocaleString("en-IN");

  const participantsList = registrations.length === 0
    ? "No participants registered in database (0 records)."
    : registrations.map((r) => {
        const isCheckedIn = Boolean(r.checked_in_at || r.status === "checked_in");
        const checkinStr = isCheckedIn ? `Checked-In On-Ground (at ${r.checked_in_at || "verified"})` : "Not Checked-In";
        return `- ID: ${r.id} | Name: ${r.full_name} | Category: ${r.ride_category} | Registration Status: ${r.status} | Payment: ${r.payment_status} | On-Ground Check-in: ${checkinStr}${r.city ? ` | City: ${r.city}` : ""}${r.email ? ` | Email: ${r.email}` : ""}`;
      }).join("\n");

  const volunteersList = volunteers.length === 0
    ? "No volunteer accounts registered in database (0 records)."
    : volunteers.map((v) => `- ID: ${v.volunteer_id} | Name: ${v.display_name} | Role: ${v.role} | Active: ${v.active ? "Yes" : "No"}`).join("\n");

  const partnersList = partners.length === 0
    ? "No commercial partner applications in database (0 records)."
    : partners.map((p) => `- App #${p.application_number || p.id}: ${p.company_name || p.organization_name} | Contact: ${p.contact_name} | Category: ${p.partnership_category || p.category} | Status: ${p.status}`).join("\n");

  const vendorsList = vendors.length === 0
    ? "No vendor stall applications in database (0 records)."
    : vendors.map((v) => `- App #${v.application_number || v.id}: ${v.business_name} | Contact: ${v.contact_name} | Stall Type: ${v.stall_category || v.category} | Status: ${v.status}${v.stall_number ? ` | Stall #${v.stall_number}` : ""}`).join("\n");

  const delegationsList = delegations.length === 0
    ? "No delegations in database (0 records)."
    : delegations.map((d) => `- ID: ${d.id} | Name: ${d.name} (${d.designation || "Delegate"}, ${d.organization || "Govt"}) | Status: ${d.status} | VIP: ${d.vip ? "Yes" : "No"}`).join("\n");

  const membersList = organizingMembers.length === 0
    ? "No committee members in database (0 records)."
    : organizingMembers.map((m) => `- ${m.name} (${m.role})`).join("\n");

  return `You are the Executive Operations & Financial Trust Co-Pilot for NV Cyclothon 2026 ('Ride for Vindhya'), organized under the Rewa District Cycling Association (RDCA).
You assist race directors, committee chairs, the treasurer, and statutory auditors with live database metrics, financial governance, statutory trust compliance, and stakeholder communications.

CRITICAL DATABASE FIDELITY & ZERO-HALLUCINATION DIRECTIVES:
1. STRICT DATABASE GROUNDING: You MUST strictly and exclusively use the real data from the database sections below.
2. NEVER FABRICATE OR ASSUME NAMES OR CATEGORIES:
   - Official race categories are STRICTLY: '60 Km Road Challenge', '30 Km MTB Challenge', '10 Km Green Ride', and 'Kid-o-thon'.
   - NEVER mention non-existent categories like '100km' or '50km'.
   - NEVER make up fake participant names (such as 'Rahul Sharma', 'Aisha Khan'), fake volunteer names, or fake vendor names.
3. TABULAR DATA REQUESTS: When asked for participants or any dataset in a table or list, format the EXACT records listed under LIVE VERIFIED REGISTERED PARTICIPANTS below with their real ID, Name, Category, Status, Payment, and Check-In state.
4. ZERO RECORD DECLARATION: If a dataset has 0 records, clearly report that there are currently 0 records in the database. Never generate fictitious placeholder rows.

LIVE VERIFIED REGISTERED PARTICIPANTS (Direct from Database):
${participantsList}

LIVE VERIFIED VOLUNTEER ACCOUNTS (Direct from Database):
${volunteersList}

LIVE VERIFIED COMMERCIAL PARTNERS & SPONSORS:
${partnersList}

LIVE VERIFIED VENDORS & EXPO STALLS:
${vendorsList}

LIVE VERIFIED DELEGATIONS & VIPS:
${delegationsList}

LIVE VERIFIED ORGANIZING COMMITTEE:
${membersList}

CURRENT VERIFIED EVENT METRICS:
- Event Date & Venue: ${eventDate} at ${venue} (${eventLocation})
- Total Registered Riders: ${analytics.total_registrations || 0}
- Approved / Confirmed Riders: ${analytics.approved_registrations || 0}
- Checked-In On-Ground: ${analytics.checked_in_registrations || 0}
- Ticket Payment Revenue: ₹${totalRevInr}
- Route Breakdown: ${JSON.stringify(analytics.registrations_by_route || {})}
- T-Shirt Allocations: ${JSON.stringify(analytics.t_shirt_counts || {})}
- Commercial Partners: ${pvAnalytics.total_partners || 0} total (${pvAnalytics.approved_partners || 0} approved)
- Food & Expo Vendors: ${pvAnalytics.total_vendors || 0} total (${pvAnalytics.approved_vendors || 0} approved)

LIVE AUDITED FINANCIAL & BUDGET LEDGER:
- Total Gross Inflows: ₹${grossFinRev} (Ticket Entries: ₹${Number(finance.regRevenue || 0).toLocaleString("en-IN")}, Sponsors: ₹${Number(finance.sponsorRevenue || 0).toLocaleString("en-IN")}, Vendors/Stalls: ₹${Number((finance.vendorRevenue || 0) + (finance.delegationRevenue || 0)).toLocaleString("en-IN")})
- Approved Operating Disbursements: ₹${grossFinExp}
- Net Operating Position: ${Number(finance.netProfit || 0) >= 0 ? "Surplus +" : "Deficit -"}₹${netSurplus} (${finance.profitMargin || 0}% margin)
- Turnout Break-Even Requirement: ${finance.breakEvenRiders || 312} riders (Paid: ${finance.paidCount || 0})
- Expense Category Allocations: ${JSON.stringify(finance.categoryExpenses || {})}
- Confirmed Sponsors: ${(finance.sponsorships || []).map(s => `${s.name}: ₹${Number(s.amount).toLocaleString("en-IN")} (${s.confirmed ? "Confirmed" : "Tentative"})`).join("; ") || "None"}

TRUST, STATUTORY GOVERNANCE & ACCOUNTABILITY PLAYBOOK:
1. Non-Profit Sporting Integrity: RDCA is a registered non-profit sports body affiliated with the Cycling Federation of India and MP Olympic Association. Surplus funds are constitutionally restricted to the "Youth Cycling Grassroots Development Reserve" and cannot be distributed commercially.
2. Prize Pool & TDS Trust: Cash prize payouts above ₹10,000 strictly comply with Section 194B of the Income Tax Act (30% TDS deducted before disbursement). All cash prizes are guaranteed and pre-funded in escrow.
3. Sponsor Fund Utilization Certificates (UC): When asked to draft a Sponsor Utilization Certificate, break down exactly where the partner's grant was deployed (e.g. medical ambulances, hydration points, volunteer safety kits) with line items.
4. Procurement & Vendor Transparency: All disbursements require GSTIN invoices, signed challans for police bandobast, and formal procurement vouchers.
5. Unit Economics Truthfulness: Never hallucinate or inflate numbers. Give transparent, realistic break-even calculations.

ASSISTANT GUIDELINES:
- Base all calculations, tables, and statistics strictly on the verified database records above.
- When drafting certificates, memos, or proposals, format them cleanly with headers, dates, and signoff blocks ready for the Race Director or Treasurer to sign.
- Communicate in natural, professional, user-oriented language.
- Do not expose internal technical or implementation terminology (such as RAG, vector retrieval, embeddings, chunk databases, prompt structures, or tool names) unless the user explicitly asks a technical question about them. Reference guidelines naturally as verified event rules, operational records, or RDCA policies.
- If a question is ambiguous, provide a helpful answer based on reasonable assumptions and invite clarification.
- If a user asks something unrelated to NV Cyclothon or cycling event operations, politely explain your scope as the NV Cyclothon operations assistant and offer to help with registrations, budgets, safety, or routes.`;
}

async function runAdminCoPilot(config, { messages = [], repository, includeLiveContext = true, signal }) {
  const cleanMessages = (messages || [])
    .filter((m) => m && typeof m.content === "string" && ["user", "assistant"].includes(m.role))
    .slice(-10);

  const latestUserMessage = [...cleanMessages].reverse().find((m) => m.role === "user")?.content || "";

  let contextData = {};
  if (includeLiveContext && repository) {
    contextData = await buildAdminContext(repository, latestUserMessage);
  }

  const systemPrompt = getAdminCoPilotSystemPrompt(contextData);

  let ragContextText = "";
  let ragCitations = [];

  if (latestUserMessage) {
    try {
      const ragResult = await retrieveAugmentedContext(latestUserMessage, config);
      ragContextText = ragResult.contextText || "";
      ragCitations = ragResult.citations || [];
    } catch {
      // Continue without RAG if vector lookup fails
    }
  }

  const fullSystemPrompt = ragContextText
    ? `${systemPrompt}\n\n${ragContextText}`
    : systemPrompt;

  const promptPayload = [
    { role: "system", content: fullSystemPrompt },
    ...cleanMessages,
  ];

  const response = await callOllamaChat(config, {
    messages: promptPayload,
    temperature: 0.2,
    maxTokens: 1536,
    timeoutMs: 60000,
    signal,
  });

  return {
    message: {
      role: "assistant",
      content: response.content || "I have analyzed your request.",
    },
    metricsSummary: {
      totalRiders: contextData.analytics?.total_registrations || 0,
      approvedRiders: contextData.analytics?.approved_registrations || 0,
      revenueInr: Math.round((contextData.analytics?.total_revenue_paise || 0) / 100),
    },
    ragCitations,
    model: response.model,
    durationMs: response.totalDurationMs,
  };
}

module.exports = {
  buildAdminContext,
  getAdminCoPilotSystemPrompt,
  runAdminCoPilot,
};
