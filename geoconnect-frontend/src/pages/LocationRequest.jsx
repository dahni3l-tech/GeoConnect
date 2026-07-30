import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { respondToLocationRequest } from "../services/pushNotificationService";
import { updateLocation } from "../services/locationService";
import { getProfile } from "../services/profileService";
import "./styles/LocationRequest.css";

function LocationRequest() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const requestId = searchParams.get("requestId");
  const senderUsername = searchParams.get("senderUsername") || "Someone";
  const senderId = searchParams.get("senderId");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [status, setStatus] = useState(null); // "accepted" | "rejected" | null

  useEffect(() => {
    if (!requestId) {
      navigate("/dashboard");
    }
  }, [requestId, navigate]);

  const getLocationAndShare = async () => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser.");
      return;
    }

    return new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            await updateLocation(
              position.coords.latitude,
              position.coords.longitude
            );
            resolve();
          } catch (err) {
            reject(err);
          }
        },
        (error) => {
          reject(error);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        }
      );
    });
  };

  const handleAccept = async () => {
    setLoading(true);
    setError("");

    try {
      await getLocationAndShare();
      await respondToLocationRequest(requestId, "accepted");
      setStatus("accepted");
      setTimeout(() => {
        navigate("/dashboard");
      }, 2000);
    } catch (err) {
      setError("Failed to share location. Please try again.");
      setLoading(false);
    }
  };

  const handleReject = async () => {
    setLoading(true);
    setError("");

    try {
      await respondToLocationRequest(requestId, "rejected");
      setStatus("rejected");
      setTimeout(() => {
        navigate("/dashboard");
      }, 2000);
    } catch (err) {
      setError("Failed to respond. Please try again.");
      setLoading(false);
    }
  };

  if (status === "accepted") {
    return (
      <div className="location-request-page">
        <div className="location-request-card success">
          <div className="success-icon">✅</div>
          <h2>Location Shared</h2>
          <p>You have shared your location with {decodeURIComponent(senderUsername)}.</p>
          <p className="sub-text">Your location will update every 30 seconds.</p>
        </div>
      </div>
    );
  }

  if (status === "rejected") {
    return (
      <div className="location-request-page">
        <div className="location-request-card rejected">
          <div className="rejected-icon">❌</div>
          <h2>Request Rejected</h2>
          <p>You have rejected the location request from {decodeURIComponent(senderUsername)}.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="location-request-page">
      <div className="location-request-card">
        <div className="request-icon">📍</div>
        <h2>Location Request</h2>
        <p className="request-message">
          <strong>{decodeURIComponent(senderUsername)}</strong> is requesting your live location.
        </p>
        <p className="request-detail">
          If you accept, your current location will be shared and updated every 30 seconds.
        </p>

        {error && <p className="error-text">{error}</p>}

        <div className="request-actions">
          <button
            className="btn btn-accept"
            onClick={handleAccept}
            disabled={loading}
          >
            {loading ? "Sharing..." : "Accept"}
          </button>
          <button
            className="btn btn-reject"
            onClick={handleReject}
            disabled={loading}
          >
            {loading ? "Sending..." : "Reject"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default LocationRequest;
