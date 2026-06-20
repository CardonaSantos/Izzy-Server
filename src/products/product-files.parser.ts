import { BadRequestException } from '@nestjs/common';

export function validateProductImages(files: Express.Multer.File[] = []) {
  for (const file of files) {
    if (file.fieldname !== 'images') {
      throw new BadRequestException(
        `Campo de archivo no permitido: ${file.fieldname}`,
      );
    }

    if (!file.mimetype.startsWith('image/')) {
      throw new BadRequestException(
        `Tipo de archivo no permitido: ${file.mimetype}`,
      );
    }
  }

  return files;
}

export function formatFilesForLog(files: Express.Multer.File[] = []) {
  if (!files.length) return '(sin archivos)';

  return files
    .map(
      (file) =>
        `${file.fieldname}=${file.originalname}(${file.mimetype}, ${file.size}b)`,
    )
    .join(', ');
}
