import { Request, Response, NextFunction } from 'express';
import { Prisma } from '@prisma/client';

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  console.error(err.stack);

  // Prisma errors
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') {
      res.status(409).json({
        error: 'Ya existe un producto con ese SKU'
      });
      return;
    }

    if (err.code === 'P2025') {
      res.status(404).json({
        error: 'Producto no encontrado'
      });
      return;
    }
  }

  // Default error
  res.status(500).json({
    error: err.message || 'Error interno del servidor'
  });
};

export const notFound = (req: Request, res: Response): void => {
  res.status(404).json({
    error: 'Ruta no encontrada'
  });
};