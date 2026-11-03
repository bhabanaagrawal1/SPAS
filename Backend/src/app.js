//Express as a toolkit for building our backend server.
import express from "express";
import cors from "cors";
import authRoutes from "./routes/5.auth.routes.js"
import githubRoutes from "./routes/github.routes.js";
import cookieParser from "cookie-parser";
import { errorHandler } from "./middleware/14.errorHandler.js";
import codingProfileRoutes from "./routes/codingProfile.routes.js";

//creates Express application
const app = express();
// Allow requests from your React frontend
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);
app.use(express.json());

// Read cookies sent by the browser
app.use(cookieParser());
// Now app gives us methods such as:
// app.get()
// app.post()
// app.put()/patch()
// app.delete()
// app.use()

// 200 → Success
// 201 → Resource created
// 400 → Bad request
// 401 → Not authenticated
// 403 → Not authorized
// 404 → Not found
// 500 → Server error
// Authentication routes
app.use("/api/auth", authRoutes);
app.use("/api/github", githubRoutes);
app.use("/api/coding-profiles", codingProfileRoutes);
app.use(errorHandler);


export default app;