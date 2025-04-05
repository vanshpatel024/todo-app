import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import ToastNotification from "../components/ToastNotification";

function LoginPage({ setIsLoginSuccessful }) {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [notification, setNotification] = useState(null);
    const [loading, setLoading] = useState(true); // For preventing blinking
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        if (location.state?.successMessage) {
            setNotification({ message: location.state.successMessage, type: "success" });
        }

        // Auto-login logic
        const storedUsername = localStorage.getItem("username");
        const storedPassword = localStorage.getItem("password");

        if (storedUsername && storedPassword) {
            axios.post("http://localhost:5000/login", { username: storedUsername, password: storedPassword })
                .then(response => {
                    if (response.data.message === "Login successful!") {
                        setIsLoginSuccessful(true);
                        navigate("/home");
                    } else {
                        localStorage.removeItem("username");
                        localStorage.removeItem("password");
                    }
                })
                .catch(() => {
                    localStorage.removeItem("username");
                    localStorage.removeItem("password");
                })
                .finally(() => {
                    setLoading(false);
                });
        } else {
            setLoading(false);
        }
    }, [navigate, setIsLoginSuccessful, location.state]);

    const showNotification = (message, type = "error") => {
        setNotification({ message, type });
    };

    const handleLogin = async (e) => {
        e.preventDefault();

        if (!username.trim() || !password.trim()) {
            showNotification("Username and password are required!", "error");
            return;
        }

        try {
            const response = await axios.post(
                "http://localhost:5000/login",
                { username, password },
                { headers: { "Content-Type": "application/json" } }
            );

            if (response.data.message === "Login successful!") {
                localStorage.setItem("username", username);
                localStorage.setItem("password", password);
                setIsLoginSuccessful(true);
                navigate("/home");
            }
        } catch (err) {
            console.error("Login error:", err.response ? err.response.data : err);
            showNotification(err.response?.data?.error || "Server error, try again later.", "error");
        }
    };

    if (loading) {
        return <div>Loading...</div>;
    }

    return (
        <div className="auth-wrapper">
            {notification && (
                <ToastNotification message={notification.message} type={notification.type} onClose={() => setNotification(null)} />
            )}
            <h1 className="auth-title">Todo Web App</h1>
            <div className="auth-card login">
                <h2>Login</h2>
                <form onSubmit={handleLogin}>
                    <div className="input-group">
                        <label>Username:</label>
                        <input type="text" placeholder="Username" required value={username} onChange={(e) => setUsername(e.target.value)} />
                    </div>

                    <div className="input-group">
                        <label>Password:</label>
                        <input type="password" placeholder="Password" required value={password} onChange={(e) => setPassword(e.target.value)} />
                    </div>

                    <button type="submit">Login</button>
                </form>
                <a className="link" href="./register">Create a new account?</a>
            </div>
        </div>
    );
}

export default LoginPage;
