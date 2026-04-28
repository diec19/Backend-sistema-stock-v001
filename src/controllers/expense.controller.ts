import { Request, Response, NextFunction } from 'express';
import prisma from '../config/database.js';
import { CreateExpenseDTO } from '../types/expense.types.js';

export const createExpense = async (
  req: Request<{}, {}, CreateExpenseDTO>,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { amount, description, createdBy, paymentMethod = 'cash' } = req.body;

    if (!amount || !description || !createdBy) {
      res.status(400).json({ error: 'Monto, descripción y operador son requeridos' });
      return;
    }

    if (amount <= 0) {
      res.status(400).json({ error: 'El monto debe ser mayor a cero' });
      return;
    }

    const cashRegister = await prisma.cashRegister.findFirst({
      where: { status: 'open' }
    });

    if (!cashRegister) {
      res.status(400).json({ error: 'No hay caja abierta para registrar un egreso' });
      return;
    }

    const expense = await prisma.expense.create({
      data: {
        amount,
        description,
        createdBy,
        paymentMethod,
        cashRegisterId: cashRegister.id,
      }
    });

    res.status(201).json(expense);
  } catch (error) {
    next(error);
  }
};

export const getExpenses = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { cashRegisterId, page = '1', limit = '20' } = req.query;

    const pageNumber = parseInt(page as string);
    const limitNumber = parseInt(limit as string);
    const skip = (pageNumber - 1) * limitNumber;

    const where = cashRegisterId ? { cashRegisterId: cashRegisterId as string } : {};

    const [expenses, total] = await Promise.all([
      prisma.expense.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limitNumber,
      }),
      prisma.expense.count({ where }),
    ]);

    res.json({
      data: expenses,
      pagination: {
        page: pageNumber,
        limit: limitNumber,
        total,
        totalPages: Math.ceil(total / limitNumber),
      }
    });
  } catch (error) {
    next(error);
  }
};

export const deleteExpense = async (
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;

    const expense = await prisma.expense.findUnique({ where: { id } });

    if (!expense) {
      res.status(404).json({ error: 'Egreso no encontrado' });
      return;
    }

    await prisma.expense.delete({ where: { id } });

    res.json({ message: 'Egreso eliminado' });
  } catch (error) {
    next(error);
  }
};
