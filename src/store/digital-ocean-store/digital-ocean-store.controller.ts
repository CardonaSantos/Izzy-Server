import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { DigitalOceanStoreService } from './digital-ocean-store.service';
import { CreateDigitalOceanStoreDto } from './dto/create-digital-ocean-store.dto';
import { UpdateDigitalOceanStoreDto } from './dto/update-digital-ocean-store.dto';

@Controller('digital-ocean-store')
export class DigitalOceanStoreController {
  constructor(private readonly digitalOceanStoreService: DigitalOceanStoreService) {}

  @Post()
  create(@Body() createDigitalOceanStoreDto: CreateDigitalOceanStoreDto) {
    return this.digitalOceanStoreService.create(createDigitalOceanStoreDto);
  }

  @Get()
  findAll() {
    return this.digitalOceanStoreService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.digitalOceanStoreService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateDigitalOceanStoreDto: UpdateDigitalOceanStoreDto) {
    return this.digitalOceanStoreService.update(+id, updateDigitalOceanStoreDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.digitalOceanStoreService.remove(+id);
  }
}
