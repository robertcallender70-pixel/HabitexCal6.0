
import React from 'react';
import Modal from './Modal';
import type { Project, Certification, CertificationSnapshot } from '../types';

interface AdvanceInvoiceModalProps {
    isOpen: boolean;
    onClose: () => void;
    project: Project;
    totalBudget: number; // Total planned budget in USD
    currency: 'USD' | 'CUP';
    exchangeRate: number;
    onSave: (cert: Certification, paymentDate?: string) => void;
}

const AdvanceInvoiceModal: React.FC<AdvanceInvoiceModalProps> = ({ isOpen, onClose, project, totalBudget, currency, exchangeRate, onSave }) => {
    const [percentage, setPercentage] = React.useState('50');
    const [name, setName] = React.useState('Anticipo de Obra');
    const [issueDate, setIssueDate] = React.useState(new Date().toISOString().slice(0, 10));
    const [paymentDate, setPaymentDate] = React.useState(new Date().toISOString().slice(0, 10));
    const [isPaid, setIsPaid] = React.useState(true);

    const amountUSD = (totalBudget * (parseFloat(percentage) || 0)) / 100;
    const amountDisplay = currency === 'CUP' ? amountUSD * exchangeRate : amountUSD;
    const budgetDisplay = currency === 'CUP' ? totalBudget * exchangeRate : totalBudget;

    const handleSave = () => {
        const p = parseFloat(percentage);
        if (isNaN(p) || p <= 0 || p > 100) {
            alert("Por favor ingrese un porcentaje válido entre 1 y 100.");
            return;
        }

        const snapshot: CertificationSnapshot = {
            completedLaborItems: [],
            materialTransactions: [],
            transportTransactions: [],
            manualExpenseItems: [],
            completedLaborCost: 0,
            materialExpenseCost: 0,
            transportExpenseCost: 0,
            manualExpenseCost: 0,
            logisticsPercentage: project.logisticsPercentage || 0,
            technicalAssistancePercentage: project.technicalAssistancePercentage || 0,
            profitPercentage: project.profitPercentage || 0,
            logisticsCost: 0,
            technicalAssistanceCost: 0,
            profitCost: 0,
            serviceTaxCost: 0,
            grandTotal: 0, 
            totalAnticipoAtCertification: 0,
            totalBudgetAtCertification: totalBudget,
            anticipoPercentage: p,
            incrementalValue: amountUSD,
            anticipoDeduction: 0, 
            finalBillableAmount: amountUSD,
            cumulativeAnticipoDeducted: 0,
            cumulativeNetBillable: amountUSD,
        };

        const advanceCert: Certification = {
            projectId: project.id!,
            name: name.trim() || 'Anticipo de Obra',
            certifiedAt: new Date(issueDate).toISOString(),
            snapshot,
            isAdvance: true,
            advancePercentage: p
        };

        onSave(advanceCert, isPaid ? paymentDate : undefined);
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Generar Factura de Anticipo">
            <div className="space-y-4">
                <p className="text-sm text-slate-600">
                    Esta factura se calcula como un porcentaje del presupuesto total planificado del proyecto.
                </p>
                
                <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                    <div className="flex justify-between text-sm mb-1">
                        <span className="text-slate-500">Presupuesto Total ({currency}):</span>
                        <span className="font-bold text-slate-800">${budgetDisplay.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Nombre del Concepto</label>
                    <input
                        type="text"
                        value={name}
                        onChange={e => setName(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-cyan-500 outline-none bg-white text-slate-900"
                        placeholder="Ej: Anticipo de Obra"
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Porcentaje de Anticipo (%)</label>
                        <div className="relative">
                            <input
                                type="number"
                                value={percentage}
                                onChange={e => setPercentage(e.target.value)}
                                className="w-full pl-3 pr-10 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-cyan-500 outline-none bg-white text-slate-900"
                                placeholder="50"
                                min="1"
                                max="100"
                            />
                            <span className="absolute right-3 top-2 text-slate-400">%</span>
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Fecha de Emisión</label>
                        <input
                            type="date"
                            value={issueDate}
                            onChange={e => setIssueDate(e.target.value)}
                            className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-cyan-500 outline-none bg-white text-slate-900"
                        />
                    </div>
                </div>

                <div className="p-3 bg-amber-50 rounded-md border border-amber-100">
                    <label className="flex items-center gap-2 cursor-pointer mb-2">
                        <input 
                            type="checkbox" 
                            checked={isPaid} 
                            onChange={e => setIsPaid(e.target.checked)}
                            className="h-4 w-4 text-cyan-600 rounded border-gray-300 focus:ring-cyan-500"
                        />
                        <span className="text-sm font-medium text-slate-700">Registrar pago inmediatamente</span>
                    </label>
                    {isPaid && (
                        <div>
                            <label className="block text-xs font-medium text-amber-700 mb-1">Fecha de Pago</label>
                            <input
                                type="date"
                                value={paymentDate}
                                onChange={e => setPaymentDate(e.target.value)}
                                className="w-full px-3 py-2 border border-amber-200 rounded-md focus:ring-2 focus:ring-cyan-500 outline-none bg-white text-slate-900"
                            />
                        </div>
                    )}
                </div>

                <div className="pt-4 border-t">
                    <div className="flex justify-between items-center bg-cyan-50 p-3 rounded-md border border-cyan-100">
                        <span className="font-semibold text-cyan-800">Monto a Facturar ({currency}):</span>
                        <span className="text-xl font-bold text-cyan-900">${amountDisplay.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                    </div>
                </div>

                <div className="flex justify-end gap-3 mt-6">
                    <button onClick={onClose} className="px-4 py-2 bg-slate-200 text-slate-700 rounded-md hover:bg-slate-300">
                        Cancelar
                    </button>
                    <button onClick={handleSave} className="px-4 py-2 bg-amber-600 text-white rounded-md hover:bg-amber-700 shadow-md">
                        Generar Certificación de Anticipo
                    </button>
                </div>
            </div>
        </Modal>
    );
};

export default AdvanceInvoiceModal;
