
import React from 'react';
import Modal from './Modal';
import type { Project, Certification, InvoiceData } from '../types';
import { exportInvoiceToPDF } from '../services/pdf';
import { updateCertification } from '../services/database';

const Input = (props: React.InputHTMLAttributes<HTMLInputElement> & { label: string }) => (
    <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">{props.label}</label>
        <input {...props} className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition" />
    </div>
);

interface InvoiceModalProps {
    isOpen: boolean;
    onClose: () => void;
    project: Project | null;
    certification: Certification | null;
    previousCertification: Certification | null;
    exchangeRate: number;
    companyInfo: { 
        name: string; 
        address: string; 
        phone: string;
        signerName?: string;
        signerTitle?: string;
    } | null;
    onInvoiceGenerated: (updatedCertification: Certification, paymentDate?: string) => void;
}

const InvoiceModal: React.FC<InvoiceModalProps> = ({ isOpen, onClose, project, certification, previousCertification, exchangeRate, companyInfo, onInvoiceGenerated }) => {
    const [invoiceInfo, setInvoiceInfo] = React.useState({
        invoiceNumber: '',
        clientName: '',
        clientAddress: '',
        date: new Date().toISOString().slice(0, 10),
    });
    const [signerName, setSignerName] = React.useState('');
    const [signerTitle, setSignerTitle] = React.useState('');
    const [isPaid, setIsPaid] = React.useState(false);
    const [paymentDate, setPaymentDate] = React.useState(new Date().toISOString().slice(0, 10));

    React.useEffect(() => {
        if (isOpen && project) {
            setInvoiceInfo({
                invoiceNumber: '',
                clientName: project.clientName || '',
                clientAddress: project.clientAddress || '',
                date: new Date().toISOString().slice(0, 10),
            });
            setSignerName(companyInfo?.signerName || 'Jose Javier Moreno');
            setSignerTitle(companyInfo?.signerTitle || 'Director General');
            setIsPaid(!!certification?.paymentTransactionId);
            setPaymentDate(new Date().toISOString().slice(0, 10));
        }
    }, [isOpen, project, companyInfo]);

    // FIX: Completed the truncated logic for generating billable items for the invoice.
    const { billableItems, invoiceTotal } = React.useMemo(() => {
        if (!certification) return { billableItems: [], invoiceTotal: 0 };
        
        const currentSnap = certification.snapshot;
        const total = currentSnap.finalBillableAmount;
        
        const items: Omit<InvoiceData['billableItems'][0], 'total'>[] = [];

        // CASE 1: Advance payment certification
        if (certification.isAdvance) {
            items.push({
                description: `${certification.name} (${certification.advancePercentage}%) - Correspondiente al presupuesto total planificado.`,
                quantity: 1,
                unit: 'Global',
                unitPrice: total,
            });
            return { 
                billableItems: items.map(item => ({...item, total: item.quantity * item.unitPrice})), 
                invoiceTotal: total 
            };
        }

        // CASE 2: Consolidated invoice (parent project)
        if (currentSnap.childIncrements && currentSnap.childIncrements.length > 0) {
            currentSnap.childIncrements.forEach(ci => {
                items.push({
                    description: `Avance en Objeto de Obra: ${ci.projectName}`,
                    quantity: 1,
                    unit: 'Global',
                    unitPrice: ci.finalBillableAmount,
                });
            });
        } else {
            // CASE 3: Standard certification
            if (currentSnap.incrementalValue > 0) {
                items.push({
                    description: `Ejecución de obra según ${certification.name}`,
                    quantity: 1,
                    unit: 'Global',
                    unitPrice: currentSnap.incrementalValue,
                });
            }

            if (currentSnap.anticipoDeduction > 0) {
                items.push({
                    description: `Descuento Amortización de Anticipo (${currentSnap.anticipoPercentage.toFixed(1)}%)`,
                    quantity: 1,
                    unit: 'u',
                    unitPrice: -currentSnap.anticipoDeduction,
                });
            }
        }

        return { 
            billableItems: items.map(item => ({...item, total: item.quantity * item.unitPrice})), 
            invoiceTotal: total 
        };
    }, [certification]);

    // FIX: Added the PDF generation handler and database update logic.
    const handleGeneratePdf = async () => {
        if (!project || !certification || !companyInfo) return;
        if (!invoiceInfo.invoiceNumber.trim()) {
            alert("Por favor, ingrese un número de factura.");
            return;
        }

        const data: InvoiceData = {
            project,
            companyInfo: {
                name: companyInfo.name,
                address: companyInfo.address,
                phone: companyInfo.phone,
            },
            invoiceInfo: {
                ...invoiceInfo,
                signerName,
                signerTitle,
            },
            billableItems,
            invoiceTotal,
            exchangeRate,
        };

        const pdfBlob = exportInvoiceToPDF(data);
        const updatedCertification: Certification = {
            ...certification,
            invoicePdfBlob: pdfBlob,
        };
        await updateCertification(updatedCertification);
        onInvoiceGenerated(updatedCertification, isPaid ? paymentDate : undefined);
    };

    // FIX: Completed the UI component for the Invoice Modal.
    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Generar Factura para ${certification?.name}`}>
            <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input label="Número de Factura" value={invoiceInfo.invoiceNumber} onChange={e => setInvoiceInfo({...invoiceInfo, invoiceNumber: e.target.value})} placeholder="Ej: F-2024-001" />
                    <Input label="Fecha de Factura" type="date" value={invoiceInfo.date} onChange={e => setInvoiceInfo({...invoiceInfo, date: e.target.value})} />
                    <Input label="Cliente" value={invoiceInfo.clientName} onChange={e => setInvoiceInfo({...invoiceInfo, clientName: e.target.value})} />
                    <Input label="Dirección del Cliente" value={invoiceInfo.clientAddress} onChange={e => setInvoiceInfo({...invoiceInfo, clientAddress: e.target.value})} />
                </div>

                <div>
                    <h4 className="text-md font-semibold text-slate-700 mb-3 border-b pb-1">Firmante Autorizado</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input label="Nombre del Firmante" value={signerName} onChange={e => setSignerName(e.target.value)} />
                        <Input label="Cargo" value={signerTitle} onChange={e => setSignerTitle(e.target.value)} />
                    </div>
                </div>

                <div>
                    <h4 className="text-md font-semibold text-slate-700 mb-2">Desglose de Facturación</h4>
                    <div className="border rounded-md overflow-hidden">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-slate-50 text-slate-500 uppercase text-[10px]">
                                <tr>
                                    <th className="px-3 py-2">Concepto</th>
                                    <th className="px-3 py-2 text-right">Total (USD)</th>
                                    <th className="px-3 py-2 text-right">Total (MN)</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {billableItems.map((item, idx) => (
                                    <tr key={idx} className="hover:bg-slate-50">
                                        <td className="px-3 py-2 font-medium">{item.description}</td>
                                        <td className="px-3 py-2 text-right">${item.total.toLocaleString('en-US', {minimumFractionDigits: 2})}</td>
                                        <td className="px-3 py-2 text-right">${(item.total * exchangeRate).toLocaleString('en-US', {minimumFractionDigits: 2})}</td>
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot className="bg-cyan-50 font-bold">
                                <tr>
                                    <td className="px-3 py-2">TOTAL FACTURA</td>
                                    <td className="px-3 py-2 text-right">${invoiceTotal.toLocaleString('en-US', {minimumFractionDigits: 2})}</td>
                                    <td className="px-3 py-2 text-right">${(invoiceTotal * exchangeRate).toLocaleString('en-US', {minimumFractionDigits: 2})}</td>
                                </tr>
                            </tfoot>
                        </table>
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

                <div className="flex justify-end gap-3 pt-4 border-t">
                    <button onClick={onClose} className="px-4 py-2 bg-slate-200 text-slate-700 rounded-md hover:bg-slate-300">Cancelar</button>
                    <button onClick={handleGeneratePdf} className="px-4 py-2 bg-cyan-600 text-white rounded-md hover:bg-cyan-700 shadow">Generar Factura PDF</button>
                </div>
            </div>
        </Modal>
    );
};

export default InvoiceModal;
