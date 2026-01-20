"""Load and parse raw Gutenberg word data."""

from pathlib import Path
from typing import List, Tuple
from ..config import RAW_DATA_PATH


class GutenbergDataLoader:
    """Load frequency-ranked words from Project Gutenberg dataset."""
    
    def __init__(self, data_path: Path = None):
        """
        Initialize data loader.
        
        Args:
            data_path: Path to topwords directory
        """
        self.data_path = data_path or RAW_DATA_PATH
    
    def load_words(self, max_rank: int = None) -> List[str]:
        """
        Load words from words.txt file.
        
        Args:
            max_rank: Maximum frequency rank to load (None = all)
            
        Returns:
            List of words in frequency order
        """
        words_file = self.data_path / 'words.txt'
        
        if not words_file.exists():
            raise FileNotFoundError(f"Words file not found: {words_file}")
        
        words = []
        with open(words_file, 'r', encoding='utf-8') as f:
            for i, line in enumerate(f, 1):
                word = line.strip()
                if word:
                    words.append(word)
                
                if max_rank and i >= max_rank:
                    break
        
        return words
    
    def load_word_counts(self, max_rank: int = None) -> List[Tuple[str, int]]:
        """
        Load words with their frequency counts from counts.txt.
        
        Args:
            max_rank: Maximum frequency rank to load (None = all)
            
        Returns:
            List of (word, count) tuples in frequency order
        """
        counts_file = self.data_path / 'counts.txt'
        
        if not counts_file.exists():
            raise FileNotFoundError(f"Counts file not found: {counts_file}")
        
        word_counts = []
        with open(counts_file, 'r', encoding='utf-8') as f:
            for i, line in enumerate(f, 1):
                parts = line.strip().split(maxsplit=1)
                if len(parts) == 2:
                    count, word = parts
                    word_counts.append((word, int(count)))
                
                if max_rank and i >= max_rank:
                    break
        
        return word_counts
    
    def get_word_rank(self, word: str) -> int:
        """
        Get frequency rank for a specific word.
        
        Args:
            word: Word to look up
            
        Returns:
            Rank (1-indexed) or -1 if not found
        """
        words = self.load_words()
        
        try:
            return words.index(word) + 1
        except ValueError:
            return -1
    
    def get_rank_range(self, start_rank: int, end_rank: int) -> List[str]:
        """
        Get words in a specific rank range.
        
        Args:
            start_rank: Starting rank (inclusive, 1-indexed)
            end_rank: Ending rank (inclusive)
            
        Returns:
            List of words in range
        """
        words = self.load_words(max_rank=end_rank)
        return words[start_rank-1:end_rank]
