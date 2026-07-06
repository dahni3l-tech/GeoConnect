from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    email = models.EmailField(unique=True)
    bio = models.TextField(blank=True, null=True)
    profile_picture = models.ImageField(
        upload_to="profile_pictures/",
        blank=True,
        null=True
    )
    is_email_verified = models.BooleanField(default=False)
    is_premium = models.BooleanField(default=False)

    def __str__(self):
        return self.username
    
class FriendRequest(models.Model):
    STATUS_CHOICES = [
        ("pending", "Pending"),
        ("accepted", "Accepted"),
        ("rejected", "Rejected"),
    ]

    sender = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="sent_friend_requests",
    )

    receiver = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="received_friend_requests",
    )

    status = models.CharField(
        max_length=10,
        choices=STATUS_CHOICES,
        default="pending",
    )

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("sender", "receiver")

    def __str__(self):
        return f"{self.sender.username} → {self.receiver.username} ({self.status})"