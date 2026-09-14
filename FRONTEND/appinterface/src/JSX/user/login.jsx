import { useState } from "react";
import axios from "axios";
import "../../css/App.css";
import "../../css/RegisterLogin/Login.css";
import { useNavigate } from "react-router-dom";
import { API_BASE_URL } from "../../api";

export default function Login() {
    const navigate = useNavigate();
    const [isRegister, setIsRegister] = useState(false);
    
    // Role state using "user" for customer and "owner" for owner login
    const [loginRole, setLoginRole] = useState("user"); 
    
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const [formData, setFormData] = useState({
        email: "",
        password: "",
    });

    const [registerData, setRegisterData] = useState({
        email: "",
        password: "",
        confirmPassword: "",
        profile_picture: "",
        address: "",
        role: "user",
    });

    const handleChange = (event) => {
        const { name, value } = event.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleRegisterChange = (event) => {
        const { name, value } = event.target;
        setRegisterData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    // Handle File Upload for Profile Picture (Converts file to Base64)
    const handleFileChange = (event) => {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setRegisterData((prev) => ({
                    ...prev,
                    profile_picture: reader.result, // Base64 Data URL
                }));
            };
            reader.readAsDataURL(file);
        }
    };


    
    const handleLogin = async (event) => {
        if (event) event.preventDefault();

        setError("");
        setSuccess("");

        if (!formData.email.trim() || !formData.password.trim()) {
            setError("Please enter both email and password.");
            return;
        }

        try {
            const response = await axios.post(`${API_BASE_URL}/auth/login`, {
                email: formData.email.trim(),
                password: formData.password,
            });

            const data = response?.data ?? {};

            if (data?.success === false) {
                setError(data.message || data.detail || "Invalid email or password");
                setIsLoggedIn(false);
                return;
            }

            if (!data.access_token) {
                throw new Error("The server did not return a login token.");
            }

            const backendRole = String(
                data.role?.value ?? data.role ?? data.user?.role?.value ?? data.user?.role ?? data.user_role ?? ''
            ).trim().toLowerCase();
            
            const isOwner = backendRole === "admin" || backendRole === "owner";

            if (loginRole === "owner" && !isOwner) {
                setError("This account is not registered as an owner account.");
                setIsLoggedIn(false);
                return;
            }

            const storedUser = { ...data, role: backendRole };
            localStorage.setItem("token", data.access_token);
            localStorage.setItem("user", JSON.stringify(storedUser));

            setSuccess("Login successful! Redirecting...");
            setIsLoggedIn(true);
            navigate(isOwner ? "/owner" : "/home", { replace: true });
        } catch (err) {
            console.error("Login Error:", err);

            if (!err.response) {
                setError("Cannot connect to the backend. Start the API server and try again.");
            } else if (err.response.status === 401) {
                setError("Email or password is incorrect.");
            } else {
                setError(
                    err.response?.data?.message ||
                    err.response?.data?.detail ||
                    "Login failed. Please try again."
                );
            }
            setIsLoggedIn(false);
        }
    };

    
    const handleRegister = async (event) => {
        if (event) event.preventDefault();

        setError("");
        setSuccess("");

        if (
            !registerData.email.trim() ||
            !registerData.password.trim() ||
            !registerData.confirmPassword.trim()
        ) {
            setError("Please enter email, password, and confirm password.");
            return;
        }

        if (registerData.password !== registerData.confirmPassword) {
            setError("Password and Confirm Password do not match.");
            return;
        }

        try {
            const registrationData = {
                email: registerData.email.trim(),
                password: registerData.password,
                profile_picture: registerData.profile_picture,
                address: registerData.address,
                role: loginRole === "owner" ? "Admin" : "Customer",
            };

            const response = await axios.post(
                `${API_BASE_URL}/auth/register`,
                registrationData
            );

            const data = response?.data ?? {};
            if (!data.access_token) {
                throw new Error("The server did not return a registration token.");
            }

            localStorage.setItem("token", data.access_token);
            localStorage.setItem("user", JSON.stringify(data));
            setSuccess("Registration successful! Redirecting...");

            setRegisterData({
                email: "",
                password: "",
                confirmPassword: "",
                profile_picture: "",
                address: "",
                role: "user",
            });

            setTimeout(() => navigate("/home", { replace: true }), 700);
        } catch (err) {
            console.error("Register Error:", err);
            setError(err.response?.data?.detail || err.message || "Registration failed. Please try again.");
        }
    };

    const showRegister = () => {
        setIsRegister(true);
        setError("");
        setSuccess("");
    };

    const showLogin = () => {
        setIsRegister(false);
        setError("");
        setSuccess("");
    };

    return (
        <div className="login-container">
            <div className="login-card">
                {!isRegister && (
                    <>
                        <h1 className="login-title">Login ⛩️</h1>

                        {/* Role Switch Buttons: User vs Owner */}
                        <div className="login-role-switch" aria-label="Choose login type">
                            <button
                                type="button"
                                className={loginRole === "user" ? "role-button active" : "role-button"}
                                onClick={() => setLoginRole("user")}
                            >
                                User Login
                            </button>
                            <button
                                type="button"
                                className={loginRole === "owner" ? "role-button active" : "role-button"}
                                onClick={() => setLoginRole("owner")}
                            >
                                Owner Login
                            </button>
                        </div>

                        <form className="login-form" onSubmit={handleLogin}>
                            <div className="input-container">
                                <label htmlFor="login-email">Email:</label>
                                <input
                                    className="input-box"
                                    type="email"
                                    placeholder="Enter your email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    name="email"
                                    id="login-email"
                                />
                            </div>

                            <div className="input-container">
                                <label htmlFor="login-password">Password:</label>
                                <input
                                    className="input-box"
                                    type="password"
                                    placeholder="Enter your password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    name="password"
                                    id="login-password"
                                />
                            </div>

                            <button type="submit" className="login-button">
                                Login
                            </button>
                        </form>

                        <p className="switch-text">
                            Don't have an account?{" "}
                            <button
                                type="button"
                                className="switch-button"
                                onClick={showRegister}
                            >
                                Register
                            </button>
                        </p>

                        {isLoggedIn && (
                            <h3 className="welcome-message">
                                Welcome! You are logged in.
                            </h3>
                        )}
                    </>
                )}

                {isRegister && (
                    <>
                        <h1 className="login-title">Register 📝</h1>

                        {/* Role Switch Buttons for Registration */}
                        <div className="login-role-switch" aria-label="Choose account type">
                            <button
                                type="button"
                                className={loginRole === "user" ? "role-button active" : "role-button"}
                                onClick={() => setLoginRole("user")}
                            >
                                User Account
                            </button>
                            <button
                                type="button"
                                className={loginRole === "owner" ? "role-button active" : "role-button"}
                                onClick={() => setLoginRole("owner")}
                            >
                                Owner Account
                            </button>
                        </div>

                        <form className="login-form" onSubmit={handleRegister}>
                            <div className="input-container">
                                <label htmlFor="register-email">Email:</label>
                                <input
                                    className="input-box"
                                    type="email"
                                    placeholder="Enter your email"
                                    value={registerData.email}
                                    onChange={handleRegisterChange}
                                    name="email"
                                    id="register-email"
                                />
                            </div>

                            <div className="input-container">
                                <label htmlFor="register-password">Password:</label>
                                <input
                                    className="input-box"
                                    type="password"
                                    placeholder="Enter your password"
                                    value={registerData.password}
                                    onChange={handleRegisterChange}
                                    name="password"
                                    id="register-password"
                                />
                            </div>

                            <div className="input-container">
                                <label htmlFor="confirm-password">Confirm Password:</label>
                                <input
                                    className="input-box"
                                    type="password"
                                    placeholder="Re-enter your password"
                                    value={registerData.confirmPassword}
                                    onChange={handleRegisterChange}
                                    name="confirmPassword"
                                    id="confirm-password"
                                />
                                {registerData.confirmPassword && (
                                    <span
                                        style={{
                                            fontSize: "0.8rem",
                                            marginTop: "4px",
                                            color:
                                                registerData.password ===
                                                registerData.confirmPassword
                                                    ? "green"
                                                    : "red",
                                        }}
                                    >
                                        {registerData.password ===
                                        registerData.confirmPassword
                                            ? "✓ Passwords match"
                                            : "✗ Passwords do not match"}
                                    </span>
                                )}
                            </div>

                            <div className="input-container">
                                <label htmlFor="profile_picture">Profile Picture:</label>
                                <input
                                    className="input-box"
                                    type="file"
                                    accept="image/*"
                                    onChange={handleFileChange}
                                    id="profile_picture"
                                />
                                {registerData.profile_picture && (
                                    <img
                                        src={registerData.profile_picture}
                                        alt="Profile Preview"
                                        style={{
                                            width: "60px",
                                            height: "60px",
                                            borderRadius: "50%",
                                            marginTop: "8px",
                                            objectFit: "cover",
                                        }}
                                    />
                                )}
                            </div>

                            <div className="input-container">
                                <label htmlFor="address">Address:</label>
                                <input
                                    className="input-box"
                                    type="text"
                                    placeholder="Enter your address"
                                    value={registerData.address}
                                    onChange={handleRegisterChange}
                                    name="address"
                                    id="address"
                                />
                            </div>

                            <button type="submit" className="login-button">
                                Register
                            </button>
                        </form>

                        <p className="switch-text">
                            Already have an account?{" "}
                            <button
                                type="button"
                                className="switch-button"
                                onClick={showLogin}
                            >
                                Login
                            </button>
                        </p>
                    </>
                )}

                {error && <p className="error">{error}</p>}
                {success && <p className="success">{success}</p>}
            </div>
        </div>
    );
}