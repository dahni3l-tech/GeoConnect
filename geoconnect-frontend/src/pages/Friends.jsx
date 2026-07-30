import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getFriends } from "../services/friendService";
import "./styles/Friends.css";

function Friends() {
  const [friends, setFriends] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    loadFriends();
  }, []);

  const loadFriends = async () => {
    try {
      const data = await getFriends();
      console.log(data);
      setFriends(data);
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <div className="friends-page">
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
                <span className="online-indicator" title="Online"></span>
              </div>

              <div className="friend-name-row">
                <h3>{friend.username}</h3>
                <span className="premium-badge" title="Premium">⭐</span>
              </div>

              <p className="friend-bio">Exploring the world, one step at a time.</p>

              <div className="friend-meta">
                <span className="meta-chip">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                    <circle cx="12" cy="10" r="3" />
                  </svg>
                  Lagos
                </span>
                <span className="meta-chip">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                  </svg>
                  Walking
                </span>
                <span className="meta-chip">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12 6 12 12 16 14" />
                  </svg>
                  2 mins ago
                </span>
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
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
                View Profile
              </button>
              <button className="action-btn action-btn--secondary">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
                </svg>
                Message
              </button>
              <button className="action-btn action-btn--secondary">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="3 11 22 2 13 21 11 13 3 11" />
                </svg>
                Locate
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Friends;
