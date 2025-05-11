"""
Dreamscribe AI - Forms

This module contains the form classes for the application.
"""
from django import forms
from django.contrib.auth.forms import UserCreationForm
from django.contrib.auth.models import User

from .models import World, Character, Scene, ChatMessage

class WorldForm(forms.ModelForm):
    class Meta:
        model = World
        fields = ['name', 'description', 'theme']
        widgets = {
            'name': forms.TextInput(attrs={'class': 'w-full p-2 border rounded bg-opacity-40 bg-neutral-dark text-neutral-light border-secondary/20'}),
            'description': forms.Textarea(attrs={'class': 'w-full p-2 border rounded bg-opacity-40 bg-neutral-dark text-neutral-light border-secondary/20', 'rows': 4}),
            'theme': forms.Select(attrs={'class': 'w-full p-2 border rounded bg-opacity-40 bg-neutral-dark text-neutral-light border-secondary/20'}, 
                                choices=[('fantasy', 'Fantasy'), ('sci-fi', 'Science Fiction'), ('historical', 'Historical'), 
                                        ('modern', 'Modern'), ('post-apocalyptic', 'Post-Apocalyptic')])
        }

class CharacterForm(forms.ModelForm):
    class Meta:
        model = Character
        fields = ['world', 'name', 'role', 'appearance', 'personality', 'backstory']
        widgets = {
            'world': forms.Select(attrs={'class': 'w-full p-2 border rounded bg-opacity-40 bg-neutral-dark text-neutral-light border-secondary/20'}),
            'name': forms.TextInput(attrs={'class': 'w-full p-2 border rounded bg-opacity-40 bg-neutral-dark text-neutral-light border-secondary/20'}),
            'role': forms.TextInput(attrs={'class': 'w-full p-2 border rounded bg-opacity-40 bg-neutral-dark text-neutral-light border-secondary/20'}),
            'appearance': forms.Textarea(attrs={'class': 'w-full p-2 border rounded bg-opacity-40 bg-neutral-dark text-neutral-light border-secondary/20', 'rows': 3}),
            'personality': forms.Textarea(attrs={'class': 'w-full p-2 border rounded bg-opacity-40 bg-neutral-dark text-neutral-light border-secondary/20', 'rows': 3}),
            'backstory': forms.Textarea(attrs={'class': 'w-full p-2 border rounded bg-opacity-40 bg-neutral-dark text-neutral-light border-secondary/20', 'rows': 4})
        }
    
    def __init__(self, *args, **kwargs):
        user = kwargs.pop('user', None)
        super(CharacterForm, self).__init__(*args, **kwargs)
        
        if user:
            self.fields['world'].queryset = World.objects.filter(user=user)
    
    def save(self, commit=True):
        character = super(CharacterForm, self).save(commit=False)
        
        # Initialize memory with default structure
        if not character.memory:
            character.memory = {
                'facts': [],
                'conversations': [],
                'relationships': {},
                'preferences': {}
            }
        
        if commit:
            character.save()
        
        return character

class SceneGeneratorForm(forms.Form):
    world = forms.ModelChoiceField(
        queryset=World.objects.all(),
        widget=forms.Select(attrs={'class': 'w-full p-2 border rounded bg-opacity-40 bg-neutral-dark text-neutral-light border-secondary/20'})
    )
    title = forms.CharField(
        max_length=200,
        widget=forms.TextInput(attrs={'class': 'w-full p-2 border rounded bg-opacity-40 bg-neutral-dark text-neutral-light border-secondary/20'})
    )
    included_characters = forms.ModelMultipleChoiceField(
        queryset=Character.objects.all(),
        required=False,
        widget=forms.SelectMultiple(attrs={'class': 'w-full p-2 border rounded bg-opacity-40 bg-neutral-dark text-neutral-light border-secondary/20'})
    )
    scene_prompt = forms.CharField(
        widget=forms.Textarea(attrs={'class': 'w-full p-2 border rounded bg-opacity-40 bg-neutral-dark text-neutral-light border-secondary/20', 'rows': 4})
    )
    style_type = forms.ChoiceField(
        choices=Scene.STYLE_CHOICES,
        widget=forms.Select(attrs={'class': 'w-full p-2 border rounded bg-opacity-40 bg-neutral-dark text-neutral-light border-secondary/20'})
    )
    tone = forms.ChoiceField(
        choices=Scene.TONE_CHOICES,
        widget=forms.Select(attrs={'class': 'w-full p-2 border rounded bg-opacity-40 bg-neutral-dark text-neutral-light border-secondary/20'})
    )
    length = forms.ChoiceField(
        choices=[
            ('Short (250 words)', 'Short (250 words)'),
            ('Medium (500 words)', 'Medium (500 words)'),
            ('Long (1000 words)', 'Long (1000 words)')
        ],
        widget=forms.Select(attrs={'class': 'w-full p-2 border rounded bg-opacity-40 bg-neutral-dark text-neutral-light border-secondary/20'})
    )
    
    def __init__(self, *args, **kwargs):
        user = kwargs.pop('user', None)
        super(SceneGeneratorForm, self).__init__(*args, **kwargs)
        
        if user:
            self.fields['world'].queryset = World.objects.filter(user=user)
            
            # Update included_characters queryset when world is set
            if 'world' in self.initial:
                world = self.initial['world']
                self.fields['included_characters'].queryset = Character.objects.filter(world=world)

class ChatMessageForm(forms.ModelForm):
    class Meta:
        model = ChatMessage
        fields = ['content']
        widgets = {
            'content': forms.Textarea(attrs={'class': 'w-full p-2 border rounded bg-opacity-40 bg-neutral-dark text-neutral-light border-secondary/20', 
                                           'rows': 2, 'placeholder': 'Type your message...'})
        }

class SceneForm(forms.ModelForm):
    class Meta:
        model = Scene
        fields = ['world', 'title', 'content', 'style_type', 'tone', 'included_characters']
        widgets = {
            'world': forms.Select(attrs={'class': 'w-full p-2 border rounded bg-opacity-40 bg-neutral-dark text-neutral-light border-secondary/20'}),
            'title': forms.TextInput(attrs={'class': 'w-full p-2 border rounded bg-opacity-40 bg-neutral-dark text-neutral-light border-secondary/20'}),
            'content': forms.Textarea(attrs={'class': 'w-full p-2 border rounded bg-opacity-40 bg-neutral-dark text-neutral-light border-secondary/20', 'rows': 10}),
            'style_type': forms.Select(attrs={'class': 'w-full p-2 border rounded bg-opacity-40 bg-neutral-dark text-neutral-light border-secondary/20'}),
            'tone': forms.Select(attrs={'class': 'w-full p-2 border rounded bg-opacity-40 bg-neutral-dark text-neutral-light border-secondary/20'}),
            'included_characters': forms.SelectMultiple(attrs={'class': 'w-full p-2 border rounded bg-opacity-40 bg-neutral-dark text-neutral-light border-secondary/20'})
        }
    
    def __init__(self, *args, **kwargs):
        user = kwargs.pop('user', None)
        super(SceneForm, self).__init__(*args, **kwargs)
        
        if user:
            self.fields['world'].queryset = World.objects.filter(user=user)
            
            # If world is set, filter characters by world
            if self.instance and self.instance.world:
                self.fields['included_characters'].queryset = Character.objects.filter(world=self.instance.world)

class SignUpForm(UserCreationForm):
    email = forms.EmailField(
        max_length=254,
        help_text='Required. Enter a valid email address.',
        widget=forms.EmailInput(attrs={'class': 'w-full p-2 border rounded bg-opacity-40 bg-neutral-dark text-neutral-light border-secondary/20'})
    )
    
    class Meta:
        model = User
        fields = ('username', 'email', 'password1', 'password2')
        widgets = {
            'username': forms.TextInput(attrs={'class': 'w-full p-2 border rounded bg-opacity-40 bg-neutral-dark text-neutral-light border-secondary/20'}),
        }
    
    def __init__(self, *args, **kwargs):
        super(SignUpForm, self).__init__(*args, **kwargs)
        
        # Update CSS classes for password fields
        self.fields['password1'].widget.attrs.update({'class': 'w-full p-2 border rounded bg-opacity-40 bg-neutral-dark text-neutral-light border-secondary/20'})
        self.fields['password2'].widget.attrs.update({'class': 'w-full p-2 border rounded bg-opacity-40 bg-neutral-dark text-neutral-light border-secondary/20'})