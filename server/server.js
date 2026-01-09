import express from 'express';
import { auth } from 'express-openid-connect';
import dotenv from "dotenv";
import cookieParser from 'cookie-parser';
import cors from 'cors';
import connect from './db/connect.js';
import fs from 'fs';
import User from "./models/userModel.js";
import asyncHandler from 'express-async-handler';
import cron from 'node-cron';
import syncExternalJobs from './services/jobSync.js';
import jobRoutes from './routes/jobRoutes.js';

// ✅ Fixed: Use ESM imports for HTTP and Socket.io
import { createServer } from "http";
import { Server } from "socket.io";

dotenv.config();
const app = express();

// ✅ Create the HTTP server using the Express app
const httpServer = createServer(app);

// ✅ Initialize Socket.io with the HTTP server
const io = new Server(httpServer, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    methods: ["GET", "POST"],
    credentials: true,
  },
});

const config = {
  authRequired: false,
  auth0Logout: true,
  secret: process.env.SECRET,
  baseURL: process.env.BASE_URL,
  clientID: process.env.CLIENT_ID,
  issuerBaseURL: process.env.ISSUER_BASE_URL,
  routes: {
    postLogoutRedirect: process.env.CLIENT_URL,
    callback: "/callback",
    logout: "/logout",
    login: "/login",
  },
  logoutParams: {
    returnTo: process.env.CLIENT_URL
  }
};

// Middleware
app.use(cors({
  origin: process.env.CLIENT_URL,
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  exposedHeaders: ["set-cookie"],
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(auth(config));

// Socket.io Connection
io.on("connection", (socket) => {
  console.log("A user connected:", socket.id);
  socket.on("disconnect", () => {
    console.log("User disconnected");
  });
});

// ✅ Make 'io' accessible to your routes and services
app.set("io", io);

// Function to ensure User exists in DB
const ensureUserInDB = asyncHandler(async (user) => {
  try {
    const existingUser = await User.findOne({ auth0Id: user.sub });
    if (!existingUser) {
      const newUser = new User({
        name: user.name,
        email: user.email,
        auth0Id: user.sub,
        role: "jobseeker",
        profilePicture: user.picture,
      });
      await newUser.save();
    }
  } catch (error) {
    console.log("Error ensuring user in DB:", error.message);
  }
});

// --- AUTOMATION: CRON JOB ---
cron.schedule('0 0 * * *', async () => {
   // ✅ Get io instance
  await syncExternalJobs("Software Engineer", io); // ✅ Pass it here
  console.log('--- Running Hourly Job Sync ---');
  try {
    const io = app.get("io");
    await syncExternalJobs("Software Engineer",io);
    res.send("Sync process started. Check your website!");
  } catch (err) {
    console.error("Cron Job Error:", err.message);
  }
});

// --- MANUAL TEST ROUTE ---
// app.get("/api/v1/sync-now", asyncHandler(async (req, res) => {
//   console.log("Manual Sync Requested...");
//   const io = req.app.get("io");
//   await syncExternalJobs("React Developer");
//   res.send("Sync process started. Check console for details.");
// }));

app.get("/", async (req, res) => {
  if (req.oidc.isAuthenticated()) {
    await ensureUserInDB(req.oidc.user);
    return res.redirect(process.env.CLIENT_URL);
  } else {
    return res.send("Logged out");
  }
});


// Dynamic Route Loading
const routeFiles = fs.readdirSync("./routes");
routeFiles.forEach((file) => {
  import(`./routes/${file}`)
    .then((route) => {
    app.use("/api/v1", route.default);
    })
    .catch((error) => {
      console.log("Error importing route", error);
    });
});

// ✅ Corrected Start Function
const startServer = async () => {
  try {
    await connect();
    // ✅ Listen on httpServer, not app
    httpServer.listen(process.env.PORT || 8000, () => {
      console.log(`Server running on port ${process.env.PORT || 8000}`);
    });
  } catch (error) {
    console.log("Server error", error.message);
    process.exit(1);
  }
};

startServer();