import type { 
    Project, 
    Activity, 
    LaborItem, 
    BudgetItem, 
    Transaction,
    InventoryItem,
    Certification,
    CommercialUnitRule,
    License
} from '../types';
import { TransactionType } from '../types';
import { 
    PREDEFINED_LABOR_ACTIVITIES, HORMIGONES_DATA, ACERO_BARRAS_DATA, MORTEROS_MUROS_DATA,
    MORTEROS_REVESTIMIENTO_DATA, MORTEROS_PISO_DATA, PINTURA_DATA, ENCHAPE_DATA,
    PLADUR_PARED_DATA, PLADUR_TECHO_DATA
} from '../constants';

declare const idb: any;
const { openDB } = idb; // Use global idb from CDN

const DB_NAME = 'habitex-calcula-db';
const DB_VERSION = 9; // Incremented version for parentId index
const PROJECTS_STORE = 'projects';
const ACTIVITIES_STORE = 'activities';
const MATERIAL_PRICES_STORE = 'material_prices';
const LABOR_ITEMS_STORE = 'labor_items';
const BUDGET_ITEMS_STORE = 'budget_items';
const TRANSACTIONS_STORE = 'transactions';
const DATA_LIBRARY_STORE = 'data_library';
const INVENTORY_ITEMS_STORE = 'inventory_items';
const CERTIFICATIONS_STORE = 'certifications';

const ALL_STORES = [
    PROJECTS_STORE, 
    ACTIVITIES_STORE, 
    MATERIAL_PRICES_STORE, 
    LABOR_ITEMS_STORE, 
    BUDGET_ITEMS_STORE, 
    TRANSACTIONS_STORE,
    DATA_LIBRARY_STORE,
    INVENTORY_ITEMS_STORE,
    CERTIFICATIONS_STORE,
];


let dbPromise: any;

const initDB = () => {
    if (!dbPromise) {
        dbPromise = openDB(DB_NAME, DB_VERSION, {
            upgrade(db: any, oldVersion: number, newVersion: any, tx: any) {
                 if (oldVersion < 1) {
                    if (!db.objectStoreNames.contains(PROJECTS_STORE)) {
                        const projectStore = db.createObjectStore(PROJECTS_STORE, {
                            keyPath: 'id',
                            autoIncrement: true,
                        });
                        projectStore.createIndex('name', 'name');
                    }
                    if (!db.objectStoreNames.contains(ACTIVITIES_STORE)) {
                        const activityStore = db.createObjectStore(ACTIVITIES_STORE, {
                            keyPath: 'id',
                            autoIncrement: true,
                        });
                        activityStore.createIndex('projectId', 'projectId');
                    }
                }
                if (oldVersion < 2) {
                    if (!db.objectStoreNames.contains(MATERIAL_PRICES_STORE)) {
                        db.createObjectStore(MATERIAL_PRICES_STORE, { keyPath: ['name', 'unit'] });
                    }
                }
                if (oldVersion < 3) {
                    if (!db.objectStoreNames.contains(LABOR_ITEMS_STORE)) {
                         const laborStore = db.createObjectStore(LABOR_ITEMS_STORE, {
                            keyPath: 'id',
                            autoIncrement: true,
                        });
                        laborStore.createIndex('projectId', 'projectId');
                    }
                }
                if (oldVersion < 4) {
                    if (!db.objectStoreNames.contains(BUDGET_ITEMS_STORE)) {
                         const budgetStore = db.createObjectStore(BUDGET_ITEMS_STORE, {
                            keyPath: 'id',
                            autoIncrement: true,
                        });
                        budgetStore.createIndex('projectId', 'projectId');
                    }
                }
                if (oldVersion < 5) {
                    if (!db.objectStoreNames.contains(TRANSACTIONS_STORE)) {
                         const transactionStore = db.createObjectStore(TRANSACTIONS_STORE, {
                            keyPath: 'id',
                            autoIncrement: true,
                        });
                        transactionStore.createIndex('projectId', 'projectId');
                    }
                }
                if (oldVersion < 6) {
                    if (!db.objectStoreNames.contains(DATA_LIBRARY_STORE)) {
                        db.createObjectStore(DATA_LIBRARY_STORE, { keyPath: 'id' });
                    }
                }
                 if (oldVersion < 7) {
                    if (!db.objectStoreNames.contains(INVENTORY_ITEMS_STORE)) {
                        const inventoryStore = db.createObjectStore(INVENTORY_ITEMS_STORE, {
                            keyPath: 'id',
                            autoIncrement: true,
                        });
                        inventoryStore.createIndex('projectId', 'projectId');
                    }
                }
                if (oldVersion < 8) {
                    if (!db.objectStoreNames.contains(CERTIFICATIONS_STORE)) {
                        const certificationStore = db.createObjectStore(CERTIFICATIONS_STORE, {
                            keyPath: 'id',
                            autoIncrement: true,
                        });
                        certificationStore.createIndex('projectId', 'projectId');
                    }
                }
                if (oldVersion < 9) {
                    const projectStore = tx.objectStore(PROJECTS_STORE);
                    if (!projectStore.indexNames.contains('parentId')) {
                        projectStore.createIndex('parentId', 'parentId');
                    }
                }
            },
        });
    }
    return dbPromise;
};

// Data Library functions
export const initDataLibrary = async () => {
    const db = await initDB();
    const tx = db.transaction(DATA_LIBRARY_STORE, 'readwrite');
    const store = tx.store;

    const DEFAULT_COMMERCIAL_RULES: CommercialUnitRule[] = [
        { id: '1682345678001', materialName: 'Cemento', baseUnit: 'sacos', rule: 'ceil' },
        { id: '1682345678002', materialName: 'Pintura', baseUnit: 'litros', rule: 'best-fit-combination', options: [20, 5, 1], outputUnitFormat: 'tanqueta de {option} L' },
        { id: '1682345678003', materialName: 'Acero', baseUnit: 'm', rule: 'multiple-options', options: [6, 9, 12], selectedOption: 9, outputUnitFormat: 'barra de {option}m' },
        { id: '1682345678004', materialName: 'Alambre', baseUnit: 'kg', rule: 'ceil' },
        { id: '1682345678005', materialName: 'Losa', baseUnit: 'm²', rule: 'multiple-increment', increment: 1.5, outputUnitFormat: 'cajas ({increment}m²)' },
        { id: '1682345678006', materialName: 'Bloque', baseUnit: 'unidades', rule: 'ceil' },
        { id: '1682345678007', materialName: 'Ladrillo', baseUnit: 'unidades', rule: 'ceil' },
        { id: '1682345678008', materialName: 'Piso de', baseUnit: 'm²', rule: 'multiple-increment', increment: 1.44, outputUnitFormat: 'cajas ({increment}m²)' },
    ];


    try {
        const count = await store.count();
        if (count === 0) {
            console.log('Initializing Data Library...');
            await Promise.all([
                store.put({ id: 'labor_activities', data: PREDEFINED_LABOR_ACTIVITIES }),
                store.put({ id: 'labor_multiplier_factor', data: 1.0 }),
                store.put({ id: 'hormigones', data: HORMIGONES_DATA }),
                store.put({ id: 'acero_barras', data: ACERO_BARRAS_DATA }),
                store.put({ id: 'morteros_muros', data: MORTEROS_MUROS_DATA }),
                store.put({ id: 'morteros_revestimiento', data: MORTEROS_REVESTIMIENTO_DATA }),
                store.put({ id: 'morteros_piso', data: MORTEROS_PISO_DATA }),
                store.put({ id: 'pintura', data: PINTURA_DATA }),
                store.put({ id: 'enchape', data: ENCHAPE_DATA }),
                store.put({ id: 'pladur_pared', data: PLADUR_PARED_DATA }),
                store.put({ id: 'pladur_techo', data: PLADUR_TECHO_DATA }),
                store.put({ id: 'custom_material_activities', data: [] }),
                store.put({ id: 'commercial_unit_rules', data: DEFAULT_COMMERCIAL_RULES }),
                store.put({ id: 'commercial_rules_enabled', data: true }),
                store.put({ id: 'indirect_expenses_defaults', data: {
                    logisticsPercentage: 5,
                    technicalAssistancePercentage: 5,
                    toolsAndUtilitiesPercentage: 3,
                    transportPercentage: 5,
                    contingencyPercentage: 5,
                    profitPercentage: 15,
                } }),
                store.put({ id: 'company_info', data: {
                    name: 'HABITEX SURL',
                    address: 'General Lee No 100 entre Flores y Rabi, Diez de octubre, La Habana, Cuba',
                    phone: '+53 52529446',
                    signerName: 'Jose Javier Moreno',
                    signerTitle: 'Director General',
                } }),
                store.put({ id: 'license', data: { status: 'free' } }),
                store.put({ id: 'device_id', data: crypto.randomUUID() }),
            ]);
            console.log('Data Library initialized successfully.');
        } else {
            // For existing users, check if new keys exist and add them if not.
            const [expensesDefaults, companyInfo, customActivities, commercialRules, commercialRulesEnabled, license, deviceId, laborMultiplierFactor] = await Promise.all([
                store.get('indirect_expenses_defaults'),
                store.get('company_info'),
                store.get('custom_material_activities'),
                store.get('commercial_unit_rules'),
                store.get('commercial_rules_enabled'),
                store.get('license'),
                store.get('device_id'),
                store.get('labor_multiplier_factor'),
            ]);

            if (laborMultiplierFactor === undefined) {
                console.log('Adding labor multiplier factor to Data Library...');
                await store.put({ id: 'labor_multiplier_factor', data: 1.0 });
            }

            if (!expensesDefaults) {
                console.log('Adding indirect expenses defaults to Data Library...');
                await store.put({ id: 'indirect_expenses_defaults', data: {
                    logisticsPercentage: 5,
                    technicalAssistancePercentage: 5,
                    toolsAndUtilitiesPercentage: 3,
                    transportPercentage: 5,
                    contingencyPercentage: 5,
                    profitPercentage: 15,
                } });
            }
            if (!companyInfo) {
                console.log('Adding company info defaults to Data Library...');
                await store.put({ id: 'company_info', data: {
                    name: 'HABITEX SURL',
                    address: 'General Lee No 100 entre Flores y Rabi, Diez de octubre, La Habana, Cuba',
                    phone: '+53 52529446',
                    signerName: 'Jose Javier Moreno',
                    signerTitle: 'Director General',
                } });
            } else if (!companyInfo.data.signerName) {
                 console.log('Adding signer info to existing company info...');
                 await store.put({ id: 'company_info', data: {
                    ...companyInfo.data,
                    signerName: 'Jose Javier Moreno',
                    signerTitle: 'Director General',
                 }});
            }
            if (!customActivities) {
                 console.log('Adding custom material activities to Data Library...');
                await store.put({ id: 'custom_material_activities', data: [] });
            }
            if (!commercialRules) {
                console.log('Adding commercial unit rules to Data Library...');
                await store.put({ id: 'commercial_unit_rules', data: DEFAULT_COMMERCIAL_RULES });
            }
            if (commercialRulesEnabled === undefined) {
                console.log('Adding commercial rules enabled flag to Data Library...');
                await store.put({ id: 'commercial_rules_enabled', data: true });
            }
            if (!license) {
                console.log('Adding license info to Data Library...');
                await store.put({ id: 'license', data: { status: 'free' } });
            }
            if (!deviceId) {
                console.log('Adding device ID to Data Library...');
                await store.put({ id: 'device_id', data: crypto.randomUUID() });
            }
        }
        await tx.done;
    } catch (error) {
        console.error('Failed to initialize or update data library:', error);
        tx.abort();
    }
};


export const getDataLibrary = async (): Promise<Record<string, any>> => {
    const db = await initDB();
    const allItems = await db.getAll(DATA_LIBRARY_STORE);
    return allItems.reduce((acc: Record<string, any>, item: { id: string; data: any }) => {
        acc[item.id] = item.data;
        return acc;
    }, {});
};

export const updateDataLibraryItem = async (id: string, data: any) => {
    const db = await initDB();
    return db.put(DATA_LIBRARY_STORE, { id, data });
};

// License functions
export const getDeviceId = async (): Promise<string> => {
    const db = await initDB();
    const result = await db.get(DATA_LIBRARY_STORE, 'device_id');
    return result?.data;
};

export const getLicense = async (): Promise<License> => {
    const db = await initDB();
    const result = await db.get(DATA_LIBRARY_STORE, 'license');
    return result?.data || { status: 'free' };
};

export const saveLicense = async (license: License) => {
    const db = await initDB();
    return db.put(DATA_LIBRARY_STORE, { id: 'license', data: license });
};

// Project functions
export const getProjects = async (): Promise<Project[]> => {
    const db = await initDB();
    return db.getAll(PROJECTS_STORE);
};

export const addProject = async (project: Project) => {
    const db = await initDB();
    return db.add(PROJECTS_STORE, project);
};

export const updateProject = async (project: Project) => {
    const db = await initDB();
    return db.put(PROJECTS_STORE, project);
}

export const deleteProject = async (id: number, deleteChildrenAndData: boolean = true) => {
    const db = await initDB();
    const tx = db.transaction(ALL_STORES, 'readwrite');
    
    const projectStore = tx.objectStore(PROJECTS_STORE);
    const activityStore = tx.objectStore(ACTIVITIES_STORE);
    const laborStore = tx.objectStore(LABOR_ITEMS_STORE);
    const budgetStore = tx.objectStore(BUDGET_ITEMS_STORE);
    const transactionStore = tx.objectStore(TRANSACTIONS_STORE);
    const inventoryStore = tx.objectStore(INVENTORY_ITEMS_STORE);
    const certificationStore = tx.objectStore(CERTIFICATIONS_STORE);

    const allProjects: Project[] = await projectStore.getAll();
    const children = allProjects.filter(p => p.parentId === id);

    const deleteProjectData = async (projId: number) => {
        // Delete activities
        const projectActivities = await activityStore.index('projectId').getAll(projId);
        await Promise.all(projectActivities.map((act: Activity) => activityStore.delete(act.id)));
        
        // Delete labor items
        const projectLaborItems = await laborStore.index('projectId').getAll(projId);
        await Promise.all(projectLaborItems.map((item: LaborItem) => laborStore.delete(item.id)));
        
        // Delete budget items
        const projectBudgetItems = await budgetStore.index('projectId').getAll(projId);
        await Promise.all(projectBudgetItems.map((item: BudgetItem) => budgetStore.delete(item.id)));

        // Delete transactions
        const projectTransactions = await transactionStore.index('projectId').getAll(projId);
        await Promise.all(projectTransactions.map((item: Transaction) => transactionStore.delete(item.id)));
        
        // Delete inventory
        const projectInventoryItems = await inventoryStore.index('projectId').getAll(projId);
        await Promise.all(projectInventoryItems.map((item: InventoryItem) => inventoryStore.delete(item.id)));
        
        // Delete certifications
        const projectCertifications = await certificationStore.index('projectId').getAll(projId);
        await Promise.all(projectCertifications.map((item: Certification) => certificationStore.delete(item.id)));

        // Delete the project itself
        await projectStore.delete(projId);
    };

    if (children.length > 0) {
        if (deleteChildrenAndData) {
            // Delete all children projects and their associated data
            for (const child of children) {
                if (child.id) {
                    await deleteProjectData(child.id);
                }
            }
        } else {
            // Make children independent (keep them and their data)
            for (const child of children) {
                const updatedChild = { ...child };
                delete updatedChild.parentId;
                await projectStore.put(updatedChild);
            }
        }
    }

    // Finally, delete the parent project and its data
    await deleteProjectData(id);

    await tx.done;
};

export const duplicateProject = async (projectId: number): Promise<number | undefined> => {
    const db = await initDB();
    const storesToTransact = [PROJECTS_STORE, ACTIVITIES_STORE, LABOR_ITEMS_STORE, BUDGET_ITEMS_STORE];
    const tx = db.transaction(storesToTransact, 'readwrite');

    try {
        const projectStore = tx.objectStore(PROJECTS_STORE);
        const activityStore = tx.objectStore(ACTIVITIES_STORE);
        const laborStore = tx.objectStore(LABOR_ITEMS_STORE);
        const budgetStore = tx.objectStore(BUDGET_ITEMS_STORE);
        
        const sourceProject: Project = await projectStore.get(projectId);
        if (!sourceProject) throw new Error(`Project with id ${projectId} not found.`);

        const newProjectData = {
            ...sourceProject,
            name: `${sourceProject.name} (Copia)`,
            createdAt: new Date(),
            clientName: '',
            clientAddress: ''
        };
        delete newProjectData.id;
        const newProjectId = await projectStore.add(newProjectData);

        const sourceActivities: Activity[] = await activityStore.index('projectId').getAll(projectId);
        for (const activity of sourceActivities) {
            const newActivityData = { ...activity, projectId: newProjectId };
            delete newActivityData.id;
            await activityStore.add(newActivityData);
        }

        const sourceLaborItems: LaborItem[] = await laborStore.index('projectId').getAll(projectId);
        for (const laborItem of sourceLaborItems) {
            const newLaborItemData = { ...laborItem, projectId: newProjectId };
            delete newLaborItemData.id;
            delete newLaborItemData.quantityCompleted;
            await laborStore.add(newLaborItemData);
        }

        const sourceBudgetItems: BudgetItem[] = await budgetStore.index('projectId').getAll(projectId);
        for (const budgetItem of sourceBudgetItems) {
            const newBudgetItemData = { ...budgetItem, projectId: newProjectId };
            delete newBudgetItemData.id;
            await budgetStore.add(newBudgetItemData);
        }

        await tx.done;
        return newProjectId;

    } catch (error) {
        console.error("Failed to duplicate project:", error);
        if (!tx.done) {
             tx.abort();
        }
        return undefined;
    }
};

// Activity functions
export const getActivities = async (projectId: number): Promise<Activity[]> => {
    const db = await initDB();
    return db.getAllFromIndex(ACTIVITIES_STORE, 'projectId', projectId);
};

export const addActivity = async (activity: Activity) => {
    const db = await initDB();
    return db.add(ACTIVITIES_STORE, activity);
};

export const updateActivity = async (activity: Activity) => {
    const db = await initDB();
    return db.put(ACTIVITIES_STORE, activity);
}

export const deleteActivity = async (id: number) => {
    const db = await initDB();
    return db.delete(ACTIVITIES_STORE, id);
};

// Material Price functions
export const getMaterialPrices = async () => {
    const db = await initDB();
    return db.getAll(MATERIAL_PRICES_STORE);
};

export const setMaterialPrice = async (priceData: { name: string, unit: string, price: number }) => {
    const db = await initDB();
    return db.put(MATERIAL_PRICES_STORE, priceData);
};

export const deleteMaterialPrice = async (name: string, unit: string) => {
    const db = await initDB();
    return db.delete(MATERIAL_PRICES_STORE, [name, unit]);
};

// Labor Item functions
export const getLaborItems = async (projectId: number): Promise<LaborItem[]> => {
    const db = await initDB();
    return db.getAllFromIndex(LABOR_ITEMS_STORE, 'projectId', projectId);
};

export const addLaborItem = async (item: LaborItem) => {
    const db = await initDB();
    return db.add(LABOR_ITEMS_STORE, item);
};

export const updateLaborItem = async (item: LaborItem) => {
    const db = await initDB();
    return db.put(LABOR_ITEMS_STORE, item);
}

export const deleteLaborItem = async (id: number) => {
    const db = await initDB();
    return db.delete(LABOR_ITEMS_STORE, id);
};

// Budget Item functions
export const getBudgetItems = async (projectId: number): Promise<BudgetItem[]> => {
    const db = await initDB();
    return db.getAllFromIndex(BUDGET_ITEMS_STORE, 'projectId', projectId);
};

export const addBudgetItem = async (item: BudgetItem) => {
    const db = await initDB();
    return db.add(BUDGET_ITEMS_STORE, item);
};

export const updateBudgetItem = async (item: BudgetItem) => {
    const db = await initDB();
    return db.put(BUDGET_ITEMS_STORE, item);
}

export const deleteBudgetItem = async (id: number) => {
    const db = await initDB();
    return db.delete(BUDGET_ITEMS_STORE, id);
};

// Transaction functions
export const getTransactions = async (projectId: number): Promise<Transaction[]> => {
    const db = await initDB();
    return db.getAllFromIndex(TRANSACTIONS_STORE, 'projectId', projectId);
};

export const addTransaction = async (item: Transaction) => {
    const db = await initDB();
    return db.add(TRANSACTIONS_STORE, item);
};

export const updateTransaction = async (item: Transaction) => {
    const db = await initDB();
    return db.put(TRANSACTIONS_STORE, item);
};

export const deleteTransaction = async (id: number) => {
    const db = await initDB();
    const tx = db.transaction([TRANSACTIONS_STORE, INVENTORY_ITEMS_STORE, CERTIFICATIONS_STORE], 'readwrite');
    const transactionStore = tx.objectStore(TRANSACTIONS_STORE);
    const inventoryStore = tx.objectStore(INVENTORY_ITEMS_STORE);
    const certificationStore = tx.objectStore(CERTIFICATIONS_STORE);

    const transactionToDelete: Transaction | undefined = await transactionStore.get(id);

    if (!transactionToDelete) {
        await tx.done;
        return;
    }

    // Check if the transaction is locked by a certification
    const certifications: Certification[] = await certificationStore.index('projectId').getAll(transactionToDelete.projectId);
    const lastCertification = certifications.sort((a, b) => new Date(b.certifiedAt).getTime() - new Date(a.certifiedAt).getTime())[0];

    if (lastCertification && new Date(transactionToDelete.date).getTime() <= new Date(lastCertification.certifiedAt).getTime()) {
        alert("Esta transacción no se puede eliminar porque está incluida en una certificación existente. Elimine primero la certificación para desbloquearla.");
        await tx.done;
        return; // Abort deletion
    }
    
    // If it's an income transaction, check if it's linked to a certification payment
    if (transactionToDelete.type === TransactionType.INCOME && transactionToDelete.category === 'Pago por certificación') {
        const projectCerts: Certification[] = await certificationStore.index('projectId').getAll(transactionToDelete.projectId);
        const linkedCert = projectCerts.find(c => c.paymentTransactionId === id);
        if (linkedCert) {
            // Unlink it
            delete linkedCert.paymentTransactionId;
            await certificationStore.put(linkedCert);
        }
    }


    // First, delete the transaction itself.
    await transactionStore.delete(id);

    // Then, check if it's a material purchase that might have a linked inventory item.
    if (transactionToDelete.type === TransactionType.EXPENSE && transactionToDelete.category === 'Materiales') {
        const materialName = transactionToDelete.description.replace(/^Compra de /i, '').trim();
        
        // Find a matching inventory item within the same project.
        const allInventoryItems: InventoryItem[] = await inventoryStore.index('projectId').getAll(transactionToDelete.projectId);
        
        // The most likely candidate is one with the same name and date.
        // This handles the implicit link created by the UI flow.
        const matchingItem = allInventoryItems.find(item => 
            item.name.trim().toLowerCase() === materialName.toLowerCase() && 
            item.dateAdded === transactionToDelete.date
        );
        
        if (matchingItem && matchingItem.id) {
            // Found a match, delete it.
            await inventoryStore.delete(matchingItem.id);
        }
    }

    await tx.done;
};

// Inventory Item functions
export const getInventoryItems = async (projectId: number): Promise<InventoryItem[]> => {
    const db = await initDB();
    return db.getAllFromIndex(INVENTORY_ITEMS_STORE, 'projectId', projectId);
};

export const addInventoryItem = async (item: InventoryItem) => {
    const db = await initDB();
    return db.add(INVENTORY_ITEMS_STORE, item);
};

export const updateInventoryItem = async (item: InventoryItem) => {
    const db = await initDB();
    return db.put(INVENTORY_ITEMS_STORE, item);
};

export const deleteInventoryItem = async (id: number) => {
    const db = await initDB();
    return db.delete(INVENTORY_ITEMS_STORE, id);
};

// Certification functions
export const getCertifications = async (projectId: number): Promise<Certification[]> => {
    const db = await initDB();
    return db.getAllFromIndex(CERTIFICATIONS_STORE, 'projectId', projectId);
};

export const addCertification = async (item: Certification) => {
    const db = await initDB();
    return db.add(CERTIFICATIONS_STORE, item);
};

export const updateCertification = async (item: Certification) => {
    const db = await initDB();
    return db.put(CERTIFICATIONS_STORE, item);
};

export const deleteCertification = async (id: number) => {
    const db = await initDB();
    return db.delete(CERTIFICATIONS_STORE, id);
};


// Data Export/Import
export const exportAllData = async () => {
    const db = await initDB();
    const tx = db.transaction(ALL_STORES, 'readonly');
    const [
        projects, activities, materialPrices, laborItems, budgetItems, 
        transactions, dataLibrary, inventoryItems, certifications
    ] = await Promise.all([
        tx.objectStore(PROJECTS_STORE).getAll(),
        tx.objectStore(ACTIVITIES_STORE).getAll(),
        tx.objectStore(MATERIAL_PRICES_STORE).getAll(),
        tx.objectStore(LABOR_ITEMS_STORE).getAll(),
        tx.objectStore(BUDGET_ITEMS_STORE).getAll(),
        tx.objectStore(TRANSACTIONS_STORE).getAll(),
        tx.objectStore(DATA_LIBRARY_STORE).getAll(),
        tx.objectStore(INVENTORY_ITEMS_STORE).getAll(),
        tx.objectStore(CERTIFICATIONS_STORE).getAll(),
    ]);
    await tx.done;
    return { 
        projects, activities, materialPrices, laborItems, budgetItems, 
        transactions, dataLibrary, inventoryItems, certifications 
    };
};

export const importAllData = async (data: any) => {
    const db = await initDB();
    const tx = db.transaction(ALL_STORES, 'readwrite');
    
    // Create maps to track old IDs to new ones
    const oldToNewProjectIds: { [key: number]: number } = {};
    const oldToNewTransactionIds: { [key: number]: number } = {};

    // Process projects
    for (const project of data.projects) {
        if (project.id !== undefined) {
            const oldId = project.id;
            delete project.id; // Remove old ID so IndexedDB can auto-generate a new one
            const newId = await tx.objectStore(PROJECTS_STORE).add(project);
            oldToNewProjectIds[oldId] = newId;
        } else {
            await tx.objectStore(PROJECTS_STORE).add(project); // Handle projects without an ID just in case
        }
    }

    // Process activities, mapping to new project IDs
    for (const activity of data.activities) {
        const newProjectId = oldToNewProjectIds[activity.projectId];
        if (newProjectId) {
            activity.projectId = newProjectId;
            delete activity.id; // Remove old ID for auto-generation
            await tx.objectStore(ACTIVITIES_STORE).add(activity);
        }
    }

    // Process labor items, mapping to new project IDs
    for (const laborItem of data.laborItems) {
        const newProjectId = oldToNewProjectIds[laborItem.projectId];
        if (newProjectId) {
            laborItem.projectId = newProjectId;
            delete laborItem.id; // Remove old ID for auto-generation
            await tx.objectStore(LABOR_ITEMS_STORE).add(laborItem);
        }
    }

    // Process budget items, mapping to new project IDs
    if (data.budgetItems) {
        for (const budgetItem of data.budgetItems) {
            const newProjectId = oldToNewProjectIds[budgetItem.projectId];
            if (newProjectId) {
                budgetItem.projectId = newProjectId;
                delete budgetItem.id; // Remove old ID for auto-generation
                await tx.objectStore(BUDGET_ITEMS_STORE).add(budgetItem);
            }
        }
    }
    
    // Process transactions, mapping to new project IDs AND creating a map for transaction IDs
    if (data.transactions) {
        for (const transaction of data.transactions) {
            const newProjectId = oldToNewProjectIds[transaction.projectId];
            if (newProjectId) {
                const oldTxId = transaction.id;
                transaction.projectId = newProjectId;
                delete transaction.id; // Remove old ID for auto-generation
                const newTxId = await tx.objectStore(TRANSACTIONS_STORE).add(transaction);
                if (oldTxId) {
                    oldToNewTransactionIds[oldTxId] = newTxId;
                }
            }
        }
    }

    // Process inventory items, mapping to new project IDs
    if (data.inventoryItems) {
        for (const inventoryItem of data.inventoryItems) {
            const newProjectId = oldToNewProjectIds[inventoryItem.projectId];
            if (newProjectId) {
                inventoryItem.projectId = newProjectId;
                delete inventoryItem.id;
                await tx.objectStore(INVENTORY_ITEMS_STORE).add(inventoryItem);
            }
        }
    }
    
    // Process certifications, mapping to new project IDs and transaction IDs
    if (data.certifications) {
        for (const cert of data.certifications) {
            const newProjectId = oldToNewProjectIds[cert.projectId];
            if (newProjectId) {
                cert.projectId = newProjectId;
                delete cert.id;
                // Blobs can't be cloned structuredly in older import/export flows
                if (cert.invoicePdfBlob) {
                    delete cert.invoicePdfBlob;
                }
                // Map the payment transaction ID if it exists
                if (cert.paymentTransactionId && oldToNewTransactionIds[cert.paymentTransactionId]) {
                    cert.paymentTransactionId = oldToNewTransactionIds[cert.paymentTransactionId];
                } else {
                    delete cert.paymentTransactionId;
                }
                await tx.objectStore(CERTIFICATIONS_STORE).add(cert);
            }
        }
    }


    // Process material prices using 'put' to add or update
    for (const materialPrice of data.materialPrices) {
        await tx.objectStore(MATERIAL_PRICES_STORE).put(materialPrice);
    }

    // Overwrite data library with imported data
    if (data.dataLibrary && Array.isArray(data.dataLibrary)) {
        for (const item of data.dataLibrary) {
            await tx.objectStore(DATA_LIBRARY_STORE).put(item);
        }
    }


    await tx.done;
};