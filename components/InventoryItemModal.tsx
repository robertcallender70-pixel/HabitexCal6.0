import React from 'react';
import Modal from './Modal';
import type { InventoryItem } from '../types';

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
}

export const InventoryItemModal: React.FC<InventoryItemModalProps> = ({ isOpen, onClose, onSave, initialData }) => {
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
            </div>
            <div className="flex justify-end gap-4 mt-6 pt-4 border-t">
                <button type="button" onClick={onClose} className="px-4 py-2 bg-slate-200 text-slate-700 rounded-md hover:bg-slate-300">Cancelar</button>
                <button onClick={handleSave} className="px-4 py-2 bg-cyan-600 text-white rounded-md hover:bg-cyan-700 shadow">Guardar</button>
            </div>
        </Modal>
    );
};

export default InventoryItemModal;