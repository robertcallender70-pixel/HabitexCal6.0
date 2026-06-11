
import React from 'react';
import Modal from './Modal';
import type { LaborItem, PredefinedLaborActivity, ActivityType } from '../types';
import { getDataLibrary } from '../services/database';


const Input = (props: React.InputHTMLAttributes<HTMLInputElement> & { label: string }) => (
    <div>
        <label className="block text-sm font-medium text-slate-600 mb-1">{props.label}</label>
        <input {...props} className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition" />
    </div>
);

interface AddLaborItemModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (item: Omit<LaborItem, 'id' | 'projectId'>) => void;
    onSaveAndAddMaterials: (item: Omit<LaborItem, 'id' | 'projectId'>, materialType: ActivityType) => void;
    initialData: LaborItem | null;
    currency: 'USD' | 'CUP';
    exchangeRate: number;
}


export const AddLaborItemModal: React.FC<AddLaborItemModalProps> = ({ isOpen, onClose, onSave, onSaveAndAddMaterials, initialData, currency, exchangeRate }) => {
    const [mode, setMode] = React.useState<'library' | 'custom'>(initialData ? 'custom' : 'library');
    const [searchTerm, setSearchTerm] = React.useState('');
    const [selectedActivity, setSelectedActivity] = React.useState<PredefinedLaborActivity | null>(null);
    const [quantity, setQuantity] = React.useState<string>(initialData?.quantity?.toString() || '');
    const [selectedCategory, setSelectedCategory] = React.useState<string>('all');
    const [showConfirmation, setShowConfirmation] = React.useState(false);

    const [customName, setCustomName] = React.useState(initialData?.name || '');
    const [customUnit, setCustomUnit] = React.useState(initialData?.unit || '');
    // Initialize price based on display currency
    const initialPrice = initialData?.unitPrice 
        ? (currency === 'CUP' ? initialData.unitPrice * exchangeRate : initialData.unitPrice)
        : '';
    const [customPrice, setCustomPrice] = React.useState<string>(initialPrice.toString());
    
    const [laborLibrary, setLaborLibrary] = React.useState<PredefinedLaborActivity[]>([]);

    React.useEffect(() => {
        if (isOpen) {
            const fetchLibrary = async () => {
                const library = await getDataLibrary();
                const multiplier = library.labor_multiplier_factor ?? 1.0;
                const baseLabor = library.labor_activities || [];
                const modifiedLabor = baseLabor.map((item: PredefinedLaborActivity) => ({
                    ...item,
                    priceUSD: item.priceUSD * multiplier
                }));
                setLaborLibrary(modifiedLabor);
            };
            fetchLibrary();
        }
    }, [isOpen]);

    const laborCategories = React.useMemo(() => {
        if (!laborLibrary) return [];
        const categories = Array.from(new Set(laborLibrary.map(a => a.category)));
        return ['all', ...categories.sort()];
    }, [laborLibrary]);
    
    const categoryDisplayNames: Record<string, string> = {
        all: 'Todos',
        excavation: 'Excavación',
        construction: 'Construcción',
        finishing: 'Acabado',
        demolition: 'Demolición',
        plumbing: 'Plomería',
        electrical: 'Electricidad'
    };

    const filteredActivities = React.useMemo(() => {
        if (!laborLibrary) return [];
        return laborLibrary.filter(act => {
             const categoryMatch = selectedCategory === 'all' || act.category === selectedCategory;
             const searchMatch = act.name.toLowerCase().includes(searchTerm.toLowerCase());
             return categoryMatch && searchMatch;
        });
    },
    [searchTerm, selectedCategory, laborLibrary]);
    
    const resetLocalState = () => {
        setMode(initialData ? 'custom' : 'library');
        setSearchTerm('');
        setSelectedActivity(null);
        setQuantity(initialData?.quantity?.toString() || '');
        setSelectedCategory('all');
        setShowConfirmation(false);
        setCustomName(initialData?.name || '');
        setCustomUnit(initialData?.unit || '');
        
        const price = initialData?.unitPrice 
            ? (currency === 'CUP' ? initialData.unitPrice * exchangeRate : initialData.unitPrice)
            : '';
        setCustomPrice(price.toString());
    };
    
    React.useEffect(() => {
        if (isOpen) {
            resetLocalState();
        }
    }, [isOpen, initialData, currency, exchangeRate]);

    const getPriceToSave = (activity: PredefinedLaborActivity) => {
        if (currency === 'CUP') {
            return activity.priceUSD * exchangeRate;
        }
        return activity.priceUSD;
    };

    const handleSave = () => {
        const numQuantity = parseFloat(quantity);
        if (isNaN(numQuantity) || numQuantity <= 0) {
            alert("Por favor, introduzca una cantidad válida.");
            return;
        }

        if (mode === 'library' && selectedActivity) {
            const price = getPriceToSave(selectedActivity);
            if (selectedActivity.materialActivityType && !initialData) {
                setShowConfirmation(true);
            } else {
                onSave({ name: selectedActivity.name, unit: selectedActivity.unit, unitPrice: price, quantity: numQuantity });
            }
        } else if (mode === 'custom' && customName && customUnit && parseFloat(customPrice) >= 0) {
            onSave({ name: customName, unit: customUnit, unitPrice: parseFloat(customPrice), quantity: numQuantity });
        } else {
            alert("Por favor, complete todos los campos requeridos con valores válidos.");
        }
    };

    const handleConfirmAddMaterials = () => {
        const numQuantity = parseFloat(quantity);
        if (selectedActivity && selectedActivity.materialActivityType && numQuantity > 0) {
            const price = getPriceToSave(selectedActivity);
            const laborItem = { name: selectedActivity.name, unit: selectedActivity.unit, unitPrice: price, quantity: numQuantity };
            onSaveAndAddMaterials(laborItem, selectedActivity.materialActivityType);
        }
    };

    const handleJustSaveLabor = () => {
        const numQuantity = parseFloat(quantity);
        if (selectedActivity && numQuantity > 0) {
            const price = getPriceToSave(selectedActivity);
            onSave({ name: selectedActivity.name, unit: selectedActivity.unit, unitPrice: price, quantity: numQuantity });
        }
    };

    const renderConfirmationView = () => (
        <div className="text-center">
            <h4 className="text-lg font-semibold text-slate-800">¿Añadir Cálculo de Materiales?</h4>
            <p className="mt-2 text-slate-600">
                La actividad <span className="font-semibold">"{selectedActivity?.name}"</span> tiene un cálculo de materiales asociado.
            </p>
            <p className="mt-1 text-slate-600">
                ¿Desea añadirlo al proyecto también?
            </p>
            <div className="flex justify-center gap-4 mt-6">
                <button 
                    onClick={handleJustSaveLabor} 
                    className="px-4 py-2 bg-slate-200 text-slate-700 rounded-md hover:bg-slate-300 transition-colors w-full"
                >
                    No, solo guardar mano de obra
                </button>
                <button 
                    onClick={handleConfirmAddMaterials} 
                    className="px-4 py-2 bg-cyan-600 text-white rounded-md hover:bg-cyan-700 shadow transition-colors w-full"
                >
                    Sí, añadir materiales
                </button>
            </div>
        </div>
    );

    const renderFormView = () => {
       if (mode === 'library' && laborLibrary.length === 0) {
            return <p>Cargando biblioteca de mano de obra...</p>;
       }
        
       return (
        <>
            <div className="flex justify-center border-b mb-4">
                 {!initialData && (
                    <>
                        <button onClick={() => setMode('library')} className={`px-4 py-2 rounded-t-md ${mode === 'library' ? 'bg-slate-100' : ''}`}>Desde Biblioteca</button>
                        <button onClick={() => setMode('custom')} className={`px-4 py-2 rounded-t-md ${mode === 'custom' ? 'bg-slate-100' : ''}`}>Personalizada</button>
                    </>
                 )}
            </div>

            {mode === 'library' && !initialData && (
                <div>
                    <div className="flex flex-wrap gap-2 mb-4">
                        {laborCategories.map(category => (
                            <button
                                key={category}
                                onClick={() => setSelectedCategory(category)}
                                className={`px-3 py-1 text-sm rounded-full transition-colors ${
                                    selectedCategory === category
                                        ? 'bg-cyan-600 text-white'
                                        : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                                }`}
                            >
                                {categoryDisplayNames[category] || category}
                            </button>
                        ))}
                    </div>
                    <Input label="Buscar en biblioteca..." type="text" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                    <div className="max-h-60 overflow-y-auto mt-2 border rounded-md">
                        {filteredActivities.map(act => {
                            const displayPrice = currency === 'CUP' ? act.priceUSD * exchangeRate : act.priceUSD;
                            return (
                                <div key={act.id} onClick={() => setSelectedActivity(act)} className={`p-2 cursor-pointer hover:bg-cyan-50 ${selectedActivity?.id === act.id ? 'bg-cyan-100' : ''}`}>
                                    {act.name} <span className="text-xs text-slate-500">(${displayPrice.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})} {currency}/{act.unit})</span>
                                </div>
                            )
                        })}
                    </div>
                    {selectedActivity && <Input label="Cantidad" type="number" value={quantity} onChange={e => setQuantity(e.target.value)} className="mt-4" placeholder="0.00" />}
                </div>
            )}
            
            {mode === 'custom' && (
                <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2"><Input label="Nombre de Actividad" type="text" value={customName} onChange={e => setCustomName(e.target.value)} /></div>
                    <Input label="Unidad" type="text" value={customUnit} onChange={e => setCustomUnit(e.target.value)} />
                    <Input label={`Precio Unitario (${currency})`} type="number" value={customPrice} onChange={e => setCustomPrice(e.target.value)} />
                    <div className="col-span-2"><Input label="Cantidad" type="number" value={quantity} onChange={e => setQuantity(e.target.value)} placeholder="0.00" /></div>
                </div>
            )}
            
            <div className="flex justify-end gap-4 mt-8 pt-4 border-t">
                <button type="button" onClick={onClose} className="px-4 py-2 bg-slate-200 text-slate-700 rounded-md hover:bg-slate-300">Cancelar</button>
                <button onClick={handleSave} className="px-4 py-2 bg-cyan-600 text-white rounded-md hover:bg-cyan-700 shadow">Guardar</button>
            </div>
        </>
       );
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={initialData ? "Editar Actividad de Obra" : "Añadir Actividad de Obra"}>
           {showConfirmation ? renderConfirmationView() : renderFormView()}
        </Modal>
    );
}

export default AddLaborItemModal;
