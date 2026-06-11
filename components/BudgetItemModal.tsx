
import React from 'react';
import Modal from './Modal';
import type { BudgetItem } from '../types';

const Input = (props: React.InputHTMLAttributes<HTMLInputElement> & { label: string }) => (
    <div>
        <label className="block text-sm font-medium text-slate-600 mb-1">{props.label}</label>
        <input {...props} className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition" />
    </div>
);

const Select = (props: React.SelectHTMLAttributes<HTMLSelectElement> & { label: string, children: React.ReactNode }) => (
     <div>
        <label className="block text-sm font-medium text-slate-600 mb-1">{props.label}</label>
        <select {...props} className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition bg-white">
            {props.children}
        </select>
    </div>
);

export const BudgetItemModal = ({ isOpen, onClose, onSave, initialData, currency, exchangeRate }: {
    isOpen: boolean, 
    onClose: () => void, 
    onSave: (item: any) => void, 
    initialData: BudgetItem | null,
    currency: 'USD' | 'CUP',
    exchangeRate: number
}) => {
    const PREDEFINED_BUDGET_CATEGORIES = ['Alquiler de Equipos', 'Permisos y Licencias', 'Gastos Administrativos', 'Otros', 'Personalizado'];
    
    const [category, setCategory] = React.useState(initialData?.category && !PREDEFINED_BUDGET_CATEGORIES.includes(initialData.category) ? 'Personalizado' : initialData?.category || PREDEFINED_BUDGET_CATEGORIES[0]);
    const [customCategory, setCustomCategory] = React.useState(initialData?.category && !PREDEFINED_BUDGET_CATEGORIES.includes(initialData.category) ? initialData.category : '');
    const [name, setName] = React.useState(initialData?.name || '');
    
    // Initialize cost based on display currency
    const initialCost = initialData?.cost
        ? (currency === 'CUP' ? initialData.cost * exchangeRate : initialData.cost)
        : '';
    const [cost, setCost] = React.useState<string>(initialCost.toString());

    React.useEffect(() => {
        if (isOpen) {
            setCategory(initialData?.category && !PREDEFINED_BUDGET_CATEGORIES.includes(initialData.category) ? 'Personalizado' : initialData?.category || PREDEFINED_BUDGET_CATEGORIES[0]);
            setCustomCategory(initialData?.category && !PREDEFINED_BUDGET_CATEGORIES.includes(initialData.category) ? initialData.category : '');
            setName(initialData?.name || '');
            
            const val = initialData?.cost
                ? (currency === 'CUP' ? initialData.cost * exchangeRate : initialData.cost)
                : '';
            setCost(val.toString());
        }
    }, [isOpen, initialData, currency, exchangeRate]);

    const handleSave = () => {
        const numCost = parseFloat(cost);
        const finalCategory = category === 'Personalizado' ? customCategory : category;

        if (finalCategory && name && numCost >= 0) {
            // Note: conversion back to USD happens in ProjectManager's handleSaveBudgetItem based on the passed value
            onSave({ category: finalCategory, name, cost: numCost });
        } else {
            alert("Por favor, complete todos los campos con valores válidos.");
        }
    };
    
    return (
        <Modal isOpen={isOpen} onClose={onClose} title={initialData ? "Editar Gasto Planificado" : "Añadir Gasto Planificado"}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                    <Select label="Categoría" value={category} onChange={e => setCategory(e.target.value)}>
                        {PREDEFINED_BUDGET_CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                    </Select>
                </div>

                {category === 'Personalizado' && (
                    <div className="md:col-span-2">
                        <Input label="Nombre de Categoría Personalizada" type="text" value={customCategory} onChange={e => setCustomCategory(e.target.value)} placeholder="Ej: Compra de planos" />
                    </div>
                )}
                
                <div className="md:col-span-2">
                    <Input label="Nombre / Descripción del Gasto" type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Ej: Alquiler de andamios" />
                </div>
                
                <div className="md:col-span-2">
                    <Input label={`Costo Total (${currency})`} type="number" value={cost} onChange={e => setCost(e.target.value)} placeholder="0.00" step="0.01" />
                </div>
            </div>
            
            <div className="flex justify-end gap-4 mt-6">
                <button type="button" onClick={onClose} className="px-4 py-2 bg-slate-200 text-slate-700 rounded-md hover:bg-slate-300">Cancelar</button>
                <button onClick={handleSave} className="px-4 py-2 bg-cyan-600 text-white rounded-md hover:bg-cyan-700 shadow">Guardar</button>
            </div>
        </Modal>
    );
}

export default BudgetItemModal;
