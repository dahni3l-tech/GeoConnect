import { useEffect, useState } from "react";
import {
  getFriendRequests,
  acceptFriendRequest,
  rejectFriendRequest,
} from "../services/friendService";
import "./styles/AppTheme.css";

function FriendRequests() {
  const [requests, setRequests] = useState([]);

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

  return (
    <div className="friends-page">
      <div className="friends-header">
        <h1>Friend Requests</h1>
        <p className="friends-subtitle">Review and manage your pending connections.</p>
      </div>

      {requests.length === 0 ? (
        <div className="empty-friends"><p>No pending requests.</p></div>
      ) : (
        <div className="friends-grid">
          {requests.map((request) => (
            <div
              key={request.id}
              className="friend-card"
            >
              <h3>{request.sender_username}</h3>

              <p>{request.sender_email}</p>

              <div className="friend-actions">
                <button
                  onClick={() => accept(request.id)}
                >
                  Accept
                </button>

                <button
                  onClick={() => reject(request.id)}
                >
                  Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default FriendRequests;
