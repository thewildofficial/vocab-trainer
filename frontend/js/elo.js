export class EloRating {
    constructor(kFactor = 25, beta = 200) {
        this.kFactor = kFactor;
        this.beta = beta;
    }

    expectedScore(userRating, wordDifficulty) {
        const diff = wordDifficulty - userRating;
        return 1.0 / (1 + Math.pow(10, diff / (2 * this.beta)));
    }

    updateRating(userRating, wordDifficulty, isCorrect) {
        const expected = this.expectedScore(userRating, wordDifficulty);
        const actual = isCorrect ? 1.0 : 0.0;
        const change = this.kFactor * (actual - expected);
        return Math.round(userRating + change);
    }

    getRatingChange(userRating, wordDifficulty, isCorrect) {
        const expected = this.expectedScore(userRating, wordDifficulty);
        const actual = isCorrect ? 1.0 : 0.0;
        return Math.round(this.kFactor * (actual - expected));
    }

    informationValue(userRating, wordDifficulty) {
        const p = this.expectedScore(userRating, wordDifficulty);
        if (p <= 0 || p >= 1) return 0;
        return -(p * Math.log2(p) + (1 - p) * Math.log2(1 - p));
    }

    estimateFluencyLevel(rating) {
        if (rating >= 2200) return { level: 'Legendary', stars: 5, description: 'Native-like fluency', color: '#FFD700' };
        if (rating >= 2000) return { level: 'Expert', stars: 5, description: 'Academic vocabulary mastery', color: '#CE82FF' };
        if (rating >= 1800) return { level: 'Advanced', stars: 4, description: 'GRE-level words', color: '#1CB0F6' };
        if (rating >= 1600) return { level: 'Upper-Intermediate', stars: 3, description: 'Sophisticated vocabulary', color: '#58CC02' };
        if (rating >= 1400) return { level: 'Intermediate', stars: 2, description: 'Conversational fluency', color: '#FFC800' };
        if (rating >= 1200) return { level: 'Pre-Intermediate', stars: 1, description: 'Expanding vocabulary', color: '#FF9600' };
        return { level: 'Beginner', stars: 1, description: 'Building foundation', color: '#AFAFAF' };
    }

    getDifficultyBand(difficulty) {
        if (difficulty < 1150) return { name: 'Easy', color: '#58CC02' };
        if (difficulty < 1400) return { name: 'Medium', color: '#1CB0F6' };
        if (difficulty < 1700) return { name: 'Hard', color: '#CE82FF' };
        return { name: 'Expert', color: '#FFD700' };
    }

    selectOptimalWord(words, userRating, recentWords = [], count = 1) {
        const candidates = words
            .filter(w => !recentWords.includes(w.word))
            .map(w => ({
                ...w,
                infoValue: this.informationValue(userRating, w.difficulty),
                expectedAccuracy: this.expectedScore(userRating, w.difficulty)
            }))
            .filter(w => w.expectedAccuracy > 0.2 && w.expectedAccuracy < 0.9);

        candidates.sort((a, b) => b.infoValue - a.infoValue);
        
        if (candidates.length === 0) {
            const fallback = words.filter(w => !recentWords.includes(w.word));
            return fallback.slice(0, count);
        }

        const topCandidates = candidates.slice(0, Math.min(20, candidates.length));
        const selected = [];
        for (let i = 0; i < count && topCandidates.length > 0; i++) {
            const idx = Math.floor(Math.random() * Math.min(5, topCandidates.length));
            selected.push(topCandidates.splice(idx, 1)[0]);
        }
        return selected;
    }
}

export class DynamicKFactorElo extends EloRating {
    constructor(kBase = 20, kMin = 10, kMax = 40, window = 5, beta = 200) {
        super(kBase, beta);
        this.kBase = kBase;
        this.kMin = kMin;
        this.kMax = kMax;
        this.window = window;
        this.ratingHistory = [];
    }

    getDynamicK() {
        if (this.ratingHistory.length < this.window) return this.kBase;
        
        const recent = this.ratingHistory.slice(-this.window);
        let trend = 0;
        for (let i = 1; i < recent.length; i++) {
            trend += recent[i] - recent[i - 1];
        }
        
        return Math.abs(trend) > this.window * 5 ? this.kMax : this.kMin;
    }

    updateRating(userRating, wordDifficulty, isCorrect) {
        this.ratingHistory.push(userRating);
        if (this.ratingHistory.length > this.window * 2) {
            this.ratingHistory.shift();
        }
        
        this.kFactor = this.getDynamicK();
        return super.updateRating(userRating, wordDifficulty, isCorrect);
    }
}
