/**
 * State Management
 */

const STORAGE_KEY = 'vocab_trainer_v1';

const DEFAULT_STATE = {
    user: {
        username: 'Guest',
        rating: 1200,
        xp: 0,
        streak: 0,
        lastActive: null,
        wordsLearned: 0,
        totalAttempts: 0,
        correctAttempts: 0
    },
    settings: {
        sound: true,
        haptics: true
    },
    history: [] // Last 50 attempts
};

export const State = {
    data: { ...DEFAULT_STATE },

    load() {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                this.data = { ...DEFAULT_STATE, ...parsed };
            } catch (e) {
                console.error('State load error', e);
            }
        }
        return this.data;
    },

    save() {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
    },

    updateUser(updates) {
        this.data.user = { ...this.data.user, ...updates };
        this.save();
    },

    addHistory(attempt) {
        this.data.history.unshift(attempt);
        if (this.data.history.length > 50) this.data.history.pop();
        
        // Update stats
        this.data.user.totalAttempts++;
        if (attempt.correct) this.data.user.correctAttempts++;
        
        this.save();
    },

    getStats() {
        const u = this.data.user;
        const accuracy = u.totalAttempts > 0 
            ? Math.round((u.correctAttempts / u.totalAttempts) * 100) 
            : 0;
            
        return {
            rating: u.rating,
            xp: u.xp,
            streak: u.streak,
            wordsLearned: u.wordsLearned,
            accuracy
        };
    }
};
