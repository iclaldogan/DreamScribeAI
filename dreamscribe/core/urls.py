from django.urls import path
from . import views

urlpatterns = [
    path('', views.home, name='home'),
    path('dashboard/', views.dashboard, name='dashboard'),
    
    # World URLs
    path('worlds/', views.world_list, name='world_list'),
    path('worlds/<int:world_id>/', views.world_detail, name='world_detail'),
    path('worlds/<int:world_id>/delete/', views.delete_world, name='delete_world'),
    
    # Character URLs
    path('characters/', views.character_list, name='character_list'),
    path('worlds/<int:world_id>/characters/', views.character_list, name='world_characters'),
    path('characters/<int:character_id>/', views.character_detail, name='character_detail'),
    path('characters/<int:character_id>/delete/', views.delete_character, name='delete_character'),
    path('characters/<int:character_id>/chat/', views.character_chat, name='character_chat'),
    
    # Scene URLs
    path('scenes/', views.scene_list, name='scene_list'),
    path('worlds/<int:world_id>/scenes/', views.scene_list, name='world_scenes'),
    path('scenes/<int:scene_id>/', views.scene_detail, name='scene_detail'),
    path('scenes/<int:scene_id>/delete/', views.delete_scene, name='delete_scene'),
    path('scene-generator/', views.scene_generator, name='scene_generator'),
    
    # MoodAPI - AJAX endpoints for mood-based UI
    path('api/character/<int:character_id>/mood/', views.character_mood_api, name='character_mood_api'),
]