import { useEffect, useState } from "react";
import {
  getFriendRequests,
  acceptFriendRequest,
  rejectFriendRequest,
} from "../services/friendService";

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
      <h1>Friend Requests</h1>

      {requests.length === 0 ? (
        <p>No pending requests.</p>
      ) : (
        requests.map((request) => (
          <div
            key={request.id}
            className="friend-card"
          >
            <h3>{request.sender_username}</h3>

            <p>{request.sender_email}</p>

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
        ))
      )}
    </div>
  );
}

export default FriendRequests;