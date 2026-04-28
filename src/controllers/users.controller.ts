import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import prisma from '../config/database.js';

export const getUsers = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const users = await prisma.user.findMany({
      select: { id: true, username: true, name: true, role: true, createdAt: true },
      orderBy: { createdAt: 'asc' },
    });
    res.json(users);
  } catch (error) {
    next(error);
  }
};

export const createUser = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { username, password, name, role } = req.body;

    if (!username?.trim() || !password || !name?.trim()) {
      res.status(400).json({ error: 'Nombre, usuario y contraseña son requeridos' });
      return;
    }
    if (!['admin', 'cashier'].includes(role)) {
      res.status(400).json({ error: 'Rol inválido. Use "admin" o "cashier"' });
      return;
    }
    if (password.length < 4) {
      res.status(400).json({ error: 'La contraseña debe tener al menos 4 caracteres' });
      return;
    }

    const existing = await prisma.user.findUnique({ where: { username } });
    if (existing) {
      res.status(409).json({ error: 'El nombre de usuario ya está en uso' });
      return;
    }

    const hashed = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { username: username.trim(), password: hashed, name: name.trim(), role },
      select: { id: true, username: true, name: true, role: true, createdAt: true },
    });

    res.status(201).json(user);
  } catch (error) {
    next(error);
  }
};

export const updateUser = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const { name, role } = req.body;

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      res.status(404).json({ error: 'Usuario no encontrado' });
      return;
    }

    // Prevent demoting yourself
    if (id === req.user?.userId && role && role !== 'admin') {
      res.status(400).json({ error: 'No podés cambiar tu propio rol' });
      return;
    }
    if (role && !['admin', 'cashier'].includes(role)) {
      res.status(400).json({ error: 'Rol inválido' });
      return;
    }

    const updated = await prisma.user.update({
      where: { id },
      data: {
        ...(name?.trim() && { name: name.trim() }),
        ...(role && { role }),
      },
      select: { id: true, username: true, name: true, role: true, createdAt: true },
    });

    res.json(updated);
  } catch (error) {
    next(error);
  }
};

export const resetPassword = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const { password } = req.body;

    if (!password || password.length < 4) {
      res.status(400).json({ error: 'La contraseña debe tener al menos 4 caracteres' });
      return;
    }

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      res.status(404).json({ error: 'Usuario no encontrado' });
      return;
    }

    const hashed = await bcrypt.hash(password, 10);
    await prisma.user.update({ where: { id }, data: { password: hashed } });

    res.json({ message: 'Contraseña actualizada' });
  } catch (error) {
    next(error);
  }
};

export const deleteUser = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;

    if (id === req.user?.userId) {
      res.status(400).json({ error: 'No podés eliminar tu propia cuenta' });
      return;
    }

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      res.status(404).json({ error: 'Usuario no encontrado' });
      return;
    }

    await prisma.user.delete({ where: { id } });
    res.json({ message: 'Usuario eliminado' });
  } catch (error) {
    next(error);
  }
};
