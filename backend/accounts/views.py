from flask import request


from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework_simplejwt.tokens import RefreshToken
from django.core.mail import send_mail
from django.conf import settings
from django.contrib.auth.tokens import default_token_generator
from django.utils.http import (
    urlsafe_base64_encode,
    urlsafe_base64_decode,
)
from django.utils.encoding import force_bytes
from django.utils.encoding import force_str
from django.db.models import Q
from .models import User, FriendRequest
from .serializers import (
    RegisterSerializer,
    LoginSerializer,
    ProfileSerializer,
    ProfileUpdateSerializer,
    ChangePasswordSerializer,
    UserSearchSerializer,
    FriendRequestSerializer,
    FriendRequestListSerializer,
)


class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = RegisterSerializer


class LoginView(APIView):
    def post(self, request):
        print(request.data)

        serializer = LoginSerializer(data=request.data)

        if serializer.is_valid():
            user = serializer.validated_data["user"]

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


class ProfileView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        serializer = ProfileSerializer(request.user)
        return Response(serializer.data)

    def patch(self, request):
        serializer = ProfileUpdateSerializer(
            request.user,
            data=request.data,
            partial=True
        )

        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)

        return Response(
            serializer.errors,
            status=status.HTTP_400_BAD_REQUEST
        )
    
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
            f"http://127.0.0.1:8000/api/reset-password/{uid64}/{token}/"
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
        query = request.GET.get("q", "")

        users = User.objects.filter(
            Q(username__icontains=query)
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

            if FriendRequest.objects.filter(
                sender=request.user,
                receiver=receiver,
            ).exists():
                return Response(
                    {"error": "Friend request already sent."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            serializer.save(sender=request.user)

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

        return Response(
            {"message": "Friend request accepted successfully."}
        )