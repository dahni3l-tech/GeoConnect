import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  getFriendRequests,
  acceptFriendRequest,
  rejectFriendRequest,
} from "../services/friendService";
import "./styles/AppTheme.css";


function FriendRequests() {
  const [requests, setRequests] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    loadRequests();
  }, []);

  const loadRequests = async () => {
    try {
      const data = await getFriendRequests();
      setRequests(data);
    } catch (err) {
      console.log(err);
    }
  };

  const accept = async (id) => {
    await acceptFriendRequest(id);
    loadRequests();
  };

  const reject = async (id) => {
    await rejectFriendRequest(id);
    loadRequests();
  };

  const getInitial = (name) => {
    return name ? name.charAt(0).toUpperCase() : "?";
  };

  return (
    <div className="friends-page">
      <button className="back-btn" onClick={() => navigate('/friends')}>← Back</button>
      <div className="friends-header">
        <h1>Friend Requests</h1>
        <p className="friends-subtitle">Review and manage your pending connections.</p>
      </div>

      {requests.length === 0 ? (
        <div className="empty-friends"><p>No pending requests.</p></div>
      ) : (
        requests.map((request) => (
          <div
            key={request.id}
            className="friend-card"
          >
            <div className="friend-card-top">
              <div className="friend-avatar-wrap">
                <div className="friend-avatar">
                  {request.sender_profile_picture ? (
                    <img
                      src={request.sender_profile_picture}
                      alt={request.sender_username}
                    />
                  ) : (
                    <span>
                      {getInitial(request.sender_username)}
                    </span>
                  )}
                </div>
              </div>

              <div className="friend-name-row">
                <h3>{request.sender_username}</h3>
              </div>

              <p className="friend-request-email">{request.sender_email}</p>
            </div>

            <div className="friend-actions">
              <button
                className="action-btn action-btn--primary"
                onClick={() => accept(request.id)}
              >
                Accept
              </button>
              <button
                className="action-btn action-btn--secondary"
                onClick={() => reject(request.id)}
              >
                Reject
              </button>
            </div>
          </div>
        ))
      )}
    </div>
  );
}

export default FriendRequests;
