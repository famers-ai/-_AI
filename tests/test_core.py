import unittest
import os
import sqlite3
import pandas as pd
from unittest.mock import patch

# Import modules to test
from src.utils import load_config
import src.db_handler as db


class TestConfig(unittest.TestCase):
    def test_load_config_exists(self):
        """Test that configuration can be loaded."""
        config = load_config()
        self.assertIsInstance(config, dict)
        self.assertIn("crop_options", config)
        self.assertIn("locations", config)


class TestDBHandler(unittest.TestCase):
    
    @classmethod
    def setUpClass(cls):
        """Set up a temporary database for testing."""
        cls.test_db = "test_farm_data.db"
        
    def setUp(self):
        """Run before each test: patch the DB_NAME in the module."""
        self.patcher = patch('src.db_handler.DB_NAME', self.test_db)
        self.mock_db_name = self.patcher.start()
        # Initialize the test DB
        db.init_db()

    def tearDown(self):
        """Run after each test: clean up."""
        self.patcher.stop()
        if os.path.exists(self.test_db):
            os.remove(self.test_db)

    def test_user_prefs(self):
        """Test setting and getting user preferences."""
        db.set_user_pref("test_key", "test_value")
        val = db.get_user_pref("test_key")
        self.assertEqual(val, "test_value")
        
        # Test default value
        val_none = db.get_user_pref("non_existent", "default")
        self.assertEqual(val_none, "default")

    def test_log_sensor_data(self):
        """Test logging sensor data."""
        weather = {"temperature": 75, "humidity": 50}
        sensor = {"soil_moisture": 60}
        
        db.log_sensor_data("Strawberries", weather, sensor)
        
        # Verify it was written
        conn = sqlite3.connect(self.test_db)
        df = pd.read_sql_query("SELECT * FROM sensor_logs", conn)
        conn.close()
        
        self.assertEqual(len(df), 1)
        self.assertEqual(df.iloc[0]['crop_type'], "Strawberries")
        self.assertEqual(df.iloc[0]['temperature'], 75)

    def test_training_data_stats(self):
        """Test saving labeled data and retrieving stats."""
        db.save_labeled_data("img_001", "Correct", "None")
        db.save_labeled_data("img_002", "Correct", "None")
        db.save_labeled_data("img_003", "Incorrect", "Rot")
        
        stats = db.get_training_data_stats()
        
        # stats should have 2 rows: Correct (2), Incorrect (1)
        correct_count = stats[stats['label'] == 'Correct']['count'].values[0]
        
        # Check incorrect count
        incorrect_query_result = stats[stats['label'] == 'Incorrect']
        incorrect_count = incorrect_query_result['count'].values[0]
        
        self.assertEqual(correct_count, 2)
        self.assertEqual(incorrect_count, 1)


if __name__ == '__main__':
    unittest.main()
