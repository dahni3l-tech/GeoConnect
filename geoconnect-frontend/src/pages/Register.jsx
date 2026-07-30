import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import Authlayout from "./Authlayout";
import "./styles/Authlayout.css";
import "./styles/Register.css";

function Register() {
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(false);

    const [form, setForm] = useState({
        username: "",
        email: "",
        password: "",
        confirmPassword: "",
    });

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (
        !form.username ||
        !form.email ||
        !form.password ||
        !form.confirmPassword
    ) {
        alert("Please fill in all required fields.");
        return;
    }

    if (form.password !== form.confirmPassword) {
        alert("Passwords do not match.");
        return;
    }

        setIsLoading(true);

        try {
            const response = await api.post("register/", {
                username: form.username,
                email: form.email,
                password: form.password,
            });
            alert("Registration successful! You can now log in.");
            navigate("/login");
            setForm({ username: "", email: "", password: "", confirmPassword: "" });
            console.log(response.data);
        } catch (error) {
            if (error.response) {
                console.log(error.response.data);
                const errors = Object.values(error.response.data).flat().join("\n");
                alert(errors);
            } else {
                console.error(error);
                alert("Unable to connect to the server.");
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <AuthLayout
            title="🌍 GeoConnect"
            subtitle="Create your account and start connecting with people around you."
            linkText="Already have an account?"
            linkTo="/login"
            linkLabel="Login"
        >
            <form className="register-form" onSubmit={handleSubmit}>
                <input
                    type="text"
                    name="username"
                    placeholder="Username"
                    value={form.username}
                    onChange={handleChange}
                />
                <input
                    type="email"
                    name="email"
                    placeholder="Email Address"
                    value={form.email}
                    onChange={handleChange}
                />
                <input
                    type="password"
                    name="password"
                    placeholder="Password"
                    value={form.password}
                    onChange={handleChange}
                />

                <input
                    type="password"
                    name="confirmPassword"
                    placeholder="Confirm Password"
                    value={form.confirmPassword}
                    onChange={handleChange}
                />
                
                <button
                    type="submit"
                    className={isLoading ? "loading" : ""}
                    disabled={isLoading}
                >
                    {isLoading ? "Creating Account..." : "Create Account"}
                </button>
            </form>
        </AuthLayout>
    );
}

export default Register;