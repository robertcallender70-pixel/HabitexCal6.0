
import React from 'react';
import type { Project, Activity, Material, LaborItem, BudgetItem, Transaction, PredefinedLaborActivity, InventoryItem, Certification, CertificationSnapshot, CustomMaterialActivity, License } from '../types';
import { ActivityType, TransactionType } from '../types';
import {
    getProjects, addProject, updateProject, deleteProject, getActivities,
    addActivity, updateActivity, deleteActivity, getMaterialPrices, setMaterialPrice,
    getLaborItems, addLaborItem, updateLaborItem, deleteLaborItem,
    getBudgetItems, addBudgetItem, updateBudgetItem, deleteBudgetItem,
    getTransactions, addTransaction, updateTransaction, deleteTransaction,
    exportAllData, importAllData, getDataLibrary, updateDataLibraryItem,
    getInventoryItems, addInventoryItem, updateInventoryItem, deleteInventoryItem,
    getCertifications, addCertification, deleteCertification, updateCertification,
    initDataLibrary,
    duplicateProject
} from '../services/database';
import { calculateMaterials } from '../services/calculations';
import { exportProjectToPDF, exportScheduleToPDF } from '../services/pdf';
import { calculateSchedule } from '../services/schedule';
import { calculateCertificationSnapshot, calculateConsolidatedCertificationSnapshot } from '../services/certificationHelper';
import Modal from './Modal';
import ActivityForm from './ActivityForm';
import AddLaborItemModal from './AddLaborItemModal';
import BudgetItemModal from './BudgetItemModal';
import CertificationModal from './CertificationModal';
import CertificationDetailsModal from './CertificationDetailsModal';
import AdvanceInvoiceModal from './AdvanceInvoiceModal'; // NEW
import TransactionModal from './TransactionModal';
import InventoryItemModal from './InventoryItemModal';
import InvoiceModal from './InvoiceModal';
import OfferModal from './OfferModal';
import FinancialChart from './FinancialChart';
import DataLibrary from './DataLibrary';
import ActivityScheduler from './ActivityScheduler';
import FulfillNeedModal from './FulfillNeedModal';
import PercentageInput from './PercentageInput';
import BuyAllMaterialsModal from './BuyAllMaterialsModal';
import ManagedNumberInput from './ManagedNumberInput';
import { 
    PlusIcon, TrashIcon, PencilIcon, ChevronDownIcon, ArrowLeftIcon, PdfIcon,
    ArrowDownTrayIcon, ArrowUpTrayIcon, BanknotesIcon, ArrowTrendingUpIcon,
    ArrowTrendingDownIcon, ScaleIcon, CogIcon, CubeIcon, ShoppingCartIcon, EyeIcon,
    CheckCircleIcon,
    DocumentDuplicateIcon
} from '../constants';

interface LicenseState {
    status: 'free' | 'pro' | 'trial-active' | 'trial-expired';
    isPro: boolean; 
    projectLimit: number;
    canDeleteProjects: boolean;
    expiresAt?: number;
    wasTrial: boolean; 
}

const FolderIcon = (props: any) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 0 1 4.5 9.75h15A2.25 2.25 0 0 1 21.75 12v.75m-8.69-6.44-2.12-2.12a1.5 1.5 0 0 0-1.061-.44H4.5A2.25 2.25 0 0 0 2.25 6v12a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 2.25 6v12a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 1 21.75 18V9a2.25 2.25 0 0 0-2.25-2.25h-5.379a1.5 1.5 0 0 1-1.06-.44Z" />
    </svg>
);

const DocumentIcon = (props: any) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
    </svg>
);

const LinkIcon = (props: any) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 0 1 1.242 7.244l-4.5 4.5a4.5 4.5 0 0 1-6.364-6.364l1.757-1.757m13.35-.622 1.757-1.757a4.5 4.5 0 0 0-6.364-6.364l-4.5 4.5a4.5 4.5 0 0 0 1.242 7.244m-7.5-3.25a4.5 4.5 0 0 0-6.364-6.364l-1.757 1.757" />
    </svg>
);

const UnlinkIcon = (props: any) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 0 1 1.242 7.244l-4.5 4.5a4.5 4.5 0 0 1-6.364-6.364l1.757-1.757m13.35-.622 1.757-1.757a4.5 4.5 0 0 0-6.364-6.364l-4.5 4.5a4.5 4.5 0 0 0 1.242 7.244m-7.5-3.25a4.5 4.5 0 0 0-6.364-6.364l-1.757 1.757" />
    </svg>
);

const ArrowPathIcon = (props: any) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
    </svg>
);

export const parseLocalDate = (dateVal: string | Date | undefined | null): Date => {
    if (!dateVal) return new Date();
    if (dateVal instanceof Date) {
        return dateVal;
    }
    if (typeof dateVal === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateVal)) {
        const [year, month, day] = dateVal.split('-').map(Number);
        return new Date(year, month - 1, day);
    }
    if (typeof dateVal === 'string' && dateVal.includes('T')) {
        const datePart = dateVal.split('T')[0];
        if (/^\d{4}-\d{2}-\d{2}$/.test(datePart)) {
            const [year, month, day] = datePart.split('-').map(Number);
            return new Date(year, month - 1, day);
        }
    }
    const d = new Date(dateVal);
    if (!isNaN(d.getTime())) {
        return d;
    }
    return new Date();
};

const BudgetProgressBar = ({ current, total, formatCurrency }: { current: number, total: number, formatCurrency: (val: number) => string }) => {
    const progress = total > 0 ? (current / total) * 100 : 0;
    const isOver = progress > 100.01;
    const barColor = isOver ? 'bg-red-500' : 'bg-cyan-600';
    
    return (
        <div className="w-full mt-1.5">
            <div className="flex justify-between text-xs text-slate-500 mb-0.5">
                <span>Ejecutado: {formatCurrency(current)}</span>
                <span className={isOver ? 'text-red-600 font-bold' : ''}>{progress.toFixed(1)}%</span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                <div className={`h-full rounded-full ${barColor} transition-all duration-500`} style={{ width: `${Math.min(progress, 100)}%` }}></div>
            </div>
        </div>
    )
};


export const getMaterialPrice = (name: string, unit: string, prices: Record<string, number>): number => {
    if (!prices) return 0;
    const trimmedName = name.trim();
    const trimmedUnit = unit.trim();
    
    // 1. Try exact match on trimmed
    const exactTrimmedKey = `${trimmedName}-${trimmedUnit}`;
    if (prices[exactTrimmedKey] !== undefined) {
        return prices[exactTrimmedKey];
    }

    // 2. Try match on original key format
    const originalKey = `${name}-${unit}`;
    if (prices[originalKey] !== undefined) {
        return prices[originalKey];
    }

    // 3. Case-insensitive and trimmed key match
    const lowerKey = `${trimmedName.toLowerCase()}-${trimmedUnit.toLowerCase()}`;
    for (const [key, val] of Object.entries(prices)) {
        if (key.trim().toLowerCase() === lowerKey) {
            return val;
        }
    }

    // 4. Fallback: match name only (case-insensitive and trimmed)
    const lowerName = trimmedName.toLowerCase();
    for (const [key, val] of Object.entries(prices)) {
        const parts = key.split('-');
        if (parts.length > 0 && parts[0].trim().toLowerCase() === lowerName) {
            return val;
        }
    }

    return 0;
};


export const ProjectManager: React.FC = () => {
    // State management
    const [projects, setProjects] = React.useState<Project[]>([]);
    const [selectedProject, setSelectedProject] = React.useState<Project | null>(null);
    const [activities, setActivities] = React.useState<Activity[]>([]);
    const [laborItems, setLaborItems] = React.useState<LaborItem[]>([]);
    const [budgetItems, setBudgetItems] = React.useState<BudgetItem[]>([]);
    const [transactions, setTransactions] = React.useState<Transaction[]>([]);
    const [inventoryItems, setInventoryItems] = React.useState<InventoryItem[]>([]);
    const [certifications, setCertifications] = React.useState<Certification[]>([]);
    const [isLoading, setIsLoading] = React.useState(true);
    const [materialPrices, setMaterialPrices] = React.useState<Record<string, number>>({});
    const [projectCosts, setProjectCosts] = React.useState<Record<number, { usd: number, cup: number }>>({});
    const [currentView, setCurrentView] = React.useState<'financials' | 'materials' | 'labor' | 'budget' | 'inventory' | 'certifications' | 'objetos-de-obra' | 'schedule'>('financials');
    const [displayCurrency, setDisplayCurrency] = React.useState<'CUP' | 'USD'>('CUP');
    const [libraryData, setLibraryData] = React.useState<any>(null);
    const [licenseState, setLicenseState] = React.useState<LicenseState>({
        status: 'pro',
        isPro: true,
        projectLimit: Infinity,
        canDeleteProjects: true,
        wasTrial: false,
    });
    const [expandedProjects, setExpandedProjects] = React.useState<Set<number>>(new Set());
    const [isIndirectConfigOpen, setIsIndirectConfigOpen] = React.useState<boolean>(() => localStorage.getItem('isIndirectConfigOpen') === 'true');


    // Modal states
    const [isProjectModalOpen, setIsProjectModalOpen] = React.useState(false);
    const [editingProject, setEditingProject] = React.useState<Project | null>(null);
    const [projectFormData, setProjectFormData] = React.useState<{ name: string; clientName?: string; clientAddress?: string }>({ name: '', clientName: '', clientAddress: '' });


    const [isActivityModalOpen, setIsActivityModalOpen] = React.useState(false);
    const [editingActivity, setEditingActivity] = React.useState<Activity | null>(null);
    const [selectedActivityType, setSelectedActivityType] = React.useState<ActivityType | null>(null);
    const [selectedCustomActivity, setSelectedCustomActivity] = React.useState<CustomMaterialActivity | null>(null);

    const [isLaborItemModalOpen, setIsLaborItemModalOpen] = React.useState(false);
    const [editingLaborItem, setEditingLaborItem] = React.useState<LaborItem | null>(null);
    
    const [isBudgetItemModalOpen, setIsBudgetItemModalOpen] = React.useState(false);
    const [editingBudgetItem, setEditingBudgetItem] = React.useState<BudgetItem | null>(null);

    const [isTransactionModalOpen, setIsTransactionModalOpen] = React.useState(false);
    const [editingTransaction, setEditingTransaction] = React.useState<Transaction | null>(null);
    const [transactionDefaults, setTransactionDefaults] = React.useState<Partial<Transaction> | null>(null);

    const [isInventoryItemModalOpen, setIsInventoryItemModalOpen] = React.useState(false);
    const [editingInventoryItem, setEditingInventoryItem] = React.useState<InventoryItem | null>(null);
    const [inventoryDefaults, setInventoryDefaults] = React.useState<Partial<InventoryItem> | null>(null);

    const [isUseInventoryModalOpen, setIsUseInventoryModalOpen] = React.useState(false);
    const [itemToUse, setItemToUse] = React.useState<InventoryItem | null>(null);
    const [useQuantity, setUseQuantity] = React.useState('');
    
    const [isUseFromInventoryModalOpen, setIsUseFromInventoryModalOpen] = React.useState(false);
    const [materialToFulfill, setMaterialToFulfill] = React.useState<Material | null>(null);

    const [isInvoiceModalOpen, setIsInvoiceModalOpen] = React.useState(false);
    const [invoiceData, setInvoiceData] = React.useState<{ cert: Certification | null, prevCert: Certification | null }>({ cert: null, prevCert: null });
    const [isOfferModalOpen, setIsOfferModalOpen] = React.useState(false);
    const [isPdfDropdownOpen, setIsPdfDropdownOpen] = React.useState(false);
    const pdfDropdownRef = React.useRef<HTMLDivElement>(null);
    
    const [isCertificationModalOpen, setIsCertificationModalOpen] = React.useState(false);
    const [isAdvanceInvoiceModalOpen, setIsAdvanceInvoiceModalOpen] = React.useState(false); // NEW


    const [isBuyAllModalOpen, setIsBuyAllModalOpen] = React.useState(false);
    const [activityToBuy, setActivityToBuy] = React.useState<Activity | null>(null);

    const [isResetConfirmModalOpen, setIsResetConfirmModalOpen] = React.useState(false);
    const [activityToReset, setActivityToReset] = React.useState<Activity | null>(null);

    const [isUnpayConfirmModalOpen, setIsUnpayConfirmModalOpen] = React.useState(false);
    const [certificationToUnpay, setCertificationToUnpay] = React.useState<Certification | null>(null);

    const [isCertificationDetailsModalOpen, setIsCertificationDetailsModalOpen] = React.useState(false);
    const [selectedCertificationForDetails, setSelectedCertificationForDetails] = React.useState<Certification | null>(null);
    const [prevCertificationForDetails, setPrevCertificationForDetails] = React.useState<Certification | null>(null);

    const [isFullInvoiceConfirmModalOpen, setIsFullInvoiceConfirmModalOpen] = React.useState(false);


    const [isDeleteModalOpen, setIsDeleteModalOpen] = React.useState(false);
    const [itemToDelete, setItemToDelete] = React.useState<{ type: 'project' | 'activity' | 'labor' | 'budget' | 'transaction' | 'inventory' | 'certification'; id: number } | null>(null);
    const [deleteAssociatedData, setDeleteAssociatedData] = React.useState(true);

    const [isImportConfirmModalOpen, setIsImportConfirmModalOpen] = React.useState(false);
    const [dataToImport, setDataToImport] = React.useState<any>(null);
    const fileInputRef = React.useRef<HTMLInputElement>(null);
    
    const [isDataLibraryOpen, setIsDataLibraryOpen] = React.useState(false);
    const [libraryInitialTab, setLibraryInitialTab] = React.useState<'labor' | 'formulas' | 'prices' | 'expenses' | 'company' | 'custom_activities'>('labor');
    
    // Multi-select states
    const [selectedTransactionIds, setSelectedTransactionIds] = React.useState<Set<number>>(new Set());
    const [selectedInventoryIds, setSelectedInventoryIds] = React.useState<Set<number>>(new Set());
    const [selectedActivityIds, setSelectedActivityIds] = React.useState<Set<number>>(new Set());
    const [selectedLaborIds, setSelectedLaborIds] = React.useState<Set<number>>(new Set());
    const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = React.useState(false);
    const [bulkDeleteConfig, setBulkDeleteConfig] = React.useState<{ type: string; count: number; onConfirm: () => Promise<void> } | null>(null);

    const [isDuplicateModalOpen, setIsDuplicateModalOpen] = React.useState(false);
    const [projectToDuplicate, setProjectToDuplicate] = React.useState<Project | null>(null);

    const [isAssignParentModalOpen, setIsAssignParentModalOpen] = React.useState(false);
    const [projectToMove, setProjectToMove] = React.useState<Project | null>(null);


    const isPro = licenseState?.isPro ?? false;
    const atProjectLimit = projects.length >= (licenseState?.projectLimit ?? PROJECT_LIMIT_FREE);
    const proFeatureTooltip = isPro ? '' : 'Función Pro - Requiere licencia';

    const ProStarIcon = () => (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-yellow-500" viewBox="0 0 20 20" fill="currentColor">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
    );

    const getActivitySubtitle = (activity: Activity): string => {
        if (activity.type === ActivityType.CUSTOM_MATERIAL_CALCULATION) {
            return "Actividad Personalizada";
        }
        if (activity.type === ActivityType.REVESTIMIENTO && activity.inputs.tiposRevestimiento && libraryData) {
             const selectedLayers = Object.keys(activity.inputs.tiposRevestimiento)
                .filter(key => activity.inputs.tiposRevestimiento[key])
                .map(layerId => {
                    const layerData = libraryData.morteros_revestimiento.find((r: any) => r.id === layerId);
                    return layerData ? layerData.nombre : null;
                })
                .filter(Boolean);

            return selectedLayers.length > 0 ? selectedLayers.join(', ') : activity.type;
        }
        if (activity.type === ActivityType.ESTRUCTURA_PLADUR) {
            const type = activity.inputs.tipoEstructura === 'pared' ? 'Pared' : 'Techo';
            const insulation = activity.inputs.incluirAislamiento ? ' con Aislante' : '';
            return `${type}${insulation}`;
        }
        return activity.type;
    };

    // Data loading effects
    const loadInitialData = React.useCallback(async () => {
        setIsLoading(true);
        try {
            await initDataLibrary();

            const [projectsFromDB, pricesFromDB, libData] = await Promise.all([
                getProjects(),
                getMaterialPrices(),
                getDataLibrary(),
            ]);
            
            setLibraryData(libData);

            const validProjects = projectsFromDB.filter(p => p.createdAt && !isNaN(new Date(p.createdAt).getTime()));
            setProjects(validProjects.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));

            const priceMap = pricesFromDB.reduce((acc: Record<string, number>, item: { name: string, unit: string, price: number }) => {
                acc[`${item.name}-${item.unit}`] = item.price;
                return acc;
            }, {});
            setMaterialPrices(priceMap);

        } catch (error) {
            console.error("Failed to load initial data:", error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    const getProjectOrGlobalMaterialPrice = React.useCallback((materialName: string, materialUnit: string, currentActivityId?: number): number => {
        // 1. Search in existing activities of the current project (excluding the one being edited, if any)
        for (const activity of activities) {
            if (currentActivityId && activity.id === currentActivityId) continue;
            const match = activity.results.find(m => 
                m.name.trim().toLowerCase() === materialName.trim().toLowerCase() && 
                m.unit.trim().toLowerCase() === materialUnit.trim().toLowerCase() &&
                m.unitPrice !== undefined && m.unitPrice > 0
            );
            if (match && match.unitPrice) {
                return match.unitPrice;
            }
        }
        
        // 2. Fallback to global prices
        return getMaterialPrice(materialName, materialUnit, materialPrices) || 0;
    }, [activities, materialPrices]);

    const loadProjectData = React.useCallback(async () => {
        if (!selectedProject?.id || !libraryData) return;
        setIsLoading(true);
        try {
            const [
                activitiesFromDB, 
                laborItemsFromDB, 
                budgetItemsFromDB, 
                transactionsFromDB, 
                inventoryItemsFromDB,
                certificationsFromDB,
            ] = await Promise.all([
                getActivities(selectedProject.id),
                getLaborItems(selectedProject.id),
                getBudgetItems(selectedProject.id),
                getTransactions(selectedProject.id),
                getInventoryItems(selectedProject.id),
                getCertifications(selectedProject.id),
            ]);

            const hydratedActivities = activitiesFromDB.map(activity => {
                let changed = false;
                const updatedResults = activity.results.map(material => {
                    if (material.unitPrice !== undefined && material.unitPrice > 0) {
                        return material;
                    }
                    
                    // Try to find a project-specific price in other activities of activitiesFromDB first!
                    let resolvedPrice = 0;
                    for (const act of activitiesFromDB) {
                        if (act.id === activity.id) continue;
                        const match = act.results.find(m => 
                            m.name.trim().toLowerCase() === material.name.trim().toLowerCase() && 
                            m.unit.trim().toLowerCase() === material.unit.trim().toLowerCase() &&
                            m.unitPrice !== undefined && m.unitPrice > 0
                        );
                        if (match && match.unitPrice) {
                            resolvedPrice = match.unitPrice;
                            break;
                        }
                    }
                    
                    if (resolvedPrice === 0) {
                        resolvedPrice = getMaterialPrice(material.name, material.unit, materialPrices) || 0;
                    }

                    if (material.unitPrice !== resolvedPrice) {
                        changed = true;
                    }

                    return {
                        ...material,
                        unitPrice: resolvedPrice,
                    };
                });
                
                if (changed) {
                    const hydratedActivity = { ...activity, results: updatedResults };
                    updateActivity(hydratedActivity);
                    return hydratedActivity;
                }
                return activity;
            });

            setActivities(hydratedActivities);
            setLaborItems(laborItemsFromDB);
            setBudgetItems(budgetItemsFromDB);
            setTransactions(transactionsFromDB.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
            setInventoryItems(inventoryItemsFromDB.sort((a, b) => new Date(b.dateAdded).getTime() - new Date(a.dateAdded).getTime()));
            setCertifications(certificationsFromDB.sort((a,b) => new Date(a.certifiedAt).getTime() - new Date(b.certifiedAt).getTime()));
        } catch (error) {
            console.error(`Failed to load data for project ${selectedProject.id}:`, error);
        } finally {
            setIsLoading(false);
        }
    }, [selectedProject, materialPrices, libraryData]);
    
    const loadParentProjectData = React.useCallback(async () => {
        if (!selectedProject?.id || !libraryData) return;
        setIsLoading(true);

        try {
            const allProjects = await getProjects();
            const childProjects = allProjects.filter(p => p.parentId === selectedProject.id);
            const childProjectIds = childProjects.map(p => p.id!);

            if (childProjectIds.length === 0) {
                await loadProjectData();
                return;
            }

            const dataPromises = childProjectIds.map(id => Promise.all([
                getActivities(id),
                getLaborItems(id),
                getBudgetItems(id),
                getTransactions(id),
                getInventoryItems(id),
                getCertifications(id).then(certs => certs.map(c => ({...c, childProjectName: childProjects.find(p => p.id === id)?.name || ''}))) 
            ]));

            const results = await Promise.all(dataPromises);

            const aggregatedActivities = results.flatMap(res => res[0]);
            const aggregatedLaborItems = results.flatMap(res => res[1]);
            const aggregatedBudgetItems = results.flatMap(res => res[2]);
            const aggregatedTransactions = results.flatMap(res => res[3]);
            const aggregatedInventoryItems = results.flatMap(res => res[4]);
            const aggregatedCertifications = results.flatMap(res => res[5]);
            
            setActivities(aggregatedActivities);
            setLaborItems(aggregatedLaborItems);
            setBudgetItems(aggregatedBudgetItems);
            setTransactions(aggregatedTransactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
            setInventoryItems(aggregatedInventoryItems.sort((a, b) => new Date(b.dateAdded).getTime() - new Date(a.dateAdded).getTime()));
            setCertifications(aggregatedCertifications.sort((a,b) => new Date(a.certifiedAt).getTime() - new Date(b.certifiedAt).getTime()));

        } catch (error) {
            console.error(`Failed to load aggregated data for parent project ${selectedProject.id}:`, error);
        } finally {
            setIsLoading(false);
        }
    }, [selectedProject, loadProjectData, libraryData]);


    React.useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (pdfDropdownRef.current && !pdfDropdownRef.current.contains(event.target as Node)) {
                setIsPdfDropdownOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [pdfDropdownRef]);


    React.useEffect(() => {
        loadInitialData();
    }, [loadInitialData]);

    React.useEffect(() => {
        if (selectedProject) {
            const isParent = projects.some(p => p.parentId === selectedProject.id);
            if (isParent) {
                loadParentProjectData();
            } else {
                loadProjectData();
            }
            setSelectedTransactionIds(new Set());
            setSelectedInventoryIds(new Set());
            setSelectedActivityIds(new Set());
            setSelectedLaborIds(new Set());
        } else {
            setActivities([]);
            setLaborItems([]);
            setBudgetItems([]);
            setTransactions([]);
            setInventoryItems([]);
            setCertifications([]);
        }
    }, [selectedProject, loadProjectData, loadParentProjectData, projects]);
    
     const updateAllProjectCosts = React.useCallback(async (allProjects: Project[], allMaterialPrices: Record<string, number>) => {
        const costs: Record<number, { usd: number, cup: number }> = {};
        const childProjects = allProjects.filter(p => p.parentId);
        const standaloneProjects = allProjects.filter(p => !p.parentId && !allProjects.some(child => child.parentId === p.id));
        const projectsToCalculate = [...childProjects, ...standaloneProjects];

        for (const project of projectsToCalculate) {
            if (!project.id) continue;
            
            const [projectActivities, projectLaborItems, projectBudgetItems] = await Promise.all([
                getActivities(project.id!),
                getLaborItems(project.id!),
                getBudgetItems(project.id!)
            ]);

            const materialTotal = projectActivities.reduce((total, activity) => {
                return total + activity.results.reduce((activityTotal, material) => {
                    if (material.name.toLowerCase().includes('acero') && material.unit.toLowerCase() === 'kg') {
                        return activityTotal;
                    }
                    const price = material.unitPrice || getMaterialPrice(material.name, material.unit, allMaterialPrices) || 0;
                    return activityTotal + (Number(material.quantity) * price);
                }, 0);
            }, 0);

            const laborTotal = projectLaborItems.reduce((total, item) => total + (Number(item.quantity) * Number(item.unitPrice)), 0);
            const budgetTotal = projectBudgetItems.reduce((total, item) => total + Number(item.cost), 0);
            
            const logisticsCost = laborTotal * ((project.logisticsPercentage ?? 0) / 100);
            const techAssistCost = laborTotal * ((project.technicalAssistancePercentage ?? 0) / 100);
            const toolsAndUtilitiesCost = laborTotal * ((project.toolsAndUtilitiesPercentage ?? 0) / 100);
            const transportCost = materialTotal * ((project.transportPercentage ?? 0) / 100);
            const contingencyCost = (materialTotal + laborTotal + budgetTotal) * ((project.contingencyPercentage ?? 0) / 100);
            const subtotal = materialTotal + laborTotal + budgetTotal + logisticsCost + techAssistCost + transportCost + contingencyCost + toolsAndUtilitiesCost;
            const profitCost = subtotal * ((project.profitPercentage ?? 0) / 100);

            let usdCost = subtotal + profitCost;

            if (project.hasServiceTax && project.serviceTaxPercentage && project.serviceTaxPercentage > 0) {
                const taxRate = project.serviceTaxPercentage / 100;
                if (taxRate < 1) {
                    usdCost = usdCost / (1 - taxRate);
                }
            }

            const rate = project.exchangeRate || 380;
            costs[project.id] = { usd: usdCost, cup: usdCost * rate };
        }
        
        const parentProjects = allProjects.filter(p => !p.parentId);
        for (const parent of parentProjects) {
            const children = allProjects.filter(p => p.parentId === parent.id);
            if (children.length > 0) {
                const usdTotal = children.reduce((sum, child) => sum + (costs[child.id!]?.usd || 0), 0);
                const cupTotal = children.reduce((sum, child) => sum + (costs[child.id!]?.cup || 0), 0);
                costs[parent.id!] = { usd: usdTotal, cup: cupTotal };
            }
        }
        
        setProjectCosts(costs);
    }, []);

    React.useEffect(() => {
        if (!selectedProject && projects.length > 0) {
            updateAllProjectCosts(projects, materialPrices);
        }
    }, [projects, selectedProject, materialPrices, updateAllProjectCosts]);


    // Project handlers
    const handleOpenProjectModal = (project: Project | null) => {
        setEditingProject(project);
        if (project) {
            setProjectFormData({
                name: project.name,
                clientName: project.clientName || '',
                clientAddress: project.clientAddress || ''
            });
        } else {
            setProjectFormData({ name: '', clientName: '', clientAddress: '' });
        }
        setIsProjectModalOpen(true);
    };

    const handleSaveProject = async () => {
        if (!projectFormData.name.trim()) return;
        if (editingProject) {
            await updateProject({ ...editingProject, ...projectFormData });
        } else {
            const defaults = libraryData?.indirect_expenses_defaults || {
                logisticsPercentage: 5,
                technicalAssistancePercentage: 5,
                toolsAndUtilitiesPercentage: 3,
                transportPercentage: 5,
                contingencyPercentage: 5,
                profitPercentage: 15,
            };

            await addProject({ 
                ...projectFormData,
                createdAt: new Date(),
                exchangeRate: 380,
                logisticsPercentage: defaults.logisticsPercentage,
                technicalAssistancePercentage: defaults.technicalAssistancePercentage,
                toolsAndUtilitiesPercentage: defaults.toolsAndUtilitiesPercentage,
                transportPercentage: defaults.transportPercentage,
                contingencyPercentage: defaults.contingencyPercentage,
                profitPercentage: defaults.profitPercentage,
            });
        }
        await loadInitialData();
        setIsProjectModalOpen(false);
        setProjectFormData({ name: '', clientName: '', clientAddress: '' });
        setEditingProject(null);
    };

    const handleConfirmDuplicate = async () => {
        if (!projectToDuplicate?.id) return;
    
        setIsLoading(true);
        closeModals();
        try {
            const newProjectId = await duplicateProject(projectToDuplicate.id);
            if (newProjectId) {
                await loadInitialData();
            } else {
                alert('Ocurrió un error al duplicar el proyecto.');
            }
        } catch (error) {
            console.error("Error duplicating project:", error);
            alert('Ocurrió un error al duplicar el proyecto.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSelectProject = (project: Project) => {
        if (typeof project.technicalAssistancePercentage === 'undefined' && typeof project.logisticsPercentage !== 'undefined') {
            const combined = project.logisticsPercentage;
            project.logisticsPercentage = combined / 2;
            project.technicalAssistancePercentage = combined / 2;
        }
        setSelectedProject(project);
        setCurrentView('financials'); 
    };

    const handleAssignParent = async (childProject: Project, parentId: number | null) => {
        const updatedProject: Project = { ...childProject }; 

        if (parentId === null) {
            delete updatedProject.parentId;
        } else {
            const parentProject = projects.find(p => p.id === parentId);
            updatedProject.parentId = parentId;
            if (parentProject) {
                updatedProject.clientName = parentProject.clientName;
                updatedProject.clientAddress = parentProject.clientAddress;
            }
        }

        await updateProject(updatedProject);
        await loadInitialData();
        closeModals();
    };

    // Activity handlers
    const handleOpenActivityModal = (type: ActivityType, activity: Activity | null, customActivity?: CustomMaterialActivity) => {
        setSelectedActivityType(type);
        setEditingActivity(activity);
        setSelectedCustomActivity(customActivity || null);
        setIsActivityModalOpen(true);
    };
    
    // Labor Item Handlers
    const handleSaveLaborItem = async (item: Omit<LaborItem, 'id' | 'projectId'>) => {
        if (!selectedProject) return;
        
        let itemToSave = { ...item };
        if (displayCurrency === 'CUP') {
            const rate = selectedProject.exchangeRate || 380;
            itemToSave.unitPrice = itemToSave.unitPrice / rate;
        }

        if(editingLaborItem) {
            await updateLaborItem({ ...editingLaborItem, ...itemToSave });
        } else {
            await addLaborItem({ ...itemToSave, projectId: selectedProject.id! });
        }
        await loadProjectData();
        setIsLaborItemModalOpen(false);
        setEditingLaborItem(null);
    };

    const handleSaveLaborAndAddMaterials = async (item: Omit<LaborItem, 'id' | 'projectId'>, materialType: ActivityType) => {
        if (!selectedProject) return;

        let itemToSave = { ...item };
        if (displayCurrency === 'CUP') {
            const rate = selectedProject.exchangeRate || 380;
            itemToSave.unitPrice = itemToSave.unitPrice / rate;
        }

        await addLaborItem({ ...itemToSave, projectId: selectedProject.id! });

        closeModals();
        handleOpenActivityModal(materialType, null);

        await loadProjectData();
    };

    // Budget Item Handlers
    const handleSaveBudgetItem = async (item: Omit<BudgetItem, 'id' | 'projectId'>) => {
        if (!selectedProject) return;
        
        let itemToSave = { ...item };
        if (displayCurrency === 'CUP') {
            const rate = selectedProject.exchangeRate || 380;
            itemToSave.cost = itemToSave.cost / rate;
        }

        if(editingBudgetItem) {
            await updateBudgetItem({ ...editingBudgetItem, ...itemToSave });
        } else {
            await addBudgetItem({ ...itemToSave, projectId: selectedProject.id! });
        }
        await loadProjectData();
        setIsBudgetItemModalOpen(false);
        setEditingBudgetItem(null);
    };
    
    // Transaction Handlers
    const handleSaveTransaction = async (item: Omit<Transaction, 'id' | 'projectId'>, addToInventory: boolean) => {
        if (!selectedProject) return;
        
        let itemToSave = { ...item };
        if (displayCurrency === 'CUP') {
            const rate = selectedProject.exchangeRate || 380;
            itemToSave.amount = itemToSave.amount / rate;
        }

        if (editingTransaction) {
            await updateTransaction({ ...editingTransaction, ...itemToSave });
            await loadProjectData();
            closeModals();
        } else {
            await addTransaction({ ...itemToSave, projectId: selectedProject.id! });

            if (addToInventory) {
                const materialName = item.description.replace(/^Compra de /i, '').trim();
                const matchingMaterial = totalMaterials.find(m => m.name.trim().toLowerCase() === materialName.toLowerCase());
                const materialUnit = matchingMaterial ? matchingMaterial.unit : '';

                setInventoryDefaults({ name: materialName, unit: materialUnit }); 
                setEditingInventoryItem(null);
                setIsTransactionModalOpen(false); 
                setIsInventoryItemModalOpen(true); 
            } else {
                await loadProjectData();
                closeModals();
            }
        }
    };
    
    const handleOpenPurchaseModal = (material: Material) => {
        setTransactionDefaults({
            description: `Compra de ${material.name}`,
            category: 'Materiales',
            type: TransactionType.EXPENSE,
            amount: material.unitPrice || 0, // Fallback price
        });
        setEditingTransaction(null);
        setIsTransactionModalOpen(true);
    };

    const handleOpenManualExpensePurchase = (budgetItem: BudgetItem) => {
        setTransactionDefaults({
            description: budgetItem.name,
            category: budgetItem.category || 'Otros',
            amount: budgetItem.cost, 
            type: TransactionType.EXPENSE,
        });
        setEditingTransaction(null);
        setIsTransactionModalOpen(true);
    };

    // Inventory Handlers
    const handleSaveInventoryItem = async (itemData: Omit<InventoryItem, 'id' | 'projectId' | 'quantityUsed' | 'dateAdded'>) => {
        if (!selectedProject) return;
        if (editingInventoryItem) {
            await updateInventoryItem({ ...editingInventoryItem, ...itemData });
        } else {
            await addInventoryItem({
                ...itemData,
                projectId: selectedProject.id!,
                quantityUsed: 0,
                dateAdded: new Date().toISOString().slice(0, 10),
            });
        }
        await loadProjectData();
        closeModals();
    };

    const handleOpenUseModal = (item: InventoryItem) => {
        setItemToUse(item);
        setUseQuantity('');
        setIsUseInventoryModalOpen(true);
    };

    const handleConfirmUseItem = async () => {
        if (!itemToUse || !useQuantity) return;
        const quantity = parseFloat(useQuantity);
        const available = Number(itemToUse.quantityPurchased) - Number(itemToUse.quantityUsed);
        if (isNaN(quantity) || quantity <= 0 || quantity > available) {
            alert('La cantidad a usar es inválida o excede la disponible.');
            return;
        }
        await updateInventoryItem({
            ...itemToUse,
            quantityUsed: Number(itemToUse.quantityUsed) + quantity,
        });
        await loadProjectData();
        closeModals();
    };

    const handleOpenUseFromInventoryModal = (material: Material) => {
        setMaterialToFulfill(material);
        setIsUseFromInventoryModalOpen(true);
    };

    const handleConfirmFulfillNeed = async (usageData: Record<string, number>) => {
        const updatedItems: InventoryItem[] = [];
        for (const itemIdStr in usageData) {
            const itemId = parseInt(itemIdStr, 10);
            const quantityToUse = usageData[itemIdStr];
            if (quantityToUse > 0) {
                const itemToUpdate = inventoryItems.find(i => i.id === itemId);
                if (itemToUpdate) {
                    const updatedItem = {
                        ...itemToUpdate,
                        quantityUsed: Number(itemToUpdate.quantityUsed) + quantityToUse,
                    };
                    updatedItems.push(updatedItem);
                }
            }
        }
        
        if (updatedItems.length > 0) {
            await Promise.all(updatedItems.map(item => updateInventoryItem(item)));
            await loadProjectData();
        }
        
        closeModals();
    };

    const handleOpenAddToInventoryModalForMaterial = (material: Material) => {
        setInventoryDefaults({ name: material.name, unit: material.unit });
        setEditingInventoryItem(null);
        setIsInventoryItemModalOpen(true);
    };


    const handleSaveActivity = async (name: string, inputs: Record<string, any>) => {
        if (!selectedProject || !selectedActivityType) return;
        
        const parsedInputs: { [key: string]: any } = {};
        for (const key in inputs) {
            const value = inputs[key];
            if (
                key !== 'customName' && key !== 'customActivityId' &&
                typeof value === 'string' &&
                value.trim() !== '' &&
                !isNaN(Number(value))
            ) {
                parsedInputs[key] = parseFloat(value);
            } else {
                parsedInputs[key] = value;
            }
        }
        
        const results = await calculateMaterials(selectedActivityType, parsedInputs);
        const resultsWithPrices = results.map(material => {
            if (editingActivity) {
                const existingMaterial = editingActivity.results.find(m => 
                    m.name.trim().toLowerCase() === material.name.trim().toLowerCase() && 
                    m.unit.trim().toLowerCase() === material.unit.trim().toLowerCase()
                );
                if (existingMaterial && existingMaterial.unitPrice !== undefined && existingMaterial.unitPrice > 0) {
                    return { ...material, unitPrice: existingMaterial.unitPrice };
                }
            }
            const price = getProjectOrGlobalMaterialPrice(material.name, material.unit, editingActivity?.id);
            return {
                ...material,
                unitPrice: price
            };
        });

        
        if (editingActivity) {
            const updatedActivity: Activity = {
                ...editingActivity,
                name: name,
                inputs: parsedInputs,
                results: resultsWithPrices,
            };
            await updateActivity(updatedActivity);
        } else {
            const newActivity: Activity = {
                projectId: selectedProject.id!,
                type: selectedActivityType,
                name: name,
                inputs: parsedInputs,
                results: resultsWithPrices,
            };
            await addActivity(newActivity);
        }
        await loadProjectData();
        setIsActivityModalOpen(false);
        setEditingActivity(null);
        setSelectedActivityType(null);
        setSelectedCustomActivity(null);
    };

    // Delete handlers
    const handleOpenDeleteModal = (type: 'project' | 'activity' | 'labor' | 'budget' | 'transaction' | 'inventory' | 'certification', id: number) => {
        // Extra check for single deletes
        if (type === 'labor') {
            const laborItem = laborItems.find(i => i.id === id);
            if (laborItem && (laborItem.quantityCompleted || 0) > 0) {
                alert("No se puede eliminar esta actividad porque ya tiene avance ejecutado.");
                return;
            }
        }
        if (type === 'inventory') {
            const invItem = inventoryItems.find(i => i.id === id);
            if (invItem && (Number(invItem.quantityUsed) || 0) > 0) {
                alert("No se puede eliminar este item del inventario porque ya se ha usado material del mismo.");
                return;
            }
        }
        if (type === 'certification') {
            const cert = certifications.find(c => c.id === id);
            if (cert && cert.paymentTransactionId) {
                alert("No se puede eliminar una certificación que ya está cobrada. Primero debe desmarcarla como cobrada en la pestaña de Certificaciones.");
                return;
            }
            // Check if it's a past certification (not the latest)
            const sortedCerts = [...certifications].sort((a, b) => parseLocalDate(a.certifiedAt).getTime() - parseLocalDate(b.certifiedAt).getTime());
            const latestCert = sortedCerts[sortedCerts.length - 1];
            if (latestCert && latestCert.id !== id) {
                alert("No se puede eliminar una certificación pasada. Solo puede eliminar la última certificación creada.");
                return;
            }
        }

        setItemToDelete({ type, id });
        setDeleteAssociatedData(true);
        setIsDeleteModalOpen(true);
    };

    const handleOpenBuyAllModal = (activity: Activity) => {
        setActivityToBuy(activity);
        setIsBuyAllModalOpen(true);
    };

    const handleConfirmResetPurchase = async () => {
        if (!activityToReset) return;
        try {
            await updateActivity({ ...activityToReset, materialsPurchased: false });
            await loadProjectData();
        } catch (error) {
            console.error("Failed to reset purchase status:", error);
        } finally {
            closeModals();
        }
    };

    const handleConfirmUnpayCertification = async () => {
        if (!certificationToUnpay) return;
        try {
            if (certificationToUnpay.paymentTransactionId) {
                await deleteTransaction(certificationToUnpay.paymentTransactionId, true);
            }
            await updateCertification({ ...certificationToUnpay, paymentTransactionId: undefined });
            await loadProjectData();
        } catch (error) {
            console.error("Failed to unmark certification as paid:", error);
        } finally {
            closeModals();
        }
    };
    
    const handleConfirmDelete = async () => {
        if (!itemToDelete) return;
        
        if (itemToDelete.type === 'project') {
            if (licenseState && !licenseState.canDeleteProjects) {
                alert("No se pueden eliminar proyectos con la licencia actual.");
                closeModals();
                return;
            }
            await deleteProject(itemToDelete.id, deleteAssociatedData);
            await loadInitialData();
            setSelectedProject(null);
        } else if (itemToDelete.type === 'activity') {
            await deleteActivity(itemToDelete.id);
        } else if (itemToDelete.type === 'labor') {
            await deleteLaborItem(itemToDelete.id);
        } else if (itemToDelete.type === 'budget') {
            await deleteBudgetItem(itemToDelete.id);
        } else if (itemToDelete.type === 'transaction') {
            await deleteTransaction(itemToDelete.id);
        } else if (itemToDelete.type === 'inventory') {
            await deleteInventoryItem(itemToDelete.id);
        } else if (itemToDelete.type === 'certification') {
            const certToDelete = certifications.find(c => c.id === itemToDelete.id);
            if (certToDelete?.paymentTransactionId) {
                await deleteTransaction(certToDelete.paymentTransactionId, true);
            }
            await deleteCertification(itemToDelete.id);
        }
        
        if (selectedProject?.id && itemToDelete.type !== 'project') {
            await loadProjectData();
        }

        setIsDeleteModalOpen(false);
        setItemToDelete(null);
    };

    const handleDataLibraryClose = async () => {
        closeModals();
        const pricesFromDB = await getMaterialPrices();
        const priceMap = pricesFromDB.reduce((acc: Record<string, number>, item: { name: string, unit: string, price: number }) => {
            acc[`${item.name}-${item.unit}`] = item.price;
            return acc;
        }, {});
        setMaterialPrices(priceMap);
        await loadInitialData(); 
        if (selectedProject) {
            await loadProjectData();
        }
    };

    const closeModals = () => {
        setIsProjectModalOpen(false);
        setIsActivityModalOpen(false);
        setIsDeleteModalOpen(false);
        setIsLaborItemModalOpen(false);
        setIsBudgetItemModalOpen(false);
        setIsTransactionModalOpen(false);
        setIsImportConfirmModalOpen(false);
        setIsDataLibraryOpen(false);
        setIsInventoryItemModalOpen(false);
        setIsUseInventoryModalOpen(false);
        setIsUseFromInventoryModalOpen(false);
        setIsInvoiceModalOpen(false);
        setIsOfferModalOpen(false);
        setIsCertificationModalOpen(false);
        setIsAdvanceInvoiceModalOpen(false); // NEW
        setIsBuyAllModalOpen(false);
        setIsResetConfirmModalOpen(false);
        setIsUnpayConfirmModalOpen(false);
        setIsFullInvoiceConfirmModalOpen(false);
        setIsBulkDeleteModalOpen(false);

        setIsDuplicateModalOpen(false);
        setIsAssignParentModalOpen(false);
        setProjectToMove(null);
        setProjectToDuplicate(null);
        setActivityToBuy(null);
        setActivityToReset(null);
        setCertificationToUnpay(null);
        setMaterialToFulfill(null);
        setEditingProject(null);
        setEditingActivity(null);
        setSelectedActivityType(null);
        setSelectedCustomActivity(null);
        setEditingLaborItem(null);
        setEditingBudgetItem(null);
        setEditingTransaction(null);
        setTransactionDefaults(null);
        setEditingInventoryItem(null);
        setInventoryDefaults(null);
        setItemToUse(null);
        setItemToDelete(null);
        setDataToImport(null);
        setBulkDeleteConfig(null);
        setSelectedTransactionIds(new Set());
        setSelectedInventoryIds(new Set());
        setSelectedActivityIds(new Set());
        setSelectedLaborIds(new Set());
    };
    
    // Exchange Rate Handler
    const handleProjectExchangeRateCommit = (rateStr: string) => {
        if (!selectedProject) return;

        const newRate = parseFloat(rateStr);
        const rateToSet = isNaN(newRate) || newRate <= 0 ? 380 : newRate; 

        setSelectedProject(prev => prev ? ({ ...prev, exchangeRate: rateToSet }) : null);
    };

    // Editable Price Handlers
    const handleMaterialPriceChange = async (materialName: string, materialUnit: string, newPriceStr: string) => {
        let newPrice = parseFloat(newPriceStr);
        const priceToSet = isNaN(newPrice) ? 0 : newPrice;
        
        let finalPriceUSD = priceToSet;
        if (displayCurrency === 'CUP' && selectedProject) {
            const rate = selectedProject.exchangeRate || 380;
            finalPriceUSD = priceToSet / rate;
        }

        const updatePromises: Promise<any>[] = [];
        
        const newActivities = activities.map(activity => {
            let activityWasUpdated = false;
            const newResults = activity.results.map(material => {
                if (material.name.trim().toLowerCase() === materialName.trim().toLowerCase() && 
                    material.unit.trim().toLowerCase() === materialUnit.trim().toLowerCase() && 
                    material.unitPrice !== finalPriceUSD) {
                    activityWasUpdated = true;
                    return { ...material, unitPrice: finalPriceUSD };
                }
                return material;
            });

            if (activityWasUpdated) {
                const updatedActivity = { ...activity, results: newResults };
                updatePromises.push(updateActivity(updatedActivity));
                return updatedActivity;
            }
            return activity;
        });

        setActivities(newActivities);
        await Promise.all(updatePromises);
    };

    const handleLaborPriceChange = async (itemId: number, newPriceStr: string) => {
        let newPrice = parseFloat(newPriceStr);
        if (isNaN(newPrice)) { return; }
        
        if (displayCurrency === 'CUP' && selectedProject) {
            const rate = selectedProject.exchangeRate || 380;
            newPrice = newPrice / rate;
        }

        const itemToUpdate = laborItems.find(item => item.id === itemId);
        if (!itemToUpdate || Number(itemToUpdate.unitPrice) === newPrice) { return; }

        const updatedItem = { ...itemToUpdate, unitPrice: newPrice };
        
        setLaborItems(prevItems => prevItems.map(item => item.id === itemId ? updatedItem : item));
        await updateLaborItem(updatedItem);
    };

    const handleLaborCompletionChange = async (itemId: number, newCompletedStr: string, minCompleted: number) => {
        const itemToUpdate = laborItems.find(item => item.id === itemId);
        if (!itemToUpdate) return;
        
        let newCompleted = parseFloat(newCompletedStr);
        if (isNaN(newCompleted)) {
            newCompleted = itemToUpdate.quantityCompleted || 0; 
        }
        
        newCompleted = Math.max(minCompleted, Math.min(newCompleted, Number(itemToUpdate.quantity)));

        const updatedItem = { ...itemToUpdate, quantityCompleted: newCompleted };
        
        setLaborItems(prevItems => prevItems.map(item => item.id === itemId ? updatedItem : item));
        await updateLaborItem(updatedItem);
    };


    const formatDisplayCurrency = React.useCallback((value: number) => {
        return `$${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }, []);

    const projectRates = React.useMemo(() => new Map(projects.map(p => [p.id, p.exchangeRate || 380])), [projects]);

    // Calculations
    const totalMaterials = React.useMemo(() => {
        const summary: Record<string, Material> = {};
        activities.forEach(activity => {
            activity.results.forEach(material => {
                if (material.name.toLowerCase().includes('acero') && material.unit.toLowerCase() === 'kg') {
                    return; 
                }

                const key = `${material.name.trim().toLowerCase()}-${material.unit.trim().toLowerCase()}`;
                if (summary[key]) {
                    summary[key].quantity = Number(summary[key].quantity) + Number(material.quantity);
                    if (!summary[key].unitPrice && material.unitPrice) {
                        summary[key].unitPrice = material.unitPrice;
                    }
                } else {
                    summary[key] = { ...material };
                }
            });
        });
        
        const inventoryPurchasedMap: Record<string, number> = {};
        inventoryItems.forEach(item => {
            const key = `${item.name.trim().toLowerCase()}-${item.unit.trim().toLowerCase()}`;
            const purchased = Number(item.quantityPurchased);
            if (inventoryPurchasedMap[key]) {
                inventoryPurchasedMap[key] += purchased;
            } else {
                inventoryPurchasedMap[key] = purchased;
            }
        });

         return Object.values(summary)
            .map(material => {
                const key = `${material.name.trim().toLowerCase()}-${material.unit.trim().toLowerCase()}`;
                const currentPrice = material.unitPrice || getMaterialPrice(material.name, material.unit, materialPrices) || 0;
                
                const quantityAvailable = inventoryPurchasedMap[key] || 0;
                return {
                    ...material, 
                    unitPrice: currentPrice,
                    quantityAvailable: quantityAvailable,
                    quantityNeeded: Math.max(0, Number(material.quantity) - quantityAvailable),
                }
            })
            .sort((a, b) => a.name.localeCompare(b.name));
    }, [activities, inventoryItems, materialPrices]);

    const isParent = projects.some(p => p.parentId === selectedProject?.id);
    const getRate = (itemProjectId: number) => isParent ? (projectRates.get(itemProjectId) || 380) : (selectedProject?.exchangeRate || 380);

    const materialGrandTotal = React.useMemo(() => {
        let totalUsd = 0;
        let totalCup = 0;
        activities.forEach(activity => {
            const activityUsd = activity.results.reduce((activityTotal, material) => {
                if (material.name.toLowerCase().includes('acero') && material.unit.toLowerCase() === 'kg') {
                    return activityTotal;
                }
                const currentPrice = material.unitPrice || getMaterialPrice(material.name, material.unit, materialPrices) || 0;
                return activityTotal + (Number(material.quantity) * currentPrice);
            }, 0);
            const rate = getRate(activity.projectId);
            totalUsd += activityUsd;
            totalCup += activityUsd * rate;
        });
        return { usd: totalUsd, cup: totalCup };
    }, [activities, isParent, projectRates, selectedProject, materialPrices]);


    const laborGrandTotal = React.useMemo(() => {
        let totalUsd = 0;
        let totalCup = 0;
        laborItems.forEach(item => {
            const itemUsd = Number(item.quantity) * Number(item.unitPrice);
            const rate = getRate(item.projectId);
            totalUsd += itemUsd;
            totalCup += itemUsd * rate;
        });
        return { usd: totalUsd, cup: totalCup };
    }, [laborItems, isParent, projectRates, selectedProject]);

    const manualBudgetItems = budgetItems;

    const manualBudgetGrandTotal = React.useMemo(() => {
        let totalUsd = 0;
        let totalCup = 0;
        manualBudgetItems.forEach(item => {
            const itemUsd = Number(item.cost);
            const rate = getRate(item.projectId);
            totalUsd += itemUsd;
            totalCup += itemUsd * rate;
        });
        return { usd: totalUsd, cup: totalCup };
    }, [manualBudgetItems, isParent, projectRates, selectedProject]);

    const automaticBudgetItems = React.useMemo(() => {
        if (!selectedProject) return { items: [], total: { usd: 0, cup: 0 }, tax: { usd: 0, cup: 0 } };
        
        let logisticsUsd = 0, techAssistUsd = 0, toolsAndUtilitiesUsd = 0, transportUsd = 0, contingencyUsd = 0, profitUsd = 0, taxUsd = 0;
        let logisticsCup = 0, techAssistCup = 0, toolsAndUtilitiesCup = 0, transportCup = 0, contingencyCup = 0, profitCup = 0, taxCup = 0;
        
        const projectsToConsider = isParent ? projects.filter(p => p.parentId === selectedProject.id) : [selectedProject];

        projectsToConsider.forEach(proj => {
            const projRate = proj.exchangeRate || 380;
            const projLabor = laborItems.filter(i => i.projectId === proj.id).reduce((sum, i) => sum + (Number(i.quantity) * Number(i.unitPrice)), 0);
            
            const projMaterial = activities.filter(a => a.projectId === proj.id).reduce((sum, a) => sum + a.results.reduce((s, m) => {
                if (m.name.toLowerCase().includes('acero') && m.unit.toLowerCase() === 'kg') return s;
                const currentPrice = m.unitPrice || getMaterialPrice(m.name, m.unit, materialPrices) || 0;
                return s + (Number(m.quantity) * currentPrice);
            }, 0), 0);
            
            const projManualBudget = manualBudgetItems.filter(i => i.projectId === proj.id).reduce((sum, i) => sum + Number(i.cost), 0);

            const projLogistics = projLabor * ((proj.logisticsPercentage ?? 0) / 100);
            const projTechAssist = projLabor * ((proj.technicalAssistancePercentage ?? 0) / 100);
            const projToolsAndUtilities = projLabor * ((proj.toolsAndUtilitiesPercentage ?? 0) / 100);
            const projTransport = projMaterial * ((proj.transportPercentage ?? 0) / 100);
            const projContingency = (projMaterial + projLabor + projManualBudget) * ((proj.contingencyPercentage ?? 0) / 100);
            
            const subtotal = projMaterial + projLabor + projManualBudget + projLogistics + projTechAssist + projToolsAndUtilities + projTransport + projContingency;
            const projProfit = subtotal * ((proj.profitPercentage ?? 0) / 100);
            const totalBeforeTax = subtotal + projProfit;

            let projTax = 0;
            if (proj.hasServiceTax && proj.serviceTaxPercentage && proj.serviceTaxPercentage > 0) {
                const taxRate = proj.serviceTaxPercentage / 100;
                const totalWithTax = totalBeforeTax / (1 - taxRate);
                projTax = totalWithTax - totalBeforeTax;
            }
            
            logisticsUsd += projLogistics;
            techAssistUsd += projTechAssist;
            toolsAndUtilitiesUsd += projToolsAndUtilities;
            transportUsd += projTransport;
            contingencyUsd += projContingency;
            profitUsd += projProfit;
            taxUsd += projTax;

            logisticsCup += projLogistics * projRate;
            techAssistCup += projTechAssist * projRate;
            toolsAndUtilitiesCup += projToolsAndUtilities * projRate;
            transportCup += projTransport * projRate;
            contingencyCup += projContingency * projRate;
            profitCup += projProfit * projRate;
            taxCup += projTax * projRate;
        });
        
        const items = [
            { name: 'Logística', usd: logisticsUsd, cup: logisticsCup },
            { name: 'Asistencia Técnica', usd: techAssistUsd, cup: techAssistCup },
            { name: 'Gastos de Útiles y Herramientas', usd: toolsAndUtilitiesUsd, cup: toolsAndUtilitiesCup },
            { name: 'Transportación', usd: transportUsd, cup: transportCup },
            { name: 'Imprevistos', usd: contingencyUsd, cup: contingencyCup },
            { name: 'Utilidad', usd: profitUsd, cup: profitCup },
        ];
        
        const total = {
            usd: logisticsUsd + techAssistUsd + toolsAndUtilitiesUsd + transportUsd + contingencyUsd + profitUsd,
            cup: logisticsCup + techAssistCup + toolsAndUtilitiesCup + transportCup + contingencyCup + profitCup
        };

        const tax = {
            usd: taxUsd,
            cup: taxCup
        };

        return { items, total, tax };
    }, [selectedProject, projects, activities, laborItems, manualBudgetItems, isParent, materialPrices]);


    const budgetGrandTotal = React.useMemo(() => {
        return {
            usd: manualBudgetGrandTotal.usd + automaticBudgetItems.total.usd,
            cup: manualBudgetGrandTotal.cup + automaticBudgetItems.total.cup
        };
    }, [manualBudgetGrandTotal, automaticBudgetItems.total]);
    
    const taxGrandTotal = automaticBudgetItems.tax;

    const financialSummary = React.useMemo(() => {
        let totalIncomeUsd = 0, totalIncomeCup = 0;
        let totalExpenseUsd = 0, totalExpenseCup = 0;
        let totalAnticipoUsd = 0, totalAnticipoCup = 0;

        transactions.forEach(t => {
            const rate = getRate(t.projectId);
            const amountUsd = Number(t.amount);
            const amountCup = amountUsd * rate;

            if (t.type === TransactionType.INCOME) {
                totalIncomeUsd += amountUsd;
                totalIncomeCup += amountCup;
                if (t.category === 'Anticipo de obra') {
                    totalAnticipoUsd += amountUsd;
                    totalAnticipoCup += amountCup;
                }
            } else {
                totalExpenseUsd += amountUsd;
                totalExpenseCup += amountCup;
            }
        });

        const totalBudget = {
            usd: materialGrandTotal.usd + laborGrandTotal.usd + budgetGrandTotal.usd + taxGrandTotal.usd,
            cup: materialGrandTotal.cup + laborGrandTotal.cup + budgetGrandTotal.cup + taxGrandTotal.cup,
        };

        const balance = {
            usd: totalIncomeUsd - totalExpenseUsd,
            cup: totalIncomeCup - totalExpenseCup,
        };
        
        const anticipoPercentage = totalBudget.usd > 0 ? (totalAnticipoUsd / totalBudget.usd) * 100 : 0;

        return {
            totalIncome: { usd: totalIncomeUsd, cup: totalIncomeCup },
            totalExpense: { usd: totalExpenseUsd, cup: totalExpenseCup },
            totalBudget,
            balance,
            totalAnticipo: { usd: totalAnticipoUsd, cup: totalAnticipoCup },
            status: { usd: totalIncomeUsd - totalExpenseUsd, cup: totalIncomeCup - totalExpenseCup },
            anticipoPercentage
        };
    }, [transactions, materialGrandTotal, laborGrandTotal, budgetGrandTotal, taxGrandTotal, getRate]);
    
    const plannedCostsChart = React.useMemo(() => {
        if (!selectedProject) return { materials: 0, labor: 0, transportation: 0, manual: 0, indirect: 0 };
        
        const transportCostItem = automaticBudgetItems.items.find(i => i.name === 'Transportación');
        const transportVal = displayCurrency === 'CUP' ? (transportCostItem?.cup || 0) : (transportCostItem?.usd || 0);
        
        const totalIndirectVal = displayCurrency === 'CUP' ? (automaticBudgetItems.total.cup + automaticBudgetItems.tax.cup) : (automaticBudgetItems.total.usd + automaticBudgetItems.tax.usd);
        const indirectCosts = totalIndirectVal - transportVal;
        
        return {
            materials: displayCurrency === 'CUP' ? materialGrandTotal.cup : materialGrandTotal.usd,
            labor: displayCurrency === 'CUP' ? laborGrandTotal.cup : laborGrandTotal.usd,
            transportation: transportVal,
            manual: displayCurrency === 'CUP' ? manualBudgetGrandTotal.cup : manualBudgetGrandTotal.usd,
            indirect: indirectCosts
        };
    }, [materialGrandTotal, laborGrandTotal, manualBudgetGrandTotal, automaticBudgetItems, selectedProject, displayCurrency]);

    const realCostsByCategory = React.useMemo(() => {
        const costs = {
            materials: 0,
            labor: 0,
            transportation: 0,
            manual: 0,
            indirect: 0,
        };

        const isParentProject = projects.some(p => p.parentId === selectedProject?.id);

        if (isParentProject) {
            // Aggregate from all child projects, each respecting its own rate for CUP view
            const childProjects = projects.filter(p => p.parentId === selectedProject?.id);
            childProjects.forEach(child => {
                const childCerts = certifications.filter(c => c.projectId === child.id);
                const lastCert = childCerts.length > 0 ? childCerts[childCerts.length - 1] : null;
                const rate = displayCurrency === 'CUP' ? (child.exchangeRate || 380) : 1;

                if (lastCert) {
                    const snap = lastCert.snapshot;
                    costs.materials += snap.materialExpenseCost * rate;
                    costs.labor += snap.completedLaborCost * rate;
                    costs.transportation += snap.transportExpenseCost * rate;
                    costs.manual += snap.manualExpenseCost * rate;
                    costs.indirect += (snap.logisticsCost + snap.technicalAssistanceCost + (snap.toolsAndUtilitiesCost || 0) + snap.profitCost + (snap.serviceTaxCost || 0)) * rate;
                } else {
                    // Fallback to transactions for this child if no certifications
                    transactions
                        .filter(t => t.projectId === child.id && t.type === TransactionType.EXPENSE)
                        .forEach(t => {
                            const val = Number(t.amount) * rate;
                            if (t.category === 'Materiales') costs.materials += val;
                            else if (t.category === 'Mano de Obra') costs.labor += val;
                            else if (t.category === 'Transporte') costs.transportation += val;
                            else costs.manual += val;
                        });
                }
            });
        } else {
            // Standard single project logic
            const lastCert = certifications.length > 0 ? certifications[certifications.length - 1] : null;
            const rate = displayCurrency === 'CUP' ? (selectedProject?.exchangeRate || 380) : 1;

            if (lastCert) {
                const snap = lastCert.snapshot;
                costs.materials = snap.materialExpenseCost * rate;
                costs.labor = snap.completedLaborCost * rate;
                costs.transportation = snap.transportExpenseCost * rate;
                costs.manual = snap.manualExpenseCost * rate;
                costs.indirect = (snap.logisticsCost + snap.technicalAssistanceCost + (snap.toolsAndUtilitiesCost || 0) + snap.profitCost + (snap.serviceTaxCost || 0)) * rate;
            } else {
                transactions
                    .filter(t => t.type === TransactionType.EXPENSE)
                    .forEach(t => {
                        const val = Number(t.amount) * rate;
                        if (t.category === 'Materiales') costs.materials += val;
                        else if (t.category === 'Mano de Obra') costs.labor += val;
                        else if (t.category === 'Transporte') costs.transportation += val;
                        else costs.manual += val;
                    });
            }
        }
        
        return costs;
    }, [selectedProject, projects, transactions, certifications, displayCurrency]);

    const allBudgetItemsForExport = React.useMemo(() => {
        if (!selectedProject) return [];
        const autoItems: BudgetItem[] = automaticBudgetItems.items.map(item => ({
            category: 'Gasto Calculado',
            name: `${item.name}`,
            cost: item.usd,
            projectId: selectedProject.id!,
        }));
        if (automaticBudgetItems.tax.usd > 0) {
            autoItems.push({
                category: 'Impuesto',
                name: 'Impuesto sobre Servicio',
                cost: automaticBudgetItems.tax.usd,
                projectId: selectedProject.id!,
            });
        }
        return [...autoItems, ...manualBudgetItems];
    }, [automaticBudgetItems, manualBudgetItems, selectedProject]);


    const handleExportPDF = () => {
        if (selectedProject) {
            const effectiveExchangeRate = financialSummary.totalBudget.usd > 0
                ? financialSummary.totalBudget.cup / financialSummary.totalBudget.usd
                : selectedProject.exchangeRate || 380;
                
            exportProjectToPDF(selectedProject, activities, totalMaterials, materialGrandTotal.usd, laborItems, laborGrandTotal.usd, allBudgetItemsForExport, budgetGrandTotal.usd + taxGrandTotal.usd, transactions, effectiveExchangeRate);
        }
    };

    const handleExportSchedule = () => {
        if (selectedProject) {
            const metrics = calculateSchedule(laborItems, selectedProject.startDate || new Date().toISOString().slice(0,10), !!selectedProject.excludeSaturdays, !!selectedProject.excludeSundays);
            exportScheduleToPDF(selectedProject, Object.values(metrics.scheduleItems));
        }
    };
    
    const handleConfirmBuyAll = async (activity: Activity, addToInventory: boolean, subtractInventory: boolean) => {
        if (!selectedProject) return;

        const materialsToBuy = activity.results.map(m => {
            const key = `${m.name.trim().toLowerCase()}-${m.unit.trim().toLowerCase()}`;
            const currentPrice = m.unitPrice || getMaterialPrice(m.name, m.unit, materialPrices) || 0;
            
            // Calculate available quantity in inventory for this specific project/material
            const available = inventoryItems
                .filter(item => `${item.name.trim().toLowerCase()}-${item.unit.trim().toLowerCase()}` === key)
                .reduce((sum, item) => sum + (Number(item.quantityPurchased) - Number(item.quantityUsed)), 0);

            const quantityNeeded = subtractInventory ? Math.max(0, m.quantity - available) : m.quantity;

            return {
                ...m,
                unitPrice: currentPrice,
                quantityNeeded
            };
        }).filter(m => {
            if (m.name.toLowerCase().includes('acero') && m.unit.toLowerCase() === 'kg') return false;
            return m.unitPrice > 0 && m.quantityNeeded > 0;
        });

        if (materialsToBuy.length === 0) {
            alert("No hay materiales con precio definido o faltantes en esta actividad para comprar.");
            closeModals();
            return;
        }

        const date = new Date().toISOString().slice(0, 10);

        for (const material of materialsToBuy) {
            const totalCost = material.quantityNeeded * material.unitPrice;
            if (totalCost <= 0) continue; 

            const transaction: Omit<Transaction, 'id' | 'projectId'> = {
                type: TransactionType.EXPENSE,
                description: `Compra de ${material.name} (Act: ${activity.name})`,
                amount: totalCost,
                date,
                category: 'Materiales',
            };
            await addTransaction({ ...transaction, projectId: selectedProject.id! });

            if (addToInventory) {
                if (!isPro) {
                    setIsLicenseModalOpen(true);
                    continue;
                }
                const inventoryItem: Omit<InventoryItem, 'id' | 'projectId' | 'quantityUsed' | 'dateAdded'> = {
                    name: material.name,
                    quantityPurchased: material.quantityNeeded,
                    unit: material.unit,
                };
                await addInventoryItem({
                    ...inventoryItem,
                    projectId: selectedProject.id!,
                    quantityUsed: 0,
                    dateAdded: date,
                });
            }
        }

        await updateActivity({ ...activity, materialsPurchased: true });
        await loadProjectData();
        closeModals();
    };

    // Data Sync Handlers
    const handleExportData = async () => {
        if (!isPro) {
            setIsLicenseModalOpen(true);
            return;
        }
        try {
            const data = await exportAllData();
            const jsonString = JSON.stringify(data, null, 2);
            const blob = new Blob([jsonString], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            const date = new Date().toISOString().slice(0, 10);
            a.download = `habitex_calcula_backup_${date}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        } catch (error) {
            console.error("Error exporting data:", error);
            alert("Ocurrió un error al exportar los datos.");
        }
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (!isPro) {
            setIsLicenseModalOpen(true);
            return;
        }
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const text = e.target?.result;
                const data = JSON.parse(text as string);
                if (data.projects && data.dataLibrary) {
                    setDataToImport(data);
                    setIsImportConfirmModalOpen(true);
                } else {
                    alert("El archivo de respaldo no tiene el formato correcto o está obsoleto.");
                }
            } catch (error) {
                console.error("Error parsing import file:", error);
                alert("Error al leer el archivo. Asegúrese de que sea un respaldo válido.");
            }
        };
        reader.readAsText(file);
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    const handleConfirmImport = async () => {
        if (!dataToImport) return;
        try {
            await importAllData(dataToImport);
            await loadInitialData(); 
            setSelectedProject(null); 
            closeModals();
            alert("¡Datos importados con éxito! Los proyectos existentes no han sido modificados.");
        } catch (error) {
            console.error("Error importing data:", error);
            alert("Ocurrió un error al importar los datos.");
        }
    };

    const handleDataLibrarySave = async (
        updatedLibrary: Record<string, any>, 
        originalLibrary: Record<string, any>,
        action: 'global' | 'global_and_recalculate' | 'project_only_update'
    ) => {
        setIsDataLibraryOpen(false); 
        try {
            if (action === 'project_only_update' && selectedProject?.id) {
                const originalMultiplier = originalLibrary.labor_multiplier_factor ?? 1.0;
                const updatedMultiplier = updatedLibrary.labor_multiplier_factor ?? 1.0;
                const originalLabor = originalLibrary.labor_activities as PredefinedLaborActivity[];
                const updatedLabor = updatedLibrary.labor_activities as PredefinedLaborActivity[];
                
                const originalPriceMap = new Map(originalLabor.map(item => [item.name, item.priceUSD * originalMultiplier]));
                const priceChanges = new Map<string, number>();

                for (const updatedItem of updatedLabor) {
                    const originalPrice = originalPriceMap.get(updatedItem.name);
                    const multipliedPrice = updatedItem.priceUSD * updatedMultiplier;
                    if (originalPrice !== undefined) {
                        priceChanges.set(updatedItem.name, multipliedPrice);
                    }
                }

                // If multiplier itself changed, ensure we also apply the updated multiplier to all items
                if (originalMultiplier !== updatedMultiplier) {
                    for (const updatedItem of updatedLabor) {
                        priceChanges.set(updatedItem.name, updatedItem.priceUSD * updatedMultiplier);
                    }
                }
                
                if (priceChanges.size > 0) {
                    const projectLaborItems = await getLaborItems(selectedProject.id);
                    const updatesToPerform = projectLaborItems
                        .filter(item => priceChanges.has(item.name) && item.unitPrice !== priceChanges.get(item.name))
                        .map(item => updateLaborItem({ ...item, unitPrice: priceChanges.get(item.name)! }));

                    await Promise.all(updatesToPerform);
                }
            } else {
                for (const key in updatedLibrary) {
                    if (updatedLibrary.hasOwnProperty(key)) {
                        await updateDataLibraryItem(key, updatedLibrary[key]);
                    }
                }

                if (action === 'global_and_recalculate' && selectedProject?.id) {
                    const projectIdToRecalculate = selectedProject.id;
                    const [activitiesToUpdate, laborToUpdate, freshLibrary] = await Promise.all([
                        getActivities(projectIdToRecalculate),
                        getLaborItems(projectIdToRecalculate),
                        getDataLibrary(),
                    ]);

                    for (const activity of activitiesToUpdate) {
                        if (activity.type === ActivityType.CUSTOM) continue;
                        const newResults = await calculateMaterials(activity.type, activity.inputs);
                        
                        const resultsWithPrices = newResults.map(material => {
                            const existingMaterial = activity.results.find(m => 
                                m.name.trim().toLowerCase() === material.name.trim().toLowerCase() && 
                                m.unit.trim().toLowerCase() === material.unit.trim().toLowerCase()
                            );
                            if (existingMaterial && existingMaterial.unitPrice !== undefined && existingMaterial.unitPrice > 0) {
                                return { ...material, unitPrice: existingMaterial.unitPrice };
                            }
                            const price = getProjectOrGlobalMaterialPrice(material.name, material.unit, activity.id);
                            return { ...material, unitPrice: price };
                        });

                        await updateActivity({ ...activity, results: resultsWithPrices });
                    }

                    const laborLibrary: PredefinedLaborActivity[] = freshLibrary.labor_activities || [];
                    const multiplier = freshLibrary.labor_multiplier_factor ?? 1.0;
                    const laborPriceMap = new Map(laborLibrary.map(item => [item.name, item.priceUSD * multiplier]));
                    for (const laborItem of laborToUpdate) {
                        if (laborPriceMap.has(laborItem.name)) {
                            const newPrice = laborPriceMap.get(laborItem.name)!;
                            if (laborItem.unitPrice !== newPrice) {
                                await updateLaborItem({ ...laborItem, unitPrice: newPrice });
                            }
                        }
                    }
                }
            }
        } catch(e) {
            console.error("Error saving library or recalculating:", e);
        } finally {
            await loadInitialData();
            if (selectedProject) {
                await loadProjectData();
            }
        }
    };
    
    const saveTimeoutRef = React.useRef<number | null>(null);
    React.useEffect(() => {
        if (saveTimeoutRef.current) {
            clearTimeout(saveTimeoutRef.current);
        }
        
        if (selectedProject) {
            saveTimeoutRef.current = window.setTimeout(async () => {
                await updateProject(selectedProject);
                setProjects(prevProjects => 
                    prevProjects.map(p => p.id === selectedProject.id ? selectedProject : p)
                );
            }, 1500);
        }

        return () => {
            if (saveTimeoutRef.current) {
                clearTimeout(saveTimeoutRef.current);
            }
        };
    }, [selectedProject]);

    const handlePercentageChange = (field: keyof Project, value: string) => {
        if (!selectedProject) return;

        const numValue = parseFloat(value);
        
        if (field === 'toolsAndUtilitiesPercentage' && numValue > 5) {
            alert('¡Alerta! El porcentaje de Gastos de Útiles y Herramientas no debe superar el 5%.');
        }

        setSelectedProject(prev => prev ? ({
            ...prev,
            [field]: value === '' || isNaN(numValue) ? undefined : numValue,
        }) : null);
    };

    const handleTaxToggle = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!selectedProject) return;
        const hasTax = e.target.checked;
        const serviceTaxPercentage = hasTax && (!selectedProject.serviceTaxPercentage) ? 10 : selectedProject.serviceTaxPercentage;
        
        setSelectedProject(prev => prev ? ({
            ...prev,
            hasServiceTax: hasTax,
            serviceTaxPercentage: serviceTaxPercentage
        }) : null);
    };

    
    const handleInvoiceGenerated = async (updatedCert: Certification, paymentDate?: string) => {
        let finalCert = updatedCert;
        if (selectedProject) {
            if (paymentDate) {
                try {
                    if (updatedCert.paymentTransactionId) {
                        await deleteTransaction(updatedCert.paymentTransactionId, true);
                    }
                    const paymentTx: Omit<Transaction, 'id' | 'projectId'> = {
                        type: TransactionType.INCOME,
                        description: `Pago de ${updatedCert.name}`,
                        amount: updatedCert.snapshot.finalBillableAmount,
                        date: paymentDate,
                        category: updatedCert.isAdvance ? 'Anticipo de obra' : 'Pago por certificación',
                    };
                    const txId = await addTransaction({ ...paymentTx, projectId: selectedProject.id! });
                    finalCert = { ...updatedCert, paymentTransactionId: txId };
                    await updateCertification(finalCert);
                } catch (error) {
                    console.error("Failed to register invoice payment:", error);
                    alert("La factura se generó pero no se pudo registrar el pago automático.");
                }
            } else {
                if (updatedCert.paymentTransactionId) {
                    try {
                        await deleteTransaction(updatedCert.paymentTransactionId, true);
                        finalCert = { ...updatedCert, paymentTransactionId: undefined };
                        await updateCertification(finalCert);
                    } catch (error) {
                        console.error("Failed to delete old transaction when unmarking paid:", error);
                    }
                }
            }
        }
        setCertifications(prev => prev.map(c => c.id === finalCert.id ? finalCert : c));
        await loadProjectData();
        closeModals();
    };

    const handleViewInvoicePdf = (pdfBlob: Blob) => {
        try {
            const url = URL.createObjectURL(pdfBlob);
            window.open(url, '_blank');
        } catch (error) {
            console.error("Error creating object URL from blob:", error);
            alert("No se pudo abrir el PDF. El archivo podría estar corrupto.");
        }
    };

    const handleDownloadInvoicePdf = (pdfBlob: Blob, certName: string) => {
        try {
            const url = URL.createObjectURL(pdfBlob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `Factura_${certName.replace(/\s+/g, '_') || 'Certificacion'}.pdf`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            setTimeout(() => URL.revokeObjectURL(url), 2000);
        } catch (error) {
            console.error("Error downloading invoice PDF:", error);
            alert("No se pudo descargar el PDF automáticamente.");
        }
    };

    const handleFullCertificationAndInvoice = async () => {
        if (!selectedProject) return;
        setIsLoading(true);
        closeModals(); 

        try {
            const laborUpdates = laborItems
                .filter(item => (item.quantityCompleted || 0) < item.quantity)
                .map(item => updateLaborItem({ ...item, quantityCompleted: item.quantity }));

            const currentTransactions = await getTransactions(selectedProject.id!);
            
            const newTransactionPromises: Promise<any>[] = [];
            const date = new Date().toISOString().slice(0, 10);
            
            totalMaterials
                .filter(m => m.quantityNeeded && m.quantityNeeded > 0 && (m.unitPrice || 0) > 0)
                .forEach(material => {
                    const currentPrice = material.unitPrice || getMaterialPrice(material.name, material.unit, materialPrices) || 0;
                    const totalCost = material.quantityNeeded! * currentPrice;
                    newTransactionPromises.push(addTransaction({
                        projectId: selectedProject.id!,
                        type: TransactionType.EXPENSE,
                        description: `Compra final de ${material.name}`,
                        amount: totalCost,
                        date,
                        category: 'Materiales',
                    }));
                    newTransactionPromises.push(addInventoryItem({
                        projectId: selectedProject.id!,
                        name: material.name,
                        unit: material.unit,
                        quantityPurchased: material.quantityNeeded!,
                        quantityUsed: 0,
                        dateAdded: date,
                    }));
                });

            const plannedTransport = materialGrandTotal.usd * ((selectedProject.transportPercentage || 0) / 100);
            const actualTransport = currentTransactions
                .filter(t => t.type === TransactionType.EXPENSE && t.category === 'Transporte')
                .reduce((sum, t) => sum + t.amount, 0);

            if (plannedTransport > actualTransport) {
                const transportDifference = plannedTransport - actualTransport;
                if (transportDifference > 0.01) {
                    newTransactionPromises.push(addTransaction({
                        projectId: selectedProject.id!,
                        type: TransactionType.EXPENSE,
                        description: 'Gastos de Transporte (Cierre de Obra)',
                        amount: transportDifference,
                        date,
                        category: 'Transporte',
                    }));
                }
            }
            
            const NON_MANUAL_CATEGORIES = ['Materiales', 'Mano de Obra', 'Transporte'];
            const actualManualExpenses = currentTransactions
                .filter(t => t.type === TransactionType.EXPENSE && !NON_MANUAL_CATEGORIES.includes(t.category || ''))
                .reduce((sum, t) => sum + t.amount, 0);

            if (manualBudgetGrandTotal.usd > actualManualExpenses) {
                const manualDifference = manualBudgetGrandTotal.usd - actualManualExpenses;
                if(manualDifference > 0.01) {
                    newTransactionPromises.push(addTransaction({
                        projectId: selectedProject.id!,
                        type: TransactionType.EXPENSE,
                        description: 'Gastos Varios (Cierre de Obra)',
                        amount: manualDifference,
                        date,
                        category: 'Otros',
                    }));
                }
            }

            await Promise.all([...laborUpdates, ...newTransactionPromises]);
            
            const [
                finalLaborItems, 
                finalTransactions,
            ] = await Promise.all([
                getLaborItems(selectedProject.id),
                getTransactions(selectedProject.id),
            ]);

            const lastCert = certifications.length > 0 ? certifications[certifications.length - 1] : null;
            const finalBudgetTotal = budgetGrandTotal.usd;
            const snapshot = calculateCertificationSnapshot(selectedProject, finalLaborItems, finalTransactions, finalBudgetTotal, lastCert?.snapshot || null, financialSummary.anticipoPercentage);
            
            const finalCertification: Omit<Certification, 'id'> = {
                projectId: selectedProject.id,
                name: "Certificación Final (Automática)",
                certifiedAt: new Date().toISOString(),
                snapshot,
            };
            const newCertId = await addCertification(finalCertification as Certification);
            
            const allCerts = await getCertifications(selectedProject.id);
            const newCert = allCerts.find(c => c.id === newCertId);
            const prevCert = allCerts.length > 1 ? allCerts[allCerts.length - 2] : null;

            if (newCert) {
                setInvoiceData({ cert: newCert, prevCert });
                setIsInvoiceModalOpen(true);
            } else {
                throw new Error("Could not find newly created certification.");
            }

        } catch (error) {
            console.error("Error during full certification and invoice process:", error);
            alert("Ocurrió un error al intentar certificar y facturar el proyecto completo.");
        } finally {
            await loadProjectData(); 
            setIsLoading(false);
        }
    };


    const lastCertificationDate = React.useMemo(() => {
        if (!certifications || certifications.length === 0) return null;
        return new Date(certifications[certifications.length - 1].certifiedAt);
    }, [certifications]);
    
    const minLaborQuantities = React.useMemo(() => {
        const minQuantities = new Map<number, number>();
        if (!certifications || certifications.length === 0) return minQuantities;
        
        const lastCertSnapshot = certifications[certifications.length - 1].snapshot;
        lastCertSnapshot.completedLaborItems.forEach(item => {
            if (item.id) {
                minQuantities.set(item.id, item.quantityCompleted || 0);
            }
        });
        return minQuantities;
    }, [certifications]);

    // --- Bulk Delete and Selection Handlers ---

    const handleOpenBulkDeleteModal = (type: 'transaction' | 'inventory' | 'activity' | 'labor') => {
        if (type === 'transaction') {
            setBulkDeleteConfig({
                type: 'transacciones',
                count: selectedTransactionIds.size,
                onConfirm: async () => {
                    await Promise.all(Array.from(selectedTransactionIds).map(id => deleteTransaction(Number(id))));
                    setSelectedTransactionIds(new Set());
                    await loadProjectData();
                }
            });
        } else if (type === 'inventory') {
            setBulkDeleteConfig({
                type: 'items de inventario',
                count: selectedInventoryIds.size,
                onConfirm: async () => {
                    await Promise.all(Array.from(selectedInventoryIds).map(id => deleteInventoryItem(Number(id))));
                    setSelectedInventoryIds(new Set());
                    await loadProjectData();
                }
            });
        } else if (type === 'activity') {
            setBulkDeleteConfig({
                type: 'actividades de materiales',
                count: selectedActivityIds.size,
                onConfirm: async () => {
                    await Promise.all(Array.from(selectedActivityIds).map(id => deleteActivity(Number(id))));
                    setSelectedActivityIds(new Set());
                    await loadProjectData();
                }
            });
        } else if (type === 'labor') {
            setBulkDeleteConfig({
                type: 'actividades de mano de obra',
                count: selectedLaborIds.size,
                onConfirm: async () => {
                    await Promise.all(Array.from(selectedLaborIds).map(id => deleteLaborItem(Number(id))));
                    setSelectedLaborIds(new Set());
                    await loadProjectData();
                }
            });
        }
        setIsBulkDeleteModalOpen(true);
    };

    const handleTransactionSelection = (id: number) => {
        setSelectedTransactionIds(prev => {
            const newSet = new Set(prev);
            if (newSet.has(id)) {
                newSet.delete(id);
            } else {
                newSet.add(id);
            }
            return newSet;
        });
    };

    const isTransactionLocked = React.useCallback((tDateStr: string, tId?: number) => {
        if (!certifications || certifications.length === 0) return false;
        
        // Is this a payment transaction for any certification?
        const isPayment = certifications.some(c => c.paymentTransactionId === tId);
        if (isPayment) {
            return true;
        }

        const sorted = [...certifications].sort((a, b) => parseLocalDate(a.certifiedAt).getTime() - parseLocalDate(b.certifiedAt).getTime());
        const latest = sorted[sorted.length - 1];
        const past = sorted.slice(0, sorted.length - 1);

        const txTime = parseLocalDate(tDateStr).getTime();

        // Locked if in past certs
        const inPast = past.some(c => txTime <= parseLocalDate(c.certifiedAt).getTime());
        if (inPast) return true;

        // Locked if in latest cert AND latest cert is paid
        const latestPaid = latest && !!latest.paymentTransactionId;
        if (latestPaid && txTime <= parseLocalDate(latest.certifiedAt).getTime()) {
            return true;
        }

        return false;
    }, [certifications]);

    const unlockedTransactions = React.useMemo(() => transactions.filter(t => {
        return !isTransactionLocked(t.date, t.id);
    }), [transactions, isTransactionLocked]);

    const handleSelectAllTransactions = () => {
        const allSelected = unlockedTransactions.length > 0 && unlockedTransactions.every(t => selectedTransactionIds.has(t.id!));
        if (allSelected) {
            setSelectedTransactionIds(new Set());
        } else {
            setSelectedTransactionIds(new Set(unlockedTransactions.map(t => t.id!)));
        }
    };
    
    const handleInventorySelection = (id: number) => {
        setSelectedInventoryIds(prev => {
            const newSet = new Set(prev);
            if (newSet.has(id)) {
                newSet.delete(id);
            } else {
                newSet.add(id);
            }
            return newSet;
        });
    };
    
    const handleSelectAllInventory = (itemIds: number[]) => {
        const unlockableIds = itemIds.filter(id => {
            const item = inventoryItems.find(i => i.id === id);
            return item ? (Number(item.quantityUsed) || 0) <= 0 : false;
        });

        const allSelected = unlockableIds.length > 0 && unlockableIds.every(id => selectedInventoryIds.has(id));
        
        if (allSelected) {
            setSelectedInventoryIds(prev => {
                const newSet = new Set(prev);
                itemIds.forEach(id => newSet.delete(id));
                return newSet;
            });
        } else {
            setSelectedInventoryIds(prev => new Set([...prev, ...unlockableIds]));
        }
    };

    const handleActivitySelection = (id: number) => {
        setSelectedActivityIds(prev => {
            const newSet = new Set(prev);
            // FIX: Changed nSet to newSet
            if (newSet.has(id)) newSet.delete(id);
            else newSet.add(id);
            return newSet;
        });
    };

    const handleSelectAllActivities = () => {
        const allSelected = activities.length > 0 && activities.every(a => selectedActivityIds.has(a.id!));
        if (allSelected) setSelectedActivityIds(new Set());
        else setSelectedActivityIds(new Set(activities.map(a => a.id!)));
    };

    const handleLaborSelection = (id: number) => {
        setSelectedLaborIds(prev => {
            const newSet = new Set(prev);
            if (newSet.has(id)) {
                newSet.delete(id);
            } else {
                newSet.add(id);
            }
            return newSet;
        });
    };

    const handleSelectAllLabor = () => {
        const unlockableItems = laborItems.filter(li => (li.quantityCompleted || 0) <= 0);
        const unlockableIds = unlockableItems.map(li => li.id!);

        const allUnlockableSelected = unlockableIds.length > 0 && unlockableIds.every(id => selectedLaborIds.has(id));
        
        if (allUnlockableSelected) {
            setSelectedLaborIds(new Set());
        } else {
            setSelectedLaborIds(new Set(unlockableIds));
        }
    };
    

    const handleRegisterPayment = async (cert: Certification) => {
        if (!selectedProject || !cert.id) return;
    
        const newTransaction: Omit<Transaction, 'id' | 'projectId'> = {
            type: TransactionType.INCOME,
            description: `Pago de ${cert.name}`,
            amount: cert.snapshot.finalBillableAmount,
            date: new Date().toISOString().slice(0, 10),
            // NEW: If it's an advance certification, use "Anticipo de obra" category
            category: cert.isAdvance ? 'Anticipo de obra' : 'Pago por certificación',
        };
    
        try {
            const newTransactionId = await addTransaction({ ...newTransaction, projectId: selectedProject.id });
            const updatedCert: Certification = { ...cert, paymentTransactionId: newTransactionId };
            await updateCertification(updatedCert);
            await loadProjectData(); 
        } catch (error) {
            console.error("Failed to register payment:", error);
            alert("Ocurrió un error al registrar el pago.");
        }
    };

    const toggleProjectExpansion = (projectId: number) => {
        setExpandedProjects(prev => {
            const newSet = new Set(prev);
            if (newSet.has(projectId)) {
                newSet.delete(projectId);
            } else {
                newSet.add(projectId);
            }
            return newSet;
        });
    };

    const renderProjectList = () => {
        const canDeleteProject = licenseState?.canDeleteProjects ?? true;

        const topLevelProjects = projects.filter(p => !p.parentId);

        return (
        <div className="bg-white/90 border border-slate-100 rounded-2xl shadow-sm p-6 sm:p-8 backdrop-blur-subtle">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-5 mb-8 pb-6 border-b border-slate-100/80">
                <div>
                    <h2 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight">Mis Proyectos</h2>
                    <p className="text-xs sm:text-sm text-slate-400 mt-1">Calcula materiales, gestiona presupuestos y controla tus finanzas.</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    <button
                        onClick={() => { setLibraryInitialTab('labor'); setIsDataLibraryOpen(true); }}
                        className="flex items-center gap-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl transition-all shadow-sm text-xs sm:text-sm bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200/50"
                        title="Biblioteca"
                    >
                        <CogIcon className="h-4 w-4 sm:h-4.5 sm:w-4.5 text-slate-400" />
                        <span>Biblioteca</span>
                    </button>
                    <button
                        onClick={() => { if (isPro) handleExportData(); else setIsLicenseModalOpen(true); }}
                        className={`flex items-center gap-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 text-white rounded-xl transition-colors shadow-sm text-xs sm:text-sm ${isPro ? 'bg-slate-500 hover:bg-slate-600' : 'bg-slate-400'}`}
                        title={proFeatureTooltip}
                    >
                        <ArrowUpTrayIcon className="h-4 w-4 sm:h-4.5 sm:w-4.5" />
                        <span>Exportar</span>
                        {!isPro && <ProStarIcon />}
                    </button>
                    <label
                        onClick={() => { if (!isPro) setIsLicenseModalOpen(true); }}
                        className={`flex items-center gap-1.5 px-3 py-1.5 text-white rounded-xl transition-colors shadow-sm text-xs sm:text-sm cursor-pointer ${isPro ? 'bg-slate-500 hover:bg-slate-600' : 'bg-slate-400'}`}
                        title={proFeatureTooltip}
                    >
                        <ArrowDownTrayIcon className="h-4 w-4 sm:h-4.5 sm:w-4.5" />
                        <span>Importar</span>
                        {!isPro && <ProStarIcon />}
                        <input
                            ref={fileInputRef}
                            type="file"
                            className="hidden"
                            accept=".json"
                            onChange={handleFileChange}
                            disabled={!isPro}
                        />
                    </label>
                    {atProjectLimit ? (
                        <button
                            onClick={() => setIsLicenseModalOpen(true)}
                            className="flex items-center gap-1.5 px-3.5 py-1.5 sm:px-4 sm:py-2 bg-yellow-500 text-white rounded-xl hover:bg-yellow-600 transition-colors shadow-sm text-xs sm:text-sm"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-4.5 sm:w-4.5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" /></svg>
                            <span>Límite</span>
                        </button>
                    ) : (
                        <button
                            onClick={() => handleOpenProjectModal(null)}
                            className="flex items-center gap-1.5 px-3.5 py-1.5 sm:px-4.5 sm:py-2 bg-cyan-600 text-white rounded-xl hover:bg-cyan-700 transition-colors shadow-md shadow-cyan-500/10 text-xs sm:text-sm font-semibold"
                        >
                            <PlusIcon className="h-4 w-4 sm:h-4.5 sm:w-4.5" />
                            <span><span className="hidden sm:inline">Nuevo </span>Proyecto</span>
                        </button>
                    )}
                </div>
            </div>
             {licenseState?.status === 'free' && (
                <div className="mb-4 p-4 bg-cyan-50 border border-cyan-200 rounded-lg text-center">
                    <p className="text-sm text-cyan-800">
                        Está en el <span className="font-bold">Plan Gratuito</span>. Puede crear hasta {PROJECT_LIMIT_FREE} proyectos.
                        <button onClick={() => setIsLicenseModalOpen(true)} className="ml-2 font-bold underline hover:text-cyan-600">
                            Actualice a Pro
                        </button> para proyectos ilimitados, jerarquía de obras y más.
                    </p>
                </div>
            )}
            {isLoading && projects.length === 0 && <p>Cargando proyectos...</p>}
            {!isLoading && projects.length === 0 ? (
                <div className="text-center py-10 border-2 border-dashed border-slate-200 rounded-lg">
                    <p className="text-slate-500">No tienes proyectos aún.</p>
                    <p className="text-slate-400 text-sm">Crea tu primer proyecto para empezar a calcular materiales.</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {topLevelProjects.map(project => {
                        const children = projects.filter(p => p.parentId === project.id);
                        const isParent = children.length > 0;
                        const isExpanded = expandedProjects.has(project.id!);
                        const costs = projectCosts[project.id!];
                        const displayValue = displayCurrency === 'CUP' ? (costs?.cup || 0) : (costs?.usd || 0);

                        return (
                        <div key={project.id} className="bg-white border border-slate-200 rounded-lg transition-all duration-200">
                            <div className="p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 hover:bg-slate-50 transition-colors">
                                <div className="flex items-center gap-3 flex-grow">
                                    {isParent && (
                                        <button onClick={() => toggleProjectExpansion(project.id!)} className="p-1 rounded-full hover:bg-slate-200">
                                            <ChevronDownIcon className={`h-5 w-5 text-slate-500 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                                        </button>
                                    )}
                                    {isParent ? <FolderIcon className="h-6 w-6 text-cyan-700 flex-shrink-0" /> : <DocumentIcon className="h-6 w-6 text-slate-500 flex-shrink-0" />}
                                    <div className="flex-grow">
                                        <h3 className="text-lg font-semibold text-cyan-700 cursor-pointer" onClick={() => handleSelectProject(project)}>{project.name}</h3>
                                        <p className="text-sm text-slate-500">Creado: {parseLocalDate(project.createdAt).toLocaleDateString()}</p>
                                    </div>
                                </div>
                                <div className="w-full sm:w-auto flex items-center justify-between sm:justify-end gap-1 mt-2 sm:mt-0">
                                    <div className="text-right sm:mr-2">
                                        <div className="text-xs text-slate-500">Presupuesto</div>
                                        <div className="font-bold text-slate-700">{formatDisplayCurrency(displayValue)}</div>
                                    </div>
                                    <button onClick={() => { if (isPro) { setProjectToDuplicate(project); setIsDuplicateModalOpen(true); } else { setIsLicenseModalOpen(true); } }} className={`p-2 text-slate-500 ${isPro ? 'hover:text-purple-600' : 'opacity-50'}`} title={proFeatureTooltip}>
                                        <DocumentDuplicateIcon className="h-5 w-5"/>
                                    </button>
                                    <button onClick={() => { if (isPro) { setProjectToMove(project); setIsAssignParentModalOpen(true); } else { setIsLicenseModalOpen(true); } }} className={`p-2 text-slate-500 ${isPro ? 'hover:text-blue-600' : 'opacity-50'}`} title={proFeatureTooltip}>
                                        <LinkIcon className="h-5 w-5" />
                                    </button>
                                    <button onClick={() => handleOpenProjectModal(project)} className="p-2 text-slate-500 hover:text-cyan-600"><PencilIcon className="h-5 w-5"/></button>
                                    <button 
                                        onClick={() => handleOpenDeleteModal('project', project.id!)} 
                                        className={`p-2 text-slate-500 ${!canDeleteProject ? 'opacity-50 cursor-not-allowed' : 'hover:text-red-600'}`}
                                        disabled={!canDeleteProject}
                                        title={!canDeleteProject ? 'Los proyectos de prueba no se pueden eliminar.' : 'Eliminar Proyecto'}
                                    >
                                        <TrashIcon className="h-5 w-5"/>
                                    </button>
                                </div>
                            </div>
                            {isParent && isExpanded && (
                                <div className="pl-8 pr-4 pb-3 space-y-2 border-t">
                                    {children.map(child => {
                                        const childCosts = projectCosts[child.id!];
                                        const childDisplayValue = displayCurrency === 'CUP' ? (childCosts?.cup || 0) : (childCosts?.usd || 0);

                                        return (
                                            <div key={child.id} className="p-3 flex justify-between items-center hover:bg-slate-50 rounded-r-md">
                                                <div className="flex items-center gap-3">
                                                    <DocumentIcon className="h-5 w-5 text-slate-500" />
                                                    <div>
                                                        <h4 className="font-medium text-slate-800 cursor-pointer" onClick={() => handleSelectProject(child)}>{child.name}</h4>
                                                        <p className="text-xs text-slate-500">Objeto de Obra - {formatDisplayCurrency(childDisplayValue)}</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <button onClick={() => handleAssignParent(child, null)} className="p-2 text-slate-500 hover:text-red-600" title="Hacer Independiente">
                                                        <UnlinkIcon className="h-5 w-5" />
                                                    </button>
                                                    <button onClick={() => handleOpenDeleteModal('project', child.id!)} className={`p-2 text-slate-500 ${!canDeleteProject ? 'opacity-50 cursor-not-allowed' : 'hover:text-red-600'}`} disabled={!canDeleteProject} title="Eliminar Objeto de Obra">
                                                        <TrashIcon className="h-5 w-5"/>
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    )})}
                </div>
            )}
        </div>
    )};
    
    const renderActivityResults = (activity: Activity) => {
        const hasLayers = activity.type === ActivityType.REVESTIMIENTO && activity.results.some(r => r.layer);
    
        if (!hasLayers) {
            return (
                <ul className="mt-2 text-sm list-disc list-inside bg-slate-50 p-3 rounded">
                    {activity.results.map(res => {
                        if (activity.type === ActivityType.PISO &&
                            activity.inputs.tipoPiso === 'piso_ceramica' &&
                            res.unit === 'm²' &&
                            res.name.startsWith('Piso de')) {
                            
                            const tileLength = parseFloat(activity.inputs.tileLength);
                            const tileWidth = parseFloat(activity.inputs.tileWidth);
                            
                            if (tileLength > 0 && tileWidth > 0) {
                                const tileArea = tileLength * tileWidth;
                                const numTiles = Math.ceil(res.quantity / tileArea);
                                return (
                                    <li key={`${res.name}-${res.unit}`}>
                                        <strong>{res.name}:</strong> {Number(res.quantity).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})} {res.unit}
                                        <span className="text-slate-500 text-xs ml-2">(aprox. {numTiles.toLocaleString()} losas)</span>
                                    </li>
                                );
                            }
                        }
    
                        return (
                            <li key={`${res.name}-${res.unit}`}><strong>{res.name}:</strong> {Number(res.quantity).toLocaleString()} {res.unit}</li>
                        );
                    })}
                </ul>
            );
        }
    
        const groupedByLayer = activity.results.reduce((acc, material) => {
            const layer = material.layer || 'General';
            if (!acc[layer]) {
                acc[layer] = [];
            }
            acc[layer].push(material);
            return acc;
        }, {} as Record<string, Material[]>);
    
        return (
            <div className="mt-2 text-sm bg-slate-50 p-3 rounded space-y-3">
                {Object.entries(groupedByLayer).map(([layerName, materials]) => (
                    <div key={layerName}>
                        <h5 className="font-semibold text-slate-700">{layerName}</h5>
                        <ul className="list-disc list-inside pl-2">
                            {materials.map(res => (
                                <li key={`${layerName}-${res.name}-${res.unit}`}><strong>{res.name}:</strong> {Number(res.quantity).toLocaleString()} {res.unit}</li>
                            ))}
                        </ul>
                    </div>
                ))}
            </div>
        );
    };

    const renderProjectDetailView = () => {
        const isParentProject = projects.some(p => p.parentId === selectedProject?.id);
        const childProjects = isParentProject ? projects.filter(p => p.parentId === selectedProject?.id) : [];
        const currentRate = selectedProject?.exchangeRate || 380;

        return (
        <div className="bg-white/90 border border-slate-100 rounded-2xl shadow-sm p-6 sm:p-8 backdrop-blur-subtle">
            <div className="flex flex-wrap items-center gap-4 mb-6 border-b border-slate-100 pb-5">
                <button onClick={() => setSelectedProject(null)} className="p-2.5 text-slate-500 hover:text-cyan-600 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200/50 transition-all shadow-sm">
                    <ArrowLeftIcon className="h-5 w-5"/>
                </button>
                <h2 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight">{selectedProject?.name}</h2>
                 {isParentProject && (
                    <span className="text-xs font-bold bg-cyan-50 text-cyan-700 border border-cyan-100 px-3 py-1 rounded-full">
                        Obra Principal
                    </span>
                )}
                <div className="w-full lg:w-auto lg:ml-auto flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mt-4 lg:mt-0">
                    <div className="flex items-center justify-between sm:justify-start gap-3 bg-slate-50/50 p-1 px-3 rounded-xl border border-slate-200/30">
                        <label htmlFor="exchangeRate" className="text-xs font-bold text-slate-500 uppercase tracking-wide whitespace-nowrap">
                            <span className="hidden sm:inline">Tasa (1 USD):</span>
                            <span className="sm:hidden">Tasa USD:</span>
                        </label>
                        <ManagedNumberInput
                            id="exchangeRate"
                            value={currentRate}
                            onCommit={handleProjectExchangeRateCommit}
                            className="w-16 px-1.5 py-1 bg-white border border-slate-200 rounded-lg shadow-sm focus:outline-none text-xs font-bold text-slate-700 text-right"
                            placeholder="380"
                            step="1"
                            min="0.01"
                        />
                         <div className="flex p-0.5 bg-slate-100/80 rounded-xl border border-slate-200/40">
                            <button
                                type="button"
                                onClick={() => setDisplayCurrency('CUP')}
                                className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all ${displayCurrency === 'CUP' ? 'bg-white text-cyan-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                            >
                                CUP
                            </button>
                            <button
                                type="button"
                                onClick={() => setDisplayCurrency('USD')}
                                className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all ${displayCurrency === 'USD' ? 'bg-white text-cyan-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                            >
                                USD
                            </button>
                        </div>
                    </div>
                    <div ref={pdfDropdownRef} className="relative inline-block text-left w-full sm:w-auto">
                        <div className="w-full sm:w-auto">
                            <button
                                type="button"
                                onClick={() => { if (isPro) setIsPdfDropdownOpen(prev => !prev); else setIsLicenseModalOpen(true); }}
                                className={`flex items-center justify-center gap-1.5 px-3 py-2 text-white rounded-xl transition-all shadow-sm w-full sm:w-auto ${isPro ? 'bg-green-600 hover:bg-green-700' : 'bg-slate-400'}`}
                                title={proFeatureTooltip}
                            >
                                {!isPro && <ProStarIcon />}
                                <PdfIcon className="h-4 w-4" />
                                <span className="text-xs font-bold uppercase tracking-wider">
                                    <span className="hidden sm:inline">Generar Documento</span>
                                    <span className="sm:hidden">Reporte</span>
                                </span>
                                <ChevronDownIcon className={`h-4 w-4 transform transition-transform ${isPdfDropdownOpen ? 'rotate-180' : ''}`} />
                            </button>
                        </div>

                        {isPdfDropdownOpen && isPro && (
                            <div
                                className="origin-top-right absolute right-0 mt-2 w-full sm:w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-20"
                            >
                                <div className="py-1" role="none">
                                    <button onClick={() => { handleExportPDF(); setIsPdfDropdownOpen(false); }} className="w-full text-left text-gray-700 block px-4 py-2 text-sm hover:bg-gray-100" role="menuitem">
                                        Generar Reporte (PDF)
                                    </button>
                                    <button onClick={() => { setCurrentView('certifications'); setIsPdfDropdownOpen(false); }} className="w-full text-left text-gray-700 block px-4 py-2 text-sm hover:bg-gray-100" role="menuitem">
                                        Generar Factura (desde Cert.)
                                    </button>
                                     <button onClick={() => { setIsOfferModalOpen(true); setIsPdfDropdownOpen(false); }} className="w-full text-left text-gray-700 block px-4 py-2 text-sm hover:bg-gray-100" role="menuitem">
                                        Generar Oferta Comercial
                                    </button>
                                    <button onClick={() => { handleExportSchedule(); setIsPdfDropdownOpen(false); }} className="w-full text-left text-gray-700 block px-4 py-2 text-sm hover:bg-gray-100" role="menuitem">
                                        Generar Cronograma de Obra
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
            
            {/* Selector de Vistas adaptado a Móvil (Dropdown) y Escritorio (Pestañas) */}
            <div className="block md:hidden mb-6">
                <label className="block text-xs font-bold text-slate-550 uppercase mb-2 tracking-wider">Sección del Proyecto</label>
                <div className="relative">
                    <select
                        id="view-selector"
                        value={currentView}
                        onChange={(e) => {
                            const val = e.target.value as any;
                            if (val === 'budget' || val === 'inventory' || val === 'certifications') {
                                if (isPro) setCurrentView(val);
                                else setIsLicenseModalOpen(true);
                            } else {
                                setCurrentView(val);
                            }
                        }}
                        className="w-full bg-white text-slate-800 border border-slate-205 rounded-xl px-4 py-3 font-bold text-sm shadow-sm focus:border-cyan-500 focus:ring-cyan-500 appearance-none"
                    >
                        <option value="financials">📊 {isParentProject ? 'Finanzas Consolidadas' : 'Control Financiero'}</option>
                        {isParentProject && <option value="objetos-de-obra">🧱 Objetos de Obra</option>}
                        {!isParentProject && (
                            <>
                                <option value="materials">📐 Cálculo de Materiales</option>
                                <option value="labor">🛠️ Mano de Obra</option>
                                <option value="budget">💰 Otros Gastos (Plan) {!isPro ? '⭐ PRO' : ''}</option>
                                <option value="schedule">🕐 Cronograma de Ejecución {!isPro ? '⭐ PRO' : ''}</option>
                            </>
                        )}
                        <option value="inventory">📦 Inventario {isParentProject ? '(Consolidado)' : ''} {!isPro ? '⭐ PRO' : ''}</option>
                        <option value="certifications">📜 Certificaciones y Facturas {!isPro ? '⭐ PRO' : ''}</option>
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-500">
                        <ChevronDownIcon className="h-5 w-5" />
                    </div>
                </div>
            </div>
            
            <div className="hidden md:flex bg-slate-100/70 p-1.5 rounded-2xl border border-slate-200/40 mb-6 max-w-full overflow-x-auto gap-1.5 scrollbar-none">
                <button
                    onClick={() => setCurrentView('financials')}
                    className={`${
                        currentView === 'financials'
                            ? 'bg-cyan-600 text-white shadow-sm'
                            : 'text-slate-550 hover:text-slate-800 hover:bg-white/50'
                    } whitespace-nowrap py-2 px-3.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all duration-200`}
                >
                    {isParentProject ? 'Finanzas Consolidadas' : 'Control Financiero'}
                </button>
                 {isParentProject && (
                    <button
                        onClick={() => setCurrentView('objetos-de-obra')}
                        className={`${
                            currentView === 'objetos-de-obra'
                                ? 'bg-cyan-600 text-white shadow-sm'
                                : 'text-slate-550 hover:text-slate-800 hover:bg-white/50'
                        } whitespace-nowrap py-2 px-3.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all duration-200`}
                    >
                        Objetos de Obra
                    </button>
                )}
                {!isParentProject && (
                    <>
                        <button
                            onClick={() => setCurrentView('materials')}
                            className={`${
                                currentView === 'materials'
                                    ? 'bg-cyan-600 text-white shadow-sm'
                                    : 'text-slate-550 hover:text-slate-800 hover:bg-white/50'
                            } whitespace-nowrap py-2 px-3.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all duration-200`}
                        >
                            Cálculo de Materiales
                        </button>
                        <button
                            onClick={() => setCurrentView('labor')}
                            className={`${
                                currentView === 'labor'
                                    ? 'bg-cyan-600 text-white shadow-sm'
                                    : 'text-slate-550 hover:text-slate-800 hover:bg-white/50'
                            } whitespace-nowrap py-2 px-3.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all duration-200`}
                        >
                            Mano de Obra
                        </button>
                        <button
                            onClick={() => { if (isPro) setCurrentView('budget'); else setIsLicenseModalOpen(true); }}
                            className={`${
                                currentView === 'budget'
                                    ? 'bg-cyan-600 text-white shadow-sm'
                                    : 'text-slate-550 hover:text-slate-800 hover:bg-white/50'
                            } whitespace-nowrap py-2 px-3.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all duration-200 flex items-center gap-1.5`}
                        >
                            Otros Gastos (Plan)
                            {!isPro && <ProStarIcon />}
                        </button>
                        <button
                            onClick={() => setCurrentView('schedule')}
                            className={`${
                                currentView === 'schedule'
                                    ? 'bg-cyan-600 text-white shadow-sm'
                                    : 'text-slate-550 hover:text-slate-800 hover:bg-white/50'
                            } whitespace-nowrap py-2 px-3.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all duration-200 flex items-center gap-1.5`}
                        >
                            Cronograma (Gantt)
                            {!isPro && <ProStarIcon />}
                        </button>
                    </>
                )}
                <button
                    onClick={() => { if (isPro) setCurrentView('inventory'); else setIsLicenseModalOpen(true); }}
                    className={`${
                        currentView === 'inventory'
                            ? 'bg-cyan-600 text-white shadow-sm'
                            : 'text-slate-550 hover:text-slate-800 hover:bg-white/50'
                    } whitespace-nowrap py-2 px-3.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all duration-200 flex items-center gap-1.5`}
                >
                    Inventario {isParentProject && '(Consolidado)'}
                    {!isPro && <ProStarIcon />}
                </button>
                 <button
                    onClick={() => { if (isPro) setCurrentView('certifications'); else setIsLicenseModalOpen(true); }}
                    className={`${
                        currentView === 'certifications'
                            ? 'bg-cyan-600 text-white shadow-sm'
                            : 'text-slate-550 hover:text-slate-800 hover:bg-white/50'
                    } whitespace-nowrap py-2 px-3.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all duration-200 flex items-center gap-1.5`}
                >
                    Certificaciones y Facturas
                    {!isPro && <ProStarIcon />}
                </button>
            </div>

            {currentView === 'financials' && renderFinancialsView()}
            {currentView === 'objetos-de-obra' && renderChildProjectsView(childProjects)}
            {!isParentProject && currentView === 'materials' && renderMaterialsView()}
            {!isParentProject && currentView === 'labor' && renderLaborBudgetView()}
            {!isParentProject && currentView === 'budget' && isPro && renderBudgetView()}
            {currentView === 'inventory' && isPro && renderInventoryView()}
            {currentView === 'certifications' && isPro && renderCertificationsView(isParentProject)}
            {!isParentProject && currentView === 'schedule' && (
                <ActivityScheduler
                    project={selectedProject!}
                    laborItems={laborItems}
                    onUpdateLaborItem={async (item) => {
                        await updateLaborItem(item);
                        await loadProjectData();
                    }}
                    onUpdateProject={async (project) => {
                        await updateProject(project);
                        setSelectedProject(project);
                        await loadInitialData();
                    }}
                    isPro={isPro}
                    onUpgrade={() => setIsLicenseModalOpen(true)}
                />
            )}
        </div>
    );
    };

    const renderBudgetView = () => {
        const lastCertSnapshot = certifications.length > 0 ? certifications[certifications.length - 1]?.snapshot : null;

        const getRealValueForCalculated = (name: string) => {
            if (!lastCertSnapshot) return 0;
            const rate = displayCurrency === 'CUP' ? (selectedProject?.exchangeRate || 380) : 1;
            let usdVal = 0;
            if (name === 'Logística') usdVal = lastCertSnapshot.logisticsCost;
            else if (name === 'Asistencia Técnica') usdVal = lastCertSnapshot.technicalAssistanceCost;
            else if (name === 'Gastos de Útiles y Herramientas') usdVal = lastCertSnapshot.toolsAndUtilitiesCost || 0;
            else if (name === 'Transportación') usdVal = lastCertSnapshot.transportExpenseCost; 
            else if (name === 'Utilidad') usdVal = lastCertSnapshot.profitCost;
            else if (name === 'Imprevistos') usdVal = 0; 
            
            return displayCurrency === 'CUP' ? usdVal * rate : usdVal;
        };

        const getRealTaxValue = () => {
            if (!lastCertSnapshot) return 0;
            const rate = displayCurrency === 'CUP' ? (selectedProject?.exchangeRate || 380) : 1;
            const usdVal = lastCertSnapshot.serviceTaxCost || 0;
            return displayCurrency === 'CUP' ? usdVal * rate : usdVal;
        }

        const plannedManualTotal = displayCurrency === 'CUP' ? manualBudgetGrandTotal.cup : manualBudgetGrandTotal.usd;

        const getRealValueForManualItem = (itemName: string) => {
            const rate = displayCurrency === 'CUP' ? (selectedProject?.exchangeRate || 380) : 1;
            const matchingTransactions = transactions.filter(t => 
                t.type === TransactionType.EXPENSE && 
                t.description.trim().toLowerCase() === itemName.trim().toLowerCase()
            );
            const usdVal = matchingTransactions.reduce((sum, t) => sum + Number(t.amount), 0);
            return usdVal * rate;
        };

        let realManualExpenseTotalTotal = 0;
        if (lastCertSnapshot) {
            const rate = displayCurrency === 'CUP' ? (selectedProject?.exchangeRate || 380) : 1;
            realManualExpenseTotalTotal = lastCertSnapshot.manualExpenseCost * rate;
        }


        return (
            <div>
                <details 
                    className="bg-slate-50 p-4 rounded-lg mb-6 border group" 
                    open={isIndirectConfigOpen}
                    onToggle={(e) => {
                        const open = e.currentTarget.open;
                        setIsIndirectConfigOpen(open);
                        localStorage.setItem('isIndirectConfigOpen', open ? 'true' : 'false');
                    }}
                >
                    <summary className="font-semibold text-lg text-slate-700 cursor-pointer flex justify-between items-center list-none -m-4 p-4">
                        <span>Configuración de Gastos Indirectos</span>
                        <ChevronDownIcon className={`h-6 w-6 transform transition-transform ${isIndirectConfigOpen ? 'rotate-180' : ''}`} />
                    </summary>
                    <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
                        <PercentageInput label="Logística (%)" field="logisticsPercentage" value={selectedProject?.logisticsPercentage} onChange={handlePercentageChange} />
                        <PercentageInput label="Asistencia Técnica (%)" field="technicalAssistancePercentage" value={selectedProject?.technicalAssistancePercentage} onChange={handlePercentageChange} />
                        <PercentageInput label="Útiles y Herramientas (%)" field="toolsAndUtilitiesPercentage" value={selectedProject?.toolsAndUtilitiesPercentage} onChange={handlePercentageChange} />
                        <PercentageInput label="Transportación (%)" field="transportPercentage" value={selectedProject?.transportPercentage} onChange={handlePercentageChange} />
                        <PercentageInput label="Imprevistos (%)" field="contingencyPercentage" value={selectedProject?.contingencyPercentage} onChange={handlePercentageChange} />
                        <PercentageInput label="Utilidad (%)" field="profitPercentage" value={selectedProject?.profitPercentage} onChange={handlePercentageChange} />
                    </div>
                    <div className="mt-4 pt-4 border-t border-slate-200 flex flex-col md:flex-row gap-4 items-start md:items-center">
                        <label className="flex items-center gap-2 cursor-pointer select-none">
                            <input 
                                type="checkbox" 
                                checked={selectedProject?.hasServiceTax || false} 
                                onChange={handleTaxToggle}
                                className="h-5 w-5 rounded border-gray-300 text-cyan-600 focus:ring-cyan-500"
                            />
                            <span className="text-sm font-medium text-slate-700">Aplicar Impuesto sobre Servicio (al total final)</span>
                        </label>
                        {selectedProject?.hasServiceTax && (
                            <div className="w-32">
                                <PercentageInput 
                                    label="Impuesto (%)" 
                                    field="serviceTaxPercentage" 
                                    value={selectedProject.serviceTaxPercentage} 
                                    onChange={handlePercentageChange} 
                                />
                            </div>
                        )}
                        {selectedProject?.hasServiceTax && (
                            <div className="text-xs text-slate-500 italic md:ml-2 bg-yellow-50 p-2 rounded border border-yellow-100">
                                Nota: Este impuesto se calcula de forma que represente el {selectedProject.serviceTaxPercentage}% del valor total facturado.
                            </div>
                        )}
                    </div>
                </details>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <h3 className="text-xl font-semibold text-slate-600 mb-4">Gastos Calculados</h3>
                        <div className="bg-white p-4 rounded-lg shadow-sm border space-y-4">
                            {automaticBudgetItems.items.map(item => {
                                const plannedValue = displayCurrency === 'CUP' ? item.cup : item.usd;
                                const realValue = getRealValueForCalculated(item.name);
                                
                                return (
                                    <div key={item.name} className="border-b border-slate-100 pb-3 last:border-0 last:pb-0">
                                        <div className="flex justify-between items-center text-sm mb-1">
                                            <p className="font-semibold text-slate-800">{item.name}</p>
                                            <p className="font-semibold text-slate-800">{formatDisplayCurrency(plannedValue)}</p>
                                        </div>
                                        {item.name !== 'Imprevistos' && (
                                            <BudgetProgressBar current={realValue} total={plannedValue} formatCurrency={formatDisplayCurrency} />
                                        )}
                                    </div>
                                );
                            })}
                            {automaticBudgetItems.tax.usd > 0 && (
                                <div className="border-t pt-3 mt-2">
                                    <div className="flex justify-between items-center text-sm mb-1">
                                        <p className="font-semibold text-slate-800">Impuesto sobre Servicio</p>
                                        <p className="font-semibold text-slate-800">{formatDisplayCurrency(displayCurrency === 'CUP' ? automaticBudgetItems.tax.cup : automaticBudgetItems.tax.usd)}</p>
                                    </div>
                                    <BudgetProgressBar current={getRealTaxValue()} total={displayCurrency === 'CUP' ? automaticBudgetItems.tax.cup : automaticBudgetItems.tax.usd} formatCurrency={formatDisplayCurrency} />
                                </div>
                            )}
                            <div className="flex justify-between items-center text-sm pt-3 border-t font-bold">
                                <p>Total Calculado</p>
                                <p>{formatDisplayCurrency((displayCurrency === 'CUP' ? automaticBudgetItems.total.cup : automaticBudgetItems.total.usd) + (displayCurrency === 'CUP' ? automaticBudgetItems.tax.cup : automaticBudgetItems.tax.usd))}</p>
                            </div>
                        </div>
                    </div>
                    <div>
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xl font-semibold text-slate-600">Gastos Manuales</h3>
                            <button 
                                onClick={() => { setEditingBudgetItem(null); setIsBudgetItemModalOpen(true); }}
                                className="flex items-center gap-2 px-3 py-1.5 bg-cyan-600 text-white rounded-md hover:bg-cyan-700 transition-colors shadow text-sm"
                            >
                                <PlusIcon className="h-4 w-4" />
                                Añadir
                            </button>
                        </div>
                        <div className="bg-white p-4 rounded-lg shadow-sm border flex flex-col h-full overflow-hidden">
                            {manualBudgetItems.length === 0 ? (
                                <p className="text-center text-sm text-slate-500 py-4 flex-grow">No hay gastos manuales.</p>
                            ) : (
                                <div className="flex-grow overflow-y-auto max-h-[50vh]">
                                    <table className="w-full text-sm text-left mb-4">
                                        <thead className="bg-slate-50 text-xs uppercase text-slate-500 sticky top-0">
                                            <tr>
                                                <th className="px-3 py-2">Concepto</th>
                                                <th className="px-3 py-2 text-right">Progreso</th>
                                                <th className="px-3 py-2 text-right">Acciones</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {manualBudgetItems.map(item => {
                                                const plannedVal = displayCurrency === 'CUP' ? Number(item.cost) * (selectedProject?.exchangeRate || 380) : Number(item.cost);
                                                const realVal = getRealValueForManualItem(item.name);

                                                return (
                                                    <tr key={item.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50 transition-colors">
                                                        <td className="px-3 py-3">
                                                            <p className="font-semibold text-slate-800 leading-tight">{item.name}</p>
                                                            <p className="text-[10px] text-slate-500 mt-0.5">{item.category}</p>
                                                        </td>
                                                        <td className="px-3 py-3 w-40">
                                                            <BudgetProgressBar current={realVal} total={plannedVal} formatCurrency={formatDisplayCurrency} />
                                                        </td>
                                                        <td className="px-3 py-3 text-right">
                                                            <div className="flex justify-end items-center gap-1">
                                                                <button 
                                                                    onClick={() => handleOpenManualExpensePurchase(item)} 
                                                                    className="p-1.5 text-cyan-600 hover:bg-cyan-50 rounded-full" 
                                                                    title="Registrar Gasto Real"
                                                                >
                                                                    <BanknotesIcon className="h-4 w-4" />
                                                                </button>
                                                                <button onClick={() => { setEditingBudgetItem(item); setIsBudgetItemModalOpen(true); }} className="p-1.5 text-slate-400 hover:text-cyan-600 rounded-full"><PencilIcon className="h-4 w-4"/></button>
                                                                <button onClick={() => handleOpenDeleteModal('budget', item.id!)} className="p-1.5 text-slate-400 hover:text-red-600 rounded-full"><TrashIcon className="h-4 w-4"/></button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                             <div className="mt-auto pt-4 border-t px-3 pb-3">
                                <div className="flex justify-between items-center text-sm font-bold mb-2">
                                    <p>Total Manual Planificado</p>
                                    <p>{formatDisplayCurrency(plannedManualTotal)}</p>
                                </div>
                                <div className="bg-slate-50 p-2 rounded border border-slate-200">
                                    <p className="text-xs text-slate-600 font-semibold mb-1">Total Gastos Manuales Ejecutados</p>
                                    <BudgetProgressBar current={realManualExpenseTotalTotal} total={plannedManualTotal} formatCurrency={formatDisplayCurrency} />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mt-6 pt-4 border-t-2 border-slate-300">
                    <div className="flex justify-end text-xl font-bold text-slate-800">
                        <span>Total Otros Gastos (Plan) + Impuestos:</span>
                        <span className="ml-4 w-48 text-right">{formatDisplayCurrency(displayCurrency === 'CUP' ? (budgetGrandTotal.cup + taxGrandTotal.cup) : (budgetGrandTotal.usd + taxGrandTotal.usd))}</span>
                    </div>
                </div>
            </div>
        );
    };

    const renderChildProjectsView = (childProjects: Project[]) => (
        <div>
            <h3 className="text-xl font-semibold text-slate-600 mb-4">Objetos de Obra de "{selectedProject?.name}"</h3>
            {childProjects.length === 0 ? (
                <p className="text-slate-500">Este proyecto principal no tiene objetos de obra asignados.</p>
            ) : (
                <div className="space-y-3">
                    {childProjects.map(child => {
                        const costs = projectCosts[child.id!];
                        const displayValue = displayCurrency === 'CUP' ? (costs?.cup || 0) : (costs?.usd || 0);

                        return (
                            <div key={child.id} className="p-4 border rounded-lg flex justify-between items-center bg-slate-50">
                                <div>
                                    <h4 className="font-bold text-slate-800">{child.name}</h4>
                                    <p className="text-sm text-slate-500">Costo Planificado: {formatDisplayCurrency(displayValue)}</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button onClick={() => handleSelectProject(child)} className="px-3 py-1 text-sm bg-cyan-100 text-cyan-800 rounded-md hover:bg-cyan-200">
                                        Ver Detalles
                                    </button>
                                    <button onClick={() => handleAssignParent(child, null)} className="p-2 text-slate-500 hover:text-red-600" title="Hacer Independiente">
                                        <UnlinkIcon className="h-5 w-5" />
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );

    const renderFinancialsView = () => {
        const { totalBudget, totalIncome, totalExpense, balance, totalAnticipo, anticipoPercentage } = financialSummary;
        
        const StatCard = ({ icon, title, value, colorClass }: { icon: React.ReactNode, title: string, value: number, colorClass: string }) => (
            <div className="bg-white border border-slate-100/80 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all duration-300 flex items-center justify-between gap-4 group">
                <div className="flex flex-col gap-1 flex-grow">
                    <p className="text-[11px] font-extrabold text-slate-400 uppercase tracking-widest leading-none">{title}</p>
                    <p className="text-lg sm:text-xl font-black text-slate-800 tracking-tight mt-1 transition-transform group-hover:translate-x-0.5 duration-200">
                        {formatDisplayCurrency(value)}
                    </p>
                </div>
                <div className={`rounded-xl p-3 ${colorClass} transition-all duration-300 group-hover:scale-105 flex-shrink-0`}>
                    {icon}
                </div>
            </div>
        );

        const allSelectableSelected = unlockedTransactions.length > 0 && unlockedTransactions.every(t => selectedTransactionIds.has(t.id!));

        return (
            <div>
                 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
                    <StatCard icon={<BanknotesIcon className="h-5 w-5 text-blue-600"/>} title={`Presupuesto (${displayCurrency})`} value={displayCurrency === 'CUP' ? totalBudget.cup : totalBudget.usd} colorClass="bg-blue-50/80 border border-blue-100/40" />
                    <StatCard icon={<ArrowTrendingDownIcon className="h-5 w-5 text-emerald-600"/>} title={`Total Ingresado (${displayCurrency})`} value={displayCurrency === 'CUP' ? totalIncome.cup : totalIncome.usd} colorClass="bg-emerald-50/80 border border-emerald-100/40" />
                    <div className="bg-white border border-slate-100/80 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all duration-300 flex items-center justify-between gap-4 group">
                        <div className="flex flex-col gap-1 flex-grow">
                            <p className="text-[11px] font-extrabold text-slate-400 uppercase tracking-widest leading-none">Anticipo Recibido</p>
                            <p className="text-lg sm:text-xl font-black text-slate-800 tracking-tight mt-1 transition-transform group-hover:translate-x-0.5 duration-200 flex items-baseline gap-1">
                                {formatDisplayCurrency(displayCurrency === 'CUP' ? totalAnticipo.cup : totalAnticipo.usd)}
                                {anticipoPercentage > 0 && <span className="text-[10px] font-bold bg-purple-50 text-purple-600 border border-purple-100 px-1.5 py-0.5 rounded ml-1">({anticipoPercentage.toFixed(1)}%)</span>}
                            </p>
                        </div>
                        <div className="rounded-xl p-3 bg-purple-50/80 border border-purple-100/40 transition-all duration-300 group-hover:scale-105 flex-shrink-0">
                             <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                            </svg>
                        </div>
                    </div>
                    <StatCard icon={<ArrowTrendingUpIcon className="h-5 w-5 text-rose-600"/>} title={`Total Gastado (${displayCurrency})`} value={displayCurrency === 'CUP' ? totalExpense.cup : totalExpense.usd} colorClass="bg-rose-50/80 border border-rose-100/40" />
                    <StatCard icon={<ScaleIcon className="h-5 w-5 text-amber-600"/>} title={`Balance Actual (${displayCurrency})`} value={displayCurrency === 'CUP' ? balance.cup : balance.usd} colorClass="bg-amber-50/80 border border-amber-100/40" />
                </div>

                 <div className="bg-white/80 border border-slate-100/80 rounded-2xl p-6 shadow-sm mb-6">
                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-5">Comparación: Planificado vs. Real ({displayCurrency})</h3>
                    <FinancialChart 
                        plannedCosts={plannedCostsChart}
                        realCosts={realCostsByCategory}
                        currency={displayCurrency === 'CUP' ? 'MN' : 'USD'}
                        exchangeRate={1} 
                    />
                </div>

                <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-5 gap-3">
                    <div>
                        <h3 className="text-base font-black text-slate-800 uppercase tracking-wider">Historial de Transacciones</h3>
                        <p className="text-xs text-slate-400 mt-0.5">Controla todos los ingresos, anticipos y egresos generados en el proyecto.</p>
                    </div>
                    <div className="flex gap-2 self-end sm:self-auto">
                         {selectedTransactionIds.size > 0 ? (
                            <button 
                                onClick={() => handleOpenBulkDeleteModal('transaction')}
                                className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white font-semibold rounded-xl hover:bg-red-700 transition-colors shadow-sm text-xs uppercase tracking-wider"
                            >
                                <TrashIcon className="h-4 w-4" />
                                Eliminar ({selectedTransactionIds.size})
                            </button>
                        ) : (
                            <button 
                                onClick={() => { setEditingTransaction(null); setTransactionDefaults(null); setIsTransactionModalOpen(true); }}
                                className="flex items-center gap-2 px-4 py-2.5 bg-cyan-600 text-white font-semibold rounded-xl hover:bg-cyan-700 transition-colors shadow-md shadow-cyan-505/10 text-xs uppercase tracking-wider"
                            >
                                <PlusIcon className="h-4 w-4" />
                                Añadir Transacción
                            </button>
                        )}
                    </div>
                </div>

                {isLoading ? <p>Cargando...</p> : transactions.length === 0 ? (
                    <div className="text-center py-12 border border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
                        <p className="text-slate-500 font-medium text-sm">No hay transacciones registradas.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto border border-slate-100 rounded-xl">
                         <table className="w-full text-xs sm:text-sm text-left text-slate-700">
                            <thead className="text-[10px] text-slate-400 font-extrabold uppercase bg-slate-50/80 border-b border-slate-100 tracking-wider">
                                <tr>
                                    <th className="px-3 py-3.5 w-12 text-center">
                                        <input 
                                            type="checkbox" 
                                            className="h-4 w-4 rounded border-gray-300 text-cyan-600 focus:ring-cyan-500"
                                            checked={allSelectableSelected}
                                            onChange={handleSelectAllTransactions}
                                            disabled={unlockedTransactions.length === 0}
                                        />
                                    </th>
                                    <th className="px-4 py-3.5">Fecha</th>
                                    <th className="px-4 py-3.5">Descripción</th>
                                    <th className="px-4 py-3.5">Categoría</th>
                                    <th className="px-4 py-3.5 text-right">Monto ({displayCurrency})</th>
                                    <th className="px-4 py-3.5 text-center">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 bg-white">
                                {transactions.map(item => {
                                    const isLocked = isTransactionLocked(item.date, item.id);
                                    const rate = getRate(item.projectId);
                                    const displayAmount = displayCurrency === 'CUP' ? item.amount * rate : item.amount;
                                    
                                    return (
                                    <tr key={item.id} className={`hover:bg-slate-50/50 transition-colors ${isLocked ? 'bg-slate-50/20' : ''} ${selectedTransactionIds.has(item.id!) ? 'bg-cyan-50/40' : ''}`}>
                                        <td className="px-3 py-2.5 w-12 text-center">
                                            <input 
                                                type="checkbox"
                                                className="h-4 w-4 rounded border-gray-300 text-cyan-600 focus:ring-cyan-500 disabled:opacity-50"
                                                checked={selectedTransactionIds.has(item.id!)}
                                                onChange={() => handleTransactionSelection(item.id!)}
                                                disabled={isLocked}
                                            />
                                        </td>
                                        <td className="px-4 py-2.5 text-slate-500 font-mono text-xs">{parseLocalDate(item.date).toLocaleDateString()}</td>
                                        <td className="px-4 py-2.5 font-bold text-slate-800">{item.description}</td>
                                        <td className="px-4 py-2.5"><span className="text-[10px] font-bold bg-slate-100 text-slate-600 px-2.5 py-1 rounded-lg tracking-wide uppercase">{item.category || 'N/A'}</span></td>
                                        <td className={`px-4 py-2.5 text-right font-black ${item.type === TransactionType.INCOME ? 'text-emerald-600' : 'text-rose-600'}`}>
                                            {item.type === TransactionType.INCOME ? '+' : '-'} {formatDisplayCurrency(displayAmount)}
                                        </td>
                                        <td className="px-4 py-2.5 text-center">
                                            <div className="flex items-center justify-center gap-1">
                                                <button 
                                                    onClick={() => { setEditingTransaction(item); setTransactionDefaults(null); setIsTransactionModalOpen(true); }} 
                                                    className={`p-1.5 text-slate-400 hover:text-cyan-600 hover:bg-slate-50 rounded-lg transition-all ${isLocked ? 'opacity-30 cursor-not-allowed' : ''}`}
                                                    disabled={isLocked}
                                                    title={isLocked ? "Bloqueado por certificación" : "Editar"}
                                                >
                                                    <PencilIcon className="h-4 w-4"/>
                                                </button>
                                                <button 
                                                    onClick={() => handleOpenDeleteModal('transaction', item.id!)} 
                                                    className={`p-1.5 text-slate-400 hover:text-rose-600 hover:bg-slate-50 rounded-lg transition-all ${isLocked ? 'opacity-30 cursor-not-allowed' : ''}`}
                                                    disabled={isLocked}
                                                    title={isLocked ? "Bloqueado por certificación" : "Eliminar"}
                                                >
                                                    <TrashIcon className="h-4 w-4"/>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                )})}
                            </tbody>
                         </table>
                    </div>
                )}
            </div>
        );
    };

    const renderMaterialsView = () => {
        const allActivitiesSelected = activities.length > 0 && activities.every(a => selectedActivityIds.has(a.id!));

        return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-semibold text-slate-600">Actividades de Materiales</h3>
                    <div className="flex items-center gap-2">
                         {selectedActivityIds.size > 0 && (
                            <button 
                                onClick={() => handleOpenBulkDeleteModal('activity')}
                                className="flex items-center gap-2 px-3 py-1.5 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors shadow text-sm"
                            >
                                <TrashIcon className="h-4 w-4" />
                                Eliminar ({selectedActivityIds.size})
                            </button>
                        )}
                        <label className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 rounded-md border border-slate-200 cursor-pointer hover:bg-slate-200 transition-colors">
                            <input 
                                type="checkbox"
                                checked={allActivitiesSelected}
                                onChange={handleSelectAllActivities}
                                className="h-4 w-4 rounded border-gray-300 text-cyan-600 focus:ring-cyan-500"
                            />
                            <span className="text-xs font-medium text-slate-700">Seleccionar Todo</span>
                        </label>
                    </div>
                </div>
                <div className="space-y-4">
                     <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {Object.values(ActivityType).filter(type => type !== ActivityType.CUSTOM && type !== ActivityType.CUSTOM_MATERIAL_CALCULATION).map(type => (
                            <button
                                key={type}
                                onClick={() => handleOpenActivityModal(type, null)}
                                className="p-3 bg-slate-100 text-slate-700 rounded-md hover:bg-cyan-100 hover:text-cyan-800 transition-colors text-center text-sm font-medium"
                            >
                                {type}
                            </button>
                        ))}
                         {(libraryData?.custom_material_activities || [])
                            .filter((act: CustomMaterialActivity) => act.enabled !== false)
                            .map((customActivity: CustomMaterialActivity) => (
                            <button
                                key={customActivity.id}
                                onClick={() => {
                                    if (isPro) {
                                        handleOpenActivityModal(ActivityType.CUSTOM_MATERIAL_CALCULATION, null, customActivity)
                                    } else {
                                        setIsLicenseModalOpen(true);
                                    }
                                }}
                                className={`p-3 rounded-md transition-colors text-center text-sm font-medium relative ${isPro ? 'bg-purple-100 text-purple-800 hover:bg-purple-200' : 'bg-slate-100 text-slate-500 opacity-70'}`}
                                title={proFeatureTooltip}
                                disabled={!isPro}
                            >
                                {customActivity.name}
                                {!isPro && <span className="absolute top-1 right-1"><ProStarIcon /></span>}
                            </button>
                        ))}
                         <button
                            onClick={() => {
                                if (isPro) {
                                    handleOpenActivityModal(ActivityType.CUSTOM, null)
                                } else {
                                    setIsLicenseModalOpen(true);
                                }
                            }}
                            className={`p-3 rounded-md transition-colors text-center text-sm font-medium col-span-2 md:col-span-3 lg:col-span-4 relative ${isPro ? 'bg-gray-200 text-gray-800 hover:bg-gray-300' : 'bg-slate-100 text-slate-500 opacity-70'}`}
                            title={proFeatureTooltip}
                            disabled={!isPro}
                        >
                            {ActivityType.CUSTOM}
                            {!isPro && <span className="absolute top-1 right-1"><ProStarIcon /></span>}
                        </button>
                    </div>
                    {isLoading && <p>Cargando actividades...</p>}
                    {!isLoading && activities.length === 0 ? (
                         <div className="text-center py-10 border-2 border-dashed border-slate-200 rounded-lg">
                            <p className="text-slate-500">No hay actividades de materiales.</p>
                        </div>
                    ) : (
                        activities.map(activity => (
                            <div key={activity.id} className={`p-4 border rounded-lg transition-colors ${selectedActivityIds.has(activity.id!) ? 'border-cyan-500 bg-cyan-50 shadow-sm' : activity.materialsPurchased ? 'border-emerald-100 bg-emerald-50/20' : 'bg-white'}`}>
                                <div className="flex justify-between items-start">
                                    <div className="flex items-start gap-3">
                                        <input 
                                            type="checkbox"
                                            checked={selectedActivityIds.has(activity.id!) ? 'checked' : ''}
                                            onChange={() => handleActivitySelection(activity.id!)}
                                            className="h-5 w-5 mt-1 rounded border-gray-300 text-cyan-600 focus:ring-cyan-500"
                                        />
                                        <div>
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <h4 className="font-bold text-slate-800">{activity.name}</h4>
                                                {activity.materialsPurchased && (
                                                    <span className="px-2 py-0.5 text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-full flex items-center gap-0.5 shadow-sm animate-pulse">
                                                        ✓ Comprado
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-sm text-cyan-600 font-medium">{getActivitySubtitle(activity)}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {activity.materialsPurchased && (
                                            <button 
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setActivityToReset(activity);
                                                    setIsResetConfirmModalOpen(true);
                                                }} 
                                                className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-slate-100 rounded transition-colors"
                                                title="Desmarcar como comprado (Restablecer estado)"
                                            >
                                                <ArrowPathIcon className="h-5 w-5"/>
                                            </button>
                                        )}
                                        <button 
                                            onClick={() => handleOpenBuyAllModal(activity)} 
                                            className={`p-2 rounded-md transition-all flex items-center gap-1 ${
                                                activity.materialsPurchased 
                                                    ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200 border border-emerald-200 shadow-sm' 
                                                    : 'text-slate-500 hover:text-green-600 hover:bg-slate-50'
                                            }`}
                                            title={activity.materialsPurchased ? "Materiales ya comprados para esta actividad (Volver a comprar)" : "Comprar todos los materiales de esta actividad"}
                                        >
                                            <ShoppingCartIcon className="h-5 w-5"/>
                                            {activity.materialsPurchased && <span className="text-[10px] font-bold hidden sm:inline">Comprado</span>}
                                        </button>
                                        <button onClick={() => {
                                            const customActivity = activity.type === ActivityType.CUSTOM_MATERIAL_CALCULATION
                                                ? libraryData?.custom_material_activities.find((ca: CustomMaterialActivity) => ca.id === activity.inputs.customActivityId)
                                                : undefined;
                                            handleOpenActivityModal(activity.type, activity, customActivity);
                                        }} className="p-2 text-slate-500 hover:text-cyan-600 hover:bg-slate-50 rounded-md"><PencilIcon className="h-5 w-5"/></button>
                                        <button onClick={() => handleOpenDeleteModal('activity', activity.id!)} className="p-2 text-slate-500 hover:text-red-600 hover:bg-slate-50 rounded-md"><TrashIcon className="h-5 w-5"/></button>
                                    </div>
                                </div>
                                <details className="mt-3">
                                    <summary className="cursor-pointer text-sm text-slate-600 flex items-center ml-8">
                                        Ver Materiales <ChevronDownIcon className="h-4 w-4 ml-1"/>
                                    </summary>
                                    <div className="ml-8">{renderActivityResults(activity)}</div>
                                </details>
                            </div>
                        ))
                    )}
                </div>
            </div>
            <div>
                <h3 className="text-xl font-semibold text-slate-600 mb-4">Resumen</h3>
                 <div className="bg-slate-50 p-4 rounded-lg max-h-[80vh] overflow-y-auto">
                    {totalMaterials.length === 0 ? (
                        <p className="text-slate-500 text-sm">No hay materiales para mostrar.</p>
                    ) : (
                        <table className="w-full text-sm text-left text-slate-700 border-collapse">
                            <thead className="text-xs text-slate-500 uppercase bg-slate-100 sticky top-0 z-10">
                                <tr>
                                    <th scope="col" className="px-4 py-3">Material</th>
                                    <th scope="col" className="px-4 py-3 text-right">Precio Unit. ({displayCurrency})</th>
                                    <th scope="col" className="px-4 py-3 text-right">Precio Total ({displayCurrency})</th>
                                    <th scope="col" className="px-4 py-3">Inventario/Necesario</th>
                                </tr>
                            </thead>
                            <tbody>
                                {totalMaterials.map(material => {
                                    const key = `${material.name}-${material.unit}`;
                                    const rate = selectedProject?.exchangeRate || 380;
                                    
                                    const displayUnitPrice = displayCurrency === 'CUP' ? (material.unitPrice || 0) * rate : (material.unitPrice || 0);
                                    const displayPrice = Number(material.quantity) * displayUnitPrice;

                                    const available = Number(material.quantityAvailable) || 0;
                                    const required = Number(material.quantity);
                                    const needed = Number(material.quantityNeeded) || 0;

                                    let statusColorClass = '';
                                    let inventoryTextClass = 'text-slate-600';
                                    
                                    if (available >= required) {
                                        statusColorClass = 'text-green-600';
                                        inventoryTextClass = 'text-green-600 font-bold';
                                    } else if (available > 0) {
                                        statusColorClass = 'text-yellow-600';
                                        inventoryTextClass = 'text-yellow-600 font-bold';
                                    }

                                    return (
                                        <tr key={key} className={`border-b border-slate-200 hover:bg-slate-100 transition-colors ${statusColorClass}`}>
                                            <th scope="row" className="px-4 py-2 font-medium whitespace-nowrap">
                                                {material.name}
                                                <span className={`block text-xs font-normal ${available >= required ? 'text-green-500' : 'text-slate-500'}`}>
                                                    {required.toLocaleString(undefined, { maximumFractionDigits: 2 })} {material.unit}
                                                </span>
                                            </th>
                                            <td className="px-4 py-2 text-right">
                                                <ManagedNumberInput
                                                    value={displayUnitPrice}
                                                    onCommit={(newVal: string) => handleMaterialPriceChange(material.name, material.unit, newVal)}
                                                    className="w-24 px-2 py-1 bg-transparent border border-transparent hover:border-slate-300 rounded text-right focus:bg-white focus:outline-none focus:ring-1 focus:ring-cyan-500"
                                                    step="0.01"
                                                    placeholder="0.00"
                                                />
                                            </td>
                                            <td className="px-4 py-2 text-right font-semibold">
                                                {formatDisplayCurrency(displayPrice)}
                                            </td>
                                            <td className="px-4 py-2 w-44">
                                                <div className={`text-sm ${inventoryTextClass}`}>
                                                    {available.toLocaleString(undefined, { maximumFractionDigits: 2 })} / {required.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                                                </div>
                                                {needed > 0.001 ? (
                                                    <div className="flex flex-wrap gap-1 mt-1">
                                                        <button 
                                                            onClick={() => handleOpenPurchaseModal(material)}
                                                            className="px-2 py-0.5 text-xs bg-cyan-100 text-cyan-800 rounded-md hover:bg-cyan-200"
                                                            title="Registrar compra y gasto"
                                                        >
                                                            Comprar
                                                        </button>
                                                        {available > 0 && (
                                                            <button 
                                                                onClick={() => { if (isPro) handleOpenUseFromInventoryModal(material); else setIsLicenseModalOpen(true); }}
                                                                className={`flex items-center gap-1 px-2 py-0.5 text-xs rounded-md ${isPro ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200' : 'bg-slate-200 text-slate-500'}`}
                                                                title={proFeatureTooltip}
                                                            >
                                                                Usar {!isPro && <ProStarIcon />}
                                                            </button>
                                                        )}
                                                        <button
                                                            onClick={() => { if (isPro) handleOpenAddToInventoryModalForMaterial(material); else setIsLicenseModalOpen(true); }}
                                                            className={`flex items-center gap-1 px-2 py-0.5 text-xs rounded-md ${isPro ? 'bg-slate-100 text-slate-800 hover:bg-slate-200' : 'bg-slate-200 text-slate-500'}`}
                                                            title={proFeatureTooltip}
                                                        >
                                                            Añadir {!isPro && <ProStarIcon />}
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <div className="mt-1">
                                                        <span className="text-xs text-green-600 font-bold flex items-center gap-1">
                                                            <CheckCircleIcon className="h-3 w-3"/> Suficiente
                                                        </span>
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                            <tfoot>
                                <tr className="font-bold text-slate-900 bg-slate-100">
                                    <td colSpan={2} className="px-4 py-2 text-right text-base">TOTAL ({displayCurrency})</td>
                                    <td className="px-4 py-2 text-right text-base">
                                        {formatDisplayCurrency(displayCurrency === 'CUP' ? materialGrandTotal.cup : materialGrandTotal.usd)}
                                    </td>
                                    <td></td>
                                </tr>
                            </tfoot>
                        </table>
                    )}
                </div>
            </div>
        </div>
    )};

    const aggregatedInventory = React.useMemo(() => {
        const summary = new Map<string, {
            purchased: number;
            used: number;
            unit: string;
            items: InventoryItem[];
        }>();
    
        inventoryItems.forEach(item => {
            const key = `${item.name.trim().toLowerCase()}-${item.unit.trim().toLowerCase()}`;
            if (!summary.has(key)) {
                summary.set(key, { purchased: 0, used: 0, unit: item.unit, items: [] });
            }
            const group = summary.get(key)!;
            group.purchased += Number(item.quantityPurchased);
            group.used += Number(item.quantityUsed);
            group.items.push(item);
        });
    
        return Array.from(summary.entries()).map(([key, value]) => ({
            name: value.items[0]?.name || "Desconocido",
            ...value
        })).sort((a, b) => a.name.localeCompare(b.name));
    }, [inventoryItems]);

    const renderInventoryView = () => (
        <div>
            <div className="flex flex-wrap gap-4 justify-between items-center mb-4">
                <h3 className="text-xl font-semibold text-slate-600 flex items-center gap-2">
                    <CubeIcon className="h-6 w-6 text-slate-500" />
                    Inventario en Obra
                </h3>
                <div className="flex gap-2">
                    {selectedInventoryIds.size > 0 ? (
                        <button 
                            onClick={() => handleOpenBulkDeleteModal('inventory')}
                            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors shadow"
                        >
                            <TrashIcon className="h-5 w-5" />
                            Eliminar ({selectedInventoryIds.size})
                        </button>
                    ) : (
                        <button 
                            onClick={() => { setEditingInventoryItem(null); setInventoryDefaults(null); setIsInventoryItemModalOpen(true); }}
                            className="flex items-center gap-2 px-4 py-2 bg-cyan-600 text-white rounded-md hover:bg-cyan-700 transition-colors shadow"
                        >
                            <PlusIcon className="h-5 w-5" />
                            Añadir a Inventario
                        </button>
                    )}
                </div>
            </div>
             {isLoading ? <p>Cargando inventario...</p> : aggregatedInventory.length === 0 ? (
                <div className="text-center py-10 border-2 border-dashed border-slate-200 rounded-lg">
                    <p className="text-slate-500">El inventario del proyecto está vacío.</p>
                    <p className="text-slate-400 text-sm">Añada items manualmente o al registrar un gasto de materiales.</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {aggregatedInventory.map(group => {
                        const available = group.purchased - group.used;
                        const allItemsInGroupIds = group.items.map(i => i.id!);
                        const unlockableIds = group.items.filter(i => (Number(i.quantityUsed) || 0) <= 0).map(i => i.id!);
                        const allSelectedInGroup = unlockableIds.length > 0 && unlockableIds.every(id => selectedInventoryIds.has(id));

                        return (
                             <details key={group.name + group.unit} className="p-4 border rounded-lg bg-white shadow-sm group">
                                <summary className="flex flex-col md:flex-row justify-between items-start md:items-center cursor-pointer list-none -m-4 p-4">
                                    <div className="w-full md:w-1/3">
                                        <div className="font-semibold text-slate-800">{group.name}</div>
                                        <div className="text-sm text-slate-500">{group.unit}</div>
                                    </div>
                                    <div className="flex items-center justify-between md:justify-end gap-x-6 gap-y-2 text-sm w-full md:w-2/3 mt-2 md:mt-0 flex-wrap">
                                        <div className="text-center">
                                            <div className="text-xs text-slate-500">Comprado</div>
                                            <div className="font-medium">{group.purchased.toLocaleString()}</div>
                                        </div>
                                         <div className="text-center">
                                            <div className="text-xs text-slate-500">Usado</div>
                                            <div className="font-medium">{group.used.toLocaleString()}</div>
                                        </div>
                                        <div className="text-center">
                                            <div className="text-xs text-slate-500">Disponible</div>
                                            <div className={`font-bold text-lg ${available > 0 ? 'text-green-600' : 'text-slate-600'}`}>{available.toLocaleString()}</div>
                                        </div>
                                        <ChevronDownIcon className="h-5 w-5 text-slate-500 transform transition-transform group-open:rotate-180" />
                                    </div>
                                </summary>
                                <div className="mt-4 pt-3 border-t overflow-x-auto">
                                    <table className="w-full text-sm text-left text-slate-700">
                                        <thead className="text-xs text-slate-500 uppercase bg-slate-50">
                                            <tr>
                                                <th className="px-2 py-2 w-12 text-center">
                                                    <input
                                                        type="checkbox"
                                                        className="h-4 w-4 rounded border-gray-300 text-cyan-600 focus:ring-cyan-500 disabled:opacity-50"
                                                        checked={allSelectedInGroup}
                                                        onChange={() => handleSelectAllInventory(allItemsInGroupIds)}
                                                        disabled={unlockableIds.length === 0}
                                                    />
                                                </th>
                                                <th className="px-4 py-2">Fecha Compra</th>
                                                <th className="px-4 py-2 text-right">Comprado</th>
                                                <th className="px-4 py-2 text-right">Usado</th>
                                                <th className="px-4 py-2 text-right">Disponible</th>
                                                <th className="px-4 py-2 text-center">Acciones</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {group.items.map(item => {
                                                const itemAvailable = Number(item.quantityPurchased) - Number(item.quantityUsed);
                                                const isUsed = (Number(item.quantityUsed) || 0) > 0;

                                                return (
                                                    <tr key={item.id} className={`border-b border-slate-200 hover:bg-slate-50 ${selectedInventoryIds.has(item.id!) ? 'bg-cyan-50' : ''} ${isUsed ? 'bg-slate-50' : ''}`}>
                                                        <td className="px-2 py-2 w-12 text-center">
                                                            <input 
                                                                type="checkbox"
                                                                className="h-4 w-4 rounded border-gray-300 text-cyan-600 focus:ring-cyan-500 disabled:opacity-50"
                                                                checked={selectedInventoryIds.has(item.id!) ? 'checked' : ''}
                                                                onChange={() => handleInventorySelection(item.id!)}
                                                                disabled={isUsed}
                                                            />
                                                        </td>
                                                        <td className="px-4 py-2">{parseLocalDate(item.dateAdded).toLocaleDateString()}</td>
                                                        <td className="px-4 py-2 text-right">{Number(item.quantityPurchased).toLocaleString()} {item.unit}</td>
                                                        <td className="px-4 py-2 text-right">{Number(item.quantityUsed).toLocaleString()} {item.unit}</td>
                                                        <td className="px-4 py-2 text-right font-semibold">{itemAvailable.toLocaleString()} {item.unit}</td>
                                                        <td className="px-4 py-2 text-center">
                                                            <div className="flex items-center justify-center gap-1">
                                                                <button onClick={() => handleOpenUseModal(item)} className="p-2 text-slate-500 hover:text-cyan-600 disabled:opacity-50 disabled:cursor-not-allowed" disabled={itemAvailable <= 0} title="Registrar Uso">
                                                                    <PlusIcon className="h-5 w-5"/>
                                                                </button>
                                                                <button onClick={() => { setEditingInventoryItem(item); setIsInventoryItemModalOpen(true); }} className="p-2 text-slate-500 hover:text-cyan-600" title="Editar Compra">
                                                                    <PencilIcon className="h-5 w-5"/>
                                                                </button>
                                                                <button 
                                                                    onClick={() => handleOpenDeleteModal('inventory', item.id!)} 
                                                                    className={`p-2 text-slate-500 hover:text-red-600 ${isUsed ? 'opacity-50 cursor-not-allowed' : ''}`}
                                                                    disabled={isUsed}
                                                                    title={isUsed ? "No se puede eliminar porque ya se ha usado material." : "Eliminar Compra"}
                                                                >
                                                                    <TrashIcon className="h-5 w-5"/>
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                             </details>
                        );
                    })}
                </div>
            )}
        </div>
    );

    const renderLaborBudgetView = () => {
        const allLaborSelected = laborItems.length > 0 && laborItems.every(li => selectedLaborIds.has(li.id!));

        return (
        <div>
            <div className="flex flex-wrap justify-between items-center mb-4 gap-4">
                <div className="flex items-baseline gap-2">
                    <h3 className="text-xl font-semibold text-slate-600">Actividades de Mano de Obra</h3>
                    {!isPro && (
                        <span className="text-sm font-medium text-slate-500">
                            ({laborItems.length} / 5)
                        </span>
                    )}
                </div>
                <div className="flex items-center gap-2">
                    {selectedLaborIds.size > 0 && (
                        <button 
                            onClick={() => handleOpenBulkDeleteModal('labor')}
                            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors shadow text-sm"
                        >
                            <TrashIcon className="h-5 w-5" />
                            Eliminar ({selectedLaborIds.size})
                        </button>
                    )}
                    <button 
                        onClick={() => {
                            if (!isPro && laborItems.length >= 5) {
                                setIsLicenseModalOpen(true);
                            } else {
                                setEditingLaborItem(null);
                                setIsLaborItemModalOpen(true);
                            }
                        }}
                        className="flex items-center gap-2 px-4 py-2 bg-cyan-600 text-white rounded-md hover:bg-cyan-700 transition-colors shadow text-sm"
                    >
                        <PlusIcon className="h-5 w-5" />
                        Añadir Actividad
                    </button>
                </div>
            </div>
             {isLoading ? <p>Cargando...</p> : laborItems.length === 0 ? (
                <div className="text-center py-10 border-2 border-dashed border-slate-200 rounded-lg">
                    <p className="text-slate-500">No hay actividades de mano de obra.</p>
                </div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left text-slate-700">
                        <thead className="text-xs text-slate-500 uppercase bg-slate-100">
                            <tr>
                                <th className="px-2 py-3 w-12 text-center">
                                    <input 
                                        type="checkbox"
                                        checked={allLaborSelected}
                                        onChange={handleSelectAllLabor}
                                        className="h-4 w-4 rounded border-gray-300 text-cyan-600 focus:ring-cyan-500"
                                    />
                                </th>
                                <th className="px-4 py-3">Actividad</th>
                                <th className="px-4 py-3">Unidad</th>
                                <th className="px-4 py-3">Cant. Plan.</th>
                                <th className="px-4 py-3">Cant. Ejec. y Progreso</th>
                                <th className="px-4 py-3">Precio Unit. ({displayCurrency})</th>
                                <th className="px-4 py-3 text-right">Subtotal ({displayCurrency})</th>
                                <th className="px-4 py-3 text-center">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {laborItems.map(item => {
                                const quantityCompleted = Number(item.quantityCompleted) || 0;
                                const quantityPlanned = Number(item.quantity);
                                const percentageCompleted = quantityPlanned > 0 ? (quantityCompleted / quantityPlanned) * 100 : 0;
                                const minCompleted = minLaborQuantities.get(item.id!) || 0;
                                const subtotalUsd = quantityPlanned * Number(item.unitPrice);
                                const displaySubtotal = displayCurrency === 'CUP' ? subtotalUsd * (selectedProject?.exchangeRate || 380) : subtotalUsd;
                                
                                const rate = selectedProject?.exchangeRate || 380;
                                const displayUnitPrice = displayCurrency === 'CUP' ? Number(item.unitPrice) * rate : Number(item.unitPrice);
                                
                                const isLocked = quantityCompleted > 0;

                                return (
                                    <tr key={item.id} className={`border-b hover:bg-slate-50 transition-colors ${selectedLaborIds.has(item.id!) ? 'bg-cyan-50' : ''} ${isLocked ? 'bg-slate-50' : ''}`}>
                                        <td className="px-2 py-2 w-12 text-center">
                                            <input 
                                                type="checkbox"
                                                checked={selectedLaborIds.has(item.id!) ? 'checked' : ''}
                                                onChange={() => handleLaborSelection(item.id!)}
                                                className="h-4 w-4 rounded border-gray-300 text-cyan-600 focus:ring-cyan-500 disabled:opacity-50"
                                                disabled={isLocked}
                                            />
                                        </td>
                                        <td className="px-4 py-2 font-medium">{item.name}</td>
                                        <td className="px-4 py-2">{item.unit}</td>
                                        <td className="px-4 py-2">{quantityPlanned.toLocaleString()}</td>
                                        <td className="px-4 py-2 w-48">
                                            <ManagedNumberInput
                                                value={item.quantityCompleted || ''}
                                                onCommit={(newCompletedStr: string) => handleLaborCompletionChange(item.id!, newCompletedStr, minCompleted)}
                                                className="w-full p-1 border rounded bg-transparent text-left hover:border-slate-300 focus:bg-white focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
                                                step="0.01"
                                                max={quantityPlanned}
                                                min={minCompleted}
                                                placeholder="0.00"
                                                title={minCompleted > 0 ? `Valor mínimo certificado: ${minCompleted}` : ''}
                                            />
                                            <div className="mt-1.5" title={`${percentageCompleted.toFixed(1)}% completado`}>
                                                <div className="w-full bg-slate-200 rounded-full h-1.5">
                                                    <div
                                                        className={`h-1.5 rounded-full ${percentageCompleted >= 100 ? 'bg-green-500' : 'bg-cyan-600'}`}
                                                        style={{ width: `${Math.min(100, percentageCompleted)}%` }}
                                                    ></div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-2 w-36">
                                            <ManagedNumberInput
                                                value={displayUnitPrice}
                                                onCommit={(newPriceStr: string) => handleLaborPriceChange(item.id!, newPriceStr)}
                                                className="w-full p-1 border border-transparent rounded bg-transparent text-left hover:border-slate-300 focus:bg-white focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
                                                step="0.01"
                                                placeholder="0.00"
                                            />
                                        </td>
                                        <td className="px-4 py-2 text-right font-semibold">{formatDisplayCurrency(displaySubtotal)}</td>
                                        <td className="px-4 py-2 text-center">
                                            <div className="flex items-center justify-center gap-2">
                                                <button onClick={() => { setEditingLaborItem(item); setIsLaborItemModalOpen(true); }} className="p-2 text-slate-500 hover:text-cyan-600"><PencilIcon className="h-5 w-5"/></button>
                                                <button 
                                                    onClick={() => handleOpenDeleteModal('labor', item.id!)} 
                                                    className={`p-2 text-slate-500 hover:text-red-600 ${isLocked ? 'opacity-50 cursor-not-allowed' : ''}`}
                                                    disabled={isLocked}
                                                    title={isLocked ? "No se puede eliminar porque ya tiene avance ejecutado." : "Eliminar Actividad"}
                                                >
                                                    <TrashIcon className="h-5 w-5"/>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                        <tfoot>
                             <tr className="font-bold text-slate-900 bg-slate-100">
                                <td colSpan={6} className="px-4 py-2 text-right text-base">TOTAL ({displayCurrency})</td>
                                <td className="px-4 py-2 text-right text-base">
                                    {formatDisplayCurrency(displayCurrency === 'CUP' ? laborGrandTotal.cup : laborGrandTotal.usd)}
                                </td>
                                <td></td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            )}
        </div>
    );
    };

    const renderCertificationsView = (isParent: boolean) => {
        const canCreate = isPro;
        const totalPlannedUSD = materialGrandTotal.usd + laborGrandTotal.usd + manualBudgetGrandTotal.usd + automaticBudgetItems.total.usd + automaticBudgetItems.tax.usd;
        
        return (
            <div>
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                    <h3 className="text-xl font-semibold text-slate-600">Certificaciones y Facturación</h3>
                    <div className="flex flex-wrap w-full sm:w-auto gap-3">
                        <button 
                            onClick={() => setIsAdvanceInvoiceModalOpen(true)}
                            className="flex items-center justify-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-md hover:bg-amber-700 transition-colors shadow w-full sm:w-auto text-sm"
                            title="Generar factura por un porcentaje del total planificado"
                        >
                            <BanknotesIcon className="h-5 w-5" />
                            Factura Anticipo
                        </button>
                        <button 
                            onClick={() => handleFullCertificationAndInvoice()} 
                            className="flex items-center justify-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors shadow w-full sm:w-auto text-sm"
                        >
                            <CheckCircleIcon className="h-5 w-5" />
                            Cierre de Obra
                        </button>
                        <button 
                            onClick={() => { setIsCertificationModalOpen(true); }}
                            className="flex items-center justify-center gap-2 px-4 py-2 bg-cyan-600 text-white rounded-md hover:bg-cyan-700 transition-colors shadow w-full sm:w-auto text-sm"
                        >
                            <PlusIcon className="h-5 w-5" />
                            Nueva Certificación
                        </button>
                    </div>
                </div>

                {isLoading ? <p>Cargando certificaciones...</p> : certifications.length === 0 ? (
                    <div className="text-center py-10 border-2 border-dashed border-slate-200 rounded-lg">
                        <p className="text-slate-500">No hay certificaciones creadas.</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {certifications.map((cert, index) => {
                            const prevCert = index > 0 ? certifications[index - 1] : null;
                            const isPaid = !!cert.paymentTransactionId;
                            const rate = selectedProject?.exchangeRate || 380;
                            const totalAmount = cert.snapshot.finalBillableAmount;
                            const displayAmount = displayCurrency === 'CUP' ? totalAmount * rate : totalAmount;

                            return (
                                <div key={cert.id} className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm">
                                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <h4 className="text-lg font-bold text-slate-800">{cert.name}</h4>
                                                {cert.isAdvance && (
                                                    <span className="px-2 py-0.5 text-[10px] bg-amber-100 text-amber-800 rounded-full font-bold uppercase tracking-wider border border-amber-200">Anticipo {cert.advancePercentage}%</span>
                                                )}
                                                {isPaid ? (
                                                    <span className="px-2 py-0.5 text-xs bg-green-100 text-green-800 rounded-full font-medium border border-green-200">Pagada</span>
                                                ) : (
                                                    <span className="px-2 py-0.5 text-xs bg-yellow-100 text-yellow-800 rounded-full font-medium border border-yellow-200">Pendiente</span>
                                                )}
                                            </div>
                                            <p className="text-sm text-slate-500">{parseLocalDate(cert.certifiedAt).toLocaleDateString()}</p>
                                        </div>
                                        
                                        <div className="text-right">
                                            <p className="text-sm text-slate-500">Monto Facturable</p>
                                            <p className="text-xl font-bold text-cyan-700">{formatDisplayCurrency(displayAmount)}</p>
                                        </div>
                                    </div>

                                    <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap justify-end gap-2">
                                         {cert.invoicePdfBlob && (
                                              <>
                                                  <button 
                                                      onClick={() => handleViewInvoicePdf(cert.invoicePdfBlob!)}
                                                      className="flex items-center gap-1 px-3 py-1.5 bg-slate-100 text-slate-700 rounded-md hover:bg-slate-200 text-sm font-medium"
                                                  >
                                                      <EyeIcon className="h-4 w-4" /> Ver
                                                  </button>
                                                  <button 
                                                      onClick={() => handleDownloadInvoicePdf(cert.invoicePdfBlob!, cert.name)}
                                                      className="flex items-center gap-1 px-3 py-1.5 bg-cyan-100 text-cyan-800 rounded-md hover:bg-cyan-200 text-sm font-medium"
                                                      title="Descargar Factura en PDF"
                                                  >
                                                      <ArrowDownTrayIcon className="h-4 w-4" /> Descargar PDF
                                                  </button>
                                              </>
                                         )}
                                         <button 
                                             onClick={() => {
                                                 setSelectedCertificationForDetails(cert);
                                                 setPrevCertificationForDetails(prevCert);
                                                 setIsCertificationDetailsModalOpen(true);
                                             }}
                                             className="flex items-center gap-1 px-3 py-1.5 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-md text-sm font-medium border border-slate-200"
                                             title="Ver Desglose de Certificación"
                                         >
                                             <EyeIcon className="h-4 w-4" /> Ver Desglose
                                         </button>
                                         <button 
                                             onClick={() => { setInvoiceData({ cert, prevCert }); setIsInvoiceModalOpen(true); }}
                                             className="flex items-center gap-1 px-3 py-1.5 bg-cyan-50 text-cyan-700 hover:bg-cyan-100 rounded-md text-sm font-medium border border-cyan-100"
                                         >
                                             <DocumentIcon className="h-4 w-4" /> {cert.invoicePdfBlob ? 'Regenerar Factura' : 'Generar Factura'}
                                         </button>
                                        
                                         {!isPaid && (
                                            <button 
                                                onClick={() => handleRegisterPayment(cert)}
                                                className="flex items-center gap-1 px-3 py-1.5 bg-green-50 text-green-700 rounded-md hover:bg-green-100 text-sm font-medium"
                                            >
                                                <CheckCircleIcon className="h-4 w-4" /> Cobrar Factura
                                            </button>
                                        )}

                                        {isPaid && (
                                            <button 
                                                onClick={() => {
                                                    setCertificationToUnpay(cert);
                                                    setIsUnpayConfirmModalOpen(true);
                                                }}
                                                className="flex items-center gap-1 px-3 py-1.5 bg-amber-50 text-amber-700 hover:bg-amber-100 rounded-md text-sm font-medium border border-amber-100"
                                                title="Desmarcar como cobrada y eliminar transacción"
                                            >
                                                <ArrowPathIcon className="h-4 w-4" /> Desmarcar Cobrada
                                            </button>
                                        )}

                                        <button 
                                            onClick={() => handleOpenDeleteModal('certification', cert.id!)}
                                            className="p-2 text-slate-400 hover:text-red-700 hover:bg-slate-50 rounded-md transition-colors"
                                            title="Eliminar Certificación"
                                        >
                                            <TrashIcon className="h-5 w-5" />
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
                {/* ADVANCE MODAL INTEGRATION */}
                {selectedProject && (
                    <AdvanceInvoiceModal
                        isOpen={isAdvanceInvoiceModalOpen}
                        onClose={() => setIsAdvanceInvoiceModalOpen(false)}
                        project={selectedProject}
                        totalBudget={totalPlannedUSD}
                        currency={displayCurrency}
                        exchangeRate={selectedProject.exchangeRate || 380}
                        onSave={async (cert, paymentDate) => {
                            const newCertId = await addCertification(cert);
                            if (paymentDate) {
                                try {
                                    const paymentTx: Omit<Transaction, 'id' | 'projectId'> = {
                                        type: TransactionType.INCOME,
                                        description: `Pago de ${cert.name}`,
                                        amount: cert.snapshot.finalBillableAmount,
                                        date: paymentDate,
                                        category: 'Anticipo de obra',
                                    };
                                    const txId = await addTransaction({ ...paymentTx, projectId: selectedProject.id! });
                                    const finalCert = { ...cert, id: newCertId, paymentTransactionId: txId };
                                    await updateCertification(finalCert);
                                } catch (error) {
                                    console.error("Failed to register payment on save:", error);
                                }
                            }
                            await loadProjectData();
                            setIsAdvanceInvoiceModalOpen(false);
                        }}
                    />
                )}
            </div>
        );
    };

    return (
        <div className="container mx-auto max-w-7xl">
            {selectedProject ? renderProjectDetailView() : renderProjectList()}

            <Modal
                isOpen={isProjectModalOpen}
                onClose={() => { setIsProjectModalOpen(false); setEditingProject(null); }}
                title={editingProject ? 'Editar Proyecto' : 'Nuevo Proyecto'}
            >
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700">Nombre del Proyecto</label>
                        <input
                            type="text"
                            value={projectFormData.name}
                            onChange={e => setProjectFormData({ ...projectFormData, name: e.target.value })}
                            className="bg-white text-slate-900 mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-cyan-500 focus:ring-cyan-500 sm:text-sm px-3 py-2 border"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700">Cliente (Opcional)</label>
                        <input
                            type="text"
                            value={projectFormData.clientName}
                            onChange={e => setProjectFormData({ ...projectFormData, clientName: e.target.value })}
                            className="bg-white text-slate-900 mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-cyan-500 focus:ring-cyan-500 sm:text-sm px-3 py-2 border"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700">Dirección del Cliente (Opcional)</label>
                        <input
                            type="text"
                            value={projectFormData.clientAddress}
                            onChange={e => setProjectFormData({ ...projectFormData, clientAddress: e.target.value })}
                            className="bg-white text-slate-900 mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-cyan-500 focus:ring-cyan-500 sm:text-sm px-3 py-2 border"
                        />
                    </div>
                    <div className="flex justify-end gap-3 mt-6">
                        <button
                            onClick={() => { setIsProjectModalOpen(false); setEditingProject(null); }}
                            className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50"
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={handleSaveProject}
                            className="px-4 py-2 text-sm font-medium text-white bg-cyan-600 rounded-md hover:bg-cyan-700"
                        >
                            Guardar
                        </button>
                    </div>
                </div>
            </Modal>

            <Modal
                isOpen={isActivityModalOpen}
                onClose={() => setIsActivityModalOpen(false)}
                title={editingActivity ? 'Editar Actividad' : 'Nueva Actividad'}
                size="4xl"
            >
                {isActivityModalOpen && selectedActivityType && (
                    <ActivityForm
                        activityType={selectedActivityType}
                        initialData={editingActivity?.inputs}
                        initialName={editingActivity?.name}
                        customActivityData={selectedCustomActivity || undefined}
                        onSave={handleSaveActivity}
                        onCancel={() => setIsActivityModalOpen(false)}
                        isPro={isPro}
                        onUpgrade={() => { setIsActivityModalOpen(false); setIsLicenseModalOpen(true); }}
                    />
                )}
            </Modal>

            <AddLaborItemModal
                isOpen={isLaborItemModalOpen}
                onClose={() => setIsLaborItemModalOpen(false)}
                onSave={handleSaveLaborItem}
                onSaveAndAddMaterials={handleSaveLaborAndAddMaterials}
                initialData={editingLaborItem}
                currency={displayCurrency}
                exchangeRate={selectedProject?.exchangeRate || 380}
            />

            <BudgetItemModal
                isOpen={isBudgetItemModalOpen}
                onClose={() => setIsBudgetItemModalOpen(false)}
                onSave={handleSaveBudgetItem}
                initialData={editingBudgetItem}
                currency={displayCurrency}
                exchangeRate={selectedProject?.exchangeRate || 380}
            />

            <TransactionModal
                isOpen={isTransactionModalOpen}
                onClose={() => setIsTransactionModalOpen(false)}
                onSave={handleSaveTransaction}
                initialData={transactionDefaults || editingTransaction}
                currency={displayCurrency}
                exchangeRate={selectedProject?.exchangeRate || 380}
                manualBudgets={manualBudgetItems}
            />

            <InventoryItemModal
                isOpen={isInventoryItemModalOpen}
                onClose={() => setIsInventoryItemModalOpen(false)}
                onSave={handleSaveInventoryItem}
                initialData={inventoryDefaults || editingInventoryItem || undefined}
                totalMaterials={totalMaterials}
                inventoryItems={inventoryItems}
            />

            <Modal
                isOpen={isUseInventoryModalOpen}
                onClose={() => setIsUseInventoryModalOpen(false)}
                title="Registrar Uso de Material"
            >
                <div className="space-y-4">
                    <p className="text-slate-600">
                        Item: <strong>{itemToUse?.name}</strong> ({itemToUse?.unit})<br/>
                        Comprado: {itemToUse?.dateAdded && parseLocalDate(itemToUse.dateAdded).toLocaleDateString()}<br/>
                        Disponible: {itemToUse ? (Number(itemToUse.quantityPurchased) - Number(itemToUse.quantityUsed)).toLocaleString() : 0}
                    </p>
                    <div>
                        <label className="block text-sm font-medium text-slate-700">Cantidad a Usar</label>
                        <input
                            type="number"
                            value={useQuantity}
                            onChange={e => setUseQuantity(e.target.value)}
                            className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-cyan-500 focus:ring-cyan-500 sm:text-sm px-3 py-2 border"
                            placeholder="0.00"
                        />
                    </div>
                    <div className="flex justify-end gap-3 mt-6">
                        <button
                            onClick={() => setIsUseInventoryModalOpen(false)}
                            className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50"
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={handleConfirmUseItem}
                            className="px-4 py-2 text-sm font-medium text-white bg-cyan-600 rounded-md hover:bg-cyan-700"
                        >
                            Confirmar
                        </button>
                    </div>
                </div>
            </Modal>

            <FulfillNeedModal
                isOpen={isUseFromInventoryModalOpen}
                onClose={() => setIsUseFromInventoryModalOpen(false)}
                materialToFulfill={materialToFulfill}
                inventoryItems={inventoryItems}
                onConfirm={handleConfirmFulfillNeed}
            />

            <InvoiceModal
                isOpen={isInvoiceModalOpen}
                onClose={() => setIsInvoiceModalOpen(false)}
                project={selectedProject}
                certification={invoiceData.cert}
                previousCertification={invoiceData.prevCert}
                exchangeRate={selectedProject?.exchangeRate || 380}
                companyInfo={libraryData?.company_info}
                onInvoiceGenerated={handleInvoiceGenerated}
            />

            <OfferModal
                isOpen={isOfferModalOpen}
                onClose={() => setIsOfferModalOpen(false)}
                project={selectedProject}
                totals={{
                    material: materialGrandTotal.usd,
                    labor: laborGrandTotal.usd,
                    budget: budgetGrandTotal.usd,
                    serviceTax: taxGrandTotal.usd,
                    grandTotal: financialSummary.totalBudget.usd
                }}
                exchangeRate={selectedProject?.exchangeRate || 380}
                laborItems={laborItems}
                materials={totalMaterials}
                budgetItems={allBudgetItemsForExport}
                companyInfo={libraryData?.company_info}
            />

            <CertificationModal
                isOpen={isCertificationModalOpen}
                onClose={() => setIsCertificationModalOpen(false)}
                project={selectedProject!}
                allProjects={projects}
                isParentProject={projects.some(p => p.parentId === selectedProject?.id)}
                laborItems={laborItems}
                transactions={transactions}
                certifications={certifications}
                projectMaterialTotal={materialGrandTotal.usd}
                projectLaborTotal={laborGrandTotal.usd}
                projectManualBudgetTotal={manualBudgetGrandTotal.usd}
                budgetGrandTotal={financialSummary.totalBudget.usd}
                masterAnticipoPercentage={financialSummary.anticipoPercentage}
                onSave={async (cert, paymentDate) => {
                    const newCertId = await addCertification(cert);
                    if (paymentDate) {
                        try {
                            const paymentTx: Omit<Transaction, 'id' | 'projectId'> = {
                                type: TransactionType.INCOME,
                                description: `Pago de ${cert.name}`,
                                amount: cert.snapshot.finalBillableAmount,
                                date: paymentDate,
                                category: cert.isAdvance ? 'Anticipo de obra' : 'Pago por certificación',
                            };
                            const txId = await addTransaction({ ...paymentTx, projectId: selectedProject!.id! });
                            const finalCert = { ...cert, id: newCertId, paymentTransactionId: txId };
                            await updateCertification(finalCert);
                        } catch (error) {
                            console.error("Failed to register payment on save:", error);
                        }
                    }
                    await loadProjectData();
                    setIsCertificationModalOpen(false);
                }}
            />

            <CertificationDetailsModal
                isOpen={isCertificationDetailsModalOpen}
                onClose={() => setIsCertificationDetailsModalOpen(false)}
                project={selectedProject!}
                certification={selectedCertificationForDetails}
                prevCertification={prevCertificationForDetails}
                displayCurrency={displayCurrency}
                exchangeRate={selectedProject?.exchangeRate || 380}
            />

            <BuyAllMaterialsModal
                isOpen={isBuyAllModalOpen}
                onClose={() => setIsBuyAllModalOpen(false)}
                activity={activityToBuy}
                inventoryItems={inventoryItems}
                materialPrices={materialPrices}
                onConfirm={handleConfirmBuyAll}
            />

            <Modal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                title="Confirmar Eliminación"
            >
                <div className="space-y-4">
                    <p className="text-slate-600">
                        {itemToDelete?.type === 'project' 
                            ? '¿Está seguro de que desea eliminar esta obra principal? Seleccione una de las siguientes opciones:' 
                            : itemToDelete?.type === 'certification'
                                ? '¿Está seguro de que desea eliminar esta certificación? Si ya ha sido cobrada, esto también eliminará de forma permanente el cobro registrado en la sección de Finanzas.'
                                : '¿Está seguro de que desea eliminar este elemento? Esta acción no se puede deshacer.'}
                    </p>

                    {itemToDelete?.type === 'project' && (
                        <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 space-y-3">
                            <label className="block text-sm font-semibold text-slate-700">Opciones de eliminación:</label>
                            <div className="space-y-3">
                                <label className="flex items-start gap-3 cursor-pointer text-sm text-slate-700">
                                    <input
                                        type="radio"
                                        name="deleteOption"
                                        checked={deleteAssociatedData}
                                        onChange={() => setDeleteAssociatedData(true)}
                                        className="mt-1 h-4 w-4 text-red-600 border-slate-300 focus:ring-red-500"
                                    />
                                    <div>
                                        <span className="font-medium text-slate-900 block">Borrar obra y todos sus objetos de obra</span>
                                        <span className="text-xs text-slate-500">Elimina de forma permanente la obra junto con todas las actividades, mano de obra, presupuestos, transacciones, inventario y certificaciones asociadas.</span>
                                    </div>
                                </label>
                                <label className="flex items-start gap-3 cursor-pointer text-sm text-slate-700">
                                    <input
                                        type="radio"
                                        name="deleteOption"
                                        checked={!deleteAssociatedData}
                                        onChange={() => setDeleteAssociatedData(false)}
                                        className="mt-1 h-4 w-4 text-red-600 border-slate-300 focus:ring-red-500"
                                    />
                                    <div>
                                        <span className="font-medium text-slate-900 block">Borrar solo la obra principal</span>
                                        <span className="text-xs text-slate-500">Elimina únicamente la obra, conservando intactos en la base de datos todos los objetos de obra asociados.</span>
                                    </div>
                                </label>
                            </div>
                        </div>
                    )}

                    <div className="flex justify-end gap-3">
                        <button
                            onClick={() => setIsDeleteModalOpen(false)}
                            className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50"
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={handleConfirmDelete}
                            className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700"
                        >
                            Eliminar
                        </button>
                    </div>
                </div>
            </Modal>

            <Modal
                isOpen={isImportConfirmModalOpen}
                onClose={() => setIsImportConfirmModalOpen(false)}
                title="Confirmar Importación"
            >
                <div className="space-y-4">
                    <p className="text-slate-600">
                        Se importarán los proyectos y se actualizará la biblioteca de datos con el archivo seleccionado.
                    </p>
                    <div className="flex justify-end gap-3">
                        <button
                            onClick={() => setIsImportConfirmModalOpen(false)}
                            className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50"
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={handleConfirmImport}
                            className="px-4 py-2 text-sm font-medium text-white bg-cyan-600 rounded-md hover:bg-cyan-700"
                        >
                            Importar
                        </button>
                    </div>
                </div>
            </Modal>

            <DataLibrary
                isOpen={isDataLibraryOpen}
                onClose={() => setIsDataLibraryOpen(false)}
                selectedProject={selectedProject}
                onSaveChanges={handleDataLibrarySave}
                initialTab={libraryInitialTab as any}
                isPro={isPro}
                onUpgrade={() => { setIsDataLibraryOpen(false); setIsLicenseModalOpen(true); }}
            />

            <Modal
                isOpen={isBulkDeleteModalOpen}
                onClose={() => setIsBulkDeleteModalOpen(false)}
                title="Eliminación Masiva"
            >
                <div className="space-y-4">
                    <p className="text-slate-600">
                        ¿Está seguro de que desea eliminar {bulkDeleteConfig?.count} {bulkDeleteConfig?.type}?
                    </p>
                    <div className="flex justify-end gap-3">
                        <button
                            onClick={() => setIsBulkDeleteModalOpen(false)}
                            className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50"
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={async () => {
                                if (bulkDeleteConfig?.onConfirm) await bulkDeleteConfig.onConfirm();
                                setIsBulkDeleteModalOpen(false);
                            }}
                            className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700"
                        >
                            Eliminar Todo
                        </button>
                    </div>
                </div>
            </Modal>



            <Modal
                isOpen={isDuplicateModalOpen}
                onClose={() => setIsDuplicateModalOpen(false)}
                title="Duplicar Proyecto"
            >
                <div className="space-y-4">
                    <p className="text-slate-600">
                        ¿Desea crear una copia del proyecto "{projectToDuplicate?.name}"?
                    </p>
                    <div className="flex justify-end gap-3">
                        <button
                            onClick={() => setIsDuplicateModalOpen(false)}
                            className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50"
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={handleConfirmDuplicate}
                            className="px-4 py-2 text-sm font-medium text-white bg-cyan-600 rounded-md hover:bg-cyan-700"
                        >
                            Duplicar
                        </button>
                    </div>
                </div>
            </Modal>

            <Modal
                isOpen={isAssignParentModalOpen}
                onClose={() => setIsAssignParentModalOpen(false)}
                title="Asignar Proyecto Principal"
            >
                <div className="space-y-4">
                    <p className="text-slate-600">
                        Seleccione a qué proyecto principal debe pertenecer "{projectToMove?.name}".
                    </p>
                    <div className="max-h-60 overflow-y-auto border rounded-md">
                        {projects.filter(p => !p.parentId && p.id !== projectToMove?.id).length === 0 ? (
                            <p className="p-4 text-center text-slate-500">No hay proyectos principales disponibles.</p>
                        ) : (
                            <div className="divide-y">
                                {projects.filter(p => !p.parentId && p.id !== projectToMove?.id).map(p => (
                                    <button
                                        key={p.id}
                                        onClick={() => handleAssignParent(projectToMove!, p.id!)}
                                        className="w-full text-left px-4 py-3 hover:bg-slate-50 flex items-center justify-between"
                                    >
                                        <span className="font-medium text-slate-700">{p.name}</span>
                                        <span className="text-xs text-slate-500">ID: {p.id}</span>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                    <div className="flex justify-end gap-3 pt-4 border-t">
                        <button
                            onClick={() => setIsAssignParentModalOpen(false)}
                            className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50"
                        >
                            Cancelar
                        </button>
                    </div>
                </div>
            </Modal>

            <Modal
                isOpen={isResetConfirmModalOpen}
                onClose={() => setIsResetConfirmModalOpen(false)}
                title="Restablecer Compra"
            >
                <div className="space-y-4">
                    <p className="text-slate-600">
                        ¿Está seguro de que desea restablecer el estado de compra de los materiales de la actividad "{activityToReset?.name}"?
                    </p>
                    <div className="flex justify-end gap-3 pt-4 border-t">
                        <button
                            onClick={() => setIsResetConfirmModalOpen(false)}
                            className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50"
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={handleConfirmResetPurchase}
                            className="px-4 py-2 text-sm font-medium text-white bg-amber-600 rounded-md hover:bg-amber-700"
                        >
                            Restablecer
                        </button>
                    </div>
                </div>
            </Modal>

            <Modal
                isOpen={isUnpayConfirmModalOpen}
                onClose={() => setIsUnpayConfirmModalOpen(false)}
                title="Desmarcar Certificación Cobrada"
            >
                <div className="space-y-4">
                    <p className="text-slate-600">
                        ¿Está seguro de que desea desmarcar la certificación "{certificationToUnpay?.name}" como cobrada?
                    </p>
                    <p className="text-slate-500 text-sm">
                        Esto eliminará de forma permanente la transacción de cobro registrada en la sección de Finanzas, y devolverá la certificación a estado pendiente (permitiéndole regenerarla o eliminarla).
                    </p>
                    <div className="flex justify-end gap-3 pt-4 border-t">
                        <button
                            onClick={() => setIsUnpayConfirmModalOpen(false)}
                            className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50"
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={handleConfirmUnpayCertification}
                            className="px-4 py-2 text-sm font-medium text-white bg-amber-600 rounded-md hover:bg-amber-700 shadow-sm transition-all"
                        >
                            Desmarcar Cobrada
                        </button>
                    </div>
                </div>
            </Modal>

        </div>
    );
};
