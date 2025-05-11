/**
 * Dreamscribe AI - Character Mood Visualizer
 * 
 * This utility provides dynamic UI color changes based on character mood states
 */

class MoodVisualizer {
    constructor(characterId, options = {}) {
        this.characterId = characterId;
        this.options = {
            updateInterval: options.updateInterval || 10000, // 10 seconds by default
            elements: options.elements || {}, // Elements to update
            onMoodChange: options.onMoodChange || null, // Callback when mood changes
            initialMood: options.initialMood || 'neutral',
            initialIntensity: options.initialIntensity || 50,
            apiEndpoint: `/api/character/${characterId}/mood/`,
        };
        
        this.currentMood = this.options.initialMood;
        this.currentIntensity = this.options.initialIntensity;
        this.colors = {};
        this.interval = null;
        
        this.init();
    }
    
    init() {
        // Initial fetch
        this.fetchMoodData();
        
        // Set up interval for regular updates
        if (this.options.updateInterval > 0) {
            this.interval = setInterval(() => {
                this.fetchMoodData();
            }, this.options.updateInterval);
        }
        
        // Set up event listeners
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'visible') {
                this.fetchMoodData(); // Update immediately when tab becomes visible
            }
        });
    }
    
    fetchMoodData() {
        fetch(this.options.apiEndpoint)
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    const newMood = data.mood;
                    const newIntensity = data.intensity;
                    
                    // Only update if mood or intensity changed
                    if (newMood !== this.currentMood || newIntensity !== this.currentIntensity) {
                        this.updateMoodUI(newMood, newIntensity, data.colors);
                    }
                }
            })
            .catch(error => {
                console.error('Error fetching mood data:', error);
            });
    }
    
    updateMoodUI(mood, intensity, colors) {
        const oldMood = this.currentMood;
        const oldIntensity = this.currentIntensity;
        
        // Update current state
        this.currentMood = mood;
        this.currentIntensity = intensity;
        this.colors = colors;
        
        // Update CSS variables
        document.documentElement.style.setProperty('--color-primary', colors.primary);
        document.documentElement.style.setProperty('--color-secondary', colors.secondary);
        document.documentElement.style.setProperty('--color-accent', colors.accent);
        document.documentElement.style.setProperty('--color-text', colors.text);
        
        // Convert hex to RGB for CSS variables
        const primaryRgb = this.hexToRgb(colors.primary);
        if (primaryRgb) {
            document.documentElement.style.setProperty(
                '--color-primary-rgb', 
                `${primaryRgb.r}, ${primaryRgb.g}, ${primaryRgb.b}`
            );
        }
        
        // Update mood indicator elements
        if (this.options.elements.moodLabel) {
            const label = document.querySelector(this.options.elements.moodLabel);
            if (label) {
                label.textContent = mood.charAt(0).toUpperCase() + mood.slice(1);
                label.classList.remove(`mood-${oldMood}`);
                label.classList.add(`mood-${mood}`);
            }
        }
        
        if (this.options.elements.intensityBar) {
            const bar = document.querySelector(this.options.elements.intensityBar);
            if (bar) {
                bar.style.width = `${intensity}%`;
                bar.style.backgroundColor = colors.primary;
            }
        }
        
        // Apply color transition effects
        document.body.classList.add('color-transition');
        setTimeout(() => {
            document.body.classList.remove('color-transition');
        }, 1000);
        
        // Call the callback if provided
        if (typeof this.options.onMoodChange === 'function') {
            this.options.onMoodChange(mood, intensity, oldMood, oldIntensity);
        }
    }
    
    // Analyze text to determine mood
    analyzeText(text) {
        return fetch(this.options.apiEndpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'X-CSRFToken': this.getCsrfToken(),
            },
            body: new URLSearchParams({
                'text': text
            })
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                this.updateMoodUI(data.mood, data.intensity, data.colors);
                return data;
            }
            return null;
        })
        .catch(error => {
            console.error('Error analyzing mood:', error);
            return null;
        });
    }
    
    // Helper function to get CSRF token
    getCsrfToken() {
        return document.querySelector('input[name="csrfmiddlewaretoken"]')?.value || '';
    }
    
    // Helper to convert hex to RGB
    hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : null;
    }
    
    destroy() {
        if (this.interval) {
            clearInterval(this.interval);
        }
    }
}

// Helper function to create a visualizer instance
function initMoodVisualizer(characterId, options = {}) {
    return new MoodVisualizer(characterId, options);
}