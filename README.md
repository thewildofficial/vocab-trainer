# Vocab Trainer - Adaptive Vocabulary Learning

An adaptive vocabulary learning system using Elo rating to quickly converge to a user's fluency level.

## Project Status: Data Preprocessing & Modeling Phase

### Current Focus
- [ ] Data preprocessing pipeline (clean 3M Gutenberg words → 25k-50k quality words)
- [ ] Elo rating model implementation and testing
- [ ] Word definition extraction (WordNet + NLTK)
- [ ] Distractor generation algorithm
- [ ] Model validation and testing

### Architecture Overview

**Adaptive Algorithm:** Elo rating system (proven in Math Garden education platform)
- K-factor: 25
- Beta: 200
- Convergence: 10-15 questions for initial estimate

**Data Source:** Project Gutenberg (3M+ frequency-ranked words)
**Target:** 25k-50k clean, validated words with definitions

## Quick Start

```bash
# Install dependencies
pip install -r requirements.txt

# Download NLTK data
python scripts/download_nltk_data.py

# Run preprocessing pipeline
python scripts/preprocess_data.py

# Test Elo model
python scripts/test_elo_model.py
```

## Project Structure

```
vocab-trainer/
├── data/
│   ├── raw/                    # Raw Gutenberg data (topwords/)
│   ├── processed/              # Cleaned word database
│   └── cache/                  # Temporary processing files
├── src/
│   ├── preprocessing/          # Data cleaning pipeline
│   ├── models/                 # Elo rating implementation
│   ├── definitions/            # Definition extraction (WordNet)
│   └── utils/                  # Helper functions
├── tests/                      # Unit tests
├── scripts/                    # Executable scripts
└── notebooks/                  # Jupyter notebooks for exploration
```

## Research Summary

See [RESEARCH.md](RESEARCH.md) for full research synthesis.

**Key Findings:**
- Elo rating: 30-40% faster convergence with dynamic K-factor
- WordNet coverage: ~40% of raw Gutenberg words pass validation
- Optimal cutoff: Rank 50,000 (quality degrades after)
- Cold start: 5-8 question binary search calibration

## License

MIT
