import {
  IsArray,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
  ArrayMaxSize,
} from 'class-validator';
import { Type } from 'class-transformer';

export class BotSearchProductoDto {
  @IsOptional()
  @IsString()
  producto?: string | null;

  @IsArray()
  @IsString({ each: true })
  @ArrayMaxSize(25)
  categorias: string[];

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(80)
  limit?: number | null;
}
