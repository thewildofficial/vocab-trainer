"""Generate distractors (wrong answers) for multiple choice."""

import random
from typing import List, Dict, Optional
from nltk.corpus import wordnet


class DistractorGenerator:
    """Generate plausible wrong answers for quiz."""
    
    def __init__(self, words: List[Dict]):
        """
        Initialize with word database.
        
        Args:
            words: List of word dicts with 'word', 'definition', 'difficulty', 'pos'
        """
        self.words = words
        self.words_by_pos = self._index_by_pos()
        self.words_by_difficulty = sorted(words, key=lambda w: w['difficulty'])
    
    def _index_by_pos(self) -> Dict[str, List[Dict]]:
        """Index words by part of speech."""
        by_pos = {}
        for word in self.words:
            pos = word.get('pos', 'n')
            if pos not in by_pos:
                by_pos[pos] = []
            by_pos[pos].append(word)
        return by_pos
    
    def generate(self, correct_word: Dict, n: int = 3) -> List[Dict]:
        """
        Generate n distractor words.
        
        Uses multiple strategies:
        1. Same POS + similar difficulty
        2. WordNet semantic similarity (hypernyms)
        3. Random from same difficulty band
        
        Args:
            correct_word: The correct answer word dict
            n: Number of distractors to generate
            
        Returns:
            List of distractor word dicts
        """
        distractors = []
        used_words = {correct_word['word']}
        
        pos = correct_word.get('pos', 'n')
        difficulty = correct_word.get('difficulty', 1200)
        
        # Strategy 1: Same POS + similar difficulty (preferred)
        pos_candidates = self.words_by_pos.get(pos, [])
        similar = [
            w for w in pos_candidates
            if w['word'] not in used_words
            and abs(w['difficulty'] - difficulty) <= 200
        ]
        
        random.shuffle(similar)
        for w in similar[:n]:
            distractors.append(w)
            used_words.add(w['word'])
        
        if len(distractors) >= n:
            return distractors[:n]
        
        # Strategy 2: Any word with similar difficulty
        remaining = n - len(distractors)
        similar_diff = [
            w for w in self.words
            if w['word'] not in used_words
            and abs(w['difficulty'] - difficulty) <= 300
        ]
        
        random.shuffle(similar_diff)
        for w in similar_diff[:remaining]:
            distractors.append(w)
            used_words.add(w['word'])
        
        if len(distractors) >= n:
            return distractors[:n]
        
        # Strategy 3: Random fallback
        remaining = n - len(distractors)
        random_words = [w for w in self.words if w['word'] not in used_words]
        random.shuffle(random_words)
        
        for w in random_words[:remaining]:
            distractors.append(w)
        
        return distractors[:n]
    
    def generate_definition_distractors(self, correct_word: Dict, n: int = 3) -> List[str]:
        """
        Generate distractor definitions only.
        
        Args:
            correct_word: Correct word dict
            n: Number of distractors
            
        Returns:
            List of distractor definition strings
        """
        distractor_words = self.generate(correct_word, n)
        return [w['definition'] for w in distractor_words]
    
    def create_quiz_question(self, word: Dict, n_choices: int = 4) -> Dict:
        """
        Create a complete quiz question.
        
        Args:
            word: Word to quiz on
            n_choices: Total number of choices
            
        Returns:
            Dict with 'word', 'choices', 'correct_index'
        """
        distractors = self.generate(word, n_choices - 1)
        
        # Combine correct + distractors
        choices = [
            {'definition': word['definition'], 'correct': True}
        ]
        for d in distractors:
            choices.append({'definition': d['definition'], 'correct': False})
        
        # Shuffle
        random.shuffle(choices)
        
        # Find correct index
        correct_idx = next(i for i, c in enumerate(choices) if c['correct'])
        
        return {
            'word': word['word'],
            'pos': word.get('pos', ''),
            'choices': [c['definition'] for c in choices],
            'correct_index': correct_idx,
            'difficulty': word.get('difficulty', 1200)
        }
