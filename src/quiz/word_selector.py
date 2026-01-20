"""Word selector for quiz questions."""

import random
import math
from typing import List, Dict, Optional, Set

from ..models.elo import EloRating
from ..config import EXPLORATION_RATE, RATING_TOLERANCE, RECENT_WORDS_WINDOW


class WordSelector:
    """Select words for quiz based on user rating."""
    
    def __init__(self, words: List[Dict], elo: EloRating = None):
        """
        Initialize word selector.
        
        Args:
            words: List of word dicts with 'word', 'difficulty', etc.
            elo: EloRating instance for calculations
        """
        self.words = words
        self.elo = elo or EloRating()
        self.recent_words: List[str] = []
        
        # Index words by difficulty bands for faster lookup
        self._index_by_difficulty()
    
    def _index_by_difficulty(self):
        """Create difficulty band index."""
        self.difficulty_bands = {
            'easy': [],      # <1200
            'medium': [],    # 1200-1400
            'hard': [],      # 1400-1600
            'expert': []     # 1600+
        }
        
        for word in self.words:
            d = word.get('difficulty', 1200)
            if d < 1200:
                self.difficulty_bands['easy'].append(word)
            elif d < 1400:
                self.difficulty_bands['medium'].append(word)
            elif d < 1600:
                self.difficulty_bands['hard'].append(word)
            else:
                self.difficulty_bands['expert'].append(word)
    
    def select(self, user_rating: float, exclude: Set[str] = None) -> Optional[Dict]:
        """
        Select next word for quiz.
        
        Args:
            user_rating: Current user rating
            exclude: Set of word strings to exclude
            
        Returns:
            Word dictionary or None if no suitable word
        """
        exclude = exclude or set()
        exclude.update(self.recent_words[-RECENT_WORDS_WINDOW:])
        
        # Exploration: random word (10% of time)
        if random.random() < EXPLORATION_RATE:
            candidates = [w for w in self.words if w['word'] not in exclude]
            if candidates:
                selected = random.choice(candidates)
                self._track_recent(selected['word'])
                return selected
        
        # Exploitation: find words near user's rating
        candidates = [
            w for w in self.words
            if abs(w['difficulty'] - user_rating) <= RATING_TOLERANCE
            and w['word'] not in exclude
        ]
        
        # Fallback: widen search
        if not candidates:
            candidates = [
                w for w in self.words
                if abs(w['difficulty'] - user_rating) <= RATING_TOLERANCE * 2
                and w['word'] not in exclude
            ]
        
        if not candidates:
            candidates = [w for w in self.words if w['word'] not in exclude]
        
        if not candidates:
            return None
        
        # Select word with highest information value
        best = max(candidates, key=lambda w: self.elo.information_value(user_rating, w['difficulty']))
        self._track_recent(best['word'])
        return best
    
    def select_for_calibration(self, target_difficulty: float) -> Optional[Dict]:
        """
        Select word at specific difficulty for calibration.
        
        Args:
            target_difficulty: Target difficulty rating
            
        Returns:
            Word dictionary
        """
        # Find closest word to target difficulty
        candidates = [
            w for w in self.words
            if w['word'] not in self.recent_words
        ]
        
        if not candidates:
            candidates = self.words
        
        best = min(candidates, key=lambda w: abs(w['difficulty'] - target_difficulty))
        self._track_recent(best['word'])
        return best
    
    def _track_recent(self, word: str):
        """Track recently shown words."""
        self.recent_words.append(word)
        if len(self.recent_words) > RECENT_WORDS_WINDOW * 2:
            self.recent_words = self.recent_words[-RECENT_WORDS_WINDOW:]
