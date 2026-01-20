/**
 * State Management - Complete schema with gamification
 */

const STORAGE_KEY = 'vocab_trainer_v2';

const DEFAULT_STATE = {
    user: {
        rating: 1200,              // Elo rating
        xp: 0,                     // Total XP
        level: 1,                  // Current level
        streak: 0,                 // Current daily streak
        maxStreak: 0,              // All-time best streak
        lastActiveDate: null,
        totalSessions: 0,
        totalCorrect: 0,
        totalAttempts: 0,
        wordsLearned: 0
    },
    daily: {
        xpToday: 0,
        xpGoal: 50,
        lessonsToday: 0,
        lastLessonDate: null       // YYYY-MM-DD
    },
    historyRating: [],             // Array of ratings for graph
    historySessions: [],           // Session summaries
    wordMastery: {},               // { 'ephemeral': { attempts: 3, correct: 2, lastSeen: timestamp } }
    achievements: {
        unlocked: [],
        unlockedAt: {}
    },
    settings: {
        sound: true,
        haptics: true,
        darkMode: false
    }
};

// Level thresholds - geometric progression
const LEVEL_THRESHOLDS = [
    { level: 1, xp: 0 },
    { level: 2, xp: 100 },
    { level: 3, xp: 250 },
    { level: 4, xp: 500 },
    { level: 5, xp: 1000 },
    { level: 6, xp: 1750 },
    { level: 7, xp: 2750 },
    { level: 8, xp: 4000 },
    { level: 9, xp: 5500 },
    { level: 10, xp: 7500 },
    { level: 11, xp: 10000 },
    { level: 12, xp: 13000 },
    { level: 13, xp: 17000 },
    { level: 14, xp: 22000 },
    { level: 15, xp: 28000 },
    { level: 16, xp: 35000 },
    { level: 17, xp: 43000 },
    { level: 18, xp: 52000 },
    { level: 19, xp: 62000 },
    { level: 20, xp: 75000 }
];

// Helper functions
const getToday = () => new Date().toISOString().split('T')[0];

const computeLevel = (xp) => {
    let level = 1;
    for (const threshold of LEVEL_THRESHOLDS) {
        if (xp >= threshold.xp) {
            level = threshold.level;
        } else {
            break;
        }
    }
    return level;
};

const getXPForLevel = (level) => {
    const threshold = LEVEL_THRESHOLDS.find(t => t.level === level);
    return threshold ? threshold.xp : 0;
};

const getXPForNextLevel = (level) => {
    const next = LEVEL_THRESHOLDS.find(t => t.level === level + 1);
    return next ? next.xp : LEVEL_THRESHOLDS[LEVEL_THRESHOLDS.length - 1].xp;
};

const deepMerge = (target, source) => {
    const result = { ...target };
    for (const key of Object.keys(source)) {
        if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
            result[key] = deepMerge(target[key] || {}, source[key]);
        } else {
            result[key] = source[key];
        }
    }
    return result;
};

export const State = {
    data: null,

    load() {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                // Deep merge to handle new fields
                this.data = deepMerge(DEFAULT_STATE, parsed);
            } catch (e) {
                console.error('State load error', e);
                this.data = { ...DEFAULT_STATE };
            }
        } else {
            this.data = { ...DEFAULT_STATE };
        }
        
        // Check and update streak
        this._updateStreak();
        // Reset daily if new day
        this._checkDailyReset();
        // Recalculate level from XP
        this.data.user.level = computeLevel(this.data.user.xp);
        
        this.save();
        return this.data;
    },

    save() {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
    },

    reset() {
        localStorage.removeItem(STORAGE_KEY);
        this.data = { ...DEFAULT_STATE };
        this.save();
    },

    // Check if streak should be maintained or reset
    _updateStreak() {
        const today = getToday();
        const lastActive = this.data.user.lastActiveDate;
        
        if (!lastActive) {
            // First time user
            return;
        }
        
        const lastDate = new Date(lastActive);
        const todayDate = new Date(today);
        const diffDays = Math.floor((todayDate - lastDate) / (1000 * 60 * 60 * 24));
        
        if (diffDays > 1) {
            // Streak broken - missed a day
            this.data.user.streak = 0;
        }
        // If diffDays === 1, streak continues when they complete a lesson
        // If diffDays === 0, same day, no change needed
    },

    // Reset daily stats if new day
    _checkDailyReset() {
        const today = getToday();
        if (this.data.daily.lastLessonDate !== today) {
            this.data.daily.xpToday = 0;
            this.data.daily.lessonsToday = 0;
        }
    },

    // Update user properties
    updateUser(updates) {
        this.data.user = { ...this.data.user, ...updates };
        // Recalculate level when XP changes
        if ('xp' in updates) {
            this.data.user.level = computeLevel(this.data.user.xp);
        }
        this.save();
    },

    // Add XP and check for level up
    addXP(amount) {
        const oldLevel = this.data.user.level;
        this.data.user.xp += amount;
        this.data.user.level = computeLevel(this.data.user.xp);
        this.data.daily.xpToday += amount;
        this.save();
        
        return {
            xpGained: amount,
            newXP: this.data.user.xp,
            leveledUp: this.data.user.level > oldLevel,
            newLevel: this.data.user.level,
            oldLevel
        };
    },

    // Complete a lesson - update streak and daily
    completeLesson(sessionStats) {
        const today = getToday();
        const lastActive = this.data.user.lastActiveDate;
        
        // Update streak
        if (lastActive !== today) {
            const lastDate = lastActive ? new Date(lastActive) : null;
            const todayDate = new Date(today);
            
            if (!lastDate) {
                this.data.user.streak = 1;
            } else {
                const diffDays = Math.floor((todayDate - lastDate) / (1000 * 60 * 60 * 24));
                if (diffDays === 1) {
                    this.data.user.streak += 1;
                } else if (diffDays > 1) {
                    this.data.user.streak = 1;
                }
                // If same day, streak already counted
            }
            
            // Update max streak
            if (this.data.user.streak > this.data.user.maxStreak) {
                this.data.user.maxStreak = this.data.user.streak;
            }
        }
        
        // Update activity date
        this.data.user.lastActiveDate = today;
        this.data.daily.lastLessonDate = today;
        this.data.daily.lessonsToday += 1;
        this.data.user.totalSessions += 1;
        
        // Store session in history
        if (sessionStats) {
            this.data.historySessions.unshift({
                ...sessionStats,
                date: today,
                timestamp: Date.now()
            });
            // Keep last 50 sessions
            if (this.data.historySessions.length > 50) {
                this.data.historySessions.pop();
            }
        }
        
        this.save();
    },

    // Update rating and store in history
    updateRating(newRating) {
        this.data.user.rating = Math.round(newRating);
        this.data.historyRating.push(this.data.user.rating);
        
        // Keep last 100 ratings
        if (this.data.historyRating.length > 100) {
            this.data.historyRating.shift();
        }
        
        this.save();
    },

    // Track word attempt
    trackWordAttempt(word, correct) {
        if (!this.data.wordMastery[word]) {
            this.data.wordMastery[word] = {
                attempts: 0,
                correct: 0,
                lastSeen: null
            };
        }
        
        this.data.wordMastery[word].attempts += 1;
        if (correct) {
            this.data.wordMastery[word].correct += 1;
        }
        this.data.wordMastery[word].lastSeen = Date.now();
        
        // Update overall stats
        this.data.user.totalAttempts += 1;
        if (correct) {
            this.data.user.totalCorrect += 1;
        }
        
        this.save();
    },

    // Lose a life
    unlockAchievement(id) {
        if (!this.data.achievements.unlocked.includes(id)) {
            this.data.achievements.unlocked.push(id);
            this.data.achievements.unlockedAt[id] = Date.now();
            this.save();
            return true;
        }
        return false;
    },

    // Check if achievement is unlocked
    hasAchievement(id) {
        return this.data.achievements.unlocked.includes(id);
    },

    // Get computed stats
    getStats() {
        const u = this.data.user;
        const accuracy = u.totalAttempts > 0 
            ? Math.round((u.totalCorrect / u.totalAttempts) * 100) 
            : 0;
        
        const currentLevelXP = getXPForLevel(u.level);
        const nextLevelXP = getXPForNextLevel(u.level);
        const xpInCurrentLevel = u.xp - currentLevelXP;
        const xpNeededForNext = nextLevelXP - currentLevelXP;
        const levelProgress = xpNeededForNext > 0 ? (xpInCurrentLevel / xpNeededForNext) * 100 : 100;
            
        return {
            rating: u.rating,
            xp: u.xp,
            level: u.level,
            streak: u.streak,
            maxStreak: u.maxStreak,
            wordsLearned: Object.keys(this.data.wordMastery).length,
            accuracy,
            totalSessions: u.totalSessions,
            totalAttempts: u.totalAttempts,
            totalCorrect: u.totalCorrect,
            levelProgress: Math.round(levelProgress),
            xpToNextLevel: nextLevelXP - u.xp,
            dailyXP: this.data.daily.xpToday,
            dailyGoal: this.data.daily.xpGoal,
            dailyProgress: Math.min(100, Math.round((this.data.daily.xpToday / this.data.daily.xpGoal) * 100))
        };
    },

    // Get rating history for chart
    getRatingHistory(limit = 20) {
        return this.data.historyRating.slice(-limit);
    },

    // Get word mastery level
    getWordMastery(word) {
        const data = this.data.wordMastery[word];
        if (!data) return 'new';
        
        const accuracy = data.attempts > 0 ? data.correct / data.attempts : 0;
        
        if (data.correct >= 10 && accuracy >= 0.95) return 'legendary';
        if (data.correct >= 5 && accuracy >= 0.9) return 'mastered';
        if (data.correct >= 3 && accuracy >= 0.7) return 'familiar';
        if (data.attempts >= 1) return 'learning';
        return 'new';
    }
};

export { LEVEL_THRESHOLDS, computeLevel, getXPForLevel, getXPForNextLevel };
