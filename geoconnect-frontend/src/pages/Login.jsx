import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { login as authLogin } from "../services/authService";
import AuthLayout from "./AuthLayout"; 
import "./styles/AuthLayout.css"; 
import "./styles/Login.css"; 

function Login() {
    const navigate = useNavigate();
    const { login } = useAuth();
    const [isLoading, setIsLoading] = useState(false);

    const [form, setForm] = useState({ login: "", password: "" });

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const response = await authLogin(form.login, form.password);
            login(response.user, response.tokens);

            alert("Login successful!");
            navigate("/dashboard");
        } catch (error) {
            if (error.response) {
                const errors = Object.values(error.response.data).flat().join("\n");
                alert(errors);
                console.error("Login error:", error.response.data);
            } else {
                console.error("Login error:", error);
                alert("Unable to connect to the server.");
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <AuthLayout
            title="🌍 GeoConnect"
            subtitle="Connect with people around you. Discover local communities, events, and friends in real-time."
            linkText="Don't have an account?"
            linkTo="/register"
            linkLabel="Register"
        >
            <form className="login-form" onSubmit={handleSubmit}>
                <input
                    type="text"
                    name="login"
                    placeholder="Username or Email"
                    value={form.login}
                    onChange={handleChange}
                />
                <input
                    type="password"
                    name="password"
                    placeholder="Password"
                    value={form.password}
                    onChange={handleChange}
                />
                <button
                    type="submit"
                    className={isLoading ? "loading" : ""}
                    disabled={isLoading}
                >
                    {isLoading ? "Logging in..." : "Login"}
                </button>
            </form>
        </AuthLayout>
    );
}

export default Login;