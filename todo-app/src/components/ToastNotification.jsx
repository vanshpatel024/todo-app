import { useEffect, useState } from "react";

function ToastNotification({ message, type, onClose }) {
    const [isVisible, setIsVisible] = useState(false);
    const [shouldRender, setShouldRender] = useState(true);

    useEffect(() => {
        if (message) {
            setIsVisible(true);
            const timer = setTimeout(() => {
                handleClose();
            }, 2000);

            return () => clearTimeout(timer);
        }
    }, [message]);

    const handleClose = () => {
        setIsVisible(false);
        setTimeout(() => {
            setShouldRender(false);
            onClose(); // Only remove from state after fade-out
        }, 300);
    };

    if (!shouldRender) return null; // Don't render after fade-out completes

    return (
        <div className={`notification ${type} ${isVisible ? "fade-in" : "fade-out"}`}>
            <span>{message}</span>
            <button onClick={handleClose}>✖</button>
        </div>
    );
}

export default ToastNotification;
