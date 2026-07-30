import logging
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

logger = logging.getLogger(__name__)

User = get_user_model()

VAPID_PRIVATE_KEY = getattr(settings, "VAPID_PRIVATE_KEY", "")
VAPID_PUBLIC_KEY = getattr(settings, "VAPID_PUBLIC_KEY", "")
VAPID_CLAIMS = {"sub": "mailto:noreply@geoconnect.com"}

if not VAPID_PRIVATE_KEY:
    logger.warning("VAPID_PRIVATE_KEY is not configured in settings")


def send_push_notification(subscription, title, body, data=None):
    if not subscription:
        return False

    try:
        logger.info(
            "Sending push notification to %s | title=%s | body=%s | data=%s",
            subscription.endpoint,
            title,
            body,
            data,
        )
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
        logger.info("Push notification sent successfully to %s", subscription.endpoint)
        return True
    except pywebpush.WebPushException as exc:
        status_code = getattr(getattr(exc, "response", None), "status_code", None)
        logger.error(
            "Push failed for %s | status=%s | endpoint=%s",
            subscription.endpoint,
            status_code,
            subscription.endpoint,
        )
        if status_code in (400, 401, 403, 404, 410):
            try:
                subscription.delete()
                logger.info(
                    "Deleted stale subscription for user=%s endpoint=%s",
                    subscription.user.username,
                    subscription.endpoint,
                )
            except Exception:
                logger.exception("Failed to delete stale subscription")
        return False
    except Exception:
        logger.exception("Failed to send push notification to %s", subscription.endpoint)
        return False


class PushSubscriptionView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        has_subscription = PushSubscription.objects.filter(user=request.user).exists()
        return Response({"subscribed": has_subscription})

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
        logger.info(
            "RequestLocationView called by user=%s with data=%s",
            request.user.username,
            request.data,
        )
        receiver_id = request.data.get("receiver_id")

        if not receiver_id:
            logger.warning("RequestLocationView: missing receiver_id")
            return Response(
                {"detail": "receiver_id is required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            receiver = User.objects.get(id=receiver_id)
        except User.DoesNotExist:
            logger.warning("RequestLocationView: receiver not found id=%s", receiver_id)
            return Response(
                {"detail": "Receiver not found"},
                status=status.HTTP_404_NOT_FOUND,
            )

        if receiver == request.user:
            logger.warning("RequestLocationView: self-request blocked")
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
            logger.warning(
                "RequestLocationView: not friends requester=%s receiver=%s",
                request.user.username,
                receiver.username,
            )
            return Response(
                {"detail": "You can only request location from friends"},
                status=status.HTTP_403_FORBIDDEN,
            )

        location_request = LocationRequest.objects.create(
            sender=request.user,
            receiver=receiver,
        )
        logger.info(
            "RequestLocationView: created location_request id=%s sender=%s receiver=%s",
            location_request.id,
            request.user.username,
            receiver.username,
        )

        subscriptions = PushSubscription.objects.filter(user=receiver)
        logger.info(
            "RequestLocationView: found %d push subscriptions for receiver=%s",
            subscriptions.count(),
            receiver.username,
        )

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

