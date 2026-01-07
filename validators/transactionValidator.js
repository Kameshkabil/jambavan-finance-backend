const { body } = require("express-validator");

exports.addTransactionValidator = [
  body("type")
    .isIn(["income", "expense"])
    .withMessage("Invalid transaction type"),

  body("amount")
    .isFloat({ gt: 0 })
    .withMessage("Amount must be greater than 0"),

  body("category")
    .trim()
    .notEmpty()
    .withMessage("Category is required"),

  body("transactionDate")
    .isISO8601()
    .withMessage("Invalid date format")
    .custom(value => {
        if (new Date(value) > new Date()) {
            throw new Error("Future transaction dates are not allowed");
        }
        return true;
    })
];
