import express from "express";
import { 
  listUsers, 
  getUser, 
  createUser, 
  updateUser, 
  deleteUser,
  restoreUser,
  bulkDeleteUsers,
  bulkRestoreUsers,
  assignParentToStudent,
  removeParentFromStudent,
  getUserStats,
  createAdditionalAccount,
  getUserAccounts,
  testUsers
} from "../controllers/adminUserController.js";
import { authenticateToken, requireAdmin } from "../middleware/auth.js";

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authenticateToken);
router.use(requireAdmin);

// Test endpoint
router.get("/test-users", testUsers);

// Basic CRUD operations
router.get("/users", listUsers);
router.get("/users/:id", getUser);
router.post("/users", createUser);
router.put("/users/:id", updateUser);
router.delete("/users/:id", deleteUser);

// Additional account management
router.post("/users/:userId/accounts", createAdditionalAccount);
router.get("/users/:userId/accounts", getUserAccounts);

// Advanced operations
router.post("/users/:id/restore", restoreUser);
router.post("/users/bulk-delete", bulkDeleteUsers);
router.post("/users/bulk-restore", bulkRestoreUsers);

// Parent-Student management
router.post("/users/assign-parent", assignParentToStudent);
router.post("/users/remove-parent", removeParentFromStudent);

// Statistics
router.get("/users/stats", getUserStats);

export default router;


