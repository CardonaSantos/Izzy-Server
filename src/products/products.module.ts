import { Module } from '@nestjs/common';
import { ProductsService } from './products.service';
import { ProductsController } from './products.controller';
import { PrismaService } from 'src/prisma/prisma.service';
import { MinimunStockAlertService } from 'src/minimun-stock-alert/minimun-stock-alert.service';
import { CloudinaryService } from 'src/cloudinary/cloudinary.service';
import { PresentacionProductoService } from 'src/presentacion-producto/presentacion-producto.service';
import { DigitalOceanStorageModule } from 'src/store/digital-ocean-store/digital-ocean-store.module';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
  imports: [DigitalOceanStorageModule, PrismaModule],
  controllers: [ProductsController],
  providers: [
    ProductsService,
    MinimunStockAlertService,
    CloudinaryService,
    PresentacionProductoService,
  ],
})
export class ProductsModule {}
