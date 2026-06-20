import { randomUUID } from 'crypto';

function sanitizeSegment(value: string) {
  return value
    .trim()
    .replace(/\.\./g, '')
    .replace(/[\/\\]+/g, '-')
    .replace(/\s+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase();
}

function sanitizePrefix(value: string) {
  return value
    .split('/')
    .map((segment) => sanitizeSegment(segment))
    .filter(Boolean)
    .join('/');
}

export function inferExtension(mime: string, fileName?: string) {
  const byMime = mime.split('/')[1]?.split('+')[0];
  const byName = fileName?.split('.').pop();

  const ext = (byMime || byName || 'bin').toLowerCase();

  return ext.startsWith('.') ? ext : `.${ext}`;
}

export function folderFromTipo(tipo?: string) {
  switch (tipo) {
    case 'IMAGEN':
    case 'IMAGE':
      return 'imagenes';

    case 'VIDEO':
      return 'videos';

    case 'AUDIO':
      return 'audios';

    case 'DOCUMENTO':
    case 'DOCUMENT':
      return 'documentos';

    default:
      return 'otros';
  }
}

export function generarStorageKey(params: {
  basePrefix?: string;
  empresaId?: number;
  sucursalId?: number;
  productoId?: number;
  presentacionId?: number;
  tipo?: string;
  extension: string;
}) {
  const now = new Date();

  const yyyy = now.getUTCFullYear();
  const mm = String(now.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(now.getUTCDate()).padStart(2, '0');

  const uuid = randomUUID();

  const root = params.basePrefix
    ? `${sanitizePrefix(params.basePrefix)}/`
    : 'erp/';

  const empresa = params.empresaId ? `empresas/${params.empresaId}/` : '';

  const sucursal = params.sucursalId ? `sucursales/${params.sucursalId}/` : '';

  const producto = params.productoId ? `productos/${params.productoId}/` : '';

  const presentacion = params.presentacionId
    ? `presentaciones/${params.presentacionId}/`
    : '';

  const tipoFolder = `${folderFromTipo(params.tipo)}/`;

  const extension = params.extension.startsWith('.')
    ? params.extension
    : `.${params.extension}`;

  return `${root}${empresa}${sucursal}${producto}${presentacion}${tipoFolder}${yyyy}/${mm}/${dd}/${uuid}${extension}`;
}
