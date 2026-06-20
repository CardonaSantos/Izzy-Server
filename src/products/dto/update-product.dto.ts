import { RolPrecio } from '@prisma/client';

export interface PrecioProductoDto {
  rol: RolPrecio;
  orden: number;
  precio: string;
}

export interface UpdateProductDto {
  nombre: string;
  descripcion: string | null;
  codigoProducto: string;
  codigoProveedor: string | null;
  stockMinimo: number | null;
  precioCostoActual: string | null;
  creadoPorId: number;
  categorias: number[];
  tipoPresentacionId: number | null;
  precioVenta: PrecioProductoDto[];
  keepProductImageIds?: number[];
}
