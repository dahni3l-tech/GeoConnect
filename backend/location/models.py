from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()


class Location(models.Model):
    """
    Model to store user location data with privacy controls.
    """
    PRIVACY_CHOICES = [
        ("public", "Public"),
        ("friends", "Friends Only"),
        ("private", "Private"),
    ]

    user = models.OneToOneField(
    User,
    on_delete=models.CASCADE,
    related_name="current_location"
)

    latitude = models.DecimalField(
        max_digits=9,
        decimal_places=6,
        help_text="Latitude coordinate"
    )

    longitude = models.DecimalField(
        max_digits=9,
        decimal_places=6,
        help_text="Longitude coordinate"
    )

    address = models.CharField(
        max_length=255,
        blank=True,
        help_text="Human-readable address"
    )

    description = models.TextField(
        blank=True,
        help_text="User description of location (e.g., 'Currently at home')"
    )

    privacy = models.CharField(
        max_length=10,
        choices=PRIVACY_CHOICES,
        default="friends"
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    # Optional: expire location sharing after a certain time
    expires_at = models.DateTimeField(
        null=True,
        blank=True,
        help_text="Location sharing expires at this time"
    )

    class Meta:
        ordering = ["-updated_at"]
        verbose_name = "Location"
        verbose_name_plural = "Locations"
        indexes = [
            models.Index(fields=["user", "-updated_at"]),
        ]

    def __str__(self):
        return f"{self.user.username} - {self.address or f'({self.latitude}, {self.longitude})'}"

    @property
    def is_expired(self):
        """Check if location sharing has expired."""
        if self.expires_at:
            from django.utils import timezone
            return timezone.now() > self.expires_at
        return False


class LocationHistory(models.Model):
    """
    Optional: Track historical location data for movement patterns.
    """
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="location_history"
    )

    latitude = models.DecimalField(max_digits=9, decimal_places=6)
    longitude = models.DecimalField(max_digits=9, decimal_places=6)
    address = models.CharField(max_length=255, blank=True)

    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-timestamp"]
        verbose_name_plural = "Location Histories"
        indexes = [
            models.Index(fields=["user", "-timestamp"]),
        ]

    def __str__(self):
        return f"{self.user.username} at {self.timestamp}"
