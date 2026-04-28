import { Request, Response, NextFunction } from 'express';
import prisma from '../config/database.js';

const sinceDate = (days: number): Date | undefined => {
  if (!days) return undefined;
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  if (days > 1) d.setDate(d.getDate() - days);
  // days=1 → desde medianoche de hoy (solo hoy)
  return d;
};

export const getReportSummary = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const days = parseInt((req.query.days as string) || '0');
    const since = sinceDate(days);
    const saleWhere   = since ? { createdAt: { gte: since } } : {};
    const expWhere    = since ? { createdAt: { gte: since } } : {};

    const [salesCount, salesAgg, expAgg] = await Promise.all([
      prisma.sale.count({ where: saleWhere }),
      prisma.sale.aggregate({ _sum: { total: true }, where: saleWhere }),
      prisma.expense.aggregate({ _sum: { amount: true }, where: expWhere }),
    ]);

    const totalRevenue  = parseFloat((salesAgg._sum.total  ?? 0).toString());
    const totalExpenses = parseFloat((expAgg._sum.amount   ?? 0).toString());

    res.json({
      totalSales:    salesCount,
      totalRevenue,
      totalExpenses,
      netBalance: parseFloat((totalRevenue - totalExpenses).toFixed(2)),
    });
  } catch (error) { next(error); }
};

export const getTopProducts = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const days  = parseInt((req.query.days  as string) || '0');
    const limit = parseInt((req.query.limit as string) || '10');
    const since = sinceDate(days);

    const itemWhere = since ? { sale: { createdAt: { gte: since } } } : {};

    const grouped = await prisma.saleItem.groupBy({
      by: ['productId'],
      _sum: { quantity: true, subtotal: true },
      orderBy: { _sum: { quantity: 'desc' } },
      take: limit,
      where: itemWhere,
    });

    const products = await prisma.product.findMany({
      where: { id: { in: grouped.map(g => g.productId) } },
      select: { id: true, name: true, sku: true },
    });
    const productMap = new Map(products.map(p => [p.id, p]));

    res.json(grouped.map(g => ({
      productId:     g.productId,
      productName:   productMap.get(g.productId)?.name ?? 'Producto eliminado',
      sku:           productMap.get(g.productId)?.sku  ?? '-',
      totalQuantity: g._sum.quantity ?? 0,
      totalRevenue:  parseFloat((g._sum.subtotal ?? 0).toString()),
    })));
  } catch (error) { next(error); }
};

export const getSalesByDay = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const days  = parseInt((req.query.days as string) || '30');
    const cap   = Math.min(days || 30, 60);
    const since = sinceDate(cap);

    const sales = await prisma.sale.findMany({
      where:   since ? { createdAt: { gte: since } } : {},
      select:  { total: true, createdAt: true },
      orderBy: { createdAt: 'asc' },
    });

    const byDay: Record<string, { date: string; total: number; count: number }> = {};
    sales.forEach(s => {
      const date = s.createdAt.toISOString().split('T')[0];
      if (!byDay[date]) byDay[date] = { date, total: 0, count: 0 };
      byDay[date].total = parseFloat((byDay[date].total + parseFloat(s.total.toString())).toFixed(2));
      byDay[date].count += 1;
    });

    const result = [];
    for (let i = cap - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      result.push(byDay[dateStr] ?? { date: dateStr, total: 0, count: 0 });
    }

    res.json(result);
  } catch (error) { next(error); }
};

export const getCashRegisterReport = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const registers = await prisma.cashRegister.findMany({
      include: {
        sales:    { select: { total: true } },
        expenses: { select: { amount: true } },
      },
      orderBy: { openedAt: 'desc' },
      take: 20,
    });

    res.json(registers.map(r => {
      const totalRevenue  = r.sales.reduce((s, sale) => s + parseFloat(sale.total.toString()), 0);
      const totalExpenses = r.expenses.reduce((s, exp)  => s + parseFloat(exp.amount.toString()), 0);
      const opening       = parseFloat(r.openingAmount.toString());
      return {
        id:             r.id,
        status:         r.status,
        openedBy:       r.openedBy,
        closedBy:       r.closedBy,
        openedAt:       r.openedAt,
        closedAt:       r.closedAt,
        openingAmount:  opening,
        closingAmount:  r.closingAmount ? parseFloat(r.closingAmount.toString()) : null,
        totalSales:     r.sales.length,
        totalRevenue:   parseFloat(totalRevenue.toFixed(2)),
        totalExpenses:  parseFloat(totalExpenses.toFixed(2)),
        expectedAmount: parseFloat((opening + totalRevenue - totalExpenses).toFixed(2)),
      };
    }));
  } catch (error) { next(error); }
};

export const getSalesByHour = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const sales = await prisma.sale.findMany({
      where:   { createdAt: { gte: today } },
      select:  { total: true, createdAt: true },
      orderBy: { createdAt: 'asc' },
    });

    const byHour = Array.from({ length: 24 }, (_, h) => ({
      hour:  h,
      label: `${h.toString().padStart(2, '0')}:00`,
      total: 0,
      count: 0,
    }));

    sales.forEach(s => {
      const h = new Date(s.createdAt).getHours();
      byHour[h].total = parseFloat((byHour[h].total + parseFloat(s.total.toString())).toFixed(2));
      byHour[h].count += 1;
    });

    res.json(byHour);
  } catch (error) { next(error); }
};

export const getExpenseReport = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const days    = parseInt((req.query.days  as string) || '0');
    const page    = parseInt((req.query.page  as string) || '1');
    const limit   = parseInt((req.query.limit as string) || '20');
    const since   = sinceDate(days);
    const where   = since ? { createdAt: { gte: since } } : {};

    const [expenses, total] = await Promise.all([
      prisma.expense.findMany({
        where,
        include: { cashRegister: { select: { openedBy: true, openedAt: true } } },
        orderBy: { createdAt: 'desc' },
        skip:    (page - 1) * limit,
        take:    limit,
      }),
      prisma.expense.count({ where }),
    ]);

    res.json({
      data: expenses.map(e => ({ ...e, amount: parseFloat(e.amount.toString()) })),
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) { next(error); }
};
