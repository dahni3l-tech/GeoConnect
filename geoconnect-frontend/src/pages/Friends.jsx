import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { getFriends } from "../services/friendService";
import { requestLocation } from "../services/locationRequestService";
import "./styles/Friends.css";


function Friends() {
  const [friends, setFriends] = useState([]);
  const [loadingRequestId, setLoadingRequestId] = useState(null);
  const navigate = useNavigate();

  const loadFriends = useCallback(async () => {
    try {
      const data = await getFriends();
      setFriends(data);
    } catch (error) {
      console.error("Failed to load friends:", error);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadFriends();
    const interval = setInterval(loadFriends, 15000);
    return () => clearInterval(interval);
  }, [loadFriends]);

  const handleRequestLocation = async (friendId) => {
    setLoadingRequestId(friendId);
    try {
      await requestLocation(friendId);
    } catch (error) {
      console.error("Failed to request location:", error);
    } finally {
      setLoadingRequestId(null);
    }
  };

  const formatLastSeen = (lastSeen) => {
    if (!lastSeen) return "Offline";
    const date = new Date(lastSeen);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return "Online";
    if (diffMins < 60) return `Last seen ${diffMins}m ago`;

    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `Last seen ${diffHours}h ago`;

    const diffDays = Math.floor(diffHours / 24);
    return `Last seen ${diffDays}d ago`;
  };

  const getDistance = (friend) => {
    if (!friend.latitude || !friend.longitude) return null;
    if (!friend.latitude || !friend.longitude) return null;
    return `${(Math.abs(friend.latitude) + Math.abs(friend.longitude)).toFixed(2)}° away`;
  };

  return (
    <div className="friends-page">
      <button className="back-btn" onClick={() => navigate('/dashboard')}>← Back</button>
      <div className="friends-header">
        <h1>Friends</h1>
        <p className="friends-subtitle">
          Stay close to the people who matter most.
        </p>
      </div>

      {friends.length === 0 && (
        <div className="empty-friends">
          <div className="empty-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          </div>
          <h3>No friends yet</h3>
          <p>
            Search for users and send your first friend request.
          </p>
        </div>
      )}

      <div className="friends-grid">
        {friends.map(friend => (
          <div
            className="friend-card"
            key={friend.id}
          >
            <div className="friend-card-top">
              <div className="friend-avatar-wrap">
                <div className="friend-avatar">
                  {friend.profile_picture ? (
                    <img
                      src={friend.profile_picture}
                      alt={friend.username}
                    />
                  ) : (
                    <span>
                      {friend.username[0].toUpperCase()}
                    </span>
                  )}
                </div>
                <span
                  className={`online-indicator ${friend.is_online ? "online" : "offline"}`}
                  title={formatLastSeen(friend.last_seen)}
                />
              </div>

              <div className="friend-name-row">
                <h3>{friend.username}</h3>
              </div>

              {friend.bio && (
                <p className="friend-bio">{friend.bio}</p>
              )}

              <div className="friend-meta">
                <span className={`status-badge ${friend.is_online ? "online" : "offline"}`}>
                  {friend.is_online ? "Online" : formatLastSeen(friend.last_seen)}
                </span>
                {getDistance(friend) && (
                  <span className="distance-badge">📍 {getDistance(friend)}</span>
                )}
              </div>
            </div>

            <div className="friend-actions">
              <button
                className="action-btn action-btn--primary"
                onClick={() =>
                  navigate(`/friends/${friend.id}`, {
                    state: {
                      friend,
                    },
                  })
                }
              >
                View Profile
              </button>
              <button
                className="action-btn action-btn--secondary"
                onClick={() => handleRequestLocation(friend.id)}
                disabled={loadingRequestId === friend.id}
              >
                {loadingRequestId === friend.id ? "Sending..." : "Get Location"}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Friends;
