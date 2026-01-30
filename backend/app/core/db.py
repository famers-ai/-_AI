import os
import sqlite3
from typing import Any

# Load environment variables from .env file
from app.core.config import DB_NAME

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
