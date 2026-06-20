import {
  Body,
  Controller,
  DefaultValuePipe,
  Delete,
  Get,
  HttpException,
  InternalServerErrorException,
  Logger,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UploadedFiles,
  UseInterceptors,
  ValidationPipe,
} from '@nestjs/common';

import { FilesInterceptor } from '@nestjs/platform-express';
import { plainToInstance } from 'class-transformer';
import { validateOrReject } from 'class-validator';
import { join } from 'path';

import { ProductsService } from './products.service';
import { CreateNewProductDto } from './dto/create-productNew.dto';
import { DeleteProductDto } from './dto/delete-dto';

import { QueryParamsInventariado } from './query/query';
import { newQueryDTO } from './query/newQuery';

import {
  cleanStr,
  hasOwn,
  mapPrecioProductoArray,
  parseNumberArray,
  safeJsonParse,
  toDecimalStringOrNull,
  toIntOrThrow,
  toNullableInt,
} from './product-form.parser';
import {
  formatFilesForLog,
  validateProductImages,
} from './product-files.parser';
import { UpdateProductDto } from './dto/update-product.dto';

const PRODUCT_IMAGE_LIMIT = 5 * 1024 * 1024;
const PRODUCT_IMAGE_MAX_COUNT = 10;

@Controller('products')
export class ProductsController {
  private readonly logger = new Logger(ProductsController.name);

  constructor(private readonly productsService: ProductsService) {}

  // ==========================================================================
  // CREATE
  // ==========================================================================

  @Post()
  @UseInterceptors(
    FilesInterceptor('images', PRODUCT_IMAGE_MAX_COUNT, {
      limits: { fileSize: PRODUCT_IMAGE_LIMIT },
    }),
  )
  async create(
    @UploadedFiles() files: Express.Multer.File[] = [],
    @Body() body: Record<string, any>,
  ) {
    const dto = await this.buildCreateDto(body);
    const productImages = validateProductImages(files);

    this.logger.debug(`POST /products files: ${formatFilesForLog(files)}`);

    return this.productsService.create(dto, productImages);
  }

  // ==========================================================================
  // UPDATE
  // ==========================================================================

  @Patch(':id')
  @UseInterceptors(
    FilesInterceptor('images', PRODUCT_IMAGE_MAX_COUNT, {
      limits: { fileSize: PRODUCT_IMAGE_LIMIT },
    }),
  )
  async update(
    @Param('id', ParseIntPipe) id: number,
    @UploadedFiles() files: Express.Multer.File[] = [],
    @Body() body: Record<string, any>,
  ) {
    const dto = this.buildUpdateDto(body);
    const productImages = validateProductImages(files);

    this.logger.debug(
      `PATCH /products/${id} files: ${formatFilesForLog(files)}`,
    );

    return this.productsService.update(id, dto, productImages);
  }

  // ==========================================================================
  // POS / INVENTARIO / CONSULTAS
  // ==========================================================================

  @Get('get-products-presentations-for-pos')
  async findAllProductToSale(
    @Query(
      new ValidationPipe({
        transform: true,
        transformOptions: { enableImplicitConversion: true },
      }),
    )
    dto: newQueryDTO,
  ) {
    return this.productsService.getProductsForPOS(dto);
  }

  @Get('products/for-inventary')
  async getAll(
    @Query(
      new ValidationPipe({
        transform: true,
        transformOptions: { enableImplicitConversion: true },
      }),
    )
    dto: QueryParamsInventariado,
  ) {
    return this.productsService.getProductosPresentacionesForInventary(dto);
  }

  @Get('products/to-transfer/:id')
  async findAllProductsToTransfer(@Param('id', ParseIntPipe) id: number) {
    return this.productsService.findAllProductsToTransfer(id);
  }

  @Get('products/for-set-stock')
  async findAllProductsToStock() {
    return this.productsService.findAllProductsToStcok();
  }

  @Get('product/get-one-product/:id')
  async productToEdit(@Param('id', ParseIntPipe) id: number) {
    return this.productsService.productToEdit(id);
  }

  @Get('products-to-credit')
  async productToCredit() {
    return this.productsService.productToCredit();
  }

  @Get('product-to-warranty')
  async productToWarranty() {
    return this.productsService.productToWarranty();
  }

  @Get('historial-price')
  async productHistorialPrecios() {
    return this.productsService.productHistorialPrecios();
  }

  @Get('search')
  async getBySearchProducts(
    @Query('q') q: string,
    @Query('sucursalId') sucursalId: string,
  ) {
    try {
      return await this.productsService.getBySearchProducts(q, sucursalId);
    } catch (error) {
      this.logger.error('Error generado en search productos:', error);

      if (error instanceof HttpException) throw error;

      throw new InternalServerErrorException(
        'Error inesperado al buscar productos',
      );
    }
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.productsService.getProductDetail(id);
  }

  // ==========================================================================
  // IMÁGENES
  // ==========================================================================

  @Delete('images/:imageId')
  async deleteProductImage(@Param('imageId', ParseIntPipe) imageId: number) {
    return this.productsService.eliminarImagenProducto(imageId);
  }

  /**
   * LEGACY:
   * Déjala solo si tu frontend viejo todavía consume esta ruta.
   * La nueva ruta oficial debería ser:
   * DELETE /products/images/:imageId
   */
  @Delete('delete-image-from-product/:id/:imageId')
  async removeImageFromProductLegacy(
    @Param('id') id: string,
    @Param('imageId', ParseIntPipe) imageId: number,
  ) {
    const decodedId = decodeURIComponent(id);

    return this.productsService.removeImageFromProduct(decodedId, imageId);
  }

  // ==========================================================================
  // DELETE
  // ==========================================================================

  @Delete('delete-one-price-from-product/:id')
  async removePrice(@Param('id', ParseIntPipe) id: number) {
    this.logger.log(`Eliminando precio de producto: ${id}`);

    return this.productsService.removePrice(id);
  }

  @Delete('delete-all')
  async removeAll() {
    return this.productsService.removeAll();
  }

  @Delete(':id')
  async remove(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: DeleteProductDto,
  ) {
    return this.productsService.remove(id, dto);
  }

  // ==========================================================================
  // ADMIN / SEED / DEBUG
  // ==========================================================================

  @Get('carga-masiva')
  async makeCargaMasiva() {
    const ruta = join(process.cwd(), 'src', 'assets', 'productos_ejemplo.csv');

    this.logger.debug(`Ruta CSV preparada: ${ruta}`);

    return {
      ok: false,
      message: 'Carga masiva desactivada temporalmente',
      ruta,
    };

    // return this.productsService.loadCSVandImportProducts(ruta);
  }

  @Get('productos-basicos-gt')
  async seedProductosBasicos(
    @Query('creadoPorId', new DefaultValuePipe(1), ParseIntPipe)
    creadoPorId: number,
  ) {
    return this.productsService.seedProductosBasicos(creadoPorId);
  }

  // ==========================================================================
  // PRIVATE PARSERS
  // ==========================================================================

  private async buildCreateDto(
    body: Record<string, any>,
  ): Promise<CreateNewProductDto> {
    const dtoPlain: Partial<CreateNewProductDto> = {
      nombre: cleanStr(body.nombre),
      descripcion: cleanStr(body.descripcion) || null,
      codigoProducto: cleanStr(body.codigoProducto),
      codigoProveedor: cleanStr(body.codigoProveedor) || null,
      stockMinimo: toNullableInt(body.stockMinimo),
      precioCostoActual: toDecimalStringOrNull(
        body.precioCostoActual,
        'precioCostoActual',
      ),
      creadoPorId: toIntOrThrow(body.creadoPorId, 'creadoPorId'),
      categorias: parseNumberArray(body.categorias, 'categorias'),
      tipoPresentacionId: toNullableInt(body.tipoPresentacionId),
      precioVenta: mapPrecioProductoArray(
        safeJsonParse<any[]>(body.precioVenta, [], 'precioVenta'),
        'precioVenta',
      ),
    };

    const dto = plainToInstance(CreateNewProductDto, dtoPlain);

    await validateOrReject(dto, {
      whitelist: true,
      forbidNonWhitelisted: true,
    });

    return dto;
  }

  private buildUpdateDto(body: Record<string, any>): UpdateProductDto {
    return {
      nombre: cleanStr(body.nombre),
      descripcion: cleanStr(body.descripcion) || null,
      codigoProducto: cleanStr(body.codigoProducto),
      codigoProveedor: cleanStr(body.codigoProveedor) || null,
      stockMinimo: toNullableInt(body.stockMinimo),
      precioCostoActual: toDecimalStringOrNull(
        body.precioCostoActual,
        'precioCostoActual',
      ),
      creadoPorId: toIntOrThrow(body.creadoPorId, 'creadoPorId'),
      categorias: parseNumberArray(body.categorias, 'categorias'),
      tipoPresentacionId: toNullableInt(body.tipoPresentacionId),
      precioVenta: mapPrecioProductoArray(
        safeJsonParse<any[]>(body.precioVenta, [], 'precioVenta'),
        'precioVenta',
      ),
      keepProductImageIds: hasOwn(body, 'keepProductImageIds')
        ? parseNumberArray(body.keepProductImageIds, 'keepProductImageIds')
        : undefined,
    };
  }
}
