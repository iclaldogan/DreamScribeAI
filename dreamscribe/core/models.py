"""
Dreamscribe AI - Models

This module contains the database models for the application.
"""
import json
from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone

class World(models.Model):
    """
    Represents a fictional world created by a user
    """
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='worlds')
    name = models.CharField(max_length=200)
    description = models.TextField()
    theme = models.CharField(max_length=50, choices=[
        ('fantasy', 'Fantasy'),
        ('sci-fi', 'Science Fiction'),
        ('historical', 'Historical'),
        ('modern', 'Modern'),
        ('post-apocalyptic', 'Post-Apocalyptic'),
    ])
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return self.name

class Character(models.Model):
    """
    Represents a character within a fictional world
    """
    world = models.ForeignKey(World, on_delete=models.CASCADE, related_name='characters')
    name = models.CharField(max_length=200)
    role = models.CharField(max_length=200)
    appearance = models.TextField()
    personality = models.TextField()
    backstory = models.TextField()
    memory = models.JSONField(default=dict, blank=True)
    
    # Mood tracking
    MOOD_CHOICES = [
        ('neutral', 'Neutral'),
        ('happy', 'Happy'),
        ('sad', 'Sad'),
        ('angry', 'Angry'),
        ('fearful', 'Fearful'),
        ('curious', 'Curious'),
        ('excited', 'Excited'),
        ('thoughtful', 'Thoughtful'),
        ('confused', 'Confused'),
    ]
    
    current_mood = models.CharField(max_length=20, choices=MOOD_CHOICES, default='neutral')
    mood_intensity = models.IntegerField(default=50, help_text="Intensity of the current mood (0-100)")
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return self.name
    
    def get_chat_messages(self):
        """
        Get all messages for this character
        """
        return self.messages.all().order_by('created_at')
    
    def store_memory(self, key, value):
        """
        Store a value in the character's memory
        """
        if not self.memory:
            self.memory = {}
        
        self.memory[key] = value
        self.save()
    
    def store_conversation(self, user_message, character_response):
        """
        Store a conversation in the character's memory
        """
        if not self.memory:
            self.memory = {}
        
        if 'conversations' not in self.memory:
            self.memory['conversations'] = []
        
        # Add the new conversation
        self.memory['conversations'].append({
            'timestamp': timezone.now().isoformat(),
            'user_message': user_message,
            'character_response': character_response
        })
        
        # Limit the size of the conversations array (keep last 20)
        if len(self.memory['conversations']) > 20:
            self.memory['conversations'] = self.memory['conversations'][-20:]
        
        self.save()
    
    def get_memory_facts(self):
        """
        Get the list of facts from memory
        """
        if not self.memory or 'facts' not in self.memory:
            return []
        
        return self.memory['facts']
    
    def add_memory_fact(self, fact):
        """
        Add a new fact to the character's memory
        """
        if not self.memory:
            self.memory = {}
        
        if 'facts' not in self.memory:
            self.memory['facts'] = []
        
        # Only add if it's not already in the list
        if fact not in self.memory['facts']:
            self.memory['facts'].append(fact)
            self.save()

class Scene(models.Model):
    """
    Represents a scene generated for a world, potentially involving characters
    """
    STYLE_CHOICES = [
        ('descriptive', 'Descriptive'),
        ('action', 'Action-Oriented'),
        ('dialogue', 'Dialogue-Heavy'),
        ('poetic', 'Poetic'),
        ('humorous', 'Humorous'),
        ('dramatic', 'Dramatic'),
    ]
    
    TONE_CHOICES = [
        ('light', 'Light'),
        ('dark', 'Dark'),
        ('serious', 'Serious'),
        ('whimsical', 'Whimsical'),
        ('nostalgic', 'Nostalgic'),
        ('mysterious', 'Mysterious'),
        ('tense', 'Tense'),
    ]
    
    world = models.ForeignKey(World, on_delete=models.CASCADE, related_name='scenes')
    title = models.CharField(max_length=200)
    content = models.TextField()
    style_type = models.CharField(max_length=50, choices=STYLE_CHOICES)
    tone = models.CharField(max_length=50, choices=TONE_CHOICES)
    included_characters = models.ManyToManyField(Character, related_name='scenes', blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return self.title
    
    def get_first_lines(self):
        """
        Returns the first few lines of the scene content
        """
        lines = self.content.split("\n")
        preview = "\n".join(lines[:3])
        if len(lines) > 3:
            preview += "..."
        return preview

class ChatMessage(models.Model):
    """
    Represents a message in a chat between a user and a character
    """
    character = models.ForeignKey(Character, on_delete=models.CASCADE, related_name='messages')
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    content = models.TextField()
    is_user_message = models.BooleanField(default=True, help_text="True if the message is from the user, False if from the character")
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        prefix = "User" if self.is_user_message else self.character.name
        return f"{prefix}: {self.content[:50]}..."

class ActivityLog(models.Model):
    """
    Logs user activity within the application
    """
    ACTIVITY_TYPES = [
        ('WORLD_CREATED', 'World Created'),
        ('WORLD_EDITED', 'World Edited'),
        ('WORLD_DELETED', 'World Deleted'),
        ('CHARACTER_CREATED', 'Character Created'),
        ('CHARACTER_EDITED', 'Character Edited'),
        ('CHARACTER_DELETED', 'Character Deleted'),
        ('SCENE_CREATED', 'Scene Created'),
        ('SCENE_EDITED', 'Scene Edited'),
        ('SCENE_DELETED', 'Scene Deleted'),
        ('CHARACTER_CHAT', 'Character Chat'),
    ]
    
    world = models.ForeignKey(World, on_delete=models.CASCADE, related_name='activity_logs', null=True, blank=True)
    character = models.ForeignKey(Character, on_delete=models.SET_NULL, related_name='activity_logs', null=True, blank=True)
    scene = models.ForeignKey(Scene, on_delete=models.SET_NULL, related_name='activity_logs', null=True, blank=True)
    activity_type = models.CharField(max_length=50, choices=ACTIVITY_TYPES)
    details = models.TextField(blank=True)
    timestamp = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"{self.get_activity_type_display()} - {self.timestamp.strftime('%Y-%m-%d %H:%M')}"
    
    class Meta:
        ordering = ['-timestamp']