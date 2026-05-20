from backend.database import SessionLocal, Base, engine, Menu

def seed_menu():
    # Create tables if they don't exist
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    try:
        # Check if database is empty
        if db.query(Menu).count() == 0:
            starter_items = [
                Menu(
                    name="Gourmet Wagyu Burger",
                    price=16.99,
                    category="Mains",
                    description="Premium Wagyu beef patty, sharp cheddar, caramelized onions, truffle aioli on a toasted brioche bun. Served with rustic fries."
                ),
                Menu(
                    name="Classic Margherita Pizza",
                    price=13.49,
                    category="Mains",
                    description="Fresh mozzarella, heirloom cherry tomatoes, sweet basil, and extra virgin olive oil on a charred sourdough crust."
                ),
                Menu(
                    name="Truffle Parmesan Fries",
                    price=7.99,
                    category="Starters",
                    description="Crisp hand-cut fries tossed in white truffle oil, grated parmesan cheese, and fresh parsley. Served with garlic dip."
                ),
                Menu(
                    name="Crispy Calamari",
                    price=11.99,
                    category="Starters",
                    description="Lightly battered squid ring, seasoned with sea salt and cracked black pepper, served with a spicy citrus remoulade."
                ),
                Menu(
                    name="Signature Iced Matcha Latte",
                    price=5.49,
                    category="Drinks",
                    description="Ceremonial grade Japanese Uji matcha whisked with organic honey and creamy oat milk over ice."
                ),
                Menu(
                    name="Chocolate Lava Soufflé",
                    price=8.99,
                    category="Desserts",
                    description="Decadent dark chocolate cake with a molten warm chocolate center, served with a scoop of Tahitian vanilla bean gelato."
                )
            ]
            db.add_all(starter_items)
            db.commit()
            print("Successfully seeded 6 starter menu items into the database!")
        else:
            print("Database already contains menu items. Skipping seeding.")
    except Exception as e:
        db.rollback()
        print(f"Error seeding database: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    seed_menu()
