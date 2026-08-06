import { motion } from "framer-motion";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "./MapPlaceholder.css";

// Fix Leaflet marker icons
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
  const src = image;
  return L.divIcon({
    className: "custom-avatar-marker",
    html: `
      <div class="avatar-marker">
        ${
          src
            ? `<img src="${src}" alt="${username}" />`
            : `<span>${username?.charAt(0).toUpperCase() || "?"}</span>`
        }
      </div>
    `,
    iconSize: [56, 56],
    iconAnchor: [28, 56],
    popupAnchor: [0, -50],
  });
};

function MapPlaceholder({ user, friends, className }) {
  if (!user) return null;

  const latitude = user.latitude ?? 6.5244;
  const longitude = user.longitude ?? 3.3792;

  return (
    <motion.div
      className={`map-placeholder ${className || ""}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.5 }}
    >
      <MapContainer
        center={[latitude, longitude]}
        zoom={15}
        scrollWheelZoom={true}
        style={{
          height: "100%",
          width: "100%",
          borderRadius: "18px",
        }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <Marker
          position={[latitude, longitude]}
          icon={createAvatarIcon(
            user.profile_picture,
            user.username
          )}
        >
          <Popup>
            <strong>{user.username}</strong>
            <br />
            Your current location
          </Popup>
        </Marker>

        {friends
          .filter(
            (friend) =>
              typeof friend.latitude === "number" &&
              typeof friend.longitude === "number"
          )
          .map((friend) => (
            <Marker
              key={friend.id}
              position={[friend.latitude, friend.longitude]}
              icon={createAvatarIcon(
                friend.profile_picture,
                friend.username
              )}
            >
              <Popup>
                <strong>{friend.username}</strong>
                <br />
                Friend's Location
              </Popup>
            </Marker>
          ))}
      </MapContainer>
    </motion.div>
  );
}

export default MapPlaceholder;

