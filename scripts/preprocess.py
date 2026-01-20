#!/usr/bin/env python3
"""Run preprocessing pipeline."""

import sys
from pathlib import Path

# Add project root to path
project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root))

from src.preprocessing.pipeline import PreprocessingPipeline


def main():
    """Run the preprocessing pipeline."""
    import argparse
    
    parser = argparse.ArgumentParser(description="Preprocess Gutenberg word data")
    parser.add_argument("--max-rank", type=int, default=50000,
                        help="Maximum frequency rank to process (default: 50000)")
    parser.add_argument("--output", type=str, default="words.csv",
                        help="Output filename (default: words.csv)")
    parser.add_argument("--test", action="store_true",
                        help="Test mode: only process first 1000 words")
    
    args = parser.parse_args()
    
    max_rank = 1000 if args.test else args.max_rank
    
    print(f"\n{'='*60}")
    print("VOCAB TRAINER - DATA PREPROCESSING")
    print(f"{'='*60}\n")
    
    pipeline = PreprocessingPipeline()
    words = pipeline.run(max_rank=max_rank, output_file=args.output)
    
    print(f"\n{'='*60}")
    print(f"DONE! Processed {len(words)} words")
    print(f"Output: data/processed/{args.output}")
    print(f"{'='*60}\n")


if __name__ == "__main__":
    main()
