import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { useState } from "react";
import LoginPage from "./pages/LoginPage";  
import HomePage from "./pages/HomePage";
import CNAPage from "./pages/CNAPage";
import "./index.css";

function App() {
    const [isLoginSuccessful, setIsLoginSuccessful] = useState(false);

    return (
        <Router>
            <Routes>
                <Route path="/" element={<Navigate to="/login" />} />
                <Route path="/login" element={<LoginPage setIsLoginSuccessful={setIsLoginSuccessful} />} />
                <Route path="/register" element={<CNAPage />} />
                <Route path="/home" element={isLoginSuccessful ? <HomePage /> : <Navigate to="/login" />} />
            </Routes>
        </Router>
    );
}

export default App;
