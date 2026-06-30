

import React from 'react';
import { getMaterialPrices, setMaterialPrice, getDataLibrary, updateDataLibraryItem, deleteMaterialPrice } from '../services/database';
import type { PredefinedLaborActivity, Project, Material, CustomMaterialActivity, CustomMaterial, CustomActivityUnit, CommercialUnitRule, AceroData, MorterosMurosData, MorterosPisoData, License } from '../types';
import Modal from './Modal';
import { PlusIcon, TrashIcon, PencilIcon } from '../constants';
import ManagedNumberInput from './ManagedNumberInput';
import { getDefaultProductivity } from './ActivityScheduler';

const Input = ({ label, hideLabel, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { label?: string, hideLabel?: boolean }) => (
    <div>
        {label && !hideLabel && <label className="block text-xs font-medium text-slate-600 mb-1">{label}</label>}
        <input {...props} className="w-full px-2 py-1 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-cyan-500 text-slate-900 disabled:bg-slate-100 disabled:cursor-not-allowed" />
    </div>
);

const Select = (props: React.SelectHTMLAttributes<HTMLSelectElement> & { label?: string, children: React.ReactNode }) => (
     <div>
        {props.label && <label className="block text-xs font-medium text-slate-600 mb-1">{props.label}</label>}
        <select {...props} className="w-full px-2 py-1 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-cyan-500 transition bg-white disabled:bg-slate-100 disabled:cursor-not-allowed">
            {props.children}
        </select>
    </div>
);

const ProStarIcon = (props: any) => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-yellow-400" viewBox="0 0 20 20" fill="currentColor" {...props}>
        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
    </svg>
);

const UpgradeToPro = ({ onUpgrade, featureName }: { onUpgrade: () => void, featureName: string }) => (
    <div className="text-center p-8 bg-slate-50 rounded-lg">
        <ProStarIcon className="h-12 w-12 text-yellow-400 mx-auto mb-4" />
        <h3 className="text-xl font-bold text-slate-800">Función Pro: {featureName}</h3>
        <p className="mt-2 text-slate-600 max-w-md mx-auto">Esta función requiere una licencia Pro. Actualice para desbloquear esta y muchas otras herramientas avanzadas que le permitirán gestionar sus proyectos de forma más eficiente.</p>
        <button onClick={onUpgrade} className="mt-6 px-6 py-3 bg-cyan-600 text-white font-semibold rounded-md hover:bg-cyan-700 shadow-lg transition-transform transform hover:scale-105">
            Activar Licencia Pro
        </button>
    </div>
);


// --- Labor Library Component ---
const DataLibraryLabor = ({ 
    data, 
    multiplier, 
    onUpdate, 
    onUpdateMultiplier, 
    isPro, 
    onUpgrade 
}: { 
    data: PredefinedLaborActivity[], 
    multiplier: number, 
    onUpdate: (data: PredefinedLaborActivity[]) => void, 
    onUpdateMultiplier: (factor: number) => void, 
    isPro: boolean, 
    onUpgrade: () => void 
}) => {
    const [searchTerm, setSearchTerm] = React.useState('');
    const [newActivity, setNewActivity] = React.useState({ name: '', unit: '', priceUSD: '', productivity: '', category: 'construction' });
    const [activityToDeleteId, setActivityToDeleteId] = React.useState<number | null>(null);
    
    const laborCategories = React.useMemo(() => {
        if (!data) return [];
        const categories = Array.from(new Set(data.map(a => a.category)));
        return categories.sort();
    }, [data]);
    
    const categoryDisplayNames: Record<string, string> = {
        excavation: 'Excavación',
        construction: 'Construcción',
        finishing: 'Acabado',
        demolition: 'Demolición',
        plumbing: 'Plomería',
        electrical: 'Electricidad'
    };

    const handlePriceChange = (id: number, newPrice: string) => {
        const updatedData = data.map(item =>
            item.id === id ? { ...item, priceUSD: parseFloat(newPrice) || 0 } : item
        );
        onUpdate(updatedData);
    };

    const handleProductivityChange = (id: number, newProd: string) => {
        const updatedData = data.map(item =>
            item.id === id ? { ...item, productivity: parseFloat(newProd) || 0 } : item
        );
        onUpdate(updatedData);
    };

    const handleAddNewActivity = () => {
        const { name, unit, priceUSD, productivity, category } = newActivity;
        if (!name || !unit || !priceUSD) {
            alert("Por favor complete todos los campos para la nueva actividad.");
            return;
        }

        const newId = Math.max(0, ...data.map(d => d.id)) + 1;
        const activityToAdd: PredefinedLaborActivity = {
            id: newId,
            name,
            unit,
            priceUSD: parseFloat(priceUSD),
            productivity: productivity ? parseFloat(productivity) : getDefaultProductivity(name, unit),
            category
        };
        onUpdate([...data, activityToAdd]);
        setNewActivity({ name: '', unit: '', priceUSD: '', productivity: '', category: 'construction' }); // Reset form
    };

    const handleDeleteActivity = (id: number) => {
        setActivityToDeleteId(id);
    };

    const confirmDeleteActivity = () => {
        if (activityToDeleteId !== null) {
            onUpdate(data.filter(item => item.id !== activityToDeleteId));
            setActivityToDeleteId(null);
        }
    };

    const filteredData = (data || []).filter(item => item.name.toLowerCase().includes(searchTerm.toLowerCase()));

    return (
        <div className="space-y-4">
            <div className="bg-cyan-50 border border-cyan-200/60 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
                <div className="space-y-1">
                    <h3 className="text-sm font-semibold text-cyan-900 uppercase tracking-wide">Factor Multiplicador de Mano de Obra</h3>
                    <p className="text-xs text-cyan-700 max-w-xl">
                        Introduce un factor de ajuste que se aplicará como multiplicador a todas las tarifas de mano de obra en el cálculo y presupuestos de la aplicación.
                    </p>
                </div>
                <div className="flex items-center gap-2 self-start sm:self-center">
                    <label htmlFor="multiplier-input" className="text-xs font-bold text-cyan-900 uppercase tracking-wide whitespace-nowrap">Factor:</label>
                    <ManagedNumberInput
                        id="multiplier-input"
                        type="number"
                        value={multiplier}
                        onCommit={(value) => onUpdateMultiplier(parseFloat(value) || 1.0)}
                        step="0.05"
                        min="0.01"
                        disabled={!isPro}
                        className="w-24 px-3 py-1.5 bg-white border border-cyan-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 font-bold text-center text-cyan-800 disabled:opacity-60 disabled:cursor-not-allowed"
                    />
                </div>
            </div>

            <Input label="Buscar Actividad" type="text" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Escriba para filtrar..." />
            <div className="max-h-[50vh] overflow-y-auto border rounded-lg">
                <table className="w-full text-sm text-left">
                    <thead className="text-xs text-slate-600 uppercase bg-slate-100 sticky top-0 z-10">
                        <tr>
                            <th className="px-4 py-2">Actividad</th>
                            <th className="px-4 py-2 w-24">Unidad</th>
                            <th className="px-4 py-2 w-32">Rendimiento (U/Día)</th>
                            <th className="px-4 py-2 w-32">Precio Base (USD)</th>
                            <th className="px-4 py-2 w-36">Precio con Factor (USD)</th>
                            <th className="px-4 py-2 w-16 text-center">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y">
                        {filteredData.map(item => (
                            <tr key={item.id} className="hover:bg-slate-50">
                                <td className="px-4 py-2 font-medium text-slate-900">{item.name}</td>
                                <td className="px-4 py-2 text-slate-900">{item.unit}</td>
                                <td className="px-4 py-2" onClick={!isPro ? onUpgrade : undefined} title={!isPro ? 'Función Pro: Edite rendimiento de mano de obra' : ''}>
                                    <ManagedNumberInput
                                        type="number"
                                        hideLabel
                                        value={item.productivity != null ? item.productivity : getDefaultProductivity(item.name, item.unit)}
                                        onCommit={newProd => handleProductivityChange(item.id, newProd)}
                                        step="0.1"
                                        disabled={!isPro}
                                        className="w-full px-2 py-1 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-cyan-500 text-slate-900 disabled:bg-slate-100 disabled:cursor-not-allowed text-right font-medium"
                                    />
                                </td>
                                <td className="px-4 py-2" onClick={!isPro ? onUpgrade : undefined} title={!isPro ? 'Función Pro: Edite precios de mano de obra' : ''}>
                                    <ManagedNumberInput
                                        type="number"
                                        hideLabel
                                        value={item.priceUSD}
                                        onCommit={newPrice => handlePriceChange(item.id, newPrice)}
                                        step="0.01"
                                        disabled={!isPro}
                                        className="w-full px-2 py-1 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-cyan-500 text-slate-900 disabled:bg-slate-100 disabled:cursor-not-allowed text-right font-medium"
                                    />
                                </td>
                                <td className="px-4 py-2 text-right font-semibold text-cyan-700 bg-cyan-50/20">
                                    ${(item.priceUSD * multiplier).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </td>
                                <td className="px-4 py-2 text-center">
                                    <button onClick={!isPro ? onUpgrade : () => handleDeleteActivity(item.id)} className="p-1 text-slate-400 hover:text-red-600 disabled:opacity-50 disabled:cursor-not-allowed" title={!isPro ? 'Función Pro' : 'Eliminar Actividad'} disabled={!isPro}>
                                        <TrashIcon className="h-5 w-5" />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                    <tfoot className="bg-slate-50" onClick={!isPro ? onUpgrade : undefined} title={!isPro ? 'Función Pro: Añada sus propias actividades' : ''}>
                        <tr>
                            <td className="px-4 py-2">
                                <Input hideLabel placeholder="Nombre nueva actividad" value={newActivity.name} onChange={e => setNewActivity(p => ({ ...p, name: e.target.value }))} disabled={!isPro}/>
                            </td>
                             <td className="px-4 py-2">
                                <Input hideLabel placeholder="Unidad" value={newActivity.unit} onChange={e => setNewActivity(p => ({ ...p, unit: e.target.value }))} disabled={!isPro}/>
                            </td>
                            <td className="px-4 py-2">
                                <Input hideLabel type="number" placeholder="Rendimiento" value={newActivity.productivity} onChange={e => setNewActivity(p => ({ ...p, productivity: e.target.value }))} disabled={!isPro}/>
                            </td>
                            <td className="px-4 py-2">
                                <Input hideLabel type="number" placeholder="Precio Base" value={newActivity.priceUSD} onChange={e => setNewActivity(p => ({ ...p, priceUSD: e.target.value }))} disabled={!isPro}/>
                            </td>
                            <td className="px-4 py-2 text-right font-semibold text-cyan-600 bg-cyan-50/20">
                                {newActivity.priceUSD ? `$${(parseFloat(newActivity.priceUSD) * multiplier).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '-'}
                            </td>
                            <td className="px-4 py-2 text-center">
                                <button onClick={handleAddNewActivity} className="p-1 text-slate-400 hover:text-green-600 disabled:opacity-50 disabled:cursor-not-allowed" title={!isPro ? 'Función Pro' : 'Añadir Actividad'} disabled={!isPro}>
                                    <PlusIcon className="h-6 w-6" />
                                </button>
                            </td>
                        </tr>
                        <tr>
                            <td colSpan={6} className="px-4 pb-2">
                                <Select value={newActivity.category} onChange={e => setNewActivity(p => ({...p, category: e.target.value}))} disabled={!isPro}>
                                     {laborCategories.map(cat => <option key={cat} value={cat}>{categoryDisplayNames[cat] || cat}</option>)}
                                </Select>
                            </td>
                        </tr>
                    </tfoot>
                </table>
            </div>

            {activityToDeleteId !== null && (
                <Modal
                    isOpen={!!activityToDeleteId}
                    onClose={() => setActivityToDeleteId(null)}
                    title="Confirmar Eliminación"
                    size="md"
                >
                    <p>¿Está seguro de que desea eliminar esta actividad de la biblioteca global? Esta acción es permanente.</p>
                    <div className="flex justify-end gap-4 mt-6">
                        <button onClick={() => setActivityToDeleteId(null)} className="px-4 py-2 bg-slate-200 text-slate-700 rounded-md hover:bg-slate-300">Cancelar</button>
                        <button onClick={confirmDeleteActivity} className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700">Eliminar</button>
                    </div>
                </Modal>
            )}
        </div>
    );
};

// --- Materials Library Component ---
const DataLibraryMaterials = ({ materialsWithPrices, onPriceChange, onMaterialAdd, onDelete }: { 
    materialsWithPrices: (Material & { price: number })[], 
    onPriceChange: (name: string, unit: string, price: string) => void,
    onMaterialAdd: (name: string, unit: string) => void,
    onDelete: (name: string, unit: string) => void
}) => {
    const [searchTerm, setSearchTerm] = React.useState('');
    const [newMaterialName, setNewMaterialName] = React.useState('');
    const [newMaterialUnit, setNewMaterialUnit] = React.useState('');

    const filteredData = (materialsWithPrices || []).filter(item => 
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        item.unit.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleAddMaterial = () => {
        if (newMaterialName.trim() && newMaterialUnit.trim()) {
            onMaterialAdd(newMaterialName.trim(), newMaterialUnit.trim());
            setNewMaterialName('');
            setNewMaterialUnit('');
        } else {
            alert("Por favor, introduzca un nombre y una unidad para el nuevo material.");
        }
    };

    return (
        <div className="space-y-4">
            <Input label="Buscar Material" type="text" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Escriba para filtrar..." />
            <div className="max-h-[55vh] overflow-y-auto border rounded-lg">
                <table className="w-full text-sm text-left">
                    <thead className="text-xs text-slate-600 uppercase bg-slate-100 sticky top-0 z-10">
                        <tr>
                            <th className="px-4 py-2">Material</th>
                            <th className="px-4 py-2 w-48">Unidad Comercial</th>
                            <th className="px-4 py-2 w-40">Precio Unitario (USD)</th>
                            <th className="px-4 py-2 w-20 text-center">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y">
                        {filteredData.map((item) => (
                            <tr key={`${item.name}-${item.unit}`} className="hover:bg-slate-100">
                                <td className="px-4 py-2 font-medium text-slate-900">{item.name}</td>
                                <td className="px-4 py-2 text-slate-900 font-medium">{item.unit}</td>
                                <td className="px-4 py-2">
                                    <ManagedNumberInput
                                        type="number"
                                        hideLabel
                                        value={item.price}
                                        onCommit={newPrice => onPriceChange(item.name, item.unit, newPrice)}
                                        step="0.01"
                                        placeholder="0.00"
                                        className="w-full px-2 py-1 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-cyan-500 text-slate-900"
                                    />
                                </td>
                                <td className="px-4 py-2 text-center">
                                    <button 
                                        onClick={() => onDelete(item.name, item.unit)}
                                        className="p-1 text-slate-400 hover:text-red-600"
                                        title="Eliminar precio del material"
                                    >
                                        <TrashIcon className="h-5 w-5" />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                    <tfoot className="bg-slate-50">
                        <tr>
                            <td className="p-2">
                                <Input hideLabel placeholder="Nombre del nuevo material" value={newMaterialName} onChange={e => setNewMaterialName(e.target.value)} />
                            </td>
                            <td className="p-2">
                                <Input hideLabel placeholder="Unidad (ej: m², kg)" value={newMaterialUnit} onChange={e => setNewMaterialUnit(e.target.value)} />
                            </td>
                            <td className="p-2 text-center" colSpan={2}>
                                <button onClick={handleAddMaterial} className="flex items-center justify-center w-full px-3 py-1.5 bg-cyan-600 text-white rounded-md hover:bg-cyan-700 transition-colors shadow">
                                    <PlusIcon className="h-5 w-5" />
                                    <span className="ml-1">Añadir</span>
                                </button>
                            </td>
                        </tr>
                    </tfoot>
                </table>
            </div>
        </div>
    );
};


// --- Formulas Library Component ---
const FormulaSection = ({ title, children }: { title: string, children?: React.ReactNode }) => (
    <details className="p-4 border rounded-lg bg-white" open>
        <summary className="font-semibold text-lg cursor-pointer text-slate-700">{title}</summary>
        <div className="mt-4">{children}</div>
    </details>
);

const GenericTableEditor = ({ libraryKey, sectionData, columns, onUpdate, canAdd, canDelete, defaultNewRow }: { 
    libraryKey: string, 
    sectionData: any[], 
    columns: { key: keyof any, label: string, type?: string, editable: boolean }[], 
    onUpdate: Function,
    canAdd?: boolean,
    canDelete?: boolean,
    defaultNewRow?: any
}) => {
    const [rowToDeleteIndex, setRowToDeleteIndex] = React.useState<number | null>(null);

    const handleCellChange = (rowIndex: number, key: keyof any, value: any) => {
        const updatedData = [...sectionData];
        updatedData[rowIndex] = { ...updatedData[rowIndex], [key]: value };
        onUpdate(libraryKey, updatedData);
    };

    const handleDeleteRow = (rowIndex: number) => {
        setRowToDeleteIndex(rowIndex);
    };

    const confirmDeleteRow = () => {
        if (rowToDeleteIndex !== null) {
            const updatedData = [...sectionData];
            updatedData.splice(rowToDeleteIndex, 1);
            onUpdate(libraryKey, updatedData);
            setRowToDeleteIndex(null);
        }
    };

    const handleAddRow = () => {
        const newRow = { ...defaultNewRow };
        if (libraryKey.startsWith('morteros')) {
            newRow.id = `custom_${Date.now()}`;
        }
        const updatedData = [...(sectionData || []), newRow];
        onUpdate(libraryKey, updatedData);
    };

    return (
         <div className="overflow-x-auto">
            <table className="w-full text-sm">
                <thead className="text-xs text-slate-600 uppercase bg-slate-100">
                    <tr>
                        {columns.map(col => <th key={String(col.key)} className="px-4 py-2 text-left">{col.label}</th>)}
                        {canDelete && <th className="px-4 py-2 text-left w-20">Acciones</th>}
                    </tr>
                </thead>
                <tbody className="divide-y">
                    {(sectionData || []).map((row, rowIndex) => (
                        <tr key={row.id || rowIndex} className="hover:bg-slate-50">
                            {columns.map(col => (
                                <td key={String(col.key)} className="px-2 py-1">
                                    {col.editable ? (
                                        <ManagedNumberInput
                                            hideLabel
                                            type={col.type || 'number'}
                                            value={row[col.key]}
                                            onCommit={value => handleCellChange(rowIndex, col.key, col.type === 'text' ? value : parseFloat(value) || 0)}
                                            step="0.001"
                                            className="w-full px-2 py-1 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-cyan-500 text-slate-900"
                                        />
                                    ) : (
                                        <span className="text-slate-900 px-2">{row[col.key]}</span>
                                    )}
                                </td>
                            ))}
                            {canDelete && (
                                <td className="px-2 py-1 text-center">
                                    <button onClick={() => handleDeleteRow(rowIndex)} className="p-1 text-slate-400 hover:text-red-600">
                                        <TrashIcon className="h-5 w-5" />
                                    </button>
                                </td>
                            )}
                        </tr>
                    ))}
                </tbody>
                {canAdd && (
                    <tfoot className="bg-slate-50">
                        <tr>
                            <td colSpan={columns.length + (canDelete ? 1 : 0)} className="p-2 text-center">
                                <button onClick={handleAddRow} className="text-sm flex items-center gap-2 px-3 py-1.5 bg-slate-200 rounded-md hover:bg-slate-300 mx-auto">
                                    <PlusIcon className="h-4 w-4" /> Añadir Nueva Fila
                                </button>
                            </td>
                        </tr>
                    </tfoot>
                )}
            </table>
            {rowToDeleteIndex !== null && (
                 <Modal
                    isOpen={rowToDeleteIndex !== null}
                    onClose={() => setRowToDeleteIndex(null)}
                    title="Confirmar Eliminación de Fila"
                    size="md"
                >
                    <p>¿Está seguro de que desea eliminar esta fila? Esta acción es permanente.</p>
                    <div className="flex justify-end gap-4 mt-6">
                        <button onClick={() => setRowToDeleteIndex(null)} className="px-4 py-2 bg-slate-200 text-slate-700 rounded-md hover:bg-slate-300">Cancelar</button>
                        <button onClick={confirmDeleteRow} className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700">Eliminar</button>
                    </div>
                </Modal>
            )}
        </div>
    );
};

const GenericObjectEditor = ({ libraryKey, data, onUpdate }: { libraryKey: string, data: Record<string, number>, onUpdate: Function }) => {
    const handleCommit = (key: string, value: string) => {
        const updatedData = { ...data, [key]: parseFloat(value) || 0 };
        onUpdate(libraryKey, updatedData);
    };
    return (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {Object.entries(data || {}).map(([key, value]) => (
                <div key={key}>
                    <label className="block text-xs font-medium text-slate-600 mb-1">{key.replace(/_/g, ' ')}</label>
                    <ManagedNumberInput
                        type="number"
                        value={value}
                        onCommit={(newValue) => handleCommit(key, newValue)}
                        step="0.001"
                        className="w-full px-2 py-1 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-cyan-500 text-slate-900"
                    />
                </div>
            ))}
        </div>
    )
};

const DataLibraryFormulas = ({ data, onUpdate }: { data: Record<string, any>, onUpdate: (libraryKey: string, sectionData: any) => void }) => {
    const handleUpdate = (libraryKey: string, updatedSectionData: any) => {
        onUpdate(libraryKey, updatedSectionData);
    };

    return (
        <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2 bg-slate-50 p-2 rounded-lg">
            <FormulaSection title="Dosificación de Hormigones">
                <GenericTableEditor
                    libraryKey="hormigones"
                    sectionData={data.hormigones}
                    onUpdate={handleUpdate}
                    canAdd
                    canDelete
                    defaultNewRow={{ resistencia: 0, cemento: 0, arena: 0, piedra: 0, agua: 0 }}
                    columns={[
                        { key: 'resistencia', label: 'Resistencia (Kg/cm²)', editable: true },
                        { key: 'cemento', label: 'Cemento (sacos)', editable: true },
                        { key: 'arena', label: 'Arena (m³)', editable: true },
                        { key: 'piedra', label: 'Piedra (m³)', editable: true },
                        { key: 'agua', label: 'Agua (L)', editable: true },
                    ]}
                />
            </FormulaSection>
            <FormulaSection title="Datos de Barras de Acero">
                <GenericTableEditor
                    libraryKey="acero_barras"
                    sectionData={data.acero_barras}
                    onUpdate={handleUpdate}
                    columns={[
                        { key: 'barra', label: '# Barra', editable: false },
                        { key: 'pulgadas', label: 'Pulgadas', editable: true, type: 'text' },
                        { key: 'pesoUnit', label: 'Peso (kg/m)', editable: true },
                    ]}
                />
            </FormulaSection>
            <FormulaSection title="Morteros para Muros (por m²)">
                <GenericTableEditor
                    libraryKey="morteros_muros"
                    sectionData={data.morteros_muros}
                    onUpdate={handleUpdate}
                    canAdd
                    canDelete
                    defaultNewRow={{ id: '', nombre: '', unidades: 0, cemento: 0, arena: 0, polvoPiedra: 0 }}
                    columns={[
                        { key: 'nombre', label: 'Tipo', editable: true, type: 'text' },
                        { key: 'unidades', label: 'Unidades', editable: true },
                        { key: 'cemento', label: 'Cemento (sacos)', editable: true },
                        { key: 'arena', label: 'Arena (m³)', editable: true },
                        { key: 'polvoPiedra', label: 'Polvo Piedra (m³)', editable: true },
                    ]}
                />
            </FormulaSection>
            <FormulaSection title="Morteros para Revestimiento (por m²)">
                 <GenericTableEditor
                    libraryKey="morteros_revestimiento"
                    sectionData={data.morteros_revestimiento}
                    onUpdate={handleUpdate}
                    canAdd
                    canDelete
                    defaultNewRow={{ id: '', nombre: '', cemento: 0, arena: 0, polvoPiedra: 0 }}
                    columns={[
                        { key: 'nombre', label: 'Tipo', editable: true, type: 'text' },
                        { key: 'cemento', label: 'Cemento (sacos)', editable: true },
                        { key: 'arena', label: 'Arena (m³)', editable: true },
                        { key: 'polvoPiedra', label: 'Polvo Piedra (m³)', editable: true },
                    ]}
                />
            </FormulaSection>
            <FormulaSection title="Morteros para Pisos (por m² o m)">
                 <GenericTableEditor
                    libraryKey="morteros_piso"
                    sectionData={data.morteros_piso}
                    onUpdate={handleUpdate}
                    canAdd
                    canDelete
                    defaultNewRow={{ id: '', nombre: '', unidades: 0, cemento: 0, arena: 0, polvoPiedra: 0 }}
                    columns={[
                        { key: 'nombre', label: 'Tipo', editable: true, type: 'text' },
                        { key: 'unidades', label: 'Unidades', editable: true },
                        { key: 'cemento', label: 'Cemento (sacos)', editable: true },
                        { key: 'arena', label: 'Arena (m³)', editable: true },
                        { key: 'polvoPiedra', label: 'Polvo Piedra (m³)', editable: true },
                    ]}
                />
            </FormulaSection>
            <FormulaSection title="Rendimiento de Pintura (litros/m²)">
                <GenericObjectEditor libraryKey="pintura" data={data.pintura} onUpdate={handleUpdate} />
            </FormulaSection>
            <FormulaSection title="Materiales de Enchape (por m²)">
                <GenericObjectEditor libraryKey="enchape" data={data.enchape} onUpdate={handleUpdate} />
            </FormulaSection>
            <FormulaSection title="Estructura de Pladur - Pared (por m²)">
                <GenericObjectEditor libraryKey="pladur_pared" data={data.pladur_pared} onUpdate={handleUpdate} />
            </FormulaSection>
            <FormulaSection title="Estructura de Pladur - Techo (por m²)">
                <GenericObjectEditor libraryKey="pladur_techo" data={data.pladur_techo} onUpdate={handleUpdate} />
            </FormulaSection>
        </div>
    );
};

const DataLibraryExpenses = ({ data, onUpdate }: { data: any, onUpdate: (data: any) => void }) => {
    const updateField = (field: string, value: string) => {
        const numValue = parseFloat(value) || 0;
        if (field === 'toolsAndUtilitiesPercentage' && numValue > 5) {
            alert('¡Alerta! El porcentaje de Gastos de Útiles y Herramientas no debe superar el 5%.');
        }
        onUpdate({ ...data, [field]: numValue });
    };

    const fields = [
        { key: 'logisticsPercentage', label: 'Logística (%)' },
        { key: 'technicalAssistancePercentage', label: 'Asistencia Técnica (%)' },
        { key: 'toolsAndUtilitiesPercentage', label: 'Gastos de Útiles y Herramientas (%)' },
        { key: 'transportPercentage', label: 'Transportación (%)' },
        { key: 'contingencyPercentage', label: 'Imprevistos (%)' },
        { key: 'profitPercentage', label: 'Utilidad (%)' },
    ];

    return (
        <div className="space-y-4 p-2">
            <div className="bg-slate-50 p-4 rounded-lg border">
                <h3 className="text-lg font-semibold text-slate-800">Porcentajes por Defecto para Gastos Indirectos</h3>
                <p className="mt-1 text-sm text-slate-600">
                    Estos valores se utilizarán como base para todos los proyectos nuevos que se creen. 
                    Podrás ajustarlos individualmente en cada proyecto.
                </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-4">
                {fields.map(field => (
                    <div key={field.key}>
                        <label className="block text-xs font-medium text-slate-600 mb-1">{field.label}</label>
                        <ManagedNumberInput
                            type="number"
                            value={data?.[field.key] ?? ''}
                            onCommit={(value) => updateField(field.key, value)}
                            step="0.1"
                            className="w-full px-2 py-1 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-cyan-500 text-slate-900"
                        />
                    </div>
                ))}
            </div>
        </div>
    );
};

const LicenseStatus = ({ licenseData }: { licenseData: License }) => {
    if (!licenseData) return null;

    if (licenseData.status === 'pro' && licenseData.key) {
        let expirationInfo = {
            status: 'Error',
            message: 'No se pudo leer la licencia.',
            color: 'red'
        };

        try {
            const payloadB64 = licenseData.key.split('.')[0];
            const payloadStr = atob(payloadB64);
            const payload = JSON.parse(payloadStr);

            if (payload.expiresAt) {
                const date = new Date(payload.expiresAt);
                const now = new Date();
                const diffTime = date.getTime() - now.getTime();
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                if (diffDays > 0) {
                    expirationInfo = {
                        status: `${diffDays} ${diffDays === 1 ? 'día restante' : 'días restantes'}`,
                        message: `Válida hasta: ${date.toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })}`,
                        color: 'blue'
                    };
                } else {
                    expirationInfo = {
                        status: 'Licencia Expirada',
                        message: `Expiró el: ${date.toLocaleDateString('es-ES')}`,
                        color: 'red'
                    };
                }
            } else {
                expirationInfo = {
                    status: 'Licencia Permanente',
                    message: 'Válida de por vida en este dispositivo.',
                    color: 'green'
                };
            }
        } catch (e) {
            console.error("Could not parse license key payload:", e);
        }
        
        const colorClasses: Record<string, string> = {
            blue: 'bg-blue-50 border-blue-200 text-blue-800',
            green: 'bg-green-50 border-green-200 text-green-800',
            red: 'bg-red-50 border-red-200 text-red-800',
        };
        const colorClass = colorClasses[expirationInfo.color] || 'bg-slate-50 border-slate-200';


        return (
            <div className={`p-4 rounded-lg border ${colorClass} mb-6`}>
                <div className="flex items-start gap-3">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 20.944a11.955 11.955 0 0118 0 12.02 12.02 0 00-2.382-8.984z" /></svg>
                    <div>
                         <h4 className="font-bold text-lg leading-tight">Plan Pro Activo</h4>
                         <p className="font-semibold text-xl mt-1">{expirationInfo.status}</p>
                         <p className="text-xs mt-1">{expirationInfo.message}</p>
                    </div>
                </div>
            </div>
        );

    } else {
         return (
            <div className="p-4 rounded-lg border bg-slate-50 border-slate-200 text-slate-700 mb-6">
                <div className="flex items-center gap-3">
                     <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    <div>
                        <h4 className="font-bold text-lg">Plan Gratuito</h4>
                        <p className="text-sm">Actualice a Pro para desbloquear todas las funciones.</p>
                    </div>
                </div>
            </div>
        );
    }
};

const DataLibraryCompany = ({ companyData, licenseData, onUpdate }: { companyData: any, licenseData: License, onUpdate: (data: any) => void }) => {
    const handleCommit = (field: string, value: string) => {
        onUpdate({ ...companyData, [field]: value });
    };


    return (
        <div className="space-y-4 p-2">
            <LicenseStatus licenseData={licenseData} />
            <div className="bg-white p-4 rounded-lg border">
                <h3 className="text-lg font-semibold text-slate-800">Información de la Empresa y Firmante</h3>
                <p className="mt-1 text-sm text-slate-600">
                    Estos datos se usarán para generar documentos como facturas y ofertas comerciales.
                </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                 <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Nombre de la Empresa</label>
                    <ManagedNumberInput type="text" value={companyData?.name ?? ''} onCommit={(value) => handleCommit('name', value)} className="w-full px-2 py-1 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-cyan-500 text-slate-900"/>
                </div>
                 <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Teléfono</label>
                    <ManagedNumberInput type="text" value={companyData?.phone ?? ''} onCommit={(value) => handleCommit('phone', value)} className="w-full px-2 py-1 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-cyan-500 text-slate-900"/>
                </div>
                <div className="md:col-span-2">
                    <label className="block text-xs font-medium text-slate-600 mb-1">Dirección de la Empresa</label>
                    <ManagedNumberInput type="text" value={companyData?.address ?? ''} onCommit={(value) => handleCommit('address', value)} className="w-full px-2 py-1 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-cyan-500 text-slate-900"/>
                </div>
                 <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Nombre del Firmante (por defecto)</label>
                    <ManagedNumberInput type="text" value={companyData?.signerName ?? ''} onCommit={(value) => handleCommit('signerName', value)} className="w-full px-2 py-1 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-cyan-500 text-slate-900"/>
                </div>
                 <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Cargo del Firmante (por defecto)</label>
                    <ManagedNumberInput type="text" value={companyData?.signerTitle ?? ''} onCommit={(value) => handleCommit('signerTitle', value)} className="w-full px-2 py-1 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-cyan-500 text-slate-900"/>
                </div>
            </div>
        </div>
    );
};

const DataLibraryCustomActivities = ({ data, onUpdate, onDelete }: { 
    data: CustomMaterialActivity[], 
    onUpdate: (data: CustomMaterialActivity[]) => void,
    onDelete: (id: string) => void
}) => {
    const [isModalOpen, setIsModalOpen] = React.useState(false);
    const [editingActivity, setEditingActivity] = React.useState<CustomMaterialActivity | null>(null);
    const [activityIdToDelete, setActivityIdToDelete] = React.useState<string | null>(null);

    const handleOpenModal = (activity: CustomMaterialActivity | null) => {
        setEditingActivity(activity);
        setIsModalOpen(true);
    };

    const handleSave = (activity: CustomMaterialActivity) => {
        let updatedData;
        if (editingActivity) {
            updatedData = data.map(a => a.id === activity.id ? activity : a);
        } else {
            updatedData = [...data, activity];
        }
        onUpdate(updatedData);
        setIsModalOpen(false);
        setEditingActivity(null);
    };

    const handleToggleEnabled = (e: React.MouseEvent, id: string) => {
        e.preventDefault();
        e.stopPropagation();
        onUpdate(data.map(a => a.id === id ? { ...a, enabled: !(a.enabled ?? true) } : a));
    };

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <div>
                     <h3 className="text-lg font-semibold text-slate-800">Plantillas de Actividades Personalizadas</h3>
                    <p className="mt-1 text-sm text-slate-600">
                        Cree sus propias plantillas para actividades de cálculo de materiales. Puede definir la unidad de medida (m, m², m³, unidad) y los materiales consumidos por cada unidad.
                    </p>
                </div>
                <button onClick={() => handleOpenModal(null)} className="flex items-center gap-2 px-4 py-2 bg-cyan-600 text-white rounded-md hover:bg-cyan-700 transition-colors shadow">
                    <PlusIcon className="h-5 w-5" />
                    Crear Nueva
                </button>
            </div>

            <div className="space-y-3 max-h-[55vh] overflow-y-auto pr-2">
                {(data || []).length === 0 ? (
                    <p className="text-center text-slate-500 py-8">No hay actividades personalizadas.</p>
                ) : (
                    data.map(activity => (
                        <details key={activity.id} className="p-4 border rounded-lg bg-white">
                            <summary className="font-semibold cursor-pointer text-slate-800 flex justify-between items-center">
                                <span className={activity.enabled === false ? 'text-slate-400 line-through' : ''}>
                                    {activity.name}
                                </span>
                                <div className="flex items-center gap-2">
                                    <div
                                        onClick={(e) => handleToggleEnabled(e, activity.id)}
                                        className={`w-12 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors ${activity.enabled !== false ? 'bg-cyan-600' : 'bg-slate-300'}`}
                                        title={activity.enabled !== false ? 'Desactivar de la lista de cálculos' : 'Activar en la lista de cálculos'}
                                        aria-label="Activar o desactivar actividad"
                                    >
                                        <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${activity.enabled !== false ? 'translate-x-6' : ''}`} />
                                    </div>
                                    <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleOpenModal(activity); }} className="p-2 text-slate-500 hover:text-cyan-600" title="Editar plantilla">
                                        <PencilIcon className="h-5 w-5"/>
                                    </button>
                                    <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); setActivityIdToDelete(activity.id); }} className="p-2 text-slate-500 hover:text-red-600" title="Eliminar plantilla">
                                        <TrashIcon className="h-5 w-5"/>
                                    </button>
                                </div>
                            </summary>
                            <ul className="mt-3 text-sm list-disc list-inside bg-slate-50 p-3 rounded">
                                {activity.materials.map((mat, i) => (
                                    <li key={i}><strong>{mat.materialName}:</strong> {mat.ratio} {mat.unit} / {activity.unitOfMeasure}</li>
                                ))}
                            </ul>
                        </details>
                    ))
                )}
            </div>
            
            {isModalOpen && (
                <CustomActivityModal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    onSave={handleSave}
                    initialData={editingActivity}
                />
            )}

            {activityIdToDelete && (
                <Modal 
                    isOpen={!!activityIdToDelete} 
                    onClose={() => setActivityIdToDelete(null)} 
                    title="Confirmar Eliminación de Plantilla"
                >
                    <p className="text-slate-600">¿Estás seguro de que deseas eliminar la plantilla de actividad <span className="font-semibold">"{data.find(a => a.id === activityIdToDelete)?.name}"</span>?</p>
                    <p className="mt-2 text-sm text-slate-500">Esta acción es permanente y no se puede deshacer. No afectará a las actividades que ya hayas creado con esta plantilla dentro de tus proyectos.</p>
                    <div className="flex justify-end gap-4 mt-6 pt-4 border-t">
                        <button type="button" onClick={() => setActivityIdToDelete(null)} className="px-4 py-2 bg-slate-200 text-slate-700 rounded-md hover:bg-slate-300">Cancelar</button>
                        <button 
                            onClick={() => {
                                onDelete(activityIdToDelete);
                                setActivityIdToDelete(null);
                            }} 
                            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 shadow"
                        >
                            Eliminar Permanentemente
                        </button>
                    </div>
                </Modal>
            )}
        </div>
    );
};

const CustomActivityModal = ({ isOpen, onClose, onSave, initialData }: {
    isOpen: boolean;
    onClose: () => void;
    onSave: (activity: CustomMaterialActivity) => void;
    initialData: CustomMaterialActivity | null;
}) => {
    const [name, setName] = React.useState(initialData?.name || '');
    const [unitOfMeasure, setUnitOfMeasure] = React.useState<CustomActivityUnit>(initialData?.unitOfMeasure || 'm²');
    const [materials, setMaterials] = React.useState<CustomMaterial[]>(initialData?.materials || [{ materialName: '', unit: '', ratio: 0 }]);

    const handleMaterialChange = (index: number, field: keyof CustomMaterial, value: string) => {
        const newMaterials = [...materials];
        const numValue = field === 'ratio' ? parseFloat(value) || 0 : value;
        (newMaterials[index] as any)[field] = numValue;
        setMaterials(newMaterials);
    };

    const addMaterialRow = () => {
        setMaterials([...materials, { materialName: '', unit: '', ratio: 0 }]);
    };
    
    const removeMaterialRow = (index: number) => {
        setMaterials(materials.filter((_, i) => i !== index));
    };

    const handleSubmit = () => {
        if (!name.trim() || materials.some(m => !m.materialName.trim() || !m.unit.trim() || m.ratio <= 0)) {
            alert("Por favor, complete el nombre de la actividad y todos los campos de los materiales con valores válidos.");
            return;
        }
        onSave({
            id: initialData?.id || Date.now().toString(),
            name,
            unitOfMeasure,
            materials,
            enabled: initialData?.enabled ?? true,
        });
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={initialData ? "Editar Actividad Personalizada" : "Crear Actividad Personalizada"}>
            <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <Input label="Nombre de la Actividad" value={name} onChange={e => setName(e.target.value)} placeholder="Ej: Muro de Bloques de 15cm" />
                     <Select label="Unidad de Medida" value={unitOfMeasure} onChange={e => setUnitOfMeasure(e.target.value as CustomActivityUnit)}>
                        <option value="m">m (Longitud)</option>
                        <option value="m²">m² (Área)</option>
                        <option value="m³">m³ (Volumen)</option>
                        <option value="unidad">Unidad (Cantidad)</option>
                    </Select>
                </div>

                <h4 className="text-md font-semibold text-slate-700 pt-4 border-t">Materiales y Ratios de Consumo (por {unitOfMeasure})</h4>
                <div className="space-y-3 max-h-60 overflow-y-auto p-1">
                    {materials.map((mat, index) => (
                        <div key={index} className="grid grid-cols-8 gap-2 items-end p-2 bg-slate-50 rounded">
                            <div className="col-span-3"><Input label="Nombre Material" hideLabel value={mat.materialName} onChange={e => handleMaterialChange(index, 'materialName', e.target.value)} placeholder="Cemento" /></div>
                            <div className="col-span-2"><Input label="Unidad" hideLabel value={mat.unit} onChange={e => handleMaterialChange(index, 'unit', e.target.value)} placeholder="sacos" /></div>
                            <div className="col-span-2"><Input label="Ratio" hideLabel type="number" step="0.001" value={mat.ratio} onChange={e => handleMaterialChange(index, 'ratio', e.target.value)} placeholder="0.00" /></div>
                            <div className="col-span-1">
                                <button onClick={() => removeMaterialRow(index)} className="w-full p-2 bg-red-100 text-red-600 rounded-md hover:bg-red-200"><TrashIcon className="h-4 w-4 mx-auto" /></button>
                            </div>
                        </div>
                    ))}
                </div>
                <button onClick={addMaterialRow} className="text-sm flex items-center gap-2 px-3 py-1.5 bg-slate-200 rounded-md hover:bg-slate-300">
                    <PlusIcon className="h-4 w-4" /> Añadir Material
                </button>
            </div>
             <div className="flex justify-end gap-4 mt-6 pt-4 border-t">
                <button type="button" onClick={onClose} className="px-4 py-2 bg-slate-200 text-slate-700 rounded-md hover:bg-slate-300">Cancelar</button>
                <button onClick={handleSubmit} className="px-4 py-2 bg-cyan-600 text-white rounded-md hover:bg-cyan-700 shadow">Guardar</button>
            </div>
        </Modal>
    );
};

const DataLibraryCommercialUnits = ({ rules, enabled, onRulesUpdate, onEnabledUpdate }: {
    rules: CommercialUnitRule[],
    enabled: boolean,
    onRulesUpdate: (data: CommercialUnitRule[]) => void,
    onEnabledUpdate: (enabled: boolean) => void,
}) => {
    const [ruleIdToDelete, setRuleIdToDelete] = React.useState<string | null>(null);
    
    const handleUpdate = (index: number, field: keyof CommercialUnitRule, value: any) => {
        const newRules = [...rules];
        const rule = { ...newRules[index] };
        
        if (field === 'options') {
            // FIX: Ensure value is a string before calling .split()
            if (typeof value === 'string') {
                (rule as any)[field] = value.split(',').map((s: string) => parseFloat(s.trim())).filter(Number.isFinite);
                // When options change for 'multiple-options', reset selectedOption if it's no longer valid
                if (rule.rule === 'multiple-options' && !rule.options?.includes(rule.selectedOption!)) {
                    rule.selectedOption = undefined;
                }
            }
        } else {
             (rule as any)[field] = value;
        }

        newRules[index] = rule;
        onRulesUpdate(newRules);
    };
    
    const handleAddNew = () => {
        const newRule: CommercialUnitRule = {
            id: Date.now().toString(),
            materialName: '',
            baseUnit: '',
            rule: 'ceil'
        };
        onRulesUpdate([...rules, newRule]);
    };

    const handleDelete = (id: string) => {
        setRuleIdToDelete(id);
    };

    const confirmDelete = () => {
        if (ruleIdToDelete) {
            onRulesUpdate(rules.filter(rule => rule.id !== ruleIdToDelete));
            setRuleIdToDelete(null);
        }
    };
    
    return (
        <div className="space-y-4">
            <div className="flex flex-wrap justify-between items-center gap-4">
                 <div>
                    <h3 className="text-lg font-semibold text-slate-800">Reglas de Unidades Comerciales</h3>
                    <p className="mt-1 text-sm text-slate-600">
                        Defina cómo se compran los materiales para que los cálculos se ajusten a la realidad.
                    </p>
                </div>
                <div className="flex items-center gap-3 bg-slate-100 p-2 rounded-lg">
                    <span className={`text-sm font-medium ${enabled ? 'text-slate-700' : 'text-slate-500'}`}>
                        {enabled ? 'Reglas activadas' : 'Reglas desactivadas'}
                    </span>
                    <div
                        onClick={() => onEnabledUpdate(!enabled)}
                        className={`w-14 h-7 flex items-center rounded-full p-1 cursor-pointer transition-colors ${enabled ? 'bg-cyan-600' : 'bg-slate-300'}`}
                        role="switch"
                        aria-checked={enabled}
                    >
                        <div className={`bg-white w-5 h-5 rounded-full shadow-md transform transition-transform ${enabled ? 'translate-x-7' : ''}`} />
                    </div>
                </div>
            </div>

             <div className="max-h-[55vh] overflow-y-auto border rounded-lg">
                <table className="w-full text-sm">
                    <thead className="text-xs text-slate-600 uppercase bg-slate-100 sticky top-0 z-10">
                        <tr>
                            <th className="p-2">Material (Filtro)</th>
                            <th className="p-2">Unidad Base</th>
                            <th className="p-2">Regla</th>
                            <th className="p-2">Opciones de Regla</th>
                            <th className="p-2">Formato Salida (Opcional)</th>
                            <th className="p-2">Acción</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y">
                        {(rules || []).map((rule, index) => (
                            <tr key={rule.id}>
                                <td className="p-2">
                                    <ManagedNumberInput hideLabel type="text" value={rule.materialName} onCommit={value => handleUpdate(index, 'materialName', value)} className="w-full px-2 py-1 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-cyan-500 text-slate-900"/>
                                </td>
                                <td className="p-2">
                                    <ManagedNumberInput hideLabel type="text" value={rule.baseUnit} onCommit={value => handleUpdate(index, 'baseUnit', value)} className="w-full px-2 py-1 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-cyan-500 text-slate-900"/>
                                </td>
                                <td className="p-2">
                                    <Select value={rule.rule} onChange={e => handleUpdate(index, 'rule', e.target.value as CommercialUnitRule['rule'])}>
                                        <option value="ceil">Redondear hacia arriba</option>
                                        <option value="best-fit-combination">Mejor Combinación</option>
                                        <option value="multiple-increment">Múltiplo (Incremento Fijo)</option>
                                        <option value="multiple-options">Múltiplo (Opciones Fijas)</option>
                                    </Select>
                                </td>
                                <td className="p-2">
                                    {rule.rule === 'multiple-increment' && <ManagedNumberInput hideLabel type="number" placeholder="Incremento" value={rule.increment || ''} onCommit={value => handleUpdate(index, 'increment', parseFloat(value))} className="w-full px-2 py-1 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-cyan-500 text-slate-900"/>}
                                    {(rule.rule === 'multiple-options' || rule.rule === 'best-fit-combination') && (
                                        <div className="flex gap-1">
                                            <Input
                                                hideLabel
                                                key={rule.id}
                                                placeholder="Tamaños (ej: 20,5,1)"
                                                defaultValue={rule.options?.join(',') || ''}
                                                onBlur={e => handleUpdate(index, 'options', e.target.value)}
                                            />
                                            {rule.rule === 'multiple-options' && (
                                                <Select value={rule.selectedOption || ''} onChange={e => handleUpdate(index, 'selectedOption', parseFloat(e.target.value))}>
                                                    <option value="">Elegir</option>
                                                    {(rule.options || []).map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                                </Select>
                                            )}
                                        </div>
                                    )}
                                </td>
                                <td className="p-2">
                                    <ManagedNumberInput hideLabel type="text" placeholder="tanqueta de {option} L" value={rule.outputUnitFormat || ''} onCommit={value => handleUpdate(index, 'outputUnitFormat', value)} className="w-full px-2 py-1 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-cyan-500 text-slate-900"/>
                                </td>
                                <td className="p-2 text-center"><button onClick={() => handleDelete(rule.id)} className="p-1 text-slate-400 hover:text-red-600"><TrashIcon className="h-5 w-5"/></button></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <button onClick={handleAddNew} className="text-sm flex items-center gap-2 px-3 py-1.5 bg-slate-200 rounded-md hover:bg-slate-300">
                <PlusIcon className="h-4 w-4" /> Añadir Nueva Regla
            </button>
             {ruleIdToDelete && (
                <Modal 
                    isOpen={!!ruleIdToDelete} 
                    onClose={() => setRuleIdToDelete(null)} 
                    title="Confirmar Eliminación de Regla"
                >
                    <p className="text-slate-600">¿Está seguro de que desea eliminar esta regla comercial? Esta acción es permanente.</p>
                    <div className="flex justify-end gap-4 mt-6 pt-4 border-t">
                        <button type="button" onClick={() => setRuleIdToDelete(null)} className="px-4 py-2 bg-slate-200 text-slate-700 rounded-md hover:bg-slate-300">Cancelar</button>
                        <button onClick={confirmDelete} className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 shadow">
                            Eliminar
                        </button>
                    </div>
                </Modal>
            )}
        </div>
    );
};

interface DataLibraryProps {
    isOpen: boolean;
    onClose: () => void;
    selectedProject: Project | null;
    onSaveChanges: (updatedLibrary: Record<string, any>, originalLibrary: Record<string, any>, action: 'global' | 'global_and_recalculate' | 'project_only_update') => void;
    initialTab: 'labor' | 'formulas' | 'prices' | 'expenses' | 'company' | 'custom_activities' | 'commercial_units';
    isPro: boolean;
    onUpgrade: () => void;
}

const DataLibrary = ({ isOpen, onClose, selectedProject, onSaveChanges, initialTab, isPro, onUpgrade }: DataLibraryProps) => {
    const [originalData, setOriginalData] = React.useState<Record<string, any> | null>(null);
    const [currentData, setCurrentData] = React.useState<Record<string, any> | null>(null);
    const [activeTab, setActiveTab] = React.useState(initialTab);
    const [materialsWithPrices, setMaterialsWithPrices] = React.useState<(Material & { price: number })[] | null>(null);
    const [isLoading, setIsLoading] = React.useState(true);
    const [materialToDelete, setMaterialToDelete] = React.useState<{ name: string; unit: string } | null>(null);
    
    const loadData = React.useCallback(async () => {
        setIsLoading(true);
        const library = await getDataLibrary();
        
        if (!originalData) {
            setOriginalData(JSON.parse(JSON.stringify(library)));
        }
        setCurrentData(library);

        const prices: { name: string, unit: string, price: number }[] = await getMaterialPrices();
        const priceMap = new Map(prices.map((p) => [`${p.name}|${p.unit}`, p.price]));
        const allMaterials = new Map<string, { name: string, unit: string }>();
        const addMat = (name: string, unit: string) => {
            if (name && unit) allMaterials.set(`${name}|${unit}`, { name, unit });
        };

        // --- Start: Material Aggregation Logic ---
        addMat('Cemento', 'sacos');
        addMat('Arena', 'm³');
        addMat('Piedra', 'm³');
        addMat('Agua', 'litros');

        (library.acero_barras || []).forEach((b: AceroData) => {
            const name = `Acero #${b.barra} (${b.pulgadas})`;
            addMat(name, 'kg');
            addMat(`${name} (longitud)`, 'm');
        });
        addMat('Alambre', 'kg');

        addMat('Madera para encofrado', 'm²');
        addMat('Puntales de madera', 'unidades');
        addMat('Vigas de soporte (encofrado)', 'm');
        addMat('Clavos para encofrado', 'kg');
        
        (library.morteros_muros || []).forEach((m: MorterosMurosData) => {
            addMat(m.nombre, 'unidades');
            addMat('Polvo de Piedra', 'm³');
        });
        
        (library.morteros_piso || []).forEach((p: MorterosPisoData) => {
            if (p.unidades > 0) addMat(p.nombre, 'unidades');
        });
        
        addMat('Pintura Vinílica (Lisa)', 'litros');
        addMat('Pintura Vinílica (Rústica)', 'litros');
        addMat('Aparejo de Aceite', 'litros');
        addMat('Pintura de Aceite', 'litros');
        addMat('Lechada de Cal', 'litros');
        addMat('Lechada de Masilla', 'litros');
        
        addMat('Losa 30x30cm', 'm²');
        addMat('Losa 40x40cm', 'm²');
        addMat('Losa 60x60cm', 'm²');
        addMat('Losa personalizado', 'm²');
        addMat('Cemento Cola', 'kg');
        addMat('Cemento Blanco', 'kg');

        const pladurData = {...library.pladur_pared, ...library.pladur_techo};
        if(pladurData) {
            addMat('Placa de Pladur (PYL)', 'm²');
            addMat('Perfil Montante', 'm');
            addMat('Perfil Canal', 'm');
            addMat('Tornillos para Placa (TTPC)', 'unidades');
            addMat('Tornillos de Fijación', 'unidades');
            addMat('Cinta para Juntas', 'm');
            addMat('Pasta para Juntas', 'kg');
            addMat('Perfil Secundario (T-47/T-60)', 'm');
            addMat('Perfil Primario (Maestra)', 'm');
            addMat('Cuelgues / Varillas', 'unidades');
            addMat('Tornillos para Perfil', 'unidades');
            addMat('Fijaciones para Cuelgues', 'unidades');
            addMat('Lana de Roca / Aislante', 'm²');
        }
        
        (library.custom_material_activities || []).forEach((act: CustomMaterialActivity) => {
            (act.materials || []).forEach((mat: CustomMaterial) => {
                addMat(mat.materialName, mat.unit);
            });
        });

        const commercialRules: CommercialUnitRule[] = library.commercial_unit_rules || [];
        const baseMaterialsArray = Array.from(allMaterials.values());

        commercialRules.forEach((rule) => {
            const matchingBaseMaterials = baseMaterialsArray.filter(material =>
                material.name.toLowerCase().includes(rule.materialName.toLowerCase()) &&
                material.unit === rule.baseUnit
            );

            matchingBaseMaterials.forEach(baseMaterial => {
                if ((rule.rule === 'multiple-options' || rule.rule === 'best-fit-combination') && rule.options && rule.outputUnitFormat) {
                    rule.options.forEach(option => {
                        const newName = baseMaterial.name.replace(/\(longitud\)/i, '').trim();
                        const newUnit = rule.outputUnitFormat!.replace('{option}', String(option));
                        addMat(newName, newUnit);
                    });
                } else if (rule.rule === 'multiple-increment' && rule.increment && rule.outputUnitFormat) {
                    const newName = baseMaterial.name;
                    const newUnit = rule.outputUnitFormat!.replace('{increment}', String(rule.increment));
                    addMat(newName, newUnit);
                }
            });
        });

        prices.forEach(p => addMat(p.name, p.unit));

        const fullMaterialData = Array.from(allMaterials.values())
            .map(m => ({
                ...m,
                quantity: 0, 
                price: priceMap.get(`${m.name}|${m.unit}`) || 0
            }))
            .sort((a, b) => {
                const nameComparison = a.name.localeCompare(b.name);
                if (nameComparison !== 0) return nameComparison;
                return a.unit.localeCompare(b.unit);
            });

        setMaterialsWithPrices(fullMaterialData);
        setIsLoading(false);
    }, [originalData]);

    React.useEffect(() => {
        if (isOpen) {
            setActiveTab(initialTab);
            setOriginalData(null);
        }
    }, [isOpen, initialTab]);
    
    React.useEffect(() => {
        if (isOpen) {
            loadData();
        }
    }, [isOpen, loadData]);

    const handleUpdate = (key: string, data: any) => {
        setCurrentData(prev => prev ? ({ ...prev, [key]: data }) : null);
    };

    const handlePriceChange = async (name: string, unit: string, newPriceStr: string) => {
        const newPrice = parseFloat(newPriceStr) || 0;
        
        await setMaterialPrice({ name, unit, price: newPrice });
        loadData();
    };
    
    const handleMaterialAdd = async (name: string, unit: string) => {
        await setMaterialPrice({ name, unit, price: 0 });
        loadData();
    };
    
    const handleDeleteMaterialPrice = (name: string, unit: string) => {
        setMaterialToDelete({ name, unit });
    };

    const confirmDeleteMaterialPrice = async () => {
        if (materialToDelete) {
            await deleteMaterialPrice(materialToDelete.name, materialToDelete.unit);
            await loadData(); // Reload data to reflect deletion
            setMaterialToDelete(null);
        }
    };

    const handleDeleteCustomActivity = (id: string) => {
        setCurrentData(prev => {
            if (!prev || !prev.custom_material_activities) return prev;
            return {
                ...prev,
                custom_material_activities: prev.custom_material_activities.filter((act: CustomMaterialActivity) => act.id !== id)
            };
        });
    };

    const handleSave = (action: 'global' | 'global_and_recalculate' | 'project_only_update') => {
        if (currentData && originalData) {
            onSaveChanges(currentData, originalData, action);
        }
    };

    const tabs = [
        { key: 'labor', label: 'Mano de Obra', pro: false },
        { key: 'prices', label: 'Precios de Materiales', pro: true },
        { key: 'custom_activities', label: 'Act. Personalizadas', pro: true },
        { key: 'commercial_units', label: 'Unidades Comerciales', pro: true },
        { key: 'formulas', label: 'Fórmulas y Ratios', pro: true },
        { key: 'expenses', label: 'Gastos Indirectos', pro: true },
        { key: 'company', label: 'Info. Empresa', pro: true },
    ];

    const handleTabChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const selectedKey = e.target.value;
        const selectedTab = tabs.find(t => t.key === selectedKey);
        
        if (selectedTab && selectedTab.pro && !isPro) {
            // Still switch the tab to show the upgrade message
            setActiveTab(selectedKey as any);
        } else {
            setActiveTab(selectedKey as any);
        }
    };

    const renderContent = () => {
        if (isLoading || !currentData || materialsWithPrices === null) return <p>Cargando biblioteca...</p>;

        const selectedTab = tabs.find(t => t.key === activeTab);
        if (selectedTab && selectedTab.pro && !isPro) {
            return <UpgradeToPro onUpgrade={onUpgrade} featureName={selectedTab.label} />;
        }

        switch (activeTab) {
            case 'labor':
                return (
                    <DataLibraryLabor 
                        data={currentData.labor_activities} 
                        multiplier={currentData.labor_multiplier_factor ?? 1.0}
                        onUpdate={(data) => handleUpdate('labor_activities', data)}
                        onUpdateMultiplier={(factor) => handleUpdate('labor_multiplier_factor', factor)}
                        isPro={isPro} 
                        onUpgrade={onUpgrade} 
                    />
                );
            case 'prices':
                return <DataLibraryMaterials materialsWithPrices={materialsWithPrices} onPriceChange={handlePriceChange} onMaterialAdd={handleMaterialAdd} onDelete={handleDeleteMaterialPrice} />;
            case 'custom_activities':
                return <DataLibraryCustomActivities data={currentData.custom_material_activities} onUpdate={(data) => handleUpdate('custom_material_activities', data)} onDelete={handleDeleteCustomActivity} />;
            case 'commercial_units':
                 return <DataLibraryCommercialUnits 
                    rules={currentData.commercial_unit_rules}
                    enabled={currentData.commercial_rules_enabled}
                    onRulesUpdate={(data) => handleUpdate('commercial_unit_rules', data)} 
                    onEnabledUpdate={(data) => handleUpdate('commercial_rules_enabled', data)} 
                 />;
            case 'formulas':
                return <DataLibraryFormulas data={currentData} onUpdate={handleUpdate} />;
            case 'expenses':
                return <DataLibraryExpenses data={currentData.indirect_expenses_defaults} onUpdate={(data) => handleUpdate('indirect_expenses_defaults', data)} />;
            case 'company':
                return <DataLibraryCompany companyData={currentData.company_info} licenseData={currentData.license} onUpdate={(data) => handleUpdate('company_info', data)} />;
            default:
                return null;
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Biblioteca de Datos">
            <div className="flex flex-col h-[80vh]">
                <div className="flex-shrink-0 border-b border-slate-200 pb-4">
                     <label htmlFor="library-section-selector" className="block text-sm font-medium text-slate-700 mb-1">
                        Sección de la Biblioteca
                    </label>
                    <select
                        id="library-section-selector"
                        value={activeTab}
                        onChange={handleTabChange}
                        className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 transition bg-white"
                    >
                        {tabs.map(tab => (
                            <option key={tab.key} value={tab.key} className={tab.pro && !isPro ? 'text-slate-500' : ''}>
                                {tab.label} {tab.pro && !isPro && ' (Pro)'}
                            </option>
                        ))}
                    </select>
                </div>
                <div className="flex-grow overflow-y-auto pt-4">
                    {renderContent()}
                </div>
                <div className="flex-shrink-0 flex flex-wrap justify-end items-center gap-4 mt-6 pt-4 border-t">
                    {selectedProject && ['labor'].includes(activeTab) && (
                        <button onClick={() => handleSave('project_only_update')} className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 shadow disabled:bg-purple-300 disabled:cursor-not-allowed" disabled={!isPro}>
                            Actualizar Solo Precios en "{selectedProject.name}"
                        </button>
                    )}
                    <button onClick={() => handleSave('global')} className="px-4 py-2 bg-slate-600 text-white rounded-md hover:bg-slate-700 shadow disabled:bg-slate-400 disabled:cursor-not-allowed" disabled={!isPro}>
                        Guardar Cambios Globales
                    </button>
                    {selectedProject && ['labor', 'formulas'].includes(activeTab) && (
                        <button onClick={() => handleSave('global_and_recalculate')} className="px-4 py-2 bg-cyan-600 text-white rounded-md hover:bg-cyan-700 shadow disabled:bg-cyan-400 disabled:cursor-not-allowed" disabled={!isPro}>
                            Guardar y Recalcular Proyecto Actual
                        </button>
                    )}
                </div>
            </div>

            {materialToDelete && (
                <Modal 
                    isOpen={!!materialToDelete} 
                    onClose={() => setMaterialToDelete(null)} 
                    title="Confirmar Eliminación"
                >
                    <p className="text-slate-600">
                        ¿Está seguro de que desea eliminar el precio para 
                        <span className="font-semibold"> "{materialToDelete.name}"</span> ({materialToDelete.unit})?
                    </p>
                    <p className="mt-2 text-sm text-slate-500">
                        Esta acción es permanente. Si es un material de fórmula, seguirá apareciendo en la lista pero sin precio. Si es un material personalizado, se eliminará de la lista hasta que lo vuelva a añadir.
                    </p>
                    <div className="flex justify-end gap-4 mt-6 pt-4 border-t">
                        <button type="button" onClick={() => setMaterialToDelete(null)} className="px-4 py-2 bg-slate-200 text-slate-700 rounded-md hover:bg-slate-300">Cancelar</button>
                        <button 
                            onClick={confirmDeleteMaterialPrice}
                            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 shadow"
                        >
                            Sí, Eliminar
                        </button>
                    </div>
                </Modal>
            )}
        </Modal>
    );
};

export default DataLibrary;