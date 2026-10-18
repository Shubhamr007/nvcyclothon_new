/**
 * NV Cyclothon 2026 Official Operational Knowledge Base.
 * Structured chunks for Vector Indexing and Semantic Retrieval-Augmented Generation (RAG).
 * Grounded in the official Rewa race categories: 60 Km Road Challenge, 30 Km MTB Challenge, 10 Km Green Ride, Kid-o-thon.
 */

const KNOWLEDGE_CHUNKS = [
  {
    id: "kb-rules-safety",
    title: "Race Rules, Safety & Mandatory Helmet Protocol",
    category: "safety",
    keywords: ["helmet", "safety", "rules", "lights", "brakes", "gear", "disqualification"],
    content: `Safety Regulations & Mandatory Equipment:
1. Helmets are 100% strictly mandatory for all participants across all 4 categories (60 Km Road Challenge, 30 Km MTB Challenge, 10 Km Green Ride, Kid-o-thon). No rider will be permitted to enter the start chute without an approved, securely fastened cycling helmet.
2. Lighting: Front white headlight and rear flashing red blinker are required for 60 Km and 30 Km riders because flag-off commences at 06:00 AM / 06:30 AM during dawn twilight.
3. Bicycle Requirements: Road bikes, gravel bikes, MTBs, and hybrid cycles are permitted. All bikes must have functioning dual front and rear brakes. Fixed-gear bikes without independent hand brakes are strictly prohibited.
4. Aerobars: Clip-on TT aerobars are not allowed in mass-start packs for safety.
5. Headphone Ban: Earphones and headphones of any kind are banned while cycling on the course to maintain situational awareness.`,
  },
  {
    id: "kb-routes-aid-stations",
    title: "Route Specifications, Turnarounds & Aid Stations",
    category: "routes",
    keywords: ["routes", "distance", "60km", "30km", "10km", "kid-o-thon", "aid stations", "water", "rewa", "nh30"],
    content: `Route Geography & Hydration Points (Rewa, Madhya Pradesh):
1. 60 Km Road Challenge: Starts at SAF Ground Rewa, proceeds through City Center to NH-30 (Rewa-Prayagraj Highway), reaches Chorhata Bypass, continues to Mangawan turnaround point at km 30, and loops back to SAF Ground. Official cutoff: 3 hours 30 minutes.
2. 30 Km MTB Challenge: Starts at SAF Ground, moves onto rugged Vindhya countryside trails and rolling dirt/gravel elevation sectors before returning to SAF Ground. Cutoff: 2 hours 30 minutes.
3. 10 Km Green Ride: SAF Ground through Civil Lines, Commissioner Residence loop, and back. Family and community fitness ride. Cutoff: 1 hour 30 minutes.
4. Kid-o-thon: Safe, traffic-free closed perimeter circuit around SAF Ground for young champions aged 10-13.
5. Aid Stations: Located every 5km along NH-30 and key route junctures. Equipped with chilled water, Enerzal electrolytes, fresh bananas, glucose biscuits, emergency puncture kits, and basic first-aid.`,
  },
  {
    id: "kb-medical-emergency",
    title: "Medical Protocol, Ambulances & Hospital Emergency Network",
    category: "medical",
    keywords: ["medical", "emergency", "ambulance", "hospital", "doctor", "sos", "injury", "first aid"],
    content: `Emergency & Medical Evacuation Protocols:
1. Designated Medical Partner: Sanjay Gandhi Memorial Hospital (SGMH), Rewa (Tier-1 trauma center on standby).
2. Ambulances on Course: 4 Advance Life Support (ALS) ambulances deployed. Two roving mobile units equipped with defibrillators and oxygen, plus two stationary units stationed at route turnaround points.
3. Emergency SOS Control Room Hotline: +91 7662 255555. On-course medical coordinator mobile: +91 9893 000112.
4. Route Marshals: 60 trained motorcycle marshals with high-visibility neon vests, first-aid kits, and wireless transceivers to report incidents within 60 seconds.
5. Heat Exhaustion: Misting cooling tents and paramedics stationed at km 15, 30, and 45.`,
  },
  {
    id: "kb-expo-bib-collection",
    title: "Expo, Bib Pick-Up & Kit Distribution Protocol",
    category: "logistics",
    keywords: ["bib", "kit", "expo", "tshirt", "collection", "pick up", "saf ground", "timing chip"],
    content: `Expo & Kit Distribution Guidelines:
1. Expo Venue: SAF Ground Pavillion, Civil Lines, Rewa, Madhya Pradesh.
2. Expo Schedule: Friday 20 November & Saturday 21 November 2026, from 10:00 AM to 07:00 PM.
3. Required Documents: Original Government Photo ID (Aadhaar, Passport, or Driving License) along with the Registration Confirmation SMS/Email containing the unique QR code.
4. Third-Party Collection: Permitted only with an original signed authorization letter from the rider, a photocopy of the rider's ID, and the collector's own government ID.
5. Race Day Bib Distribution: Strictly NO race-day morning bib collection for 60 Km and 30 Km participants to avoid start-line congestion.`,
  },
  {
    id: "kb-eligibility-categories",
    title: "Category Criteria, Age Limits & Registration Fees",
    category: "registration",
    keywords: ["age", "fee", "price", "eligibility", "categories", "early bird", "registration"],
    content: `Participant Eligibility & Pricing Structure:
1. 60 Km Road Challenge: Minimum age 18 years on race day. Standard Fee: ₹1,099 (Early Bird: ₹899 for first 50 sign-ups).
2. 30 Km MTB Challenge: Minimum age 16 years. Standard Fee: ₹999 (Early Bird: ₹799).
3. 10 Km Green Ride: Open to all fitness enthusiasts. Standard Fee: ₹499 (Early Bird: ₹399).
4. Kid-o-thon: Ages 10 to 13 years (closed circuit). Flat Fee: ₹299.
5. Inclusions: Every registration includes official dry-fit cycling jersey/t-shirt, timing chip (for competitive categories), bib number, route nutrition, post-race hot breakfast, Finisher Medal, and verifiable digital certificate.`,
  },
  {
    id: "kb-volunteers-logistics",
    title: "Volunteer Coordination, Roles & Shift Schedule",
    category: "volunteers",
    keywords: ["volunteer", "shifts", "marshals", "briefing", "credentials", "pin", "check-in"],
    content: `Volunteer Operations & Management Playbook:
1. Mandatory Briefing: Saturday 21 November 2026 at 04:00 PM at SAF Ground main stage.
2. Race Day Reporting: 04:30 AM sharp at the Volunteer Operations Center for breakfast, high-vis bib vests, and walkie-talkies.
3. Core Stations:
   - Check-in & QR Scanning Desk: 20 volunteers
   - Route Marshals & Traffic Coordination: 40 volunteers
   - Aid Stations & Hydration Supply: 30 volunteers
   - Start/Finish Gantry & Medal Distribution: 25 volunteers
4. Volunteer Access Credentials: Per-volunteer PIN and digital badge generated through Admin Portal for secure race check-in scanning.`,
  },
  {
    id: "kb-partners-sponsorship",
    title: "Partners, Sponsorship Tiers & Commercial Booths",
    category: "commercial",
    keywords: ["partner", "sponsor", "tier", "commercial", "vendor", "stalls", "expo"],
    content: `Partnership Framework & Expo Commercial Guidelines:
1. Sponsorship Tiers:
   - Title Sponsor: Exclusive gantry naming ('NV Cyclothon presented by...'), chest bib logo, VIP stage felicitation.
   - Powered By: Primary highway branding banners on NH-30, lead car branding, expo zone pavilion.
   - Associate & Hydration: Dedicated branding on all aid stations, cycling jersey sleeve logo.
2. Expo Food & Cycling Vendors: 24 designated 10x10 ft stalls allotted at SAF Ground perimeter.
3. Documentation: Commercial food vendors must submit local municipality FSSAI hygiene registration certificate.`,
  },
  {
    id: "kb-timing-disqualification",
    title: "RFID Timing Chips, Disqualification & Podiums",
    category: "timing",
    keywords: ["timing", "chip", "rfid", "dnf", "disqualification", "results", "podium", "cash prize"],
    content: `Timing & Race Adjudication Protocol:
1. RFID Timing: Precision dual-frequency RFID tags affixed to the back of the helmet or bike frame for 60 Km and 30 Km categories.
2. Mandatory Timing Mats: Located at Start Gantry, intermediate timing points, turnaround points, and Finish Line. Skipping any timing mat leads to automatic DNF (Did Not Finish).
3. Motorized Assistance: Pacing, towing, or holding onto motor vehicles immediately results in permanent disqualification (DQ).
4. Awards & Ceremonies: Top 3 Male & Female podium finishers in 60 Km and 30 Km receive cash purses, trophies, and commemorative jerseys. Felicitation ceremony commences at 11:30 AM at SAF Ground amphitheater.`,
  },
];

module.exports = {
  KNOWLEDGE_CHUNKS,
};
