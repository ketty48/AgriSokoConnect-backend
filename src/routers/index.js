import expenseRouter from './expense.routes.js';
import goalsRouter from './goal.routes.js';
import budgetRouter from './budget.routes.js';
import express from 'express';
import userRouter from './users.routes.js';
import tokenRouter from './authToken.routes.js';
import { checkBudgetExceedsIncome,checkExpenseBeforeInsert } from "../utils/helperFunctions.js"
const router = express.Router();


router.use('/user', userRouter);
router.use('/token', tokenRouter);
router.use('/goals', goalsRouter);

export default router;