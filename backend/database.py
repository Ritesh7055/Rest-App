from sqlalchemy import create_engine, Column, Integer, String, Float, DateTime, ForeignKey
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship
import datetime

SQLALCHEMY_DATABASE_URL = "sqlite:///./restaurant.db"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

class Menu(Base):
    __tablename__ = "menu"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True, nullable=False)
    price = Column(Float, nullable=False)
    category = Column(String, nullable=False)
    description = Column(String, nullable=True)


class Order(Base):
    __tablename__ = "orders"
    
    id = Column(Integer, primary_key=True, index=True)
    table_no = Column(Integer, nullable=True)  # Can be nullable for takeaway
    status = Column(String, default="pending", nullable=False)
    total_price = Column(Float, nullable=False, default=0.0)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)
    
    items = relationship("OrderItem", back_populates="order", cascade="all, delete-orphan")


class OrderItem(Base):
    __tablename__ = "order_items"
    
    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id"), nullable=False)
    menu_id = Column(Integer, ForeignKey("menu.id"), nullable=False)
    quantity = Column(Integer, nullable=False)
    
    order = relationship("Order", back_populates="items")
    menu = relationship("Menu")


# Dependency to get db session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
