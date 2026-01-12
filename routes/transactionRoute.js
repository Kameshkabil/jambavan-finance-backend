const express = require("express");
const { addTransaction, getRecentTransactions, updateTransaction, deleteTransaction, getOverallSummary, getAllTransactions, filterTransactions } = require("../controllers/transactionCtrl");
const { addTransactionValidator } = require("../validators/transactionValidator");
const { authMiddleware, isAdminOrSuperAdmin } = require("../middlewares/authMiddleware");
const router =  express.Router();

router.use(authMiddleware);
router.use(isAdminOrSuperAdmin);

router.post("/add", authMiddleware, addTransactionValidator, addTransaction);
router.get("/recent", getRecentTransactions);
router.put("/:id", updateTransaction);
router.delete("/:id", deleteTransaction);

router.get("/overall-summary", getOverallSummary);
router.get('/', getAllTransactions);

router.get('/filter', filterTransactions );

module.exports = router;