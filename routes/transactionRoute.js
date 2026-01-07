const express = require("express");
const { addTransaction, getRecentTransactions, updateTransaction, deleteTransaction, getOverallSummary, getAllTransactions, filterTransactions } = require("../controllers/transactionCtrl");
const { addTransactionValidator } = require("../validators/transactionValidator");
const { authMiddleware, isAdmin } = require("../middlewares/authMiddleware");
const router =  express.Router();

router.post("/add", authMiddleware, isAdmin, addTransactionValidator, addTransaction);
router.get("/recent", authMiddleware, isAdmin, getRecentTransactions);
router.put("/:id", authMiddleware, isAdmin, updateTransaction);
router.delete("/:id", authMiddleware, isAdmin, deleteTransaction);

router.get("/overall-summary", authMiddleware, isAdmin, getOverallSummary);
router.get('/', getAllTransactions);

router.get('/filter', authMiddleware, isAdmin, filterTransactions );

module.exports = router;