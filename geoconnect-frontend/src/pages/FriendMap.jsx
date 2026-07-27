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

function FriendMap() {
  const navigate = useNavigate();
  const { state } = useLocation();
  const friend = state?.friend;
  console.log(friend);
  console.log(friend.latitude);
  console.log(friend.longitude);


  
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
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <Marker
          position={[
            friend.latitude,
            friend.longitude,
          ]}
        >
          <Popup>
            {friend.username}
          </Popup>
        </Marker>

      </MapContainer>

    </div>
  );
}

export default FriendMap;