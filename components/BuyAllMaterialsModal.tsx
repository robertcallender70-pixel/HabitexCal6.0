

import React from 'react';
import Modal from './Modal';
import type { Activity, InventoryItem } from '../types';

const getMaterialPrice = (name: string, unit: string, prices: Record<string, number>): number => {
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

const BuyAllMaterialsModal = ({ isOpen, onClose, activity, inventoryItems, materialPrices, onConfirm, activities = [] }: {
    isOpen: boolean,
    onClose: () => void,
    activity: Activity | null,
    inventoryItems: InventoryItem[],
    materialPrices: Record<string, number>,
    onConfirm: (activity: Activity, addToInventory: boolean, subtractInventory: boolean) => void,
    activities?: Activity[]
}) => {
    const [addToInventory, setAddToInventory] = React.useState(true);
    const [subtractInventory, setSubtractInventory] = React.useState(true);
    
    if (!activity) return null;

    const materialsToBuy = activity.results.map(m => {
        const key = `${m.name.trim().toLowerCase()}-${m.unit.trim().toLowerCase()}`;
        const currentPrice = m.unitPrice || getMaterialPrice(m.name, m.unit, materialPrices) || 0;
        
        // Calculate total quantity purchased in inventory for this specific project/material
        const totalPurchased = inventoryItems
            .filter(item => `${item.name.trim().toLowerCase()}-${item.unit.trim().toLowerCase()}` === key)
            .reduce((sum, item) => sum + (Number(item.quantityPurchased) - Number(item.quantityUsed)), 0);

        // Calculate quantities of this material already allocated to other purchased activities
        const allocatedQuantity = activities
            .filter(act => act.id !== activity.id && act.materialsPurchased)
            .reduce((sum, act) => {
                const matchingMaterial = act.results.find(res => `${res.name.trim().toLowerCase()}-${res.unit.trim().toLowerCase()}` === key);
                return sum + (matchingMaterial ? Number(matchingMaterial.quantity) : 0);
            }, 0);

        // Available free stock is the remainder after subtracting what has already been allocated
        const available = Math.max(0, totalPurchased - allocatedQuantity);

        const quantityNeeded = subtractInventory ? Math.max(0, m.quantity - available) : m.quantity;

        return {
            ...m,
            unitPrice: currentPrice,
            available,
            quantityNeeded
        };
    }).filter(m => m.unitPrice > 0 && m.quantityNeeded > 0 && !(m.name.toLowerCase().includes('acero') && m.unit.toLowerCase() === 'kg'));

    const totalCost = materialsToBuy.reduce((sum, m) => sum + (m.quantityNeeded * m.unitPrice), 0);

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Comprar Materiales para "${activity.name}"`}>
            <div className="space-y-4">
                {activity.materialsPurchased && (
                    <div className="p-3 bg-amber-50 border border-amber-200 text-amber-850 rounded-md text-sm flex items-start gap-2.5 shadow-sm">
                        <span className="text-lg leading-none">⚠️</span>
                        <div>
                            <strong className="block font-semibold">Materiales ya comprados</strong>
                            <p className="mt-0.5 text-xs opacity-90">
                                Ya has registrado una compra general de materiales para esta actividad anteriormente. Volver a comprar puede duplicar la adquisición de materiales de forma involuntaria en tus finanzas e inventario.
                            </p>
                        </div>
                    </div>
                )}
                {materialsToBuy.length === 0 ? (
                    <p className="text-slate-600 text-center py-4">No hay materiales faltantes con precio definido para comprar en esta actividad.</p>
                ) : (
                    <>
                        <div className="max-h-64 overflow-y-auto border rounded-lg">
                            <table className="w-full text-sm text-left text-slate-800">
                                <thead className="text-xs text-slate-600 uppercase bg-slate-100 sticky top-0">
                                    <tr>
                                        <th className="px-4 py-2">Material</th>
                                        <th className="px-4 py-2 text-right">Cantidad a Comprar</th>
                                        <th className="px-4 py-2 text-right">Precio Total (USD)</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-200">
                                    {materialsToBuy.map((material, index) => (
                                        <tr key={index}>
                                            <td className="px-4 py-2 font-medium">
                                                {material.name}
                                                {material.available > 0 && (
                                                    <div className="text-xs text-slate-500 font-normal">
                                                        Total requerido: {material.quantity.toLocaleString()} {material.unit} (En inventario: {material.available.toLocaleString()} {material.unit})
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-4 py-2 text-right">{material.quantityNeeded.toLocaleString()} {material.unit}</td>
                                            <td className="px-4 py-2 text-right font-semibold">{(material.quantityNeeded * material.unitPrice).toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <div className="flex justify-between items-center text-lg font-bold p-3 bg-slate-100 rounded-lg text-slate-800">
                            <span>Costo Total:</span>
                            <span>{totalCost.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD</span>
                        </div>
                        <div className="pt-4 border-t space-y-3">
                            <label className="flex items-center gap-3 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={addToInventory}
                                    onChange={(e) => setAddToInventory(e.target.checked)}
                                    className="h-5 w-5 rounded border-gray-300 text-cyan-600 focus:ring-cyan-500"
                                />
                                <span className="text-sm text-slate-700">Añadir materiales comprados al inventario de obra</span>
                            </label>
                            <label className="flex items-center gap-3 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={subtractInventory}
                                    onChange={(e) => setSubtractInventory(e.target.checked)}
                                    className="h-5 w-5 rounded border-gray-300 text-cyan-600 focus:ring-cyan-500"
                                />
                                <span className="text-sm text-slate-700">Restar materiales que ya existen en el inventario</span>
                            </label>

                            {/* Adaptive warning banners to prevent duplicate purchasing */}
                            {subtractInventory ? (
                                <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-850 rounded-md text-xs flex items-start gap-2.5 shadow-sm transition-all duration-200">
                                    <span className="text-sm leading-none">✓</span>
                                    <div>
                                        <strong className="font-semibold block">Ajuste de inventario activo</strong>
                                        <p className="mt-0.5 opacity-90">El sistema restará automáticamente los materiales ya comprados disponibles en inventario para evitar duplicaciones y proteger tu presupuesto.</p>
                                    </div>
                                </div>
                            ) : (
                                <div className="p-3 bg-amber-50 border border-amber-200 text-amber-850 rounded-md text-xs flex items-start gap-2.5 shadow-sm transition-all duration-200 animate-pulse">
                                    <span className="text-sm leading-none">⚠️</span>
                                    <div>
                                        <strong className="font-semibold block">Riesgo de duplicación y desfase presupuestario</strong>
                                        <p className="mt-0.5 opacity-90">Tienes desactivado el ajuste de inventario. Esto comprará la totalidad de materiales calculados de la actividad, ignorando las compras previas que ya registraste.</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </>
                )}
            </div>
            <div className="flex justify-end gap-4 mt-6 pt-4 border-t">
                <button type="button" onClick={onClose} className="px-4 py-2 bg-slate-200 text-slate-700 rounded-md hover:bg-slate-300">Cancelar</button>
                {materialsToBuy.length > 0 && (
                    <button onClick={() => onConfirm(activity, addToInventory, subtractInventory)} className="px-4 py-2 bg-cyan-600 text-white rounded-md hover:bg-cyan-700 shadow">
                        Confirmar Compra
                    </button>
                )}
            </div>
        </Modal>
    );
};

export default BuyAllMaterialsModal;