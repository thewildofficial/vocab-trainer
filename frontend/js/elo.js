/**
 * Elo Rating Logic
 * Ported from Python implementation
 */

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
        
        // Calculate raw change
        const change = this.kFactor * (actual - expected);
        
        // Return new rounded rating
        return Math.round(userRating + change);
    }
}
