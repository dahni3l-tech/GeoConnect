from django.urls import path
from .views import (
    PushSubscriptionView,
    BroadcastNotificationView,
    NotificationListView,
    MarkNotificationReadView,
    MarkAllNotificationsReadView,
)

urlpatterns = [
    path("subscribe/", PushSubscriptionView.as_view(), name="push-subscribe"),
    path("unsubscribe/", PushSubscriptionView.as_view(), name="push-unsubscribe"),
    path(
        "broadcast/",
        BroadcastNotificationView.as_view(),
        name="push-broadcast",
    ),
    path("notifications/", NotificationListView.as_view(), name="notification-list"),
    path("notifications/<int:pk>/read/", MarkNotificationReadView.as_view(), name="notification-mark-read"),
    path("notifications/read-all/", MarkAllNotificationsReadView.as_view(), name="notification-mark-all-read"),
]
