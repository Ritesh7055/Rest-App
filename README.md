# Gourmet QR Ordering System

A full-stack, QR-code based restaurant ordering system. Customers scan a table-specific QR code, browse a premium menu, add items to their cart, and place orders. Chefs monitor active orders in real-time from a Kitchen Display System (KDS) dashboard.

## Tech Stack
- **Backend**: FastAPI, SQLite, SQLAlchemy, Pydantic
- **Frontend**: Vanilla HTML5, CSS3 (variables, glassmorphism, responsive flex/grids), JavaScript ES6 (Web Audio API for live sound chime, URL query parsing)

---

## Setup & Running the Application

### 1. Install Dependencies
Make sure you have Python 3.8+ installed. In your terminal, run:
```bash
pip install -r requirements.txt
```

### 2. Start the Server
Run the FastAPI application with Uvicorn:
```bash
uvicorn backend.main:app --reload
```

This will:
- Automatically initialize the SQLite database (`restaurant.db`).
- Seed 6 gourmet menu items (e.g. Wagyu Burger, Margherita Pizza, Truffle Fries) if the database is empty.
- Serve the API endpoints and mount the static frontend.

---

## Viewing the System

### Customer Menu View
Open your browser and navigate to:
[http://127.0.0.1:8000/?table=5](http://127.0.0.1:8000/?table=5)
*(Change `?table=5` to any table number or omit it for takeaway mode).*

### Kitchen Display System (KDS) View
Open another browser tab/window and navigate to:
[http://127.0.0.1:8000/kitchen](http://127.0.0.1:8000/kitchen)

---

## API Endpoints Reference
- `GET /api/menu` - Fetch all menu items
- `POST /api/orders` - Place a new order
- `GET /api/orders/pending` - Fetch all active orders (status: pending)
- `PUT /api/orders/{id}` - Update order status (e.g. update to `delivered`)

python -m uvicorn backend.main:app  to update database