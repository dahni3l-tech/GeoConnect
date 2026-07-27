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
      <h1>Friends</h1>
          {friends.length === 0 && (
      <div className="empty-friends">
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

            <h3>{friend.username}</h3>

            <p>{friend.email}</p>

           <button
              onClick={() =>
                navigate(`/friends/${friend.id}`, {
                  state: {
                    friend,
                  },
                })
              }
            >
              View Details
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Friends;