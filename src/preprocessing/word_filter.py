"""Word filtering and validation for preprocessing pipeline."""

from typing import List, Set
import nltk
from nltk.corpus import stopwords, wordnet
from nltk.stem import WordNetLemmatizer
from nltk import pos_tag

from ..config import MIN_WORD_LENGTH, FILTER_STOPWORDS, USE_LEMMATIZATION


class WordFilter:
    """
    Filter and validate words from raw frequency list.
    
    Applies:
    - Stop word removal
    - Length filtering
    - WordNet validation
    - POS filtering (keep nouns, verbs, adjectives)
    - Lemmatization
    """
    
    def __init__(self):
        """Initialize word filter."""
        self._ensure_nltk_data()
        self.stop_words = set(stopwords.words('english'))
        self.lemmatizer = WordNetLemmatizer()
    
    def _ensure_nltk_data(self):
        """Download required NLTK data."""
        resources = ['stopwords', 'wordnet', 'averaged_perceptron_tagger', 'omw-1.4']
        
        for resource in resources:
            try:
                nltk.data.find(f'corpora/{resource}' if resource in ['stopwords', 'wordnet'] else f'taggers/{resource}')
            except LookupError:
                print(f"Downloading NLTK resource: {resource}")
                nltk.download(resource, quiet=True)
    
    def filter_word(self, word: str) -> bool:
        """
        Check if word passes all filters.
        
        Args:
            word: Word to filter
            
        Returns:
            True if word should be kept
        """
        # Length filter
        if len(word) < MIN_WORD_LENGTH:
            return False
        
        # Stop word filter
        if FILTER_STOPWORDS and word.lower() in self.stop_words:
            return False
        
        # WordNet validation (real word check)
        if not self.is_valid_word(word):
            return False
        
        # POS filter (keep nouns, verbs, adjectives)
        if not self.has_valid_pos(word):
            return False
        
        return True
    
    def is_valid_word(self, word: str) -> bool:
        """
        Check if word exists in WordNet.
        
        Args:
            word: Word to validate
            
        Returns:
            True if word is in WordNet
        """
        return len(wordnet.synsets(word)) > 0
    
    def has_valid_pos(self, word: str) -> bool:
        """
        Check if word has valid part of speech (noun, verb, adjective).
        
        Args:
            word: Word to check
            
        Returns:
            True if word is noun, verb, or adjective
        """
        # Get POS tag
        pos = pos_tag([word])[0][1]
        
        # Keep nouns (NN*), verbs (VB*), adjectives (JJ*)
        return pos.startswith(('NN', 'VB', 'JJ'))
    
    def lemmatize(self, word: str, pos: str = None) -> str:
        """
        Lemmatize word to base form.
        
        Args:
            word: Word to lemmatize
            pos: Part of speech (n, v, a, r)
            
        Returns:
            Lemmatized word
        """
        if not USE_LEMMATIZATION:
            return word
        
        if pos is None:
            # Try as verb first, then noun
            lemma = self.lemmatizer.lemmatize(word, pos='v')
            if lemma == word:
                lemma = self.lemmatizer.lemmatize(word, pos='n')
            return lemma
        else:
            return self.lemmatizer.lemmatize(word, pos=pos)
    
    def get_wordnet_pos(self, treebank_tag: str) -> str:
        """
        Convert Penn Treebank POS tag to WordNet POS tag.
        
        Args:
            treebank_tag: Penn Treebank tag (NN, VBD, JJ, etc.)
            
        Returns:
            WordNet POS tag (n, v, a, r)
        """
        if treebank_tag.startswith('J'):
            return 'a'  # Adjective
        elif treebank_tag.startswith('V'):
            return 'v'  # Verb
        elif treebank_tag.startswith('N'):
            return 'n'  # Noun
        elif treebank_tag.startswith('R'):
            return 'r'  # Adverb
        else:
            return 'n'  # Default to noun
    
    def process_word(self, word: str) -> dict:
        """
        Process and validate a single word.
        
        Args:
            word: Word to process
            
        Returns:
            Dictionary with processed word data or None if filtered out
        """
        # Apply filters
        if not self.filter_word(word):
            return None
        
        # Get POS tag
        pos_tag_result = pos_tag([word])[0][1]
        wn_pos = self.get_wordnet_pos(pos_tag_result)
        
        # Lemmatize
        lemma = self.lemmatize(word, pos=wn_pos)
        
        return {
            'original': word,
            'lemma': lemma,
            'pos': wn_pos,
            'pos_tag': pos_tag_result,
            'valid': True
        }
    
    def batch_process(self, words: List[str]) -> List[dict]:
        """
        Process a batch of words.
        
        Args:
            words: List of words to process
            
        Returns:
            List of processed word dictionaries (filtered)
        """
        results = []
        
        for word in words:
            result = self.process_word(word)
            if result:
                results.append(result)
        
        return results
