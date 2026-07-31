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
import time
import pywebpush

logger = logging.getLogger(__name__)

User = get_user_model()

VAPID_PRIVATE_KEY = getattr(settings, "VAPID_PRIVATE_KEY", "")
VAPID_PUBLIC_KEY = getattr(settings, "VAPID_PUBLIC_KEY", "")
VAPID_CLAIMS = {"sub": "mailto:noreply@geoconnect.com"}

if not VAPID_PRIVATE_KEY:
    logger.warning("VAPID_PRIVATE_KEY is not configured in settings")

# HTTP statuses that are permanent: the subscription/endpoint/VAPID is invalid.
# These are pruned immediately and are NOT retried.
PERMANENT_STATUS_CODES = frozenset({400, 401, 403, 404, 410})

# HTTP statuses that are transient (rate-limit, gateway, timeout): retry them
# with a short backoff before giving up.
TRANSIENT_STATUS_CODES = frozenset({408, 419, 425, 429, 500, 502, 503, 504})

PUSH_MAX_ATTEMPTS = getattr(settings, "PUSH_NOTIFICATION_MAX_ATTEMPTS", 3)
PUSH_RETRY_BACKOFF = getattr(settings, "PUSH_NOTIFICATION_RETRY_BACKOFF", 0.25)


def _delete_stale_subscription(subscription):
    """Remove a subscription the push service rejects as invalid/gone."""
    try:
        subscription.delete()
        logger.info(
            "Deleted stale subscription for user=%s endpoint=%s",
            subscription.user.username,
            subscription.endpoint,
        )
    except Exception:
        logger.exception(
            "Failed to delete stale subscription for endpoint=%s",
            subscription.endpoint,
        )


def send_push_notification(
    subscription, title, body, data=None, max_attempts=PUSH_MAX_ATTEMPTS
):
    if not subscription:
        return False

    payload = json.dumps({"title": title, "body": body, "data": data or {}})

    logger.info(
        "Sending push notification to %s | title=%s | body=%s | data=%s",
        subscription.endpoint,
        title,
        body,
        data,
    )

    last_status = None
    for attempt in range(1, max_attempts + 1):
        try:
            pywebpush.webpush(
                subscription_info={
                    "endpoint": subscription.endpoint,
                    "keys": {
                        "p256dh": subscription.p256dh,
                        "auth": subscription.auth,
                    },
                },
                data=payload,
                vapid_private_key=VAPID_PRIVATE_KEY,
                vapid_claims=VAPID_CLAIMS,
            )
            logger.info(
                "Push notification sent successfully to %s (attempt %d/%d)",
                subscription.endpoint,
                attempt,
                max_attempts,
            )
            return True

        except pywebpush.WebPushException as exc:
            response = getattr(exc, "response", None)
            status_code = getattr(response, "status_code", None)
            last_status = status_code
            logger.error(
                "Push failed (attempt %d/%d) for %s | status=%s",
                attempt,
                max_attempts,
                subscription.endpoint,
                status_code,
            )

            # Invalid / revoked / unauthorized -> prune, do not retry.
            if status_code in PERMANENT_STATUS_CODES:
                _delete_stale_subscription(subscription)
                return False

            # Transient (rate-limit / gateway / timeout) -> retry with backoff.
            if status_code in TRANSIENT_STATUS_CODES and attempt < max_attempts:
                time.sleep(PUSH_RETRY_BACKOFF * (2 ** (attempt - 1)))
                continue

            return False

        except Exception:
            logger.exception(
                "Push delivery error (attempt %d/%d) for %s",
                attempt,
                max_attempts,
                subscription.endpoint,
            )
            if attempt < max_attempts:
                time.sleep(PUSH_RETRY_BACKOFF * (2 ** (attempt - 1)))
                continue
            return False

    logger.warning(
        "Exhausted retries for %s | last_status=%s",
        subscription.endpoint,
        last_status,
    )
    return False


def broadcast_push_notifications(subscriptions, title, body, data=None):
    """
    Fan a single push notification out to many PushSubscription recipients.

    Accepts any iterable of ``PushSubscription`` instances (a queryset, list,
    or empty container) and delivers to every device in it. Each subscription
    is delivered independently, so a failure for one device never aborts the
    rest of the broadcast. Stale endpoints are cleaned up automatically by
    ``send_push_notification``.

    Returns a summary dict: {"sent": int, "failed": int, "total": int}.
    """
    subscription_list = list(subscriptions)
    total = len(subscription_list)

    if total == 0:
        logger.info(
            "broadcast_push_notifications: nothing to send (title=%s)", title
        )
        return {"sent": 0, "failed": 0, "total": 0}

    sent = 0
    failed = 0
    for subscription in subscription_list:
        if send_push_notification(subscription, title, body, data):
            sent += 1
        else:
            failed += 1

    logger.info(
        "broadcast_push_notifications: title=%s total=%d sent=%d failed=%d",
        title, total, sent, failed,
    )
    return {"sent": sent, "failed": failed, "total": total}


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


class BroadcastNotificationView(APIView):
    """
    Broadcast a push notification to many subscriptions at once.

    POST /api/notifications/broadcast/
    {
        "title": "Hello",
        "body": "Optional body text",
        "data": {"type": "announcement", ...},   # optional payload merged into the push
        "subscriptions": [1, 2, 3]               # optional list of PushSubscription ids
    }

    When ``subscriptions`` is omitted the notification is fanned out to every
    registered subscription (system-wide broadcast). Guarded by
    ``IsAuthenticated``; tighten to staff-only in production if exposed.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        title = request.data.get("title")
        body = request.data.get("body", "")
        data = request.data.get("data") or {}

        if not title:
            return Response(
                {"detail": "title is required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        subscription_ids = request.data.get("subscriptions")
        if subscription_ids is not None:
            try:
                subscription_ids = [int(sid) for sid in subscription_ids]
            except (TypeError, ValueError):
                return Response(
                    {"detail": "subscriptions must be a list of ids"},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            subscriptions = PushSubscription.objects.filter(id__in=subscription_ids)
        else:
            subscriptions = PushSubscription.objects.all()

        result = broadcast_push_notifications(subscriptions, title, body, data)

        return Response(
            {
                "detail": "Broadcast complete",
                "sent": result["sent"],
                "failed": result["failed"],
                "total": result["total"],
            },
            status=status.HTTP_200_OK,
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

        broadcast_result = broadcast_push_notifications(
            subscriptions,
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
                "notifications_sent": broadcast_result["sent"],
                "notifications_failed": broadcast_result["failed"],
                "notifications_total": broadcast_result["total"],
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

            broadcast_push_notifications(
                subscriptions,
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

