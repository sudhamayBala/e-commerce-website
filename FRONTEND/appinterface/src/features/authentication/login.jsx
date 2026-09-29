import { useState } from "react";
import axios from "axios";
import "../../css/App.css";
import "../../css/RegisterLogin/Login.css";
import { useNavigate } from "react-router-dom";


const  API_BASE_URL  = "https://e-commerce-website-od8p.onrender.com";

const normalizeUserRole = (value) => {
    const normalized = String(value ?? "")
        .trim()
        .toLowerCase();

    if (normalized === "admin" || normalized === "owner") return "admin";
    if (normalized === "customer" || normalized === "user") return "customer";
    return normalized;
};

const extractErrorMessage = (error, fallback = "Something went wrong. Please try again.") => {
    if (!error) return fallback;

    const payload = error?.response?.data ?? error?.data ?? error;

    if (typeof payload === "string") return payload;
    if (typeof payload?.message === "string" && payload.message.trim()) return payload.message;
    if (typeof payload?.detail === "string" && payload.detail.trim()) return payload.detail;

    if (Array.isArray(payload?.detail)) {
        const joined = payload.detail
            .map((item) => {
                if (typeof item === "string") return item;
                if (typeof item?.msg === "string") return item.msg;
                if (typeof item?.message === "string") return item.message;
                if (typeof item?.detail === "string") return item.detail;
                return "";
            })
            .filter(Boolean)
            .join(". ");

        if (joined) return joined;
    }

    if (typeof payload?.error === "string" && payload.error.trim()) return payload.error;
    if (typeof error?.message === "string" && error.message.trim()) return error.message;

    try {
        return JSON.stringify(payload);
    } catch {
        return fallback;
    }
};

export default function Login() {
    const navigate = useNavigate();
    const [isRegister, setIsRegister] = useState(false);
    const [forgotMode, setForgotMode] = useState(false);
    const [resetRequestSent, setResetRequestSent] = useState(false);
    const [resetCode, setResetCode] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [resetEmail, setResetEmail] = useState("");

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

    const handleForgotPasswordRequest = async (event) => {
        if (event) event.preventDefault();

        setError("");
        setSuccess("");

        const email = formData.email.trim();
        if (!email) {
            setError("Please enter your email to receive a reset code.");
            return;
        }

        try {
            const response = await axios.post(`${API_BASE_URL}/auth/forgot-password`, { email });
            setResetEmail(email);
            setResetRequestSent(true);
            setSuccess(response?.data?.message || "Reset code sent successfully.");
        } catch (err) {
            setError(extractErrorMessage(err, "Unable to send reset code. Please try again."));
            setResetRequestSent(false);
        }
    };

    const handleResetPassword = async (event) => {
        if (event) event.preventDefault();

        setError("");
        setSuccess("");

        if (!resetEmail.trim() || !resetCode.trim() || !newPassword.trim()) {
            setError("Please enter your email, reset code, and a new password.");
            return;
        }

        if (newPassword.length < 8) {
            setError("New password must be at least 8 characters long.");
            return;
        }

        try {
            const response = await axios.post(`${API_BASE_URL}/auth/reset-password`, {
                email: resetEmail.trim(),
                code: resetCode.trim(),
                new_password: newPassword,
            });

            setSuccess(response?.data?.message || "Password reset successfully.");
            setForgotMode(false);
            setResetRequestSent(false);
            setResetCode("");
            setNewPassword("");
            setResetEmail("");
            setFormData((prev) => ({ ...prev, password: "" }));
            setTimeout(() => {
                setSuccess("");
                setIsRegister(false);
            }, 1200);
        } catch (err) {
            setError(extractErrorMessage(err, "Password reset failed. Please check your code and try again."));
        }
    };

    const handleFileChange = (event) => {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setRegisterData((prev) => ({
                    ...prev,
                    profile_picture: reader.result, 
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
                setError(extractErrorMessage({ response: { data } }, "Invalid email or password"));
                setIsLoggedIn(false);
                return;
            }

            if (!data.access_token) {
                throw new Error("The server did not return a login token.");
            }

            const backendRole = normalizeUserRole(
                data.role?.value ?? data.role ?? data.user?.role?.value ?? data.user?.role ?? data.user_role ?? ''
            );

            const isOwner = backendRole === "admin";

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
                setError(extractErrorMessage(err, "Login failed. Please try again."));
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

            const normalizedRole = normalizeUserRole(data.role ?? registrationData.role ?? "customer");
            const savedUser = { ...data, role: normalizedRole };

            localStorage.setItem("token", data.access_token);
            localStorage.setItem("user", JSON.stringify(savedUser));
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
            setError(extractErrorMessage(err, "Registration failed. Please try again."));
        }
    };

    const showRegister = () => {
        setIsRegister(true);
        setForgotMode(false);
        setError("");
        setSuccess("");
    };

    const showLogin = () => {
        setIsRegister(false);
        setForgotMode(false);
        setResetRequestSent(false);
        setResetCode("");
        setNewPassword("");
        setResetEmail("");
        setError("");
        setSuccess("");
    };

    return (
        <div className="login-container">
            <div className="login-card">
                {!isRegister && !forgotMode && (
                    <>
                        <h1 className="login-title">Login ⛩️</h1>

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
                            Forgot your password?{" "}
                            <button
                                type="button"
                                className="switch-button"
                                data-action="forgot-password"
                                onClick={() => {
                                    setForgotMode(true);
                                    setError("");
                                    setSuccess("");
                                }}
                            >
                                Reset it
                            </button>
                        </p>

                        <p className="switch-text">
                            Don't have an account?{" "}
                            <button
                                type="button"
                                className="switch-button"
                                data-action="register"
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

                {!isRegister && forgotMode && (
                    <>
                        <h1 className="login-title">Forgot password 🔐</h1>

                        {!resetRequestSent ? (
                            <form className="login-form" onSubmit={handleForgotPasswordRequest}>
                                <div className="input-container">
                                    <label htmlFor="reset-email">Email:</label>
                                    <input
                                        className="input-box"
                                        type="email"
                                        placeholder="Enter your email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        name="email"
                                        id="reset-email"
                                    />
                                </div>

                                <button type="submit" className="login-button">
                                    Send reset code
                                </button>
                            </form>
                        ) : (
                            <form className="login-form" onSubmit={handleResetPassword}>
                                <div className="input-container">
                                    <label htmlFor="reset-email-final">Email:</label>
                                    <input
                                        className="input-box"
                                        type="email"
                                        value={resetEmail}
                                        readOnly
                                        id="reset-email-final"
                                    />
                                </div>

                                <div className="input-container">
                                    <label htmlFor="reset-code">Reset code:</label>
                                    <input
                                        className="input-box"
                                        type="text"
                                        placeholder="Enter 6-digit code"
                                        value={resetCode}
                                        onChange={(event) => setResetCode(event.target.value)}
                                        id="reset-code"
                                        maxLength={6}
                                    />
                                </div>

                                <div className="input-container">
                                    <label htmlFor="new-password">New password:</label>
                                    <input
                                        className="input-box"
                                        type="password"
                                        placeholder="Enter new password"
                                        value={newPassword}
                                        onChange={(event) => setNewPassword(event.target.value)}
                                        id="new-password"
                                    />
                                </div>

                                <button type="submit" className="login-button">
                                    Reset password
                                </button>
                            </form>
                        )}

                        <p className="switch-text">
                            <button type="button" className="switch-button" onClick={showLogin}>
                                Back to login
                            </button>
                        </p>
                    </>
                )}

                {isRegister && (
                    <>
                        <h1 className="login-title">Register 📝</h1>

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