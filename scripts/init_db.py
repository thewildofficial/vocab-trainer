"""Initialize the SQLite database."""

import sys
from pathlib import Path

# Add project root to path
project_root = Path(__file__).parent.parent
sys.path.append(str(project_root))

from src.database import init_db
from src.config import DATABASE_URL

def main():
    print(f"Initializing database at: {DATABASE_URL}")
    try:
        init_db()
        print("✅ Database tables created successfully.")
    except Exception as e:
        print(f"❌ Error creating database: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
