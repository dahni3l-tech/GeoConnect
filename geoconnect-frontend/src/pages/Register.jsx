import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { register } from "../services/authService";
import AuthLayout from "./AuthLayout";
import "./styles/AuthLayout.css";
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

    const [isGuardian, setIsGuardian] = useState(false);
    const [guardianDetails, setGuardianDetails] = useState({
        guardianName: "",
        guardianPhone: "",
        guardianEmail: "",
        guardianRelation: "",
        address: "",
    });

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleGuardianChange = (e) => {
        setGuardianDetails({ ...guardianDetails, [e.target.name]: e.target.value });
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

    if (isGuardian && (
        !guardianDetails.guardianName ||
        !guardianDetails.guardianPhone ||
        !guardianDetails.guardianRelation
    )) {
        alert("Please fill in all required guardian details.");
        return;
    }

        setIsLoading(true);

        try {
            const guardianPayload = isGuardian ? {
                guardian_name: guardianDetails.guardianName,
                guardian_phone: guardianDetails.guardianPhone,
                guardian_email: guardianDetails.guardianEmail,
                guardian_relation: guardianDetails.guardianRelation,
                address: guardianDetails.address,
            } : {};

            const response = await register(
                form.username,
                form.email,
                form.password,
                isGuardian,
                guardianPayload
            );
            alert("Registration successful! You can now log in.");
            navigate("/login");
            setForm({ username: "", email: "", password: "", confirmPassword: "" });
            setIsGuardian(false);
            setGuardianDetails({
                guardianName: "",
                guardianPhone: "",
                guardianEmail: "",
                guardianRelation: "",
                address: "",
            });
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

                <div className="guardian-mode-question">
                    <label className="guardian-toggle-label">
                        <span>Are you a guardian?</span>
                        <button
                            type="button"
                            className={`guardian-toggle ${isGuardian ? "active" : ""}`}
                            onClick={() => setIsGuardian(!isGuardian)}
                        >
                            {isGuardian ? "No" : "Yes"}
                        </button>
                    </label>
                </div>

                {isGuardian && (
                    <div className="guardian-details-form">
                        <h3>Guardian Details</h3>
                        <input
                            type="text"
                            name="guardianName"
                            placeholder="Guardian Full Name"
                            value={guardianDetails.guardianName}
                            onChange={handleGuardianChange}
                            required
                        />
                        <input
                            type="tel"
                            name="guardianPhone"
                            placeholder="Guardian Phone Number"
                            value={guardianDetails.guardianPhone}
                            onChange={handleGuardianChange}
                            required
                        />
                        <input
                            type="email"
                            name="guardianEmail"
                            placeholder="Guardian Email (optional)"
                            value={guardianDetails.guardianEmail}
                            onChange={handleGuardianChange}
                        />
                        <input
                            type="text"
                            name="guardianRelation"
                            placeholder="Relation (e.g. Parent, Spouse)"
                            value={guardianDetails.guardianRelation}
                            onChange={handleGuardianChange}
                            required
                        />
                        <textarea
                            name="address"
                            placeholder="Home Address"
                            value={guardianDetails.address}
                            onChange={handleGuardianChange}
                            rows="3"
                        />
                    </div>
                )}
                
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