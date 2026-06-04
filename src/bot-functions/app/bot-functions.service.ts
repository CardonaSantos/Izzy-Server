import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { BotListarCatalogoDto } from '../dto/listar-producto-pos';

type BotSearchProductoDto = {
  producto?: string | null;
  categorias: string[];
  limit?: number | null;
};

@Injectable()
export class BotFunctionsService {
  private readonly logger = new Logger(BotFunctionsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async search(dto: BotSearchProductoDto) {
    const traceId = `POS_SEARCH_${Date.now()}_${Math.random()
      .toString(36)
      .slice(2, 8)}`;

    try {
      this.logger.log(
        `[${traceId}] DTO buscar_producto_en_pos RAW:\n${JSON.stringify(
          dto,
          null,
          2,
        )}`,
      );

      const producto = this.cleanText(dto.producto ?? '');

      const categorias = Array.isArray(dto.categorias)
        ? dto.categorias.map((c) => this.cleanText(c)).filter(Boolean)
        : [];

      /**
       * Subimos el límite un poco porque el bot puede necesitar ver más opciones:
       * - iPhone
       * - cables iPhone
       * - cubos iPhone
       * - vidrios iPhone
       * - accesorios Apple/iPhone
       *
       * Ojo: no lo subas demasiado o puedes saturar tokens.
       */
      const limit = this.normalizeLimit(dto.limit, 50, 120);

      /**
       * VANILLA:
       * No usamos expandGenericTerms().
       *
       * Mantenemos:
       * - frase completa: "iphone 13", "celular iphone", "samsung a06"
       * - tokens: "iphone", "13", "samsung", "a06"
       * - categorías tal como las mandó el bot
       */
      const phraseTerms = this.unique([producto, ...categorias]).filter(
        Boolean,
      );

      const tokenTerms = this.unique([
        ...this.tokenize(producto),
        ...categorias.flatMap((c) => this.tokenize(c)),
      ]);

      const terms = this.unique([...phraseTerms, ...tokenTerms]).slice(0, 80);

      this.logger.log(
        `[${traceId}] QUERY NORMALIZADA:\n${JSON.stringify(
          {
            productoOriginal: dto.producto ?? null,
            productoClean: producto,
            categoriasOriginales: dto.categorias ?? [],
            categoriasClean: categorias,
            phraseTerms,
            tokenTerms,
            termsFinales: terms,
            limit,
          },
          null,
          2,
        )}`,
      );

      if (!terms.length) {
        this.logger.warn(
          `[${traceId}] Sin términos de búsqueda. Retornando [].`,
        );
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
        take: 120,
      });

      const matchedCategoriaIds = matchedCategorias.map((cat) => cat.id);

      this.logger.log(
        `[${traceId}] CATEGORIAS MATCH:\n${JSON.stringify(
          matchedCategorias.map((cat) => ({
            id: cat.id,
            nombre: cat.nombre,
          })),
          null,
          2,
        )}`,
      );

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

      /**
       * IMPORTANTE:
       * No filtramos por stock.
       * Solo pedimos producto activo y no eliminado.
       *
       * Esto permite que el bot vea productos sin existencia,
       * pero que igual puede ofrecer para pedido/apartado.
       */
      const where: Prisma.ProductoWhereInput = {
        activo: true,
        eliminado: false,
        OR,
      };

      const fetchLimit = Math.min(Math.max(limit * 6, 300), 700);

      this.logger.log(
        `[${traceId}] WHERE RESUMEN:\n${JSON.stringify(
          {
            activo: true,
            eliminado: false,
            totalTerms: terms.length,
            totalCondicionesOR: OR.length,
            matchedCategoriaIds,
            fetchLimit,
          },
          null,
          2,
        )}`,
      );

      const productos = await this.prisma.producto.findMany({
        where,
        select: {
          id: true,
          nombre: true,
          descripcion: true,
          codigoProducto: true,
          activo: true,
          eliminado: true,
          categorias: {
            select: {
              nombre: true,
            },
          },
          precios: {
            take: 1,
            where: {
              orden: 1,
            },
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
        orderBy: {
          nombre: 'asc',
        },
        take: fetchLimit,
      });

      this.logger.log(
        `[${traceId}] PRODUCTOS RAW ENCONTRADOS EN DB: ${productos.length}`,
      );

      this.logger.log(
        `[${traceId}] PRODUCTOS RAW PREVIEW:\n${JSON.stringify(
          productos.slice(0, 120).map((p) => ({
            id: p.id,
            nombre: p.nombre,
            codigoProducto: p.codigoProducto,
            precio: Number(p.precios?.[0]?.precio ?? 0),
            categorias: p.categorias.map((cat) => cat.nombre),
            stockTotalRaw: p.stock.reduce((acc, s) => acc + s.cantidad, 0),
            stockPorSucursal: p.stock.map((s) => ({
              sucursal: s.sucursal.nombre,
              cantidad: s.cantidad,
            })),
          })),
          null,
          2,
        )}`,
      );

      const resultados = productos
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
            codigoProducto: prod.codigoProducto,
            precio: Number(prod.precios?.[0]?.precio ?? 0),
            cantidadDisponible,
            totalDisponible,
            inventarioEstado:
              totalDisponible > 0 ? 'CON_STOCK' : 'SIN_STOCK_PARA_PEDIDO',
            categorias: categoriasProducto,
            score,
          };
        })
        /**
         * Ya NO filtramos por stock.
         * Antes tenías:
         * .filter((prod) => prod.totalDisponible > 0)
         *
         * Eso era parte del problema.
         */
        .sort((a, b) => {
          if (b.score !== a.score) return b.score - a.score;
          return b.totalDisponible - a.totalDisponible;
        })
        .slice(0, limit);

      this.logger.log(
        `[${traceId}] PRODUCTOS FINALES ENVIADOS AL BOT: ${resultados.length}`,
      );

      this.logger.log(
        `[${traceId}] PRODUCTOS FINALES PREVIEW:\n${JSON.stringify(
          resultados.map((p) => ({
            id: p.id,
            nombre: p.nombre,
            codigoProducto: p.codigoProducto,
            precio: p.precio,
            totalDisponible: p.totalDisponible,
            inventarioEstado: p.inventarioEstado,
            categorias: p.categorias,
            score: p.score,
          })),
          null,
          2,
        )}`,
      );

      return resultados;
    } catch (error) {
      this.logger.error(`[${traceId}] Error en buscar_producto_en_pos`, error);
      throw error;
    }
  }

  async listarCatalogo(dto: BotListarCatalogoDto) {
    const traceId = `POS_CATALOGO_${Date.now()}_${Math.random()
      .toString(36)
      .slice(2, 8)}`;

    try {
      this.logger.log(
        `[${traceId}] DTO listar_catalogo_pos RAW:\n${JSON.stringify(
          dto,
          null,
          2,
        )}`,
      );

      const consulta = this.cleanText(dto.consulta ?? '');
      const limit = this.normalizeLimit(dto.limit, 20, 80);
      const incluirEjemplos = dto.incluirEjemplos ?? true;

      /**
       * VANILLA:
       * No usamos expandGenericTerms().
       * Para catálogo/listado dejamos solo lo que el bot mandó:
       * - frase completa
       * - tokens reales
       */
      const phraseTerms = this.unique([consulta]).filter(Boolean);

      const tokenTerms = this.unique(this.tokenize(consulta));

      const terms = this.unique([...phraseTerms, ...tokenTerms]).slice(0, 60);

      this.logger.log(
        `[${traceId}] QUERY NORMALIZADA:\n${JSON.stringify(
          {
            consultaOriginal: dto.consulta ?? null,
            consultaClean: consulta,
            phraseTerms,
            tokenTerms,
            termsFinales: terms,
            limit,
            incluirEjemplos,
          },
          null,
          2,
        )}`,
      );

      const productoBaseWhere: Prisma.ProductoWhereInput = {
        activo: true,
        eliminado: false,
      };

      const productoSearchWhere: Prisma.ProductoWhereInput = {
        ...productoBaseWhere,
      };

      if (terms.length) {
        productoSearchWhere.OR = [
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
      }

      /**
       * Si hay consulta, primero buscamos productos relacionados.
       * Esto permite que una búsqueda como "iphone" encuentre:
       * - celulares iPhone
       * - cables iPhone
       * - cubos iPhone
       * - vidrios iPhone
       * - accesorios relacionados
       *
       * No importa si tienen stock o no.
       */
      const productosLimit = Math.min(Math.max(limit * 10, 200), 600);

      const productos = await this.prisma.producto.findMany({
        where: productoSearchWhere,
        select: {
          id: true,
          nombre: true,
          descripcion: true,
          codigoProducto: true,
          activo: true,
          eliminado: true,
          categorias: {
            select: {
              id: true,
              nombre: true,
            },
          },
          precios: {
            take: 1,
            where: {
              orden: 1,
            },
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
        orderBy: {
          nombre: 'asc',
        },
        take: productosLimit,
      });

      this.logger.log(
        `[${traceId}] PRODUCTOS RAW PARA CATALOGO: ${productos.length}`,
      );

      this.logger.log(
        `[${traceId}] PRODUCTOS RAW PREVIEW:\n${JSON.stringify(
          productos.slice(0, 120).map((p) => ({
            id: p.id,
            nombre: p.nombre,
            codigoProducto: p.codigoProducto,
            categorias: p.categorias.map((cat) => cat.nombre),
            precio: Number(p.precios?.[0]?.precio ?? 0),
            totalDisponible: p.stock.reduce((acc, s) => acc + s.cantidad, 0),
          })),
          null,
          2,
        )}`,
      );

      const productosFormateados = productos.map((prod) => {
        const cantidadDisponible = prod.stock.reduce<Record<string, number>>(
          (acc, stock) => {
            const sucursal = stock.sucursal.nombre;
            acc[sucursal] = (acc[sucursal] ?? 0) + stock.cantidad;
            return acc;
          },
          {},
        );

        const totalDisponible = Object.values(cantidadDisponible).reduce(
          (acc, cantidad) => acc + cantidad,
          0,
        );

        const categorias = prod.categorias.map((cat) => ({
          id: cat.id,
          nombre: cat.nombre,
        }));

        const score = this.scoreProduct({
          nombre: prod.nombre,
          descripcion: prod.descripcion ?? '',
          codigoProducto: prod.codigoProducto,
          categorias: categorias.map((cat) => cat.nombre),
          terms,
          totalDisponible,
        });

        return {
          id: prod.id,
          nombre: prod.nombre,
          codigoProducto: prod.codigoProducto,
          precio: Number(prod.precios?.[0]?.precio ?? 0),
          totalDisponible,
          cantidadDisponible,
          inventarioEstado:
            totalDisponible > 0 ? 'CON_STOCK' : 'SIN_STOCK_PARA_PEDIDO',
          categorias,
          score,
        };
      });

      /**
       * Agrupamos por categoría
       */
      const categoriasMap = new Map<
        number,
        {
          id: number;
          nombre: string;
          productos: typeof productosFormateados;
        }
      >();

      for (const producto of productosFormateados) {
        if (!producto.categorias.length) {
          const uncategorizedId = 0;

          if (!categoriasMap.has(uncategorizedId)) {
            categoriasMap.set(uncategorizedId, {
              id: uncategorizedId,
              nombre: 'Sin categoría',
              productos: [],
            });
          }

          categoriasMap.get(uncategorizedId)!.productos.push(producto);
          continue;
        }

        for (const categoria of producto.categorias) {
          if (!categoriasMap.has(categoria.id)) {
            categoriasMap.set(categoria.id, {
              id: categoria.id,
              nombre: categoria.nombre,
              productos: [],
            });
          }

          categoriasMap.get(categoria.id)!.productos.push(producto);
        }
      }

      const categorias = Array.from(categoriasMap.values())
        .map((categoria) => {
          const productosOrdenados = categoria.productos
            .sort((a, b) => {
              if (b.score !== a.score) return b.score - a.score;
              if (b.totalDisponible !== a.totalDisponible) {
                return b.totalDisponible - a.totalDisponible;
              }
              return a.nombre.localeCompare(b.nombre);
            })
            .slice(0, incluirEjemplos ? 12 : 0)
            .map((prod) => ({
              id: prod.id,
              nombre: prod.nombre,
              codigoProducto: prod.codigoProducto,
              precio: prod.precio,
              totalDisponible: prod.totalDisponible,
              cantidadDisponible: prod.cantidadDisponible,
              inventarioEstado: prod.inventarioEstado,
            }));

          const totalConStock = categoria.productos.filter(
            (p) => p.totalDisponible > 0,
          ).length;

          const totalParaPedido = categoria.productos.filter(
            (p) => p.totalDisponible <= 0,
          ).length;

          return {
            tipoResultado: 'categoria_catalogo',
            categoria: {
              id: categoria.id,
              nombre: categoria.nombre,
            },
            totalProductosRelacionados: categoria.productos.length,
            totalConStock,
            totalParaPedido,
            ejemplos: productosOrdenados,
          };
        })
        .filter((cat) => cat.totalProductosRelacionados > 0)
        .sort((a, b) => {
          if (b.totalProductosRelacionados !== a.totalProductosRelacionados) {
            return b.totalProductosRelacionados - a.totalProductosRelacionados;
          }

          return a.categoria.nombre.localeCompare(b.categoria.nombre);
        })
        .slice(0, limit);

      this.logger.log(
        `[${traceId}] CATEGORIAS FINALES PARA BOT: ${categorias.length}`,
      );

      this.logger.log(
        `[${traceId}] CATALOGO FINAL PREVIEW:\n${JSON.stringify(
          categorias.map((cat) => ({
            categoria: cat.categoria.nombre,
            totalProductosRelacionados: cat.totalProductosRelacionados,
            totalConStock: cat.totalConStock,
            totalParaPedido: cat.totalParaPedido,
            ejemplos: cat.ejemplos.slice(0, 8).map((p) => ({
              id: p.id,
              nombre: p.nombre,
              precio: p.precio,
              totalDisponible: p.totalDisponible,
              inventarioEstado: p.inventarioEstado,
            })),
          })),
          null,
          2,
        )}`,
      );

      return categorias;
    } catch (error) {
      this.logger.error(`[${traceId}] Error en listar_catalogo_pos`, error);
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
