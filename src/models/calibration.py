"""User calibration for cold start problem."""

from typing import List


class BinarySearchCalibration:
    """
    Binary search approach to quickly find user's vocabulary level.
    Converges in 5-8 questions.
    """
    
    def __init__(self, difficulty_levels: List[float] = None):
        """
        Initialize calibration.
        
        Args:
            difficulty_levels: List of difficulty ratings to test
        """
        if difficulty_levels is None:
            # Default: 5 levels from beginner to expert
            self.difficulty_levels = [1000, 1150, 1300, 1450, 1600]
        else:
            self.difficulty_levels = difficulty_levels
        
        self.current_idx = len(self.difficulty_levels) // 2  # Start at medium
        self.consecutive_correct = 0
        self.consecutive_wrong = 0
        self.calibration_complete = False
        self.question_count = 0
    
    def get_calibration_difficulty(self) -> float:
        """
        Get difficulty rating for next calibration question.
        
        Returns:
            Difficulty rating to test
        """
        return self.difficulty_levels[self.current_idx]
    
    def update(self, correct: bool) -> None:
        """
        Update calibration state after user response.
        
        Args:
            correct: Whether user answered correctly
        """
        self.question_count += 1
        
        if correct:
            self.consecutive_correct += 1
            self.consecutive_wrong = 0
            
            # 2 correct in a row → move up difficulty
            if self.consecutive_correct >= 2 and self.current_idx < len(self.difficulty_levels) - 1:
                self.current_idx += 1
                self.consecutive_correct = 0
        else:
            self.consecutive_wrong += 1
            self.consecutive_correct = 0
            
            # 2 wrong in a row → move down difficulty
            if self.consecutive_wrong >= 2 and self.current_idx > 0:
                self.current_idx -= 1
                self.consecutive_wrong = 0
        
        # Check if calibration is complete
        # Converged: 3+ consecutive at same level OR 8+ questions
        if (self.consecutive_correct >= 3 or 
            self.consecutive_wrong >= 3 or 
            self.question_count >= 8):
            self.calibration_complete = True
    
    def is_complete(self) -> bool:
        """Check if calibration is complete."""
        return self.calibration_complete
    
    def get_initial_rating(self) -> float:
        """
        Get estimated initial rating after calibration.
        
        Returns:
            Estimated user rating
        """
        return self.difficulty_levels[self.current_idx]
    
    def get_confidence(self) -> str:
        """
        Get confidence level of calibration.
        
        Returns:
            Confidence level string
        """
        if self.question_count < 5:
            return "low"
        elif self.consecutive_correct >= 3 or self.consecutive_wrong >= 3:
            return "high"
        else:
            return "medium"
