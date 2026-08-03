import { useLocation, useNavigate } from "react-router-dom";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "./styles/FriendMap.css";

// Fix marker icons
delete L.Icon.Default.prototype._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const createAvatarIcon = (image, username) => {
  const initials = username ? username.charAt(0).toUpperCase() : "?";
  return L.divIcon({
    className: "custom-avatar-marker",
    html: `
      <div class="avatar-marker">
        ${
          image
            ? `<img src="${image}" alt="${username}" />`
            : `<span>${initials}</span>`
        }
      </div>
    `,
    iconSize: [56, 56],
    iconAnchor: [28, 56],
    popupAnchor: [0, -50],
  });
};

function FriendMap() {
  const navigate = useNavigate();
  const { state } = useLocation();
  const friend = state?.friend;

  if (!friend) {
    return <h2>Friend not found.</h2>;
  }

  if (friend.latitude == null || friend.longitude == null) {
  return (
    <div className="friend-map-page">
      <button
        className="back-btn"
        onClick={() => navigate(-1)}
      >
        ← Back
      </button>

      <h2>This friend has not shared their location yet.</h2>
    </div>
  );
}

  return (
    <div className="friend-map-page">

      <button
        className="back-btn"
        onClick={() => navigate(-1)}
      >
        ← Back
      </button>

      <h1>{friend.username}'s Location</h1>

      <MapContainer
        center={[friend.latitude, friend.longitude]}
        zoom={15}
        style={{
          width: "100%",
          height: "75vh",
          borderRadius: "20px",
        }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <Marker
          position={[
            friend.latitude,
            friend.longitude,
          ]}
          icon={createAvatarIcon(
            friend.profile_picture,
            friend.username,
            friend.bio
          )}
        >
          <Popup>
            <div className="popup-profile">
              {friend.profile_picture ? (
                <img src={friend.profile_picture} alt={friend.username} className="popup-avatar" />
              ) : (
                <div className="popup-avatar placeholder">{friend.username.charAt(0).toUpperCase()}</div>
              )}
              <div className="popup-info">
                <strong className="popup-username">{friend.username}</strong>
                {friend.bio && <p className="popup-bio">{friend.bio}</p>}
                <span className="popup-location">📍 Shared location</span>
              </div>
            </div>
          </Popup>
        </Marker>

      </MapContainer>

    </div>
  );
}

export default FriendMap;