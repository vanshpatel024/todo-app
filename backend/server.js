const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const { Long } = require("bson");

const app = express(); 

app.use(cors({
    origin: [
        "http://localhost:5173", 
        "https://todo-app-lake-sigma-57.vercel.app"
    ],
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type"],
    credentials: true,
    preflightContinue: false,
    optionsSuccessStatus: 204
}));

app.options('*', cors()); // Allow preflight across all routes

app.use(express.json());

const MONGO_URI = "mongodb+srv://suchomartin2:IsuLrbYZTrhrQdaX@cluster1.wunkv.mongodb.net/TodoDB";

mongoose.connect(MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
.then(() => console.log("Connected to MongoDB"))
.catch(err => console.error("MongoDB Connection Error:", err));

//login
app.post("/login", async (req, res) => {
    console.log("Received login request:", req.body);
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ error: "Username and password are required" });
    }

    try {
        const db = mongoose.connection.db;
        const collections = await db.listCollections().toArray();
        console.log("Existing collections:", collections.map(col => col.name));

        if (!collections.some(col => col.name === username)) {
            console.log("User collection not found:", username);
            return res.status(400).json({ error: "User not found" });
        }

        const user = await db.collection(username).findOne({});
        console.log("Fetched user data:", user);

        if (!user || user.Password !== password) {
            return res.status(400).json({ error: "Incorrect password" });
        }

        res.json({ message: "Login successful!" });
    } catch (error) {
        console.error("Error during login:", error);
        res.status(500).json({ error: "Server error, try again later" });
    }
});

//registration
app.post("/register", async (req, res) => {
    console.log("Received register request:", req.body);
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ error: "Username and password are required" });
    }

    try {
        const db = mongoose.connection.db;
        const collections = await db.listCollections().toArray();
        const collectionNames = collections.map(col => col.name);

        // Check if the username already exists as a collection
        if (collectionNames.includes(username)) {
            return res.status(400).json({ error: "Username already taken" });
        }

        // Create a new collection with the username
        const userCollection = db.collection(username);
        await userCollection.insertOne({
            title: "LoginInfo",
            Username: username,
            Password: password, // Consider hashing this in a real-world scenario!
        });

        console.log("Account created successfully:", username);
        res.json({ message: "Account created successfully" });
    } catch (error) {
        console.error("Error during registration:", error);
        res.status(500).json({ error: "Server error" });
    }
});

//fetching of tasks
app.get("/tasks/:username", async (req, res) => {
    try {
        const { username } = req.params;
        const collection = mongoose.connection.db.collection(username);

        // Fetch all tasks (excluding LoginInfo) and sort by taskId in descending order
        const tasks = await collection
            .find({ title: { $ne: "LoginInfo" } })
            .sort({ taskId: -1 }) // Sort in descending order
            .toArray();

        res.json(tasks);
    } catch (error) {
        console.error("Error fetching tasks:", error);
        res.status(500).json({ error: "Failed to fetch tasks" });
    }
});

//adding of a new task
app.post("/addTask", async (req, res) => {
    const { username, task, timestamp } = req.body;

    if (!username || !task) {
        return res.status(400).json({ error: "Username and task are required" });
    }

    try {
        const db = mongoose.connection.db;
        const collection = db.collection(username);

        // Get last taskId and increment
        const lastTask = await collection.find({ title: { $ne: "LoginInfo" } })
            .sort({ taskId: -1 })
            .limit(1)
            .toArray();

        const lastTaskId = lastTask.length > 0 ? lastTask[0].taskId : 0;
        const newTaskId = lastTaskId + 1;

        const newTask = {
            taskId: newTaskId,
            task,
            status: "pending",
            timestamp: Long.fromNumber(timestamp),
        };

        await collection.insertOne(newTask);

        res.json({ message: "Task added successfully", newTask });
    } catch (error) {
        console.error("Error adding task:", error);
        res.status(500).json({ error: "Failed to add task" });
    }
});

//clicking on checkbox (status change)
app.post("/updateTaskStatus", async (req, res) => {
    try {
        const { username, taskId, status } = req.body;

        if (!username || taskId === undefined || !status) {
            return res.status(400).json({ error: "Invalid request data" });
        }

        const collection = mongoose.connection.db.collection(username);

        const taskIdInt = parseInt(taskId);

        const result = await collection.updateOne(
            { taskId: taskIdInt },
            { $set: { status: status } }
        );

        if (result.modifiedCount === 0) {
            return res.status(404).json({ error: "Task not found" });
        }

        res.json({ message: "Task status updated successfully" });

    } catch (error) {
        console.error("Error updating task status:", error);
        res.status(500).json({ error: "Failed to update task status" });
    }
});

//deletion of task
app.delete("/deleteTask", async (req, res) => {
    const { username, taskId } = req.body;

    if (!username || taskId === undefined) {
        return res.status(400).json({ error: "Username and taskId are required" });
    }

    try {
        const db = mongoose.connection.db;
        const collection = db.collection(username);

        // 1️⃣ Delete the task
        const result = await collection.deleteOne({ taskId });

        if (result.deletedCount !== 1) {
            return res.status(404).json({ error: "Task not found" });
        }

        // 2️⃣ Fetch remaining tasks, excluding `loginInfo`
        const remainingTasks = await collection
            .find({ title: { $ne: "LoginInfo" } }) // Exclude loginInfo document
            .sort({ timestamp: 1 })
            .toArray();

        // 3️⃣ Reassign taskId sequentially (ignoring loginInfo)
        for (let i = 0; i < remainingTasks.length; i++) {
            await collection.updateOne(
                { _id: remainingTasks[i]._id },
                { $set: { taskId: i + 1 } }
            );
        }

        res.json({ message: "Task deleted and IDs reset successfully" });

    } catch (error) {
        console.error("Error deleting task:", error);
        res.status(500).json({ error: "Failed to delete task" });
    }
});

// Edit task
app.put("/editTask", async (req, res) => {
    const { username, taskId, updatedTask } = req.body;

    if (!username || taskId === undefined || !updatedTask) {
        return res.status(400).json({ error: "Username, taskId, and updatedTask are required" });
    }

    try {
        const db = mongoose.connection.db;
        const collection = db.collection(username);

        const result = await collection.updateOne(
            { taskId },
            { $set: { task: updatedTask } }
        );

        if (result.matchedCount === 0) {
            return res.status(404).json({ error: "Task not found" });
        }

        res.json({ message: "Task updated successfully" });
    } catch (error) {
        console.error("Error updating task:", error);
        res.status(500).json({ error: "Failed to update task" });
    }
});

//changing of username
app.post("/changeUsername", async (req, res) => {
    const { oldUsername, newUsername, currentPassword } = req.body;

    if (!oldUsername || !newUsername || !currentPassword) {
        return res.status(400).json({ error: "All fields are required." });
    }

    if (oldUsername === newUsername) {
        return res.status(400).json({ error: "New username cannot be the same as the current username." });
    }

    try {
        const db = mongoose.connection.db;

        const collections = await db.listCollections().toArray();
        const existingUsernames = collections.map(col => col.name);

        // Check if new username is already taken
        if (existingUsernames.includes(newUsername)) {
            return res.status(409).json({ error: "Username already taken." });
        }

        const oldCollection = db.collection(oldUsername);
        const loginDoc = await oldCollection.findOne({ title: "LoginInfo" });

        if (!loginDoc || loginDoc.Password !== currentPassword) {
            return res.status(401).json({ error: "Incorrect password." });
        }

        // Get all documents
        const allDocs = await oldCollection.find({}).toArray();

        // Update username field
        if (allDocs.length > 0 && allDocs[0].title === "LoginInfo") {
            allDocs[0].Username = newUsername;
        }

        const newCollection = db.collection(newUsername);
        await newCollection.insertMany(allDocs);

        // Drop old collection
        await oldCollection.drop();

        res.status(200).json({ message: "Username changed successfully." });

    } catch (err) {
        console.error("Error changing username:", err);
        res.status(500).json({ error: "Server error." });
    }
});

//change password
app.post("/changePassword", async (req, res) => {
    const { username, currentPasswordForChange, newPassword } = req.body;

    if (!username || !currentPasswordForChange || !newPassword) {
        return res.status(400).json({ error: "All fields are required." });
    }

    try {
        const db = mongoose.connection.db;
        const userCollection = db.collection(username);
        const loginDoc = await userCollection.findOne({ title: "LoginInfo" });

        if (!loginDoc || loginDoc.Password !== currentPasswordForChange) {
            return res.status(401).json({ error: "Current password is incorrect." });
        }

        await userCollection.updateOne(
            { title: "LoginInfo" },
            { $set: { Password: newPassword } }
        );

        return res.status(200).json({ message: "Password changed successfully." });

    } catch (err) {
        console.error("Error changing password:", err);
        res.status(500).json({ error: "Server error." });
    }
});


const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

