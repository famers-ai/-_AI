
import os

# Database Configuration
BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Allow overriding DB path via environment variable (for persistence)
DB_PATH_ENV = os.getenv("DB_PATH")
if DB_PATH_ENV:
    DB_NAME = os.path.join(DB_PATH_ENV, "farm_data.db")
else:
    DB_NAME = os.path.join(BASE_DIR, "farm_data.db")

# Auth Configuration
DEFAULT_TEST_USER_ID = "test_user_001"
