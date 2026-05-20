from contextlib import asynccontextmanager
from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from backend.database import engine, Base, get_db, Menu, Order, OrderItem
from backend.schemas import OrderCreate, OrderResponse, MenuItemResponse, OrderStatusUpdate
from backend.seed import seed_menu
from typing import List

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Ensure tables exist
    Base.metadata.create_all(bind=engine)
    # Seed default menu items
    seed_menu()
    yield

app = FastAPI(
    title="QR Restaurant Ordering System API",
    version="1.0.0",
    lifespan=lifespan
)

# Enable CORS for frontend flexibility
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# API Endpoints

@app.get("/api/menu", response_model=List[MenuItemResponse])
def get_menu(db: Session = Depends(get_db)):
    """Fetch all available menu items."""
    try:
        return db.query(Menu).all()
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching menu: {str(e)}"
        )


@app.post("/api/orders", response_model=OrderResponse, status_code=status.HTTP_201_CREATED)
def create_order(order_data: OrderCreate, db: Session = Depends(get_db)):
    """Validate menu items, calculate order total, and save order to DB."""
    if not order_data.items:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Order must contain at least one item."
        )
    
    total_price = 0.0
    db_items = []
    
    for item in order_data.items:
        menu_item = db.query(Menu).filter(Menu.id == item.menu_id).first()
        if not menu_item:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Menu item with ID {item.menu_id} does not exist."
            )
        total_price += menu_item.price * item.quantity
        db_items.append(
            OrderItem(menu_id=item.menu_id, quantity=item.quantity)
        )
        
    db_order = Order(
        table_no=order_data.table_no,
        status="pending",
        total_price=round(total_price, 2),
        items=db_items
    )
    
    try:
        db.add(db_order)
        db.commit()
        db.refresh(db_order)
        return db_order
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to save order: {str(e)}"
        )


@app.get("/api/orders/pending", response_model=List[OrderResponse])
def get_pending_orders(db: Session = Depends(get_db)):
    """Fetch all active pending orders sorted by age (oldest first)."""
    try:
        return db.query(Order).filter(Order.status == "pending").order_by(Order.timestamp.asc()).all()
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching pending orders: {str(e)}"
        )


@app.get("/api/orders/{order_id}", response_model=OrderResponse)
def get_order_by_id(order_id: int, db: Session = Depends(get_db)):
    """Fetch details and status of a specific order."""
    db_order = db.query(Order).filter(Order.id == order_id).first()
    if not db_order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Order with ID {order_id} not found."
        )
    return db_order


@app.put("/api/orders/{id}", response_model=OrderResponse)
def update_order_status(id: int, status_update: OrderStatusUpdate, db: Session = Depends(get_db)):
    """Update status of a specific order (e.g. pending -> cooking -> delivered)."""
    db_order = db.query(Order).filter(Order.id == id).first()
    if not db_order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Order with ID {id} not found."
        )
    
    # Simple validation on status value
    allowed_statuses = ["pending", "cooking", "delivered", "cancelled"]
    if status_update.status not in allowed_statuses:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid status. Must be one of: {', '.join(allowed_statuses)}"
        )
        
    db_order.status = status_update.status
    try:
        db.commit()
        db.refresh(db_order)
        return db_order
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update order status: {str(e)}"
        )

# Frontend Routing

@app.get("/kitchen")
def serve_kitchen_dashboard():
    """Serve the kitchen dashboard html page at a clean URL route."""
    return FileResponse("frontend/kitchen.html")

# Serve the rest of static assets (JS, CSS, index.html at root '/')
# Must be mounted last to prevent hijacking API routes
app.mount("/", StaticFiles(directory="frontend", html=True), name="frontend")
