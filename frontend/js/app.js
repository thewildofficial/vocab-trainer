/**
 * Main Application Logic
 */
import { $, createElement, renderScreen } from './ui.js';
import { loadWords } from './data-loader.js';
import { State } from './state.js';
import { EloRating } from './elo.js';
import { Chart } from './charts.js';

// Global app variables
let allWords = [];
let quizSession = {
    queue: [],
    currentIndex: 0,
    correctCount: 0,
    xpEarned: 0
};

const elo = new EloRating();

// Sound effects mock
const Audio = {
    play(type) {
        if (!State.data.settings.sound) return;
        // In a real app, we would load Audio objects here
        console.log(`🎵 Playing sound: ${type}`);
    }
};

// --- Initialization ---
const init = async () => {
    State.load();
    allWords = await loadWords();
    renderHomeScreen();
};

// --- Navigation Helpers ---
const navTo = (screen) => {
    switch(screen) {
        case 'home': renderHomeScreen(); break;
        case 'profile': renderProfileScreen(); break;
        case 'settings': renderSettingsScreen(); break;
        case 'quiz': startQuizSession(); break;
    }
};

// --- Screens ---

const renderHomeScreen = () => {
    renderScreen('home', () => {
        const stats = State.getStats();
        
        $('#rating-display').textContent = Math.round(stats.rating);
        $('#streak-display').textContent = stats.streak;
        $('#xp-display').textContent = stats.xp;
        $('#words-learned').textContent = stats.wordsLearned;
        
        $('#start-btn').addEventListener('click', () => navTo('quiz'));
        $('#profile-btn').addEventListener('click', () => navTo('profile'));
        $('#settings-btn').addEventListener('click', () => navTo('settings'));
    });
};

const renderProfileScreen = () => {
    renderScreen('profile', () => {
        const stats = State.getStats();
        const history = State.data.historyRating || [1200]; // Ensure this exists in state
        
        $('#high-score').textContent = Math.round(Math.max(...history, 1200));
        $('#total-attempts').textContent = State.data.user.totalAttempts;
        $('#accuracy-stat').textContent = `${stats.accuracy}%`;
        
        // Render Chart
        const chartContainer = $('#elo-chart');
        Chart.renderBarChart(chartContainer, history.slice(-10)); // Last 10 sessions
        
        $('#back-home-btn').addEventListener('click', () => navTo('home'));
    });
};

const renderSettingsScreen = () => {
    renderScreen('settings', () => {
        const settings = State.data.settings;
        
        const updateToggle = (id, key) => {
            const el = $(`#${id}`);
            if (settings[key]) el.classList.add('active');
            else el.classList.remove('active');
            
            el.addEventListener('click', () => {
                settings[key] = !settings[key];
                el.classList.toggle('active');
                State.save();
            });
        };
        
        updateToggle('toggle-sound', 'sound');
        updateToggle('toggle-haptic', 'haptics');
        
        $('#reset-data-btn').addEventListener('click', () => {
            if(confirm("Are you sure? This will wipe all progress.")) {
                localStorage.clear();
                location.reload();
            }
        });
        
        $('#back-settings-btn').addEventListener('click', () => navTo('home'));
    });
};

const renderQuizScreen = () => {
    renderScreen('quiz', () => {
        const word = quizSession.queue[quizSession.currentIndex];
        
    const progress = ((quizSession.currentIndex) / quizSession.queue.length) * 100;
    $('.progress-fill').style.width = `${progress}%`;
        
    // Render word
    $('#target-word').textContent = word.word;
    $('#word-pos').textContent = word.pos;
        
    // Generate options
    const container = $('#options-container');
    container.innerHTML = '';
        
        const options = generateOptions(word);
        
        options.forEach((opt, idx) => {
            const btn = createElement('button', {
                class: 'btn btn-option',
                'data-idx': idx
            }, [
                createElement('span', { class: 'key-hint' }, `${idx + 1}`),
                createElement('span', { class: 'opt-text' }, ` ${opt.definition}`)
            ]);
            
            btn.addEventListener('click', () => handleAnswer(word, opt, btn));
            container.appendChild(btn);
        });
        
        // Key listener for 1-4
        const keyHandler = (e) => {
            if (e.key >= '1' && e.key <= '4') {
                const idx = parseInt(e.key) - 1;
                if (options[idx]) handleAnswer(word, options[idx], container.children[idx]);
            }
        };
        // Cleaner abort controller would be better here but simple override works for this scope
        document.onkeydown = keyHandler; 
        
        $('#quit-btn').addEventListener('click', () => {
            document.onkeydown = null;
            navTo('home');
        });
    });
};

// Game Logic

const startQuizSession = () => {
    const userRating = State.data.user.rating;
    
    const sorted = [...allWords].sort((a, b) => {
        return Math.abs(a.difficulty - userRating) - Math.abs(b.difficulty - userRating);
    });
    
    const candidates = sorted.slice(0, 50);
    quizSession = {
        queue: candidates.sort(() => 0.5 - Math.random()).slice(0, 10),
        currentIndex: 0,
        correctCount: 0,
        xpEarned: 0
    };
    
    renderQuizScreen();
};

const generateOptions = (correctWord) => {
    let distractors = allWords.filter(w => 
        w.word !== correctWord.word && w.pos === correctWord.pos
    );
    if (distractors.length < 3) distractors = allWords.filter(w => w.word !== correctWord.word);
    
    const selected = distractors.sort(() => 0.5 - Math.random()).slice(0, 3);
    const options = [...selected, correctWord];
    return options.sort(() => 0.5 - Math.random());
};

const handleAnswer = (targetWord, selectedOption, btnElement) => {
    if ($('.btn-option[disabled]')) return;
    
    // Disable keys
    document.onkeydown = null;
    
    const allBtns = document.querySelectorAll('.btn-option');
    allBtns.forEach(b => b.setAttribute('disabled', true));
    
    const isCorrect = selectedOption.word === targetWord.word;
    const footer = $('#feedback-area');
    const nextBtn = $('#next-btn');
    

    if (isCorrect) {
        btnElement.classList.add('correct', 'pop');
        Audio.play('correct');
        quizSession.correctCount++;
        quizSession.xpEarned += 10;
        
        footer.className = 'feedback-sheet correct';
        $('#feedback-icon').textContent = "✨";
        $('#feedback-title').textContent = "Excellent!";
        $('#feedback-detail').textContent = "";
        nextBtn.className = "btn btn-primary";
    } else {
        btnElement.classList.add('wrong', 'shake');
        Audio.play('wrong');
        
        allBtns.forEach(b => {
            if (b.textContent.includes(targetWord.definition)) {
                b.classList.add('correct');
            }
        });
        
        footer.className = 'feedback-sheet wrong';
        $('#feedback-icon').textContent = "❌";
        $('#feedback-title').textContent = "Incorrect";
        $('#feedback-detail').textContent = `Correct answer: ${targetWord.definition}`;
        nextBtn.className = "btn btn-secondary"; // Red/Gray button style
        nextBtn.style.backgroundColor = "#FF4B4B";
        nextBtn.style.color = "white";
        nextBtn.style.boxShadow = "0 4px 0 #c52424";
    }
    

    // State management
    const oldRating = State.data.user.rating;
    const newRating = elo.updateRating(oldRating, targetWord.difficulty, isCorrect);
    
    State.updateUser({ 
        rating: newRating,
        xp: State.data.user.xp + (isCorrect ? 10 : 0),
        wordsLearned: State.data.user.wordsLearned + (isCorrect ? 1 : 0)
    });
    
    // History tracking
    if (!State.data.historyRating) State.data.historyRating = [];
    State.data.historyRating.push(newRating);
    if (State.data.historyRating.length > 50) State.data.historyRating.shift();
    State.save();
    
    State.addHistory({
        word: targetWord.word,
        correct: isCorrect,
        timestamp: Date.now()
    });
    
    // Show Feedback
    footer.classList.remove('hidden');
    
    // Handle Continue
    const handleNext = () => {
        footer.classList.add('hidden');
        nextQuestion();
    };
    
    nextBtn.onclick = handleNext;
    
    // Allow Enter key to continue
    document.onkeydown = (e) => {
        if (e.key === 'Enter') handleNext();
    };
};

const nextQuestion = () => {
    quizSession.currentIndex++;
    
    if (quizSession.currentIndex >= quizSession.queue.length) {
        // End of session
        renderHomeScreen(); // Or a results screen (simplified to home for now)
        alert(`Session Complete!\nXP Earned: ${quizSession.xpEarned}\nAccuracy: ${Math.round((quizSession.correctCount/10)*100)}%`);
    } else {
        renderQuizScreen();
    }
};

// Start
init();
