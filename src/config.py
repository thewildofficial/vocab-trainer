"""Configuration management for vocab-trainer."""

import os
from pathlib import Path

try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass  # dotenv is optional

# Project root
PROJECT_ROOT = Path(__file__).parent.parent

# Data paths
RAW_DATA_PATH = PROJECT_ROOT / os.getenv("RAW_DATA_PATH", "data/raw/topwords")
PROCESSED_DATA_PATH = PROJECT_ROOT / os.getenv("PROCESSED_DATA_PATH", "data/processed")
CACHE_PATH = PROJECT_ROOT / os.getenv("CACHE_PATH", "data/cache")

# Ensure directories exist
PROCESSED_DATA_PATH.mkdir(parents=True, exist_ok=True)
CACHE_PATH.mkdir(parents=True, exist_ok=True)

# Database
DATABASE_URL = os.getenv("DATABASE_URL", f"sqlite:///{PROJECT_ROOT}/data/vocab_trainer.db")

# Preprocessing settings
MAX_FREQUENCY_RANK = int(os.getenv("MAX_FREQUENCY_RANK", "50000"))
MIN_WORD_LENGTH = int(os.getenv("MIN_WORD_LENGTH", "3"))
FILTER_STOPWORDS = os.getenv("FILTER_STOPWORDS", "true").lower() == "true"
USE_LEMMATIZATION = os.getenv("USE_LEMMATIZATION", "true").lower() == "true"

# Model parameters
INITIAL_USER_RATING = float(os.getenv("INITIAL_USER_RATING", "1200"))
INITIAL_K_FACTOR = float(os.getenv("INITIAL_K_FACTOR", "25"))
ELO_BETA = float(os.getenv("ELO_BETA", "200"))

# Word selection
EXPLORATION_RATE = float(os.getenv("EXPLORATION_RATE", "0.1"))
RATING_TOLERANCE = float(os.getenv("RATING_TOLERANCE", "100"))
RECENT_WORDS_WINDOW = int(os.getenv("RECENT_WORDS_WINDOW", "10"))

# NLTK data path
NLTK_DATA_PATH = PROJECT_ROOT / "nltk_data"
NLTK_DATA_PATH.mkdir(parents=True, exist_ok=True)

# Set NLTK path before any NLTK imports
import nltk
nltk.data.path.insert(0, str(NLTK_DATA_PATH))
