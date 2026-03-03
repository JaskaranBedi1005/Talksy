import express from 'express'
import { configDotenv } from 'dotenv'
import cors from 'cors'
import http from 'http'
import { connectDB } from './lib/db.js';
import userRouter from './routes/userRoutes.js';
import messageRouter from './routes/messageRoutes.js';
import { Server } from "socket.io"

configDotenv();
const app = express();
const server = http.createServer(app);

// Debug middleware to log all requests and their origins
app.use((req, res, next) => {
    console.log(`${req.method} ${req.url} - Origin: ${req.headers.origin}`);
    next();
});
const frontendUrl = process.env.FRONTEND_URL?.replace(/\/$/, "");
const allowedOrigins = frontendUrl
    ? [frontendUrl, "http://localhost:5173"]
    : ["http://localhost:5173"];

console.log("Allowed Origins:", allowedOrigins);

app.use(cors({
    origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps or curl)
        if (!origin) return callback(null, true);
        if (allowedOrigins.includes(origin.replace(/\/$/, ""))) {
            callback(null, true);
        } else {
            console.log("CORS blocked origin:", origin);
            callback(new Error("Not allowed by CORS"));
        }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "token", "Authorization", "X-Requested-With"]
}));


//Initialize socket.io server
export const io = new Server(server, {
    cors: {
        origin: allowedOrigins,
        credentials: true
    }
})
// store online users
export const userSocketMap = {}; //{userId:socketId}
//Socket.io connection handler
io.on("connection", (socket) => {
    const userId = socket.handshake.query.userId;
    console.log("User connected", userId);
    if (userId) userSocketMap[userId] = socket.id;

    //Emit online users to all connected clients
    io.emit("getOnlineUsers", Object.keys(userSocketMap));

    // WebRTC Signaling
    socket.on("call-user", (data) => {
        const recipientSocketId = userSocketMap[data.userToCall];
        if (recipientSocketId) {
            io.to(recipientSocketId).emit("incoming-call", {
                signal: data.signalData,
                from: data.from,
                name: data.name,
                callType: data.callType // 'video' or 'audio'
            });
        }
    });

    socket.on("answer-call", (data) => {
        io.to(userSocketMap[data.to]).emit("call-accepted", data.signal);
    });

    socket.on("end-call", (data) => {
        const recipientSocketId = userSocketMap[data.to];
        if (recipientSocketId) {
            io.to(recipientSocketId).emit("call-ended");
        }
    });

    socket.on("ice-candidate", (data) => {
        const recipientSocketId = userSocketMap[data.to];
        if (recipientSocketId) {
            io.to(recipientSocketId).emit("ice-candidate", data.candidate);
        }
    });

    socket.on("disconnect", () => {
        console.log("User disconnected", userId);
        delete userSocketMap[userId];
        io.emit("getOnlineUsers", Object.keys(userSocketMap));
    })
})

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));



app.get("/api/status", (req, res) => {
    res.send("Server is live");
})
app.use("/api/auth", userRouter);
app.use("/api/messages", messageRouter);
await connectDB();
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    console.log(`Server listening on PORT ${PORT}`);
})
