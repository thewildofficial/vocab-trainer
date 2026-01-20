const REACTIONS = {
    correct: {
        messages: [
            "Fantastic!",
            "You're on fire!",
            "Keep it up!",
            "Amazing!",
            "Perfect!",
            "Brilliant!",
            "Nailed it!",
            "Superb!"
        ],
        emoji: "🎉"
    },
    wrong: {
        messages: [
            "Not quite!",
            "Good try!",
            "You'll get it!",
            "Keep going!",
            "Almost!",
            "Don't give up!"
        ],
        emoji: "💪"
    },
    streak: {
        5: { message: "5 in a row! Unstoppable!", emoji: "🔥" },
        10: { message: "TEN streak! Legendary!", emoji: "⚡" },
        15: { message: "FIFTEEN! You're amazing!", emoji: "🌟" },
        20: { message: "TWENTY! Vocabulary master!", emoji: "👑" },
        30: { message: "THIRTY! Incredible!", emoji: "🏆" },
        50: { message: "FIFTY! Unbelievable!", emoji: "💎" }
    },
    levelUp: {
        messages: [
            "LEVEL UP!",
            "New Level!",
            "You leveled up!"
        ],
        emoji: "⭐"
    },
    sessionComplete: {
        perfect: { message: "Perfect lesson!", emoji: "🏆" },
        great: { message: "Great job!", emoji: "🌟" },
        good: { message: "Well done!", emoji: "👍" },
        okay: { message: "Keep practicing!", emoji: "💪" }
    }
};

export const Mascot = {
    getCorrectReaction(streak = 0) {
        const streakMilestones = [50, 30, 20, 15, 10, 5];
        for (const milestone of streakMilestones) {
            if (streak === milestone) {
                const streakData = REACTIONS.streak[milestone];
                return {
                    message: streakData.message,
                    emoji: streakData.emoji,
                    isStreakMilestone: true,
                    animation: 'celebrate'
                };
            }
        }

        const messages = REACTIONS.correct.messages;
        return {
            message: messages[Math.floor(Math.random() * messages.length)],
            emoji: REACTIONS.correct.emoji,
            isStreakMilestone: false,
            animation: 'bounce'
        };
    },

    getWrongReaction() {
        const messages = REACTIONS.wrong.messages;
        return {
            message: messages[Math.floor(Math.random() * messages.length)],
            emoji: REACTIONS.wrong.emoji,
            animation: 'shake'
        };
    },

    getLevelUpReaction(newLevel) {
        const messages = REACTIONS.levelUp.messages;
        return {
            message: `${messages[Math.floor(Math.random() * messages.length)]} Level ${newLevel}!`,
            emoji: REACTIONS.levelUp.emoji,
            animation: 'super-celebrate'
        };
    },

    getSessionCompleteReaction(accuracy) {
        if (accuracy === 100) return REACTIONS.sessionComplete.perfect;
        if (accuracy >= 80) return REACTIONS.sessionComplete.great;
        if (accuracy >= 60) return REACTIONS.sessionComplete.good;
        return REACTIONS.sessionComplete.okay;
    },

    getMascotState(context) {
        switch (context) {
            case 'idle': return { emoji: '🦉', animation: 'float' };
            case 'thinking': return { emoji: '🦉', animation: 'thinking' };
            case 'happy': return { emoji: '🦉', animation: 'bounce' };
            case 'sad': return { emoji: '🦉', animation: 'shake' };
            case 'celebrate': return { emoji: '🦉', animation: 'celebrate' };
            case 'sleep': return { emoji: '🦉', animation: 'sleep' };
            default: return { emoji: '🦉', animation: 'float' };
        }
    }
};
