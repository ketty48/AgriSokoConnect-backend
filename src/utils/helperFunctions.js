import { sendEmail } from "../utils/sendEmail.js";
import UserModel from "../models/user.model.js";
import BudgetModel from "../models/budget.model.js";
import ExpenseModel from "../models/expense.model.js";
import asyncWrapper from "../middlewares/async.js";
export const calculateTotalIncome = async (userId) => {
 
  const user = await UserModel.findById(userId);
  console.log(user)
  return user.income;
};

export const calculateTotalExpenses = async (userId) => {
  const currentDate = new Date();
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  const lastDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

  const totalExpenses = await ExpenseModel.aggregate([
    {
      $match: {
        user: userId,
        createdAt: { $gte: firstDayOfMonth, $lte: lastDayOfMonth }
      }
    },
    {
      $group: {
        _id: null,
        total: { $sum: "$amount" }
      }
    }
  ]);

  return totalExpenses.length > 0 ? totalExpenses[0].total : 0;
};


export const checkExpenseBeforeInsert = asyncWrapper(async (userId, newExpenseAmount) => {
  const totalExpenses = await calculateTotalExpenses(userId);
  const user = await UserModel.findById(userId);
  console.log(user);
  const income = user.income;
  const updatedTotalExpenses = totalExpenses + newExpenseAmount;

  if (updatedTotalExpenses > income) {
    sendExpenseExceedsIncomeNotification(userId);
    return false; 
  } else {
    return true; 
  }
});


export const sendExpenseExceedsIncomeNotification = async(userId) => {
  const user = await UserModel.findById(userId);
  const message = `Dear, your total expenses have exceeded your income. Please review your spending.`;
sendEmail(user.email, "Expense Exceeds Income Alert", message);
};

export const calculateTotalBudget = (existingBudgets, newBudgets) => {
  const totalExistingBudget = existingBudgets.reduce((total, budget) => total + budget.limit, 0);
  const totalNewBudget = newBudgets.reduce((total, budget) => total + budget.limit, 0);
  return totalExistingBudget + totalNewBudget;
};


export const checkBudgetExceedsIncome = async (userId, budgets) => {
  try {
    // Find existing budgets for the user
    let existingBudgets = await BudgetModel.findOne({ user: userId });

    if (!existingBudgets) {
      // If no existing budgets found, set existingBudgets to an empty array
      existingBudgets = { budgets: [] };
    }

    console.log('Existing budgets:', existingBudgets);

    // Calculate total budget
    const totalBudget = calculateTotalBudget(existingBudgets.budgets, budgets);
    console.log('Total budget:', totalBudget);

    // Check if total budget exceeds user income
    const user = await UserModel.findById(userId);
    const income = user.income;
    console.log('User income:', income);

    if (totalBudget > income) {
      await sendBudgetExceedsIncomeNotification(userId);
      return true; 
    }
    return false;
  } catch (error) {
    console.error('Error checking budget exceeds income:', error);
    throw error;
  }
};




export const sendBudgetExceedsIncomeNotification = async(userId) => {
  const user = await UserModel.findById(userId);
  const message = `Dear ${user.name}, your total budget for the month has exceeded your income. Please review your budgeting.`;
sendEmail(user.email, "Budget Exceeds Income Alert", message);
};
