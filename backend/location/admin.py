from django.contrib import admin
from .models import Location, LocationHistory


@admin.register(Location)
class LocationAdmin(admin.ModelAdmin):
    list_display = ("user", "address", "privacy", "updated_at", "is_expired")
    list_filter = ("privacy", "created_at", "updated_at")
    search_fields = ("user__username", "address", "description")
    readonly_fields = ("created_at", "updated_at")
    fields = (
        "user",
        "latitude",
        "longitude",
        "address",
        "description",
        "privacy",
        "expires_at",
        "created_at",
        "updated_at",
    )


@admin.register(LocationHistory)
class LocationHistoryAdmin(admin.ModelAdmin):
    list_display = ("user", "address", "timestamp")
    list_filter = ("timestamp",)
    search_fields = ("user__username", "address")
    readonly_fields = ("timestamp",)
    fields = ("user", "latitude", "longitude", "address", "timestamp")
