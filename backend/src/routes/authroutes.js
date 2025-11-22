import express from "express";
import { registerAdmin, loginUser, createTestUser, updateProfile, getProfile } from "../controllers/authControllers.js";

const router = express.Router();

// Test route
router.get("/test", (req, res) => {
  res.json({ message: "Auth routes are working!", timestamp: new Date().toISOString() });
});

// Test profile route (for debugging)
router.get("/test-profile", (req, res) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  res.json({ 
    message: "Profile test route", 
    hasToken: !!token,
    token: token ? token.substring(0, 20) + '...' : 'No token'
  });
});

// Register new Admin
router.post("/register-admin", registerAdmin);

// Login (works for Admin and future roles too)
router.post("/login", loginUser);
router.post("/create-test-user", createTestUser);

// Profile management
router.get("/profile", getProfile);
router.put("/profile", updateProfile);

export default router;
