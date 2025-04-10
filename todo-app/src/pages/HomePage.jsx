import { useState, useEffect, useRef } from "react";
import ToastNotification from "../components/ToastNotification";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser, faPlus } from "@fortawesome/free-solid-svg-icons";
import { useNavigate } from "react-router-dom";
import DisplayTasks from "../components/DisplayTasks";

function HomePage() {
    const [notification, setNotification] = useState(null);
    const [username, setUsername] = useState("");
    const [showChangeUsernamePopup, setShowChangeUsernamePopup] = useState(false);
    const [newUsername, setNewUsername] = useState("");
    const [currentPassword, setCurrentPassword] = useState("");
    const [showChangePasswordPopup, setShowChangePasswordPopup] = useState(false);
    const [currentPasswordForChange, setCurrentPasswordForChange] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmNewPassword, setConfirmNewPassword] = useState("");
    const [showDropdown, setShowDropdown] = useState(false);
    const [showPopup, setShowPopup] = useState(false);
    const [editPopupVisible, setEditPopupVisible] = useState(false);
    const [editingTaskText, setEditingTaskText] = useState("");
    const [editingTaskId, setEditingTaskId] = useState(null);
    const [taskText, setTaskText] = useState("");
    const [tasks, setTasks] = useState([]);
    const [remainingTasksCount, setRemainingTasksCount] = useState(0);
    const [searchQuery, setSearchQuery] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [loadingDone, setLoadingDone] = useState(true);
    const navigate = useNavigate();
    const dropdownRef = useRef(null);
    const popupRef = useRef(null);

    const showNotification = (message, type = "error") => {
        setNotification({ message, type });
    };

    // initial login checks
    useEffect(() => {
        const storedUsername = localStorage.getItem("username");
        const storedPassword = localStorage.getItem("password");

        if (!storedUsername || !storedPassword) {
            navigate("/login");
            return;
        }

        showNotification("Auto Login Successful!", "success");
        setUsername(storedUsername);
        fetchTasks(storedUsername);
    }, []);

    const fetchTasks = async (username) => {
        try {
            const response = await fetch(`/tasks/${username}`);
            const data = await response.json();

            // Sort tasks by taskId in descending order before updating state
            const sortedTasks = data.sort((a, b) => b.taskId - a.taskId);
            setTasks(sortedTasks);
            calculateRemainingTasks(sortedTasks);
        } catch (error) {
            console.error("Error fetching tasks:", error);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem("username");
        localStorage.removeItem("password");
        navigate("/login");
    };

    const handleClickOutside = (event, ref, onClose) => {
        if (ref.current && !ref.current.contains(event.target)) {
            onClose();
        }
    };

    const dropdownClickHandler = (event) => handleClickOutside(event, dropdownRef, () => setShowDropdown(false));

    const handleProfileClick = () => {
        setShowDropdown(true);
        document.addEventListener("mousedown", dropdownClickHandler);
    };

    const handleNewTaskClick = () => {
        setShowPopup(true);
    };

    const handleBackdropClick = () => {
        setShowPopup(false);
        setTaskText("");
    };

    const handleAddTask = async () => {
        if (taskText.trim() === "") {
            showNotification("Please write your task");
            return;
        }

        const timestamp = Date.now();

        try {
            const response = await fetch("https://todo-app-xfj3.onrender.com/addTask", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    username,
                    task: taskText,
                    timestamp,
                }),
            });

            const data = await response.json();

            if (response.ok) {
                showNotification("Task added successfully!", "success");
                setTasks([data.newTask, ...tasks]); // Update UI with the new task
                calculateRemainingTasks([data.newTask, ...tasks]);
            } else {
                showNotification(data.error || "Failed to add task");
            }
        } catch (error) {
            console.error("Error adding task:", error);
            showNotification("Server error, try again later");
        }

        setShowPopup(false);
        setTaskText("");
    };

    const handleEditTask = async () => {
        const trimmedText = editingTaskText.trim();

        if (trimmedText === "") {
            showNotification("Task cannot be empty!", "error");
            return;
        }

        const existingTask = tasks.find(task => task.taskId === editingTaskId);

        if (existingTask && existingTask.task === trimmedText) {
            setEditPopupVisible(false);
            setEditingTaskId(null);
            setEditingTaskText("");
            showNotification("No changes made to the task.", "success");
            return;
        }

        try {
            const response = await fetch("https://todo-app-xfj3.onrender.com/editTask", {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    username,
                    taskId: editingTaskId,
                    updatedTask: trimmedText,
                }),
            });

            const data = await response.json();

            if (response.ok) {
                showNotification("Task updated successfully!", "success");
                fetchTasks(username); // refresh updated tasks
            } else {
                showNotification(data.error || "Failed to update task", "error");
            }
        } catch (error) {
            console.error("Error updating task:", error);
            showNotification("Server error, try again later", "error");
        }

        setEditPopupVisible(false);
        setEditingTaskId(null);
        setEditingTaskText("");
    };

    //delete task call
    const deleteTask = async (taskId) => {
        try {
            const response = await fetch(`https://todo-app-xfj3.onrender.com/deleteTask`, {
                method: "DELETE",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ username, taskId }),
            });

            const data = await response.json();

            if (response.ok) {
                showNotification("Task deleted successfully!", "success");
                fetchTasks(username);
            } else {
                showNotification(data.error || "Failed to delete task");
            }
        } catch (error) {
            console.error("Error deleting task:", error);
            showNotification("Server error, try again later");
        }
    };

    const calculateRemainingTasks = (taskList) => {
        const pendingTasks = taskList.filter(task => task.status === "pending").length;
        setRemainingTasksCount(pendingTasks);
    };

    //status change (completed/pending)
    const updateTaskStatus = async (taskId, newStatus) => {
        try {
            const response = await fetch("https://todo-app-xfj3.onrender.com/updateTaskStatus", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    username: username,  // Ensure username is passed correctly
                    taskId: taskId,
                    status: newStatus,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Failed to update task status");
            }

            const updatedTasks = tasks.map(task =>
                task.taskId === taskId ? { ...task, status: newStatus } : task
            );

            setTasks(updatedTasks);
            calculateRemainingTasks(updatedTasks);
        } catch (error) {
            console.error("Error updating task status:", error);
        }
    };

    const handleUsernameChange = async () => {

        if (!newUsername.trim() || !currentPassword.trim()) {
            showNotification("Fields cannot be empty.");
            return;
        }

        if (newUsername === username) {
            showNotification("New username cannot be same as current username.");
            return;
        }

        try {
            const response = await fetch("https://todo-app-xfj3.onrender.com/changeUsername", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    oldUsername: username,
                    newUsername: newUsername.trim(),
                    currentPassword: currentPassword.trim()
                })
            });

            const data = await response.json();

            if (!response.ok) {
                showNotification(data.error);
                return;
            }

            setIsLoading(true);
            setLoadingDone(false);

            // Success
            localStorage.setItem("username", newUsername.trim());
            setUsername(newUsername.trim());
            showNotification("Username changed successfully!", "success");
            setShowChangeUsernamePopup(false);
            setNewUsername("");
            setCurrentPassword("");

        } catch (err) {
            console.error("Error:", err);
            showNotification("Server error, try again later.");
        } finally {
            setTimeout(() => {
                setLoadingDone(true);
                setTimeout(() => setIsLoading(false), 500);
            }, 1500);
        }
    };

    const handleChangePassword = async () => {
        if (!currentPasswordForChange || !newPassword || !confirmNewPassword) {
            showNotification("Please fill out all fields.");
            return;
        }
    
        const storedPassword = localStorage.getItem("password");
    
        if (currentPasswordForChange !== storedPassword) {
            showNotification("Current password is incorrect.");
            return;
        }
    
        if (newPassword !== confirmNewPassword) {
            showNotification("New passwords do not match.");
            return;
        }

        if (newPassword === currentPasswordForChange) {
            showNotification("New password cannot be the same as the current password.");
            return;
        }
    
        try {
            const response = await fetch("https://todo-app-xfj3.onrender.com/changePassword", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    username: localStorage.getItem("username"),
                    currentPasswordForChange,
                    newPassword
                }),
            });
    
            const data = await response.json();
    
            if (response.ok) {
                showNotification("Password changed successfully!", "success")
                localStorage.setItem("password", newPassword);
                setShowChangePasswordPopup(false);
                setCurrentPasswordForChange("");
                setNewPassword("");
                setConfirmNewPassword("");
            } else {
                showNotification(data.error || "Something went wrong.");
            }
        } catch (err) {
            console.error("Error:", err);
            showNotification("Server error. Try again later.");
        }
    };
    
    useEffect(() => {
        return () => {
            document.removeEventListener("mousedown", dropdownClickHandler);
        };
    }, [showDropdown]);

    return (
        <>
            {isLoading ? (
                <div className={`loading-screen ${loadingDone ? 'fade-out' : 'fade-in'}`}>
                    <h2>Loading...</h2>
                </div>
            ) : (
                <div>
                    <div className="toast-notification">
                        {notification && (
                            <ToastNotification message={notification.message} type={notification.type} onClose={() => setNotification(null)} />
                        )}
                    </div>
                    <div className="container">
                        <div className="navBar">
                            <h1>My tasks</h1>
                            <div className="userDetails">
                                <h2>{username || "Guest"}</h2>
                                <button className={`profile button ${showDropdown ? "active" : ""}`} onClick={handleProfileClick}>
                                    <FontAwesomeIcon icon={faUser} style={{ color: "#ffffff" }} />
                                </button>
                            </div>
                            {showDropdown && (
                                <div className="dropdown-menu" ref={dropdownRef}>
                                    <button className="changeButton" onClick={() => {
                                        setShowChangeUsernamePopup(true);
                                        setShowDropdown(false);
                                    }}
                                    >Change Username</button>
                                    <button
                                        className="changeButton"
                                        onClick={() => {
                                            setShowChangePasswordPopup(true);
                                            setShowDropdown(false);
                                        }}
                                    >
                                        Change Password
                                    </button>
                                    <button className="logoutButton" onClick={handleLogout}>Logout</button>
                                </div>
                            )}
                        </div>
                        <hr />

                        <div className="taskCountLabel">
                            Task{remainingTasksCount === 1 || remainingTasksCount === 0 ? "" : "s"} left : {remainingTasksCount}
                        </div>

                        <div className="addTaskBarWrapper">
                            <div className="addTaskBar">
                                <input
                                    className="searchBar"
                                    placeholder="Search"
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                                <button className="newTaskBtn" onClick={handleNewTaskClick}>
                                    <FontAwesomeIcon icon={faPlus} /> New task
                                </button>
                            </div>
                        </div>

                        <div className="displayContainer">
                            <DisplayTasks
                                tasks={tasks.filter(task =>
                                    task.task.toLowerCase().includes(searchQuery.toLowerCase())
                                )}
                                updateTaskStatus={updateTaskStatus}
                                deleteTask={deleteTask}
                                triggerEditPopup={(taskId, taskText) => {
                                    setEditingTaskId(taskId);
                                    setEditingTaskText(taskText);
                                    setEditPopupVisible(true);
                                }}
                            />
                        </div>

                        {/* change username popup */}
                        {showChangeUsernamePopup && (
                            <>
                                <div className="backdrop" onClick={() => { setShowChangeUsernamePopup(false) }}>
                                </div>

                                <div className="taskPopup" ref={popupRef}>
                                    <h3 style={{ marginBottom: "10px" }}>Change Username</h3>

                                    <input
                                        type="text"
                                        placeholder="New Username"
                                        value={newUsername}
                                        onChange={(e) => setNewUsername(e.target.value)}
                                        className="inputField"
                                    />

                                    <input
                                        type="password"
                                        placeholder="Current Password"
                                        value={currentPassword}
                                        onChange={(e) => setCurrentPassword(e.target.value)}
                                        className="inputField"
                                        style={{ marginTop: "10px" }}
                                    />

                                    <div className="popupButtons">
                                        <button className="cancelBtn" onClick={() => setShowChangeUsernamePopup(false)}>Cancel</button>
                                        <button className="addTaskBtn" onClick={handleUsernameChange}>Change</button>
                                    </div>
                                </div>
                            </>
                        )}

                        {/* change password popup */}
                        {showChangePasswordPopup && (
                            <>
                                <div className="backdrop" onClick={() => setShowChangePasswordPopup(false)}></div>

                                <div className="taskPopup" ref={popupRef}>
                                    <h3 style={{ marginBottom: "10px" }}>Change Password</h3>

                                    <input
                                        type="password"
                                        placeholder="Current Password"
                                        value={currentPasswordForChange}
                                        onChange={(e) => setCurrentPasswordForChange(e.target.value)}
                                        className="inputField"
                                    />

                                    <input
                                        type="password"
                                        placeholder="New Password"
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        className="inputField"
                                        style={{ marginTop: "10px" }}
                                    />

                                    <input
                                        type="password"
                                        placeholder="Confirm New Password"
                                        value={confirmNewPassword}
                                        onChange={(e) => setConfirmNewPassword(e.target.value)}
                                        className="inputField"
                                        style={{ marginTop: "10px" }}
                                    />

                                    <div className="popupButtons">
                                        <button className="cancelBtn" onClick={() => {
                                            setShowChangePasswordPopup(false);
                                            setCurrentPasswordForChange("");
                                            setNewPassword("");
                                            setConfirmNewPassword("");
                                        }}>Cancel</button>
                                        <button className="addTaskBtn" onClick={handleChangePassword}>Change</button>
                                    </div>
                                </div>
                            </>
                        )}

                        {/* add new task popup */}
                        {showPopup && (
                            <>
                                <div className="backdrop" onClick={handleBackdropClick}></div>

                                <div className="taskPopup" ref={popupRef}>
                                    <textarea
                                        placeholder="Write your task here..."
                                        value={taskText}
                                        onChange={(e) => setTaskText(e.target.value)}
                                    />
                                    <div className="popupButtons">
                                        <button className="cancelBtn" onClick={handleBackdropClick}>Cancel</button>
                                        <button className="addTaskBtn" onClick={handleAddTask}>Add Task</button>
                                    </div>
                                </div>
                            </>
                        )}

                        {/* edit popup */}
                        {editPopupVisible && (
                            <>
                                <div className="backdrop" onClick={() => setEditPopupVisible(false)}></div>

                                <div className="taskPopup" ref={popupRef}>
                                    <textarea
                                        placeholder="Edit your task..."
                                        value={editingTaskText}
                                        onChange={(e) => setEditingTaskText(e.target.value)}
                                    />
                                    <div className="popupButtons">
                                        <button className="cancelBtn" onClick={() => setEditPopupVisible(false)}>Cancel</button>
                                        <button className="addTaskBtn" onClick={handleEditTask}>
                                            Edit Task
                                        </button>
                                    </div>
                                </div>
                            </>
                        )}

                        <hr className="line" />

                    </div>
                </div>
            )}
        </>
    );
}

export default HomePage;
