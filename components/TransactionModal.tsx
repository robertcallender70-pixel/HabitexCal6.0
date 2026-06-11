import React from 'react';
import Modal from './Modal';
import type { Transaction, BudgetItem } from '../types';
import { TransactionType } from '../types';

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

export const TransactionModal = ({ isOpen, onClose, onSave, initialData, currency, exchangeRate, manualBudgets = [] }: {
    isOpen: boolean, 
    onClose: () => void, 
    onSave: (item: any, addToInventory: boolean) => void, 
    initialData: Partial<Transaction> | null,
    currency: 'USD' | 'CUP',
    exchangeRate: number,
    manualBudgets?: BudgetItem[]
}) => {
    const [type, setType] = React.useState<TransactionType>(TransactionType.EXPENSE);
    const [description, setDescription] = React.useState('');
    const [amount, setAmount] = React.useState<string>('');
    const [date, setDate] = React.useState('');
    const [category, setCategory] = React.useState('Materiales');
    const [addToInventory, setAddToInventory] = React.useState(true);
    
    const EXPENSE_CATEGORIES_BASE = ['Materiales', 'Mano de Obra', 'Transporte', 'Herramientas', 'Permisos', 'Otros'];
    const INCOME_CATEGORIES = ['Anticipo de obra', 'Pago por certificación', 'Otros'];

    const expenseCategories = React.useMemo(() => {
        // Unique names and categories from manual budget items to allow tracking
        const manualNames = manualBudgets.map(b => b.name);
        const manualCats = manualBudgets.map(b => b.category);
        const combined = Array.from(new Set([...EXPENSE_CATEGORIES_BASE, ...manualNames, ...manualCats]));
        return combined.sort((a, b) => {
            // Keep Materiales/Mano de obra at the top for convenience
            const priorities: Record<string, number> = { 'Materiales': 1, 'Mano de Obra': 2, 'Transporte': 3 };
            const ap = priorities[a] || 99;
            const bp = priorities[b] || 99;
            if (ap !== bp) return ap - bp;
            return a.localeCompare(b);
        });
    }, [manualBudgets]);

    React.useEffect(() => {
        if (isOpen) {
            const initialType = initialData?.type || TransactionType.EXPENSE;
            const initialCategory = initialData?.category || (initialType === TransactionType.EXPENSE ? 'Materiales' : 'Pago por certificación');

            setType(initialType);
            setDescription(initialData?.description || '');
            
            const initialAmount = initialData?.amount
                ? (currency === 'CUP' ? initialData.amount * exchangeRate : initialData.amount)
                : '';
            setAmount(initialAmount.toString());
            
            setDate(initialData?.date || new Date().toISOString().slice(0, 10));
            setCategory(initialCategory);
            setAddToInventory(true);
        }
    }, [isOpen, initialData, currency, exchangeRate]);
    
    const handleTypeChange = (newType: TransactionType) => {
        setType(newType);
        if (!initialData?.id) { // Only reset category for new transactions, not when editing
            setCategory(newType === TransactionType.EXPENSE ? 'Materiales' : 'Pago por certificación');
        }
    };

    const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newCategory = e.target.value;
        setCategory(newCategory);
        
        // UX improvement: auto-fill description for common income categories if description is empty
        if (!description.trim() && type === TransactionType.INCOME) {
            if (newCategory === 'Anticipo de obra' || newCategory === 'Pago por certificación') {
                setDescription(newCategory);
            }
        }
    };

    const handleSave = () => {
        const numAmount = parseFloat(amount);
        if (description && numAmount > 0 && date) {
            const transactionData: Omit<Transaction, 'id' | 'projectId'> = {
                type,
                description,
                amount: numAmount,
                date,
                category: category,
            };
            const shouldAddToInventory = type === TransactionType.EXPENSE && category === 'Materiales' && addToInventory && !initialData?.id;
            // Conversion happens in parent handler
            onSave(transactionData, shouldAddToInventory);
        } else {
             alert("Por favor, complete todos los campos con valores válidos.");
        }
    }

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={initialData?.id ? "Editar Transacción" : "Nueva Transacción"}>
            <div className="space-y-4">
                 <div className="flex rounded-md shadow-sm">
                    <button
                        type="button"
                        onClick={() => handleTypeChange(TransactionType.EXPENSE)}
                        className={`px-4 py-2 text-sm font-medium ${type === TransactionType.EXPENSE ? 'bg-cyan-600 text-white' : 'bg-white text-slate-700 hover:bg-slate-50'} border border-slate-300 rounded-l-md focus:z-10 focus:ring-2 focus:ring-cyan-500`}
                    >
                        Gasto
                    </button>
                    <button
                        type="button"
                        onClick={() => handleTypeChange(TransactionType.INCOME)}
                        className={`px-4 py-2 text-sm font-medium ${type === TransactionType.INCOME ? 'bg-cyan-600 text-white' : 'bg-white text-slate-700 hover:bg-slate-50'} border-t border-b border-r border-slate-300 rounded-r-md focus:z-10 focus:ring-2 focus:ring-cyan-500`}
                    >
                        Ingreso
                    </button>
                </div>
                
                <Input label="Descripción" type="text" value={description} onChange={e => setDescription(e.target.value)} placeholder={type === TransactionType.EXPENSE ? "Ej: Compra de cemento" : "Ej: Anticipo del cliente"} />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input label={`Monto (${currency})`} type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0.00" step="0.01" />
                    <Input label="Fecha" type="date" value={date} onChange={e => setDate(e.target.value)} />
                </div>
                
                {type === TransactionType.EXPENSE ? (
                    <Select label="Categoría del Gasto" value={category} onChange={handleCategoryChange}>
                        {expenseCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                    </Select>
                ) : (
                     <Select label="Categoría del Ingreso" value={category} onChange={handleCategoryChange}>
                        {INCOME_CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                    </Select>
                )}

                {type === TransactionType.EXPENSE && category === 'Materiales' && !initialData?.id && (
                    <div className="mt-4 pt-4 border-t">
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={addToInventory}
                                onChange={(e) => setAddToInventory(e.target.checked)}
                                className="h-5 w-5 rounded border-gray-300 text-cyan-600 focus:ring-cyan-500"
                            />
                            <span className="text-sm text-slate-600">Añadir al inventario de obra</span>
                        </label>
                    </div>
                )}
            </div>
             <div className="flex justify-end gap-4 mt-6 pt-4 border-t">
                <button type="button" onClick={onClose} className="px-4 py-2 bg-slate-200 text-slate-700 rounded-md hover:bg-slate-300">Cancelar</button>
                <button onClick={handleSave} className="px-4 py-2 bg-cyan-600 text-white rounded-md hover:bg-cyan-700 shadow">Guardar</button>
            </div>
        </Modal>
    )
}

export default TransactionModal;