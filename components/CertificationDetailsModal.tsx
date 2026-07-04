import React from 'react';
import Modal from './Modal';
import type { Project, Certification } from '../types';
import { exportCertificationToPDF } from '../services/pdf';

interface CertificationDetailsModalProps {
    isOpen: boolean;
    onClose: () => void;
    project: Project;
    certification: Certification | null;
    prevCertification: Certification | null;
    displayCurrency: 'USD' | 'CUP';
    exchangeRate: number;
}

const CertificationDetailsModal: React.FC<CertificationDetailsModalProps> = ({
    isOpen,
    onClose,
    project,
    certification,
    prevCertification,
    displayCurrency,
    exchangeRate
}) => {
    const [activeTab, setActiveTab] = React.useState<'summary' | 'labor' | 'materials' | 'indirects'>('summary');

    if (!isOpen || !certification) return null;

    const rate = exchangeRate;
    const snapshot = certification.snapshot;
    const prevSnapshot = prevCertification?.snapshot || null;

    // Helper to format currency
    const formatValue = (usdVal: number) => {
        const val = displayCurrency === 'CUP' ? usdVal * rate : usdVal;
        return `$${val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${displayCurrency}`;
    };

    // Helper to format raw numbers
    const formatQty = (val: number) => {
        return val.toLocaleString('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 2 });
    };

    // Financial totals
    const accumValue = snapshot.grandTotal;
    const prevValue = prevSnapshot ? prevSnapshot.grandTotal : 0;
    const periodValue = snapshot.incrementalValue;

    const accumDeduction = snapshot.cumulativeAnticipoDeducted;
    const prevDeduction = prevSnapshot ? prevSnapshot.cumulativeAnticipoDeducted : 0;
    const periodDeduction = snapshot.anticipoDeduction;

    const accumNet = snapshot.cumulativeNetBillable;
    const prevNet = prevSnapshot ? prevSnapshot.cumulativeNetBillable : 0;
    const periodNet = snapshot.finalBillableAmount;

    // Export handler
    const handlePrint = () => {
        exportCertificationToPDF(project, certification, prevCertification, displayCurrency, exchangeRate);
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={`Desglose Detallado: ${certification.name}`}
            size="4xl"
            footer={
                <div className="flex justify-between items-center w-full">
                    <button
                        onClick={handlePrint}
                        className="flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-lg shadow-md transition-all text-sm"
                    >
                        {/* Inline printer SVG */}
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                        </svg>
                        Exportar Certificación (PDF)
                    </button>
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-medium rounded-lg transition-colors text-sm"
                    >
                        Cerrar
                    </button>
                </div>
            }
        >
            <div className="space-y-6">
                {/* Meta details banner */}
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col md:flex-row justify-between gap-4">
                    <div>
                        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Proyecto</p>
                        <h4 className="text-md font-bold text-slate-800">{project.name}</h4>
                        <p className="text-xs text-slate-500 mt-1">Cliente: {project.clientName || 'No especificado'}</p>
                    </div>
                    <div className="md:text-right">
                        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Fecha de Emisión</p>
                        <p className="text-md font-bold text-slate-800">
                            {new Date(certification.certifiedAt).toLocaleDateString()}
                        </p>
                        <p className="text-xs text-slate-500 mt-1">Tasa de Cambio: 1 USD = {rate} CUP</p>
                    </div>
                </div>

                {/* Primary Metric Panels */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 relative overflow-hidden">
                        <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-slate-400"></div>
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Valor Anterior Acumulado</p>
                        <p className="text-xl font-bold text-slate-700 mt-1">{formatValue(prevValue)}</p>
                        <p className="text-xs text-slate-400 mt-1">Suma certificada previamente</p>
                    </div>
                    <div className="bg-teal-50 border border-teal-200 rounded-xl p-4 relative overflow-hidden">
                        <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-teal-600"></div>
                        <p className="text-xs font-bold text-teal-700 uppercase tracking-wider">Ejecutado de esta Etapa (Bruto)</p>
                        <p className="text-xl font-bold text-teal-800 mt-1">{formatValue(periodValue)}</p>
                        <p className="text-xs text-teal-600 mt-1">Avance registrado en este ciclo</p>
                    </div>
                    <div className="bg-cyan-50 border border-cyan-200 rounded-xl p-4 relative overflow-hidden">
                        <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-cyan-600"></div>
                        <p className="text-xs font-bold text-cyan-700 uppercase tracking-wider">Neto Facturable de la Etapa</p>
                        <p className="text-xl font-bold text-cyan-800 mt-1">{formatValue(periodNet)}</p>
                        <p className="text-xs text-cyan-600 mt-1">Neto después de amortizar anticipo</p>
                    </div>
                </div>

                {/* Navigation Tabs */}
                <div className="border-b border-slate-200">
                    <nav className="flex gap-4 -mb-px" aria-label="Tabs">
                        <button
                            onClick={() => setActiveTab('summary')}
                            className={`pb-3 text-sm font-semibold border-b-2 transition-all ${
                                activeTab === 'summary'
                                    ? 'border-teal-600 text-teal-700'
                                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                            }`}
                        >
                            Resumen Financiero
                        </button>
                        <button
                            onClick={() => setActiveTab('labor')}
                            className={`pb-3 text-sm font-semibold border-b-2 transition-all ${
                                activeTab === 'labor'
                                    ? 'border-teal-600 text-teal-700'
                                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                            }`}
                        >
                            Mano de Obra ({snapshot.completedLaborItems.length})
                        </button>
                        <button
                            onClick={() => setActiveTab('materials')}
                            className={`pb-3 text-sm font-semibold border-b-2 transition-all ${
                                activeTab === 'materials'
                                    ? 'border-teal-600 text-teal-700'
                                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                            }`}
                        >
                            Suministros y Varios
                        </button>
                        <button
                            onClick={() => setActiveTab('indirects')}
                            className={`pb-3 text-sm font-semibold border-b-2 transition-all ${
                                activeTab === 'indirects'
                                    ? 'border-teal-600 text-teal-700'
                                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                            }`}
                        >
                            Indirectos y Utilidades
                        </button>
                    </nav>
                </div>

                {/* Tab Contents */}
                <div className="min-h-[250px]">
                    {/* SUMMARY TAB */}
                    {activeTab === 'summary' && (
                        <div className="space-y-4">
                            <div className="overflow-x-auto border border-slate-200 rounded-xl">
                                <table className="w-full text-sm text-left text-slate-700 border-collapse">
                                    <thead>
                                        <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
                                            <th className="px-4 py-3">Concepto Económico</th>
                                            <th className="px-4 py-3 text-right">Acumulado Anterior</th>
                                            <th className="px-4 py-3 text-right text-teal-700">Ejecutado de la Etapa</th>
                                            <th className="px-4 py-3 text-right">Acumulado Actual</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        <tr>
                                            <td className="px-4 py-3 font-semibold text-slate-800">1. Valor Bruto de Obra Ejecutada</td>
                                            <td className="px-4 py-3 text-right text-slate-500">{formatValue(prevValue)}</td>
                                            <td className="px-4 py-3 text-right text-teal-700 font-bold">{formatValue(periodValue)}</td>
                                            <td className="px-4 py-3 text-right text-slate-900 font-semibold">{formatValue(accumValue)}</td>
                                        </tr>
                                        <tr>
                                            <td className="px-4 py-3 font-semibold text-slate-800">2. Descuento de Anticipo Proporcional</td>
                                            <td className="px-4 py-3 text-right text-slate-500">{formatValue(prevDeduction)}</td>
                                            <td className="px-4 py-3 text-right text-teal-700 font-semibold">{formatValue(periodDeduction)}</td>
                                            <td className="px-4 py-3 text-right text-slate-900 font-semibold">{formatValue(accumDeduction)}</td>
                                        </tr>
                                        <tr className="bg-slate-50/50">
                                            <td className="px-4 py-3 font-bold text-slate-900">3. Neto Facturable / Cobrable</td>
                                            <td className="px-4 py-3 text-right text-slate-600 font-semibold">{formatValue(prevNet)}</td>
                                            <td className="px-4 py-3 text-right text-teal-700 font-bold">{formatValue(periodNet)}</td>
                                            <td className="px-4 py-3 text-right text-slate-900 font-bold text-md">{formatValue(accumNet)}</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>

                            <div className="p-4 bg-amber-50 rounded-xl border border-amber-200 text-amber-800 text-xs leading-relaxed space-y-1">
                                <p className="font-bold uppercase tracking-wider text-[10px]">Nota de Control Técnico:</p>
                                <p>Esta certificación representa la medición real del trabajo completado hasta la fecha. El descuento por anticipo se deduce proporcionalmente de acuerdo con el factor de amortización acordado para saldar gradualmente la asignación inicial.</p>
                            </div>
                        </div>
                    )}

                    {/* LABOR TAB */}
                    {activeTab === 'labor' && (
                        <div className="space-y-4">
                            {snapshot.completedLaborItems.length === 0 ? (
                                <p className="text-center py-10 text-slate-500">No se registraron actividades de mano de obra en esta etapa.</p>
                            ) : (
                                <div className="overflow-x-auto border border-slate-200 rounded-xl">
                                    <table className="w-full text-xs sm:text-sm text-left text-slate-700 border-collapse">
                                        <thead>
                                            <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
                                                <th className="px-3 py-2.5">Actividad Constructiva</th>
                                                <th className="px-3 py-2.5">Unidad</th>
                                                <th className="px-3 py-2.5 text-right">Tarifa Unit.</th>
                                                <th className="px-3 py-2.5 text-right">Cant. Ant.</th>
                                                <th className="px-3 py-2.5 text-right text-teal-700">Cant. Per.</th>
                                                <th className="px-3 py-2.5 text-right">Cant. Act.</th>
                                                <th className="px-3 py-2.5 text-right text-teal-700 font-bold">Importe Per.</th>
                                                <th className="px-3 py-2.5 text-right font-bold">Importe Act.</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {snapshot.completedLaborItems.map(item => {
                                                const prevItem = prevSnapshot?.completedLaborItems.find(pi => pi.name === item.name);
                                                const prevQty = prevItem ? (prevItem.quantityCompleted || 0) : 0;
                                                const totalQty = item.quantityCompleted || 0;
                                                const periodQty = Math.max(0, totalQty - prevQty);

                                                return (
                                                    <tr key={item.name} className="hover:bg-slate-50/50">
                                                        <td className="px-3 py-2.5 font-medium text-slate-800">{item.name}</td>
                                                        <td className="px-3 py-2.5 text-slate-500">{item.unit}</td>
                                                        <td className="px-3 py-2.5 text-right">{formatValue(item.unitPrice)}</td>
                                                        <td className="px-3 py-2.5 text-right text-slate-500">{formatQty(prevQty)}</td>
                                                        <td className="px-3 py-2.5 text-right text-teal-700 font-bold">{formatQty(periodQty)}</td>
                                                        <td className="px-3 py-2.5 text-right text-slate-800">{formatQty(totalQty)}</td>
                                                        <td className="px-3 py-2.5 text-right text-teal-700 font-bold">{formatValue(periodQty * item.unitPrice)}</td>
                                                        <td className="px-3 py-2.5 text-right text-slate-900 font-semibold">{formatValue(totalQty * item.unitPrice)}</td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                        <tfoot>
                                            <tr className="bg-slate-50 font-bold border-t border-slate-200">
                                                <td colSpan={6} className="px-3 py-3 text-right text-slate-800">Costo Mano de Obra Directa</td>
                                                <td className="px-3 py-3 text-right text-teal-700 font-bold">{formatValue(snapshot.completedLaborCost - (prevSnapshot?.completedLaborCost || 0))}</td>
                                                <td className="px-3 py-3 text-right text-slate-900">{formatValue(snapshot.completedLaborCost)}</td>
                                            </tr>
                                        </tfoot>
                                    </table>
                                </div>
                            )}
                        </div>
                    )}

                    {/* MATERIALS TAB */}
                    {activeTab === 'materials' && (
                        <div className="space-y-4">
                            {(!snapshot.materialTransactions?.length && !snapshot.transportTransactions?.length && !snapshot.manualExpenseItems?.length) ? (
                                <p className="text-center py-10 text-slate-500">No se registraron gastos de materiales o suministros específicos en esta certificación.</p>
                            ) : (
                                <div className="overflow-x-auto border border-slate-200 rounded-xl">
                                    <table className="w-full text-sm text-left text-slate-700 border-collapse">
                                        <thead>
                                            <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
                                                <th className="px-4 py-3">Fecha</th>
                                                <th className="px-4 py-3">Categoría de Gasto</th>
                                                <th className="px-4 py-3">Concepto / Movimiento</th>
                                                <th className="px-4 py-3 text-right">Importe</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {snapshot.materialTransactions?.map((t, idx) => (
                                                <tr key={`mat-${idx}`} className="hover:bg-slate-50/50">
                                                    <td className="px-4 py-3 text-slate-500 text-xs">{new Date(t.date).toLocaleDateString()}</td>
                                                    <td className="px-4 py-3 text-slate-800 font-medium">Materiales</td>
                                                    <td className="px-4 py-3 text-slate-600">{t.description}</td>
                                                    <td className="px-4 py-3 text-right font-semibold text-slate-900">{formatValue(t.amount)}</td>
                                                </tr>
                                            ))}
                                            {snapshot.transportTransactions?.map((t, idx) => (
                                                <tr key={`trans-${idx}`} className="hover:bg-slate-50/50">
                                                    <td className="px-4 py-3 text-slate-500 text-xs">{new Date(t.date).toLocaleDateString()}</td>
                                                    <td className="px-4 py-3 text-slate-800 font-medium">Transporte</td>
                                                    <td className="px-4 py-3 text-slate-600">{t.description}</td>
                                                    <td className="px-4 py-3 text-right font-semibold text-slate-900">{formatValue(t.amount)}</td>
                                                </tr>
                                            ))}
                                            {snapshot.manualExpenseItems?.map((t, idx) => (
                                                <tr key={`man-${idx}`} className="hover:bg-slate-50/50">
                                                    <td className="px-4 py-3 text-slate-500 text-xs">{new Date(t.date).toLocaleDateString()}</td>
                                                    <td className="px-4 py-3 text-slate-800 font-medium">{t.category || 'Varios'}</td>
                                                    <td className="px-4 py-3 text-slate-600">{t.description}</td>
                                                    <td className="px-4 py-3 text-right font-semibold text-slate-900">{formatValue(t.amount)}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                        <tfoot>
                                            <tr className="bg-slate-50 font-bold border-t border-slate-200">
                                                <td colSpan={3} className="px-4 py-3 text-right text-slate-800">Suma Total de Suministros y Varios</td>
                                                <td className="px-4 py-3 text-right text-slate-900">
                                                    {formatValue(
                                                        (snapshot.materialExpenseCost || 0) +
                                                        (snapshot.transportExpenseCost || 0) +
                                                        (snapshot.manualExpenseCost || 0)
                                                    )}
                                                </td>
                                            </tr>
                                        </tfoot>
                                    </table>
                                </div>
                            )}
                        </div>
                    )}

                    {/* INDIRECTS TAB */}
                    {activeTab === 'indirects' && (
                        <div className="space-y-4">
                            <div className="overflow-x-auto border border-slate-200 rounded-xl">
                                <table className="w-full text-sm text-left text-slate-700 border-collapse">
                                    <thead>
                                        <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
                                            <th className="px-4 py-3">Concepto de Costo Indirecto</th>
                                            <th className="px-4 py-3 text-center">Tasa %</th>
                                            <th className="px-4 py-3 text-right">Acumulado Anterior</th>
                                            <th className="px-4 py-3 text-right text-teal-700">Ejecutado Período</th>
                                            <th className="px-4 py-3 text-right">Acumulado Actual</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {snapshot.logisticsPercentage !== undefined && snapshot.logisticsPercentage > 0 && (
                                            <tr>
                                                <td className="px-4 py-3 font-medium text-slate-800">Logística (sobre Mano de Obra)</td>
                                                <td className="px-4 py-3 text-center text-slate-500">{snapshot.logisticsPercentage}%</td>
                                                <td className="px-4 py-3 text-right text-slate-500">{formatValue(prevSnapshot?.logisticsCost || 0)}</td>
                                                <td className="px-4 py-3 text-right text-teal-700 font-bold">{formatValue(snapshot.logisticsCost - (prevSnapshot?.logisticsCost || 0))}</td>
                                                <td className="px-4 py-3 text-right text-slate-900">{formatValue(snapshot.logisticsCost)}</td>
                                            </tr>
                                        )}
                                        {snapshot.technicalAssistancePercentage !== undefined && snapshot.technicalAssistancePercentage > 0 && (
                                            <tr>
                                                <td className="px-4 py-3 font-medium text-slate-800">Asistencia Técnica (sobre Mano de Obra)</td>
                                                <td className="px-4 py-3 text-center text-slate-500">{snapshot.technicalAssistancePercentage}%</td>
                                                <td className="px-4 py-3 text-right text-slate-500">{formatValue(prevSnapshot?.technicalAssistanceCost || 0)}</td>
                                                <td className="px-4 py-3 text-right text-teal-700 font-bold">{formatValue(snapshot.technicalAssistanceCost - (prevSnapshot?.technicalAssistanceCost || 0))}</td>
                                                <td className="px-4 py-3 text-right text-slate-900">{formatValue(snapshot.technicalAssistanceCost)}</td>
                                            </tr>
                                        )}
                                        {snapshot.toolsAndUtilitiesPercentage !== undefined && snapshot.toolsAndUtilitiesPercentage > 0 && (
                                            <tr>
                                                <td className="px-4 py-3 font-medium text-slate-800">Útiles y Herramientas (sobre Mano de Obra)</td>
                                                <td className="px-4 py-3 text-center text-slate-500">{snapshot.toolsAndUtilitiesPercentage}%</td>
                                                <td className="px-4 py-3 text-right text-slate-500">{formatValue(prevSnapshot?.toolsAndUtilitiesCost || 0)}</td>
                                                <td className="px-4 py-3 text-right text-teal-700 font-bold">{formatValue((snapshot.toolsAndUtilitiesCost || 0) - (prevSnapshot?.toolsAndUtilitiesCost || 0))}</td>
                                                <td className="px-4 py-3 text-right text-slate-900">{formatValue(snapshot.toolsAndUtilitiesCost || 0)}</td>
                                            </tr>
                                        )}
                                        {snapshot.profitPercentage !== undefined && snapshot.profitPercentage > 0 && (
                                            <tr>
                                                <td className="px-4 py-3 font-medium text-slate-800">Utilidad de la Empresa</td>
                                                <td className="px-4 py-3 text-center text-slate-500">{snapshot.profitPercentage}%</td>
                                                <td className="px-4 py-3 text-right text-slate-500">{formatValue(prevSnapshot?.profitCost || 0)}</td>
                                                <td className="px-4 py-3 text-right text-teal-700 font-bold">{formatValue(snapshot.profitCost - (prevSnapshot?.profitCost || 0))}</td>
                                                <td className="px-4 py-3 text-right text-slate-900">{formatValue(snapshot.profitCost)}</td>
                                            </tr>
                                        )}
                                        {snapshot.hasServiceTax && snapshot.serviceTaxPercentage !== undefined && snapshot.serviceTaxPercentage > 0 && (
                                            <tr>
                                                <td className="px-4 py-3 font-medium text-slate-800 font-semibold">Impuesto Comercial de Servicios</td>
                                                <td className="px-4 py-3 text-center text-slate-500">{snapshot.serviceTaxPercentage}%</td>
                                                <td className="px-4 py-3 text-right text-slate-500">{formatValue(prevSnapshot?.serviceTaxCost || 0)}</td>
                                                <td className="px-4 py-3 text-right text-teal-700 font-bold">{formatValue(snapshot.serviceTaxCost - (prevSnapshot?.serviceTaxCost || 0))}</td>
                                                <td className="px-4 py-3 text-right text-slate-900 font-semibold">{formatValue(snapshot.serviceTaxCost)}</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </Modal>
    );
};

export default CertificationDetailsModal;
