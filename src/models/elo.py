"""Elo rating system implementation for vocabulary learning."""

import math
from typing import Tuple


class EloRating:
    """
    Elo rating system for adaptive vocabulary learning.
    
    Based on research from:
    - Math Garden (educational platform)
    - Tilburg University (2025) - Dynamic K-factor
    """
    
    def __init__(self, k_factor: float = 25, beta: float = 200):
        """
        Initialize Elo rating system.
        
        Args:
            k_factor: Rating change magnitude (default: 25 for education)
            beta: Rating disparity parameter (default: 200)
        """
        self.k_factor = k_factor
        self.beta = beta
    
    def expected_score(self, user_rating: float, word_difficulty: float) -> float:
        """
        Calculate probability that user will answer correctly.
        
        Args:
            user_rating: Current user Elo rating
            word_difficulty: Word difficulty rating
            
        Returns:
            Probability between 0 and 1
        """
        diff = word_difficulty - user_rating
        return 1.0 / (1 + 10 ** (diff / (2 * self.beta)))
    
    def update_ratings(
        self,
        user_rating: float,
        word_difficulty: float,
        correct: bool
    ) -> Tuple[float, float]:
        """
        Update both user and word ratings after a quiz response.
        
        Args:
            user_rating: Current user rating
            word_difficulty: Current word difficulty
            correct: Whether user answered correctly
            
        Returns:
            Tuple of (new_user_rating, new_word_difficulty)
        """
        expected = self.expected_score(user_rating, word_difficulty)
        actual = 1.0 if correct else 0.0
        
        # Update user rating
        new_user_rating = user_rating + self.k_factor * (actual - expected)
        
        # Update word difficulty (inverse - if user got it right, word might be easier)
        new_word_difficulty = word_difficulty - self.k_factor * (actual - expected)
        
        return new_user_rating, new_word_difficulty
    
    def information_value(self, user_rating: float, word_difficulty: float) -> float:
        """
        Calculate information value of testing this word.
        Maximum at p=0.5 (most uncertainty).
        
        Args:
            user_rating: Current user rating
            word_difficulty: Word difficulty rating
            
        Returns:
            Information value (entropy)
        """
        p = self.expected_score(user_rating, word_difficulty)
        
        # Handle edge cases
        if p == 0 or p == 1:
            return 0.0
        
        # Shannon entropy
        return -p * math.log2(p) - (1 - p) * math.log2(1 - p)


class DynamicKFactorElo(EloRating):
    """
    Elo with dynamic K-factor for faster convergence.
    
    Based on Tilburg University (2025) research showing 30-40% improvement.
    """
    
    def __init__(
        self,
        k_base: float = 20,
        k_min: float = 10,
        k_max: float = 40,
        window: int = 5,
        beta: float = 200
    ):
        """
        Initialize dynamic K-factor Elo.
        
        Args:
            k_base: Base K-factor
            k_min: Minimum K-factor (stable)
            k_max: Maximum K-factor (rapid adaptation)
            window: Number of recent ratings to analyze for trend
            beta: Rating disparity parameter
        """
        super().__init__(k_factor=k_base, beta=beta)
        self.k_base = k_base
        self.k_min = k_min
        self.k_max = k_max
        self.window = window
        self.rating_history = []
    
    def get_k_factor(self) -> float:
        """
        Calculate dynamic K-factor based on rating trend.
        
        Returns:
            Adjusted K-factor
        """
        if len(self.rating_history) < self.window:
            return self.k_base
        
        # Calculate trend using exponential smoothing
        recent = self.rating_history[-self.window:]
        trend = sum(recent[i+1] - recent[i] for i in range(len(recent)-1))
        
        # Increase K if consistent trend detected
        if abs(trend) > self.window * 5:  # Threshold
            return self.k_max
        else:
            return self.k_min
    
    def update_ratings(
        self,
        user_rating: float,
        word_difficulty: float,
        correct: bool
    ) -> Tuple[float, float]:
        """Update ratings with dynamic K-factor."""
        self.rating_history.append(user_rating)
        self.k_factor = self.get_k_factor()
        
        return super().update_ratings(user_rating, word_difficulty, correct)
