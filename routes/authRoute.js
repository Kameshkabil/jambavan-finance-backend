const express = require("express");
const { createUser, loginUser, getallUser, getUser, deleteUser, updateUser, blockUser, unblockUser, updatePassword, forgotPasswordToken, resetPassword } = require("../controllers/userCtrl");
const { authMiddleware, isAdmin } = require("../middlewares/authMiddleware");
const router =  express.Router();

router.post("/register-admin", authMiddleware, isAdmin, createUser);
router.post("/forgot-password-token", forgotPasswordToken);
router.put("/reset-password/:token", resetPassword);
router.put("/password", authMiddleware, updatePassword);
router.post("/login", loginUser);
router.get("/all-users", getallUser);
router.get("/:id", authMiddleware, isAdmin, getUser);
router.delete("/:id", deleteUser);
router.put("/edit-user", authMiddleware, updateUser);
router.put("/block-user/:id", authMiddleware, isAdmin, blockUser);
router.put("/unblock-user/:id", authMiddleware, isAdmin, unblockUser);
//router.put("/refresh", handleRefreshToken);


module.exports = router;