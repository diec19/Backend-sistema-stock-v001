import { Request, Response, NextFunction } from 'express';
import * as XLSX from 'xlsx';
import prisma from '../config/database.js';

interface ExcelProduct {
  nombre: string;
  descripcion: string;
  sku: string;
  precio: number;
  precio_costo: number;
  categoria: string;
  stock: number;
  stock_minimo: number;
}

export const importProducts = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({ error: 'No se ha enviado ningún archivo' });
      return;
    }

    // Leer el archivo Excel
    const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    
    // Convertir a JSON
    const data: ExcelProduct[] = XLSX.utils.sheet_to_json(worksheet);

    if (data.length === 0) {
      res.status(400).json({ error: 'El archivo Excel está vacío' });
      return;
    }

    const results = {
      success: 0,
      errors: [] as { row: number; error: string; data: any }[]
    };

    // Procesar cada fila
    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      const rowNumber = i + 2; // +2 porque Excel empieza en 1 y tiene header

      try {
        // Validar datos requeridos
        if (!row.nombre || !row.sku) {
          results.errors.push({
            row: rowNumber,
            error: 'Faltan campos requeridos: nombre y sku',
            data: row
          });
          continue;
        }

        // Validar que precio y stock sean números
        const precio = parseFloat(row.precio?.toString() || '0');
        const precioCosto = parseFloat(row.precio_costo?.toString() || '0');
        const stock = parseInt(row.stock?.toString() || '0');
        const stockMinimo = parseInt(row.stock_minimo?.toString() || '0');

        if (isNaN(precio) || isNaN(stock) || isNaN(stockMinimo)) {
          results.errors.push({
            row: rowNumber,
            error: 'Precio, stock y stock_minimo deben ser números',
            data: row
          });
          continue;
        }

        // Intentar crear el producto
        await prisma.product.create({
          data: {
            name: row.nombre.trim(),
            description: row.descripcion?.trim() || '',
            sku: row.sku.trim(),
            price: precio,
            costPrice: isNaN(precioCosto) ? 0 : precioCosto,
            category: row.categoria?.trim() || '',
            stock: stock,
            minStock: stockMinimo
          }
        });

        results.success++;
      } catch (error: any) {
        // Error de SKU duplicado
        if (error.code === 'P2002') {
          results.errors.push({
            row: rowNumber,
            error: `SKU duplicado: ${row.sku}`,
            data: row
          });
        } else {
          results.errors.push({
            row: rowNumber,
            error: error.message,
            data: row
          });
        }
      }
    }

    res.json({
      message: 'Importación completada',
      results: {
        total: data.length,
        success: results.success,
        errors: results.errors.length,
        errorDetails: results.errors
      }
    });
  } catch (error) {
    next(error);
  }
};

export const downloadTemplate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Crear plantilla Excel de ejemplo
    const template = [
      {
        nombre: 'Laptop Dell XPS 15',
        descripcion: 'Laptop de alto rendimiento',
        sku: 'LAP-DELL-001',
        precio: 1299.99,
        precio_costo: 950.00,
        categoria: 'Electrónica',
        stock: 10,
        stock_minimo: 3
      },
      {
        nombre: 'Mouse Logitech MX',
        descripcion: 'Mouse inalámbrico',
        sku: 'MOU-LOG-001',
        precio: 79.99,
        precio_costo: 45.00,
        categoria: 'Electrónica',
        stock: 25,
        stock_minimo: 5
      }
    ];

    const worksheet = XLSX.utils.json_to_sheet(template);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Productos');

    // Configurar ancho de columnas
    worksheet['!cols'] = [
      { wch: 30 }, // nombre
      { wch: 40 }, // descripcion
      { wch: 15 }, // sku
      { wch: 12 }, // precio
      { wch: 14 }, // precio_costo
      { wch: 20 }, // categoria
      { wch: 10 }, // stock
      { wch: 15 }  // stock_minimo
    ];

    // Generar buffer
    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    res.setHeader('Content-Disposition', 'attachment; filename=plantilla_productos.xlsx');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.send(buffer);
  } catch (error) {
    next(error);
  }
};