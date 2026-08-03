import { Routes, Route } from "react-router-dom";
import Register from "./pages/Register";
import Login from "./pages/Login";
import Dashboard from './pages/geoconnect-dashboard/Dashboard';
import SearchUsers from './pages/SearchUsers';
import Friends from './pages/Friends';
import FriendRequests from './pages/FriendRequests';
import Settings from './pages/Settings';
import FriendDetails from "./pages/FriendDetails";
import FriendMap from "./pages/FriendMap";
import Premium from "./pages/Premium/Premium";
import LocationRequest from "./pages/LocationRequest";
import ProfilePage from "./pages/ProfilePage";
import GuardianDashboard from "./pages/GuardianDashboard";
import GuardianPermissions from "./pages/GuardianPermissions";

function App() {
    return (
        <Routes>
            <Route path="/" element={<Register />} />
            <Route path="/register" element={<Register />} />
            <Route path="/login" element={<Login />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/search" element={<SearchUsers />} />
            <Route path="/friends" element={<Friends />} />
            <Route path="/requests" element={<FriendRequests />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/friends/:id" element={<FriendDetails />} />
            <Route path="/friends/:id/map" element={<FriendMap />} />
            <Route path="/premium" element={<Premium />} />
            <Route path="/location-request" element={<LocationRequest />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/guardian" element={<GuardianDashboard />} />
            <Route path="/guardian/permissions" element={<GuardianPermissions />} />
        </Routes>
    );
}

export default App;