from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from django.db import models
from .models import PushSubscription, LocationRequest, Notification
from .serializers import NotificationSerializer
from accounts.models import FriendRequest, User, User
from django.conf import settings
from django.contrib.auth import get_user_model
import json
import pywebpush

User = get_user_model()

VAPID_PRIVATE_KEY = getattr(settings, "VAPID_PRIVATE_KEY", "")
VAPID_PUBLIC_KEY = getattr(settings, "VAPID_PUBLIC_KEY", "")
VAPID_CLAIMS = {"sub": "mailto:noreply@geoconnect.com"}


def send_push_notification(subscription, title, body, data=None):
    if not subscription:
        return False

    try:
        pywebpush.webpush(
            subscription_info={
                "endpoint": subscription.endpoint,
                "keys": {
                    "p256dh": subscription.p256dh,
                    "auth": subscription.auth,
                },
            },
            data=json.dumps({"title": title, "body": body, "data": data or {}}),
            vapid_private_key=VAPID_PRIVATE_KEY,
            vapid_claims=VAPID_CLAIMS,
        )
        return True
    except Exception:
        return False


class PushSubscriptionView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        endpoint = request.data.get("endpoint")
        p256dh = request.data.get("p256dh")
        auth = request.data.get("auth")

        if not endpoint or not p256dh or not auth:
            return Response(
                {"detail": "endpoint, p256dh, and auth are required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        subscription, created = PushSubscription.objects.get_or_create(
            user=request.user,
            endpoint=endpoint,
            defaults={"p256dh": p256dh, "auth": auth},
        )

        if not created:
            subscription.p256dh = p256dh
            subscription.auth = auth
            subscription.save()

        return Response(
            {"detail": "subscribed" if created else "updated"},
            status=status.HTTP_201_CREATED if created else status.HTTP_200_OK,
        )

    def delete(self, request):
        endpoint = request.data.get("endpoint")

        if not endpoint:
            return Response(
                {"detail": "endpoint is required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        deleted, _ = PushSubscription.objects.filter(
            user=request.user, endpoint=endpoint
        ).delete()

        if deleted:
            return Response(status=status.HTTP_204_NO_CONTENT)

        return Response(
            {"detail": "subscription not found"},
            status=status.HTTP_404_NOT_FOUND,
        )


class RequestLocationView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        receiver_id = request.data.get("receiver_id")

        if not receiver_id:
            return Response(
                {"detail": "receiver_id is required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            receiver = User.objects.get(id=receiver_id)
        except User.DoesNotExist:
            return Response(
                {"detail": "Receiver not found"},
                status=status.HTTP_404_NOT_FOUND,
            )

        if receiver == request.user:
            return Response(
                {"detail": "Cannot request location from yourself"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        are_friends = FriendRequest.objects.filter(
            models.Q(sender=request.user, receiver=receiver)
            | models.Q(sender=receiver, receiver=request.user),
            status="accepted",
        ).exists()

        if not are_friends:
            return Response(
                {"detail": "You can only request location from friends"},
                status=status.HTTP_403_FORBIDDEN,
            )

        location_request = LocationRequest.objects.create(
            sender=request.user,
            receiver=receiver,
        )

        subscriptions = PushSubscription.objects.filter(user=receiver)

        for subscription in subscriptions:
            send_push_notification(
                subscription=subscription,
                title="Location Request",
                body=f"{request.user.username} is requesting your live location.",
                data={
                    "type": "location_request",
                    "requestId": location_request.id,
                    "senderId": request.user.id,
                    "senderUsername": request.user.username,
                },
            )

        return Response(
            {
                "detail": "Location request sent",
                "request_id": location_request.id,
                "notifications_sent": subscriptions.count(),
            },
            status=status.HTTP_201_CREATED,
        )


class RespondLocationRequestView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        try:
            location_request = LocationRequest.objects.get(
                id=pk,
                receiver=request.user,
                status="pending",
            )
        except LocationRequest.DoesNotExist:
            return Response(
                {"detail": "Location request not found"},
                status=status.HTTP_404_NOT_FOUND,
            )

        new_status = request.data.get("status")

        if new_status not in ("accepted", "rejected"):
            return Response(
                {"detail": "Status must be 'accepted' or 'rejected'"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        location_request.status = new_status
        location_request.save()

        if new_status == "accepted":
            sender = location_request.sender
            subscriptions = PushSubscription.objects.filter(user=sender)

            for subscription in subscriptions:
                send_push_notification(
                    subscription=subscription,
                    title="Location Updated",
                    body=f"{request.user.username} has shared their live location with you.",
                    data={
                        "type": "location_accepted",
                        "requestId": location_request.id,
                        "senderId": request.user.id,
                        "senderUsername": request.user.username,
                    },
                )

        return Response(
            {
                "detail": f"Location request {new_status}",
                "request_id": location_request.id,
                "status": location_request.status,
            }
        )


class NotificationListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        notifications = Notification.objects.filter(
            recipient=request.user
        ).select_related("recipient")[:100]

        serializer = NotificationSerializer(notifications, many=True)
        unread_count = Notification.objects.filter(
            recipient=request.user, is_read=False
        ).count()

        return Response({
            "count": notifications.count(),
            "unread_count": unread_count,
            "results": serializer.data,
        })


class MarkNotificationReadView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        try:
            notification = Notification.objects.get(
                id=pk,
                recipient=request.user,
            )
        except Notification.DoesNotExist:
            return Response(
                {"detail": "Notification not found"},
                status=status.HTTP_404_NOT_FOUND,
            )

        notification.is_read = True
        notification.save(update_fields=["is_read"])

        return Response({"detail": "marked as read"})


class MarkAllNotificationsReadView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        updated = Notification.objects.filter(
            recipient=request.user, is_read=False
        ).update(is_read=True)

        return Response({"detail": f"{updated} notifications marked as read"})

