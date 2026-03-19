import { Request, Response, NextFunction } from 'express';
import { CreateProductDTO, UpdateProductDTO } from '../types/product.types.js';
export declare const getAllProducts: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const getProductById: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const createProduct: (req: Request<{}, {}, CreateProductDTO>, res: Response, next: NextFunction) => Promise<void>;
export declare const updateProduct: (req: Request<{
    id: string;
}, {}, UpdateProductDTO>, res: Response, next: NextFunction) => Promise<void>;
export declare const deleteProduct: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const getLowStock: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const getStats: (req: Request, res: Response, next: NextFunction) => Promise<void>;
//# sourceMappingURL=products.controller.d.ts.map