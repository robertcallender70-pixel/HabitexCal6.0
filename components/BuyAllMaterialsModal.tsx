

import React from 'react';
import Modal from './Modal';
import type { Activity } from '../types';

const BuyAllMaterialsModal = ({ isOpen, onClose, activity, onConfirm }: {
    isOpen: boolean,
    onClose: () => void,
    activity: Activity | null,
    onConfirm: (activity: Activity, addToInventory: boolean) => void
}) => {
    const [addToInventory, setAddToInventory] = React.useState(true);
    if (!activity) return null;

    const materialsToBuy = activity.results.filter(m => (m.unitPrice || 0) > 0);
    const totalCost = materialsToBuy.reduce((sum, m) => sum + (m.quantity * (m.unitPrice || 0)), 0);

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Comprar Materiales para "${activity.name}"`}>
            <div className="space-y-4">
                {materialsToBuy.length === 0 ? (
                    <p className="text-slate-600 text-center py-4">No hay materiales con un precio definido para comprar en esta actividad.</p>
                ) : (
                    <>
                        <div className="max-h-64 overflow-y-auto border rounded-lg">
                            <table className="w-full text-sm text-left text-slate-800">
                                <thead className="text-xs text-slate-600 uppercase bg-slate-100 sticky top-0">
                                    <tr>
                                        <th className="px-4 py-2">Material</th>
                                        <th className="px-4 py-2 text-right">Cantidad</th>
                                        <th className="px-4 py-2 text-right">Precio Total (USD)</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-200">
                                    {materialsToBuy.map((material, index) => (
                                        <tr key={index}>
                                            <td className="px-4 py-2 font-medium">{material.name}</td>
                                            <td className="px-4 py-2 text-right">{material.quantity.toLocaleString()} {material.unit}</td>
                                            <td className="px-4 py-2 text-right font-semibold">{(material.quantity * (material.unitPrice || 0)).toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <div className="flex justify-between items-center text-lg font-bold p-3 bg-slate-100 rounded-lg text-slate-800">
                            <span>Costo Total:</span>
                            <span>{totalCost.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD</span>
                        </div>
                        <div className="pt-4 border-t">
                            <label className="flex items-center gap-3 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={addToInventory}
                                    onChange={(e) => setAddToInventory(e.target.checked)}
                                    className="h-5 w-5 rounded border-gray-300 text-cyan-600 focus:ring-cyan-500"
                                />
                                <span className="text-sm text-slate-700">Añadir materiales comprados al inventario de obra</span>
                            </label>
                        </div>
                    </>
                )}
            </div>
            <div className="flex justify-end gap-4 mt-6 pt-4 border-t">
                <button type="button" onClick={onClose} className="px-4 py-2 bg-slate-200 text-slate-700 rounded-md hover:bg-slate-300">Cancelar</button>
                {materialsToBuy.length > 0 && (
                    <button onClick={() => onConfirm(activity, addToInventory)} className="px-4 py-2 bg-cyan-600 text-white rounded-md hover:bg-cyan-700 shadow">
                        Confirmar Compra
                    </button>
                )}
            </div>
        </Modal>
    );
};

export default BuyAllMaterialsModal;