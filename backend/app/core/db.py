import os
import sqlite3
from typing import Any

# Load environment variables from .env file
BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
DB_NAME = os.path.join(BASE_DIR, "farm_data.db")

def get_db_connection():
    """
    Establishes a connection to the SQLite database.
    Returns a connection object.
    """
    try:
        conn = sqlite3.connect(DB_NAME)
        conn.row_factory = sqlite3.Row
        return conn
    except Exception as e:
        print(f"Database connection failed: {e}")
        raise e

def get_cursor(conn):
    """
    Returns a cursor. For SQLite, just conn.cursor().
    """
    return conn.cursor()
