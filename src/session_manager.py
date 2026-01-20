"""Session manager to handle user progress and database interactions."""

from datetime import datetime
from typing import Optional, List, Dict
from sqlalchemy import select, desc
from sqlalchemy.orm import Session as DBSession

from .database import User, QuizSession, WordAttempt, get_db_session
from .models.elo import EloRating


class SessionManager:
    """Manages user sessions and database persistence."""

    def __init__(self, username: str = "default_user"):
        self.username = username
        self.db: DBSession = get_db_session()
        self.user: Optional[User] = None
        self.current_session: Optional[QuizSession] = None
        
        self._load_or_create_user()

    def _load_or_create_user(self):
        """Load user from DB or create if new."""
        stmt = select(User).where(User.username == self.username)
        self.user = self.db.scalars(stmt).first()
        
        if not self.user:
            self.user = User(username=self.username)
            self.db.add(self.user)
            self.db.commit()
            print(f"Created new user: {self.username}")
        else:
            print(f"Loaded user: {self.username} (Rating: {self.user.current_rating:.0f})")

    def start_session(self):
        """Start a new learning session."""
        self.current_session = QuizSession(
            user=self.user,
            start_rating=self.user.current_rating
        )
        self.db.add(self.current_session)
        self.db.commit()

    def end_session(self):
        """End the current session."""
        if self.current_session:
            self.current_session.end_time = datetime.now()
            self.current_session.end_rating = self.user.current_rating
            self.db.commit()

    def record_attempt(self, word_data: Dict, is_correct: bool, time_taken_ms: int = 0):
        """
        Record a word attempt and update Elo rating.
        
        Args:
            word_data: Dictionary containing word info (word, difficulty)
            is_correct: Whether the answer was correct
            time_taken_ms: Time taken to answer in milliseconds
        """
        if not self.current_session:
            self.start_session()
            
        old_rating = self.user.current_rating
        
        elo = EloRating(k_factor=25)
        new_rating, _ = elo.update_ratings(
            old_rating, 
            word_data['difficulty'], 
            is_correct
        )
        
        # Update user stats
        self.user.current_rating = new_rating
        self.user.highest_rating = max(self.user.highest_rating, new_rating)
        self.user.questions_answered += 1
        
        # Update session stats
        self.current_session.words_attempted += 1
        
        # Record attempt
        attempt = WordAttempt(
            user=self.user,
            session=self.current_session,
            word=word_data['word'],
            word_difficulty=word_data['difficulty'],
            is_correct=is_correct,
            time_taken_ms=time_taken_ms,
            user_rating_before=old_rating,
            user_rating_after=new_rating
        )
        self.db.add(attempt)
        self.db.commit()
        
        return new_rating

    def get_recent_history(self, limit: int = 10) -> List[WordAttempt]:
        """Get recent attempts for context."""
        stmt = (
            select(WordAttempt)
            .where(WordAttempt.user_id == self.user.id)
            .order_by(desc(WordAttempt.timestamp))
            .limit(limit)
        )
        return list(self.db.scalars(stmt))

    def get_user_stats(self) -> Dict:
        """Get summary stats for the user."""
        return {
            "rating": self.user.current_rating,
            "highest": self.user.highest_rating,
            "total_questions": self.user.questions_answered,
            "sessions": len(self.user.sessions)
        }
