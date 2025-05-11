"""
Initial database migration for Dreamscribe AI
"""
from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='World',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=100)),
                ('description', models.TextField()),
                ('theme', models.CharField(choices=[('fantasy', 'Fantasy'), ('sci-fi', 'Science Fiction'), ('historical', 'Historical'), ('modern', 'Modern'), ('post-apocalyptic', 'Post-Apocalyptic')], max_length=50)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='worlds', to=settings.AUTH_USER_MODEL)),
            ],
        ),
        migrations.CreateModel(
            name='Character',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=100)),
                ('role', models.CharField(max_length=100)),
                ('appearance', models.TextField()),
                ('personality', models.TextField()),
                ('backstory', models.TextField()),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('memory', models.JSONField(blank=True, default=dict)),
                ('current_mood', models.CharField(choices=[('neutral', 'Neutral'), ('happy', 'Happy'), ('sad', 'Sad'), ('angry', 'Angry'), ('excited', 'Excited'), ('thoughtful', 'Thoughtful'), ('confused', 'Confused'), ('scared', 'Scared')], default='neutral', max_length=50)),
                ('mood_intensity', models.IntegerField(default=50, help_text='Intensity of the current mood (0-100)')),
                ('world', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='characters', to='core.world')),
            ],
        ),
        migrations.CreateModel(
            name='Scene',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('title', models.CharField(max_length=200)),
                ('content', models.TextField()),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('style_type', models.CharField(choices=[('narrative', 'Narrative'), ('dialogue', 'Dialogue-focused'), ('descriptive', 'Descriptive'), ('action', 'Action-oriented'), ('poetic', 'Poetic')], default='narrative', max_length=50)),
                ('tone', models.CharField(choices=[('dramatic', 'Dramatic'), ('humorous', 'Humorous'), ('mysterious', 'Mysterious'), ('romantic', 'Romantic'), ('tense', 'Tense'), ('melancholic', 'Melancholic')], default='dramatic', max_length=50)),
                ('included_characters', models.ManyToManyField(blank=True, related_name='scenes', to='core.character')),
                ('world', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='scenes', to='core.world')),
            ],
        ),
        migrations.CreateModel(
            name='ChatMessage',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('content', models.TextField()),
                ('is_user_message', models.BooleanField(default=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('character', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='messages', to='core.character')),
                ('user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='character_messages', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'ordering': ['created_at'],
            },
        ),
        migrations.CreateModel(
            name='ActivityLog',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('timestamp', models.DateTimeField(auto_now_add=True)),
                ('activity_type', models.CharField(choices=[('WORLD_UPDATED', 'World Updated'), ('CHARACTER_CREATED', 'Character Created'), ('CHARACTER_UPDATED', 'Character Updated'), ('CHARACTER_CHAT', 'Character Chat'), ('SCENE_CREATED', 'Scene Created'), ('SCENE_UPDATED', 'Scene Updated')], max_length=50)),
                ('details', models.TextField(blank=True)),
                ('character', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='activities', to='core.character')),
                ('scene', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='activities', to='core.scene')),
                ('world', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='activity_logs', to='core.world')),
            ],
            options={
                'ordering': ['-timestamp'],
            },
        ),
    ],
)