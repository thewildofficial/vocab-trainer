# Vocab Trainer - Adaptive Vocabulary Learning

An adaptive vocabulary learning web application that uses the Elo rating system to match users with words at their skill level. Built with vanilla JavaScript, HTML5, and CSS3.

## Problem Statement

Learning vocabulary efficiently requires practice at the right difficulty level. Too easy, and you're not challenged. Too hard, and you get discouraged. This application solves this problem by using an Elo rating system (similar to chess rankings) to adaptively match users with vocabulary words that match their current skill level. The system quickly converges to your true vocabulary level within 10-15 questions, then continuously adjusts as you learn.

## Features Implemented

### Core Functionality
- **Adaptive Quiz System**: Elo-based difficulty matching that adapts to your skill level
- **Interactive Quiz Interface**: Multiple-choice questions with 4 options per word
- **Real-time Feedback**: Immediate visual and textual feedback on correct/incorrect answers
- **Progress Tracking**: Track your Elo rating, XP, level, and streak over time
- **Statistics Dashboard**: View detailed statistics including accuracy, total attempts, and rating history
- **Proficiency Assessment**: See your vocabulary level (Novice to Master) based on Elo rating
- **Persistent State**: All progress saved to browser LocalStorage

### User Experience
- **Multiple Screens**: Home, Quiz, Summary, Profile, and Settings screens
- **Keyboard Shortcuts**: Use number keys (1-4) to select answers quickly
- **Visual Feedback**: Color-coded difficulty indicators, progress bars, and animations
- **Dark Mode**: Toggle between light and dark themes
- **Sound Effects**: Optional audio feedback for interactions
- **Responsive Design**: Works on desktop and mobile devices

## DOM Concepts Used

### Dynamic Element Creation
- **`createElement()`**: Creates DOM elements programmatically (quiz options, toast notifications, confetti effects)
- **`appendChild()`**: Dynamically adds elements to the DOM (options list, navigation items)
- **`innerHTML`**: Clears and updates container content (screen rendering, option lists)
- **`cloneNode()`**: Clones template content for screen rendering

### DOM Manipulation & Updates
- **`classList.add/remove/toggle()`**: Dynamically applies CSS classes for styling (difficulty indicators, active states, feedback states)
- **`textContent`**: Updates text content dynamically (word definitions, statistics, ratings)
- **`setAttribute()`**: Sets element attributes programmatically (disabled states, data attributes)
- **`style` property**: Direct style manipulation for dynamic visual feedback (progress bars, button states)

### Event Handling
- **`addEventListener()`**: Attaches event handlers to elements (click events, keyboard events)
- **Event Delegation**: Navigation links use data attributes and event delegation for efficient handling
- **Keyboard Events**: `document.onkeydown` for keyboard shortcuts (1-4 for answer selection)
- **Form Events**: Button clicks trigger quiz flow and navigation

### Template System
- **HTML Templates**: Uses `<template>` elements for screen structure (home, quiz, summary, profile, settings)
- **Template Cloning**: `template.content.cloneNode(true)` to render screens dynamically
- **Dynamic Screen Rendering**: Single-page application pattern with template-based rendering

### State-Driven UI Updates
- **Conditional Rendering**: JavaScript logic determines which elements to show/hide based on state
- **Real-time Updates**: DOM updates reflect state changes immediately (rating changes, streak updates, progress bars)
- **LocalStorage Integration**: State persistence drives UI restoration on page reload

## Technology Stack

- **HTML5**: Semantic markup with template elements
- **CSS3**: Modern styling with Flexbox, Grid, CSS variables, and animations
- **Vanilla JavaScript (ES6+)**: No frameworks or libraries
- **Browser APIs**: 
  - LocalStorage for state persistence
  - Fetch API for loading word data
  - DOM APIs for manipulation

## Project Structure

```
frontend/
├── index.html          # Main HTML file with templates
├── css/
│   ├── styles.css      # Main stylesheet
│   └── animations.css  # Animation definitions
└── js/
    ├── app.js          # Main application logic
    ├── state.js        # State management with LocalStorage
    ├── elo.js          # Elo rating algorithm
    ├── ui.js           # DOM manipulation utilities
    ├── charts.js       # Chart rendering for statistics
    ├── data-loader.js  # Word data loading
    ├── audio.js        # Audio feedback system
    └── mascot.js       # Mascot reactions and messages
```

## Steps to Run the Project

### Local Development

1. **Clone or download the repository**
   ```bash
   git clone <repository-url>
   cd vocab-trainer
   ```

2. **Navigate to the frontend directory**
   ```bash
   cd frontend
   ```

3. **Open in a web browser**
   - Simply open `index.html` in a modern web browser (Chrome, Firefox, Safari, Edge)
   - Or use a local server:
     ```bash
     # Using Python 3
     python -m http.server 8000
     
     # Using Node.js (if you have http-server installed)
     npx http-server -p 8000
     ```
   - Then visit `http://localhost:8000` in your browser

4. **Start Learning!**
   - Click "Start Practice" on the home screen
   - Answer questions by clicking options or using keyboard shortcuts (1-4)
   - View your progress in the Profile section
   - Customize settings in the Settings screen

### Deploy to Netlify

The project is configured for easy deployment on Netlify:

1. **Push your code to GitHub**
   ```bash
   git add .
   git commit -m "Ready for Netlify deployment"
   git push origin main
   ```

2. **Deploy on Netlify**
   - Go to [Netlify](https://www.netlify.com/)
   - Click "New site from Git"
   - Connect your GitHub repository
   - Configure build settings:
     - **Base directory**: Leave empty (or set to root `/`)
     - **Publish directory**: `frontend`
     - **Build command**: Leave empty (or set to `""`)
   - Click "Deploy site"

3. **That's it!** Your site will be live with all 20,000+ words loaded client-side.

**Note**: The `netlify.toml` file is already configured to skip Python dependencies. If Netlify tries to install Python packages, make sure:
   - Build command is empty in Netlify dashboard
   - Publish directory is set to `frontend`
   - The `netlify.toml` file is in your repository root

**Note**: The `netlify.toml` file is already configured with:
- Publish directory set to `frontend`
- SPA routing redirects (all routes → `index.html`)
- No build step required (static site)

## How It Works

1. **Initial Rating**: New users start with an Elo rating of 1200
2. **Word Selection**: The system selects words with difficulty ratings close to your current Elo rating
3. **Answer Processing**: When you answer:
   - Correct answers increase your rating (more for harder words)
   - Incorrect answers decrease your rating
   - The system tracks your accuracy and adjusts accordingly
4. **Adaptive Learning**: After 10-15 questions, the system converges to your true vocabulary level
5. **Continuous Improvement**: As you learn, your rating increases, and you're presented with more challenging words

## Known Limitations

- **Word Database**: Currently uses a curated set of ~20,000 words. Some very rare words may not be included.
- **Browser Compatibility**: Requires modern browser with ES6+ support and LocalStorage API
- **No Backend**: All data is stored locally in the browser. Clearing browser data will reset progress.
- **Single Language**: Currently supports English vocabulary only
- **No Offline Word Data**: Word definitions are loaded from a JSON file. Requires initial data load.

## Code Quality

- **Modular Structure**: Code is organized into logical modules (state, UI, Elo, charts)
- **Separation of Concerns**: Clear separation between UI, state management, and business logic
- **Comments**: Key functions and complex logic are documented
- **Error Handling**: Basic error handling for missing elements and edge cases
- **Clean Code**: Follows clean code principles with meaningful variable names and single-responsibility functions

## License

MIT
