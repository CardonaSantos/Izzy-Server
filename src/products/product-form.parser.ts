import { BadRequestException } from '@nestjs/common';
import { RolPrecio } from '@prisma/client';
import { PrecioProductoDto } from './dto/create-productNew.dto';

export const isDecimalStr = (value: string) => /^\d+(\.\d+)?$/.test(value);

export const cleanStr = (value: unknown) =>
  value === undefined || value === null ? '' : String(value).trim();

export const toNullableInt = (value: unknown) => {
  const clean = cleanStr(value);

  if (!clean || clean.toLowerCase() === 'null') return null;

  const numberValue = Number(clean);

  return Number.isFinite(numberValue) ? numberValue : null;
};

export const toIntOrThrow = (value: unknown, label: string) => {
  const numberValue = Number(value);

  if (!Number.isInteger(numberValue)) {
    throw new BadRequestException(`${label} debe ser entero`);
  }

  return numberValue;
};

export const toDecimalStringOrNull = (value: unknown, label: string) => {
  const clean = cleanStr(value);

  if (!clean || clean.toLowerCase() === 'null') return null;

  if (!isDecimalStr(clean)) {
    throw new BadRequestException(`${label} debe ser decimal positivo`);
  }

  return clean;
};

export const safeJsonParse = <T>(
  raw: unknown,
  fallback: T,
  label: string,
): T => {
  const clean = cleanStr(raw);

  if (!clean) return fallback;

  try {
    return JSON.parse(clean) as T;
  } catch {
    throw new BadRequestException(`${label} tiene un JSON inválido`);
  }
};

export const hasOwn = (body: Record<string, any>, key: string) =>
  Object.prototype.hasOwnProperty.call(body, key);

export const parseNumberArray = (raw: unknown, label: string): number[] => {
  const arr = safeJsonParse<any[]>(raw, [], label);

  if (!Array.isArray(arr)) {
    throw new BadRequestException(`${label} debe ser un arreglo`);
  }

  return arr.map((value, index) => toIntOrThrow(value, `${label}[${index}]`));
};

export const mapPrecioProductoArray = (
  arr: any[],
  label: string,
): PrecioProductoDto[] =>
  (Array.isArray(arr) ? arr : []).map((item, index) => {
    const path = `${label}[${index}]`;

    const rol = cleanStr(item?.rol) as RolPrecio;
    const orden = toIntOrThrow(item?.orden, `${path}.orden`);
    const precio = cleanStr(item?.precio);

    if (!isDecimalStr(precio)) {
      throw new BadRequestException(`${path}.precio debe ser decimal positivo`);
    }

    return {
      rol,
      orden,
      precio,
    };
  });
