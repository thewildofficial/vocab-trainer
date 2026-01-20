"""Main preprocessing pipeline."""

import math
from pathlib import Path
from typing import Dict, List, Optional
from tqdm import tqdm

from .data_loader import GutenbergDataLoader
from .word_filter import WordFilter
from ..definitions.wordnet_provider import WordNetDefinitionProvider
from ..config import MAX_FREQUENCY_RANK, PROCESSED_DATA_PATH


def is_definition_self_referential(definition: str, word: str) -> bool:
    """Check if definition contains the word or its stem."""
    definition_lower = definition.lower()
    word_lower = word.lower()
    
    # Check exact word match
    if word_lower in definition_lower.split():
        return True
    
    # Check for word stem (e.g., "hemisphere" in "hemispherical")
    # Get the stem by removing common suffixes
    stems = [word_lower]
    suffixes = ['ed', 'ing', 'ly', 'er', 'est', 'ness', 'ment', 'tion', 'sion', 
                'ical', 'al', 'ful', 'less', 'ous', 'ive', 'able', 'ible', 'ian']
    
    for suffix in suffixes:
        if word_lower.endswith(suffix) and len(word_lower) > len(suffix) + 2:
            stems.append(word_lower[:-len(suffix)])
    
    # Also check if definition contains a root that's part of the word
    # e.g., "unconverted" contains "convert"
    if len(word_lower) > 4:
        for i in range(3, len(word_lower) - 2):
            potential_root = word_lower[i:]
            if len(potential_root) >= 4 and potential_root in definition_lower:
                return True
            potential_root = word_lower[:len(word_lower)-i]
            if len(potential_root) >= 4 and potential_root in definition_lower:
                return True
    
    # Check if any stem appears in definition
    for stem in stems:
        if len(stem) >= 4 and stem in definition_lower:
            return True
    
    return False


def calculate_difficulty(rank: int) -> float:
    """Map frequency rank to initial Elo difficulty."""
    if rank <= 1000:
        return 1000.0
    elif rank <= 5000:
        return 1000.0 + (rank - 1000) * 0.05
    elif rank <= 10000:
        return 1200.0 + (rank - 5000) * 0.04
    elif rank <= 25000:
        return 1400.0 + (rank - 10000) * 0.02
    elif rank <= 100000:
        # Standard Gutenberg long tail
        return 1700.0 + math.log10(rank - 25000 + 1) * 50
    else:
        # GRE / Elite words (Rank > 100k)
        # Map 100k+ to 2000-2400 range
        return 2000.0 + (rank - 100000) * 0.05


class PreprocessingPipeline:
    """Clean Gutenberg data into vocabulary database."""
    
    def __init__(self):
        self.loader = GutenbergDataLoader()
        self.filter = WordFilter()
        self.definitions = WordNetDefinitionProvider()
    
    def load_gre_words(self) -> List[str]:
        """Load GRE words from raw text file."""
        gre_path = Path("data/raw/gre_words.txt")
        if not gre_path.exists():
            print("  [Warning] GRE words file not found. Skipping.")
            return []
        
        with open(gre_path, 'r', encoding='utf-8') as f:
            words = [line.strip().lower() for line in f if line.strip()]
        return words

    def run(self, max_rank: Optional[int] = None, output_file: str = "words.csv") -> List[Dict]:
        """
        Run full preprocessing pipeline.
        
        Args:
            max_rank: Max frequency rank to process
            output_file: Output filename
            
        Returns:
            List of processed word dictionaries
        """
        max_rank_val = max_rank or MAX_FREQUENCY_RANK
        
        print(f"=== Preprocessing Pipeline (max_rank={max_rank_val}) ===\n")
        
        print("[1/6] Loading raw data...")
        word_counts = self.loader.load_word_counts(max_rank=max_rank_val)
        print(f"  Loaded {len(word_counts)} Gutenberg words")
        
        print("[2/6] Loading GRE words...")
        gre_words = self.load_gre_words()
        print(f"  Loaded {len(gre_words)} GRE words")
        
        gutenberg_words = {w[0]: (w[1], i+1) for i, w in enumerate(word_counts)}
        
        print("\n[3/6] Filtering and validating...")
        processed = []
        seen_lemmas = set()
        
        for word, count in tqdm(word_counts, desc="  Processing Gutenberg"):
            result = self.filter.process_word(word)
            if not result:
                continue
            
            lemma = result['lemma']
            if lemma in seen_lemmas:
                continue
            seen_lemmas.add(lemma)
            
            result['count'] = count
            result['rank'] = len(processed) + 1
            result['source'] = 'gutenberg'
            processed.append(result)
            
        gre_added = 0
        base_rank = 100000 
        
        for word in tqdm(gre_words, desc="  Processing GRE"):
            result = self.filter.process_word(word)
            if not result:
                continue
                
            lemma = result['lemma']
            if lemma in seen_lemmas:
                continue
            seen_lemmas.add(lemma)
            
            result['count'] = 1
            result['rank'] = base_rank + gre_added
            result['source'] = 'gre'
            processed.append(result)
            gre_added += 1
            
        print(f"  Kept {len(processed)} total words (Gutenberg + {gre_added} GRE)")
        
        print("\n[4/6] Fetching definitions...")
        final = []
        
        for item in tqdm(processed, desc="  Definitions"):
            definition = self.definitions.get_definition(item['lemma'])
            if not definition:
                continue
            
            if is_definition_self_referential(definition, item['lemma']):
                continue
            
            example = self.definitions.get_example_sentence(item['lemma'])
            
            final.append({
                'word': item['lemma'],
                'original': item['original'],
                'pos': item['pos'],
                'definition': definition,
                'example': example or '',
                'frequency_rank': item['rank'],
                'raw_count': item['count'],
                'difficulty': calculate_difficulty(item['rank']),
                'source': item.get('source', 'gutenberg')
            })
        
        print(f"  Got definitions for {len(final)}/{len(processed)} words ({100*len(final)/len(processed):.1f}%)")
        
        print("\n[5/6] Saving to CSV...")
        output_path = PROCESSED_DATA_PATH / output_file
        
        import csv
        with open(output_path, 'w', newline='', encoding='utf-8') as f:
            if final:
                writer = csv.DictWriter(f, fieldnames=final[0].keys())
                writer.writeheader()
                writer.writerows(final)
        
        print(f"  Saved to: {output_path}")
        
        print("\n[6/6] Summary:")
        self._print_summary(final)
        
        return final
    
    def _print_summary(self, words: List[Dict]):
        """Print statistics."""
        if not words:
            print("  No words processed!")
            return
        
        difficulties = [w['difficulty'] for w in words]
        pos_counts = {}
        for w in words:
            pos_counts[w['pos']] = pos_counts.get(w['pos'], 0) + 1
        
        print(f"  Total words: {len(words)}")
        print(f"  Difficulty range: {min(difficulties):.0f} - {max(difficulties):.0f}")
        print(f"  Easy (<1200): {sum(1 for d in difficulties if d < 1200)}")
        print(f"  Medium (1200-1400): {sum(1 for d in difficulties if 1200 <= d < 1400)}")
        print(f"  Hard (1400-1600): {sum(1 for d in difficulties if 1400 <= d < 1600)}")
        print(f"  Very Hard (1600+): {sum(1 for d in difficulties if d >= 1600)}")
        print(f"  POS distribution: {pos_counts}")
        print(f"  Words with examples: {sum(1 for w in words if w['example'])}")


def run_pipeline(max_rank: Optional[int] = None):
    """Convenience function to run pipeline."""
    pipeline = PreprocessingPipeline()
    return pipeline.run(max_rank=max_rank)


if __name__ == "__main__":
    run_pipeline()
