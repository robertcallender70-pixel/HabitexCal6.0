
import React from 'react';
import Modal from './Modal';
import type { Project, OfferData, LaborItem, Material, BudgetItem } from '../types';
import { exportOfferFixedPriceToPDF, exportOfferDetailedToPDF } from '../services/pdf';

const Input = (props: React.InputHTMLAttributes<HTMLInputElement> & { label: string }) => (
    <div>
        <label className="block text-sm font-medium text-slate-600 mb-1">{props.label}</label>
        <input {...props} className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition" />
    </div>
);

interface OfferModalProps {
    isOpen: boolean;
    onClose: () => void;
    project: Project | null;
    totals: {
        material: number;
        labor: number;
        budget: number;
        serviceTax: number;
        grandTotal: number;
    };
    exchangeRate: number;
    laborItems: LaborItem[];
    materials: Material[];
    budgetItems: BudgetItem[];
    companyInfo: { 
        name: string; 
        address: string; 
        phone: string;
        signerName?: string;
        signerTitle?: string;
    } | null;
}

const OfferModal: React.FC<OfferModalProps> = ({ isOpen, onClose, project, totals, exchangeRate, laborItems, materials, budgetItems, companyInfo }) => {
    const [offerType, setOfferType] = React.useState<'fixed' | 'detailed'>('fixed');
    const [offerInfo, setOfferInfo] = React.useState({
        offerNumber: '',
        clientName: '',
        clientAddress: '',
        date: new Date().toISOString().slice(0, 10),
        validityDays: 30,
    });
    const [signerName, setSignerName] = React.useState('');
    const [signerTitle, setSignerTitle] = React.useState('');

    React.useEffect(() => {
        if (isOpen) {
            setOfferType('fixed');
            setOfferInfo({
                offerNumber: '',
                clientName: project?.clientName || '',
                clientAddress: project?.clientAddress || '',
                date: new Date().toISOString().slice(0, 10),
                validityDays: 30,
            });
            setSignerName(companyInfo?.signerName || 'Jose Javier Moreno');
            setSignerTitle(companyInfo?.signerTitle || 'Director General');
        }
    }, [isOpen, project, companyInfo]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value, type } = e.target;
        setOfferInfo(prev => ({ 
            ...prev, 
            [name]: type === 'number' ? parseInt(value, 10) || 0 : value 
        }));
    };

    const handleSignerNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSignerName(e.target.value);
    };

    const handleSignerTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSignerTitle(e.target.value);
    };

    const handleGenerateOffer = () => {
        if (!project || !offerInfo.clientName.trim() || !offerInfo.offerNumber.trim()) {
            alert("Por favor, complete el número de oferta y el nombre del cliente.");
            return;
        }
         if (!companyInfo) {
            alert("No se pudo cargar la información de la empresa. Por favor, configúrela en la Biblioteca de Datos.");
            return;
        }

        const data: OfferData = {
            project,
            companyInfo,
            offerInfo: {
                ...offerInfo,
                signerName,
                signerTitle,
            },
            totals,
            exchangeRate,
            laborItems,
            materials,
            budgetItems,
        };

        if (offerType === 'fixed') {
            exportOfferFixedPriceToPDF(data);
        } else {
            exportOfferDetailedToPDF(data);
        }
        onClose();
    };

    const formatCurrency = (value: number, currency: 'USD' | 'MN') => {
        const finalValue = currency === 'MN' ? value * exchangeRate : value;
        return `$${finalValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Generar Oferta para ${project?.name}`}>
            <div className="space-y-6">
                <div>
                    <h3 className="text-lg font-semibold text-slate-700 mb-2">1. Elija el Tipo de Oferta</h3>
                    <fieldset className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <label htmlFor="offer-type-fixed" className={`relative flex cursor-pointer rounded-lg border bg-white p-4 shadow-sm focus:outline-none ${offerType === 'fixed' ? 'border-cyan-500 ring-2 ring-cyan-500' : 'border-gray-300'}`}>
                            <input type="radio" name="offer-type" id="offer-type-fixed" value="fixed" className="sr-only" checked={offerType === 'fixed'} onChange={() => setOfferType('fixed')} />
                            <span className="flex flex-1">
                                <span className="flex flex-col">
                                    <span className="block text-sm font-medium text-slate-900">Oferta a Precio Fijo</span>
                                    <span className="mt-1 flex items-center text-xs text-slate-500">Ideal para proyectos con alcance claro. Muestra solo el total.</span>
                                </span>
                            </span>
                        </label>
                        <label htmlFor="offer-type-detailed" className={`relative flex cursor-pointer rounded-lg border bg-white p-4 shadow-sm focus:outline-none ${offerType === 'detailed' ? 'border-cyan-500 ring-2 ring-cyan-500' : 'border-gray-300'}`}>
                            <input type="radio" name="offer-type" id="offer-type-detailed" value="detailed" className="sr-only" checked={offerType === 'detailed'} onChange={() => setOfferType('detailed')} />
                             <span className="flex flex-1">
                                <span className="flex flex-col">
                                    <span className="block text-sm font-medium text-slate-900">Oferta Detallada</span>
                                    <span className="mt-1 flex items-center text-xs text-slate-500">Transparente. Desglosa costos de materiales, mano de obra, etc.</span>
                                </span>
                            </span>
                        </label>
                    </fieldset>
                </div>

                <div>
                    <h3 className="text-lg font-semibold text-slate-700 border-b pb-2 mb-4">2. Detalles de la Oferta y Cliente</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input label="Número de Oferta" name="offerNumber" value={offerInfo.offerNumber} onChange={handleChange} required />
                        <Input label="Fecha" name="date" type="date" value={offerInfo.date} onChange={handleChange} required />
                        <Input label="Nombre del Cliente" name="clientName" value={offerInfo.clientName} onChange={handleChange} required />
                        <Input label="Dirección del Cliente" name="clientAddress" value={offerInfo.clientAddress} onChange={handleChange} />
                        <Input label="Validez de la Oferta (días)" name="validityDays" type="number" value={offerInfo.validityDays} onChange={handleChange} required />
                    </div>
                </div>

                <div>
                    <h3 className="text-lg font-semibold text-slate-700 border-b pb-2 mb-4">3. Detalles del Firmante</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input label="Nombre del Firmante" name="signerName" value={signerName} onChange={handleSignerNameChange} />
                        <Input label="Cargo del Firmante" name="signerTitle" value={signerTitle} onChange={handleSignerTitleChange} />
                    </div>
                </div>

                <div>
                    <h3 className="text-lg font-semibold text-slate-700 border-b pb-2 mb-4">4. Resumen del Costo Total</h3>
                    <div className="bg-slate-50 p-4 rounded-lg text-base">
                        <div className="flex justify-between font-bold">
                            <span className="text-slate-800">Costo Total del Proyecto (MN):</span>
                            <span className="text-cyan-700">{formatCurrency(totals.grandTotal, 'MN')}</span>
                        </div>
                        <div className="flex justify-between text-sm mt-1">
                            <span className="text-slate-600">Costo Total del Proyecto (USD):</span>
                            <span className="text-slate-600">{formatCurrency(totals.grandTotal, 'USD')}</span>
                        </div>
                    </div>
                </div>

                <div className="flex justify-end gap-4 mt-8 pt-4 border-t">
                    <button type="button" onClick={onClose} className="px-4 py-2 bg-slate-200 text-slate-700 rounded-md hover:bg-slate-300">Cancelar</button>
                    <button onClick={handleGenerateOffer} className="px-4 py-2 bg-cyan-600 text-white rounded-md hover:bg-cyan-700 shadow">
                        Generar Oferta PDF
                    </button>
                </div>
            </div>
        </Modal>
    );
};

export default OfferModal;
