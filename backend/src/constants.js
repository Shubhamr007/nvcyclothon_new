const EVENT_DATE = new Date("2026-10-18T00:00:00.000Z");
const LAST_WEEK_START = new Date(EVENT_DATE);
LAST_WEEK_START.setUTCDate(LAST_WEEK_START.getUTCDate() - 7);

const EARLY_BIRD_LIMIT = 50;

const RACE_CATEGORIES = {
  "60 Km Road Challenge": {
    capacity: 100,
    early_bird: 89_900,
    regular: 109_900,
    last_week: 129_900,
  },
  "30 Km MTB Challenge": {
    capacity: 150,
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

module.exports = {
  EVENT_DATE,
  LAST_WEEK_START,
  EARLY_BIRD_LIMIT,
  RACE_CATEGORIES,
  CATALOGUE,
  REGISTRATION_STATUSES,
  DELEGATION_STATUSES,
};
