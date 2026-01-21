/**
 * Vocab Trainer - Web-First Application
 * Duolingo-inspired vocabulary learning with Elo rating system
 */

import { $, createElement, renderScreen } from './ui.js';
import { loadWords } from './data-loader.js';
import { State } from './state.js';
import { EloRating } from './elo.js';
import { Chart } from './charts.js';

// ============================================
// GLOBAL STATE
// ============================================

let allWords = [];
let quizSession = {
    queue: [],
    currentIndex: 0,
    correctCount: 0,
    xpEarned: 0,
    currentStreak: 0,
    maxStreak: 0,
    startRating: 0
};

const elo = new EloRating();

// ============================================
// PROFICIENCY LEVELS
// ============================================

const PROFICIENCY_LEVELS = [
    { 
        min: 0, max: 1100, 
        title: 'Novice', 
        icon: '🌱', 
        description: 'Your Elo rating suggests you\'re working with foundational vocabulary—the most common ~3,000 words that make up 95% of everyday English. Words at this level appear frequently in basic texts and conversations. Our system will focus on high-frequency words until your accuracy improves.',
        lexicon: 'Estimated vocabulary: ~3,000-5,000 words'
    },
    { 
        min: 1100, max: 1250, 
        title: 'Beginner', 
        icon: '📚', 
        description: 'At this rating, you consistently answer correctly on common vocabulary and are beginning to handle words from the ~5,000-8,000 frequency range. These words appear in newspapers, basic literature, and professional communication. You\'re matching words that most native speakers learn by age 12.',
        lexicon: 'Estimated vocabulary: ~5,000-8,000 words'
    },
    { 
        min: 1250, max: 1400, 
        title: 'Intermediate', 
        icon: '📖', 
        description: 'Your rating indicates reliable accuracy on mid-frequency vocabulary (~8,000-12,000 range). You\'re handling words found in quality journalism, academic texts, and professional contexts. Our Elo system predicts you can correctly identify words that appear once per 100,000 written words.',
        lexicon: 'Estimated vocabulary: ~8,000-12,000 words'
    },
    { 
        min: 1400, max: 1550, 
        title: 'Advanced', 
        icon: '🎯', 
        description: 'At this level, you\'re successfully tackling low-frequency vocabulary (~12,000-18,000 range)—words many educated adults struggle with. Your Elo predicts ~70% accuracy on words appearing once per million in written English. This includes specialized academic and literary vocabulary.',
        lexicon: 'Estimated vocabulary: ~12,000-18,000 words'
    },
    { 
        min: 1550, max: 1700, 
        title: 'Expert', 
        icon: '🏆', 
        description: 'Your rating places you in the top tier. You\'re accurately identifying rare vocabulary (~18,000-25,000 range)—words most native speakers never encounter. Our system predicts you can handle technical jargon, archaic terms, and words from specialized domains like medicine, law, or academia.',
        lexicon: 'Estimated vocabulary: ~18,000-25,000 words'
    },
    { 
        min: 1700, max: 9999, 
        title: 'Master', 
        icon: '👑', 
        description: 'Exceptional. Your Elo indicates mastery over the most obscure English vocabulary—words appearing less than once per 10 million written words. You\'re operating at the level of lexicographers and word-game champions. Our 20,000+ word database has few challenges left for you.',
        lexicon: 'Estimated vocabulary: 25,000+ words'
    }
];

const getProficiency = (rating) => {
    return PROFICIENCY_LEVELS.find(l => rating >= l.min && rating < l.max) || PROFICIENCY_LEVELS[0];
};

const getLevelTitle = (level) => {
    const titles = ['Beginner', 'Explorer', 'Student', 'Scholar', 'Expert', 'Master', 'Legend'];
    return titles[Math.min(level - 1, titles.length - 1)];
};

// ============================================
// AUDIO SYSTEM
// ============================================

const Audio = {
    play(type) {
        if (!State.data.settings.sound) return;
        // Sound effects would be loaded here
        console.log(`🔊 ${type}`);
    }
};

// ============================================
// TOAST NOTIFICATIONS
// ============================================

const Toast = {
    show({ title, message, icon = '🎉', type = '' }) {
        const container = $('#toast-container');
        if (!container) return;
        
        const toast = createElement('div', { class: `toast ${type}` });
        toast.innerHTML = `
            <div class="toast-icon">${icon}</div>
            <div class="toast-content">
                <div class="toast-title">${title}</div>
                <div class="toast-message">${message}</div>
            </div>
        `;
        
        container.appendChild(toast);
        
        // Remove after animation
        setTimeout(() => toast.remove(), 3000);
    },
    
    levelUp(newLevel) {
        this.show({
            title: `Level ${newLevel}! 🎉`,
            message: getLevelTitle(newLevel),
            icon: '⬆️',
            type: 'level-up'
        });
    }
};

// ============================================
// VISUAL EFFECTS
// ============================================

const Effects = {
    confetti() {
        const container = createElement('div', { class: 'confetti-container' });
        const colors = ['#58CC02', '#1CB0F6', '#FFC800', '#FF4B4B', '#CE82FF'];
        
        for (let i = 0; i < 50; i++) {
            const piece = createElement('div', { class: 'confetti-piece' });
            piece.style.left = `${Math.random() * 100}%`;
            piece.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
            piece.style.animationDelay = `${Math.random() * 0.5}s`;
            piece.style.animationDuration = `${2 + Math.random() * 2}s`;
            container.appendChild(piece);
        }
        
        document.body.appendChild(container);
        setTimeout(() => container.remove(), 4000);
    }
};

// ============================================
// INITIALIZATION
// ============================================

const init = async () => {
    console.log('🚀 Vocab Trainer initializing...');
    
    State.load();
    allWords = await loadWords();
    
    console.log(`📚 Loaded ${allWords.length} words`);
    
    // Apply saved theme
    applyTheme();
    
    // Setup navigation
    setupNavigation();
    
    // Update nav stats
    updateNavStats();
    
    // Render home screen
    renderHomeScreen();
};

const applyTheme = () => {
    const isDark = State.data.settings.darkMode;
    document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
};

const setupNavigation = () => {
    // Nav links
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', () => {
            const target = link.dataset.target;
            if (target) navTo(target);
        });
    });
    
    // Brand click goes home
    const brand = document.querySelector('.nav-brand');
    if (brand) {
        brand.addEventListener('click', (e) => {
            e.preventDefault();
            navTo('home');
        });
    }
};

const updateNavStats = () => {
    const stats = State.getStats();
    
    const streakEl = $('#nav-streak');
    const ratingEl = $('#nav-rating');
    
    if (streakEl) streakEl.textContent = stats.streak;
    if (ratingEl) ratingEl.textContent = Math.round(stats.rating);
};

// ============================================
// NAVIGATION
// ============================================

const navTo = (screen) => {
    // Hide nav during quiz
    const mainNav = $('#main-nav');
    if (mainNav) {
        mainNav.style.display = (screen === 'quiz' || screen === 'summary') ? 'none' : 'flex';
    }
    
    // Update active nav link
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.toggle('active', link.dataset.target === screen);
    });
    
    switch(screen) {
        case 'home': renderHomeScreen(); break;
        case 'profile': renderProfileScreen(); break;
        case 'settings': renderSettingsScreen(); break;
        case 'quiz': startQuizSession(); break;
        case 'summary': renderSummaryScreen(); break;
    }
};

// ============================================
// HOME SCREEN
// ============================================

const renderHomeScreen = () => {
    renderScreen('home', () => {
        const stats = State.getStats();
        
        // Update greeting based on time/streak
        const greeting = $('#hero-greeting');
        if (greeting) {
            const hour = new Date().getHours();
            if (stats.streak > 0) {
                greeting.textContent = `🔥 ${stats.streak} day streak!`;
            } else if (hour < 12) {
                greeting.textContent = "Good morning! Ready to learn?";
            } else if (hour < 17) {
                greeting.textContent = "Let's build your vocabulary!";
            } else {
                greeting.textContent = "Evening practice time!";
            }
        }
        
        // Start button
        const startBtn = $('#start-btn');
        if (startBtn) {
            startBtn.addEventListener('click', () => navTo('quiz'));
        }
        
        // Skill node click
        const lessonNode = $('#start-lesson-node');
        if (lessonNode) {
            lessonNode.addEventListener('click', () => navTo('quiz'));
        }
    });
    
    updateNavStats();
};

// ============================================
// QUIZ SCREEN
// ============================================

const startQuizSession = () => {
    const userRating = State.data.user.rating;
    
    // Initialize rating history if empty
    if (!State.data.historyRating || State.data.historyRating.length === 0) {
        State.data.historyRating = [userRating];
                State.save();
    }
    
    // Sort words by proximity to user rating
    const sorted = [...allWords].sort((a, b) => {
        return Math.abs(a.difficulty - userRating) - Math.abs(b.difficulty - userRating);
    });
    
    // Pick from top 50 closest, then randomize
    const candidates = sorted.slice(0, 50);
    quizSession = {
        queue: candidates.sort(() => 0.5 - Math.random()).slice(0, 10),
        currentIndex: 0,
        correctCount: 0,
        xpEarned: 0,
        currentStreak: 0,
        maxStreak: 0,
        startRating: userRating
    };
    
    renderQuizScreen();
};

const renderQuizScreen = () => {
    renderScreen('quiz', () => {
        const word = quizSession.queue[quizSession.currentIndex];
        const totalQuestions = quizSession.queue.length;
        
        // Update progress bar
        const progress = (quizSession.currentIndex / totalQuestions) * 100;
        const progressFill = $('#quiz-progress-fill');
        if (progressFill) {
            setTimeout(() => progressFill.style.width = `${progress}%`, 50);
        }
        
    // Render word
        const targetWord = $('#target-word');
        const wordPos = $('#word-pos');
        const diffBadge = $('#word-difficulty');
        
        if (targetWord) targetWord.textContent = word.word;
        if (wordPos) wordPos.textContent = word.pos || 'word';
        
        // Word difficulty badge and card color
        const diff = word.difficulty || 1200;
        let difficultyClass = '';
        let difficultyText = '';
        
        if (diff < 1100) {
            difficultyClass = 'difficulty-easy';
            difficultyText = 'EASY';
        } else if (diff < 1300) {
            difficultyClass = 'difficulty-medium';
            difficultyText = 'MEDIUM';
        } else if (diff < 1500) {
            difficultyClass = 'difficulty-hard';
            difficultyText = 'HARD';
        } else {
            difficultyClass = 'difficulty-expert';
            difficultyText = 'EXPERT';
        }
        
        // Apply difficulty class to word display card
        // Find element within screen container to ensure we get the right one
        const screenContainer = $('#screen-container');
        const wordDisplay = screenContainer ? screenContainer.querySelector('.word-display') : document.querySelector('.word-display');
        
        if (wordDisplay) {
            // Remove all difficulty classes
            wordDisplay.classList.remove('difficulty-easy', 'difficulty-medium', 'difficulty-hard', 'difficulty-expert');
            // Add current difficulty class
            wordDisplay.classList.add(difficultyClass);
            console.log('Applied difficulty class:', difficultyClass, 'to element:', wordDisplay);
        } else {
            console.warn('Word display element not found!');
        }
        
        if (diffBadge) {
            diffBadge.textContent = difficultyText;
        }
        
    // Generate options
    const container = $('#options-container');
        if (!container) return;
    container.innerHTML = '';
        
        const options = generateOptions(word);
        
        options.forEach((opt, idx) => {
            const btn = createElement('button', {
                class: 'option-btn',
                'data-idx': idx
            }, [
                createElement('span', { class: 'option-key' }, `${idx + 1}`),
                createElement('span', { class: 'option-text' }, opt.definition)
            ]);
            
            btn.addEventListener('click', () => handleAnswer(word, opt, btn));
            container.appendChild(btn);
        });
        
        // Keyboard shortcuts
        document.onkeydown = (e) => {
            if (e.key >= '1' && e.key <= '4') {
                const idx = parseInt(e.key) - 1;
                if (options[idx]) {
                    handleAnswer(word, options[idx], container.children[idx]);
                }
            }
        };
        
        // Quit button
        const quitBtn = $('#quit-btn');
        if (quitBtn) {
            quitBtn.addEventListener('click', () => {
            document.onkeydown = null;
            navTo('home');
        });
        }
    });
};

const generateOptions = (correctWord) => {
    let distractors = allWords.filter(w => 
        w.word !== correctWord.word && w.pos === correctWord.pos
    );
    
    if (distractors.length < 3) {
        distractors = allWords.filter(w => w.word !== correctWord.word);
    }
    
    const selected = distractors.sort(() => 0.5 - Math.random()).slice(0, 3);
    const options = [...selected, correctWord];
    return options.sort(() => 0.5 - Math.random());
};

const handleAnswer = (targetWord, selectedOption, btnElement) => {
    // Prevent double-click
    if (document.querySelector('.option-btn[disabled]')) return;
    
    document.onkeydown = null;
    
    const allBtns = document.querySelectorAll('.option-btn');
    allBtns.forEach(b => b.setAttribute('disabled', 'true'));
    
    const isCorrect = selectedOption.word === targetWord.word;
    const footer = $('#feedback-area');
    const nextBtn = $('#next-btn');

    if (isCorrect) {
        btnElement.classList.add('correct');
        Audio.play('correct');
        
        quizSession.correctCount++;
        quizSession.xpEarned += 10;
        quizSession.currentStreak++;
        
        if (quizSession.currentStreak > quizSession.maxStreak) {
            quizSession.maxStreak = quizSession.currentStreak;
        }
        
        // Streak bonus
        if (quizSession.currentStreak >= 3) {
            quizSession.xpEarned += 5;
        }
        
        footer.className = 'feedback-bar correct';
        $('#feedback-icon').textContent = "✨";
        $('#feedback-title').textContent = getCorrectPhrase();
        $('#feedback-detail').textContent = "";
        nextBtn.className = "btn btn-primary";
        
    } else {
        btnElement.classList.add('wrong');
        Audio.play('wrong');
        
        quizSession.currentStreak = 0;
        
        // Highlight correct answer
        allBtns.forEach(b => {
            const optText = b.querySelector('.option-text');
            if (optText && optText.textContent === targetWord.definition) {
                b.classList.add('correct');
            }
        });
        
        footer.className = 'feedback-bar wrong';
        $('#feedback-icon').textContent = "😅";
        $('#feedback-title').textContent = "Not quite!";
        $('#feedback-detail').textContent = `Correct: ${targetWord.definition}`;
        nextBtn.className = "btn";
        nextBtn.style.background = "var(--color-error)";
        nextBtn.style.color = "white";
        nextBtn.style.boxShadow = "0 4px 0 var(--color-error-shadow)";
    }
    
    // Update Elo rating
    const oldRating = State.data.user.rating;
    const newRating = elo.updateRating(oldRating, targetWord.difficulty, isCorrect);
    
    // Update rating and track in history (always track to show progression)
    State.updateRating(newRating);
    
    // Update XP
    State.updateUser({ 
        xp: State.data.user.xp + (isCorrect ? 10 : 0)
    });
    
    State.trackWordAttempt(targetWord.word, isCorrect);
    
    // Show Feedback
    footer.classList.remove('hidden');
    
    const handleNext = () => {
        footer.classList.add('hidden');
        nextQuestion();
    };
    
    nextBtn.onclick = handleNext;
    
    document.onkeydown = (e) => {
        if (e.key === 'Enter') handleNext();
    };
};

const getCorrectPhrase = () => {
    const phrases = ["Excellent!", "Perfect!", "Amazing!", "Correct!", "Brilliant!", "Nice!"];
    return phrases[Math.floor(Math.random() * phrases.length)];
};

const nextQuestion = () => {
    quizSession.currentIndex++;
    
    if (quizSession.currentIndex >= quizSession.queue.length) {
        finishQuizSession();
    } else {
        renderQuizScreen();
    }
};

const finishQuizSession = () => {
    document.onkeydown = null;
    
    // Ensure final rating is saved to history
    const finalRating = State.data.user.rating;
    if (!State.data.historyRating.includes(finalRating)) {
        State.updateRating(finalRating);
    }
    
    State.completeLesson({
        correct: quizSession.correctCount,
        total: quizSession.queue.length,
        xpEarned: quizSession.xpEarned,
        maxStreak: quizSession.maxStreak
    });
    
    navTo('summary');
};

// ============================================
// SUMMARY SCREEN
// ============================================

const renderSummaryScreen = () => {
    renderScreen('summary', () => {
        const stats = State.getStats();
        const accuracy = Math.round((quizSession.correctCount / quizSession.queue.length) * 100);
        const ratingChange = Math.round(stats.rating - quizSession.startRating);
        
        // Confetti for good performance
        if (accuracy >= 70) {
            setTimeout(() => Effects.confetti(), 300);
        }
        
        // Animate XP count
        const xpAmount = $('#xp-amount');
        if (xpAmount) {
            animateNumber(xpAmount, 0, quizSession.xpEarned, 1000);
        }
        
        // Update stats
        const accuracyEl = $('#summary-accuracy');
        const correctEl = $('#summary-correct');
        const ratingEl = $('#summary-rating-change');
        const streakEl = $('#summary-streak');
        
        if (accuracyEl) accuracyEl.textContent = `${accuracy}%`;
        if (correctEl) correctEl.textContent = `${quizSession.correctCount}/${quizSession.queue.length}`;
        if (ratingEl) {
            ratingEl.textContent = ratingChange >= 0 ? `+${ratingChange}` : `${ratingChange}`;
            ratingEl.style.color = ratingChange >= 0 ? 'var(--color-primary)' : 'var(--color-error)';
        }
        if (streakEl) streakEl.textContent = quizSession.maxStreak;
        
        // Dynamic title
        const title = $('#summary-title');
        const subtitle = $('#summary-subtitle');
        if (accuracy === 100) {
            if (title) title.textContent = "Perfect! 🌟";
            if (subtitle) subtitle.textContent = "Flawless performance!";
        } else if (accuracy >= 80) {
            if (title) title.textContent = "Excellent!";
            if (subtitle) subtitle.textContent = "You're on fire!";
        } else if (accuracy >= 60) {
            if (title) title.textContent = "Good job!";
            if (subtitle) subtitle.textContent = "Keep practicing!";
        } else {
            if (title) title.textContent = "Nice try!";
            if (subtitle) subtitle.textContent = "Practice makes perfect!";
        }
        
        $('#continue-btn')?.addEventListener('click', () => navTo('home'));
        $('#review-btn')?.addEventListener('click', () => navTo('home'));
    });
};

const animateNumber = (element, start, end, duration) => {
    const startTime = performance.now();
    const update = (currentTime) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        element.textContent = Math.round(start + (end - start) * eased);
        if (progress < 1) requestAnimationFrame(update);
    };
    requestAnimationFrame(update);
};

// ============================================
// PROFILE SCREEN
// ============================================

const renderProfileScreen = () => {
    renderScreen('profile', () => {
        const stats = State.getStats();
        let history = State.getRatingHistory(20);
        if ((!history || history.length === 0) && Array.isArray(State.data.historySessions)) {
            history = State.data.historySessions
                .map(session => session.rating)
                .filter(rating => typeof rating === 'number');
        }
        const proficiency = getProficiency(stats.rating);
        
        // Header stats
        const levelEl = $('#profile-level');
        const ratingEl = $('#profile-rating');
        const wordsEl = $('#profile-words');
        const rankEl = $('#profile-rank');
        
        if (levelEl) levelEl.textContent = stats.level;
        if (ratingEl) ratingEl.textContent = Math.round(stats.rating);
        if (wordsEl) wordsEl.textContent = stats.wordsLearned;
        if (rankEl) rankEl.textContent = proficiency.title;
        
        // Proficiency card
        const profIcon = $('#proficiency-icon');
        const profTitle = $('#proficiency-title');
        const profRating = $('#proficiency-rating');
        const profDesc = $('#proficiency-description');
        const profLexicon = $('#proficiency-lexicon');
        const profLevels = $('#proficiency-levels');
        
        if (profIcon) profIcon.textContent = proficiency.icon;
        if (profTitle) profTitle.textContent = proficiency.title;
        if (profRating) profRating.textContent = Math.round(stats.rating);
        if (profDesc) profDesc.textContent = proficiency.description;
        if (profLexicon) profLexicon.textContent = proficiency.lexicon;
        
        // Update proficiency level indicators
        if (profLevels) {
            const currentIndex = PROFICIENCY_LEVELS.indexOf(proficiency);
            profLevels.querySelectorAll('.proficiency-level').forEach((el, i) => {
                el.classList.remove('active', 'completed');
                if (i < currentIndex) {
                    el.classList.add('completed');
                } else if (i === currentIndex) {
                    el.classList.add('active');
                }
            });
        }
        
        // Stats
        const highScoreEl = $('#high-score');
        const sessionsEl = $('#total-sessions');
        const attemptsEl = $('#total-attempts');
        const accuracyEl = $('#accuracy-stat');
        const maxStreakEl = $('#max-streak');
        
        const maxRating = history.length > 0 ? Math.max(...history) : stats.rating;
        if (highScoreEl) highScoreEl.textContent = Math.round(maxRating);
        if (sessionsEl) sessionsEl.textContent = stats.totalSessions;
        if (attemptsEl) attemptsEl.textContent = stats.totalAttempts;
        if (accuracyEl) accuracyEl.textContent = `${stats.accuracy}%`;
        if (maxStreakEl) maxStreakEl.textContent = State.data.user.maxStreak || 0;
        
        // Chart - use line chart for rating history
        const chartContainer = $('#elo-chart');
        if (chartContainer) {
            // Show chart if we have at least 2 data points (need 2 for a line)
            if (history.length >= 2) {
                Chart.renderLineChart(chartContainer, history.slice(-20), { height: 150 });
            } else {
                // If we only have 1 point, show it as a single value
                chartContainer.innerHTML = `
                    <div style="text-align: center; padding: 40px 20px;">
                        <div style="font-size: 32px; font-weight: 800; color: var(--color-secondary); margin-bottom: 8px;">
                            ${Math.round(stats.rating)}
                        </div>
                        <div style="font-size: 14px; color: var(--color-text-light);">
                            Complete another session to see your rating trend
                        </div>
                    </div>
                `;
            }
        }
    });
};

const getRankName = (rating) => {
    if (rating < 1000) return 'Novice';
    if (rating < 1200) return 'Beginner';
    if (rating < 1400) return 'Intermediate';
    if (rating < 1600) return 'Advanced';
    if (rating < 1800) return 'Expert';
    if (rating < 2000) return 'Master';
    return 'Grandmaster';
};

// ============================================
// SETTINGS SCREEN
// ============================================

const renderSettingsScreen = () => {
    renderScreen('settings', () => {
        const settings = State.data.settings;
        
        const setupToggle = (id, key, onChange) => {
            const el = $(`#${id}`);
            if (!el) return;
            
            if (settings[key]) el.classList.add('active');
            
            el.addEventListener('click', () => {
                settings[key] = !settings[key];
                el.classList.toggle('active');
                State.save();
                if (onChange) onChange(settings[key]);
            });
        };
        
        // Dark mode toggle with theme application
        setupToggle('toggle-dark-mode', 'darkMode', (isDark) => {
            document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
        });
        
        setupToggle('toggle-sound', 'sound');
        setupToggle('toggle-haptic', 'haptics');
        
        $('#reset-data-btn')?.addEventListener('click', () => {
            if (confirm("Reset all progress? This cannot be undone.")) {
                localStorage.clear();
                location.reload();
            }
        });
    });
};

// ============================================
// START
// ============================================

init();
