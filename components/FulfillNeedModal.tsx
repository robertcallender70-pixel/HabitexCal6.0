
import React from 'react';
import Modal from './Modal';
import type { Material, InventoryItem } from '../types';

interface FulfillNeedModalProps {
    isOpen: boolean;
    onClose: () => void;
    materialToFulfill: Material | null;
    inventoryItems: InventoryItem[];
    onConfirm: (usageData: Record<string, number>) => void;
}

const FulfillNeedModal: React.FC<FulfillNeedModalProps> = ({ isOpen, onClose, materialToFulfill, inventoryItems, onConfirm }) => {
    const [usage, setUsage] = React.useState<Record<string, string>>({});

    React.useEffect(() => {
        if (!isOpen) {
            setUsage({});
        }
    }, [isOpen]);

    if (!materialToFulfill) return null;

    const sources = inventoryItems.filter(item => 
        item.name === materialToFulfill.name && 
        item.unit === materialToFulfill.unit &&
        (Number(item.quantityPurchased) - Number(item.quantityUsed) > 0.001)
    );

    const needed = Number(materialToFulfill.quantityNeeded) || 0;
    
    const totalUsed = Object.values(usage).reduce<number>((sum, val) => sum + (parseFloat(String(val)) || 0), 0);
    const remainingNeeded = needed - totalUsed;

    const handleUsageChange = (itemId: number, value: string) => {
        setUsage(prev => ({...prev, [itemId]: value}));
    };

    const handleConfirm = () => {
        const finalUsage: Record<string, number> = {};
        for (const item of sources) {
            const usedStr = usage[String(item.id!)] || '0';
            const usedNum = parseFloat(usedStr);
            const available = Number(item.quantityPurchased) - Number(item.quantityUsed);

            if (isNaN(usedNum) || usedNum < 0 || usedNum > available) {
                alert(`Cantidad inválida para el item comprado el ${new Date(item.dateAdded).toLocaleDateString()}. Disponible: ${available}`);
                return;
            }
            if (usedNum > 0) {
                finalUsage[String(item.id!)] = usedNum;
            }
        }
        
        const totalToUse = Object.values(finalUsage).reduce<number>((sum, val) => sum + val, 0);
        
        if (totalToUse > (needed + 0.001)) { // Add tolerance
             alert(`Está intentando usar más de lo necesario. Necesario: ${needed.toLocaleString()}, Usando: ${totalToUse.toLocaleString()}`);
             return;
        }

        onConfirm(finalUsage);
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Usar "${materialToFulfill.name}" de Inventario`}>
            <div className="space-y-4">
                <div className="p-3 bg-slate-100 rounded-md text-center">
                    <p className="text-sm text-slate-600">Cantidad Necesaria Total</p>
                    <p className="text-2xl font-bold text-cyan-700">{needed.toLocaleString(undefined, { maximumFractionDigits: 2 })} {materialToFulfill.unit}</p>
                    {totalUsed > 0 && <p className="text-sm font-semibold text-red-600">Restan por surtir: {Math.max(0, remainingNeeded).toLocaleString(undefined, { maximumFractionDigits: 2 })}</p>}
                </div>

                <h4 className="font-semibold text-slate-700">Fuentes Disponibles en Inventario</h4>
                {sources.length === 0 ? (
                    <p className="text-slate-500 text-sm">No se encontraron fuentes para este material en el inventario.</p>
                ) : (
                    <div className="space-y-3 max-h-60 overflow-y-auto p-1">
                        {sources.map(item => {
                            const available = Number(item.quantityPurchased) - Number(item.quantityUsed);
                            const currentUsage = parseFloat(usage[String(item.id!)] || '0');
                            const maxAllowed = Math.min(available, remainingNeeded + currentUsage);
                            
                            return (
                                <div key={item.id} className="grid grid-cols-3 gap-4 items-center">
                                    <div className="col-span-1">
                                        <p className="font-medium text-sm">Comprado: {new Date(item.dateAdded).toLocaleDateString()}</p>
                                        <p className="text-xs text-slate-500">Disponible: {available.toLocaleString()}</p>
                                    </div>
                                    <div className="col-span-2">
                                        <input
                                            type="number"
                                            value={usage[String(item.id!)] || ''}
                                            onChange={e => handleUsageChange(item.id!, e.target.value)}
                                            max={maxAllowed}
                                            min="0"
                                            className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
                                            placeholder={`Usar (máx ${available.toLocaleString()})`}
                                        />
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )}
            </div>

            <div className="flex justify-end gap-4 mt-6 pt-4 border-t">
                <button type="button" onClick={onClose} className="px-4 py-2 bg-slate-200 text-slate-700 rounded-md hover:bg-slate-300">Cancelar</button>
                <button onClick={handleConfirm} className="px-4 py-2 bg-cyan-600 text-white rounded-md hover:bg-cyan-700 shadow" disabled={Number(totalUsed) <= 0}>
                    Confirmar Uso
                </button>
            </div>
        </Modal>
    );
};

export default FulfillNeedModal;
