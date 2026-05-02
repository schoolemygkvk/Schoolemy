import express from "express";
import { verifyToken } from "../../Middleware/authMiddleware.js";
import { checkRole } from "../../Middleware/checkRole.js";
import {
  createExpense,
  getAllExpenses,
  getExpenseById,
  updateExpense,
  deleteExpense,
  approveExpense,
  markExpenseAsPaid,
  rejectExpense,
  getExpenseStatistics,
} from "../../Controllers/Financial/ExpenseController.js";

const router = express.Router();

// Expense routes
router.post("/expense/create", verifyToken, checkRole(['admin', 'finance']), createExpense);
router.get("/expense/list", verifyToken, checkRole(['admin', 'finance']), getAllExpenses);
router.get("/expense/statistics", verifyToken, checkRole(['admin', 'finance']), getExpenseStatistics);
router.get("/expense/:expenseId", verifyToken, checkRole(['admin', 'finance']), getExpenseById);
router.put("/expense/:expenseId", verifyToken, checkRole(['admin', 'finance']), updateExpense);
router.delete("/expense/:expenseId", verifyToken, checkRole(['admin', 'finance']), deleteExpense);
router.patch("/expense/:expenseId/approve", verifyToken, checkRole(['admin', 'finance']), approveExpense);
router.patch("/expense/:expenseId/paid", verifyToken, checkRole(['admin', 'finance']), markExpenseAsPaid);
router.patch("/expense/:expenseId/reject", verifyToken, checkRole(['admin', 'finance']), rejectExpense);

export default router;
