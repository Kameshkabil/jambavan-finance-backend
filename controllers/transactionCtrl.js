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

    // Validate ID format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid transaction ID" });
    }

    const transaction = await Transaction.findById(id);

    if (!transaction) {
      return res.status(404).json({ message: "Transaction not found" });
    }

    // Allow only own edits if admin
    if (
      req.user.role === "admin" &&
      transaction.userId.toString() !== req.user.id.toString()
    ) {
      return res.status(403).json({
        message: "You cannot edit another admin's transaction"
      });
    }

    const { type, category, amount, notes, transactionDate } = req.body;

    if (!type || !category || !amount || !transactionDate) {
      return res.status(400).json({ message: "Required fields missing" });
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
    res.status(500).json({ message: "Server error while updating transaction" });
  }
};

const deleteTransaction = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate ID format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid transaction ID" });
    }

    const transaction = await Transaction.findById(id);

    if (!transaction) {
      return res.status(404).json({ message: "Transaction not found" });
    }

    // Admin cannot delete someone else's transaction
    if (
      req.user.role === "admin" &&
      transaction.userId.toString() !== req.user.id.toString()
    ) {
      return res.status(403).json({
        message: "You cannot delete another admin's transaction"
      });
    }

    await transaction.deleteOne();

    res.status(200).json({ message: "Transaction deleted successfully" });

  } catch (error) {
    console.error("Delete Transaction Error:", error);
    res.status(500).json({ message: "Failed to delete transaction" });
  }
};


// const updateTransaction = async (req, res) => {
//   try {
//     const { id } = req.params;
//     const userId = req.user.id;

//     const {
//       type,
//       category,
//       amount,
//       notes,
//       transactionDate
//     } = req.body;

//     if (!type || !category || !amount || !transactionDate) {
//       return res.status(400).json({
//         message: "Required fields missing"
//       });
//     }

//     // const transaction = await Transaction.findOne({
//     //   _id: id,
//     //   userId
//     // });

//     // if (!transaction) {
//     //   return res.status(404).json({
//     //     message: "Transaction not found"
//     //   });
//     // }

//     let transaction = await Transaction.findById(id);

// if (!transaction) {
//   return res.status(404).json({ message: "Transaction not found" });
// }

// // If normal admin, allow own data only
// if (
//   req.user.role === "admin" &&
//   transaction.userId.toString() !== req.user._id.toString()
// ) {
//   return res.status(403).json({
//     message: "You cannot edit other admin's transaction"
//   });
// }


//     transaction.type = type;
//     transaction.category = category;
//     transaction.amount = amount;
//     transaction.notes = notes || "";
//     transaction.transactionDate = new Date(transactionDate);

//     await transaction.save();

//     res.status(200).json({
//       message: "Transaction updated successfully",
//       transaction
//     });

//   } catch (error) {
//     console.error("Update Transaction Error:", error);
//     res.status(500).json({
//       message: "Server error while updating transaction"
//     });
//   }
// };

// const deleteTransaction = async (req, res) => {
//     try {
//         const { id } = req.params;
//         const userId = req.user._id;

//         // const transaction = await Transaction.findOne({
//         //     _id: id,
//         //     userId
//         // });

//         // if (!transaction) {
//         //     return res.status(404).json({
//         //         message: "Transaction not found"
//         //     });
//         // }

//         const transaction = await Transaction.findById(id);

// if (!transaction) {
//   return res.status(404).json({ message: "Transaction not found" });
// }

// // admin cannot delete others data
// if (
//   req.user.role === "admin" &&
//   transaction.userId.toString() !== req.user._id.toString()
// ) {
//   return res.status(403).json({
//     message: "You cannot delete other admin's transaction"
//   });
// }


//         await transaction.deleteOne();

//         res.status(200).json({
//             message: "Transaction deleted successfully"
//         });

//     } catch (error) {
//         res.status(500).json({
//             message: "Failed to delete transaction"
//         });
//     }
// };

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

// const filterTransactions = async (req, res) => {
//     try {
//         const loggedInUserId = req.user._id; 

//         let { fromDate, toDate, type = "both" } = req.query;

//         // Build filter
//         const filter = { userId: new mongoose.Types.ObjectId(loggedInUserId) };

//         if (fromDate || toDate) {
//             filter.transactionDate = {};

//             if (fromDate) filter.transactionDate.$gte = new Date(`${fromDate}T00:00:00.000Z`);
//             if (toDate) filter.transactionDate.$lte = new Date(`${toDate}T23:59:59.999Z`);
//         }

//         if (type !== "both") {
//             filter.type = type;
//         }

//         // Get all filtered transactions
//         const transactions = await Transaction.find(filter)
//             .sort({ transactionDate: 1 }) // sort ascending (or descending if you prefer)
//             .lean();

//         res.status(200).json({
//             success: true,
//             data: transactions,
//             total: transactions.length
//         });

//     } catch (error) {
//         console.error(error);
//         res.status(500).json({ success: false, message: "Server Error" });
//     }
// };

const filterTransactions = async (req, res) => {
    try {
        let { fromDate, toDate, type = "both" } = req.query;

        // Start with empty filter (no user restriction)
        const filter = {};

        if (fromDate || toDate) {
            filter.transactionDate = {};

            if (fromDate) {
                filter.transactionDate.$gte = new Date(`${fromDate}T00:00:00.000Z`);
            }

            if (toDate) {
                filter.transactionDate.$lte = new Date(`${toDate}T23:59:59.999Z`);
            }
        }

        if (type !== "both") {
            filter.type = type;
        }

        const transactions = await Transaction.find(filter)
            .sort({ transactionDate: 1 })
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


module.exports = { addTransaction, getRecentTransactions, updateTransaction, deleteTransaction, getOverallSummary, getAllTransactions, filterTransactions };