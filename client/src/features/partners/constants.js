export const EVENT_DETAILS = {
  name: "NV Cyclothon — 3rd Edition",
  edition: "3rd Edition",
  date: "22 November 2026",
  location: "Rewa, Madhya Pradesh",
  expectedRiders: "500+",
  categoriesCount: 4,
  districtsCount: 5,
  districts: ["Rewa", "Satna", "Sidhi", "Singrauli", "Shahdol"],
  categories: [
    { name: "60 KM — Road Bike Challenge", desc: "Competitive road race for serious endurance cyclists." },
    { name: "30 KM — MTB Bike Challenge", desc: "Off-road mountain bike challenge." },
    { name: "10 KM — Green, Fun & Family Ride", desc: "Inclusive ride for families, first-time riders and everyday fitness riders." },
    { name: "2.5 KM — Kid-o-Thon", desc: "Youth-oriented ride/talent-discovery category." },
  ],
  causes: [
    "Fitness for All",
    "Road Safety",
    "Save Environment",
    "Women Empowerment",
    "Healthy Community",
  ],
};

export const CONTACT_INFO = {
  lead: "Aman Mishra",
  designation: "Joint Secretary, RDCA and India Book of Record holder (2024)",
  phone: "+91 88395 03099",
  email: "nvcyclothon@gmail.com",
  socialHandle: "@nvcyclothon",
};

export const SPONSORSHIP_PACKAGES = [
  {
    id: 1,
    name: "Title Sponsor",
    tagline: "Premier Brand Alignment Across the Entire Event",
    price: "₹5,00,000",
    amountPaise: 50000000,
    availability: "1 Available",
    isExclusive: true,
    isTitle: true,
    complimentaryEntries: 10,
    benefits: [
      "Largest logo on front jersey (30cm x 12cm)",
      "Prominent branding on Start/Finish arch",
      "Logo on Bib Numbers worn by all riders",
      "All branding / top position across collaterals",
      "Website top position & digital channels",
      "Logo on press conference backdrop",
      "10 complimentary entries",
    ],
  },
  {
    id: 2,
    name: "Powered By Sponsor",
    tagline: "Co-Branding Dominance & Stage Visibility",
    price: "₹2,50,000",
    amountPaise: 25000000,
    availability: "2 Available",
    complimentaryEntries: 5,
    benefits: [
      "Large logo on back jersey (25cm x 10cm)",
      "Website — 2nd position branding",
      "Stage backdrop branding",
      "Logo on all event collaterals",
      "5 complimentary entries",
    ],
  },
  {
    id: 3,
    name: "Associate Sponsor",
    tagline: "High-Impact Jersey & Route Signage Presence",
    price: "₹1,00,000",
    amountPaise: 10000000,
    availability: "4–6 Available",
    complimentaryEntries: 3,
    benefits: [
      "Logo on jersey sleeves",
      "Branding on banners & route signage",
      "Logo on official website",
      "3 complimentary entries",
    ],
  },
  {
    id: 4,
    name: "Supporting Partner",
    tagline: "Targeted Regional Visibility",
    price: "₹50,000",
    amountPaise: 5000000,
    availability: "Multiple",
    complimentaryEntries: 2,
    benefits: [
      "Logo on event signage",
      "Logo on official website",
      "2 complimentary entries",
    ],
  },
  {
    id: 5,
    name: "Hydration / Medical Partner",
    tagline: "Essential Support & Athlete Well-being Branding",
    price: "₹50,000",
    amountPaise: 5000000,
    availability: "Category Exclusive",
    isCategoryExclusive: true,
    benefits: [
      "Logo at water stations",
      "Medical booth branding",
      "Ambulance branding",
    ],
  },
  {
    id: 6,
    name: "Media Partner",
    tagline: "Broadcast & Regional Media Rights",
    price: "In-Kind",
    amountPaise: 0,
    availability: "Exclusive",
    isExclusive: true,
    benefits: [
      "Exclusive media rights",
      "Logo on all media backdrops",
    ],
  },
];

export const WHY_PARTNER_CARDS = [
  {
    number: "01",
    title: "CREDIBLE FOUNDER STORY",
    subtitle: "Proven leadership and recognized achievement",
    description:
      "NV Cyclothon is led by Aman Mishra, Joint Secretary, RDCA and India Book of Record holder (2024).",
    icon: "award",
  },
  {
    number: "02",
    title: "ENGAGED, GROWING AUDIENCE",
    subtitle: "Direct engagement with diverse demographics",
    description:
      "500+ expected riders across four categories, including serious riders, families and children.",
    icon: "users",
  },
  {
    number: "03",
    title: "REGIONAL REACH",
    subtitle: "A unifying sports platform across 5 districts",
    description:
      "One event connecting: Rewa, Satna, Sidhi, Singrauli, and Shahdol.",
    icon: "map-pin",
  },
  {
    number: "04",
    title: "PURPOSE-LED POSITIONING",
    subtitle: "Aligned with values that resonate locally",
    description:
      "Association with: Fitness for All, Road Safety, Save Environment, Women Empowerment, and Healthy Community.",
    icon: "shield-check",
  },
  {
    number: "05",
    title: "MULTI-TOUCHPOINT BRANDING",
    subtitle: "Omnichannel physical and digital recall",
    description:
      "Brand visibility can extend across: Jerseys, Bibs, Medals, Bags, Lanyards, Signage, and Digital channels.",
    icon: "sparkles",
  },
  {
    number: "06",
    title: "LONG-TERM PLATFORM",
    subtitle: "Established legacy and community goodwill",
    description:
      "NV Cyclothon is entering its 3rd edition, creating lasting partnerships that grow year after year.",
    icon: "trending-up",
  },
];

export const BRAND_VISIBILITY_ITEMS = [
  {
    id: "jersey",
    name: "OFFICIAL JERSEY",
    category: "Rider Apparel",
    placement: "Front chest, back panel & sleeves",
    description: "High-visibility technical riding apparel worn during the event and in post-event training rides across the region.",
  },
  {
    id: "bib",
    name: "EVENT BIB",
    category: "Race Identity",
    placement: "Front bib number worn by all 500+ riders",
    description: "Numbered race bibs featuring partner logos in all race photography, finish-line captures, and media archives.",
  },
  {
    id: "medal",
    name: "FINISHER MEDAL",
    category: "Keepsake",
    placement: "Custom engraved medal ribbon and medallion",
    description: "Permanent collectible awarded to every finisher, preserved and proudly showcased by participants.",
  },
  {
    id: "water_bottle",
    name: "WATER BOTTLE",
    category: "Merchandise",
    placement: "Official commemorative cycling sipper",
    description: "Eco-friendly reusable sports bottle included in rider kit for everyday hydration.",
  },
  {
    id: "wrist_band",
    name: "WRIST BAND",
    category: "Access & Security",
    placement: "Participant wristband verification",
    description: "Color-coded entry wristbands worn by all participants and support crew throughout the race day.",
  },
  {
    id: "stickers",
    name: "STICKERS",
    category: "Branding Kit",
    placement: "Bicycle frame and helmet decal sheets",
    description: "Weatherproof stickers applied to bikes, cars, and accessories for extended brand visibility.",
  },
  {
    id: "certificate",
    name: "E-CERTIFICATE",
    category: "Digital Credential",
    placement: "Verified digital certificate with timing and QR verification",
    description: "Downloadable and shareable digital certificate sent to all verified participants with partner branding.",
  },
  {
    id: "stage",
    name: "STAGE BACKDROP",
    category: "Event Venue",
    placement: "Main ceremony and podium backdrop",
    description: "Centerpiece visual branding for flag-off, winner felicitations, dignitary speeches, and press photos.",
  },
  {
    id: "signage",
    name: "ROUTE SIGNAGE",
    category: "Race Course",
    placement: "Start/finish arch, kilometer markers, route boards",
    description: "Course signage across Rewa landmarks and race turn-arounds guiding riders and spectators.",
  },
  {
    id: "lanyard",
    name: "EVENT LANYARD / ID",
    category: "Crew & VIP",
    placement: "Official race pass lanyard",
    description: "Worn by chief guests, organizers, race marshals, media personnel, and VIP delegates.",
  },
  {
    id: "kit_bag",
    name: "DRAWSTRING KIT BAG",
    category: "Rider Kit",
    placement: "Official race kit bag handed at registration check-in",
    description: "Durable branded sports sack holding all event materials, reused by athletes for future rides.",
  },
  {
    id: "digital",
    name: "WEBSITE / DIGITAL CHANNELS",
    category: "Digital Reach",
    placement: "Official website, registration portal, and social platforms",
    description: "Ongoing brand representation on the NV Cyclothon digital portal and @nvcyclothon community channels.",
  },
];

export const COMPARISON_FEATURES = [
  { key: "jersey", label: "Jersey Branding" },
  { key: "arch", label: "Start/Finish Arch" },
  { key: "bib", label: "Bib Branding" },
  { key: "website", label: "Website Position" },
  { key: "stage", label: "Stage Backdrop" },
  { key: "signage", label: "Event Signage" },
  { key: "entries", label: "Complimentary Entries" },
];

export const COMPARISON_MATRIX = [
  {
    packageName: "Title Sponsor",
    price: "₹5,00,000",
    features: {
      jersey: "Largest logo on front (30cm x 12cm)",
      arch: "Prominent arch branding",
      bib: "Logo on all rider bibs",
      website: "Top position",
      stage: "Top branding + Press backdrop",
      signage: "All event branding / top position",
      entries: "10 Entries",
    },
  },
  {
    packageName: "Powered By Sponsor",
    price: "₹2,50,000",
    features: {
      jersey: "Large logo on back (25cm x 10cm)",
      arch: "Included in collaterals",
      bib: "Collateral inclusion",
      website: "2nd position",
      stage: "Stage backdrop branding",
      signage: "All event collaterals",
      entries: "5 Entries",
    },
  },
  {
    packageName: "Associate Sponsor",
    price: "₹1,00,000",
    features: {
      jersey: "Logo on jersey sleeves",
      arch: "—",
      bib: "—",
      website: "Standard listing",
      stage: "—",
      signage: "Banners & route signage",
      entries: "3 Entries",
    },
  },
  {
    packageName: "Supporting Partner",
    price: "₹50,000",
    features: {
      jersey: "—",
      arch: "—",
      bib: "—",
      website: "Partner listing",
      stage: "—",
      signage: "Event signage",
      entries: "2 Entries",
    },
  },
];

export const PARTNERSHIP_TYPES = [
  "Cash Sponsorship",
  "Product / In-Kind",
  "Cash + Product",
  "Media Partnership",
  "Service Partnership",
  "Custom Partnership",
];

export const ACTIVATION_OPTIONS = [
  "Product Sampling",
  "Brand Booth",
  "Contest / Giveaway",
  "Fitness Challenge",
  "Cycling Challenge",
  "Customer Engagement",
  "Product Demonstration",
  "Social Media Campaign",
  "Custom Activation",
];

export const VISIBILITY_OPTIONS = [
  "Jersey",
  "Bib",
  "Start / Finish Arch",
  "Stage Backdrop",
  "Route Signage",
  "Water Station",
  "Medical Zone",
  "Kit Bag",
  "Lanyard / ID",
  "Digital Website",
  "Social Media",
  "Event Collateral",
  "Custom Activation",
];
