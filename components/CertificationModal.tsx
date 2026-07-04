
import React from 'react';
import Modal from './Modal';
import type { Project, LaborItem, Transaction, Certification, CertificationSnapshot } from '../types';
import { calculateCertificationSnapshot, calculateConsolidatedCertificationSnapshot } from '../services/certificationHelper';

const CertificationModal = ({ 
    isOpen, 
    onClose, 
    project,
    allProjects,
    isParentProject,
    laborItems, 
    transactions, 
    certifications, 
    projectMaterialTotal,
    projectLaborTotal,
    projectManualBudgetTotal,
    budgetGrandTotal,
    masterAnticipoPercentage,
    onSave 
}: {
    isOpen: boolean,
    onClose: () => void,
    project: Project,
    allProjects: Project[],
    isParentProject: boolean,
    laborItems: LaborItem[],
    transactions: Transaction[],
    certifications: Certification[],
    projectMaterialTotal: number,
    projectLaborTotal: number,
    projectManualBudgetTotal: number,
    budgetGrandTotal: number,
    masterAnticipoPercentage: number,
    onSave: (cert: Certification, paymentDate?: string) => void
}) => {
    const realCerts = certifications.filter(c => !c.isAdvance);
    const [name, setName] = React.useState(`Certificación #${realCerts.length + 1}`);
    const [calculation, setCalculation] = React.useState<any>(null);
    const [isLoading, setIsLoading] = React.useState(true);
    const [issueDate, setIssueDate] = React.useState(new Date().toISOString().slice(0, 10));
    const [paymentDate, setPaymentDate] = React.useState(new Date().toISOString().slice(0, 10));
    const [isPaid, setIsPaid] = React.useState(false);

    React.useEffect(() => {
        if (!isOpen) return;

        setIsLoading(true);
        const currentRealCerts = certifications.filter(c => !c.isAdvance);
        setName(`Certificación #${currentRealCerts.length + 1}`);
        setIssueDate(new Date().toISOString().slice(0, 10));
        setPaymentDate(new Date().toISOString().slice(0, 10));
        setIsPaid(false);

        const performCalculation = async () => {
            const lastCertification = currentRealCerts.length > 0 ? currentRealCerts[currentRealCerts.length - 1] : null;

            if (isParentProject) {
                const snapshot = await calculateConsolidatedCertificationSnapshot(project, allProjects, lastCertification?.snapshot || null, budgetGrandTotal);
                setCalculation({ snapshot, valueForThisCertification: snapshot.finalBillableAmount });

            } else {
                const snapshot = calculateCertificationSnapshot(project, laborItems, transactions, budgetGrandTotal, lastCertification?.snapshot || null, masterAnticipoPercentage);
                const { finalBillableAmount } = snapshot;
                const previouslyCertifiedTotal = lastCertification?.snapshot.grandTotal || 0;
                setCalculation({ snapshot, previouslyCertifiedTotal, valueForThisCertification: finalBillableAmount });
            }
            setIsLoading(false);
        };

        performCalculation();

    }, [isOpen, isParentProject, project, allProjects, laborItems, transactions, certifications, budgetGrandTotal, masterAnticipoPercentage]);
    
    const handleSave = () => {
        if (!name.trim()) {
            alert("El nombre de la certificación no puede estar vacío.");
            return;
        }
        if (!calculation || calculation.valueForThisCertification < 0) {
            alert("No se puede crear una certificación con valor negativo.");
            return;
        }

        const newCertification: Certification = {
            projectId: project.id!,
            name: name.trim(),
            certifiedAt: new Date(issueDate).toISOString(),
            snapshot: calculation.snapshot
        };

        onSave(newCertification, isPaid ? paymentDate : undefined);
    };

    const StatWithProgress = ({ label, certified, planned }: { label: string, certified: number, planned: number }) => {
        const progress = planned > 0 ? (certified / planned) * 100 : certified > 0 ? 101 : 0;
        const isOver = progress > 100.01;
        
        let barColor = 'bg-cyan-600';
        if (isOver) barColor = 'bg-red-500';
        else if (progress >= 100) barColor = 'bg-green-500';
    
        return (
            <div className="py-2 border-b border-slate-200 last:border-b-0">
                <div className="flex justify-between text-sm">
                    <span className="text-slate-700 font-medium">{label}</span>
                    <span className={`font-semibold ${isOver ? 'text-red-600' : 'text-slate-800'}`}>{certified.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="mt-1">
                    <div className="flex justify-between text-xs text-slate-500 mb-0.5">
                        <span>Plan: {planned.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                        <span className={isOver ? 'font-bold text-red-600' : ''}>{progress.toFixed(0)}% {isOver && '¡Sobrepasado!'}</span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-1.5"><div className={`${barColor} h-1.5 rounded-full`} style={{ width: `${Math.min(100, progress)}%` }}></div></div>
                </div>
            </div>
        );
    };

    const renderNormalCertification = () => {
        const { snapshot, previouslyCertifiedTotal } = calculation;
        // El saldo que había ANTES de aplicar esta deducción
        const remainingAnticipoBefore = snapshot.totalAnticipoAtCertification - (snapshot.cumulativeAnticipoDeducted - snapshot.anticipoDeduction);
        // El saldo que QUEDA después de aplicar esta deducción
        const remainingAnticipoAfter = Math.max(0, remainingAnticipoBefore - snapshot.anticipoDeduction);
        
        return (
            <div className="space-y-1">
                <StatWithProgress label="Mano de Obra Ejecutada" certified={snapshot.completedLaborCost} planned={projectLaborTotal} />
                <StatWithProgress label="Gastos en Materiales" certified={snapshot.materialExpenseCost} planned={projectMaterialTotal} />
                <StatWithProgress label="Otros Gastos Varios" certified={snapshot.manualExpenseCost} planned={projectManualBudgetTotal} />
                
                <div className="flex justify-between text-sm py-2 border-t font-bold mt-2">
                    <span className="text-slate-800">Valor Total Acumulado:</span>
                    <span className="text-slate-900">{snapshot.grandTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between text-sm py-2 border-t text-slate-600">
                    <span className="font-medium">Certificado Anteriormente:</span>
                    <span className="font-semibold">- {previouslyCertifiedTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between text-sm py-2 border-t font-medium text-cyan-700 bg-cyan-50 -mx-4 px-4">
                    <span>Avance Bruto de este Periodo:</span>
                    <span>{snapshot.incrementalValue.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                </div>
                
                {snapshot.totalAnticipoAtCertification > 0 && (
                    <div className="mt-3 p-3 bg-amber-50 border border-amber-100 rounded-md">
                        <div className="flex justify-between text-xs text-amber-700 mb-1">
                            <span>Saldo de Anticipo (Inicial):</span>
                            <span className="font-bold">{remainingAnticipoBefore.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                        </div>
                        <div className="flex justify-between text-sm font-bold text-amber-900 mb-1">
                            <span>Deducción Amortización ({snapshot.anticipoPercentage.toFixed(1)}%):</span>
                            <span>- {snapshot.anticipoDeduction.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                        </div>
                        <div className="flex justify-end text-[11px] text-amber-600 italic font-semibold mt-1">
                            <span>Queda de Anticipo: ({remainingAnticipoAfter.toLocaleString('en-US', { minimumFractionDigits: 2 })})</span>
                        </div>
                    </div>
                )}
            </div>
        );
    };

    const renderConsolidatedCertification = () => {
        const { snapshot } = calculation;
        const remainingAnticipoBefore = snapshot.totalAnticipoAtCertification - (snapshot.cumulativeAnticipoDeducted - snapshot.anticipoDeduction);
        const remainingAnticipoAfter = Math.max(0, remainingAnticipoBefore - snapshot.anticipoDeduction);

        return (
             <div className="space-y-4">
                <p className="text-sm text-slate-600">Esta certificación consolida el progreso facturable de todos los objetos de obra.</p>
                {(snapshot.childIncrements || []).length > 0 ? (
                    <div className="border rounded-md divide-y overflow-hidden shadow-sm">
                        {(snapshot.childIncrements || []).map((child: any) => (
                            <div key={child.projectId} className="p-3 bg-white">
                                <div className="flex justify-between items-center text-sm mb-1">
                                    <span className="font-bold text-slate-800">{child.projectName}</span>
                                    <span className="text-slate-500 font-medium">{child.incrementalValue.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                                </div>
                                {child.anticipoDeduction > 0 && (
                                    <div className="flex justify-between text-xs text-red-600">
                                        <span>Amortización Anticipo:</span>
                                        <span>- {child.anticipoDeduction.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                                    </div>
                                )}
                                <div className="flex justify-between text-sm font-bold text-cyan-700 mt-1">
                                    <span>Neto a Facturar:</span>
                                    <span>{child.finalBillableAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-sm text-slate-500 text-center py-4 italic">No hay avances nuevos para certificar en los objetos de obra.</p>
                )}

                {snapshot.totalAnticipoAtCertification > 0 && (
                    <div className="p-3 bg-amber-50 border border-amber-100 rounded-md">
                         <div className="flex justify-between text-xs text-amber-700 mb-1">
                            <span>Saldo de Anticipo (Inicial):</span>
                            <span className="font-bold">{remainingAnticipoBefore.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                        </div>
                        <div className="flex justify-between text-sm font-bold text-amber-900 mb-1">
                            <span>Deducción Total Anticipo:</span>
                            <span>- {snapshot.anticipoDeduction.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                        </div>
                        <div className="flex justify-end text-[11px] text-amber-600 italic font-semibold mt-1">
                            <span>Queda de Anticipo: ({remainingAnticipoAfter.toLocaleString('en-US', { minimumFractionDigits: 2 })})</span>
                        </div>
                    </div>
                )}
            </div>
        );
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={isParentProject ? "Nueva Certificación Consolidada" : "Nueva Certificación de Obra"}>
            <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Nombre de la Certificación</label>
                        <input
                            type="text"
                            value={name}
                            onChange={e => setName(e.target.value)}
                            className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-cyan-500 outline-none bg-white text-slate-900"
                            placeholder="Ej: Certificación Mayo"
                        />
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

                <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                    <h4 className="text-md font-bold text-slate-800 mb-3 uppercase tracking-wider text-xs">Resumen del Periodo</h4>
                    {isLoading ? (
                        <p className="text-center py-4 text-slate-500">Calculando avance...</p>
                    ) : (
                        isParentProject ? renderConsolidatedCertification() : renderNormalCertification()
                    )}
                </div>

                {!isLoading && calculation && (
                    <div className="bg-cyan-600 p-4 rounded-lg text-white shadow-md">
                        <div className="flex justify-between items-center">
                            <span className="font-semibold text-cyan-100">Total Neto Facturable:</span>
                            <span className="text-2xl font-bold">${calculation.snapshot.finalBillableAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                        </div>
                    </div>
                )}

                <div className="flex justify-end gap-3 mt-8 pt-4 border-t">
                    <button onClick={onClose} className="px-4 py-2 bg-slate-200 text-slate-700 rounded-md hover:bg-slate-300 transition-colors">
                        Cancelar
                    </button>
                    <button 
                        onClick={handleSave} 
                        disabled={isLoading || (calculation && calculation.valueForThisCertification < 0.01)}
                        className="px-4 py-2 bg-cyan-600 text-white rounded-md hover:bg-cyan-700 shadow-md font-bold disabled:bg-slate-400 disabled:cursor-not-allowed"
                    >
                        Guardar Certificación
                    </button>
                </div>
            </div>
        </Modal>
    );
};

export default CertificationModal;
