from rest_framework import generics, status, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from django.utils import timezone
from django.db.models import Q
from .models import Location, LocationHistory
from .serializers import (
    LocationSerializer,
    LocationCreateUpdateSerializer,
    LocationHistorySerializer,
    LocationListSerializer,
)
from accounts.models import User, FriendRequest


class LocationListCreateView(generics.ListCreateAPIView):
    """
    Get all locations for authenticated user or create a new location.
    """
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = LocationSerializer

    def get_queryset(self):
        return Location.objects.filter(user=self.request.user)

    def get_serializer_class(self):
        if self.request.method == "POST":
            return LocationCreateUpdateSerializer
        return LocationSerializer

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    def post(self, request, *args, **kwargs):
        """
        Create a new location. Each user typically has one 'current' location,
        so you may want to update the existing one or keep history.
        """
        return super().create(request, *args, **kwargs)


class LocationDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    Get, update, or delete a specific location.
    """
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = LocationSerializer

    def get_queryset(self):
        return Location.objects.filter(user=self.request.user)

    def get_serializer_class(self):
        if self.request.method in ["PUT", "PATCH"]:
            return LocationCreateUpdateSerializer
        return LocationSerializer


class FriendsLocationsView(APIView):
    """
    Get locations of all accepted friends (non-expired, non-private).
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user

        # Get all accepted friend relationships (both directions)
        friend_ids = FriendRequest.objects.filter(
            Q(sender=user, status="accepted") | Q(receiver=user, status="accepted")
        ).values_list("sender_id", "receiver_id")

        friends = set()
        for sender_id, receiver_id in friend_ids:
            if sender_id == user.id:
                friends.add(receiver_id)
            else:
                friends.add(sender_id)

        # Get non-expired locations from friends that aren't private
        locations = Location.objects.filter(
            user_id__in=friends,
        ).exclude(privacy="private").filter(
    Q(expires_at__isnull=True) |
    Q(expires_at__gt=timezone.now())
)
        serializer = LocationListSerializer(locations, many=True)
        return Response(serializer.data)


class UserLocationView(APIView):
    """
    Get a specific user's shareable location(s).
    Respects privacy settings - returns empty if user isn't friend or location is private.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, user_id):
        try:
            target_user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            return Response(
                {"detail": "User not found."},
                status=status.HTTP_404_NOT_FOUND
            )

        # Check if requester is viewing their own profile
        if request.user.id == user_id:
            locations = Location.objects.filter(user=target_user)
        else:
            # Check friendship status
            is_friend = FriendRequest.objects.filter(
                Q(sender=request.user, receiver=target_user, status="accepted") |
                Q(sender=target_user, receiver=request.user, status="accepted")
            ).exists()

            # Filter locations based on privacy and friendship
            if is_friend:
                locations = Location.objects.filter(
                    user=target_user
                ).exclude(
                    privacy="private"
                ).exclude(expires_at__lt=timezone.now())
            else:
                # Non-friends can only see public locations
                locations = Location.objects.filter(
                    user=target_user,
                    privacy="public"
                ).exclude(expires_at__lt=timezone.now())

        serializer = LocationListSerializer(locations, many=True)
        return Response(serializer.data)


class LocationHistoryView(generics.ListCreateAPIView):
    """
    Get location history for authenticated user or record a history entry.
    """
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = LocationHistorySerializer

    def get_queryset(self):
        return LocationHistory.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class CurrentLocationView(APIView):
    """
    Get the most recent location from authenticated user or friends.
    Convenient endpoint for mobile apps to get current location snapshot.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        """Get current user's latest location."""
        location = Location.objects.filter(
            user=request.user
        ).order_by("-updated_at").first()

        if not location:
            return Response(
                {"detail": "No location shared yet."},
                status=status.HTTP_404_NOT_FOUND
            )

        serializer = LocationSerializer(location)
        return Response(serializer.data)
