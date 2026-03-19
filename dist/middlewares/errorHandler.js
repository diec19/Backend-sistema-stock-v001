import { Prisma } from '@prisma/client';
export const errorHandler = (err, req, res, next) => {
    console.error(err.stack);
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
    res.status(500).json({
        error: err.message || 'Error interno del servidor'
    });
};
export const notFound = (req, res) => {
    res.status(404).json({
        error: 'Ruta no encontrada'
    });
};
//# sourceMappingURL=errorHandler.js.map