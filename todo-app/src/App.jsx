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
                <Route path="https://todo-app-lake-sigma-57.vercel.app/" element={<Navigate to="https://todo-app-lake-sigma-57.vercel.app/login" />} />
                <Route path="https://todo-app-lake-sigma-57.vercel.app/login" element={<LoginPage setIsLoginSuccessful={setIsLoginSuccessful} />} />
                <Route path="https://todo-app-lake-sigma-57.vercel.app/register" element={<CNAPage />} />
                <Route path="https://todo-app-lake-sigma-57.vercel.app/home" element={isLoginSuccessful ? <HomePage /> : <Navigate to="https://todo-app-lake-sigma-57.vercel.app/login" />} />
            </Routes>
        </Router>
    );
}

export default App;
