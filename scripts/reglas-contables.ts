import {
  Prisma,
  PrismaClient,
  ClasificacionAdmin,
  MetodoPago,
  MotivoMovimiento,
  NaturalezaCuentaContable,
  OrigenAsientoContable,
  TipoCuentaContable,
} from '@prisma/client';

const prisma = new PrismaClient();

type Tx = Prisma.TransactionClient;

type AccountSeed = {
  codigo: string;
  nombre: string;
  tipo: TipoCuentaContable;
  naturaleza: NaturalezaCuentaContable;
  nivel: number;
  permiteMovimiento: boolean;
  activa?: boolean;
  cuentaPadreCodigo?: string;
};

type RuleSeed = {
  codigo: string;
  nombre: string;
  descripcion?: string;
  origen: OrigenAsientoContable;
  clasificacion?: ClasificacionAdmin | null;
  motivo?: MotivoMovimiento | null;
  metodoPago?: MetodoPago | null;
  cuentaDebeCodigo: string;
  cuentaHaberCodigo: string;
  prioridad?: number;
  activa?: boolean;
};

type PaymentRuleMethod = {
  metodoPago: MetodoPago;
  suffix: string;
  label: string;
  cuentaIngreso: string;
  cuentaEgreso: string;
};

const accounts: AccountSeed[] = [
  {
    codigo: '1000',
    nombre: 'Activo',
    tipo: TipoCuentaContable.ACTIVO,
    naturaleza: NaturalezaCuentaContable.DEUDORA,
    nivel: 1,
    permiteMovimiento: false,
  },
  {
    codigo: '1100',
    nombre: 'Efectivo, bancos y medios de cobro',
    tipo: TipoCuentaContable.ACTIVO,
    naturaleza: NaturalezaCuentaContable.DEUDORA,
    nivel: 2,
    permiteMovimiento: false,
    cuentaPadreCodigo: '1000',
  },
  {
    codigo: '1101',
    nombre: 'Caja general',
    tipo: TipoCuentaContable.ACTIVO,
    naturaleza: NaturalezaCuentaContable.DEUDORA,
    nivel: 3,
    permiteMovimiento: true,
    cuentaPadreCodigo: '1100',
  },
  {
    codigo: '1102',
    nombre: 'Bancos y transferencias',
    tipo: TipoCuentaContable.ACTIVO,
    naturaleza: NaturalezaCuentaContable.DEUDORA,
    nivel: 3,
    permiteMovimiento: true,
    cuentaPadreCodigo: '1100',
  },
  {
    codigo: '1103',
    nombre: 'Tarjetas y POS bancario',
    tipo: TipoCuentaContable.ACTIVO,
    naturaleza: NaturalezaCuentaContable.DEUDORA,
    nivel: 3,
    permiteMovimiento: true,
    cuentaPadreCodigo: '1100',
  },
  {
    codigo: '1199',
    nombre: 'Cobros por clasificar',
    tipo: TipoCuentaContable.ACTIVO,
    naturaleza: NaturalezaCuentaContable.DEUDORA,
    nivel: 3,
    permiteMovimiento: true,
    cuentaPadreCodigo: '1100',
  },
  {
    codigo: '1200',
    nombre: 'Cuentas por cobrar',
    tipo: TipoCuentaContable.ACTIVO,
    naturaleza: NaturalezaCuentaContable.DEUDORA,
    nivel: 2,
    permiteMovimiento: false,
    cuentaPadreCodigo: '1000',
  },
  {
    codigo: '1201',
    nombre: 'Clientes por cobrar',
    tipo: TipoCuentaContable.ACTIVO,
    naturaleza: NaturalezaCuentaContable.DEUDORA,
    nivel: 3,
    permiteMovimiento: true,
    cuentaPadreCodigo: '1200',
  },
  {
    codigo: '1300',
    nombre: 'Inventarios',
    tipo: TipoCuentaContable.ACTIVO,
    naturaleza: NaturalezaCuentaContable.DEUDORA,
    nivel: 2,
    permiteMovimiento: false,
    cuentaPadreCodigo: '1000',
  },
  {
    codigo: '1301',
    nombre: 'Inventario de mercadería',
    tipo: TipoCuentaContable.ACTIVO,
    naturaleza: NaturalezaCuentaContable.DEUDORA,
    nivel: 3,
    permiteMovimiento: true,
    cuentaPadreCodigo: '1300',
  },
  {
    codigo: '1302',
    nombre: 'Inventario de insumos',
    tipo: TipoCuentaContable.ACTIVO,
    naturaleza: NaturalezaCuentaContable.DEUDORA,
    nivel: 3,
    permiteMovimiento: true,
    cuentaPadreCodigo: '1300',
  },
  {
    codigo: '1400',
    nombre: 'Anticipos entregados',
    tipo: TipoCuentaContable.ACTIVO,
    naturaleza: NaturalezaCuentaContable.DEUDORA,
    nivel: 2,
    permiteMovimiento: false,
    cuentaPadreCodigo: '1000',
  },
  {
    codigo: '1401',
    nombre: 'Anticipos a proveedores',
    tipo: TipoCuentaContable.ACTIVO,
    naturaleza: NaturalezaCuentaContable.DEUDORA,
    nivel: 3,
    permiteMovimiento: true,
    cuentaPadreCodigo: '1400',
  },
  {
    codigo: '2000',
    nombre: 'Pasivo',
    tipo: TipoCuentaContable.PASIVO,
    naturaleza: NaturalezaCuentaContable.ACREEDORA,
    nivel: 1,
    permiteMovimiento: false,
  },
  {
    codigo: '2100',
    nombre: 'Cuentas por pagar',
    tipo: TipoCuentaContable.PASIVO,
    naturaleza: NaturalezaCuentaContable.ACREEDORA,
    nivel: 2,
    permiteMovimiento: false,
    cuentaPadreCodigo: '2000',
  },
  {
    codigo: '2101',
    nombre: 'Proveedores por pagar',
    tipo: TipoCuentaContable.PASIVO,
    naturaleza: NaturalezaCuentaContable.ACREEDORA,
    nivel: 3,
    permiteMovimiento: true,
    cuentaPadreCodigo: '2100',
  },
  {
    codigo: '2102',
    nombre: 'Tarjetas de crédito por pagar',
    tipo: TipoCuentaContable.PASIVO,
    naturaleza: NaturalezaCuentaContable.ACREEDORA,
    nivel: 3,
    permiteMovimiento: true,
    cuentaPadreCodigo: '2100',
  },
  {
    codigo: '2199',
    nombre: 'Pagos por clasificar',
    tipo: TipoCuentaContable.PASIVO,
    naturaleza: NaturalezaCuentaContable.ACREEDORA,
    nivel: 3,
    permiteMovimiento: true,
    cuentaPadreCodigo: '2100',
  },
  {
    codigo: '2200',
    nombre: 'Anticipos recibidos',
    tipo: TipoCuentaContable.PASIVO,
    naturaleza: NaturalezaCuentaContable.ACREEDORA,
    nivel: 2,
    permiteMovimiento: false,
    cuentaPadreCodigo: '2000',
  },
  {
    codigo: '2201',
    nombre: 'Anticipos de clientes',
    tipo: TipoCuentaContable.PASIVO,
    naturaleza: NaturalezaCuentaContable.ACREEDORA,
    nivel: 3,
    permiteMovimiento: true,
    cuentaPadreCodigo: '2200',
  },
  {
    codigo: '3000',
    nombre: 'Patrimonio',
    tipo: TipoCuentaContable.PATRIMONIO,
    naturaleza: NaturalezaCuentaContable.ACREEDORA,
    nivel: 1,
    permiteMovimiento: false,
  },
  {
    codigo: '3101',
    nombre: 'Capital social',
    tipo: TipoCuentaContable.PATRIMONIO,
    naturaleza: NaturalezaCuentaContable.ACREEDORA,
    nivel: 2,
    permiteMovimiento: true,
    cuentaPadreCodigo: '3000',
  },
  {
    codigo: '3201',
    nombre: 'Resultados acumulados',
    tipo: TipoCuentaContable.PATRIMONIO,
    naturaleza: NaturalezaCuentaContable.ACREEDORA,
    nivel: 2,
    permiteMovimiento: true,
    cuentaPadreCodigo: '3000',
  },
  {
    codigo: '4000',
    nombre: 'Ingresos',
    tipo: TipoCuentaContable.INGRESO,
    naturaleza: NaturalezaCuentaContable.ACREEDORA,
    nivel: 1,
    permiteMovimiento: false,
  },
  {
    codigo: '4101',
    nombre: 'Ventas de mercadería',
    tipo: TipoCuentaContable.INGRESO,
    naturaleza: NaturalezaCuentaContable.ACREEDORA,
    nivel: 2,
    permiteMovimiento: true,
    cuentaPadreCodigo: '4000',
  },
  {
    codigo: '4102',
    nombre: 'Otros ingresos',
    tipo: TipoCuentaContable.INGRESO,
    naturaleza: NaturalezaCuentaContable.ACREEDORA,
    nivel: 2,
    permiteMovimiento: true,
    cuentaPadreCodigo: '4000',
  },
  {
    codigo: '4103',
    nombre: 'Sobrantes de caja',
    tipo: TipoCuentaContable.INGRESO,
    naturaleza: NaturalezaCuentaContable.ACREEDORA,
    nivel: 2,
    permiteMovimiento: true,
    cuentaPadreCodigo: '4000',
  },
  {
    codigo: '5000',
    nombre: 'Costos',
    tipo: TipoCuentaContable.COSTO,
    naturaleza: NaturalezaCuentaContable.DEUDORA,
    nivel: 1,
    permiteMovimiento: false,
  },
  {
    codigo: '5101',
    nombre: 'Costo de venta de mercadería',
    tipo: TipoCuentaContable.COSTO,
    naturaleza: NaturalezaCuentaContable.DEUDORA,
    nivel: 2,
    permiteMovimiento: true,
    cuentaPadreCodigo: '5000',
  },
  {
    codigo: '5102',
    nombre: 'Costos asociados de compra',
    tipo: TipoCuentaContable.COSTO,
    naturaleza: NaturalezaCuentaContable.DEUDORA,
    nivel: 2,
    permiteMovimiento: true,
    cuentaPadreCodigo: '5000',
  },
  {
    codigo: '5103',
    nombre: 'Fletes, encomiendas y transporte de compra',
    tipo: TipoCuentaContable.COSTO,
    naturaleza: NaturalezaCuentaContable.DEUDORA,
    nivel: 2,
    permiteMovimiento: true,
    cuentaPadreCodigo: '5000',
  },
  {
    codigo: '5104',
    nombre: 'Importaciones y gastos aduanales',
    tipo: TipoCuentaContable.COSTO,
    naturaleza: NaturalezaCuentaContable.DEUDORA,
    nivel: 2,
    permiteMovimiento: true,
    cuentaPadreCodigo: '5000',
  },
  {
    codigo: '5105',
    nombre: 'Servicios de terceros asociados a compra',
    tipo: TipoCuentaContable.COSTO,
    naturaleza: NaturalezaCuentaContable.DEUDORA,
    nivel: 2,
    permiteMovimiento: true,
    cuentaPadreCodigo: '5000',
  },
  {
    codigo: '5201',
    nombre: 'Devoluciones y contraventas',
    tipo: TipoCuentaContable.COSTO,
    naturaleza: NaturalezaCuentaContable.DEUDORA,
    nivel: 2,
    permiteMovimiento: true,
    cuentaPadreCodigo: '5000',
  },
  {
    codigo: '6000',
    nombre: 'Gastos operativos',
    tipo: TipoCuentaContable.GASTO,
    naturaleza: NaturalezaCuentaContable.DEUDORA,
    nivel: 1,
    permiteMovimiento: false,
  },
  {
    codigo: '6101',
    nombre: 'Gastos operativos generales',
    tipo: TipoCuentaContable.GASTO,
    naturaleza: NaturalezaCuentaContable.DEUDORA,
    nivel: 2,
    permiteMovimiento: true,
    cuentaPadreCodigo: '6000',
  },
  {
    codigo: '6102',
    nombre: 'Sueldos y salarios',
    tipo: TipoCuentaContable.GASTO,
    naturaleza: NaturalezaCuentaContable.DEUDORA,
    nivel: 2,
    permiteMovimiento: true,
    cuentaPadreCodigo: '6000',
  },
  {
    codigo: '6103',
    nombre: 'Alquileres',
    tipo: TipoCuentaContable.GASTO,
    naturaleza: NaturalezaCuentaContable.DEUDORA,
    nivel: 2,
    permiteMovimiento: true,
    cuentaPadreCodigo: '6000',
  },
  {
    codigo: '6104',
    nombre: 'Servicios básicos',
    tipo: TipoCuentaContable.GASTO,
    naturaleza: NaturalezaCuentaContable.DEUDORA,
    nivel: 2,
    permiteMovimiento: true,
    cuentaPadreCodigo: '6000',
  },
  {
    codigo: '6105',
    nombre: 'Impuestos y tasas',
    tipo: TipoCuentaContable.GASTO,
    naturaleza: NaturalezaCuentaContable.DEUDORA,
    nivel: 2,
    permiteMovimiento: true,
    cuentaPadreCodigo: '6000',
  },
  {
    codigo: '6106',
    nombre: 'Comisiones',
    tipo: TipoCuentaContable.GASTO,
    naturaleza: NaturalezaCuentaContable.DEUDORA,
    nivel: 2,
    permiteMovimiento: true,
    cuentaPadreCodigo: '6000',
  },
  {
    codigo: '6107',
    nombre: 'Insumos de operación',
    tipo: TipoCuentaContable.GASTO,
    naturaleza: NaturalezaCuentaContable.DEUDORA,
    nivel: 2,
    permiteMovimiento: true,
    cuentaPadreCodigo: '6000',
  },
  {
    codigo: '6108',
    nombre: 'Combustible y movilidad',
    tipo: TipoCuentaContable.GASTO,
    naturaleza: NaturalezaCuentaContable.DEUDORA,
    nivel: 2,
    permiteMovimiento: true,
    cuentaPadreCodigo: '6000',
  },
  {
    codigo: '6109',
    nombre: 'Logística y viáticos',
    tipo: TipoCuentaContable.GASTO,
    naturaleza: NaturalezaCuentaContable.DEUDORA,
    nivel: 2,
    permiteMovimiento: true,
    cuentaPadreCodigo: '6000',
  },
  {
    codigo: '6110',
    nombre: 'Publicidad y mercadeo',
    tipo: TipoCuentaContable.GASTO,
    naturaleza: NaturalezaCuentaContable.DEUDORA,
    nivel: 2,
    permiteMovimiento: true,
    cuentaPadreCodigo: '6000',
  },
  {
    codigo: '6111',
    nombre: 'Mantenimiento y reparaciones',
    tipo: TipoCuentaContable.GASTO,
    naturaleza: NaturalezaCuentaContable.DEUDORA,
    nivel: 2,
    permiteMovimiento: true,
    cuentaPadreCodigo: '6000',
  },
  {
    codigo: '6112',
    nombre: 'Repuestos',
    tipo: TipoCuentaContable.GASTO,
    naturaleza: NaturalezaCuentaContable.DEUDORA,
    nivel: 2,
    permiteMovimiento: true,
    cuentaPadreCodigo: '6000',
  },
  {
    codigo: '6113',
    nombre: 'Limpieza',
    tipo: TipoCuentaContable.GASTO,
    naturaleza: NaturalezaCuentaContable.DEUDORA,
    nivel: 2,
    permiteMovimiento: true,
    cuentaPadreCodigo: '6000',
  },
  {
    codigo: '6114',
    nombre: 'Papelería y útiles',
    tipo: TipoCuentaContable.GASTO,
    naturaleza: NaturalezaCuentaContable.DEUDORA,
    nivel: 2,
    permiteMovimiento: true,
    cuentaPadreCodigo: '6000',
  },
  {
    codigo: '6115',
    nombre: 'Herramientas menores',
    tipo: TipoCuentaContable.GASTO,
    naturaleza: NaturalezaCuentaContable.DEUDORA,
    nivel: 2,
    permiteMovimiento: true,
    cuentaPadreCodigo: '6000',
  },
  {
    codigo: '6116',
    nombre: 'Seguros',
    tipo: TipoCuentaContable.GASTO,
    naturaleza: NaturalezaCuentaContable.DEUDORA,
    nivel: 2,
    permiteMovimiento: true,
    cuentaPadreCodigo: '6000',
  },
  {
    codigo: '6117',
    nombre: 'Servicios técnicos',
    tipo: TipoCuentaContable.GASTO,
    naturaleza: NaturalezaCuentaContable.DEUDORA,
    nivel: 2,
    permiteMovimiento: true,
    cuentaPadreCodigo: '6000',
  },
  {
    codigo: '6118',
    nombre: 'Otros egresos',
    tipo: TipoCuentaContable.GASTO,
    naturaleza: NaturalezaCuentaContable.DEUDORA,
    nivel: 2,
    permiteMovimiento: true,
    cuentaPadreCodigo: '6000',
  },
  {
    codigo: '6120',
    nombre: 'Pagos de crédito y gastos financieros',
    tipo: TipoCuentaContable.GASTO,
    naturaleza: NaturalezaCuentaContable.DEUDORA,
    nivel: 2,
    permiteMovimiento: true,
    cuentaPadreCodigo: '6000',
  },
  {
    codigo: '7000',
    nombre: 'Ajustes y diferencias',
    tipo: TipoCuentaContable.GASTO,
    naturaleza: NaturalezaCuentaContable.DEUDORA,
    nivel: 1,
    permiteMovimiento: false,
  },
  {
    codigo: '7101',
    nombre: 'Faltantes de caja',
    tipo: TipoCuentaContable.GASTO,
    naturaleza: NaturalezaCuentaContable.DEUDORA,
    nivel: 2,
    permiteMovimiento: true,
    cuentaPadreCodigo: '7000',
  },
  {
    codigo: '7199',
    nombre: 'Diferencias por clasificar',
    tipo: TipoCuentaContable.GASTO,
    naturaleza: NaturalezaCuentaContable.DEUDORA,
    nivel: 2,
    permiteMovimiento: true,
    cuentaPadreCodigo: '7000',
  },
];

const paymentMethods: PaymentRuleMethod[] = [
  {
    metodoPago: MetodoPago.CONTADO,
    suffix: 'CONTADO',
    label: 'contado',
    cuentaIngreso: '1101',
    cuentaEgreso: '1101',
  },
  {
    metodoPago: MetodoPago.EFECTIVO,
    suffix: 'EFECTIVO',
    label: 'efectivo',
    cuentaIngreso: '1101',
    cuentaEgreso: '1101',
  },
  {
    metodoPago: MetodoPago.TRANSFERENCIA,
    suffix: 'TRANSFERENCIA',
    label: 'transferencia',
    cuentaIngreso: '1102',
    cuentaEgreso: '1102',
  },
  {
    metodoPago: MetodoPago.CHEQUE,
    suffix: 'CHEQUE',
    label: 'cheque',
    cuentaIngreso: '1102',
    cuentaEgreso: '1102',
  },
  {
    metodoPago: MetodoPago.TARJETA,
    suffix: 'TARJETA',
    label: 'tarjeta',
    cuentaIngreso: '1103',
    cuentaEgreso: '1103',
  },
  {
    metodoPago: MetodoPago.OTRO,
    suffix: 'OTRO',
    label: 'otro / por clasificar',
    cuentaIngreso: '1199',
    cuentaEgreso: '2199',
  },
];

function originPrefix(origin: OrigenAsientoContable): string {
  const map: Record<OrigenAsientoContable, string> = {
    VENTA: 'VTA',
    COMPRA: 'CMP',
    MOVIMIENTO_FINANCIERO: 'MF',
    CXP_DOCUMENTO: 'CXP-DOC',
    CXP_PAGO: 'CXP-PAGO',
    ABONO_CREDITO: 'ABONO',
    AJUSTE_STOCK: 'AJ-STOCK',
    TRANSFERENCIA: 'TRANSF',
    GARANTIA: 'GAR',
    OTRO: 'OTRO',
  };

  return map[origin];
}

function buildRules(): RuleSeed[] {
  const rules: RuleSeed[] = [];

  const addRule = (rule: RuleSeed) => {
    rules.push({
      prioridad: 50,
      activa: true,
      descripcion: rule.descripcion ?? rule.nombre,
      ...rule,
    });
  };

  const addIngresoPorMetodo = (args: {
    prefix: string;
    nombre: string;
    origenes: OrigenAsientoContable[];
    motivo: MotivoMovimiento;
    clasificacion: ClasificacionAdmin;
    cuentaHaberCodigo: string;
    prioridad?: number;
  }) => {
    for (const origen of args.origenes) {
      for (const method of paymentMethods) {
        addRule({
          codigo: `${originPrefix(origen)}-${args.prefix}-${method.suffix}`,
          nombre: `${args.nombre} por ${method.label}`,
          origen,
          clasificacion: args.clasificacion,
          motivo: args.motivo,
          metodoPago: method.metodoPago,
          cuentaDebeCodigo: method.cuentaIngreso,
          cuentaHaberCodigo: args.cuentaHaberCodigo,
          prioridad: args.prioridad ?? 20,
        });
      }
    }
  };

  const addEgresoPorMetodo = (args: {
    prefix: string;
    nombre: string;
    origenes: OrigenAsientoContable[];
    motivo: MotivoMovimiento;
    clasificacion: ClasificacionAdmin;
    cuentaDebeCodigo: string;
    prioridad?: number;
  }) => {
    for (const origen of args.origenes) {
      for (const method of paymentMethods) {
        addRule({
          codigo: `${originPrefix(origen)}-${args.prefix}-${method.suffix}`,
          nombre: `${args.nombre} por ${method.label}`,
          origen,
          clasificacion: args.clasificacion,
          motivo: args.motivo,
          metodoPago: method.metodoPago,
          cuentaDebeCodigo: args.cuentaDebeCodigo,
          cuentaHaberCodigo: method.cuentaEgreso,
          prioridad: args.prioridad ?? 20,
        });
      }
    }
  };

  addIngresoPorMetodo({
    prefix: 'VENTA',
    nombre: 'Venta de mercadería',
    origenes: [
      OrigenAsientoContable.VENTA,
      OrigenAsientoContable.MOVIMIENTO_FINANCIERO,
    ],
    motivo: MotivoMovimiento.VENTA,
    clasificacion: ClasificacionAdmin.INGRESO,
    cuentaHaberCodigo: '4101',
    prioridad: 10,
  });

  addIngresoPorMetodo({
    prefix: 'OTRO-INGRESO',
    nombre: 'Otro ingreso',
    origenes: [OrigenAsientoContable.MOVIMIENTO_FINANCIERO],
    motivo: MotivoMovimiento.OTRO_INGRESO,
    clasificacion: ClasificacionAdmin.INGRESO,
    cuentaHaberCodigo: '4102',
  });

  addIngresoPorMetodo({
    prefix: 'COBRO-CREDITO',
    nombre: 'Cobro de crédito a cliente',
    origenes: [
      OrigenAsientoContable.MOVIMIENTO_FINANCIERO,
      OrigenAsientoContable.ABONO_CREDITO,
    ],
    motivo: MotivoMovimiento.COBRO_CREDITO,
    clasificacion: ClasificacionAdmin.INGRESO,
    cuentaHaberCodigo: '1201',
  });

  addIngresoPorMetodo({
    prefix: 'ANTICIPO-CLIENTE',
    nombre: 'Anticipo recibido de cliente',
    origenes: [OrigenAsientoContable.MOVIMIENTO_FINANCIERO],
    motivo: MotivoMovimiento.ANTICIPO_CLIENTE,
    clasificacion: ClasificacionAdmin.INGRESO,
    cuentaHaberCodigo: '2201',
  });

  addIngresoPorMetodo({
    prefix: 'DEVOLUCION-PROVEEDOR',
    nombre: 'Devolución recibida de proveedor',
    origenes: [OrigenAsientoContable.MOVIMIENTO_FINANCIERO],
    motivo: MotivoMovimiento.DEVOLUCION_PROVEEDOR,
    clasificacion: ClasificacionAdmin.COSTO_VENTA,
    cuentaHaberCodigo: '1401',
  });

  addEgresoPorMetodo({
    prefix: 'GASTO-OPERATIVO',
    nombre: 'Gasto operativo general',
    origenes: [OrigenAsientoContable.MOVIMIENTO_FINANCIERO],
    motivo: MotivoMovimiento.GASTO_OPERATIVO,
    clasificacion: ClasificacionAdmin.GASTO_OPERATIVO,
    cuentaDebeCodigo: '6101',
  });

  addEgresoPorMetodo({
    prefix: 'PAGO-NOMINA',
    nombre: 'Pago de nómina',
    origenes: [OrigenAsientoContable.MOVIMIENTO_FINANCIERO],
    motivo: MotivoMovimiento.PAGO_NOMINA,
    clasificacion: ClasificacionAdmin.GASTO_OPERATIVO,
    cuentaDebeCodigo: '6102',
  });

  addEgresoPorMetodo({
    prefix: 'PAGO-ALQUILER',
    nombre: 'Pago de alquiler',
    origenes: [OrigenAsientoContable.MOVIMIENTO_FINANCIERO],
    motivo: MotivoMovimiento.PAGO_ALQUILER,
    clasificacion: ClasificacionAdmin.GASTO_OPERATIVO,
    cuentaDebeCodigo: '6103',
  });

  addEgresoPorMetodo({
    prefix: 'PAGO-SERVICIOS',
    nombre: 'Pago de servicios básicos',
    origenes: [OrigenAsientoContable.MOVIMIENTO_FINANCIERO],
    motivo: MotivoMovimiento.PAGO_SERVICIOS,
    clasificacion: ClasificacionAdmin.GASTO_OPERATIVO,
    cuentaDebeCodigo: '6104',
  });

  addEgresoPorMetodo({
    prefix: 'PAGO-IMPUESTOS',
    nombre: 'Pago de impuestos y tasas',
    origenes: [OrigenAsientoContable.MOVIMIENTO_FINANCIERO],
    motivo: MotivoMovimiento.PAGO_IMPUESTOS,
    clasificacion: ClasificacionAdmin.GASTO_OPERATIVO,
    cuentaDebeCodigo: '6105',
  });

  addEgresoPorMetodo({
    prefix: 'PAGO-COMISIONES',
    nombre: 'Pago de comisiones',
    origenes: [OrigenAsientoContable.MOVIMIENTO_FINANCIERO],
    motivo: MotivoMovimiento.PAGO_COMISIONES,
    clasificacion: ClasificacionAdmin.GASTO_OPERATIVO,
    cuentaDebeCodigo: '6106',
  });

  addEgresoPorMetodo({
    prefix: 'COMPRA-INSUMOS',
    nombre: 'Compra de insumos de operación',
    origenes: [
      OrigenAsientoContable.MOVIMIENTO_FINANCIERO,
      OrigenAsientoContable.COMPRA,
    ],
    motivo: MotivoMovimiento.COMPRA_INSUMOS,
    clasificacion: ClasificacionAdmin.GASTO_OPERATIVO,
    cuentaDebeCodigo: '6107',
  });

  addEgresoPorMetodo({
    prefix: 'PAGO-CREDITO',
    nombre: 'Pago de crédito y gasto financiero',
    origenes: [OrigenAsientoContable.MOVIMIENTO_FINANCIERO],
    motivo: MotivoMovimiento.PAGO_CREDITO,
    clasificacion: ClasificacionAdmin.GASTO_OPERATIVO,
    cuentaDebeCodigo: '6120',
  });

  addEgresoPorMetodo({
    prefix: 'OTRO-EGRESO',
    nombre: 'Otro egreso',
    origenes: [OrigenAsientoContable.MOVIMIENTO_FINANCIERO],
    motivo: MotivoMovimiento.OTRO_EGRESO,
    clasificacion: ClasificacionAdmin.GASTO_OPERATIVO,
    cuentaDebeCodigo: '6118',
  });

  addEgresoPorMetodo({
    prefix: 'COMPRA-MERCADERIA',
    nombre: 'Compra de mercadería',
    origenes: [
      OrigenAsientoContable.MOVIMIENTO_FINANCIERO,
      OrigenAsientoContable.COMPRA,
    ],
    motivo: MotivoMovimiento.COMPRA_MERCADERIA,
    clasificacion: ClasificacionAdmin.COSTO_VENTA,
    cuentaDebeCodigo: '1301',
    prioridad: 10,
  });

  addEgresoPorMetodo({
    prefix: 'COSTO-ASOCIADO',
    nombre: 'Costo asociado de compra',
    origenes: [
      OrigenAsientoContable.MOVIMIENTO_FINANCIERO,
      OrigenAsientoContable.COMPRA,
    ],
    motivo: MotivoMovimiento.COSTO_ASOCIADO,
    clasificacion: ClasificacionAdmin.COSTO_VENTA,
    cuentaDebeCodigo: '5102',
  });

  addEgresoPorMetodo({
    prefix: 'ANTICIPO-PROVEEDOR',
    nombre: 'Anticipo entregado a proveedor',
    origenes: [OrigenAsientoContable.MOVIMIENTO_FINANCIERO],
    motivo: MotivoMovimiento.ANTICIPO_PROVEEDOR,
    clasificacion: ClasificacionAdmin.COSTO_VENTA,
    cuentaDebeCodigo: '1401',
  });

  addEgresoPorMetodo({
    prefix: 'DEVOLUCION-CLIENTE',
    nombre: 'Devolución o contraventa a cliente',
    origenes: [OrigenAsientoContable.MOVIMIENTO_FINANCIERO],
    motivo: MotivoMovimiento.DEVOLUCION,
    clasificacion: ClasificacionAdmin.CONTRAVENTA,
    cuentaDebeCodigo: '5201',
  });

  addEgresoPorMetodo({
    prefix: 'VENTA-COSTO',
    nombre: 'Costo de venta automático',
    origenes: [OrigenAsientoContable.VENTA],
    motivo: MotivoMovimiento.VENTA,
    clasificacion: ClasificacionAdmin.COSTO_VENTA,
    cuentaDebeCodigo: '5101',
    prioridad: 30,
  });

  for (const origen of [
    OrigenAsientoContable.VENTA,
    OrigenAsientoContable.MOVIMIENTO_FINANCIERO,
  ]) {
    addRule({
      codigo: `${originPrefix(origen)}-VENTA-CREDITO`,
      nombre: 'Venta al crédito',
      origen,
      clasificacion: ClasificacionAdmin.INGRESO,
      motivo: MotivoMovimiento.VENTA_CREDITO,
      metodoPago: null,
      cuentaDebeCodigo: '1201',
      cuentaHaberCodigo: '4101',
      prioridad: 10,
    });

    addRule({
      codigo: `${originPrefix(origen)}-VENTA-CREDITO-METODO`,
      nombre: 'Venta al crédito con método crédito',
      origen,
      clasificacion: ClasificacionAdmin.INGRESO,
      motivo: MotivoMovimiento.VENTA_CREDITO,
      metodoPago: MetodoPago.CREDITO,
      cuentaDebeCodigo: '1201',
      cuentaHaberCodigo: '4101',
      prioridad: 10,
    });

    addRule({
      codigo: `${originPrefix(origen)}-VENTA-CREDITO-COSTO`,
      nombre: 'Costo de venta al crédito',
      origen,
      clasificacion: ClasificacionAdmin.COSTO_VENTA,
      motivo: MotivoMovimiento.VENTA_CREDITO,
      metodoPago: null,
      cuentaDebeCodigo: '5101',
      cuentaHaberCodigo: '1301',
      prioridad: 30,
    });

    addRule({
      codigo: `${originPrefix(origen)}-VENTA-CREDITO-COSTO-METODO`,
      nombre: 'Costo de venta al crédito con método crédito',
      origen,
      clasificacion: ClasificacionAdmin.COSTO_VENTA,
      motivo: MotivoMovimiento.VENTA_CREDITO,
      metodoPago: MetodoPago.CREDITO,
      cuentaDebeCodigo: '5101',
      cuentaHaberCodigo: '1301',
      prioridad: 30,
    });
  }

  addRule({
    codigo: 'CMP-MERCADERIA-CREDITO',
    nombre: 'Compra de mercadería al crédito',
    origen: OrigenAsientoContable.COMPRA,
    clasificacion: ClasificacionAdmin.COSTO_VENTA,
    motivo: MotivoMovimiento.COMPRA_MERCADERIA,
    metodoPago: MetodoPago.CREDITO,
    cuentaDebeCodigo: '1301',
    cuentaHaberCodigo: '2101',
    prioridad: 10,
  });

  addRule({
    codigo: 'CXP-DOC-MERCADERIA',
    nombre: 'Documento por pagar de mercadería',
    origen: OrigenAsientoContable.CXP_DOCUMENTO,
    clasificacion: ClasificacionAdmin.COSTO_VENTA,
    motivo: MotivoMovimiento.COMPRA_MERCADERIA,
    metodoPago: null,
    cuentaDebeCodigo: '1301',
    cuentaHaberCodigo: '2101',
    prioridad: 10,
  });

  addRule({
    codigo: 'CMP-INSUMOS-CREDITO',
    nombre: 'Compra de insumos al crédito',
    origen: OrigenAsientoContable.COMPRA,
    clasificacion: ClasificacionAdmin.GASTO_OPERATIVO,
    motivo: MotivoMovimiento.COMPRA_INSUMOS,
    metodoPago: MetodoPago.CREDITO,
    cuentaDebeCodigo: '6107',
    cuentaHaberCodigo: '2101',
    prioridad: 20,
  });

  addRule({
    codigo: 'CXP-DOC-INSUMOS',
    nombre: 'Documento por pagar de insumos',
    origen: OrigenAsientoContable.CXP_DOCUMENTO,
    clasificacion: ClasificacionAdmin.GASTO_OPERATIVO,
    motivo: MotivoMovimiento.COMPRA_INSUMOS,
    metodoPago: null,
    cuentaDebeCodigo: '6107',
    cuentaHaberCodigo: '2101',
    prioridad: 20,
  });

  addRule({
    codigo: 'CMP-COSTO-ASOCIADO-CREDITO',
    nombre: 'Costo asociado de compra al crédito',
    origen: OrigenAsientoContable.COMPRA,
    clasificacion: ClasificacionAdmin.COSTO_VENTA,
    motivo: MotivoMovimiento.COSTO_ASOCIADO,
    metodoPago: MetodoPago.CREDITO,
    cuentaDebeCodigo: '5102',
    cuentaHaberCodigo: '2101',
    prioridad: 20,
  });

  addRule({
    codigo: 'CXP-DOC-COSTO-ASOCIADO',
    nombre: 'Documento por pagar de costo asociado',
    origen: OrigenAsientoContable.CXP_DOCUMENTO,
    clasificacion: ClasificacionAdmin.COSTO_VENTA,
    motivo: MotivoMovimiento.COSTO_ASOCIADO,
    metodoPago: null,
    cuentaDebeCodigo: '5102',
    cuentaHaberCodigo: '2101',
    prioridad: 20,
  });

  addRule({
    codigo: 'MF-DEPOSITO-CIERRE',
    nombre: 'Depósito de cierre de caja',
    origen: OrigenAsientoContable.MOVIMIENTO_FINANCIERO,
    clasificacion: ClasificacionAdmin.TRANSFERENCIA,
    motivo: MotivoMovimiento.DEPOSITO_CIERRE,
    metodoPago: null,
    cuentaDebeCodigo: '1102',
    cuentaHaberCodigo: '1101',
    prioridad: 10,
  });

  addRule({
    codigo: 'MF-CAJA-A-BANCO',
    nombre: 'Transferencia de caja a banco',
    origen: OrigenAsientoContable.MOVIMIENTO_FINANCIERO,
    clasificacion: ClasificacionAdmin.TRANSFERENCIA,
    motivo: MotivoMovimiento.CAJA_A_BANCO,
    metodoPago: null,
    cuentaDebeCodigo: '1102',
    cuentaHaberCodigo: '1101',
    prioridad: 10,
  });

  addRule({
    codigo: 'MF-BANCO-A-CAJA',
    nombre: 'Transferencia de banco a caja',
    origen: OrigenAsientoContable.MOVIMIENTO_FINANCIERO,
    clasificacion: ClasificacionAdmin.TRANSFERENCIA,
    motivo: MotivoMovimiento.BANCO_A_CAJA,
    metodoPago: null,
    cuentaDebeCodigo: '1101',
    cuentaHaberCodigo: '1102',
    prioridad: 10,
  });

  addRule({
    codigo: 'MF-DEPOSITO-PROVEEDOR',
    nombre: 'Depósito o anticipo a proveedor desde caja',
    origen: OrigenAsientoContable.MOVIMIENTO_FINANCIERO,
    clasificacion: ClasificacionAdmin.COSTO_VENTA,
    motivo: MotivoMovimiento.DEPOSITO_PROVEEDOR,
    metodoPago: null,
    cuentaDebeCodigo: '1401',
    cuentaHaberCodigo: '1101',
    prioridad: 20,
  });

  addRule({
    codigo: 'MF-PAGO-PROVEEDOR-BANCO',
    nombre: 'Pago a proveedor por banco',
    origen: OrigenAsientoContable.MOVIMIENTO_FINANCIERO,
    clasificacion: ClasificacionAdmin.COSTO_VENTA,
    motivo: MotivoMovimiento.PAGO_PROVEEDOR_BANCO,
    metodoPago: null,
    cuentaDebeCodigo: '2101',
    cuentaHaberCodigo: '1102',
    prioridad: 10,
  });

  addRule({
    codigo: 'MF-PAGO-PROVEEDOR-EFECTIVO',
    nombre: 'Pago a proveedor en efectivo',
    origen: OrigenAsientoContable.MOVIMIENTO_FINANCIERO,
    clasificacion: ClasificacionAdmin.COSTO_VENTA,
    motivo: MotivoMovimiento.PAGO_PROVEEDOR_EFECTIVO,
    metodoPago: null,
    cuentaDebeCodigo: '2101',
    cuentaHaberCodigo: '1101',
    prioridad: 10,
  });

  addRule({
    codigo: 'CXP-PAGO-BANCO',
    nombre: 'Pago de cuenta por pagar por banco',
    origen: OrigenAsientoContable.CXP_PAGO,
    clasificacion: ClasificacionAdmin.COSTO_VENTA,
    motivo: MotivoMovimiento.PAGO_PROVEEDOR_BANCO,
    metodoPago: null,
    cuentaDebeCodigo: '2101',
    cuentaHaberCodigo: '1102',
    prioridad: 10,
  });

  addRule({
    codigo: 'CXP-PAGO-EFECTIVO',
    nombre: 'Pago de cuenta por pagar en efectivo',
    origen: OrigenAsientoContable.CXP_PAGO,
    clasificacion: ClasificacionAdmin.COSTO_VENTA,
    motivo: MotivoMovimiento.PAGO_PROVEEDOR_EFECTIVO,
    metodoPago: null,
    cuentaDebeCodigo: '2101',
    cuentaHaberCodigo: '1101',
    prioridad: 10,
  });

  addRule({
    codigo: 'MF-AJUSTE-SOBRANTE',
    nombre: 'Ajuste por sobrante de caja',
    origen: OrigenAsientoContable.MOVIMIENTO_FINANCIERO,
    clasificacion: ClasificacionAdmin.AJUSTE,
    motivo: MotivoMovimiento.AJUSTE_SOBRANTE,
    metodoPago: null,
    cuentaDebeCodigo: '1101',
    cuentaHaberCodigo: '4103',
    prioridad: 10,
  });

  addRule({
    codigo: 'MF-AJUSTE-FALTANTE',
    nombre: 'Ajuste por faltante de caja',
    origen: OrigenAsientoContable.MOVIMIENTO_FINANCIERO,
    clasificacion: ClasificacionAdmin.AJUSTE,
    motivo: MotivoMovimiento.AJUSTE_FALTANTE,
    metodoPago: null,
    cuentaDebeCodigo: '7101',
    cuentaHaberCodigo: '1101',
    prioridad: 10,
  });

  addRule({
    codigo: 'AJ-STOCK-FALTANTE',
    nombre: 'Ajuste de inventario por faltante',
    origen: OrigenAsientoContable.AJUSTE_STOCK,
    clasificacion: ClasificacionAdmin.AJUSTE,
    motivo: MotivoMovimiento.AJUSTE_FALTANTE,
    metodoPago: null,
    cuentaDebeCodigo: '7101',
    cuentaHaberCodigo: '1301',
    prioridad: 20,
  });

  addRule({
    codigo: 'AJ-STOCK-SOBRANTE',
    nombre: 'Ajuste de inventario por sobrante',
    origen: OrigenAsientoContable.AJUSTE_STOCK,
    clasificacion: ClasificacionAdmin.AJUSTE,
    motivo: MotivoMovimiento.AJUSTE_SOBRANTE,
    metodoPago: null,
    cuentaDebeCodigo: '1301',
    cuentaHaberCodigo: '4103',
    prioridad: 20,
  });

  return rules;
}

async function upsertAccounts(tx: Tx) {
  const created = new Map<string, { id: number; codigo: string }>();

  for (const account of accounts) {
    const parent = account.cuentaPadreCodigo
      ? created.get(account.cuentaPadreCodigo)
      : null;

    if (account.cuentaPadreCodigo && !parent) {
      throw new Error(
        `Cuenta padre no encontrada para ${account.codigo}: ${account.cuentaPadreCodigo}`,
      );
    }

    const saved = await tx.cuentaContable.upsert({
      where: { codigo: account.codigo },
      create: {
        codigo: account.codigo,
        nombre: account.nombre,
        tipo: account.tipo,
        naturaleza: account.naturaleza,
        nivel: account.nivel,
        permiteMovimiento: account.permiteMovimiento,
        activa: account.activa ?? true,
        cuentaPadreId: parent?.id ?? null,
      },
      update: {
        nombre: account.nombre,
        tipo: account.tipo,
        naturaleza: account.naturaleza,
        nivel: account.nivel,
        permiteMovimiento: account.permiteMovimiento,
        activa: account.activa ?? true,
        cuentaPadreId: parent?.id ?? null,
      },
      select: {
        id: true,
        codigo: true,
      },
    });

    created.set(saved.codigo, saved);
  }

  return created;
}

async function upsertRules(
  tx: Tx,
  accountMap: Map<string, { id: number; codigo: string }>,
) {
  const rules = buildRules();

  for (const rule of rules) {
    const cuentaDebe = accountMap.get(rule.cuentaDebeCodigo);
    const cuentaHaber = accountMap.get(rule.cuentaHaberCodigo);

    if (!cuentaDebe) {
      throw new Error(
        `Cuenta debe no encontrada para regla ${rule.codigo}: ${rule.cuentaDebeCodigo}`,
      );
    }

    if (!cuentaHaber) {
      throw new Error(
        `Cuenta haber no encontrada para regla ${rule.codigo}: ${rule.cuentaHaberCodigo}`,
      );
    }

    await tx.reglaContable.upsert({
      where: { codigo: rule.codigo },
      create: {
        codigo: rule.codigo,
        nombre: rule.nombre,
        descripcion: rule.descripcion ?? null,
        origen: rule.origen,
        clasificacion: rule.clasificacion ?? null,
        motivo: rule.motivo ?? null,
        metodoPago: rule.metodoPago ?? null,
        cuentaDebeId: cuentaDebe.id,
        cuentaHaberId: cuentaHaber.id,
        usaCentroCosto: false,
        usaPartidaPresupuestal: false,
        activa: rule.activa ?? true,
        prioridad: rule.prioridad ?? 50,
      },
      update: {
        nombre: rule.nombre,
        descripcion: rule.descripcion ?? null,
        origen: rule.origen,
        clasificacion: rule.clasificacion ?? null,
        motivo: rule.motivo ?? null,
        metodoPago: rule.metodoPago ?? null,
        cuentaDebeId: cuentaDebe.id,
        cuentaHaberId: cuentaHaber.id,
        usaCentroCosto: false,
        usaPartidaPresupuestal: false,
        activa: rule.activa ?? true,
        prioridad: rule.prioridad ?? 50,
      },
    });
  }

  return rules.length;
}

async function main() {
  console.log('Iniciando seed contable base');

  const result = await prisma.$transaction(
    async (tx) => {
      const accountMap = await upsertAccounts(tx);
      const rulesCount = await upsertRules(tx, accountMap);

      return {
        accountsCount: accountMap.size,
        rulesCount,
      };
    },
    {
      maxWait: 10_000,
      timeout: 120_000,
    },
  );

  console.log(`Cuentas contables procesadas: ${result.accountsCount}`);
  console.log(`Reglas contables procesadas: ${result.rulesCount}`);
  console.log('Seed contable finalizada');
}

main()
  .catch((error) => {
    console.error('Error ejecutando seed contable');
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
