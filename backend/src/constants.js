const EVENT_DATE = new Date("2026-11-22T00:00:00.000Z");
const LAST_WEEK_START = new Date(EVENT_DATE);
LAST_WEEK_START.setUTCDate(LAST_WEEK_START.getUTCDate() - 7);

const EARLY_BIRD_LIMIT = 50;

const RACE_CATEGORIES = {
  "60 Km Road Challenge": {
    capacity: 100,
    min_age: 18,
    early_bird: 89_900,
    regular: 109_900,
    last_week: 129_900,
  },
  "30 Km MTB Challenge": {
    capacity: 150,
    min_age: 16,
    early_bird: 79_900,
    regular: 99_900,
    last_week: 119_900,
  },
  "10 Km Green Ride": {
    capacity: 200,
    early_bird: 39_900,
    regular: 49_900,
    last_week: 59_900,
  },
  "Kid-o-thon": {
    capacity: 50,
    min_age: 10,
    max_age: 13,
    early_bird: 29_900,
    regular: 29_900,
    last_week: 29_900,
  },
};

const CATALOGUE = [
  {
    slug: "golden-turmeric",
    name: "Golden Turmeric",
    origin: "Salem, Tamil Nadu",
    price_paise: 24_900,
    inventory: 50,
  },
  {
    slug: "byadgi-chilli",
    name: "Byadgi Chilli",
    origin: "Karnataka",
    price_paise: 29_900,
    inventory: 50,
  },
  {
    slug: "green-cardamom",
    name: "Green Cardamom",
    origin: "Idukki, Kerala",
    price_paise: 44_900,
    inventory: 30,
  },
];

const REGISTRATION_STATUSES = ["pending", "approved", "checked_in", "cancelled"];
const DELEGATION_STATUSES = ["invited", "confirmed", "declined", "attended"];

const DEFAULT_GALLERY_ITEMS = [
  {
    title: "Vindhya Sunrise Flag-Off",
    category: "Organizers",
    caption: "Official race directors and organizing committee flagging off the inaugural peloton at sunrise.",
    image_url: "https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=1200&q=80",
    display_order: 1,
    featured: true,
  },
  {
    title: "Road Challenge Lead Pack",
    category: "Riders",
    caption: "60 Km Road Challenge cyclists pushing the pace across the scenic Vindhya highway.",
    image_url: "https://images.unsplash.com/photo-1517649763962-0c623266ddc0?auto=format&fit=crop&w=1200&q=80",
    display_order: 2,
    featured: true,
  },
  {
    title: "Official Hydration & Energy Station",
    category: "Partners",
    caption: "Our hydration and nutrition partners ensuring riders stay refueled and energized throughout the route.",
    image_url: "https://images.unsplash.com/photo-1516726817505-f5ed825624d8?auto=format&fit=crop&w=1200&q=80",
    display_order: 3,
    featured: true,
  },
  {
    title: "Vindhya Mountain Trail Breakers",
    category: "Riders",
    caption: "30 Km MTB Challenge riders tackling the rugged terrain and rolling hills of Rewa.",
    image_url: "https://images.unsplash.com/photo-1474962558142-9ca83af74bb7?auto=format&fit=crop&w=1200&q=80",
    display_order: 4,
    featured: true,
  },
  {
    title: "Community Green Ride & Families",
    category: "Highlights",
    caption: "10 Km Green Ride bringing families, students, and citizens together for cleaner, greener streets.",
    image_url: "https://images.unsplash.com/photo-1502744688674-c619d1586c9e?auto=format&fit=crop&w=1200&q=80",
    display_order: 5,
    featured: true,
  },
  {
    title: "Partner Expo & Brand Zone",
    category: "Partners",
    caption: "Title sponsors and wellness partners engaging with cycling enthusiasts at the race village.",
    image_url: "https://images.unsplash.com/photo-1576435728678-68d0fbf94e91?auto=format&fit=crop&w=1200&q=80",
    display_order: 6,
    featured: true,
  },
  {
    title: "Finish Line Glory & Medal Ceremony",
    category: "Organizers",
    caption: "Organizing committee presenting custom finisher medals and celebrating rider achievements.",
    image_url: "https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=1200&q=80",
    display_order: 7,
    featured: true,
  },
  {
    title: "Rewa Cycling Marshals on Course",
    category: "Organizers",
    caption: "Safety marshals and emergency pilot teams keeping the circuit secure and seamless.",
    image_url: "https://images.unsplash.com/photo-1485965120184-e220f721d03e?auto=format&fit=crop&w=1200&q=80",
    display_order: 8,
    featured: true,
  },
];

const SITE_SECTIONS = [
  "experience",
  "editions",
  "about",
  "members",
  "routes",
  "updates",
  "gallery",
  "why_sport",
  "faq",
  "contact",
  "sponsors",
  "community",
];

module.exports = {
  EVENT_DATE,
  LAST_WEEK_START,
  EARLY_BIRD_LIMIT,
  RACE_CATEGORIES,
  CATALOGUE,
  REGISTRATION_STATUSES,
  DELEGATION_STATUSES,
  DEFAULT_GALLERY_ITEMS,
  SITE_SECTIONS,
};
