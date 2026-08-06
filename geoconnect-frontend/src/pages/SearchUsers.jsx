import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  searchUsers,
  sendFriendRequest,
} from "../services/friendService";
import "./styles/SearchUsers.css";


function SearchUsers() {
  const [query, setQuery] = useState("");
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const navigate = useNavigate();

  const handleSearch = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setHasSearched(true);
    try {
      const data = await searchUsers(query);
      setUsers(data);
    } catch (error) {
      console.error(error);
      if (error.response?.status === 404) {
        setUsers([]);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  const handleSendRequest = async (id) => {
    try {
      await sendFriendRequest(id);
      alert("Friend request sent!");
    } catch (error) {
      alert(
        error.response?.data?.error ||
        "Unable to send request."
      );
    }
  };

  const getInitial = (name) => {
    return name ? name.charAt(0).toUpperCase() : "?";
  };

  return (
    <div className="search-page">
      <button className="back-btn" onClick={() => navigate('/dashboard')}>← Back</button>
      <div className="search-header">
        <h2 className="page-title">Search Users</h2>
        <p className="page-subtitle">
          Find people around you and send friend requests.
        </p>
      </div>

      <div className="search-bar-wrapper">
        <div className="search-input-wrapper">
          <svg
            className="search-icon"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
          <input
            className="search-input"
            placeholder="Search username..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
          />
        </div>
        <button
          className={`search-btn ${loading ? "loading" : ""}`}
          onClick={handleSearch}
          disabled={loading || !query.trim()}
        >
          {loading ? (
            <span className="spinner"></span>
          ) : (
            "Search"
          )}
        </button>
      </div>

      <div className="search-results">
        {!hasSearched && (
          <div className="empty-state">
            <div className="empty-state-icon">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
            </div>
            <p className="empty-state-text">
              Search for users to connect with.
            </p>
          </div>
        )}

        {hasSearched && users.length === 0 && (
          <div className="empty-state">
            <div className="empty-state-icon">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
              </svg>
            </div>
            <p className="empty-state-text">No users found.</p>
          </div>
        )}

        <div className="users-grid">
          {users.map((user) => (
            <div key={user.id} className="user-card">
              <div className="user-card-header">
                <div className="user-avatar">
                  {user.profile_picture ? (
                    <img
                      src={user.profile_picture}
                      alt={user.username}
                      className="avatar-img"
                    />
                  ) : (
                    <span className="avatar-initial">
                      {getInitial(user.username)}
                    </span>
                  )}
                </div>
                <div className="user-info">
                  <h3 className="user-name">{user.username}</h3>
                  <p className="user-email">{user.email}</p>
                  {user.bio && (
                    <p className="user-bio">{user.bio}</p>
                  )}
                </div>
              </div>

              <div className="user-meta">
                {(user.latitude !== undefined || user.longitude !== undefined) && (
                  <span className="coord-badge">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                      <circle cx="12" cy="10" r="3"></circle>
                    </svg>
                    {user.latitude && user.longitude
     ? "📍 Location Shared"
     : "📍 Location Hidden"}
                  </span>
                )}
                <span className={`online-badge ${user.is_online ? "online" : "offline"}`}>
                  {user.is_online ? "● Online" : "○ Offline"}
                </span>
              </div>

              <button
                className="send-request-btn"
                onClick={() => handleSendRequest(user.id)}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                  <circle cx="8.5" cy="7" r="4"></circle>
                  <line x1="20" y1="8" x2="20" y2="14"></line>
                  <line x1="23" y1="11" x2="17" y2="11"></line>
                </svg>
                Send Friend Request
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default SearchUsers;
