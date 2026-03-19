import { Request, Response, NextFunction } from 'express';
import { Prisma } from '@prisma/client';
import prisma from '../config/database.js';
import { CreateProductDTO, UpdateProductDTO } from '../types/product.types.js';

export const getAllProducts = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { search, page = '1', limit = '10' } = req.query;
    
    const pageNumber = parseInt(page as string);
    const limitNumber = parseInt(limit as string);
    const skip = (pageNumber - 1) * limitNumber;

    const where: Prisma.ProductWhereInput = search ? {
      OR: [
        { name: { contains: search as string, mode: Prisma.QueryMode.insensitive } },
        { sku: { contains: search as string, mode: Prisma.QueryMode.insensitive } }
      ]
    } : {};

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limitNumber
      }),
      prisma.product.count({ where })
    ]);

    res.json({
      data: products,
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

export const getProductById = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    
    const product = await prisma.product.findUnique({
      where: { id }
    });

    if (!product) {
      res.status(404).json({ error: 'Producto no encontrado' });
      return;
    }

    res.json(product);
  } catch (error) {
    next(error);
  }
};

export const createProduct = async (
  req: Request<{}, {}, CreateProductDTO>,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { name, description, sku, price, stock, minStock } = req.body;

    // Validaciones
    if (!name || !sku || price === undefined || stock === undefined || minStock === undefined) {
      res.status(400).json({ 
        error: 'Faltan campos requeridos: name, sku, price, stock, minStock' 
      });
      return;
    }

    const product = await prisma.product.create({
      data: {
        name,
        description: description || '',
        sku,
        price,
        stock: parseInt(stock.toString()),
        minStock: parseInt(minStock.toString())
      }
    });

    res.status(201).json(product);
  } catch (error) {
    next(error);
  }
};

export const updateProduct = async (
  req: Request<{ id: string }, {}, UpdateProductDTO>,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const { name, description, sku, price, stock, minStock } = req.body;

    const product = await prisma.product.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(sku && { sku }),
        ...(price !== undefined && { price }),
        ...(stock !== undefined && { stock: parseInt(stock.toString()) }),
        ...(minStock !== undefined && { minStock: parseInt(minStock.toString()) })
      }
    });

    res.json(product);
  } catch (error) {
    next(error);
  }
};

export const deleteProduct = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;

    await prisma.product.delete({
      where: { id }
    });

    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

export const getLowStock = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Obtenemos todos los productos
    const allProducts = await prisma.product.findMany();
    
    // Filtramos en memoria los que tienen stock bajo
    const lowStockProducts = allProducts.filter((p:any) => p.stock <= p.minStock);

    res.json(lowStockProducts);
  } catch (error) {
    next(error);
  }
};

export const getStats = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const [totalProducts, products] = await Promise.all([
      prisma.product.count(),
      prisma.product.findMany({
        select: {
          price: true,
          stock: true,
          minStock: true
        }
      })
    ]);

    const lowStockCount = products.filter((p:any) => p.stock <= p.minStock).length;
    
    const totalValue = products.reduce((sum:any, p:any) => {
      return sum + (parseFloat(p.price.toString()) * p.stock);
    }, 0);

    res.json({
      totalProducts,
      lowStockCount,
      totalValue: parseFloat(totalValue.toFixed(2))
    });
  } catch (error) {
    next(error);
  }
};