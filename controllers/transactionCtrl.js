const { validationResult } = require("express-validator");
const Transaction = require("../models/transactionModel");
const asyncHandler = require("express-async-handler");
const mongoose = require('mongoose');

const addTransaction = asyncHandler( async (req, res) => {
    try {
    const { transactionDate, category, type, amount, notes } = req.body;
    const userId = req.body.userId || req.user.id;

    if (!userId || !transactionDate || !category || !type || !amount) {
      return res.status(400).json({ message: "All required fields must be provided" });
    }

    const newTransaction = await Transaction.create({
      userId,
      transactionDate,
      category,
      type,
      amount,
      notes
    });

    res.status(201).json(newTransaction);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
});

const getRecentTransactions = async (req, res) => {
  try {
    const userId = req.user.id;

    const transactions = await Transaction.find({ userId })
      .sort({ createdAt: -1 }) // newest first
      .limit(1);               // only recent 1

    res.status(200).json(transactions);
  } catch (error) {
    console.error("Recent Transaction Error:", error);
    res.status(500).json({ message: "Failed to fetch recent transactions" });
  }
};

const updateTransaction = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const {
      type,
      category,
      amount,
      notes,
      transactionDate
    } = req.body;

    if (!type || !category || !amount || !transactionDate) {
      return res.status(400).json({
        message: "Required fields missing"
      });
    }

    const transaction = await Transaction.findOne({
      _id: id,
      userId
    });

    if (!transaction) {
      return res.status(404).json({
        message: "Transaction not found"
      });
    }

    transaction.type = type;
    transaction.category = category;
    transaction.amount = amount;
    transaction.notes = notes || "";
    transaction.transactionDate = new Date(transactionDate);

    await transaction.save();

    res.status(200).json({
      message: "Transaction updated successfully",
      transaction
    });

  } catch (error) {
    console.error("Update Transaction Error:", error);
    res.status(500).json({
      message: "Server error while updating transaction"
    });
  }
};

const deleteTransaction = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user._id;

        const transaction = await Transaction.findOne({
            _id: id,
            userId
        });

        if (!transaction) {
            return res.status(404).json({
                message: "Transaction not found"
            });
        }

        await transaction.deleteOne();

        res.status(200).json({
            message: "Transaction deleted successfully"
        });

    } catch (error) {
        res.status(500).json({
            message: "Failed to delete transaction"
        });
    }
};

const getOverallSummary = async (req, res) => {
    const result = await Transaction.aggregate([
        {
            $group: {
                _id: "$type",
                totalAmount: { $sum: "$amount" }
            }
        }
    ]);

    let totalIncome = 0;
    let totalExpense = 0;

    result.forEach(r => {
        if (r._id === "income") totalIncome = r.totalAmount;
        if (r._id === "expense") totalExpense = r.totalAmount;
    });

    res.json({
        totalIncome,
        totalExpense,
        balance: totalIncome - totalExpense
    });
};

const getAllTransactions = async (req, res) => {
    try {
        const transactions = await Transaction.find().sort({ _id: -1 });
        res.json(transactions);
    } catch (err) {
        console.error('Error fetching transactions:', err);
        res.status(500).json({ message: 'Server Error' });
    }
};

const filterTransactions = async (req, res) => {
    try {
        const loggedInUserId = req.user._id; 

        let { fromDate, toDate, type = "both" } = req.query;

        // Build filter
        const filter = { userId: new mongoose.Types.ObjectId(loggedInUserId) };

        if (fromDate || toDate) {
            filter.transactionDate = {};

            if (fromDate) filter.transactionDate.$gte = new Date(`${fromDate}T00:00:00.000Z`);
            if (toDate) filter.transactionDate.$lte = new Date(`${toDate}T23:59:59.999Z`);
        }

        if (type !== "both") {
            filter.type = type;
        }

        // Get all filtered transactions
        const transactions = await Transaction.find(filter)
            .sort({ transactionDate: 1 }) // sort ascending (or descending if you prefer)
            .lean();

        res.status(200).json({
            success: true,
            data: transactions,
            total: transactions.length
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Server Error" });
    }
};


// const filterTransactions = async (req, res) => {
//     try {
//         const loggedInUserId = req.user._id; 

//         let {
//             fromDate,
//             toDate,
//             type = "both",
//             page = 1,
//             limit = 10
//         } = req.query;

//         page = parseInt(page) || 1;
//         limit = parseInt(limit) || 10;

//         // FIX 1: Use 'userId' (matching your DB) instead of 'user'
//         const filter = { userId: new mongoose.Types.ObjectId(loggedInUserId) };

//         // FIX 2: Use 'transactionDate' (matching your DB) instead of 'date'
//         if (fromDate || toDate) {
//             filter.transactionDate = {}; // Changed from filter.date

//             if (fromDate) {
//                 filter.transactionDate.$gte = new Date(`${fromDate}T00:00:00.000Z`);
//             }

//             if (toDate) {
//                 filter.transactionDate.$lte = new Date(`${toDate}T23:59:59.999Z`);
//             }
//         }

//         if (type !== "both") {
//             filter.type = type; 
//         }

//         const totalCount = await Transaction.countDocuments(filter);

//         const transactions = await Transaction.find(filter)
//             .sort({ transactionDate: 1 }) // Sort by the correct field name
//             .skip((page - 1) * limit)
//             .limit(limit)
//             .lean();

//         res.status(200).json({
//             success: true,
//             data: transactions,
//             pagination: {
//                 total: totalCount,
//                 page,
//                 limit,
//                 totalPages: Math.ceil(totalCount / limit)
//             }
//         });

//     } catch (error) {
//         console.error(error);
//         res.status(500).json({ success: false, message: "Server Error" });
//     }
// };



module.exports = { addTransaction, getRecentTransactions, updateTransaction, deleteTransaction, getOverallSummary, getAllTransactions, filterTransactions };