import { useLocation, useNavigate } from "react-router-dom";
import { useState } from "react";
import { requestLocation } from "../services/locationRequestService";
import "./styles/FriendDetails.css";

function FriendDetails() {
  const { state } = useLocation();
  const friend = state?.friend;
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!friend) {
    return (
      <div className="friend-details-page">
        <h2>Friend not found.</h2>
      </div>
    );
  }

  const handleRequestLocation = async () => {
    setLoading(true);
    setError("");

    try {
      await requestLocation(friend.id);
      alert("Location request sent!");
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to send location request.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="friend-details-page">

      <button
        className="back-btn"
        onClick={() => navigate(-1)}
      >
        ← Back
      </button>

      <div className="friend-profile-card">

        <div className="friend-avatar-large">
          {friend.profile_picture ? (
            <img
              src={friend.profile_picture}
              alt={friend.username}
            />
          ) : (
            <span>{friend.username[0].toUpperCase()}</span>
          )}
        </div>

        <h1>{friend.username}</h1>

        <div className="friend-info">

          <div className="info-item">
            <strong>Email</strong>
            <p>{friend.email}</p>
          </div>

          <div className="info-item">
            <strong>IP Address</strong>
            <p>{friend.ip_address || "Unavailable"}</p>
          </div>

          <div className="info-item">
            <strong>Latitude</strong>
            <p>{friend.latitude ?? "N/A"}</p>
          </div>

          <div className="info-item">
            <strong>Longitude</strong>
            <p>{friend.longitude ?? "N/A"}</p>
          </div>

        </div>

        <button
          className="open-map-btn"
          onClick={() =>
            navigate(`/friends/${friend.id}/map`, {
            state: {
                friend,
            },
            })
          }
        >
          Open Live Map
        </button>

        <button
          className="request-location-btn"
          onClick={handleRequestLocation}
          disabled={loading}
        >
          {loading ? "Sending..." : "Request Live Location"}
        </button>

        {error && <p className="error-text">{error}</p>}

      </div>

    </div>
  );
}

export default FriendDetails;