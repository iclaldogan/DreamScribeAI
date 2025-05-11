"""
Dreamscribe AI - URL patterns

This module contains URL patterns for the application.
"""
from django.urls import path
from . import views, views_api

urlpatterns = [
    # Main application views
    path('', views.index, name='index'),
    path('dashboard/', views.dashboard, name='dashboard'),
    
    # World related views
    path('worlds/', views.world_list, name='world_list'),
    path('worlds/create/', views.world_create, name='world_create'),
    path('worlds/<int:world_id>/', views.world_detail, name='world_detail'),
    path('worlds/<int:world_id>/edit/', views.world_edit, name='world_edit'),
    path('worlds/<int:world_id>/delete/', views.world_delete, name='world_delete'),
    
    # Character related views
    path('characters/', views.character_list, name='character_list'),
    path('worlds/<int:world_id>/characters/', views.world_characters, name='world_characters'),
    path('characters/<int:character_id>/', views.character_detail, name='character_detail'),
    path('characters/<int:character_id>/edit/', views.character_edit, name='character_edit'),
    path('characters/<int:character_id>/delete/', views.character_delete, name='character_delete'),
    path('characters/<int:character_id>/chat/', views.character_chat, name='character_chat'),
    
    # Scene related views
    path('worlds/<int:world_id>/scenes/', views.world_scenes, name='world_scenes'),
    path('scenes/<int:scene_id>/', views.scene_detail, name='scene_detail'),
    path('scenes/create/', views.scene_create, name='scene_create'),
    path('scenes/<int:scene_id>/edit/', views.scene_edit, name='scene_edit'),
    path('scenes/<int:scene_id>/delete/', views.scene_delete, name='scene_delete'),
    path('scene-generator/', views.scene_generator, name='scene_generator'),
    
    # Authentication views
    path('accounts/signup/', views.signup, name='signup'),
    
    # API views for mood functionality
    path('api/character/<int:character_id>/mood/', views_api.get_character_mood, name='get_character_mood'),
    path('api/character/<int:character_id>/analyze-mood/', views_api.analyze_mood, name='analyze_mood'),
    path('api/character/<int:character_id>/update-mood-history/', views_api.update_character_mood_history, name='update_character_mood_history'),
]