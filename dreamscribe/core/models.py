"""
Dreamscribe AI - Database Models

This module contains the database models for the application.
"""
from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone

class World(models.Model):
    """
    A fictional world created by a user.
    """
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='worlds')
    name = models.CharField(max_length=100)
    description = models.TextField()
    theme = models.CharField(max_length=50, choices=[
        ('fantasy', 'Fantasy'),
        ('sci-fi', 'Science Fiction'),
        ('historical', 'Historical'),
        ('modern', 'Modern'),
        ('post-apocalyptic', 'Post-Apocalyptic')
    ])
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return self.name

class Character(models.Model):
    """
    A character that exists within a world.
    """
    world = models.ForeignKey(World, on_delete=models.CASCADE, related_name='characters')
    name = models.CharField(max_length=100)
    role = models.CharField(max_length=100)
    appearance = models.TextField()
    personality = models.TextField()
    backstory = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    # Character memory stored as JSON
    memory = models.JSONField(default=dict, blank=True)
    
    # Mood tracking
    current_mood = models.CharField(
        max_length=50,
        choices=[
            ('neutral', 'Neutral'),
            ('happy', 'Happy'),
            ('sad', 'Sad'),
            ('angry', 'Angry'),
            ('excited', 'Excited'),
            ('thoughtful', 'Thoughtful'),
            ('confused', 'Confused'),
            ('scared', 'Scared')
        ],
        default='neutral'
    )
    mood_intensity = models.IntegerField(default=50, help_text="Intensity of the current mood (0-100)")
    
    def __str__(self):
        return self.name
    
    def get_recent_messages(self, limit=10):
        """Get the most recent chat messages for this character."""
        return self.messages.order_by('-created_at')[:limit]
    
    def update_memory(self, key, value):
        """Update a specific key in the character's memory."""
        if not self.memory:
            self.memory = {}
        
        self.memory[key] = value
        self.save()
    
    def store_conversation(self, user_message, character_response):
        """Store a conversation exchange in memory."""
        if not self.memory:
            self.memory = {}
        
        if 'conversations' not in self.memory:
            self.memory['conversations'] = []
        
        # Add conversation to memory
        conversation = {
            'user_message': user_message,
            'character_response': character_response,
            'timestamp': timezone.now().isoformat()
        }
        
        self.memory['conversations'].append(conversation)
        
        # Keep only the last 10 conversations
        if len(self.memory['conversations']) > 10:
            self.memory['conversations'] = self.memory['conversations'][-10:]
        
        self.save()

class ChatMessage(models.Model):
    """
    A message in a chat between a user and a character.
    """
    character = models.ForeignKey(Character, on_delete=models.CASCADE, related_name='messages')
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='character_messages')
    content = models.TextField()
    is_user_message = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['created_at']
    
    def __str__(self):
        prefix = "User" if self.is_user_message else "Character"
        return f"{prefix}: {self.content[:50]}..."

class Scene(models.Model):
    """
    A written scene that takes place in a world, generated or manually written.
    """
    world = models.ForeignKey(World, on_delete=models.CASCADE, related_name='scenes')
    title = models.CharField(max_length=200)
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    STYLE_CHOICES = [
        ('narrative', 'Narrative'),
        ('dialogue', 'Dialogue-focused'),
        ('descriptive', 'Descriptive'),
        ('action', 'Action-oriented'),
        ('poetic', 'Poetic')
    ]
    
    TONE_CHOICES = [
        ('dramatic', 'Dramatic'),
        ('humorous', 'Humorous'),
        ('mysterious', 'Mysterious'),
        ('romantic', 'Romantic'),
        ('tense', 'Tense'),
        ('melancholic', 'Melancholic')
    ]
    
    style_type = models.CharField(max_length=50, choices=STYLE_CHOICES, default='narrative')
    tone = models.CharField(max_length=50, choices=TONE_CHOICES, default='dramatic')
    included_characters = models.ManyToManyField(Character, related_name='scenes', blank=True)
    
    def __str__(self):
        return self.title

class ActivityLog(models.Model):
    """
    A log of activities in a world.
    """
    world = models.ForeignKey(World, on_delete=models.CASCADE, related_name='activity_logs')
    timestamp = models.DateTimeField(auto_now_add=True)
    
    ACTIVITY_TYPES = [
        ('WORLD_UPDATED', 'World Updated'),
        ('CHARACTER_CREATED', 'Character Created'),
        ('CHARACTER_UPDATED', 'Character Updated'),
        ('CHARACTER_CHAT', 'Character Chat'),
        ('SCENE_CREATED', 'Scene Created'),
        ('SCENE_UPDATED', 'Scene Updated')
    ]
    
    activity_type = models.CharField(max_length=50, choices=ACTIVITY_TYPES)
    details = models.TextField(blank=True)
    
    # Optional related objects
    character = models.ForeignKey(Character, on_delete=models.SET_NULL, null=True, blank=True, related_name='activities')
    scene = models.ForeignKey(Scene, on_delete=models.SET_NULL, null=True, blank=True, related_name='activities')
    
    class Meta:
        ordering = ['-timestamp']
    
    def __str__(self):
        return f"{self.get_activity_type_display()} on {self.timestamp.strftime('%Y-%m-%d %H:%M')}"