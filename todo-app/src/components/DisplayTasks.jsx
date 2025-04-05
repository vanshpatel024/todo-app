import React, { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPen, faTrash } from "@fortawesome/free-solid-svg-icons";

function DisplayTasks({ tasks, updateTaskStatus, deleteTask, triggerEditPopup }) {
    const [taskList, setTaskList] = useState([]);

    useEffect(() => {
        const sortedTasks = [...tasks].sort((a, b) => {
            if (a.status === "pending" && b.status === "completed") return -1;
            if (a.status === "completed" && b.status === "pending") return 1;
            return 0;
        });
        setTaskList(sortedTasks);
    }, [tasks]);

    const handleCheckboxChange = async (taskId) => {
        const updatedTasks = taskList.map(task =>
            task.taskId === taskId ? { ...task, status: task.status === "completed" ? "pending" : "completed" } : task
        );

        setTaskList(updatedTasks);

        const updatedTask = updatedTasks.find(task => task.taskId === taskId);

        if (updatedTask) {
            await updateTaskStatus(taskId, updatedTask.status);
        }
    };

    const handleDeleteTask = async (taskId) => {
        await deleteTask(taskId);
    };

    return (
        <div className="tasksWrapper">
            {taskList.length > 0 ? (
                taskList.map((task, index) => (
                    <div
                        key={task.taskId}
                        className="taskContainer animate-task"
                        style={{ animationDelay: `${index * 100}ms` }} // delay increases for each task
                    >
                        <div className="checkTaskContainer">
                            <input
                                type="checkbox"
                                className="taskCheckbox"
                                checked={task.status === "completed"}
                                onChange={() => handleCheckboxChange(task.taskId)}
                            />
                            <p className="taskText">{task.task}</p>
                        </div>

                        <div className="taskActions">
                            <button
                                className="editBtn"
                                onClick={() => triggerEditPopup(task.taskId, task.task)}
                            >
                                <FontAwesomeIcon icon={faPen} style={{ color: "#ffffff" }} />
                            </button>
                            <button className="deleteBtn" onClick={() => handleDeleteTask(task.taskId)}>
                                <FontAwesomeIcon icon={faTrash} style={{ color: "#ffffff" }} />
                            </button>
                        </div>
                    </div>
                ))
            ) : (
                <p className="noTasks">No tasks available.</p>
            )}
        </div>
    );
}

export default DisplayTasks;
