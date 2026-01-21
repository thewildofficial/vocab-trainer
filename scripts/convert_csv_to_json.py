#!/usr/bin/env python3
"""Convert words.csv to words.json for client-side loading."""

import csv
import json
from pathlib import Path

def convert_csv_to_json():
    """Convert CSV file to JSON format."""
    csv_path = Path(__file__).parent.parent / "frontend" / "data" / "processed" / "words.csv"
    json_path = Path(__file__).parent.parent / "frontend" / "data" / "words.json"
    
    if not csv_path.exists():
        print(f"Error: CSV file not found at {csv_path}")
        return
    
    words = []
    
    print(f"Reading CSV from {csv_path}...")
    with open(csv_path, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            words.append({
                'word': row['word'],
                'pos': row['pos'],
                'definition': row['definition'],
                'difficulty': float(row['difficulty'])
            })
    
    print(f"Loaded {len(words)} words")
    
    # Ensure directory exists
    json_path.parent.mkdir(parents=True, exist_ok=True)
    
    print(f"Writing JSON to {json_path}...")
    with open(json_path, 'w', encoding='utf-8') as f:
        json.dump(words, f, ensure_ascii=False, indent=2)
    
    # Get file size
    size_mb = json_path.stat().st_size / (1024 * 1024)
    print(f"✅ Conversion complete! JSON file size: {size_mb:.2f} MB")
    print(f"   {len(words)} words ready for client-side loading")

if __name__ == "__main__":
    convert_csv_to_json()
