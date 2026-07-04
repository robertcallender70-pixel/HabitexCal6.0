
import React from 'react';
import { ActivityType } from './types';
import type { HormigonData, AceroData, PredefinedLaborActivity } from './types';

export const APP_VERSION = "6.5";

export const HORMIGONES_DATA: HormigonData[] = [
    { resistencia: 100, cemento: 6.0, arena: 0.54, piedra: 1.08, agua: 180 },
    { resistencia: 150, cemento: 7.2, arena: 0.55, piedra: 0.88, agua: 195 },
    { resistencia: 175, cemento: 8.0, arena: 0.60, piedra: 0.72, agua: 205 },
    { resistencia: 210, cemento: 8.5, arena: 0.52, piedra: 0.78, agua: 210 },
    { resistencia: 250, cemento: 9.5, arena: 0.44, piedra: 0.73, agua: 225 },
    { resistencia: 300, cemento: 11.0, arena: 0.33, piedra: 0.66, agua: 230 },
];

export const ACERO_BARRAS_DATA: AceroData[] = [
    { barra: 2, pulgadas: '1/4"', mm: 6.0, pesoUnit: 0.249, area: 0.317 },
    { barra: 3, pulgadas: '3/8"', mm: 9.5, pesoUnit: 0.56, area: 0.713 },
    { barra: 4, pulgadas: '1/2"', mm: 12.7, pesoUnit: 0.994, area: 1.267 },
    { barra: 5, pulgadas: '5/8"', mm: 15.9, pesoUnit: 1.552, area: 1.979 },
    { barra: 6, pulgadas: '3/4"', mm: 19.1, pesoUnit: 2.235, area: 2.85 },
    { barra: 8, pulgadas: '1"', mm: 25.4, pesoUnit: 3.973, area: 5.06 },
    { barra: 10, pulgadas: '1 1/4"', mm: 32.3, pesoUnit: 6.404, area: 7.92 },
    { barra: 11, pulgadas: '1 3/8"', mm: 35.8, pesoUnit: 7.907, area: 11.4 },
];

export const MORTEROS_MUROS_DATA = [
    { id: 'ladrillo_0.30', nombre: 'Ladrillos de 0.30m', unidades: 105, cemento: 0.55, arena: 0.079, polvoPiedra: 0.047 },
    { id: 'ladrillo_0.15', nombre: 'Ladrillos de 0.15m', unidades: 53, cemento: 0.35, arena: 0.405, polvoPiedra: 0.021 },
    { id: 'ladrillo_0.10', nombre: 'Ladrillos de 0.10m', unidades: 32, cemento: 0.375, arena: 0.032, polvoPiedra: 0 },
    { id: 'bloque_0.20', nombre: 'Bloque de 0.20m (20x40)', unidades: 13, cemento: 0.168, arena: 0.019, polvoPiedra: 0.01 },
    { id: 'bloque_0.15', nombre: 'Bloque de 0.15m (15x40)', unidades: 13, cemento: 0.126, arena: 0.015, polvoPiedra: 0.007 },
    { id: 'bloque_0.10', nombre: 'Bloque de 0.10m (10x40)', unidades: 13, cemento: 0.15, arena: 0.013, polvoPiedra: 0 },
];

export const MORTEROS_REVESTIMIENTO_DATA = [
    { id: 'resano', nombre: 'Resano', cemento: 0.08, arena: 0.04, polvoPiedra: 0.01 },
    { id: 'betun_fino', nombre: 'Betún y Fino', cemento: 0.05, arena: 0.16, polvoPiedra: 0.005 },
    { id: 'rustico', nombre: 'Rústico', cemento: 0.35, arena: 0.045, polvoPiedra: 0 },
    { id: 'salpicado', nombre: 'Salpicado', cemento: 0.06, arena: 0.015, polvoPiedra: 0 },
];

// Estimaciones teóricas para referencia (MPa basadas en resultados reales)
export const DOSIFICACIONES_REFERENCIA = [
    { ratio: '1:3:6', mpa: 100, nombre: 'Hormigón de Limpieza', uso: ['Hormigón de limpieza', 'Cimientos no estructurales', 'Rellenos'], factores: { cemento: 6.0, arena: 0.54, piedra: 1.08, agua: 180 } },
    { ratio: '1:2.5:4', mpa: 150, nombre: 'Hormigón Pobre / Contrapisos', uso: ['Aceras', 'Contrapisos', 'Bordillos'], factores: { cemento: 7.2, arena: 0.55, piedra: 0.88, agua: 195 } },
    { ratio: '1:2.5:3', mpa: 175, nombre: 'Hormigón de Retención / Estructural Bajo', uso: ['Zapata de muros', 'Soleras', 'Dinteles'], factores: { cemento: 8.0, arena: 0.60, piedra: 0.72, agua: 205 } },
    { ratio: '1:2:3', mpa: 210, nombre: 'Hormigón Estructural Estándar', uso: ['Columnas', 'Vigas', 'Losas', 'Zapata de cimientos'], factores: { cemento: 8.5, arena: 0.52, piedra: 0.78, agua: 210 } },
    { ratio: '1:1.5:2.5', mpa: 250, nombre: 'Hormigón de Alta Resistencia', uso: ['Estructuras de carga', 'Losas de tráfico', 'Preesforzados'], factores: { cemento: 9.5, arena: 0.44, piedra: 0.73, agua: 225 } },
    { ratio: '1:1:2', mpa: 300, nombre: 'Hormigón de Muy Alta Resistencia', uso: ['Depósitos de agua', 'Zonas de alta presión', 'Muros de contención'], factores: { cemento: 11.0, arena: 0.33, piedra: 0.66, agua: 230 } },
];

export const MORTEROS_PISO_DATA = [
    { id: 'piso_ceramica', nombre: 'Piso de Cerámica/Losa (Personalizado)', unidades: 0, cemento: 0.138, arena: 0.02, polvoPiedra: 0.011 },
    { id: 'rodapie_8x25', nombre: 'Rodapie 0.08x0.25m', unidades: 4.2, cemento: 0.211, arena: 0.018, polvoPiedra: 0 },
    { id: 'cemento_pulido', nombre: 'Piso de Cemento Pulido (3cm)', unidades: 0, cemento: 0.425, arena: 0.036, polvoPiedra: 0 },
    { id: 'canto_50x30', nombre: 'Canto 0.50x0.30m', unidades: 7, cemento: 0.126, arena: 0.015, polvoPiedra: 0 },
];


export const PINTURA_DATA = {
    vinyl_lisa: 0.17, // lt/m2
    vinyl_rustico: 0.6138, // lt/m2
    aceite_aparejo: 0.1, // lt/m2
    aceite_pintura: 0.085, // lt/m2
    lechada_cal: 0.8, // lt/m2
    lechada_masilla: 0.22, // lt/m2
};

export const ENCHAPE_DATA = {
    cemento_cola: 5, // kg/m2
    cemento_blanco: 0.5, // kg/m2
};

export const PLADUR_PARED_DATA = {
    placa: 2.0, // m²/m² (ambas caras)
    montante: 2.8, // m/m²
    canal: 0.9, // m/m²
    tornilloPlaca: 55, // u/m²
    tornilloFijacion: 9, // u/m²
    cintaJuntas: 2.2, // m/m²
    pastaJuntas: 0.9, // kg/m²
};

export const PLADUR_TECHO_DATA = {
    placa: 1.05, // m²/m² (con desperdicio)
    perfilSecundario: 2.5, // m/m²
    perfilPrimario: 1.0, // m/m²
    cuelgues: 1.2, // u/m²
    tornilloPlaca: 28, // u/m²
    tornilloPerfil: 4, // u/m²
    fijacionCuelgue: 1.5, // u/m²
    cintaJuntas: 1.5, // m/m²
    pastaJuntas: 0.7, // kg/m²
};

export const PREDEFINED_LABOR_ACTIVITIES: PredefinedLaborActivity[] = [
    { id: 1, name: "Excavacion en Fozo Roca Blanda o Barro", unit: "M3", priceUSD: 4.17, category: "excavation" },
    { id: 2, name: "Excavacion en Fozo Roca Dura", unit: "M3", priceUSD: 6.25, category: "excavation" },
    { id: 3, name: "Excavacion en Zanja Roca Blanda o Barro", unit: "M3", priceUSD: 4.17, category: "excavation" },
    { id: 4, name: "Excavacion en Zanja Roca Dura", unit: "M3", priceUSD: 6.25, category: "excavation" },
    { id: 5, name: "Contrucción de Cimientos Aislados (Todo)", unit: "U", priceUSD: 6.25, category: "construction", materialActivityType: ActivityType.CIMENTACION_AISLADA },
    { id: 6, name: "Contrucción de Columna (Todo)", unit: "m", priceUSD: 6.25, category: "construction", materialActivityType: ActivityType.COLUMNA },
    { id: 7, name: "Contrucción de Cerramentos y Dinteles (Todo)", unit: "m", priceUSD: 6.25, category: "construction", materialActivityType: ActivityType.VIGA },
    { id: 8, name: "Contrucción de Losa (Todo)", unit: "m2", priceUSD: 8.33, category: "construction", materialActivityType: ActivityType.LOSA },
    { id: 9, name: "Contrucción de Escaleras (Todo)", unit: "Huella", priceUSD: 8.33, category: "construction" },
    { id: 10, name: "Contrucción de Aceras (todo)", unit: "m2", priceUSD: 5.21, category: "construction" },
    { id: 11, name: "Contrucción de Pisos Morteros u Hormigón simple", unit: "m2", priceUSD: 4.17, category: "construction", materialActivityType: ActivityType.PISO },
    { id: 12, name: "Colocacación Bloque 0.10m-0.15m", unit: "U", priceUSD: 0.19, category: "construction", materialActivityType: ActivityType.LEVANTE_MURO },
    { id: 13, name: "Colocacación Bloque 0.20m", unit: "U", priceUSD: 0.21, category: "construction", materialActivityType: ActivityType.LEVANTE_MURO },
    { id: 14, name: "Colocacación Bloque Ladrillos", unit: "U", priceUSD: 0.13, category: "construction", materialActivityType: ActivityType.LEVANTE_MURO },
    { id: 15, name: "Colocacación Celocias", unit: "U", priceUSD: 0.13, category: "construction" },
    { id: 16, name: "Colocacación Balaustres", unit: "U", priceUSD: 0.21, category: "construction" },
    { id: 17, name: "Repique placa", unit: "m2", priceUSD: 1.04, category: "finishing" },
    { id: 18, name: "Salpicado Pared", unit: "m2", priceUSD: 0.83, category: "finishing", materialActivityType: ActivityType.REVESTIMIENTO },
    { id: 19, name: "Resano Pared", unit: "m2", priceUSD: 1.25, category: "finishing", materialActivityType: ActivityType.REVESTIMIENTO },
    { id: 20, name: "Fino Pared", unit: "m2", priceUSD: 1.46, category: "finishing", materialActivityType: ActivityType.REVESTIMIENTO },
    { id: 21, name: "Estuco", unit: "m2", priceUSD: 1.67, category: "finishing" },
    { id: 22, name: "Salpicado Techo", unit: "m2", priceUSD: 1.04, category: "finishing", materialActivityType: ActivityType.REVESTIMIENTO },
    { id: 23, name: "Resano Techo", unit: "m2", priceUSD: 1.67, category: "finishing", materialActivityType: ActivityType.REVESTIMIENTO },
    { id: 24, name: "Fino Techo", unit: "m2", priceUSD: 1.88, category: "finishing", materialActivityType: ActivityType.REVESTIMIENTO },
    { id: 25, name: "Colocación de Ventanas", unit: "m2", priceUSD: 1.04, category: "construction" },
    { id: 26, name: "Colocación de Puerta", unit: "m2", priceUSD: 14.58, category: "construction" },
    { id: 27, name: "Demolición Muros de Bloques", unit: "M2", priceUSD: 2.08, category: "demolition" },
    { id: 28, name: "Desmonte de Puerta", unit: "U", priceUSD: 2.08, category: "demolition" },
    { id: 29, name: "Desmonte de Ventana", unit: "U", priceUSD: 2.08, category: "demolition" },
    { id: 30, name: "Desmonte de Marco de Puerta", unit: "U", priceUSD: 6.25, category: "demolition" },
    { id: 31, name: "Desmonte de Marco de Ventana", unit: "U", priceUSD: 4.17, category: "demolition" },
    { id: 32, name: "Desmonte de Tejas y otros", unit: "M2", priceUSD: 0.63, category: "demolition" },
    { id: 33, name: "Cerrar Hueco de Puerta", unit: "U", priceUSD: 10.42, category: "construction" },
    { id: 34, name: "Cerrar Hueco de Ventana", unit: "U", priceUSD: 12.50, category: "construction" },
    { id: 35, name: "Abrir Hueco para Puerta Estandar", unit: "U", priceUSD: 10.42, category: "construction" },
    { id: 36, name: "Abrir Hueco para Ventana", unit: "U", priceUSD: 6.25, category: "construction" },
    { id: 37, name: "Enchape com Cerámica", unit: "M2", priceUSD: 6.25, category: "finishing", materialActivityType: ActivityType.ENCHAPE_PARED },
    { id: 38, name: "Enchape com Marmol", unit: "M3", priceUSD: 8.33, category: "finishing" },
    { id: 39, name: "Enchape de Losas en Escalera", unit: "M2", priceUSD: 7.29, category: "finishing" },
    { id: 40, name: "Colocación de Rodapie", unit: "m", priceUSD: 0.83, category: "finishing" },
    { id: 41, name: "Montaje de Puerta de Corredera", unit: "U", priceUSD: 10.42, category: "construction" },
    { id: 42, name: "Movimiento de Materiales a Vagón", unit: "M3", priceUSD: 5.21, category: "construction" },
    { id: 43, name: "Demolición de Enchape", unit: "M2", priceUSD: 1.04, category: "demolition" },
    { id: 44, name: "Demolición de Repello Pared", unit: "M2", priceUSD: 0.83, category: "demolition" },
    { id: 45, name: "Demolición de Repello Techo", unit: "M2", priceUSD: 1.25, category: "demolition" },
    { id: 46, name: "Demolición de Pisos", unit: "M2", priceUSD: 2.08, category: "demolition" },
    { id: 47, name: "Demolición de Hormigón", unit: "M2", priceUSD: 4.17, category: "demolition" },
    { id: 48, name: "Limpiza y Sellado de Juntas de Rasillas", unit: "M2", priceUSD: 1.25, category: "finishing" },
    { id: 49, name: "Limpiza y Sellado de Juntas de Pisos", unit: "M2", priceUSD: 0.63, category: "finishing" },
    { id: 50, name: "Montaje de Estructura y Tejas com Gancho en Techos", unit: "M2", priceUSD: 4.17, category: "construction" },
    { id: 51, name: "Montaje de Estructura y Tejas com Tornillos en Techos", unit: "M2", priceUSD: 4.17, category: "construction" },
    { id: 52, name: "Colocación de Accesorios de Baños", unit: "Conjunto", priceUSD: 6.25, category: "plumbing" },
    { id: 53, name: "Colocación de Llaves de Lavamanos", unit: "U", priceUSD: 3.13, category: "plumbing" },
    { id: 54, name: "Montaje de Presurizador según Complejidad", unit: "C/U", priceUSD: 12.50, category: "plumbing" },
    { id: 55, name: "Montajes de Calentadores", unit: "C/U", priceUSD: 14.58, category: "plumbing" },
    { id: 56, name: "Montaje de Tasas de Baños", unit: "U", priceUSD: 7.29, category: "plumbing" },
    { id: 57, name: "Colocación de Lavamanos", unit: "U", priceUSD: 4.17, category: "plumbing" },
    { id: 58, name: "Construcción de Base y colocacón de Lavadero", unit: "U", priceUSD: 10.42, category: "plumbing" },
    { id: 59, name: "Colocación de Mezcladora y Duchas", unit: "C/U", priceUSD: 6.25, category: "plumbing" },
    { id: 60, name: "Colocación de Herrajes de Tasas de Baños", unit: "Juego", priceUSD: 5.21, category: "plumbing" },
    { id: 61, name: "Colocación de Sifas de Lavamanos", unit: "U", priceUSD: 3.13, category: "plumbing" },
    { id: 62, name: "Plomeria completa de Agua fria y caliente de Baño com Termofusión", unit: "U", priceUSD: 104.17, category: "plumbing" },
    { id: 63, name: "Plomeria completa de Agua fria y caliente de Baño com Rosca", unit: "U", priceUSD: 93.75, category: "plumbing" },
    { id: 64, name: "Plomeria completa de Sanitaria estandar completa Baños", unit: "U", priceUSD: 125.00, category: "plumbing" },
    { id: 65, name: "Colocación de Tanque Plastico de +750 lts com Base en Placa", unit: "U", priceUSD: 20.83, category: "plumbing" },
    { id: 66, name: "Colocación de Tanque Fibrocemento de +750 lts com Base en Placa", unit: "U", priceUSD: 31.25, category: "plumbing" },
    { id: 67, name: "Pintura en Pared (Todas las Manos)", unit: "m2", priceUSD: 0.63, category: "finishing", materialActivityType: ActivityType.PINTURA },
    { id: 68, name: "Pintura en Techo (Todas las Manos)", unit: "m2", priceUSD: 0.83, category: "finishing", materialActivityType: ActivityType.PINTURA },
    { id: 69, name: "Limpieza de Pared", unit: "m2", priceUSD: 0.31, category: "finishing" },
    { id: 70, name: "Carga y Descaraga de Bloques", unit: "U", priceUSD: 0.01, category: "construction" },
    { id: 71, name: "Movimiento de Materiales en saco", unit: "u", priceUSD: 0.21, category: "construction" },
    { id: 72, name: "Ranuras en paredes, pisos o techos", unit: "m", priceUSD: 0.42, category: "construction" },
    { id: 73, name: "Colocación de mangueras o tuberias", unit: "m", priceUSD: 0.42, category: "plumbing" },
    { id: 74, name: "Tape de ranuras", unit: "m", priceUSD: 0.42, category: "construction" },
    { id: 75, name: "Elaboración de codos", unit: "m", priceUSD: 0.42, category: "construction" },
    { id: 76, name: "Cajas 4 x 2", unit: "u", priceUSD: 0.42, category: "electrical" },
    { id: 77, name: "Cajas 4 x 4", unit: "u", priceUSD: 0.42, category: "electrical" },
    { id: 78, name: "Alquiler de Winche", unit: "xm3", priceUSD: 10.42, category: "construction" },
    { id: 79, name: "Alquiler de Concretera", unit: "Día", priceUSD: 20.83, category: "construction" },
    { id: 80, name: "Identificación de circuitos y exploracion electrica", unit: "xU", priceUSD: 4.17, category: "electrical" },
    { id: 81, name: "Eliminación de circuitos", unit: "m", priceUSD: 0.10, category: "electrical" },
    { id: 82, name: "Alambrado com cable 2.5, 4 mm", unit: "m", priceUSD: 0.21, category: "electrical" },
    { id: 83, name: "Alambrado com cable 10 mm", unit: "m", priceUSD: 0.31, category: "electrical" },
    { id: 84, name: "Alambrado com cable 25 mm", unit: "m", priceUSD: 0.73, category: "electrical" },
    { id: 85, name: "Alambrado com cable 35 mm", unit: "m", priceUSD: 0.83, category: "electrical" },
    { id: 86, name: "Desconexión de Dispositivos", unit: "u", priceUSD: 0.10, category: "electrical" },
    { id: 87, name: "Desconexión de Luminarias", unit: "u", priceUSD: 0.21, category: "electrical" },
    { id: 88, name: "Conexión de Interruptores Simples", unit: "u", priceUSD: 0.42, category: "electrical" },
    { id: 89, name: "Conexión de Interruptores Dobles", unit: "u", priceUSD: 0.42, category: "electrical" },
    { id: 90, name: "Conexión de Interruptrores Triples", unit: "u", priceUSD: 0.63, category: "electrical" },
    { id: 91, name: "Conexión de Interruptores 3Way", unit: "u", priceUSD: 0.83, category: "electrical" },
    { id: 92, name: "Conexión de Interruptores 4Way", unit: "u", priceUSD: 0.94, category: "electrical" },
    { id: 93, name: "Conexión de Tomacorrientes Simples", unit: "u", priceUSD: 0.42, category: "electrical" },
    { id: 94, name: "Conexión de Tomacorrientes Dobles", unit: "u", priceUSD: 0.42, category: "electrical" },
    { id: 95, name: "Conexión de Interruptores / Tc", unit: "u", priceUSD: 0.63, category: "electrical" },
    { id: 96, name: "Colocación de sokes", unit: "u", priceUSD: 0.42, category: "electrical" },
    { id: 97, name: "Luminarias simples", unit: "u", priceUSD: 0.73, category: "electrical" },
    { id: 98, name: "Luminarias dobles", unit: "u", priceUSD: 0.83, category: "electrical" },
    { id: 99, name: "Luminarias decorativas", unit: "u", priceUSD: 2.08, category: "electrical" },
    { id: 100, name: "Luminarias com ventiladores de techo", unit: "u", priceUSD: 3.13, category: "electrical" },
    { id: 101, name: "Empotramiento del panel", unit: "u", priceUSD: 2.08, category: "electrical" },
    { id: 102, name: "Paneles elecricos adosados", unit: "u", priceUSD: 1.25, category: "electrical" },
    { id: 103, name: "Conexión de breaker", unit: "u", priceUSD: 0.63, category: "electrical" },
    { id: 104, name: "Colocación y Conexión de supresores", unit: "u", priceUSD: 0.83, category: "electrical" },
    { id: 105, name: "Colocación y Conexión de differentials", unit: "u", priceUSD: 1.46, category: "electrical" }
];


// Icons
export const PlusIcon = (props: any) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
    </svg>
);

export const TrashIcon = (props: any) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.124-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.077-2.09.921-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
    </svg>
);

export const PencilIcon = (props: any) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
    </svg>
);

export const ChevronDownIcon = (props: any) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
    </svg>
);

export const ArrowLeftIcon = (props: any) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
    </svg>
);

export const PdfIcon = (props: any) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
    </svg>
);

export const ArrowDownTrayIcon = (props: any) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
    </svg>
);

export const ArrowUpTrayIcon = (props: any) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" />
    </svg>
);

export const LogoIcon = (props: any) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 12 l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h7.5" />
    </svg>
);

export const BanknotesIcon = (props: any) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0 1 15.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 0 1 3 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 0 0-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 0 1-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 0 0 3 15h-.75M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm3 0h.008v.008H18V10.5Zm-12 0h.008v.008H6V10.5Z" />
    </svg>
);

export const ArrowTrendingUpIcon = (props: any) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 18 9-9 4.5 4.5L21.75 6" />
    </svg>
);

export const ArrowTrendingDownIcon = (props: any) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 6 9 9 4.5-4.5L21.75 18" />
    </svg>
);

export const ScaleIcon = (props: any) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v17.25m0 0c-1.472 0-2.882.265-4.185.75M12 20.25c1.472 0 2.882.265 4.185.75M18.75 4.97A48.416 48.416 0 0 0 12 4.5c-2.291 0-4.545.16-6.75.47m13.5 0c1.01.143 2.01.317 3 .52m-3-.52v16.5m-1.5-16.5v16.5m-3-16.5v16.5m-1.5-16.5v16.5m-3-16.5v16.5m6.75-16.5H5.25c-1.12 0-2.016.9-2.016 2.016v12.016c0 1.12.9 2.016 2.016 2.016h13.5c1.12 0 2.016-.9 2.016-2.016V6.986c0-1.12-.9-2.016-2.016-2.016Z" />
    </svg>
);

export const CogIcon = (props: any) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M10.343 3.94c.09-.542.56-1.007 1.11-1.226l.55-.22a2.25 2.25 0 011.983 0l.55.22c.55.219 1.02.684 1.11 1.226l.09.542a2.25 2.25 0 003.956.494l.38-.38a2.25 2.25 0 013.182 3.182l-.38.38a2.25 2.25 0 00-.494 3.956l-.09.542c-.09.542-.56 1.007-1.11 1.226l-.55.22a2.25 2.25 0 01-1.983 0l-.55-.22c-.55-.219-1.02-.684-1.11-1.226l-.09-.542a2.25 2.25 0 00-3.956-.494l-.38.38a2.25 2.25 0 01-3.182-3.182l.38-.38a2.25 2.25 0 00.494-3.956l.09-.542z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
);

export const CubeIcon = (props: any) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="m21 7.5-9-5.25L3 7.5m18 0-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9" />
    </svg>
);

export const ShoppingCartIcon = (props: any) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 0 0-3 3h15.75m-12.75-3h11.218c.51 0 .962-.343 1.087-.835l1.823-6.839a.75.75 0 0 0-.142-.728l-3.64-3.642a.75.75 0 0 0-.53-.22H5.25m-2.5 0a.75.75 0 0 0-.75.75v11.25c0 .414.336.75.75.75h1.5a.75.75 0 0 0 .75-.75V3.75a.75.75 0 0 0-.75-.75h-1.5ZM17.25 14.25a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
    </svg>
);

export const EyeIcon = (props: any) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639l4.418-5.571a1.012 1.012 0 0 1 1.583 0l4.418 5.571a1.012 1.012 0 0 1 0 .639l-4.418 5.571a1.012 1.012 0 0 1-1.583 0l-4.418-5.571Z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
    </svg>
);

export const QuestionMarkCircleIcon = (props: any) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 5.25h.008v.008H12v-.008Z" />
    </svg>
);

export const CheckCircleIcon = (props: any) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
    </svg>
);

export const DocumentDuplicateIcon = (props: any) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 01-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 011.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 00-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 01-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 00-3.375-3.375h-1.5a1.125 1.125 0 01-1.125-1.125v-1.5a3.375 3.375 0 00-3.375-3.375H9.75" />
    </svg>
);
