
export enum ActivityType {
    CIMENTACION_AISLADA = 'Cimentación Aislada',
    ZAPATA_CORRIDA = 'Cimentación Corrida (Zapata)',
    COLUMNA = 'Columna',
    VIGA = 'Viga',
    LEVANTE_MURO = 'Levante de Muro',
    REVESTIMIENTO = 'Revestimiento',
    PISO = 'Piso',
    LOSA = 'Losa o Placa',
    PINTURA = 'Pintura',
    ENCHAPE_PARED = 'Enchape de Pared',
    ESTRUCTURA_PLADUR = 'Estructura de Pladur',
    CUSTOM = 'Actividad Personalizada',
    CUSTOM_MATERIAL_CALCULATION = 'Actividad de Material Personalizada',
}

export interface Project {
    id?: number;
    name: string;
    createdAt: Date;
    logisticsPercentage?: number;
    technicalAssistancePercentage?: number;
    toolsAndUtilitiesPercentage?: number;
    transportPercentage?: number;
    contingencyPercentage?: number;
    profitPercentage?: number;
    
    // New Service Tax fields
    hasServiceTax?: boolean;
    serviceTaxPercentage?: number;

    clientName?: string;
    clientAddress?: string;
    parentId?: number; // New field for hierarchy
    exchangeRate?: number; // For USD to MN conversion
}

export interface Activity {
    id?: number;
    projectId: number;
    type: ActivityType;
    name: string;
    inputs: Record<string, any>;
    results: Material[];
}

export interface Material {
    name: string;
    quantity: number;
    unit: string;
    unitPrice?: number; // Stored in USD
    layer?: string; // For multi-part activities like Revestimiento
    quantityAvailable?: number;
    quantityNeeded?: number;
}

export interface LaborItem {
    id?: number;
    projectId: number;
    name: string;
    unit: string;
    unitPrice: number; // Stored in USD
    quantity: number;
    quantityCompleted?: number;
}

export interface BudgetItem {
    id?: number;
    projectId: number;
    category: string;
    name: string; // Description of the expense
    cost: number; // Stored in USD
}

export enum TransactionType {
    INCOME = 'Ingreso',
    EXPENSE = 'Gasto',
}

export interface Transaction {
    id?: number;
    projectId: number;
    type: TransactionType;
    description: string;
    amount: number; // Stored in USD
    date: string; // YYYY-MM-DD
    category?: string;
}

export interface InventoryItem {
    id?: number;
    projectId: number;
    name: string;
    unit: string;
    quantityPurchased: number;
    quantityUsed: number;
    dateAdded: string; // YYYY-MM-DD
}

export interface PredefinedLaborActivity {
    id: number;
    name: string;
    unit: string;
    priceUSD: number; // Changed from priceMN
    category: string;
    materialActivityType?: ActivityType;
}


export interface HormigonData {
    resistencia: number;
    cemento: number;
    arena: number;
    piedra: number;
    agua: number;
}

export interface AceroData {
    barra: number;
    pulgadas: string;
    mm: number;
    pesoUnit: number;
    area: number;
}

export interface MorterosMurosData {
    id: string;
    nombre: string;
    unidades: number;
    cemento: number;
    arena: number;
    polvoPiedra: number;
}

export interface MorterosPisoData {
    id: string;
    nombre: string;
    unidades: number;
    cemento: number;
    arena: number;
    polvoPiedra: number;
}


export interface CertificationChildIncrement {
    projectId: number;
    projectName: string;
    incrementalValue: number; // Stored in USD
    anticipoDeduction: number; // Stored in USD
    finalBillableAmount: number; // Stored in USD
}

export interface CertificationSnapshot {
    // Real costs tracked up to this point
    completedLaborItems: LaborItem[];
    materialTransactions: Transaction[];
    transportTransactions: Transaction[];
    manualExpenseItems: Transaction[];
    
    completedLaborCost: number; // Stored in USD
    materialExpenseCost: number; // Stored in USD
    transportExpenseCost: number; // Stored in USD
    manualExpenseCost: number; // Stored in USD

    // Project's percentage settings at the time of certification
    logisticsPercentage: number;
    technicalAssistancePercentage: number;
    toolsAndUtilitiesPercentage?: number;
    profitPercentage: number;
    transportPercentage?: number;
    contingencyPercentage?: number;

    // Calculated costs based on the real costs and percentages
    logisticsCost: number; // Stored in USD
    technicalAssistanceCost: number; // Stored in USD
    toolsAndUtilitiesCost?: number; // Stored in USD
    profitCost: number; // Stored in USD
    
    // Tax
    hasServiceTax?: boolean;
    serviceTaxPercentage?: number;
    serviceTaxCost: number;

    grandTotal: number; // This is the CUMULATIVE total value of work & expenses, in USD

    totalAnticipoAtCertification: number; // Stored in USD
    totalBudgetAtCertification: number; // Stored in USD
    anticipoPercentage: number;
    incrementalValue: number; // Stored in USD
    anticipoDeduction: number; // Stored in USD
    finalBillableAmount: number; // Stored in USD
    
    // NEW TRACKING FIELDS
    cumulativeAnticipoDeducted: number; // Cumulative USD amortized
    cumulativeNetBillable: number; // Cumulative USD billed to client
    
    childIncrements?: CertificationChildIncrement[];
}


export interface Certification {
    id?: number;
    projectId: number;
    name: string;
    certifiedAt: string; // ISO Date string
    snapshot: CertificationSnapshot;
    invoicePdfBlob?: Blob;
    paymentTransactionId?: number;
    childProjectName?: string; // Optional field for consolidated view
    isAdvance?: boolean; // NEW: Flag for advance payment invoices
    advancePercentage?: number; // NEW: Stored percentage for advance
}

export interface InvoiceData {
    project: Project;
    companyInfo: {
        name: string;
        address: string;
        phone: string;
    };
    invoiceInfo: {
        invoiceNumber: string;
        clientName: string;
        clientAddress: string;
        date: string;
        signerName: string;
        signerTitle: string;
    };
    // The items to be billed in THIS invoice (in USD)
    billableItems: {
        description: string;
        quantity: number;
        unit: string;
        unitPrice: number; // In USD
        total: number; // In USD
    }[];
    // The total for THIS invoice (in USD)
    invoiceTotal: number;
    exchangeRate: number;
}


export interface OfferData {
    project: Project;
    companyInfo: {
        name: string;
        address: string;
        phone: string;
    };
    offerInfo: {
        offerNumber: string;
        clientName: string;
        clientAddress: string;
        date: string;
        validityDays: number;
        signerName: string;
        signerTitle: string;
    };
    totals: { // All totals are in USD
        material: number;
        labor: number;
        budget: number;
        serviceTax: number;
        grandTotal: number;
    };
    exchangeRate: number;
    laborItems: LaborItem[]; // Prices are in USD
    materials: Material[]; // Prices are in USD
    budgetItems: BudgetItem[]; // Costs are in USD
}

export type CustomActivityUnit = 'm' | 'm²' | 'm³' | 'unidad';

export interface CustomMaterial {
    materialName: string;
    unit: string;
    ratio: number; // Consumption per unitOfMeasure
}

export interface CustomMaterialActivity {
    id: string; // Unique ID (e.g., timestamp)
    name: string;
    unitOfMeasure: CustomActivityUnit;
    materials: CustomMaterial[];
    enabled?: boolean;
}

export interface CommercialUnitRule {
    id: string;
    materialName: string; // The name to match (substring).
    baseUnit: string;
    rule: 'ceil' | 'multiple-increment' | 'multiple-options' | 'best-fit-combination';
    increment?: number; // For `multiple-increment`
    options?: number[]; // For `multiple-options` and `best-fit-combination`
    selectedOption?: number; // The specific rebar length to use for calculation (e.g., 9)
    outputUnitFormat?: string; // A format string for the new unit, e.g., "barras de {option}m" or "cubetas de {increment}L"
}

export interface License {
    status: 'free' | 'pro';
    key?: string;
}
