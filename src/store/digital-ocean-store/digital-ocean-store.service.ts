import { Injectable } from '@nestjs/common';
import { CreateDigitalOceanStoreDto } from './dto/create-digital-ocean-store.dto';
import { UpdateDigitalOceanStoreDto } from './dto/update-digital-ocean-store.dto';

@Injectable()
export class DigitalOceanStoreService {
  create(createDigitalOceanStoreDto: CreateDigitalOceanStoreDto) {
    return 'This action adds a new digitalOceanStore';
  }

  findAll() {
    return `This action returns all digitalOceanStore`;
  }

  findOne(id: number) {
    return `This action returns a #${id} digitalOceanStore`;
  }

  update(id: number, updateDigitalOceanStoreDto: UpdateDigitalOceanStoreDto) {
    return `This action updates a #${id} digitalOceanStore`;
  }

  remove(id: number) {
    return `This action removes a #${id} digitalOceanStore`;
  }
}
