from sqlalchemy import select
from .db import SessionLocal
from .models import Product

CATALOGUE = [
    {"slug": "golden-turmeric", "name": "Golden Turmeric", "origin": "Salem, Tamil Nadu", "price_paise": 24900, "inventory": 50},
    {"slug": "byadgi-chilli", "name": "Byadgi Chilli", "origin": "Karnataka", "price_paise": 29900, "inventory": 50},
    {"slug": "green-cardamom", "name": "Green Cardamom", "origin": "Idukki, Kerala", "price_paise": 44900, "inventory": 30},
]


def seed_catalogue():
    with SessionLocal() as db:
        existing_slugs = set(db.scalars(select(Product.slug)).all())
        missing = [Product(**product) for product in CATALOGUE if product["slug"] not in existing_slugs]
        if missing:
            db.add_all(missing)
            db.commit()
