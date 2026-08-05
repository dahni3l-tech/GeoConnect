



from flask import request

from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.token_blacklist.models import BlacklistedToken
from django.core.mail import send_mail
from django.conf import settings
from django.contrib.auth.tokens import default_token_generator
from django.utils import timezone
from django.utils.http import (
    urlsafe_base64_encode,
    urlsafe_base64_decode,
)
from django.utils.encoding import force_bytes
from django.utils.encoding import force_str
from django.db.models import Q
from .models import User, FriendRequest, PermissionRequest
from notifications.models import LocationRequest, Notification, PushSubscription
from notifications.views import broadcast_push_notifications
from .serializers import (
    RegisterSerializer,
    LoginSerializer,
    ProfileSerializer,
    ProfileUpdateSerializer,
    ChangePasswordSerializer,
    UserSearchSerializer,
    FriendRequestSerializer,
    FriendRequestListSerializer,
    FriendSerializer,
    UpdateLocationSerializer,
    GuardianProfileSerializer,
    FamilyMemberSerializer,
    SafePlaceSerializer,
    EmergencyContactSerializer,
    PermissionRequestSerializer,
)
from rest_framework.parsers import MultiPartParser, FormParser


def _send_friend_request_notification(sender, receiver, notification_type, title, message, extra_data=None):
    data = {
        "type": notification_type,
        "senderId": sender.id,
        "senderUsername": sender.username,
    }
    if extra_data:
        data.update(extra_data)

    Notification.objects.create(
        recipient=receiver,
        notification_type=notification_type,
        title=title,
        message=message,
        data=data,
    )

    subscriptions = PushSubscription.objects.filter(user=receiver)
    broadcast_push_notifications(
        subscriptions,
        title=title,
        body=message,
        data=data,
    )


class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = RegisterSerializer


class LoginView(APIView):
    # print("===== LOGIN HIT =====")
    # i used to check if it was working
    
    def post(self, request):
        print(request.data)

        serializer = LoginSerializer(data=request.data)

        if serializer.is_valid():
            user = serializer.validated_data["user"]
            ip = request.META.get("REMOTE_ADDR")

            user.ip_address = ip
            user.save()

            refresh = RefreshToken.for_user(user)

            return Response({
                "message": "Login successful",
                "user": {
                    "id": user.id,
                    "username": user.username,
                    "email": user.email,
                },
                "tokens": {
                    "refresh": str(refresh),
                    "access": str(refresh.access_token),
                }
            })

        return Response(
            serializer.errors,
            status=status.HTTP_400_BAD_REQUEST
        )

class LogoutView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            refresh_token = request.data.get("refresh")
            if not refresh_token:
                return Response(
                    {"error": "Refresh token is required."},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            token = RefreshToken(refresh_token)
            token.blacklist()
            return Response(
                {"message": "Logged out successfully."},
                status=status.HTTP_200_OK,
            )
        except Exception:
            return Response(
                {"error": "Invalid token."},
                status=status.HTTP_400_BAD_REQUEST,
            )

class ProfileView(APIView):
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def get(self, request):
        user = request.user
        serializer = ProfileSerializer(user)
        return Response(serializer.data)

    def patch(self, request):
        print("REQUEST DATA:", request.data)
        print("FILES:", request.FILES)

        serializer = ProfileUpdateSerializer(
            request.user,
            data=request.data,
            partial=True,
        )

        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)

        return Response(serializer.errors, status=400)
    
class ChangePasswordView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = ChangePasswordSerializer(
            data=request.data,
            context={"request": request},
        )

        if serializer.is_valid():
            serializer.save()

            return Response(
                {"message": "Password changed successfully."},
                status=status.HTTP_200_OK,
            )

        return Response(
            serializer.errors,
            status=status.HTTP_400_BAD_REQUEST,
        )
    
class ForgotPasswordView(APIView):
    def post(self, request):
        email = request.data.get("email")

        user = User.objects.filter(email=email).first()

        if not user:
            return Response(
                {"error": "No user found with this email."},
                status=status.HTTP_404_NOT_FOUND,
            )

        uid64 = urlsafe_base64_encode(force_bytes(user.pk))
        token = default_token_generator.make_token(user)

        reset_link = (
            f"https://geoconnect-afte.onrender.com/api/reset-password/{uid64}/{token}/"
        )

        send_mail(
            "GeoConnect Password Reset",
            f"Click the link below to reset your password:\n\n{reset_link}",
            settings.DEFAULT_FROM_EMAIL,
            [user.email],
            fail_silently=False,
        )

        return Response({
    "message": "Password reset email sent.",
    "reset_link": reset_link
})
    
class ResetPasswordView(APIView):
    def post(self, request, uidb64, token):
        try:
            uid = force_str(urlsafe_base64_decode(uidb64))
            user = User.objects.get(pk=uid)

        except Exception:
            return Response(
                {"error": "Invalid reset link."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not default_token_generator.check_token(user, token):
            return Response(
                {"error": "Invalid or expired token."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        new_password = request.data.get("new_password")

        if not new_password:
            return Response(
                {"error": "New password is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        user.set_password(new_password)
        user.save()

        return Response(
            {"message": "Password reset successful."}
        ) 
    
#     {
#     "email": "folakunle2001@yahoo.com"
# }
class UserSearchView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        query = request.GET.get("q", "").strip()

        if not query:
            return Response(
                {"message": "Search query is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        users = User.objects.filter(
            Q(username__icontains=query) | Q(email__icontains=query)
        ).exclude(id=request.user.id)

        serializer = UserSearchSerializer(users, many=True)

        return Response(serializer.data)
        
class SendFriendRequestView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        friend_requests = FriendRequest.objects.filter(
            receiver=request.user,
            status="pending",
        )

        serializer = FriendRequestListSerializer(
            friend_requests,
            many=True,
        )

        return Response(serializer.data)

    def post(self, request):
        serializer = FriendRequestSerializer(data=request.data)

        if serializer.is_valid():
            receiver = serializer.validated_data["receiver"]

            if receiver == request.user:
                return Response(
                    {"error": "You cannot send a friend request to yourself."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            existing_request = FriendRequest.objects.filter(
                sender=request.user,
                receiver=receiver,
            ).first()

            if existing_request:
                if existing_request.status == "pending":
                    return Response(
                        {"error": "Friend request already sent."},
                        status=status.HTTP_400_BAD_REQUEST,
                    )

                if existing_request.status == "accepted":
                    return Response(
                        {"error": "You are already friends."},
                        status=status.HTTP_400_BAD_REQUEST,
                    )

                # Previous request was rejected, so remove it
                existing_request.delete()

            serializer.save(sender=request.user)

            _send_friend_request_notification(
                sender=request.user,
                receiver=receiver,
                notification_type="friend_request",
                title="Friend Request",
                message=f"{request.user.username} sent you a friend request.",
            )

            return Response(
                serializer.data,
                status=status.HTTP_201_CREATED,
            )

        return Response(
            serializer.errors,
            status=status.HTTP_400_BAD_REQUEST,
        )
    
class AcceptFriendRequestView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        try:
            friend_request = FriendRequest.objects.get(
                id=pk,
                receiver=request.user,
                status="pending",
            )

        except FriendRequest.DoesNotExist:
            return Response(
                {"error": "Friend request not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        friend_request.status = "accepted"
        friend_request.save()

        sender = friend_request.sender

        _send_friend_request_notification(
            sender=request.user,
            receiver=sender,
            notification_type="friend_request_accepted",
            title="Friend Request Accepted",
            message=f"{request.user.username} accepted your friend request.",
            extra_data={"requestId": friend_request.id},
        )

        return Response(
            {"message": "Friend request accepted successfully."}
        )
    
class RejectFriendRequestView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        try:
            friend_request = FriendRequest.objects.get(
                id=pk,
                receiver=request.user,
                status="pending",
            )

        except FriendRequest.DoesNotExist:
            return Response(
                {"error": "Friend request not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        sender = friend_request.sender
        friend_request.delete()

        _send_friend_request_notification(
            sender=request.user,
            receiver=sender,
            notification_type="friend_request_rejected",
            title="Friend Request Rejected",
            message=f"{request.user.username} rejected your friend request.",
        )

        return Response(
            {"message": "Friend request rejected successfully."}
        )

class FriendsListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        friendships = FriendRequest.objects.filter(
            status="accepted",
        ).filter(
            Q(sender=request.user) | Q(receiver=request.user)
        ).select_related("sender", "receiver")

        friends = {}

        for friendship in friendships:
            if friendship.sender == request.user:
                friends[friendship.receiver.id] = friendship.receiver
            else:
                friends[friendship.sender.id] = friendship.sender

        serializer = FriendSerializer(
            friends.values(),
            many=True,
        )

        return Response(serializer.data)

        # It should send authorization as bearer token in the header of the request.to rest password

class UpdateIPAddressView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        ip = request.META.get("REMOTE_ADDR")

        request.user.ip_address = ip
        request.user.save()

        return Response({
            "message": "IP address updated successfully.",
            "ip_address": request.user.ip_address,
        })  

class UpdateLocationView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = UpdateLocationSerializer(
            request.user,
            data=request.data,
            partial=True,
        )

        if serializer.is_valid():
            serializer.save()

            return Response({
                "message": "Location updated successfully.",
                "latitude": serializer.data["latitude"],
                "longitude": serializer.data["longitude"],
            })

        return Response(
            serializer.errors,
            status=status.HTTP_400_BAD_REQUEST,
        )


class OnlineStatusView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        is_online = request.data.get("is_online", True)
        was_offline = not request.user.is_online
        request.user.is_online = bool(is_online)
        request.user.last_seen = timezone.now()
        request.user.save(update_fields=["is_online", "last_seen"])

        if is_online and was_offline:
            self._notify_friends_online(request.user)

        return Response({
            "is_online": request.user.is_online,
            "last_seen": request.user.last_seen,
        })

    def _notify_friends_online(self, user):
        friend_ids = FriendRequest.objects.filter(
            Q(sender=user, status="accepted") |
            Q(receiver=user, status="accepted")
        ).values_list("sender_id", "receiver_id")

        friends = set()
        for sender_id, receiver_id in friend_ids:
            if sender_id == user.id:
                friends.add(receiver_id)
            else:
                friends.add(sender_id)

        if not friends:
            return

        for friend_id in friends:
            try:
                friend = User.objects.get(id=friend_id)
            except User.DoesNotExist:
                continue

            Notification.objects.create(
                recipient=friend,
                notification_type="friend_online",
                title="Friend Online",
                message=f"{user.username} is now online.",
                data={"user_id": user.id, "username": user.username},
            )

            subscriptions = PushSubscription.objects.filter(user=friend)
            broadcast_push_notifications(
                subscriptions,
                title="Friend Online",
                body=f"{user.username} is now online.",
                data={
                    "type": "friend_online",
                    "userId": user.id,
                    "username": user.username,
                },
            )


class PendingLocationRequestsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        requests = LocationRequest.objects.filter(
            receiver=request.user,
            status="pending",
        ).select_related("sender")

        data = []
        for req in requests:
            data.append({
                "id": req.id,
                "sender_id": req.sender.id,
                "sender_username": req.sender.username,
                "sender_profile_picture": req.sender.profile_picture.url if req.sender.profile_picture else None,
                "created_at": req.created_at.isoformat(),
                "expires_at": req.expires_at.isoformat(),
            })

        return Response(data)


class GuardianDashboardView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        profile = getattr(user, "guardian_profile", None)

        data = {
            "is_guardian": user.is_guardian,
            "profile": GuardianProfileSerializer(profile).data if profile else None,
            "family_members": FamilyMemberSerializer(profile.family_members.all(), many=True).data if profile else [],
            "safe_places": SafePlaceSerializer(profile.safe_places.all(), many=True).data if profile else [],
            "emergency_contacts": EmergencyContactSerializer(profile.emergency_contacts.all(), many=True).data if profile else [],
        }

        return Response(data)


class GuardianProfileView(APIView):
    permission_classes = [IsAuthenticated]

    def put(self, request):
        profile = getattr(request.user, "guardian_profile", None)

        if not profile:
            return Response(
                {"error": "Guardian profile not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        serializer = GuardianProfileSerializer(profile, data=request.data, partial=True)

        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class FamilyMemberListCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        profile = getattr(request.user, "guardian_profile", None)

        if not profile:
            return Response(
                {"error": "Guardian profile not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        members = profile.family_members.all()
        serializer = FamilyMemberSerializer(members, many=True)
        return Response(serializer.data)

    def post(self, request):
        profile = getattr(request.user, "guardian_profile", None)

        if not profile:
            return Response(
                {"error": "Guardian profile not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        serializer = FamilyMemberSerializer(data=request.data)

        if serializer.is_valid():
            serializer.save(guardian_profile=profile)
            return Response(serializer.data, status=status.HTTP_201_CREATED)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class SafePlaceListCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        profile = getattr(request.user, "guardian_profile", None)

        if not profile:
            return Response(
                {"error": "Guardian profile not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        places = profile.safe_places.all()
        serializer = SafePlaceSerializer(places, many=True)
        return Response(serializer.data)

    def post(self, request):
        profile = getattr(request.user, "guardian_profile", None)

        if not profile:
            return Response(
                {"error": "Guardian profile not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        serializer = SafePlaceSerializer(data=request.data)

        if serializer.is_valid():
            serializer.save(guardian_profile=profile)
            return Response(serializer.data, status=status.HTTP_201_CREATED)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class EmergencyContactListCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        profile = getattr(request.user, "guardian_profile", None)

        if not profile:
            return Response(
                {"error": "Guardian profile not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        contacts = profile.emergency_contacts.all()
        serializer = EmergencyContactSerializer(contacts, many=True)
        return Response(serializer.data)

    def post(self, request):
        profile = getattr(request.user, "guardian_profile", None)

        if not profile:
            return Response(
                {"error": "Guardian profile not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        serializer = EmergencyContactSerializer(data=request.data)

        if serializer.is_valid():
            serializer.save(guardian_profile=profile)
            return Response(serializer.data, status=status.HTTP_201_CREATED)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class FamilyInvitationView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        child_identifier = request.data.get("child_identifier")
        relation = request.data.get("relation")
        nickname = request.data.get("nickname", "")

        if not child_identifier or not relation:
            return Response(
                {"error": "child_identifier and relation are required."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        # Accept user ID, username, or email
        child = None

        # Integer ID
        if isinstance(child_identifier, int):
            child = User.objects.filter(id=child_identifier).first()

        # Numeric string ID
        elif str(child_identifier).isdigit():
            child = User.objects.filter(id=int(child_identifier)).first()

        # Email
        elif "@" in str(child_identifier):
            child = User.objects.filter(email=child_identifier).first()

        # Username
        else:
            child = User.objects.filter(username=child_identifier).first()
       

        if not child:
            return Response(
                {"error": "Child not found. Please check the username or email."},
                status=status.HTTP_404_NOT_FOUND,
            )

        if child == request.user:
            return Response(
                {"error": "You cannot send a family invitation to yourself."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        existing = FamilyInvitation.objects.filter(
            guardian=request.user,
            child=child,
            status="pending",
        ).first()

        if existing:
            return Response(
                {"error": "You already have a pending invitation for this user."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        blocked_by_sender = FamilyInvitation.objects.filter(
            guardian=request.user,
            child=child,
            status="blocked",
        ).first()

        if blocked_by_sender:
            return Response(
                {"error": "You have blocked this user from family requests."},
                status=status.HTTP_403_FORBIDDEN,
            )

        blocked_by_receiver = FamilyInvitation.objects.filter(
            guardian=child,
            child=request.user,
            status="blocked",
        ).first()

        if blocked_by_receiver:
            return Response(
                {"error": "This user has blocked family requests from you."},
                status=status.HTTP_403_FORBIDDEN,
            )

        invitation = FamilyInvitation.objects.create(
            guardian=request.user,
            child=child,
            relation=relation,
            nickname=nickname,
        )

        Notification.objects.create(
            recipient=child,
            notification_type="family_invitation",
            title="Family Circle Invitation",
            message=f"{request.user.username} wants to add you as {relation} in their Family Circle.",
            data={
                "type": "family_invitation",
                "invitationId": invitation.id,
                "guardianId": request.user.id,
                "guardianUsername": request.user.username,
                "relation": relation,
            },
        )

        subscriptions = PushSubscription.objects.filter(user=child)
        broadcast_push_notifications(
            subscriptions,
            title="Family Circle Invitation",
            body=f"{request.user.username} wants to add you as {relation} in their Family Circle.",
            data={
                "type": "family_invitation",
                "invitationId": invitation.id,
                "guardianId": request.user.id,
                "guardianUsername": request.user.username,
                "relation": relation,
            },
        )

        return Response(
            FamilyInvitationSerializer(invitation).data,
            status=status.HTTP_201_CREATED,
        )

    def get(self, request):
        invitations = FamilyInvitation.objects.filter(child=request.user, status="pending")
        serializer = FamilyInvitationSerializer(invitations, many=True)
        return Response(serializer.data)


class RespondFamilyInvitationView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        try:
            invitation = FamilyInvitation.objects.get(
                id=pk,
                child=request.user,
                status="pending",
            )
        except FamilyInvitation.DoesNotExist:
            return Response(
                {"error": "Invitation not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        action = request.data.get("action")
        permission_type = request.data.get("permission_type", "always")

        if action not in ("accept", "decline", "block"):
            return Response(
                {"error": "Action must be 'accept', 'decline', or 'block'."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if action == "accept":
            invitation.status = "accepted"
            invitation.save()

            FamilyMemberLink.objects.get_or_create(
                guardian=invitation.guardian,
                child=request.user,
                defaults={
                    "relation": invitation.relation,
                    "nickname": invitation.nickname,
                },
            )

            LocationPermission.objects.get_or_create(
                child=request.user,
                guardian=invitation.guardian,
                defaults={"permission_type": permission_type},
            )

            ActivityLog.objects.create(
                user=request.user,
                activity_type="family_joined",
                description=f"{request.user.username} accepted family invitation from {invitation.guardian.username}",
                metadata={"guardian_id": invitation.guardian.id},
            )

            Notification.objects.create(
                recipient=invitation.guardian,
                notification_type="family_request_accepted",
                title="Family Request Accepted",
                message=f"{request.user.username} accepted your family invitation.",
                data={
                    "type": "family_request_accepted",
                    "childId": request.user.id,
                    "childUsername": request.user.username,
                },
            )

            subscriptions = PushSubscription.objects.filter(user=invitation.guardian)
            broadcast_push_notifications(
                subscriptions,
                title="Family Request Accepted",
                body=f"{request.user.username} accepted your family invitation.",
                data={
                    "type": "family_request_accepted",
                    "childId": request.user.id,
                    "childUsername": request.user.username,
                },
            )

        elif action == "decline":
            invitation.status = "declined"
            invitation.responded_at = timezone.now()
            invitation.save()

        elif action == "block":
            invitation.status = "blocked"
            invitation.responded_at = timezone.now()
            invitation.save()

        return Response({"status": invitation.status})


class FamilyMembersView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        if user.is_guardian:
            links = FamilyMemberLink.objects.filter(guardian=user)
        else:
            links = FamilyMemberLink.objects.filter(child=user)

        serializer = FamilyMemberLinkSerializer(links, many=True)
        return Response(serializer.data)


class RemoveFamilyMemberView(APIView):
    permission_classes = [IsAuthenticated]

    def delete(self, request, user_id):
        try:
            target = User.objects.get(id=user_id)
        except User.DoesNotExist:
            return Response(
                {"error": "User not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        if request.user.is_guardian:
            link = FamilyMemberLink.objects.filter(guardian=request.user, child=target).first()
        else:
            link = FamilyMemberLink.objects.filter(child=request.user, guardian=target).first()

        if not link:
            return Response(
                {"error": "Family link not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        ActivityLog.objects.create(
            user=request.user,
            activity_type="family_left",
            description=f"{request.user.username} removed {target.username} from family",
            metadata={"removed_user_id": target.id},
        )

        link.delete()
        return Response({"message": "Family member removed."})


class LocationPermissionView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        if user.is_guardian:
            permissions = LocationPermission.objects.filter(guardian=user)
        else:
            permissions = LocationPermission.objects.filter(child=user)

        serializer = LocationPermissionSerializer(permissions, many=True)
        return Response(serializer.data)

    def patch(self, request):
        user = request.user
        if user.is_guardian:
            return Response(
                {"error": "Guardians cannot change permissions. The child controls sharing."},
                status=status.HTTP_403_FORBIDDEN,
            )

        guardian_id = request.data.get("guardian_id")
        permission_type = request.data.get("permission_type")
        paused_until = request.data.get("paused_until")

        if not guardian_id or not permission_type:
            return Response(
                {"error": "guardian_id and permission_type are required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            guardian = User.objects.get(id=guardian_id)
        except User.DoesNotExist:
            return Response(
                {"error": "Guardian not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        permission, created = LocationPermission.objects.get_or_create(
            child=user,
            guardian=guardian,
            defaults={"permission_type": permission_type},
        )

        if not created:
            permission.permission_type = permission_type
            if paused_until is not None:
                permission.paused_until = paused_until
            permission.save()

        ActivityLog.objects.create(
            user=user,
            activity_type="permission_changed",
            description=f"{user.username} changed location permission for {guardian.username} to {permission_type}",
            metadata={"guardian_id": guardian.id, "permission_type": permission_type},
        )

        return Response(LocationPermissionSerializer(permission).data)


class SOSAlertListCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if request.user.is_guardian:
            child_ids = FamilyMemberLink.objects.filter(guardian=request.user).values_list("child_id", flat=True)
            alerts = SOSAlert.objects.filter(child_id__in=child_ids)
        else:
            alerts = SOSAlert.objects.filter(child=request.user)

        serializer = SOSAlertSerializer(alerts, many=True)
        return Response(serializer.data)

    def post(self, request):
        if request.user.is_guardian:
            return Response(
                {"error": "Only children can trigger SOS alerts."},
                status=status.HTTP_403_FORBIDDEN,
            )

        latitude = request.data.get("latitude")
        longitude = request.data.get("longitude")

        alert = SOSAlert.objects.create(
            child=request.user,
            latitude=latitude,
            longitude=longitude,
        )

        guardian_ids = FamilyMemberLink.objects.filter(child=request.user).values_list("guardian_id", flat=True)
        guardians = User.objects.filter(id__in=guardian_ids)

        for guardian in guardians:
            Notification.objects.create(
                recipient=guardian,
                notification_type="sos_alert",
                title="SOS Alert",
                message=f"{request.user.username} triggered an SOS alert.",
                data={
                    "type": "sos_alert",
                    "alertId": alert.id,
                    "childId": request.user.id,
                    "childUsername": request.user.username,
                    "latitude": latitude,
                    "longitude": longitude,
                },
            )

            subscriptions = PushSubscription.objects.filter(user=guardian)
            broadcast_push_notifications(
                subscriptions,
                title="SOS Alert",
                body=f"{request.user.username} triggered an SOS alert.",
                data={
                    "type": "sos_alert",
                    "alertId": alert.id,
                    "childId": request.user.id,
                    "childUsername": request.user.username,
                    "latitude": latitude,
                    "longitude": longitude,
                },
            )

        return Response(SOSAlertSerializer(alert).data, status=status.HTTP_201_CREATED)


class ResolveSOSAlertView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        try:
            alert = SOSAlert.objects.get(id=pk, status="active")
        except SOSAlert.DoesNotExist:
            return Response(
                {"error": "SOS alert not found or already resolved."},
                status=status.HTTP_404_NOT_FOUND,
            )

        alert.status = "resolved"
        alert.resolved_at = timezone.now()
        alert.save()

        ActivityLog.objects.create(
            user=request.user,
            activity_type="sos_resolved",
            description=f"SOS alert from {alert.child.username} resolved",
            metadata={"alertId": alert.id},
        )

        return Response({"message": "SOS alert resolved."})


class RouteHistoryView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user_id = request.query_params.get("user_id")
        date = request.query_params.get("date")

        if request.user.is_guardian:
            if not user_id:
                return Response(
                    {"error": "user_id is required for guardians."},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            try:
                child = User.objects.get(id=user_id)
                is_linked = FamilyMemberLink.objects.filter(guardian=request.user, child=child).exists()
                if not is_linked:
                    return Response(
                        {"error": "You are not linked to this family member."},
                        status=status.HTTP_403_FORBIDDEN,
                    )
            except User.DoesNotExist:
                return Response(
                    {"error": "User not found."},
                    status=status.HTTP_404_NOT_FOUND,
                )
            target_user = child
        else:
            target_user = request.user

        queryset = RouteHistory.objects.filter(user=target_user)

        if date:
            queryset = queryset.filter(created_at__date=date)

        serializer = RouteHistorySerializer(queryset, many=True)
        return Response(serializer.data)


class ActivityLogView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        if user.is_guardian:
            child_ids = FamilyMemberLink.objects.filter(guardian=user).values_list("child_id", flat=True)
            logs = ActivityLog.objects.filter(user_id__in=child_ids)
        else:
            logs = ActivityLog.objects.filter(user=user)

        serializer = ActivityLogSerializer(logs, many=True)
        return Response(serializer.data)


class PermissionRequestView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        if user.is_guardian:
            requests = PermissionRequest.objects.filter(guardian=user)
        else:
            requests = PermissionRequest.objects.filter(child=user)
        serializer = PermissionRequestSerializer(requests, many=True)
        return Response(serializer.data)

    def post(self, request):
        user = request.user
        if user.is_guardian:
            child_id = request.data.get("child_id")
            requested_permission = request.data.get("requested_permission")

            if not child_id or not requested_permission:
                return Response(
                    {"error": "child_id and requested_permission are required."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            try:
                child = User.objects.get(id=child_id)
            except User.DoesNotExist:
                return Response(
                    {"error": "Child not found."},
                    status=status.HTTP_404_NOT_FOUND,
                )

            if not FamilyMemberLink.objects.filter(guardian=user, child=child).exists():
                return Response(
                    {"error": "You are not linked to this family member."},
                    status=status.HTTP_403_FORBIDDEN,
                )

            permission = LocationPermission.objects.filter(child=child, guardian=user).first()
            current = permission.permission_type if permission else "always"

            req = PermissionRequest.objects.create(
                child=child,
                guardian=user,
                current_permission=current,
                requested_permission=requested_permission,
            )

            Notification.objects.create(
                recipient=child,
                notification_type="permission_request",
                title="Permission Change Request",
                message=f"{user.username} requested to change your location sharing to {dict(LocationPermission.PERMISSION_CHOICES)[requested_permission]}.",
                data={
                    "type": "permission_request",
                    "requestId": req.id,
                    "guardianId": user.id,
                    "guardianUsername": user.username,
                    "currentPermission": current,
                    "requestedPermission": requested_permission,
                },
            )

            return Response(PermissionRequestSerializer(req).data, status=status.HTTP_201_CREATED)

        else:
            request_id = request.data.get("request_id")
            action = request.data.get("action")

            if not request_id or not action:
                return Response(
                    {"error": "request_id and action are required."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            if action not in ("accept", "decline"):
                return Response(
                    {"error": "Action must be 'accept' or 'decline'."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            try:
                req = PermissionRequest.objects.get(id=request_id, child=user, status="pending")
            except PermissionRequest.DoesNotExist:
                return Response(
                    {"error": "Request not found."},
                    status=status.HTTP_404_NOT_FOUND,
                )

            req.status = "accepted" if action == "accept" else "declined"
            req.responded_at = timezone.now()
            req.save()

            if action == "accept":
                permission, created = LocationPermission.objects.get_or_create(
                    child=user,
                    guardian=req.guardian,
                    defaults={"permission_type": req.requested_permission},
                )
                if not created:
                    permission.permission_type = req.requested_permission
                    permission.save()

                ActivityLog.objects.create(
                    user=user,
                    activity_type="permission_changed",
                    description=f"{user.username} accepted permission request from {req.guardian.username} to {req.requested_permission}",
                    metadata={"guardian_id": req.guardian.id, "permission_type": req.requested_permission},
                )

            return Response(PermissionRequestSerializer(req).data)


class FamilyMapDataView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if not request.user.is_guardian:
            return Response(
                {"error": "Only guardians can access family map data."},
                status=status.HTTP_403_FORBIDDEN,
            )

        links = FamilyMemberLink.objects.filter(guardian=request.user)
        data = []

        for link in links:
            child = link.child
            latest_route = RouteHistory.objects.filter(user=child).first()
            permission = LocationPermission.objects.filter(child=child, guardian=request.user).first()

            data.append({
                "id": child.id,
                "username": child.username,
                "profile_picture": child.profile_picture.url if child.profile_picture else None,
                "is_online": child.is_online,
                "last_seen": child.last_seen,
                "latitude": child.latitude,
                "longitude": child.longitude,
                "relation": link.relation,
                "nickname": link.nickname,
                "permission_type": permission.permission_type if permission else "always",
                "latest_location": {
                    "latitude": latest_route.latitude,
                    "longitude": latest_route.longitude,
                    "battery_level": latest_route.battery_level,
                    "created_at": latest_route.created_at,
                } if latest_route else None,
            })

        return Response(data)
