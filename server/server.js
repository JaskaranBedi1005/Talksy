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
let frontendUrl = process.env.FRONTEND_URL?.trim().replace(/\/$/, "");
if (frontendUrl && !frontendUrl.startsWith("http")) {
    frontendUrl = `https://${frontendUrl}`;
}
const allowedOrigins = frontendUrl
    ? [frontendUrl, "http://localhost:5173"]
    : ["http://localhost:5173"];

// Manual Preflight & CORS Handler (as early as possible)
app.use((req, res, next) => {
    const origin = req.headers.origin;
    const normalizedOrigin = origin?.replace(/\/$/, "");

    if (origin && (allowedOrigins.includes(normalizedOrigin) || normalizedOrigin.includes("vercel.app"))) {
        res.setHeader("Access-Control-Allow-Origin", origin);
        res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
        res.setHeader("Access-Control-Allow-Headers", "Content-Type, token, Authorization, X-Requested-With");
        res.setHeader("Access-Control-Allow-Credentials", "true");
    }

    // Handle Preflight (OPTIONS)
    if (req.method === "OPTIONS") {
        console.log(`CORS Preflight: ${origin} -> SUCCESS`);
        return res.sendStatus(204);
    }
    next();
});

// This will show up in Render logs when the server starts
console.log("--- CORS CONFIGURATION ---");
console.log("RAW FRONTEND_URL ENV:", process.env.FRONTEND_URL);
console.log("NORMALIZED ALLOWED ORIGINS:", allowedOrigins);
console.log("--------------------------");

// Keep the standard CORS as a secondary check/helper
app.use(cors({
    origin: (origin, callback) => {
        if (!origin) return callback(null, true);
        const normalizedOrigin = origin.replace(/\/$/, "");
        if (allowedOrigins.includes(normalizedOrigin) || normalizedOrigin.includes("vercel.app")) {
            callback(null, true);
        } else {
            callback(new Error(`CORS Reject: ${normalizedOrigin}`));
        }
    },
    credentials: true,
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
