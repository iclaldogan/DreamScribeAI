import re
import os
import google.generativeai as genai
from dotenv import load_dotenv

# Load environment variables and set up the API
load_dotenv()
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

class MoodAnalyzer:
    """
    Analyzes text to determine emotion/mood and intensity
    """
    
    MOOD_COLORS = {
        'neutral': {
            'primary': '#6B7280',  # gray-500
            'secondary': '#9CA3AF',  # gray-400
            'accent': '#D1D5DB',  # gray-300
            'text': '#F3F4F6',  # gray-100
        },
        'happy': {
            'primary': '#FBBF24',  # yellow-400
            'secondary': '#F59E0B',  # amber-500
            'accent': '#FCD34D',  # yellow-300
            'text': '#FFFBEB',  # yellow-50
        },
        'sad': {
            'primary': '#60A5FA',  # blue-400
            'secondary': '#3B82F6',  # blue-500
            'accent': '#93C5FD',  # blue-300
            'text': '#EFF6FF',  # blue-50
        },
        'angry': {
            'primary': '#F87171',  # red-400
            'secondary': '#EF4444',  # red-500
            'accent': '#FCA5A5',  # red-300
            'text': '#FEF2F2',  # red-50
        },
        'excited': {
            'primary': '#34D399',  # emerald-400
            'secondary': '#10B981',  # emerald-500
            'accent': '#6EE7B7',  # emerald-300
            'text': '#ECFDF5',  # emerald-50
        },
        'thoughtful': {
            'primary': '#A78BFA',  # violet-400
            'secondary': '#8B5CF6',  # violet-500
            'accent': '#C4B5FD',  # violet-300
            'text': '#F5F3FF',  # violet-50
        },
        'confused': {
            'primary': '#FB923C',  # orange-400
            'secondary': '#F97316',  # orange-500
            'accent': '#FDBA74',  # orange-300
            'text': '#FFF7ED',  # orange-50
        },
        'scared': {
            'primary': '#C084FC',  # purple-400
            'secondary': '#A855F7',  # purple-500
            'accent': '#D8B4FE',  # purple-300
            'text': '#FAF5FF',  # purple-50
        }
    }
    
    @classmethod
    def analyze_with_gemini(cls, text):
        """
        Use Gemini AI to analyze mood in text
        
        Args:
            text: The text to analyze
            
        Returns:
            tuple: (mood, intensity)
        """
        try:
            prompt = f"""
            Analyze the following text and determine the emotional mood expressed.
            Choose the most fitting mood from these options only: neutral, happy, sad, angry, excited, thoughtful, confused, scared.
            Also rate the intensity of this mood on a scale of 1-100 where 1 is barely detectable and 100 is extremely intense.
            
            Return your answer in this exact format:
            MOOD: [mood]
            INTENSITY: [number]
            
            Text to analyze:
            "{text}"
            """
            
            model = genai.GenerativeModel('gemini-1.5-pro')
            response = model.generate_content(prompt)
            
            # Extract mood and intensity from response
            response_text = response.text.strip()
            
            mood_match = re.search(r'MOOD:\s*(\w+)', response_text)
            intensity_match = re.search(r'INTENSITY:\s*(\d+)', response_text)
            
            if mood_match and intensity_match:
                mood = mood_match.group(1).lower()
                intensity = int(intensity_match.group(1))
                
                # Ensure mood is one of our valid options
                if mood not in cls.MOOD_COLORS:
                    mood = 'neutral'
                
                # Ensure intensity is within valid range
                intensity = max(1, min(100, intensity))
                
                return mood, intensity
            
            return 'neutral', 50
            
        except Exception as e:
            print(f"Error analyzing mood: {e}")
            return 'neutral', 50
    
    @classmethod
    def analyze_with_keywords(cls, text):
        """
        Fallback method using keyword matching when Gemini API is unavailable
        
        Args:
            text: The text to analyze
            
        Returns:
            tuple: (mood, intensity)
        """
        text = text.lower()
        
        # Dictionary mapping moods to keywords and their intensity multipliers
        mood_keywords = {
            'happy': ['happy', 'joy', 'excited', 'delighted', 'pleased', 'glad', 'smile', 'laugh', 'wonderful', 'great'],
            'sad': ['sad', 'unhappy', 'depressed', 'miserable', 'sorrow', 'grief', 'tears', 'crying', 'disappointed'],
            'angry': ['angry', 'mad', 'furious', 'rage', 'outraged', 'annoyed', 'irritated', 'frustrated'],
            'excited': ['excited', 'thrilled', 'enthusiastic', 'eager', 'energetic', 'pumped', 'psyched'],
            'thoughtful': ['thoughtful', 'pensive', 'contemplative', 'reflective', 'thinking', 'consider', 'wonder'],
            'confused': ['confused', 'puzzled', 'perplexed', 'uncertain', 'unsure', 'bewildered', 'baffled'],
            'scared': ['scared', 'afraid', 'frightened', 'terrified', 'fearful', 'anxious', 'worried', 'nervous']
        }
        
        # Intensity modifier keywords
        intensity_modifiers = {
            'very': 1.5,
            'extremely': 2.0,
            'somewhat': 0.7,
            'slightly': 0.5,
            'really': 1.7,
            'incredibly': 2.0
        }
        
        # Check matches for each mood
        mood_scores = {mood: 0 for mood in mood_keywords.keys()}
        
        for mood, keywords in mood_keywords.items():
            base_score = 0
            for keyword in keywords:
                if keyword in text:
                    # Find modifier words before the keyword
                    for modifier, multiplier in intensity_modifiers.items():
                        pattern = rf"{modifier}\s+\w*\s*{keyword}"
                        if re.search(pattern, text):
                            base_score += 50 * multiplier
                            break
                    else:
                        base_score += 50  # Default score for unmodified keyword
            
            mood_scores[mood] = base_score
        
        # Determine the mood with the highest score
        if all(score == 0 for score in mood_scores.values()):
            return 'neutral', 50
        
        highest_mood = max(mood_scores.items(), key=lambda x: x[1])
        mood = highest_mood[0]
        
        # Calculate intensity (scale to 1-100)
        intensity = min(100, highest_mood[1])
        intensity = max(1, intensity)
        
        return mood, intensity
    
    @classmethod
    def get_mood_colors(cls, mood, intensity=None):
        """
        Return color values for a given mood and intensity
        
        Args:
            mood: The mood string
            intensity: Optional intensity value (1-100)
            
        Returns:
            dict: Color values for the mood
        """
        if mood not in cls.MOOD_COLORS:
            mood = 'neutral'
            
        colors = cls.MOOD_COLORS[mood].copy()
        
        # Adjust colors based on intensity if provided
        if intensity is not None:
            # Normalize intensity between 0.5 and 1.5 to adjust color brightness
            normalized = 0.5 + (intensity / 100)
            
            # Helper function to adjust color brightness
            def adjust_color(hex_color, factor):
                # Convert hex to RGB
                r = int(hex_color[1:3], 16)
                g = int(hex_color[3:5], 16)
                b = int(hex_color[5:7], 16)
                
                # Adjust brightness
                r = min(255, int(r * factor))
                g = min(255, int(g * factor))
                b = min(255, int(b * factor))
                
                # Convert back to hex
                return f'#{r:02x}{g:02x}{b:02x}'
            
            # Adjust all colors
            for key in colors:
                colors[key] = adjust_color(colors[key], normalized)
                
        return colors