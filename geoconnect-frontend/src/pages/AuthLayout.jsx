import { Link } from "react-router-dom";
import "./styles/AuthLayout.css"; 
import bgVideo from "../vid/geo.mp4";

function AuthLayout({ children, title, subtitle, linkText, linkTo, linkLabel }) {
    // const VIDEO_URL = "/geo.mp4"; // wanted to use this but i'm not to familiar with it so I imported the video directly above

    return (
        <div className="auth-page">
            {/* Left side — Video showcase */}
            <div className="auth-visual">
                <video autoPlay loop muted playsInline>
                    <source src={bgVideo} type="video/mp4" />
                </video>
                <div className="auth-visual-overlay">
                    <div className="auth-branding">
                        <h2>{title}</h2>
                        <p className="auth-tagline">Real-Time Family Safety Platform</p>
                        <p className="auth-slogan">Stay Connected. Stay Safe.</p>
                    </div>
                </div>
            </div>

            {/* Right side — Form card */}
            <div className="auth-form-panel">
                <div className="auth-card">
                    {children}
                    <p className="auth-link">
                        {linkText} <Link to={linkTo}>{linkLabel}</Link>
                    </p>
                </div>
            </div>
        </div>
    );
}

export default AuthLayout;