import { Module } from '@nestjs/common';
import { CloudApiMetaService } from './app/cloud-api-meta.service';
import { CloudApiMetaController } from './presentation/cloud-api-meta.controller';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [HttpModule],
  controllers: [CloudApiMetaController],
  providers: [CloudApiMetaService],
  exports: [CloudApiMetaService],
})
export class CloudApiMetaModule {}
