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

function MapPlaceholder({ user }) {
  if (!user) return null;

  const latitude = user.latitude ?? 6.5244;
  const longitude = user.longitude ?? 3.3792;

  console.log("Latitude:", latitude);
console.log("Longitude:", longitude);
console.log("User:", user);

  return (
    <motion.div
      className="map-placeholder"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.5 }}
    >
      <MapContainer
        center={[latitude, longitude]}
        zoom={15}
        scrollWheelZoom={true}
        style={{
          height: "350px",
          width: "100%",
          borderRadius: "18px",
        }}
      >
        <TileLayer
          attribution='&copy; OpenStreetMap contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <Marker position={[latitude, longitude]}>
          <Popup>
            <strong>{user.username}</strong>
            <br />
            Your current location
          </Popup>
        </Marker>
      </MapContainer>
    </motion.div>
  );
}

export default MapPlaceholder;