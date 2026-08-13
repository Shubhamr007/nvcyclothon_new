from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload
from ..core.security import require_admin
from ..db import get_db
from ..models import Customer, Order, OrderItem, Product
from ..schemas import OrderCreate, OrderRead
from ..core.rate_limit import limit_order

router = APIRouter(prefix="/api/orders", tags=["orders"])


@router.post("", response_model=OrderRead, status_code=status.HTTP_201_CREATED, dependencies=[Depends(limit_order)])
def create_order(payload: OrderCreate, db: Session = Depends(get_db)):
    product_ids = [line.product_id for line in payload.items]
    if len(product_ids) != len(set(product_ids)):
        raise HTTPException(status_code=400, detail="Each product may appear only once in an order")
    # Lock stock rows for the complete transaction. Prices and inventory are
    # always taken from the database, never from a browser request.
    products = {product.id: product for product in db.scalars(select(Product).where(Product.id.in_(product_ids)).with_for_update()).all()}
    if len(products) != len(product_ids):
        raise HTTPException(status_code=404, detail="One or more products no longer exist")
    for line in payload.items:
        if products[line.product_id].inventory < line.quantity:
            raise HTTPException(status_code=409, detail=f"Insufficient stock for {products[line.product_id].name}")
    customer = db.scalar(select(Customer).where(Customer.email == payload.email.lower()))
    if not customer:
        customer = Customer(email=payload.email.lower(), name=payload.customer_name, phone=payload.phone)
        db.add(customer)
        db.flush()
    else:
        customer.name, customer.phone = payload.customer_name, payload.phone
    total = sum(products[line.product_id].price_paise * line.quantity for line in payload.items)
    order = Order(customer=customer, total_paise=total, shipping_address=payload.shipping_address)
    db.add(order)
    for line in payload.items:
        product = products[line.product_id]
        product.inventory -= line.quantity
        order.items.append(OrderItem(product=product, quantity=line.quantity, unit_price_paise=product.price_paise))
    db.commit()
    db.refresh(order)
    return order


@router.get("", response_model=list[OrderRead], dependencies=[Depends(require_admin)])
def list_orders(db: Session = Depends(get_db)):
    return db.scalars(select(Order).options(selectinload(Order.items)).order_by(Order.id.desc())).all()
