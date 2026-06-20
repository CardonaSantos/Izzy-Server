import { PartialType } from '@nestjs/mapped-types';
import { CreateDigitalOceanStoreDto } from './create-digital-ocean-store.dto';

export class UpdateDigitalOceanStoreDto extends PartialType(CreateDigitalOceanStoreDto) {}
