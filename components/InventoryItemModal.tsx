import React from 'react';
import Modal from './Modal';
import type { InventoryItem, Material } from '../types';

const Input = (props: React.InputHTMLAttributes<HTMLInputElement> & { label: string }) => (
    <div>
        <label className="block text-sm font-medium text-slate-600 mb-1">{props.label}</label>
        <input {...props} className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition" />
    </div>
);

interface InventoryItemModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (item: Omit<InventoryItem, 'id' | 'projectId' | 'quantityUsed' | 'dateAdded'>) => void;
    initialData?: Partial<InventoryItem>;
    totalMaterials?: Material[];
    inventoryItems?: InventoryItem[];
}

export const InventoryItemModal: React.FC<InventoryItemModalProps> = ({ 
    isOpen, 
    onClose, 
    onSave, 
    initialData,
    totalMaterials,
    inventoryItems
}) => {
    const [name, setName] = React.useState('');
    const [quantityPurchased, setQuantityPurchased] = React.useState('');
    const [unit, setUnit] = React.useState('');

    React.useEffect(() => {
        if (isOpen) {
            setName(initialData?.name || '');
            setQuantityPurchased(initialData?.quantityPurchased?.toString() || '');
            setUnit(initialData?.unit || '');
        }
    }, [isOpen, initialData]);

    const warningInfo = React.useMemo(() => {
        if (!isOpen || !totalMaterials || !name.trim() || !unit.trim()) return null;
        
        const trimmedName = name.trim().toLowerCase();
        const trimmedUnit = unit.trim().toLowerCase();
        
        // Find matching required material in totalMaterials
        const requiredMaterial = totalMaterials.find(m => 
            m.name.trim().toLowerCase() === trimmedName && 
            m.unit.trim().toLowerCase() === trimmedUnit
        );
        
        if (!requiredMaterial) {
            return {
                type: 'not_in_project' as const,
                message: 'Nota: Este material no forma parte de las actividades calculadas de este proyecto, pero se puede agregar de forma independiente.'
            };
        }
        
        const totalRequired = requiredMaterial.quantity;
        
        // Sum already purchased, excluding current item being edited if we are editing
        const alreadyPurchased = (inventoryItems || [])
            .filter(item => 
                item.id !== initialData?.id && 
                item.name.trim().toLowerCase() === trimmedName && 
                item.unit.trim().toLowerCase() === trimmedUnit
            )
            .reduce((sum, item) => sum + (Number(item.quantityPurchased) || 0), 0);
            
        const enteredQty = parseFloat(quantityPurchased) || 0;
        const newTotalPurchased = alreadyPurchased + enteredQty;
        
        if (newTotalPurchased > totalRequired) {
            return {
                type: 'exceeds' as const,
                message: `Atención: Esta compra superará la cantidad necesaria para el proyecto. (Requerido: ${totalRequired.toLocaleString(undefined, { maximumFractionDigits: 2 })} ${unit}, Ya comprado: ${alreadyPurchased.toLocaleString(undefined, { maximumFractionDigits: 2 })} ${unit}, Nueva compra: ${enteredQty.toLocaleString(undefined, { maximumFractionDigits: 2 })} ${unit}). El total comprado será de ${newTotalPurchased.toLocaleString(undefined, { maximumFractionDigits: 2 })} ${unit}.`,
                excess: newTotalPurchased - totalRequired
            };
        }
        
        return null;
    }, [isOpen, name, quantityPurchased, unit, totalMaterials, inventoryItems, initialData]);

    const handleSave = () => {
        const numQuantity = parseFloat(quantityPurchased);
        if (!name.trim() || !unit.trim() || isNaN(numQuantity) || numQuantity <= 0) {
            alert("Por favor, complete todos los campos con valores válidos.");
            return;
        }
        onSave({ name, quantityPurchased: numQuantity, unit });
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={initialData?.id ? "Editar Item de Inventario" : "Añadir a Inventario"}>
            <div className="space-y-4">
                <Input 
                    label="Nombre del Material" 
                    type="text" 
                    value={name} 
                    onChange={e => setName(e.target.value)} 
                    placeholder="Ej: Cemento P350"
                />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input 
                        label="Cantidad Comprada" 
                        type="number" 
                        value={quantityPurchased} 
                        onChange={e => setQuantityPurchased(e.target.value)} 
                        placeholder="0.00" 
                        step="0.01"
                    />
                    <Input 
                        label="Unidad" 
                        type="text" 
                        value={unit} 
                        onChange={e => setUnit(e.target.value)} 
                        placeholder="sacos, m³, kg, etc."
                    />
                </div>

                {warningInfo && (
                    <div className={`p-3 rounded-lg border text-sm flex items-start gap-2.5 shadow-sm transition-all duration-200 ${
                        warningInfo.type === 'exceeds' 
                            ? 'bg-amber-50 border-amber-200 text-amber-850' 
                            : 'bg-cyan-50 border-cyan-200 text-cyan-850'
                    }`}>
                        <span className="text-base leading-none">
                            {warningInfo.type === 'exceeds' ? '⚠️' : 'ℹ️'}
                        </span>
                        <div>
                            <strong className="block font-semibold">
                                {warningInfo.type === 'exceeds' ? 'Materiales de más detectados' : 'Material independiente'}
                            </strong>
                            <p className="mt-0.5 text-xs opacity-90 leading-relaxed">
                                {warningInfo.message}
                            </p>
                        </div>
                    </div>
                )}
            </div>
            <div className="flex justify-end gap-4 mt-6 pt-4 border-t">
                <button type="button" onClick={onClose} className="px-4 py-2 bg-slate-200 text-slate-700 rounded-md hover:bg-slate-300">Cancelar</button>
                <button onClick={handleSave} className="px-4 py-2 bg-cyan-600 text-white rounded-md hover:bg-cyan-700 shadow">Guardar</button>
            </div>
        </Modal>
    );
};

export default InventoryItemModal;