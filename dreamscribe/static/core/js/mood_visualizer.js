/**
 * Dreamscribe AI - Mood Visualizer
 * 
 * This script handles the visualization of character moods in the UI.
 * It updates element classes and styles based on character mood changes.
 */

/**
 * Initialize the mood visualizer
 * 
 * @param {number} characterId - The ID of the character to monitor
 * @param {object} options - Configuration options
 * @param {string} options.initialMood - The initial mood of the character
 * @param {number} options.initialIntensity - The initial intensity of the character's mood (0-100)
 * @param {number} options.updateInterval - Interval in milliseconds to check for mood updates (default: 10000)
 * @returns {object} - The mood visualizer instance
 */
function initMoodVisualizer(characterId, options = {}) {
    const defaults = {
        initialMood: 'neutral',
        initialIntensity: 50,
        updateInterval: 10000, // 10 seconds
    };
    
    const config = { ...defaults, ...options };
    
    // State
    let currentMood = config.initialMood;
    let currentIntensity = config.initialIntensity;
    let updateTimer = null;
    
    // Elements to update
    const moodElements = document.querySelectorAll(`.mood-${currentMood}`);
    const moodIndicators = document.querySelectorAll('.mood-indicator');
    const moodBadges = document.querySelectorAll('.mood-badge');
    
    // Color mappings
    const moodColors = {
        neutral: '#A0A0A0',  // Gray
        happy: '#FFD700',    // Gold
        sad: '#6495ED',      // Cornflower Blue
        angry: '#FF4500',    // Red-Orange
        fearful: '#800080',  // Purple
        curious: '#32CD32',  // Lime Green
        excited: '#FF1493',  // Deep Pink
        thoughtful: '#4682B4', // Steel Blue
        confused: '#FF8C00',  // Dark Orange
    };
    
    /**
     * Update the mood visualization based on current mood and intensity
     */
    function updateMoodVisuals() {
        // Update mood classes on elements
        moodElements.forEach(el => {
            // Remove all mood classes
            Object.keys(moodColors).forEach(mood => {
                el.classList.remove(`mood-${mood}`);
            });
            
            // Add current mood class
            el.classList.add(`mood-${currentMood}`);
            
            // Apply custom styles based on intensity
            if (currentMood !== 'neutral') {
                const color = moodColors[currentMood] || moodColors.neutral;
                const opacity = Math.max(0.2, Math.min(0.8, currentIntensity / 100));
                
                // Apply a subtle glow effect based on mood and intensity
                el.style.boxShadow = `0 0 ${Math.round(currentIntensity / 10)}px ${color}`;
                
                // For avatar elements, add a slight border color
                if (el.classList.contains('character-avatar') || el.classList.contains('chat-avatar')) {
                    el.style.borderColor = color;
                }
            } else {
                // Reset styles for neutral mood
                el.style.boxShadow = '';
                el.style.borderColor = '';
            }
        });
        
        // Update mood indicators
        moodIndicators.forEach(indicator => {
            if (currentMood === 'neutral') {
                indicator.style.display = 'none';
            } else {
                indicator.style.display = 'inline-block';
                indicator.style.backgroundColor = moodColors[currentMood];
                
                // Pulsing animation based on intensity
                const animationDuration = Math.max(1.5, 4 - (currentIntensity / 33)); // 1.5s to 4s
                indicator.style.animation = `pulse ${animationDuration}s infinite`;
            }
        });
        
        // Update mood badges
        moodBadges.forEach(badge => {
            const moodText = badge.textContent.trim().toLowerCase();
            if (moodText === currentMood) {
                badge.style.display = 'inline-flex';
                badge.style.backgroundColor = `rgba(${hexToRgb(moodColors[currentMood])}, 0.1)`;
                badge.style.color = moodColors[currentMood];
                
                const iconElement = badge.querySelector('.mood-badge-icon');
                if (iconElement) {
                    iconElement.style.backgroundColor = moodColors[currentMood];
                }
            } else {
                badge.style.display = 'none';
            }
        });
        
        // Update any mood intensity indicators
        const intensityBars = document.querySelectorAll('.mood-intensity-bar');
        intensityBars.forEach(bar => {
            const fillElement = bar.querySelector('.mood-intensity-fill');
            if (fillElement) {
                fillElement.style.width = `${currentIntensity}%`;
                fillElement.style.backgroundColor = moodColors[currentMood];
            }
        });
    }
    
    /**
     * Convert hex color to RGB
     */
    function hexToRgb(hex) {
        // Remove # if present
        hex = hex.replace('#', '');
        
        // Parse the hex values
        const r = parseInt(hex.substring(0, 2), 16);
        const g = parseInt(hex.substring(2, 4), 16);
        const b = parseInt(hex.substring(4, 6), 16);
        
        return `${r}, ${g}, ${b}`;
    }
    
    /**
     * Check for mood updates from the server
     */
    function checkMoodUpdates() {
        fetch(`/api/characters/${characterId}/mood`)
            .then(response => response.json())
            .then(data => {
                if (data.mood !== currentMood || data.intensity !== currentIntensity) {
                    currentMood = data.mood;
                    currentIntensity = data.intensity;
                    updateMoodVisuals();
                }
            })
            .catch(error => {
                console.error('Error checking mood updates:', error);
            });
    }
    
    // Initial update
    updateMoodVisuals();
    
    // Set up periodic updates
    if (config.updateInterval > 0) {
        updateTimer = setInterval(checkMoodUpdates, config.updateInterval);
    }
    
    // Public API
    return {
        getCurrentMood: () => currentMood,
        getCurrentIntensity: () => currentIntensity,
        updateMood: (mood, intensity) => {
            currentMood = mood;
            currentIntensity = intensity;
            updateMoodVisuals();
        },
        stopUpdates: () => {
            if (updateTimer) {
                clearInterval(updateTimer);
                updateTimer = null;
            }
        }
    };
}

// Make the function available globally
window.initMoodVisualizer = initMoodVisualizer;
window.updateCharacterMood = function(mood, intensity) {
    // This function can be called from AJAX responses to update the mood without waiting
    // for the regular update interval
    if (window.moodVisualizer) {
        window.moodVisualizer.updateMood(mood, intensity);
    }
};