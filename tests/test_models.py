"""Tests for Elo rating model."""

import pytest
from src.models.elo import EloRating, DynamicKFactorElo
from src.models.calibration import BinarySearchCalibration


class TestEloRating:
    """Test basic Elo rating functionality."""
    
    def test_expected_score_equal_ratings(self):
        """Equal ratings should give 50% expected score."""
        elo = EloRating()
        score = elo.expected_score(1200, 1200)
        assert abs(score - 0.5) < 0.001
    
    def test_expected_score_higher_user(self):
        """Higher user rating should give > 50% expected score."""
        elo = EloRating()
        score = elo.expected_score(1400, 1200)
        assert score > 0.5
        assert score < 1.0
    
    def test_expected_score_lower_user(self):
        """Lower user rating should give < 50% expected score."""
        elo = EloRating()
        score = elo.expected_score(1000, 1200)
        assert score < 0.5
        assert score > 0.0
    
    def test_update_correct_increases_rating(self):
        """Correct answer should increase user rating."""
        elo = EloRating()
        old_rating = 1200
        new_user, new_word = elo.update_ratings(old_rating, 1200, correct=True)
        assert new_user > old_rating
    
    def test_update_wrong_decreases_rating(self):
        """Wrong answer should decrease user rating."""
        elo = EloRating()
        old_rating = 1200
        new_user, new_word = elo.update_ratings(old_rating, 1200, correct=False)
        assert new_user < old_rating
    
    def test_update_word_difficulty_inverse(self):
        """Word difficulty should move opposite to user rating."""
        elo = EloRating()
        old_word = 1200
        new_user, new_word = elo.update_ratings(1200, old_word, correct=True)
        assert new_word < old_word  # Word got "easier"
    
    def test_information_value_max_at_equal(self):
        """Information value should be maximum when ratings are equal."""
        elo = EloRating()
        equal_info = elo.information_value(1200, 1200)
        unequal_info = elo.information_value(1200, 1400)
        assert equal_info > unequal_info
    
    def test_information_value_symmetric(self):
        """Information value should be same for ±difference."""
        elo = EloRating()
        info_above = elo.information_value(1200, 1300)
        info_below = elo.information_value(1200, 1100)
        assert abs(info_above - info_below) < 0.001


class TestDynamicKFactorElo:
    """Test dynamic K-factor Elo."""
    
    def test_initial_k_factor(self):
        """Should use base K-factor initially."""
        elo = DynamicKFactorElo(k_base=20)
        assert elo.get_k_factor() == 20
    
    def test_k_factor_increases_on_trend(self):
        """K-factor should increase when consistent trend detected."""
        elo = DynamicKFactorElo(k_base=20, k_max=40, window=3)
        
        # Simulate consistent increase
        for rating in [1200, 1220, 1240, 1260, 1280]:
            elo.rating_history.append(rating)
        
        k = elo.get_k_factor()
        assert k == 40  # Should use max due to trend


class TestBinarySearchCalibration:
    """Test calibration system."""
    
    def test_starts_at_middle(self):
        """Should start at middle difficulty."""
        cal = BinarySearchCalibration([1000, 1200, 1400])
        assert cal.get_calibration_difficulty() == 1200
    
    def test_moves_up_on_correct(self):
        """Should move to harder after 2 correct."""
        cal = BinarySearchCalibration([1000, 1200, 1400])
        cal.update(correct=True)
        cal.update(correct=True)
        assert cal.get_calibration_difficulty() == 1400
    
    def test_moves_down_on_wrong(self):
        """Should move to easier after 2 wrong."""
        cal = BinarySearchCalibration([1000, 1200, 1400])
        cal.update(correct=False)
        cal.update(correct=False)
        assert cal.get_calibration_difficulty() == 1000
    
    def test_completes_after_consecutive(self):
        """Should complete after 3 consecutive at same level."""
        # Start at max level so it can't go higher
        cal = BinarySearchCalibration([1000, 1200, 1400])
        cal.current_idx = 2  # At max level
        cal.update(correct=True)
        cal.update(correct=True)
        cal.update(correct=True)
        assert cal.is_complete()
    
    def test_completes_after_max_questions(self):
        """Should complete after 8 questions."""
        cal = BinarySearchCalibration()
        for i in range(8):
            cal.update(correct=i % 2 == 0)  # Alternating
        assert cal.is_complete()
    
    def test_confidence_levels(self):
        """Confidence should be appropriate for question count."""
        cal = BinarySearchCalibration()
        
        # Low confidence early
        cal.update(correct=True)
        assert cal.get_confidence() == "low"
        
        # More questions, still medium if alternating
        cal.update(correct=False)
        cal.update(correct=True)
        cal.update(correct=False)
        cal.update(correct=True)
        assert cal.get_confidence() == "medium"


class TestConvergence:
    """Test that Elo converges correctly."""
    
    def test_convergence_simulation(self):
        """Simulate user with known ability and verify convergence."""
        elo = EloRating(k_factor=25)
        
        # Simulated user with "true" ability of 1400
        true_ability = 1400
        user_rating = 1200  # Start lower
        
        import random
        random.seed(42)
        
        for _ in range(50):
            # Pick a word near user's current rating
            word_difficulty = user_rating + random.uniform(-100, 100)
            
            # Simulate response based on true ability
            prob_correct = elo.expected_score(true_ability, word_difficulty)
            correct = random.random() < prob_correct
            
            user_rating, _ = elo.update_ratings(user_rating, word_difficulty, correct)
        
        # Should have converged close to true ability
        assert abs(user_rating - true_ability) < 100


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
