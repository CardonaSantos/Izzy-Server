import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';

type BotSearchProductoDto = {
  producto?: string | null;
  categorias: string[];
  limit?: number | null;
};

type BotListarCatalogoDto = {
  consulta?: string | null;
  limit?: number | null;
  incluirEjemplos?: boolean | null;
};

@Injectable()
export class BotFunctionsService {
  private readonly logger = new Logger(BotFunctionsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async search(dto: BotSearchProductoDto) {
    try {
      this.logger.log(
        `DTO buscar_producto_en_pos:\n${JSON.stringify(dto, null, 2)}`,
      );

      const producto = this.cleanText(dto.producto ?? '');
      const categorias = Array.isArray(dto.categorias)
        ? dto.categorias.map((c) => this.cleanText(c)).filter(Boolean)
        : [];

      const limit = this.normalizeLimit(dto.limit, 30, 80);

      const rawTerms = this.unique([
        ...this.tokenize(producto),
        ...categorias,
        ...categorias.flatMap((c) => this.tokenize(c)),
      ]);

      const terms = this.expandGenericTerms(rawTerms);

      if (!terms.length) {
        return [];
      }

      const matchedCategorias = await this.prisma.categoria.findMany({
        where: {
          OR: terms.map((term) => ({
            nombre: {
              contains: term,
              mode: Prisma.QueryMode.insensitive,
            },
          })),
        },
        select: {
          id: true,
          nombre: true,
        },
        take: 80,
      });

      const matchedCategoriaIds = matchedCategorias.map((cat) => cat.id);

      const OR: Prisma.ProductoWhereInput[] = [
        ...terms.map((term) => ({
          nombre: {
            contains: term,
            mode: Prisma.QueryMode.insensitive,
          },
        })),
        ...terms.map((term) => ({
          descripcion: {
            contains: term,
            mode: Prisma.QueryMode.insensitive,
          },
        })),
        ...terms.map((term) => ({
          codigoProducto: {
            contains: term,
            mode: Prisma.QueryMode.insensitive,
          },
        })),
        ...terms.map((term) => ({
          categorias: {
            some: {
              nombre: {
                contains: term,
                mode: Prisma.QueryMode.insensitive,
              },
            },
          },
        })),
      ];

      if (matchedCategoriaIds.length) {
        OR.push({
          categorias: {
            some: {
              id: {
                in: matchedCategoriaIds,
              },
            },
          },
        });
      }

      const productos = await this.prisma.producto.findMany({
        where: {
          activo: true,
          eliminado: false,
          OR,
        },
        select: {
          id: true,
          nombre: true,
          descripcion: true,
          codigoProducto: true,
          categorias: {
            select: {
              nombre: true,
            },
          },
          precios: {
            take: 1,
            orderBy: {
              orden: 'desc',
            },
            select: {
              precio: true,
            },
          },
          stock: {
            select: {
              cantidad: true,
              sucursal: {
                select: {
                  nombre: true,
                },
              },
            },
          },
        },
        take: Math.max(limit * 4, 80),
      });

      return productos
        .map((prod) => {
          const cantidadDisponible = prod.stock.reduce(
            (acc, stock) => {
              const sucursal = stock.sucursal.nombre;
              acc[sucursal] = (acc[sucursal] ?? 0) + stock.cantidad;
              return acc;
            },
            {} as Record<string, number>,
          );

          const totalDisponible = Object.values(cantidadDisponible).reduce(
            (acc, cantidad) => acc + cantidad,
            0,
          );

          const categoriasProducto = prod.categorias.map((cat) => cat.nombre);

          const score = this.scoreProduct({
            nombre: prod.nombre,
            descripcion: prod.descripcion ?? '',
            codigoProducto: prod.codigoProducto,
            categorias: categoriasProducto,
            terms,
            totalDisponible,
          });

          return {
            id: prod.id,
            nombre: prod.nombre,
            precio: Number(prod.precios?.[0]?.precio ?? 0),
            cantidadDisponible,
            totalDisponible,
            categorias: categoriasProducto,
            score,
          };
        })
        .filter((prod) => prod.totalDisponible > 0)
        .sort((a, b) => {
          if (b.score !== a.score) return b.score - a.score;
          return b.totalDisponible - a.totalDisponible;
        })
        .slice(0, limit);
    } catch (error) {
      this.logger.error('Error en buscar_producto_en_pos', error);
      throw error;
    }
  }

  async listarCatalogo(dto: BotListarCatalogoDto) {
    try {
      this.logger.log(
        `DTO listar_catalogo_pos:\n${JSON.stringify(dto, null, 2)}`,
      );

      const consulta = this.cleanText(dto.consulta ?? '');
      const terms = this.expandGenericTerms(this.tokenize(consulta));
      const limit = this.normalizeLimit(dto.limit, 20, 60);
      const incluirEjemplos = dto.incluirEjemplos ?? true;

      const productosDisponiblesWhere: Prisma.ProductoWhereInput = {
        activo: true,
        eliminado: false,
        stock: {
          some: {
            cantidad: {
              gt: 0,
            },
          },
        },
      };

      const where: Prisma.CategoriaWhereInput = {
        productos: {
          some: productosDisponiblesWhere,
        },
      };

      if (terms.length) {
        where.OR = [
          ...terms.map((term) => ({
            nombre: {
              contains: term,
              mode: Prisma.QueryMode.insensitive,
            },
          })),
          ...terms.map((term) => ({
            productos: {
              some: {
                ...productosDisponiblesWhere,
                OR: [
                  {
                    nombre: {
                      contains: term,
                      mode: Prisma.QueryMode.insensitive,
                    },
                  },
                  {
                    descripcion: {
                      contains: term,
                      mode: Prisma.QueryMode.insensitive,
                    },
                  },
                  {
                    codigoProducto: {
                      contains: term,
                      mode: Prisma.QueryMode.insensitive,
                    },
                  },
                ],
              },
            },
          })),
        ];
      }

      const select = {
        id: true,
        nombre: true,
        _count: {
          select: {
            productos: {
              where: productosDisponiblesWhere,
            },
          },
        },
        ...(incluirEjemplos
          ? {
              productos: {
                where: productosDisponiblesWhere,
                select: {
                  id: true,
                  nombre: true,
                  precios: {
                    take: 1,
                    orderBy: {
                      orden: 'desc' as const,
                    },
                    select: {
                      precio: true,
                    },
                  },
                  stock: {
                    select: {
                      cantidad: true,
                      sucursal: {
                        select: {
                          nombre: true,
                        },
                      },
                    },
                  },
                },
                take: 5,
              },
            }
          : {}),
      } satisfies Prisma.CategoriaSelect;

      if (incluirEjemplos) {
        select.productos = {
          where: productosDisponiblesWhere,
          select: {
            id: true,
            nombre: true,
            precios: {
              take: 1,
              orderBy: {
                orden: 'desc',
              },
              select: {
                precio: true,
              },
            },
            stock: {
              select: {
                cantidad: true,
                sucursal: {
                  select: {
                    nombre: true,
                  },
                },
              },
            },
          },
          take: 5,
        };
      }

      const categorias = await this.prisma.categoria.findMany({
        where,
        select,
        orderBy: {
          nombre: 'asc',
        },
        take: limit,
      });

      return categorias
        .map((cat) => ({
          id: cat.id,
          nombre: cat.nombre,
          totalProductosDisponibles: cat._count.productos,
          ejemplos:
            'productos' in cat && Array.isArray(cat.productos)
              ? cat.productos.map((prod) => {
                  const cantidadDisponible = prod.stock.reduce<
                    Record<string, number>
                  >((acc, stock) => {
                    const sucursal = stock.sucursal.nombre;
                    acc[sucursal] = (acc[sucursal] ?? 0) + stock.cantidad;
                    return acc;
                  }, {});

                  const totalDisponible = Object.values(
                    cantidadDisponible,
                  ).reduce<number>((acc, cantidad) => acc + cantidad, 0);

                  return {
                    id: prod.id,
                    nombre: prod.nombre,
                    precio: Number(prod.precios?.[0]?.precio ?? 0),
                    cantidadDisponible,
                    totalDisponible,
                  };
                })
              : [],
        }))
        .filter((cat) => cat.totalProductosDisponibles > 0);
    } catch (error) {
      this.logger.error('Error en listar_catalogo_pos', error);
      throw error;
    }
  }
  // COMENTASRIO PARA PUSH
  private cleanText(value: string): string {
    return value
      .toLowerCase()
      .normalize('NFD')
      .replace(/\p{Diacritic}/gu, '')
      .trim();
  }

  private tokenize(value: string): string[] {
    return this.cleanText(value)
      .split(/[\s,.;:/\\|()[\]{}"'¿?¡!_-]+/g)
      .map((v) => v.trim())
      .filter((v) => v.length >= 2);
  }

  private unique(values: string[]): string[] {
    return [...new Set(values.filter(Boolean))];
  }

  private normalizeLimit(
    limit: number | null | undefined,
    fallback: number,
    max: number,
  ): number {
    if (!limit || Number.isNaN(limit)) return fallback;
    return Math.min(Math.max(Math.trunc(limit), 1), max);
  }

  private expandGenericTerms(terms: string[]): string[] {
    const synonyms: Record<string, string[]> = {
      telefono: [
        'telefono',
        'telefonos',
        'celular',
        'celulares',
        'smartphone',
        'movil',
      ],
      telefonos: [
        'telefono',
        'telefonos',
        'celular',
        'celulares',
        'smartphone',
        'movil',
      ],
      celular: [
        'telefono',
        'telefonos',
        'celular',
        'celulares',
        'smartphone',
        'movil',
      ],
      celulares: [
        'telefono',
        'telefonos',
        'celular',
        'celulares',
        'smartphone',
        'movil',
      ],
      movil: [
        'telefono',
        'telefonos',
        'celular',
        'celulares',
        'smartphone',
        'movil',
      ],

      computadora: ['computadora', 'computadoras', 'laptop', 'laptops', 'pc'],
      computadoras: ['computadora', 'computadoras', 'laptop', 'laptops', 'pc'],
      laptop: ['computadora', 'computadoras', 'laptop', 'laptops', 'pc'],
      laptops: ['computadora', 'computadoras', 'laptop', 'laptops', 'pc'],

      protector: ['protector', 'protectores', 'case', 'funda', 'estuche'],
      protectores: ['protector', 'protectores', 'case', 'funda', 'estuche'],

      cargador: ['cargador', 'cargadores', 'cable', 'adaptador'],
      cargadores: ['cargador', 'cargadores', 'cable', 'adaptador'],
    };

    const expanded = terms.flatMap((term) => {
      const clean = this.cleanText(term);
      const singular = clean.endsWith('s') ? clean.slice(0, -1) : clean;
      const plural = clean.endsWith('s') ? clean : `${clean}s`;

      return [clean, singular, plural, ...(synonyms[clean] ?? [])];
    });

    return this.unique(expanded).slice(0, 60);
  }

  private scoreProduct(params: {
    nombre: string;
    descripcion: string;
    codigoProducto: string;
    categorias: string[];
    terms: string[];
    totalDisponible: number;
  }): number {
    const nombre = this.cleanText(params.nombre);
    const descripcion = this.cleanText(params.descripcion);
    const codigoProducto = this.cleanText(params.codigoProducto);
    const categorias = params.categorias.map((cat) => this.cleanText(cat));

    let score = 0;

    for (const term of params.terms) {
      const cleanTerm = this.cleanText(term);
      if (!cleanTerm) continue;

      if (nombre === cleanTerm) score += 100;
      if (nombre.startsWith(cleanTerm)) score += 60;
      if (nombre.includes(cleanTerm)) score += 35;

      if (codigoProducto.includes(cleanTerm)) score += 45;
      if (descripcion.includes(cleanTerm)) score += 15;

      if (categorias.some((cat) => cat === cleanTerm)) score += 50;
      if (categorias.some((cat) => cat.includes(cleanTerm))) score += 30;
    }

    if (params.totalDisponible > 0) score += 20;
    if (params.totalDisponible >= 3) score += 5;
    if (params.totalDisponible >= 10) score += 10;

    return score;
  }
}
