import { Request, Response, NextFunction } from 'express';
import prisma from '../config/database.js';
import { OpenCashRegisterDTO, CloseCashRegisterDTO } from '../types/cashRegister.types.js';

export const openCashRegister = async (
  req: Request<{}, {}, OpenCashRegisterDTO>,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { openingAmount, openedBy } = req.body;

    // Verificar si hay una caja abierta
    const openRegister = await prisma.cashRegister.findFirst({
      where: { status: 'open' }
    });

    if (openRegister) {
      res.status(400).json({ 
        error: 'Ya hay una caja abierta. Cierra la caja actual antes de abrir una nueva.' 
      });
      return;
    }

    const cashRegister = await prisma.cashRegister.create({
      data: {
        openingAmount,
        openedBy,
        status: 'open'
      }
    });

    res.status(201).json(cashRegister);
  } catch (error) {
    next(error);
  }
};

export const closeCashRegister = async (
  req: Request<{ id: string }, {}, CloseCashRegisterDTO>,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const { closingAmount, closedBy } = req.body;

    const cashRegister = await prisma.cashRegister.findUnique({
      where: { id }
    });

    if (!cashRegister) {
      res.status(404).json({ error: 'Caja no encontrada' });
      return;
    }

    if (cashRegister.status === 'closed') {
      res.status(400).json({ error: 'Esta caja ya está cerrada' });
      return;
    }

    const updated = await prisma.cashRegister.update({
      where: { id },
      data: {
        closingAmount,
        closedBy,
        status: 'closed',
        closedAt: new Date()
      }
    });

    res.json(updated);
  } catch (error) {
    next(error);
  }
};

export const getCurrentCashRegister = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const cashRegister = await prisma.cashRegister.findFirst({
      where: { status: 'open' },
      include: {
        sales: {
          include: {
            items: true
          }
        }
      }
    });

    if (!cashRegister) {
      res.status(404).json({ error: 'No hay caja abierta' });
      return;
    }

    // Calcular totales
    const totalSales = cashRegister.sales.length;
    const totalRevenue = cashRegister.sales.reduce((sum, sale) => {
      return sum + parseFloat(sale.total.toString());
    }, 0);

    const expectedAmount = parseFloat(cashRegister.openingAmount.toString()) + totalRevenue;

    res.json({
      ...cashRegister,
      stats: {
        totalSales,
        totalRevenue: parseFloat(totalRevenue.toFixed(2)),
        expectedAmount: parseFloat(expectedAmount.toFixed(2))
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getAllCashRegisters = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { page = '1', limit = '10' } = req.query;
    
    const pageNumber = parseInt(page as string);
    const limitNumber = parseInt(limit as string);
    const skip = (pageNumber - 1) * limitNumber;

    const [registers, total] = await Promise.all([
      prisma.cashRegister.findMany({
        include: {
          sales: true
        },
        orderBy: { openedAt: 'desc' },
        skip,
        take: limitNumber
      }),
      prisma.cashRegister.count()
    ]);

    res.json({
      data: registers,
      pagination: {
        page: pageNumber,
        limit: limitNumber,
        total,
        totalPages: Math.ceil(total / limitNumber)
      }
    });
  } catch (error) {
    next(error);
  }
};