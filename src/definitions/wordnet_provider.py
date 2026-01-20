"""WordNet-based definition provider."""

from typing import Optional, List, Dict
import nltk
from nltk.corpus import wordnet


class WordNetDefinitionProvider:
    """
    Extract word definitions from WordNet.
    Provides offline, local dictionary functionality.
    """
    
    def __init__(self):
        """Initialize WordNet provider."""
        self._ensure_wordnet_data()
    
    def _ensure_wordnet_data(self):
        """Download WordNet data if not available."""
        try:
            wordnet.synsets('test')
        except LookupError:
            print("Downloading WordNet data...")
            nltk.download('wordnet', quiet=True)
            nltk.download('omw-1.4', quiet=True)
    
    def get_definition(self, word: str, pos: Optional[str] = None) -> Optional[str]:
        """
        Get definition for a word.
        
        Args:
            word: Word to define
            pos: Part of speech (n=noun, v=verb, a=adjective, r=adverb)
            
        Returns:
            Definition string or None if not found
        """
        synsets = wordnet.synsets(word, pos=pos)
        
        if not synsets:
            return None
        
        # Return most common definition (first synset)
        return synsets[0].definition()
    
    def get_all_definitions(self, word: str, pos: Optional[str] = None) -> List[Dict[str, str]]:
        """
        Get all definitions for a word.
        
        Args:
            word: Word to define
            pos: Part of speech filter
            
        Returns:
            List of definition dictionaries with pos, definition, and examples
        """
        synsets = wordnet.synsets(word, pos=pos)
        
        definitions = []
        for synset in synsets:
            definitions.append({
                'pos': synset.pos(),
                'definition': synset.definition(),
                'examples': synset.examples(),
                'synset_name': synset.name()
            })
        
        return definitions
    
    def validate_word(self, word: str) -> bool:
        """
        Check if word exists in WordNet.
        
        Args:
            word: Word to validate
            
        Returns:
            True if word exists in WordNet
        """
        return len(wordnet.synsets(word)) > 0
    
    def get_example_sentence(self, word: str, pos: Optional[str] = None) -> Optional[str]:
        """
        Get example sentence for a word.
        
        Args:
            word: Word to get example for
            pos: Part of speech filter
            
        Returns:
            Example sentence or None
        """
        synsets = wordnet.synsets(word, pos=pos)
        
        if not synsets:
            return None
        
        for synset in synsets:
            if synset.examples():
                return synset.examples()[0]
        
        return None
    
    def get_lemmas(self, word: str) -> List[str]:
        """
        Get all lemma forms of a word.
        
        Args:
            word: Word to get lemmas for
            
        Returns:
            List of lemma strings
        """
        synsets = wordnet.synsets(word)
        lemmas = set()
        
        for synset in synsets:
            for lemma in synset.lemmas():
                lemmas.add(lemma.name())
        
        return sorted(list(lemmas))
