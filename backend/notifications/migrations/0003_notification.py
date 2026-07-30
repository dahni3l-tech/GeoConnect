from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('notifications', '0002_locationrequest'),
        ('accounts', '0003_user_is_online_last_seen'),
    ]

    operations = [
        migrations.CreateModel(
            name='Notification',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('notification_type', models.CharField(choices=[('friend_online', 'Friend Online'), ('location_request', 'Location Request'), ('location_accepted', 'Location Accepted'), ('location_rejected', 'Location Rejected')], max_length=30)),
                ('title', models.CharField(max_length=255)),
                ('message', models.TextField()),
                ('data', models.JSONField(blank=True, default=dict)),
                ('is_read', models.BooleanField(default=False)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('recipient', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='notifications', to='accounts.user')),
            ],
            options={
                'ordering': ['-created_at'],
                'indexes': [models.Index(fields=['recipient', '-created_at'], name='notificatio_recipie_123456_idx'), models.Index(fields=['recipient', 'is_read'], name='notificatio_recipie_654321_idx')],
            },
        ),
    ]
