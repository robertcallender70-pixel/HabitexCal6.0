
import type { Project, LaborItem, Transaction, Certification, CertificationSnapshot, CertificationChildIncrement } from '../types';
import { TransactionType } from '../types';
import { getActivities, getLaborItems, getTransactions, getCertifications } from './database';


export const calculateCertificationSnapshot = (
    project: Project,
    laborItems: LaborItem[],
    transactions: Transaction[],
    totalBudgetAtCertification: number,
    previousSnapshot: CertificationSnapshot | null,
    masterAnticipoPercentage: number 
): CertificationSnapshot => {
    
    const NON_MANUAL_CATEGORIES = ['Materiales', 'Mano de Obra', 'Transporte'];

    const completedLaborItems = laborItems.filter(item => (item.quantityCompleted || 0) > 0);
    const completedLaborCost = completedLaborItems.reduce((sum, item) => sum + (item.quantityCompleted || 0) * item.unitPrice, 0);
    
    const materialTransactions = transactions.filter(t => t.type === TransactionType.EXPENSE && t.category === 'Materiales');
    const materialExpenseCost = materialTransactions.reduce((sum, t) => sum + t.amount, 0);
    
    const transportTransactions = transactions.filter(t => t.type === TransactionType.EXPENSE && t.category === 'Transporte');
    const transportExpenseCost = transportTransactions.reduce((sum, t) => sum + t.amount, 0);
    
    const manualExpenseItems = transactions.filter(t => t.type === TransactionType.EXPENSE && !NON_MANUAL_CATEGORIES.includes(t.category || ''));
    const manualExpenseCost = manualExpenseItems.reduce((sum, t) => sum + t.amount, 0);

    const logisticsCost = completedLaborCost * ((project.logisticsPercentage || 0) / 100);
    const technicalAssistanceCost = completedLaborCost * ((project.technicalAssistancePercentage || 0) / 100);
    const toolsAndUtilitiesCost = completedLaborCost * ((project.toolsAndUtilitiesPercentage || 0) / 100);
    
    const subtotalBeforeProfit = completedLaborCost + materialExpenseCost + transportExpenseCost + manualExpenseCost + logisticsCost + technicalAssistanceCost + toolsAndUtilitiesCost;
    const profitCost = subtotalBeforeProfit * ((project.profitPercentage || 0) / 100);
    
    const subtotalBeforeTax = subtotalBeforeProfit + profitCost;

    let serviceTaxCost = 0;
    let grandTotal = subtotalBeforeTax;

    if (project.hasServiceTax && project.serviceTaxPercentage && project.serviceTaxPercentage > 0) {
        const taxRate = project.serviceTaxPercentage / 100;
        if (taxRate < 1) {
            grandTotal = subtotalBeforeTax / (1 - taxRate);
            serviceTaxCost = grandTotal - subtotalBeforeTax;
        }
    }

    const totalAnticipoReceived = transactions
        .filter(t => t.type === TransactionType.INCOME && t.category === 'Anticipo de obra')
        .reduce((sum, t) => sum + t.amount, 0);

    const incrementalValue = grandTotal - (previousSnapshot?.grandTotal || 0);
    
    const previousCumulativeDeduction = previousSnapshot?.cumulativeAnticipoDeducted || 0;
    const remainingAdvanceToAmortize = Math.max(0, totalAnticipoReceived - previousCumulativeDeduction);
    
    // El factor de amortización es la relación entre el anticipo total recibido y el presupuesto total planificado
    const amortizationFactor = totalBudgetAtCertification > 0 
        ? totalAnticipoReceived / totalBudgetAtCertification 
        : 0;

    let anticipoDeduction = 0;

    // Detectar si es el cierre de obra (toda la mano de obra completada al 100%)
    const isTotalCompletion = laborItems.length > 0 && laborItems.every(li => (li.quantityCompleted || 0) >= (li.quantity || 0) * 0.99);

    if (isTotalCompletion) {
        // En el cierre, descontamos TODO lo que quede de anticipo para saldar la cuenta
        anticipoDeduction = remainingAdvanceToAmortize;
    } else {
        // Descontamos el porcentaje proporcional del valor bruto de esta certificación
        // Pero nunca más de lo que queda de anticipo ni más del valor bruto actual
        anticipoDeduction = Math.min(incrementalValue * amortizationFactor, remainingAdvanceToAmortize, Math.max(0, incrementalValue));
    }

    const finalBillableAmount = Math.max(0, incrementalValue - anticipoDeduction);
    const cumulativeAnticipoDeducted = previousCumulativeDeduction + anticipoDeduction;
    const cumulativeNetBillable = (previousSnapshot?.cumulativeNetBillable || 0) + finalBillableAmount;

    return {
        completedLaborItems,
        materialTransactions,
        transportTransactions,
        manualExpenseItems,
        completedLaborCost,
        materialExpenseCost,
        transportExpenseCost,
        manualExpenseCost,
        logisticsPercentage: project.logisticsPercentage || 0,
        technicalAssistancePercentage: project.technicalAssistancePercentage || 0,
        toolsAndUtilitiesPercentage: project.toolsAndUtilitiesPercentage || 0,
        profitPercentage: project.profitPercentage || 0,
        transportPercentage: project.transportPercentage || 0,
        contingencyPercentage: project.contingencyPercentage || 0,
        logisticsCost,
        technicalAssistanceCost,
        toolsAndUtilitiesCost,
        profitCost,
        hasServiceTax: project.hasServiceTax,
        serviceTaxPercentage: project.serviceTaxPercentage,
        serviceTaxCost,
        grandTotal,
        totalAnticipoAtCertification: totalAnticipoReceived,
        totalBudgetAtCertification: totalBudgetAtCertification,
        anticipoPercentage: amortizationFactor * 100,
        incrementalValue,
        anticipoDeduction,
        finalBillableAmount,
        cumulativeAnticipoDeducted,
        cumulativeNetBillable,
    };
};

export const calculateConsolidatedCertificationSnapshot = async (
    parentProject: Project,
    allProjects: Project[],
    parentPreviousSnapshot: CertificationSnapshot | null
): Promise<CertificationSnapshot> => {
    const childProjects = allProjects.filter(p => p.parentId === parentProject.id);
    const childIncrements: CertificationChildIncrement[] = [];
    
    let consolidatedCompletedLaborCost = 0;
    let consolidatedMaterialExpenseCost = 0;
    let consolidatedTransportExpenseCost = 0;
    let consolidatedManualExpenseCost = 0;
    let consolidatedLogisticsCost = 0;
    let consolidatedTechnicalAssistanceCost = 0;
    let consolidatedToolsAndUtilitiesCost = 0;
    let consolidatedProfitCost = 0;
    let consolidatedGrandTotal = 0;
    let consolidatedServiceTaxCost = 0;

    for (const child of childProjects) {
        if (!child.id) continue;
        
        const [childLabor, childTransactions, childCerts] = await Promise.all([
            getLaborItems(child.id),
            getTransactions(child.id),
            getCertifications(child.id),
        ]);

        const childLastCert = childCerts.length > 0 ? childCerts[childCerts.length - 1] : null;

        const childSnapshot = calculateCertificationSnapshot(
            child, 
            childLabor, 
            childTransactions, 
            0, 
            childLastCert?.snapshot || null,
            0 
        );

        if (childSnapshot.incrementalValue > 0.01) {
            childIncrements.push({
                projectId: child.id,
                projectName: child.name,
                incrementalValue: childSnapshot.incrementalValue,
                anticipoDeduction: 0, 
                finalBillableAmount: childSnapshot.incrementalValue,
            });
        }
        
        consolidatedCompletedLaborCost += childSnapshot.completedLaborCost;
        consolidatedMaterialExpenseCost += childSnapshot.materialExpenseCost;
        consolidatedTransportExpenseCost += childSnapshot.transportExpenseCost;
        consolidatedManualExpenseCost += childSnapshot.manualExpenseCost;
        consolidatedLogisticsCost += childSnapshot.logisticsCost;
        consolidatedTechnicalAssistanceCost += childSnapshot.technicalAssistanceCost;
        consolidatedToolsAndUtilitiesCost += childSnapshot.toolsAndUtilitiesCost || 0;
        consolidatedProfitCost += childSnapshot.profitCost;
        consolidatedServiceTaxCost += childSnapshot.serviceTaxCost || 0;
        consolidatedGrandTotal += childSnapshot.grandTotal;
    }

    const parentTransactions = await getTransactions(parentProject.id!);
    const totalParentAnticipo = parentTransactions
        .filter(t => t.type === TransactionType.INCOME && t.category === 'Anticipo de obra')
        .reduce((sum, t) => sum + t.amount, 0);

    const incrementalValue = consolidatedGrandTotal - (parentPreviousSnapshot?.grandTotal || 0);
    const prevCumulativeDeduction = parentPreviousSnapshot?.cumulativeAnticipoDeducted || 0;
    const remainingToAmortize = Math.max(0, totalParentAnticipo - prevCumulativeDeduction);
    
    const anticipoDeduction = Math.min(incrementalValue, remainingToAmortize);
    const finalBillableAmount = incrementalValue - anticipoDeduction;

    if (anticipoDeduction > 0 && incrementalValue > 0) {
        childIncrements.forEach(ci => {
            const ratio = ci.incrementalValue / incrementalValue;
            ci.anticipoDeduction = anticipoDeduction * ratio;
            ci.finalBillableAmount = ci.incrementalValue - ci.anticipoDeduction;
        });
    }

    return {
        completedLaborItems: [], 
        materialTransactions: [],
        transportTransactions: [],
        manualExpenseItems: [],
        completedLaborCost: consolidatedCompletedLaborCost,
        materialExpenseCost: consolidatedMaterialExpenseCost,
        transportExpenseCost: consolidatedTransportExpenseCost,
        manualExpenseCost: consolidatedManualExpenseCost,
        logisticsPercentage: 0,
        technicalAssistancePercentage: 0,
        toolsAndUtilitiesPercentage: 0,
        profitPercentage: 0,
        logisticsCost: consolidatedLogisticsCost,
        technicalAssistanceCost: consolidatedTechnicalAssistanceCost,
        toolsAndUtilitiesCost: consolidatedToolsAndUtilitiesCost,
        profitCost: consolidatedProfitCost,
        serviceTaxCost: consolidatedServiceTaxCost,
        grandTotal: consolidatedGrandTotal,
        totalAnticipoAtCertification: totalParentAnticipo,
        totalBudgetAtCertification: 0,
        anticipoPercentage: 0,
        incrementalValue,
        anticipoDeduction,
        finalBillableAmount,
        cumulativeAnticipoDeducted: prevCumulativeDeduction + anticipoDeduction,
        cumulativeNetBillable: (parentPreviousSnapshot?.cumulativeNetBillable || 0) + finalBillableAmount,
        childIncrements,
    };
};
