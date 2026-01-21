/**
 * Data Loading & Processing
 * Loads word data from JSON file for client-side use
 */

// Fallback data if fetch fails
const FALLBACK_DATA = [
    { word: "ephemeral", definition: "lasting for a very short time", difficulty: 1200, pos: "a" },
    { word: "serendipity", definition: "occurrence of events by chance in a happy way", difficulty: 1200, pos: "n" },
    { word: "ubiquitous", definition: "present, appearing, or found everywhere", difficulty: 1300, pos: "a" }
];

/**
 * Load words from JSON file
 * @returns {Promise<Array>} Array of word objects
 */
export const loadWords = async () => {
    try {
        // Load JSON file - path relative to HTML file location
        const response = await fetch('data/words.json');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const words = await response.json();
        
        // Validate data structure
        if (!Array.isArray(words) || words.length === 0) {
            throw new Error('Invalid data format: expected non-empty array');
        }
        
        // Validate each word has required fields
        const validWords = words.filter(word => 
            word.word && word.definition && word.pos && typeof word.difficulty === 'number'
        );
        
        if (validWords.length === 0) {
            throw new Error('No valid words found in data');
        }
        
        console.log(`✅ Loaded ${validWords.length} words from JSON`);
        return validWords;
    } catch (error) {
        console.error('Failed to load word data:', error);
        console.warn('Using fallback data (limited functionality)');
        return FALLBACK_DATA;
    }
};
