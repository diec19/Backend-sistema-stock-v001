import { Request, Response, NextFunction } from 'express';
import { Prisma } from '@prisma/client';
import prisma from '../config/database.js';
import { CreateSaleDTO } from '../types/sale.types.js';

export const createSale = async (
  req: Request<{}, {}, CreateSaleDTO>,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { items } = req.body;

    if (!items || items.length === 0) {
      res.status(400).json({ error: 'La venta debe tener al menos un producto' });
      return;
    }

    // Usar transacción para garantizar integridad de datos
    const sale = await prisma.$transaction(async (tx) => {
      // Validar stock y calcular totales
      const saleItems = [];
      let total = 0;

      for (const item of items) {
        // Obtener producto y verificar stock
        const product = await tx.product.findUnique({
          where: { id: item.productId }
        });

        if (!product) {
          throw new Error(`Producto con ID ${item.productId} no encontrado`);
        }

        if (product.stock < item.quantity) {
          throw new Error(
            `Stock insuficiente para ${product.name}. Disponible: ${product.stock}, Solicitado: ${item.quantity}`
          );
        }

        const subtotal = parseFloat(item.unitPrice.toString()) * item.quantity;
        total += subtotal;

        saleItems.push({
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          subtotal
        });

        // Actualizar stock del producto
        await tx.product.update({
          where: { id: item.productId },
          data: {
            stock: {
              decrement: item.quantity
            }
          }
        });
      }

      // Crear la venta con sus items
      const newSale = await tx.sale.create({
        data: {
          total,
          items: {
            create: saleItems
          }
        },
        include: {
          items: {
            include: {
              product: true
            }
          }
        }
      });

      return newSale;
    });

    res.status(201).json(sale);
  } catch (error: any) {
    if (error.message.includes('Stock insuficiente') || error.message.includes('no encontrado')) {
      res.status(400).json({ error: error.message });
      return;
    }
    next(error);
  }
};

export const getAllSales = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { page = '1', limit = '10' } = req.query;
    
    const pageNumber = parseInt(page as string);
    const limitNumber = parseInt(limit as string);
    const skip = (pageNumber - 1) * limitNumber;

    const [sales, total] = await Promise.all([
      prisma.sale.findMany({
        include: {
          items: {
            include: {
              product: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limitNumber
      }),
      prisma.sale.count()
    ]);

    res.json({
      data: sales,
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

export const getSaleById = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;

    const sale = await prisma.sale.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            product: true
          }
        }
      }
    });

    if (!sale) {
      res.status(404).json({ error: 'Venta no encontrada' });
      return;
    }

    res.json(sale);
  } catch (error) {
    next(error);
  }
};

export const getSalesStats = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [totalSales, allSales, todaySales] = await Promise.all([
      prisma.sale.count(),
      prisma.sale.findMany({
        select: {
          total: true
        }
      }),
      prisma.sale.findMany({
        where: {
          createdAt: {
            gte: today
          }
        },
        select: {
          total: true
        }
      })
    ]);

    const totalRevenue = allSales.reduce((sum, sale) => {
      return sum + parseFloat(sale.total.toString());
    }, 0);

    const todayRevenue = todaySales.reduce((sum, sale) => {
      return sum + parseFloat(sale.total.toString());
    }, 0);

    res.json({
      totalSales,
      totalRevenue: parseFloat(totalRevenue.toFixed(2)),
      todaySales: todaySales.length,
      todayRevenue: parseFloat(todayRevenue.toFixed(2))
    });
  } catch (error) {
    next(error);
  }
};

export const deleteSale = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;

    // Usar transacción para devolver el stock
    await prisma.$transaction(async (tx) => {
      const sale = await tx.sale.findUnique({
        where: { id },
        include: {
          items: true
        }
      });

      if (!sale) {
        throw new Error('Venta no encontrada');
      }

      // Devolver stock a los productos
      for (const item of sale.items) {
        await tx.product.update({
          where: { id: item.productId },
          data: {
            stock: {
              increment: item.quantity
            }
          }
        });
      }

      // Eliminar la venta (los items se eliminan en cascada)
      await tx.sale.delete({
        where: { id }
      });
    });

    res.status(204).send();
  } catch (error: any) {
    if (error.message === 'Venta no encontrada') {
      res.status(404).json({ error: error.message });
      return;
    }
    next(error);
  }
};