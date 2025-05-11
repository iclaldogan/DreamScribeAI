from django.db import models
from django.contrib.auth.models import User
import json

class World(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='worlds')
    name = models.CharField(max_length=100)
    description = models.TextField()
    theme = models.CharField(max_length=100, default='fantasy')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return self.name

class Character(models.Model):
    world = models.ForeignKey(World, on_delete=models.CASCADE, related_name='characters')
    name = models.CharField(max_length=100)
    role = models.CharField(max_length=100)
    appearance = models.TextField()
    personality = models.TextField()
    backstory = models.TextField()
    memory = models.JSONField(default=dict, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"{self.name} ({self.role})"
    
    def get_memory(self):
        """Return the memory as a Python object"""
        if isinstance(self.memory, str):
            return json.loads(self.memory)
        return self.memory or {}
    
    def update_memory(self, memory_updates):
        """Update the character's memory with new information"""
        current_memory = self.get_memory()
        if isinstance(memory_updates, dict):
            for key, value in memory_updates.items():
                current_memory[key] = value
            self.memory = current_memory
            self.save()

class Scene(models.Model):
    STYLE_CHOICES = [
        ('Novel - Descriptive', 'Novel - Descriptive'),
        ('Script - Dialogue Heavy', 'Script - Dialogue Heavy'),
        ('Short Story - Concise', 'Short Story - Concise'),
        ('Epic Fantasy', 'Epic Fantasy'),
        ('Noir Detective', 'Noir Detective'),
    ]
    
    TONE_CHOICES = [
        ('Dramatic', 'Dramatic'),
        ('Humorous', 'Humorous'),
        ('Dark', 'Dark'),
        ('Whimsical', 'Whimsical'),
        ('Suspenseful', 'Suspenseful'),
    ]
    
    world = models.ForeignKey(World, on_delete=models.CASCADE, related_name='scenes')
    title = models.CharField(max_length=200)
    content = models.TextField()
    style_type = models.CharField(max_length=50, choices=STYLE_CHOICES, default='Novel - Descriptive')
    tone = models.CharField(max_length=50, choices=TONE_CHOICES, default='Dramatic')
    included_characters = models.ManyToManyField(Character, related_name='scenes', blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return self.title

class ChatMessage(models.Model):
    character = models.ForeignKey(Character, on_delete=models.CASCADE, related_name='messages')
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='messages')
    is_user_message = models.BooleanField(default=True)
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['created_at']
    
    def __str__(self):
        sender = "User" if self.is_user_message else self.character.name
        return f"{sender}: {self.content[:30]}..."

class ActivityLog(models.Model):
    ACTIVITY_TYPES = [
        ('WORLD_CREATED', 'World Created'),
        ('WORLD_UPDATED', 'World Updated'),
        ('CHARACTER_CREATED', 'Character Created'),
        ('CHARACTER_UPDATED', 'Character Updated'),
        ('SCENE_CREATED', 'Scene Created'),
        ('CHAT_SESSION', 'Chat Session'),
    ]
    
    world = models.ForeignKey(World, on_delete=models.CASCADE, related_name='activity_logs')
    activity_type = models.CharField(max_length=50, choices=ACTIVITY_TYPES)
    description = models.CharField(max_length=255)
    related_character = models.ForeignKey(Character, on_delete=models.SET_NULL, 
                                         related_name='activity_logs', null=True, blank=True)
    related_scene = models.ForeignKey(Scene, on_delete=models.SET_NULL, 
                                     related_name='activity_logs', null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.get_activity_type_display()} - {self.created_at.strftime('%Y-%m-%d %H:%M')}"
