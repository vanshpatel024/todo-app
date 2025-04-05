import { useState } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import axios from "axios";
import ToastNotification from "../components/ToastNotification";

function CNAPage() {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [notification, setNotification] = useState(null);
    const navigate = useNavigate();
    const location = useLocation();

    const showNotification = (message, type = "error") => {
        setNotification({ message, type });
    };

    const handleRegister = async (e) => {
        e.preventDefault();

        const trimmedUsername = username.trim();

        if (!trimmedUsername) {
            showNotification("Username cannot be empty!", "error");
            return;
        }

        if (password !== confirmPassword) {
            showNotification("Passwords do not match!", "error");
            return;
        }

        try {
            const response = await axios.post("https://todo-app-xfj3.onrender.com/register", {
                username: trimmedUsername,
                password
            });

            if (response.data.message === "Account created successfully") {
                navigate("/login", { state: { successMessage: "Account created! Please log in." } });
            }
        } catch (err) {
            if (err.response) {
                showNotification(err.response.data.error, "error");
            } else {
                showNotification("Server error, try again later.", "error");
            }
        }
    };

    return (
        <div className="auth-wrapper">
            {notification && (
                <ToastNotification message={notification.message} type={notification.type} onClose={() => setNotification(null)} />
            )}
            <h1 className="auth-title">Todo Web App</h1>
            <div className={`auth-card ${location.pathname === "/register" ? "register" : "login"}`}>
                <h2>Create an account</h2>
                <form onSubmit={handleRegister}>
                    <div className="input-group">
                        <label>Username:</label>
                        <input
                            type="text"
                            placeholder="Username"
                            required
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                        />
                    </div>

                    <div className="input-group">
                        <label>Password:</label>
                        <input
                            type="password"
                            placeholder="Password"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                    </div>

                    <div className="input-group">
                        <label>Confirm:</label>
                        <input
                            type="password"
                            placeholder="Confirm Password"
                            required
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                        />
                    </div>

                    <button type="submit">Create</button>
                </form>
                <a className="link" href="./login">Already have an account?</a>
            </div>
        </div>
    );
}

export default CNAPage;
