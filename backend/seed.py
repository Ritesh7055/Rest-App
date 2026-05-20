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
                    name="Burger",
                    price=180,
                    category="Fast-Food",
                    description=" a popular and universally loved sandwich consisting of a cooked patty—traditionally made of seasoned ground beef—placed inside a sliced, often toasted bun"
                ),
                Menu(
                    name="Classic Margherita Pizza",
                    price=150,
                    category="Mains",
                    description="an iconic Italian dish featuring a flat base of leavened wheat dough topped with a vibrant tomato sauce, melted cheese, and a sprinkle of herbs."
                ),
                Menu(
                    name="French Fries",
                    price=110,
                    category="Fast Food",
                    description="Crisp hand-cut fries tossed in white truffle oil, grated parmesan cheese, and fresh parsley. Served with garlic dip."
                ),
                Menu(
                    name="Pasta",
                    price=120,
                    category="Starters",
                    description="a classic culinary staple made from an unleavened dough of wheat flour (usually durum semolina) and water"
                ),
                Menu(
                    name="ICE CREAM",
                    price=90,
                    category="Desserts",
                    description="a sweet, cold frozen dessert made from dairy products like milk and cream, blended with sugar and flavorings"
                ),
                Menu(
                    name="Cold Coffee",
                    price=70,
                    category="Drinks",
                    description="a refreshing, caffeinated beverage blending rich coffee flavor with chilled milk, sugar, and ice"
                ),
                Menu(
                    name="Lassi",
                    price=50,
                    category="Drinks",
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
