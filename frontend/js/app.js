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
    const xpEl = $('#nav-xp');
    const ratingEl = $('#nav-rating');
    
    if (streakEl) streakEl.textContent = stats.streak;
    if (xpEl) xpEl.textContent = stats.xp;
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
        
        // Word difficulty badge
        if (diffBadge) {
            const diff = word.difficulty || 1200;
            if (diff < 1100) diffBadge.textContent = 'EASY';
            else if (diff < 1300) diffBadge.textContent = 'MEDIUM';
            else if (diff < 1500) diffBadge.textContent = 'HARD';
            else diffBadge.textContent = 'EXPERT';
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
    
    State.updateUser({ 
        rating: newRating,
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
        const history = State.data.historyRating || [1200];
        
        // Header stats
        const levelEl = $('#profile-level');
        const ratingEl = $('#profile-rating');
        const wordsEl = $('#profile-words');
        const rankEl = $('#profile-rank');
        
        if (levelEl) levelEl.textContent = stats.level;
        if (ratingEl) ratingEl.textContent = Math.round(stats.rating);
        if (wordsEl) wordsEl.textContent = stats.wordsLearned;
        if (rankEl) rankEl.textContent = getRankName(stats.rating);
        
        // Stats
        const highScoreEl = $('#high-score');
        const sessionsEl = $('#total-sessions');
        const attemptsEl = $('#total-attempts');
        const accuracyEl = $('#accuracy-stat');
        const maxStreakEl = $('#max-streak');
        
        if (highScoreEl) highScoreEl.textContent = Math.round(Math.max(...history, 1200));
        if (sessionsEl) sessionsEl.textContent = stats.totalSessions;
        if (attemptsEl) attemptsEl.textContent = stats.totalAttempts;
        if (accuracyEl) accuracyEl.textContent = `${stats.accuracy}%`;
        if (maxStreakEl) maxStreakEl.textContent = State.data.user.maxStreak || 0;
        
        // Chart
        const chartContainer = $('#elo-chart');
        if (chartContainer) {
            Chart.renderBarChart(chartContainer, history.slice(-10));
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
