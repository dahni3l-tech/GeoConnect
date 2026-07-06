from django.urls import path
from .views import (
    LocationListCreateView,
    LocationDetailView,
    FriendsLocationsView,
    UserLocationView,
    LocationHistoryView,
    CurrentLocationView,
)

urlpatterns = [
    # User's own locations
    path("", LocationListCreateView.as_view(), name="location_list_create"),
    path("<int:pk>/", LocationDetailView.as_view(), name="location_detail"),
    path("current/", CurrentLocationView.as_view(), name="current_location"),
    
    # Friends and other users' locations
    path("friends/", FriendsLocationsView.as_view(), name="friends_locations"),
    path("user/<int:user_id>/", UserLocationView.as_view(), name="user_location"),
    
    # Location history
    path("history/", LocationHistoryView.as_view(), name="location_history"),
]
