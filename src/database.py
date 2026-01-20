"""Database models and connection management."""

from datetime import datetime
from typing import List, Optional

from sqlalchemy import create_engine, Column, Integer, String, Float, DateTime, ForeignKey, Boolean
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship, Session
from sqlalchemy.sql import func

from .config import DATABASE_URL


class Base(DeclarativeBase):
    """Base class for SQLAlchemy models."""
    pass


class User(Base):
    """User profile and stats."""
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True)
    username: Mapped[str] = mapped_column(String(50), unique=True, index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    
    # Stats
    current_rating: Mapped[float] = mapped_column(Float, default=1200.0)
    highest_rating: Mapped[float] = mapped_column(Float, default=1200.0)
    volatility: Mapped[float] = mapped_column(Float, default=200.0)  # For Glicko/optimization
    questions_answered: Mapped[int] = mapped_column(Integer, default=0)
    
    # Relationships
    sessions: Mapped[List["QuizSession"]] = relationship(back_populates="user")
    attempts: Mapped[List["WordAttempt"]] = relationship(back_populates="user")


class QuizSession(Base):
    """A continuous learning session."""
    __tablename__ = "quiz_sessions"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    start_time: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    end_time: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    
    # Session stats
    start_rating: Mapped[float] = mapped_column(Float)
    end_rating: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    words_attempted: Mapped[int] = mapped_column(Integer, default=0)
    
    user: Mapped["User"] = relationship(back_populates="sessions")
    attempts: Mapped[List["WordAttempt"]] = relationship(back_populates="session")


class WordAttempt(Base):
    """Single question attempt."""
    __tablename__ = "word_attempts"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    session_id: Mapped[int] = mapped_column(ForeignKey("quiz_sessions.id"))
    
    word: Mapped[str] = mapped_column(String(100), index=True)
    word_difficulty: Mapped[float] = mapped_column(Float)
    
    is_correct: Mapped[bool] = mapped_column(Boolean)
    time_taken_ms: Mapped[int] = mapped_column(Integer, nullable=True)
    
    user_rating_before: Mapped[float] = mapped_column(Float)
    user_rating_after: Mapped[float] = mapped_column(Float)
    timestamp: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    
    user: Mapped["User"] = relationship(back_populates="attempts")
    session: Mapped["QuizSession"] = relationship(back_populates="attempts")


def init_db():
    """Initialize database tables."""
    engine = create_engine(DATABASE_URL)
    Base.metadata.create_all(engine)
    return engine


def get_db_session(engine=None):
    """Get a new database session."""
    if engine is None:
        engine = create_engine(DATABASE_URL)
    return Session(engine)
