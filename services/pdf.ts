import type { 
    Project, 
    Activity, 
    Material, 
    LaborItem, 
    BudgetItem,
    Transaction,
    InvoiceData,
    OfferData,
    Certification,
    CertificationSnapshot,
} from '../types';
import { TransactionType } from '../types';

declare const jspdf: any;

export const parseLocalDate = (dateVal: string | Date | undefined | null): Date => {
    if (!dateVal) return new Date();
    if (dateVal instanceof Date) {
        return dateVal;
    }
    if (typeof dateVal === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateVal)) {
        const [year, month, day] = dateVal.split('-').map(Number);
        return new Date(year, month - 1, day);
    }
    if (typeof dateVal === 'string' && dateVal.includes('T')) {
        const datePart = dateVal.split('T')[0];
        if (/^\d{4}-\d{2}-\d{2}$/.test(datePart)) {
            const [year, month, day] = datePart.split('-').map(Number);
            return new Date(year, month - 1, day);
        }
    }
    const d = new Date(dateVal);
    if (!isNaN(d.getTime())) {
        return d;
    }
    return new Date();
};

// --- Helper: Draw outstanding Metric Tiles ---
const drawMetricCard = (
    doc: any, 
    x: number, 
    y: number, 
    w: number, 
    h: number, 
    title: string, 
    amount1: string, 
    label1: string, 
    amount2: string, 
    label2: string
) => {
    // Elegant soft gradient/slate background card
    doc.setFillColor(248, 250, 252); // soft off-white/grey (slate-50)
    doc.setDrawColor(226, 232, 240); // borders (slate-200)
    doc.setLineWidth(0.35);
    doc.roundedRect(x, y, w, h, 2, 2, 'FD');

    // Accent left colored indicator bar
    doc.setFillColor(13, 148, 136); // teal-600 indicator
    doc.rect(x, y, 2.5, h, 'F');

    // Title label
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(100, 116, 139); // slate-500
    doc.text(title.toUpperCase(), x + 6, y + 8);

    // Primary outstanding statistic
    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 118, 110); // teal-700
    doc.text(amount1, x + 6, y + 17);
    
    // Primary statistic subtext
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(148, 163, 184); // slate-400
    doc.text(label1, x + 6, y + 22);

    // Secondary statistic
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(51, 65, 85); // slate-700
    doc.text(amount2, x + 6, y + 31);
    
    // Secondary statistic subtext
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(148, 163, 184); // slate-400
    doc.text(label2, x + 6, y + 36);
};

// --- Helper: Add Beautiful Running Header & Footers On All Pages ---
const addPageOverlays = (doc: any, subtitle: string, skipPageOneHeader = false) => {
    const totalPages = doc.internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        const pageHeight = doc.internal.pageSize.height;
        const pageWidth = doc.internal.pageSize.width;
        
        // Running Header (with a minimalist, elegant styled look)
        if (!skipPageOneHeader || i > 1) {
            doc.setFontSize(8);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(148, 163, 184); // grey-400
            doc.text('HABITEX CALCULA  •  SISTEMA INTEGRAL DE CONTROL', 14, 10);
            doc.text(subtitle ? subtitle.toUpperCase() : '', pageWidth - 14, 10, { align: 'right' });
            
            // Thin elegant rule
            doc.setDrawColor(226, 232, 240); // slate-200
            doc.setLineWidth(0.3);
            doc.line(14, 12, pageWidth - 14, 12);
        }
        
        // Running Footnote Accent (displays page numbers dynamically and copyright watermark)
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(148, 163, 184);
        doc.text(`Documento emitido mediante Habitex Calcula  •  Generación: ${new Date().toLocaleDateString()}`, 14, pageHeight - 10);
        doc.text(`Página ${i} de ${totalPages}`, pageWidth - 14, pageHeight - 10, { align: 'right' });
    }
};

// --- Export Project Report PDF ---
export const exportProjectToPDF = (
    project: Project,
    activities: Activity[],
    totalMaterials: Material[],
    materialGrandTotal: number, // USD
    laborItems: LaborItem[],
    laborGrandTotal: number, // USD
    budgetItems: BudgetItem[],
    budgetGrandTotal: number, // USD
    transactions: Transaction[],
    exchangeRate: number
): void => {
    const { jsPDF } = jspdf;
    const doc = new jsPDF();
    
    // Financial calculations
    const totalIncome = transactions.filter(t => t.type === TransactionType.INCOME).reduce((sum, t) => sum + t.amount, 0);
    const totalExpense = transactions.filter(t => t.type === TransactionType.EXPENSE).reduce((sum, t) => sum + t.amount, 0);
    const balance = totalIncome - totalExpense;

    const projectGrandTotalUSD = materialGrandTotal + laborGrandTotal + budgetGrandTotal;
    const projectGrandTotalMN = projectGrandTotalUSD * exchangeRate;

    // --- Elegant Page 1 Header Banner ---
    doc.setFillColor(15, 118, 110); // Habitex corporate teal-700
    doc.rect(14, 16, 182, 24, 'F');
    
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 255, 255);
    doc.text('HABITEX CALCULA  •  INFORME CONSOLIDADO DE OBRA', 20, 24);
    
    doc.setFontSize(15);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 255, 255);
    doc.text(project.name.toUpperCase(), 20, 32);

    let y = 50;

    // --- Sub-Header Meta Details ---
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 41, 59); // slate-800
    doc.text('DETALLES METRICOS DEL PROYECTO', 14, y);
    y += 5;
    
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.4);
    doc.line(14, y, 196, y);
    y += 6;
    
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(71, 85, 105);
    doc.text('Cliente:', 14, y);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text(project.clientName || 'No especificado', 34, y);
    
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(71, 85, 105);
    doc.text('Ubicación:', 110, y);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text(project.location || 'No especificada', 133, y);
    y += 6;

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(71, 85, 105);
    doc.text('Tasa Cambio:', 14, y);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text(`1 USD = ${exchangeRate.toLocaleString('en-US', { minimumFractionDigits: 2 })} MN`, 40, y);

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(71, 85, 105);
    doc.text('Estado Obra:', 110, y);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text(project.status || 'Planificación', 133, y);
    y += 12;

    // --- Executive Metrics Cards Panel (Page 1) ---
    drawMetricCard(
        doc, 
        14, 
        y, 
        56, 42, 
        'Presupuesto Planificado', 
        `$${projectGrandTotalUSD.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})} USD`, 
        'Asignación Total Proyectada', 
        `$${projectGrandTotalMN.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})} MN`, 
        'Monto Nacional Equivalente'
    );
    
    drawMetricCard(
        doc, 
        77, 
        y, 
        56, 42, 
        'Ejecución Real Cobrada', 
        `$${totalIncome.toLocaleString('en-US', {minimumFractionDigits: 2})} USD`, 
        'Ingresos Líquidos Totales', 
        `$${(totalIncome * exchangeRate).toLocaleString('en-US', {minimumFractionDigits: 2})} MN`, 
        'Ingresos Equivalentes'
    );
    
    drawMetricCard(
        doc, 
        140, 
        y, 
        56, 42, 
        'Efectivo Disponible', 
        `$${balance.toLocaleString('en-US', {minimumFractionDigits: 2})} USD`, 
        'Efectivo Neto en Caja (USD)', 
        `$${(balance * exchangeRate).toLocaleString('en-US', {minimumFractionDigits: 2})} MN`, 
        'Balance Neto en CUP/MN'
    );
    y += 54;

    // --- Estimated Budget Summary Breakdown ---
    doc.setFontSize(10.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 41, 59);
    doc.text('RESUMEN DE ASIGNACIÓN ECONÓMICA PLANIFICADA', 14, y);
    y += 4;
    
    (doc as any).autoTable({
        startY: y,
        head: [['Concepto Técnico de Planificación', 'Asignación (USD)', 'Asignación Equivalente (MN)']],
        body: [
            ['1. Suministro General y Acopio de Materiales', `$${materialGrandTotal.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`, `$${(materialGrandTotal * exchangeRate).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`],
            ['2. Costo Técnico de Ejecución (Mano de Obra)', `$${laborGrandTotal.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`, `$${(laborGrandTotal * exchangeRate).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`],
            ['3. Gastos de Logística, Asistencias e Impuestos', `$${budgetGrandTotal.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`, `$${(budgetGrandTotal * exchangeRate).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`],
        ],
        foot: [
            ['PRESUPUESTO GENERAL ESTIMADO', `$${projectGrandTotalUSD.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`, `$${projectGrandTotalMN.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`]
        ],
        theme: 'grid',
        headStyles: { fillColor: [15, 118, 110], textColor: 255, fontStyle: 'bold', fontSize: 9 },
        footStyles: { fillColor: [240, 249, 250], textColor: [15, 118, 110], fontStyle: 'bold', fontSize: 9 },
        margin: { left: 14, right: 14 }
    });

    // --- Page 2: Transactions Summary Table (if any exist) ---
    if (transactions.length > 0) {
        doc.addPage();
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(30, 41, 59);
        doc.text('Historial de Movimientos de Caja / Transacciones', 14, 20);
        
        (doc as any).autoTable({
            startY: 25,
            head: [['Fecha', 'Tipo', 'Descripción / Concepto', 'Categoría', 'Monto Real', 'Equivalente (CUP/MN)']],
            body: transactions.map(t => [
                parseLocalDate(t.date).toLocaleDateString(),
                t.type === TransactionType.INCOME ? 'INGRESO' : 'EFECTIVADO',
                t.description,
                t.category || '-',
                (t.type === TransactionType.INCOME ? '+' : '-') + ` $${t.amount.toLocaleString('en-US', {minimumFractionDigits: 2})} USD`,
                (t.type === TransactionType.INCOME ? '+' : '-') + ` $${(t.amount * exchangeRate).toLocaleString('en-US', {minimumFractionDigits: 2})} MN`
            ]),
            theme: 'striped',
            headStyles: { fillColor: [15, 118, 110], textColor: 255, fontSize: 9 },
            alternateRowStyles: { fillColor: [248, 250, 252] },
            margin: { left: 14, right: 14 }
        });
    }

    // --- Page 3: Materials Summary Table ---
    doc.addPage();
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 41, 59);
    doc.text('Desglose Suministro y Desglose de Materiales', 14, 20);
    
    (doc as any).autoTable({
        startY: 25,
        head: [['Detalle Insumo / Material', 'Cantidad', 'Unidad de Medida', 'Precio Unitario (MN)', 'Precio Total (MN)']],
        body: totalMaterials.map(m => [
            m.name,
            m.quantity.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2}),
            m.unit,
            `$${((m.unitPrice || 0) * exchangeRate).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`,
            `$${(m.quantity * (m.unitPrice || 0) * exchangeRate).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`
        ]),
        foot: [
            [{ content: 'Total Materiales Consolidados (USD)', colSpan: 4, styles: { halign: 'right', fontStyle: 'bold' } }, { content: `$${materialGrandTotal.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`, styles: { fontStyle: 'bold' } }],
            [{ content: 'Total Materiales Consolidados (MN)', colSpan: 4, styles: { halign: 'right', fontStyle: 'bold' } }, { content: `$${(materialGrandTotal * exchangeRate).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`, styles: { fontStyle: 'bold' } }]
        ],
        theme: 'striped',
        headStyles: { fillColor: [15, 118, 110], textColor: 255, fontSize: 9 },
        footStyles: { fillColor: [240, 249, 250], textColor: [15, 118, 110], fontSize: 9 },
        alternateRowStyles: { fillColor: [248, 250, 252] },
        margin: { left: 14, right: 14 }
    });

    // --- Page 4: Labor Summary Table ---
    doc.addPage();
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 41, 59);
    doc.text('Cómputo Técnico de Mano de Obra y Ejecución de Albañilería', 14, 20);
    
    (doc as any).autoTable({
        startY: 25,
        head: [['Actividad Constructiva', 'Volumen Estimado', 'Unidad', 'Tarifa Unitaria (MN)', 'Monto Parcial (MN)']],
        body: laborItems.map(item => [
            item.name,
            item.quantity.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2}),
            item.unit,
            `$${(item.unitPrice * exchangeRate).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`,
            `$${(item.quantity * item.unitPrice * exchangeRate).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`
        ]),
        foot: [
            [{ content: 'Total Costo Mano de Obra (USD)', colSpan: 4, styles: { halign: 'right', fontStyle: 'bold' } }, { content: `$${laborGrandTotal.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`, styles: { fontStyle: 'bold' } }],
            [{ content: 'Total Costo Mano de Obra (MN)', colSpan: 4, styles: { halign: 'right', fontStyle: 'bold' } }, { content: `$${(laborGrandTotal * exchangeRate).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`, styles: { fontStyle: 'bold' } }]
        ],
        theme: 'striped',
        headStyles: { fillColor: [15, 118, 110], textColor: 255, fontSize: 9 },
        footStyles: { fillColor: [240, 249, 250], textColor: [15, 118, 110], fontSize: 9 },
        alternateRowStyles: { fillColor: [248, 250, 252] },
        margin: { left: 14, right: 14 }
    });

    // --- Page 5: Budget / Logistics Charges Summary (if exist) ---
    if (budgetItems.length > 0) {
        doc.addPage();
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(30, 41, 59);
        doc.text('Costos Indirectos, Logísticos y Retenciones de Impuesto (Plan)', 14, 20);
        
        (doc as any).autoTable({
            startY: 25,
            head: [['Renglón / Categoría', 'Descripción detallada', 'Monto Incurrido (USD)', 'Monto Nacional (MN)']],
            body: budgetItems.map(item => [
                item.category,
                item.name,
                `$${item.cost.toLocaleString('en-US', {minimumFractionDigits: 2})}`,
                `$${(item.cost * exchangeRate).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`,
            ]),
            foot: [
                [{ content: 'Total Otros Gastos + Impuestos (USD)', colSpan: 3, styles: { halign: 'right', fontStyle: 'bold' } }, { content: `$${budgetGrandTotal.toLocaleString('en-US', {minimumFractionDigits: 2})}`, styles: { fontStyle: 'bold' } }],
                [{ content: 'Total Otros Gastos + Impuestos (MN)', colSpan: 3, styles: { halign: 'right', fontStyle: 'bold' } }, { content: `$${(budgetGrandTotal * exchangeRate).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`, styles: { fontStyle: 'bold' } }]
            ],
            theme: 'striped',
            headStyles: { fillColor: [15, 118, 110], textColor: 255, fontSize: 9 },
            footStyles: { fillColor: [240, 249, 250], textColor: [15, 118, 110], fontSize: 9 },
            alternateRowStyles: { fillColor: [248, 250, 252] },
            margin: { left: 14, right: 14 }
        });
    }

    // Apply header & footer overlays uniformly across all pages
    addPageOverlays(doc, `Reporte Consolidad: ${project.name}`, true);

    doc.save(`Habitex_Calcula_${project.name.replace(/\s/g, '_')}_${new Date().toISOString().slice(0,10)}.pdf`);
};

// --- Export Schedule to PDF ---
export const exportScheduleToPDF = (
    project: Project,
    scheduleItems: any[],
): void => {
    const { jsPDF } = jspdf;
    const doc = new jsPDF('l', 'mm', 'a4');

    const scheduleList = [...scheduleItems].sort((a, b) => parseLocalDate(a.startDate).getTime() - parseLocalDate(b.startDate).getTime());

    let minDate = new Date();
    let maxDate = new Date();
    if (scheduleList.length > 0) {
        minDate = parseLocalDate(Math.min(...scheduleList.map(item => parseLocalDate(item.startDate).getTime())));
        maxDate = parseLocalDate(Math.max(...scheduleList.map(item => parseLocalDate(item.endDate).getTime())));
    }

    const calendarDays = Math.max(1, Math.ceil((maxDate.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24)) + 1);
    const sumOfDurationDays = scheduleList.reduce((acc, item) => acc + (item.durationDays || 0), 0);

    // --- Page 1 Header ---
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 118, 110);
    doc.text(`Cronograma de Obra: ${project.name}`, 14, 18);

    // --- Project Summary Card ---
    doc.setFillColor(248, 250, 252); // slate-50
    doc.setDrawColor(226, 232, 240); // slate-200
    doc.setLineWidth(0.35);
    doc.roundedRect(14, 25, 269, 28, 2, 2, 'FD');

    // Left Accent Bar
    doc.setFillColor(15, 118, 110);
    doc.rect(14, 25, 3, 28, 'F');

    // Box Contents
    doc.setFontSize(9.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 118, 110);
    doc.text('RESUMEN GENERAL DEL PLAN DE TRABAJO', 21, 31);

    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);
    doc.text(`Fecha de Inicio: ${minDate.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}`, 21, 39);
    doc.text(`Fecha de Finalización: ${maxDate.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}`, 21, 46);

    doc.setFont('helvetica', 'bold');
    doc.text(`Duración de Ejecución: ${sumOfDurationDays} días hábiles`, 145, 39);
    doc.text(`Tiempo Calendario Transcurrido: ${calendarDays} días corridos`, 145, 46);

    // --- Activities Table ---
    (doc as any).autoTable({
        startY: 60,
        head: [['Actividad / Tarea de Mano de Obra', 'Inicio', 'Fin', 'Duración (días hábiles)']],
        body: scheduleList.map(item => [
            item.laborItem.name,
            parseLocalDate(item.startDate).toLocaleDateString('es-ES'),
            parseLocalDate(item.endDate).toLocaleDateString('es-ES'),
            `${item.durationDays} días`
        ]),
        foot: [['Total de Días de Mano de Obra', '', '', `${sumOfDurationDays} días hábiles`]],
        theme: 'striped',
        headStyles: { fillColor: [15, 118, 110], textColor: 255, fontStyle: 'bold', fontSize: 9 },
        bodyStyles: { fontSize: 8.5, textColor: [30, 41, 59] },
        footStyles: { fillColor: [241, 245, 249], textColor: [15, 118, 110], fontStyle: 'bold', fontSize: 9, lineWidth: 0.5, drawColor: [203, 213, 225] },
        margin: { left: 14, right: 14 }
    });

    // --- Page 2 & onwards: Elegant Gantt Chart ---
    if (scheduleList.length > 0) {
        const getMonday = (d: Date) => {
            const date = new Date(d);
            const day = date.getDay();
            const diff = date.getDate() - day + (day === 0 ? -6 : 1);
            return new Date(date.setDate(diff));
        };

        const getSunday = (d: Date) => {
            const date = new Date(d);
            const day = date.getDay();
            const diff = date.getDate() + (day === 0 ? 0 : 7 - day);
            return new Date(date.setDate(diff));
        };

        const ganttStartDate = getMonday(minDate);
        const ganttEndDate = getSunday(maxDate);
        const totalWeeks = Math.max(1, Math.ceil(((ganttEndDate.getTime() - ganttStartDate.getTime()) / (1000 * 60 * 60 * 24) + 1) / 7));

        doc.addPage('a4', 'l');

        // Draw Gantt header for first gantt page
        let currentY = 37;
        const ganttPageHeight = 195;
        const rowHeight = 11;
        const wWeek = 199 / totalWeeks;

        const drawGanttHeaders = (pageTitle: string) => {
            doc.setFontSize(14);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(15, 118, 110);
            doc.text(pageTitle, 14, 15);

            // Columns layout: Actividad (70mm), Weeks (199mm). Total: 269mm. Margins: 14mm to 283mm.
            // Weeks Headers
            for (let w = 0; w < totalWeeks; w++) {
                const weekStart = new Date(ganttStartDate);
                weekStart.setDate(weekStart.getDate() + w * 7);
                const weekEnd = new Date(weekStart);
                weekEnd.setDate(weekEnd.getDate() + 6);

                const xWeek = 84 + w * wWeek;
                doc.setFillColor(241, 245, 249);
                doc.setDrawColor(203, 213, 225);
                doc.setLineWidth(0.2);
                doc.rect(xWeek, 23, wWeek, 12, 'FD');

                // Semana Title
                doc.setFontSize(7.5);
                doc.setFont('helvetica', 'bold');
                doc.setTextColor(51, 65, 85);
                doc.text(`Semana ${w + 1}`, xWeek + wWeek / 2, 28, { align: 'center' });

                // Weeks Dates
                doc.setFontSize(6);
                doc.setFont('helvetica', 'normal');
                doc.setTextColor(100, 116, 139);
                const rangeStr = `${weekStart.getDate()}/${weekStart.getMonth() + 1} - ${weekEnd.getDate()}/${weekEnd.getMonth() + 1}`;
                doc.text(rangeStr, xWeek + wWeek / 2, 32, { align: 'center' });
            }

            // Actividad Header
            doc.setFillColor(241, 245, 249);
            doc.setDrawColor(203, 213, 225);
            doc.rect(14, 23, 70, 12, 'FD');
            doc.setFontSize(8.5);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(51, 65, 85);
            doc.text('Actividad / Tarea', 17, 30);
        };

        drawGanttHeaders(`DIAGRAMA DE GANTT (PLANIFICACIÓN SEMANAL)`);

        const pageBars: Record<number, { xEnd: number; yMid: number }> = {};

        scheduleList.forEach((item, index) => {
            if (currentY + rowHeight > ganttPageHeight) {
                doc.addPage('a4', 'l');
                drawGanttHeaders(`DIAGRAMA DE GANTT (PLANIFICACIÓN SEMANAL) - Cont.`);
                currentY = 37;
                // Clear pageBars coordinates for the new page since drawing canvas is reset
                Object.keys(pageBars).forEach(k => delete pageBars[Number(k)]);
            }

            // Alternating row background
            doc.setFillColor(index % 2 === 0 ? 255 : 252, index % 2 === 0 ? 255 : 252, index % 2 === 0 ? 255 : 252);
            doc.setDrawColor(226, 232, 240);
            doc.setLineWidth(0.15);
            doc.rect(14, currentY, 269, rowHeight, 'FD');

            // Activity Text Name
            doc.setFontSize(7.5);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(15, 118, 110);
            let actName = item.laborItem.name;
            if (actName.length > 34) {
                actName = actName.substring(0, 32) + '...';
            }
            doc.text(actName, 17, currentY + 6.5);

            // Vertical line dividing text col and schedule
            doc.setDrawColor(203, 213, 225);
            doc.setLineWidth(0.25);
            doc.line(84, currentY, 84, currentY + rowHeight);

            // Grid vertical line separator for weeks
            doc.setDrawColor(241, 245, 249);
            doc.setLineWidth(0.15);
            for (let w = 1; w < totalWeeks; w++) {
                const xGrid = 84 + w * wWeek;
                doc.line(xGrid, currentY, xGrid, currentY + rowHeight);
            }

            // Calculate precise bar sizing
            const totalProjectDays = (ganttEndDate.getTime() - ganttStartDate.getTime()) / (1000 * 60 * 60 * 24) + 1;
            const startDiffDays = (parseLocalDate(item.startDate).getTime() - ganttStartDate.getTime()) / (1000 * 60 * 60 * 24);
            const endDiffDays = (parseLocalDate(item.endDate).getTime() - ganttStartDate.getTime()) / (1000 * 60 * 60 * 24) + 1;

            const xBarStart = 84 + (startDiffDays / totalProjectDays) * 199;
            const xBarEnd = 84 + (endDiffDays / totalProjectDays) * 199;
            let barWidth = xBarEnd - xBarStart;
            if (barWidth < 2) barWidth = 2;

            const yBar = currentY + 3;
            const hBar = 5;
            const yMid = yBar + hBar / 2;

            // Draw Activity Bar (Elegant Soft Rounded teal bar)
            doc.setFillColor(15, 118, 110);
            doc.roundedRect(xBarStart, yBar, barWidth, hBar, 1, 1, 'F');

            // Bar duration label
            doc.setFontSize(6);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(255, 255, 255);
            const durationLabel = `${item.durationDays}d`;

            if (barWidth > 9) {
                doc.text(durationLabel, xBarStart + barWidth / 2, yBar + 3.5, { align: 'center' });
            } else {
                doc.setTextColor(71, 85, 105);
                doc.text(durationLabel, xBarStart + barWidth + 1.2, yBar + 3.5);
            }

            // Draw Fin-Inicio Dependency Connection Line (Codo en S/Z con micro flecha)
            if (item.predecessorId && pageBars[item.predecessorId]) {
                const pred = pageBars[item.predecessorId];
                doc.setDrawColor(2, 132, 199); // Sky blue
                doc.setLineWidth(0.35);

                const xPrev = pred.xEnd;
                const yPrev = pred.yMid;
                const xCurr = xBarStart;
                const yCurr = yMid;

                // Dynamic codo calculation
                const minExit = 3; // mm
                if (xCurr >= xPrev + minExit) {
                    // Normal: successor starts after predecessor ends
                    const xMid = xPrev + (xCurr - xPrev) / 2;
                    doc.line(xPrev, yPrev, xMid, yPrev);
                    doc.line(xMid, yPrev, xMid, yCurr);
                    doc.line(xMid, yCurr, xCurr, yCurr);
                } else {
                    // Overlap: successor starts before predecessor ends (loop back path)
                    const exitX = xPrev + minExit;
                    const entryX = xCurr - minExit;
                    const midY = yPrev + (yCurr - yPrev) / 2;
                    doc.line(xPrev, yPrev, exitX, yPrev);
                    doc.line(exitX, yPrev, exitX, midY);
                    doc.line(exitX, midY, entryX, midY);
                    doc.line(entryX, midY, entryX, yCurr);
                    doc.line(entryX, yCurr, xCurr, yCurr);
                }

                // Small triangle arrow tip
                doc.setFillColor(2, 132, 199);
                doc.triangle(xCurr, yCurr, xCurr - 1.2, yCurr - 0.8, xCurr - 1.2, yCurr + 0.8, 'F');
            }

            // Save coords for next activity connection
            pageBars[item.id] = {
                xEnd: xBarEnd,
                yMid: yMid
            };

            currentY += rowHeight;
        });
    }

    doc.save(`Cronograma_${project.name.replace(/\s/g, '_')}_${new Date().toISOString().slice(0, 10)}.pdf`);
};

// --- Export Invoice To PDF ---
export const exportInvoiceToPDF = (data: InvoiceData): Blob => {
    const {
        project, companyInfo, invoiceInfo, billableItems,
        invoiceTotal, exchangeRate
    } = data;

    const { jsPDF } = jspdf;
    const doc = new jsPDF();
    const pageHeight = doc.internal.pageSize.height;
    let y = 18;

    // --- Header Branding Block ---
    // Left: Company identifier
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 118, 110); // Habitex Teal-700
    doc.text(companyInfo.name.toUpperCase(), 14, y);
    
    // Right: Large Document Title
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 41, 59); // Slate-800
    doc.text('FACTURA', 196, y + 2, { align: 'right' });
    y += 10;

    // Left info (address) & Right info (invoice metadata)
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139); // Slate-500
    
    const addressLines = doc.splitTextToSize(companyInfo.address, 90);
    doc.text(addressLines, 14, y);
    
    // Metadata column on the right
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(51, 65, 85);
    doc.text('Factura Nº:', 140, y);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(15, 118, 110);
    doc.text(invoiceInfo.invoiceNumber, 196, y, { align: 'right' });
    y += 5.5;
    
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(51, 65, 85);
    doc.text('Fecha Factura:', 140, y);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text(parseLocalDate(invoiceInfo.date).toLocaleDateString(), 196, y, { align: 'right' });
    y += 5.5;

    // Explicit Due Date Calculation (Default to 15 Days payment term)
    const issueDate = parseLocalDate(invoiceInfo.date);
    const dueDate = new Date(issueDate.getTime() + 15 * 24 * 60 * 60 * 1000);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(51, 65, 85);
    doc.text('Vencimiento:', 140, y);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text(dueDate.toLocaleDateString(), 196, y, { align: 'right' });
    y += 5.5;
    
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(51, 65, 85);
    doc.text('Teléfono:', 140, y);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text(companyInfo.phone, 196, y, { align: 'right' });

    y = Math.max(y + 12, 18 + 10 + (addressLines.length * 4) + 6);

    // --- Boxed Client / Billing Panel ---
    doc.setFillColor(248, 250, 252); // grey-50
    doc.setDrawColor(226, 232, 240); // slate-200
    doc.setLineWidth(0.4);
    doc.roundedRect(14, y, 182, 32, 2.5, 2.5, 'FD');

    // Panel content structure
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(100, 116, 139);
    doc.text('FACTURAR A:', 20, y + 8);
    doc.text('DESCRIPCION DE OBRA / REFERENCIA:', 110, y + 8);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 41, 59);
    doc.text(invoiceInfo.clientName.toUpperCase(), 20, y + 14);
    
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);
    if (invoiceInfo.clientAddress) {
        const clientAddrLines = doc.splitTextToSize(invoiceInfo.clientAddress, 80);
        doc.text(clientAddrLines, 20, y + 19);
    } else {
        doc.text('Cliente registrado', 20, y + 19);
    }

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 41, 59);
    doc.text(project.name.toUpperCase(), 110, y + 14);
    
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text(`Ubicación: ${project.location || 'No declarada'}`, 110, y + 19);
    doc.text(`Estado del Proyecto: ${project.status || 'Activo'}`, 110, y + 24);

    y += 40;

    // --- Invoice Billing Details Table ---
    let finalY = y;
    (doc as any).autoTable({
        startY: y,
        head: [['Descripción del Concepto Técnico / Item de Obra', 'Cant.', 'Unidad', 'Precio Unit. (MN)', 'Importe Parcial (MN)']],
        body: billableItems.map(item => [
            item.description,
            item.quantity.toLocaleString('en-US', {minimumFractionDigits: 1}),
            item.unit,
            `$${(item.unitPrice * exchangeRate).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`,
            `$${(item.total * exchangeRate).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`
        ]),
        theme: 'striped',
        headStyles: { fillColor: [15, 118, 110], textColor: 255, fontSize: 9.5, fontStyle: 'bold' },
        alternateRowStyles: { fillColor: [248, 250, 252] },
        didDrawPage: (data: any) => {
            finalY = data.cursor.y;
        }
    });
    y = finalY;
    
    if (y > pageHeight - 75) {
        doc.addPage();
        y = 20;
    }

    // --- High-Contract Totals Block (Right Aligned) ---
    y += 10;
    const totalsCardX = 96; // Shifted left from 120 to 96 to provide extra horizontal spacing
    const totalsW = 100;    // Widened from 76 to 100 to prevent overlap of large CUP amounts
    const totalsH = 26;
    doc.setFillColor(240, 249, 250); // Light Cyan fill
    doc.setDrawColor(15, 118, 110);   // Teal perimeter
    doc.setLineWidth(0.5);
    doc.roundedRect(totalsCardX, y, totalsW, totalsH, 2, 2, 'FD');

    // Prepare formatted amount strings
    const amountMnStr = `$${(invoiceTotal * exchangeRate).toLocaleString('en-US', {minimumFractionDigits: 2})}`;
    const amountUsdStr = `$${invoiceTotal.toLocaleString('en-US', {minimumFractionDigits: 2})}`;

    // Dynamically adjust font size for extremely large currency amounts
    let amountMnFontSize = 13;
    if (amountMnStr.length > 15) {
        amountMnFontSize = 9.5;
    } else if (amountMnStr.length > 12) {
        amountMnFontSize = 11;
    }

    let amountUsdFontSize = 11;
    if (amountUsdStr.length > 15) {
        amountUsdFontSize = 8.5;
    } else if (amountUsdStr.length > 12) {
        amountUsdFontSize = 9.5;
    }

    // Totals text layout
    doc.setFontSize(9.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(51, 65, 85);
    doc.text('TOTAL NETO A PAGAR (MN):', totalsCardX + 5, y + 8);
    doc.text('Importe Equivalente (USD):', totalsCardX + 5, y + 18);

    doc.setFontSize(amountMnFontSize);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 118, 110); // Heavy Teal
    doc.text(amountMnStr, totalsCardX + totalsW - 5, y + 8, { align: 'right' });
    
    doc.setFontSize(amountUsdFontSize);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text(amountUsdStr, totalsCardX + totalsW - 5, y + 18, { align: 'right' });

    y += 35;

    // --- Bank Details and Terms of Agreement Placeholder ---
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 41, 59);
    doc.text('INSTRUCCIONES ADMINISTRATIVAS DE PAGO:', 14, y);
    y += 5;
    
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text('1. El abono puede realizarse mediante transferencia bancaria habitual o depósito en efectivo en caja.', 14, y);
    y += 4.5;
    doc.text('2. Por favor, remita una copia digitalizada del comprobante de transferencia al emisor.', 14, y);

    // --- Emisor Signature and Title Details ---
    const signatureY = pageHeight - 45;
    
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);

    // Ruler line
    doc.setDrawColor(203, 213, 225);
    doc.setLineWidth(0.4);
    doc.line(14, signatureY, 84, signatureY); 
    
    let sigY = signatureY + 5;
    doc.setFont('helvetica', 'bold');
    doc.text(invoiceInfo.signerName, 14, sigY);
    sigY += 4.5;
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(8);
    doc.text(invoiceInfo.signerTitle, 14, sigY);

    // Inject running layout variables on all pages
    addPageOverlays(doc, `Factura ${invoiceInfo.invoiceNumber}`, true);

    return doc.output('blob');
};

// --- Custom Add Signature & Footer for Commercial Proposal ---
const addOfferSignatureAndFooter = (doc: any, offerInfo: OfferData['offerInfo']) => {
    const pageHeight = doc.internal.pageSize.height;
    const pageCount = doc.internal.getNumberOfPages();
    doc.setPage(pageCount); // Switch control context to the last page

    const signatureY = pageHeight - 48;
    
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);

    // Terms and Conditions highlighting boxed panel
    const termsY = signatureY - 24;
    doc.setFillColor(240, 249, 250); // soft teal hue
    doc.setDrawColor(186, 230, 253); // borders (azure-200)
    doc.roundedRect(14, termsY, 182, 14, 2, 2, 'FD');
    
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 118, 110);
    doc.text('CONDICIONES GENERALES Y ACUERDO:', 18, termsY + 5);
    
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    const footerText = `Validez: Propuesta vigente por ${offerInfo.validityDays} días. Forma de pago: 50% anticipo de replanteo y acopio, 50% según certificaciones de avance de obra.`;
    doc.text(footerText, 18, termsY + 9);

    // Signature Line
    doc.setDrawColor(203, 213, 225);
    doc.setLineWidth(0.4);
    doc.line(14, signatureY + 8, 84, signatureY + 8);
    
    let sigY = signatureY + 13;
    doc.setFontSize(9.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 41, 59);
    doc.text(offerInfo.signerName, 14, sigY);
    
    sigY += 4.5;
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(8);
    doc.text(offerInfo.signerTitle, 14, sigY);
};

// --- Custom Initialization Layout for Commercial offers ---
const generateOfferPDFBase = (doc: any, data: OfferData) => {
    const { project, offerInfo, companyInfo } = data;
    let y = 18;

    // Corporate Brand Identifier (Left)
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 118, 110); // Custom heavy teal
    doc.text(companyInfo.name.toUpperCase(), 14, y);
    
    // Proposal Designation (Right)
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 41, 59); // slate-800
    doc.text('PROPUESTA COMERCIAL', 196, y + 2, { align: 'right' });
    y += 10;

    // Contact Coordinates
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    
    const addressLines = doc.splitTextToSize(companyInfo.address, 90);
    doc.text(addressLines, 14, y);
    
    // Document identification variables
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(51, 65, 85);
    doc.text('Oferta #:', 140, y);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(15, 118, 110);
    doc.text(offerInfo.offerNumber, 196, y, { align: 'right' });
    y += 5.5;
    
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(51, 65, 85);
    doc.text('Fecha Propuesta:', 140, y);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text(parseLocalDate(offerInfo.date).toLocaleDateString(), 196, y, { align: 'right' });
    y += 5.5;

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(51, 65, 85);
    doc.text('Contacto:', 140, y);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text(companyInfo.phone, 196, y, { align: 'right' });

    y = Math.max(y + 14, 18 + 10 + (addressLines.length * 4) + 6);

    // --- Boxed Panel for Client Reference ---
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.4);
    doc.roundedRect(14, y, 182, 26, 2, 2, 'FD');

    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(100, 116, 139);
    doc.text('PROPUESTA EMITIDA PARA CLIENTE:', 20, y + 8);
    doc.text('DENOMINACIÓN DE OBRA:', 110, y + 8);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 41, 59);
    doc.text(offerInfo.clientName.toUpperCase(), 20, y + 14);
    
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);
    if (offerInfo.clientAddress) {
        doc.text(offerInfo.clientAddress, 20, y + 19);
    } else {
        doc.text('Cliente verificado', 20, y + 19);
    }

    doc.text(project.name.toUpperCase(), 110, y + 14);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text(`Ubicación planificada: ${project.location || 'No declarada'}`, 110, y + 19);

    y += 34;

    // --- Introductory greeting text with stylish left decorative colored boundary line ---
    doc.setDrawColor(15, 118, 110); // Custom teal heavy line
    doc.setLineWidth(1.5);
    doc.line(14, y, 14, y + 25);
    
    doc.setFontSize(9.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(51, 65, 85);
    const introText = `Agradecemos de antemano el honor de presentarle nuestra propuesta técnica de construcción para el proyecto "${project.name}". Hemos desarrollado este presupuesto mediante un riguroso cómputo de mediciones, seleccionando materiales de primera línea y mano de obra experimentada, asegurando una ejecución impecable y la máxima rentabilidad en base a sus directivas de alcance.`;
    const splitIntro = doc.splitTextToSize(introText, 174);
    doc.text(splitIntro, 18, y + 4);
    
    y += 32;
    return y;
};

// --- Custom Closing Remarks Block ---
const addClosingRemarks = (doc: any, startY: number) => {
    let y = startY;
    const pageHeight = doc.internal.pageSize.height;
    
    if (y > pageHeight - 65) {
        doc.addPage();
        y = 20;
    }

    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 41, 59);
    doc.text('Alcance de la Propuesta y Próximos Pasos', 14, y);
    y += 6;

    doc.setFontSize(9.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);
    const closingText = `La presente propuesta contempla el suministro integral de la materia prima, la ejecución técnica de las cuadrillas bajo supervisión especializada, y todos los resguardos necesarios de seguridad ocupacional.\n\nPara continuar con los preparativos de inicio, le sugerimos revisar este presupuesto. Una vez otorgada su conformidad, elaboraremos el correspondiente pliego del contrato legal e iniciaremos las coordinaciones logísticas pertinentes para el replanteo físico.`;
    const splitText = doc.splitTextToSize(closingText, 182);
    doc.text(splitText, 14, y);
};

// --- Export Offer (Fixed Price Option) ---
export const exportOfferFixedPriceToPDF = (data: OfferData): void => {
    const { jsPDF } = jspdf;
    const doc = new jsPDF();
    let y = generateOfferPDFBase(doc, data);
    const { totals, exchangeRate } = data;

    y += 10;
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(100, 116, 139);
    doc.text('PROPUESTA ECONÓMICA LLAVE EN MANO (PRECIO CERRADO)', 14, y);
    y += 8;

    // Prominent bold totals highlighting card
    doc.setFillColor(240, 249, 250);
    doc.setDrawColor(15, 118, 110);
    doc.setLineWidth(0.4);
    doc.roundedRect(14, y, 182, 22, 2, 2, 'FD');

    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(51, 65, 85);
    doc.text('PRECIO TOTAL CONTRATADO:', 20, y + 8);
    doc.text('Monto Equivalente Proyectado (USD):', 20, y + 16);

    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 118, 110);
    doc.text(`$${(totals.grandTotal * exchangeRate).toLocaleString('en-US', { minimumFractionDigits: 2 })} MN`, 190, y + 9, { align: 'right' });
    
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text(`$${totals.grandTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })} USD`, 190, y + 16, { align: 'right' });
    
    y += 28;

    if (data.scheduleMetrics) {
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(100, 116, 139);
        doc.text('PLANIFICACIÓN Y FUERZA DE TRABAJO ESTIMADA', 14, y);
        y += 6;

        doc.setFillColor(250, 250, 250);
        doc.setDrawColor(218, 226, 230);
        doc.setLineWidth(0.3);
        doc.roundedRect(14, y, 182, 24, 1.5, 1.5, 'FD');

        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(71, 85, 105);
        
        doc.text('Duración de Obra:', 20, y + 8);
        doc.setFont('helvetica', 'normal');
        doc.text(`${data.scheduleMetrics.totalDurationDays} días de trabajo`, 56, y + 8);

        doc.setFont('helvetica', 'bold');
        doc.text('Tiempo Faltante:', 20, y + 16);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(15, 118, 110);
        doc.text(`${data.scheduleMetrics.remainingDurationDays} días por ejecutar`, 56, y + 16);
        doc.setTextColor(71, 85, 105);

        doc.setFont('helvetica', 'bold');
        doc.text('Cuadrilla Promedio:', 110, y + 8);
        doc.setFont('helvetica', 'normal');
        doc.text(`${data.scheduleMetrics.avgWorkers} obreros`, 148, y + 8);

        doc.setFont('helvetica', 'bold');
        doc.text('Personal Máximo:', 110, y + 16);
        doc.setFont('helvetica', 'normal');
        doc.text(`${data.scheduleMetrics.maxWorkers} obreros (Pico)`, 148, y + 16);

        y += 34;
    } else {
        y += 6;
    }
    
    addClosingRemarks(doc, y);
    addOfferSignatureAndFooter(doc, data.offerInfo);

    // Dynamic overlay for running headers
    addPageOverlays(doc, `Oferta de Precio Cerrado #${data.offerInfo.offerNumber}`, true);

    doc.save(`Oferta_Fija_${data.offerInfo.offerNumber}_${data.project.name.replace(/\s/g, '_')}.pdf`);
};

// --- Export Offer (Detailed Estimation Option) ---
export const exportOfferDetailedToPDF = (data: OfferData): void => {
    const { jsPDF } = jspdf;
    const doc = new jsPDF();
    let y = generateOfferPDFBase(doc, data);
    const { totals, exchangeRate, laborItems, materials, budgetItems } = data;
    let lastY = y + 10;

    const getUSD = (usdValue: number) => `$${usdValue.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
    const getMN = (usdValue: number) => `$${(usdValue * exchangeRate).toLocaleString('en-US', { minimumFractionDigits: 2 })}`;

    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 41, 59);
    doc.text('Desglose General y Computo de Mediciones', 14, lastY);
    lastY += 8;

    if (data.scheduleMetrics) {
        doc.setFillColor(250, 250, 250);
        doc.setDrawColor(218, 226, 230);
        doc.setLineWidth(0.3);
        doc.roundedRect(14, lastY, 182, 22, 1.5, 1.5, 'FD');

        doc.setFontSize(8.5);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(100, 116, 139);
        doc.text('RESUMEN DE TIEMPO Y FUERZA DE TRABAJO:', 20, lastY + 6);

        doc.setFontSize(9.5);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(51, 65, 85);
        doc.text('Duración de Obra:', 20, lastY + 14);
        doc.setFont('helvetica', 'normal');
        doc.text(`${data.scheduleMetrics.totalDurationDays} días total`, 54, lastY + 14);

        doc.setFont('helvetica', 'bold');
        doc.text('Tiempo Faltante:', 86, lastY + 14);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(15, 118, 110);
        doc.text(`${data.scheduleMetrics.remainingDurationDays} días`, 116, lastY + 14);
        doc.setTextColor(51, 65, 85);

        doc.setFont('helvetica', 'bold');
        doc.text('Cuadrilla:', 148, lastY + 14);
        doc.setFont('helvetica', 'normal');
        doc.text(`${data.scheduleMetrics.avgWorkers} obreros prom.`, 166, lastY + 14);

        lastY += 28;
    }

    // --- 1. Labor Table ---
    if (laborItems.length > 0) {
        doc.setFontSize(10.5);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(15, 118, 110);
        doc.text('1. Computo Estimado de Ejecución y Mano de Obra', 14, lastY);
        
        (doc as any).autoTable({
            startY: lastY + 3,
            head: [['Actividad Albañilería', 'Cuadrilla', 'Volumen Cant.', 'Unidad', 'Precio Unit. (MN)', 'Importe Parcial (MN)']],
            body: laborItems.map(item => [
                item.name,
                `${item.scheduleWorkers ?? 2} obreros`,
                item.quantity.toLocaleString('en-US', { maximumFractionDigits: 2 }),
                item.unit,
                (item.unitPrice * exchangeRate).toLocaleString('en-US', { minimumFractionDigits: 2 }),
                (item.quantity * item.unitPrice * exchangeRate).toLocaleString('en-US', { minimumFractionDigits: 2 })
            ]),
            foot: [
                [{ content: 'Total Estimado de Mano de Obra (MN)', colSpan: 5, styles: { halign: 'right', fontStyle: 'bold' } }, { content: getMN(totals.labor), styles: { fontStyle: 'bold' } }]
            ],
            theme: 'striped',
            headStyles: { fillColor: [15, 118, 110], textColor: 255, fontSize: 8.5 },
            footStyles: { fillColor: [240, 249, 250], textColor: [15, 118, 110], fontSize: 8.5 },
            alternateRowStyles: { fillColor: [248, 250, 252] },
            margin: { left: 14, right: 14 },
            didDrawPage: (data: any) => { lastY = data.cursor.y; }
        });
        lastY = (doc as any).lastAutoTable.finalY + 10;
    }

    // --- Add Schedule Table ---
    if (data.scheduleItems) {
        if (lastY > doc.internal.pageSize.height - 50) {
            doc.addPage();
            lastY = 20;
        }
        doc.setFontSize(10.5);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(15, 118, 110);
        doc.text('1.2 Cronograma Estimado de Actividades', 14, lastY);
        
        const scheduleList = Object.values(data.scheduleItems).sort((a, b) => a.startDate.getTime() - b.startDate.getTime());

        (doc as any).autoTable({
            startY: lastY + 3,
            head: [['Actividad', 'Inicio', 'Fin', 'Duración (días hábiles)']],
            body: scheduleList.map(item => [
                item.laborItem.name,
                item.startDate.toLocaleDateString('es-ES'),
                item.endDate.toLocaleDateString('es-ES'),
                item.durationDays
            ]),
            theme: 'striped',
            headStyles: { fillColor: [15, 118, 110], textColor: 255, fontSize: 8.5 },
            alternateRowStyles: { fillColor: [248, 250, 252] },
            margin: { left: 14, right: 14 },
            didDrawPage: (data: any) => { lastY = data.cursor.y; }
        });
        lastY = (doc as any).lastAutoTable.finalY + 10;
    }

    // --- 2. Materials Table ---
    if (materials.length > 0) {
        if (lastY > doc.internal.pageSize.height - 40) {
            doc.addPage();
            lastY = 20;
        }
        doc.setFontSize(10.5);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(15, 118, 110);
        doc.text('2. Aprovisionamiento e Insumos Físicos de Obra', 14, lastY);
        
        (doc as any).autoTable({
            startY: lastY + 3,
            head: [['Especificación de Material', 'Cantidad Requerida', 'Unidad', 'Precio Unitario (MN)', 'Total Estimado (MN)']],
            body: materials.map(m => [
                m.name,
                m.quantity.toLocaleString('en-US', { maximumFractionDigits: 2 }),
                m.unit,
                ((m.unitPrice || 0) * exchangeRate).toLocaleString('en-US', { minimumFractionDigits: 2 }),
                (m.quantity * (m.unitPrice || 0) * exchangeRate).toLocaleString('en-US', { minimumFractionDigits: 2 })
            ]),
            foot: [
                [{ content: 'Total Suministros Estimados (MN)', colSpan: 4, styles: { halign: 'right', fontStyle: 'bold' } }, { content: getMN(totals.material), styles: { fontStyle: 'bold' } }]
            ],
            theme: 'striped',
            headStyles: { fillColor: [15, 118, 110], textColor: 255, fontSize: 8.5 },
            footStyles: { fillColor: [240, 249, 250], textColor: [15, 118, 110], fontSize: 8.5 },
            alternateRowStyles: { fillColor: [248, 250, 252] },
            margin: { left: 14, right: 14 },
            didDrawPage: (data: any) => { lastY = data.cursor.y; }
        });
        lastY = (doc as any).lastAutoTable.finalY + 10;
    }

    // --- 3. Other Expenses Table ---
    if (budgetItems.length > 0) {
        if (lastY > doc.internal.pageSize.height - 40) {
            doc.addPage();
            lastY = 20;
        }
        doc.setFontSize(10.5);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(15, 118, 110);
        doc.text('3. Costos de Administración, Logística Indirecta e Impuestos', 14, lastY);
        
        (doc as any).autoTable({
            startY: lastY + 3,
            head: [['Categoría Gasto', 'Concepto / Descripción', 'Monto Estimado (MN)']],
            body: budgetItems.map(item => [
                item.category,
                item.name,
                (item.cost * exchangeRate).toLocaleString('en-US', { minimumFractionDigits: 2 }),
            ]),
            foot: [
                [{ content: 'Total Otros Gastos Consolidado (MN)', colSpan: 2, styles: { halign: 'right', fontStyle: 'bold' } }, { content: getMN(totals.budget + totals.serviceTax), styles: { fontStyle: 'bold' } }]
            ],
            theme: 'striped',
            headStyles: { fillColor: [15, 118, 110], textColor: 255, fontSize: 8.5 },
            footStyles: { fillColor: [240, 249, 250], textColor: [15, 118, 110], fontSize: 8.5 },
            alternateRowStyles: { fillColor: [248, 250, 252] },
            margin: { left: 14, right: 14 },
            didDrawPage: (data: any) => { lastY = data.cursor.y; }
        });
        lastY = (doc as any).lastAutoTable.finalY + 10;
    }

    // --- 4. Grand Consolidated Summary Panel ---
    if (lastY > doc.internal.pageSize.height - 55) {
        doc.addPage();
        lastY = 20;
    }
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 41, 59);
    doc.text('4. Resumen Consolidado de Asignación Física', 14, lastY);
    
    const summaryBody = [
        ['Sumatoria Suministro de Materiales', getMN(totals.material), getUSD(totals.material)],
        ['Sumatoria Mano de Obra (Cuadrillas)', getMN(totals.labor), getUSD(totals.labor)],
        ['Sumatoria Gastos Logísticos/Indirectos', getMN(totals.budget), getUSD(totals.budget)],
    ];
    if (totals.serviceTax > 0) {
        summaryBody.push(['Impuesto sobre Ejecución Comercial', getMN(totals.serviceTax), getUSD(totals.serviceTax)]);
    }

    (doc as any).autoTable({
        startY: lastY + 4,
        head: [['Desglose Concepto Consolidado', 'Importe Total (MN)', 'Importe Equivalente (USD)']],
        body: summaryBody,
        foot: [
            [{ content: 'PRECIO TOTAL INTEGRAL ESTIMADO OCUPACIONAL', styles: { fontStyle: 'bold' } },
             { content: getMN(totals.grandTotal), styles: { fontStyle: 'bold' } },
             { content: getUSD(totals.grandTotal), styles: { fontStyle: 'bold' } }]
        ],
        theme: 'grid',
        headStyles: { fillColor: [15, 118, 110], textColor: 255, fontSize: 9 },
        footStyles: { fillColor: [240, 249, 250], textColor: [15, 118, 110], fontSize: 10, fontStyle: 'bold' },
        margin: { left: 14, right: 14 },
        didDrawPage: (data: any) => { lastY = data.cursor.y; }
    });
    lastY = (doc as any).lastAutoTable.finalY + 14;

    addClosingRemarks(doc, lastY);
    addOfferSignatureAndFooter(doc, data.offerInfo);
    
    // Inject dynamic running header/footers 
    addPageOverlays(doc, `Oferta Detallada #${data.offerInfo.offerNumber}`, true);

    doc.save(`Oferta_Detallada_${data.offerInfo.offerNumber}_${data.project.name.replace(/\s/g, '_')}.pdf`);
};

export const exportCertificationToPDF = (
    project: Project,
    cert: Certification,
    prevCert: Certification | null,
    displayCurrency: 'CUP' | 'USD',
    exchangeRate: number
): void => {
    const { jsPDF } = jspdf;
    const doc = new jsPDF();
    const pageHeight = doc.internal.pageSize.height;
    const pageWidth = doc.internal.pageSize.width;
    const rate = exchangeRate;

    const formatAmount = (val: number) => {
        const amt = displayCurrency === 'CUP' ? val * rate : val;
        return `$${amt.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${displayCurrency}`;
    };

    const formatQty = (val: number) => {
        return val.toLocaleString('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 2 });
    };

    // --- Elegant Page Header Banner ---
    doc.setFillColor(15, 118, 110); // Corporate teal-700
    doc.rect(14, 16, pageWidth - 28, 24, 'F');
    
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 255, 255);
    doc.text('HABITEX CALCULA  •  CERTIFICACIÓN DE AVANCE DE OBRA', 20, 24);
    
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 255, 255);
    doc.text(cert.name.toUpperCase(), 20, 32);

    let y = 50;

    // --- Meta Details ---
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 41, 59);
    doc.text('INFORMACIÓN DE LA CERTIFICACIÓN', 14, y);
    y += 4;
    
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.4);
    doc.line(14, y, pageWidth - 14, y);
    y += 6;

    // Left Column
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(71, 85, 105);
    doc.text('Proyecto:', 14, y);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text(project.name, 35, y);

    // Right Column
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(71, 85, 105);
    doc.text('Fecha Emisión:', 110, y);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text(parseLocalDate(cert.certifiedAt).toLocaleDateString(), 140, y);
    y += 6;

    // Left Column
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(71, 85, 105);
    doc.text('Cliente:', 14, y);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text(project.clientName || 'No especificado', 35, y);

    // Right Column
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(71, 85, 105);
    doc.text('Moneda / Tasa:', 110, y);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text(`${displayCurrency} (Tasa: 1 USD = ${rate} CUP)`, 140, y);
    y += 10;

    // --- Metric Cards (Page 1) ---
    const cardW = (pageWidth - 36) / 3;
    const cardH = 24;

    const drawSummaryCard = (x: number, title: string, subtitle: string, value: string) => {
        doc.setFillColor(248, 250, 252); // slate-50
        doc.setDrawColor(226, 232, 240); // slate-200
        doc.setLineWidth(0.3);
        doc.roundedRect(x, y, cardW, cardH, 2, 2, 'FD');

        doc.setFillColor(15, 118, 110); // teal-600 indicator
        doc.rect(x, y, 2, cardH, 'F');

        doc.setFontSize(7.5);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(100, 116, 139);
        doc.text(title.toUpperCase(), x + 5, y + 6);

        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(15, 118, 110);
        doc.text(value, x + 5, y + 13);

        doc.setFontSize(7);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(148, 163, 184);
        doc.text(subtitle, x + 5, y + 19);
    };

    const accumValue = cert.snapshot.grandTotal;
    const prevValue = prevCert ? prevCert.snapshot.grandTotal : 0;
    const periodValue = cert.snapshot.incrementalValue;

    drawSummaryCard(14, 'Valor Acumulado Anterior', 'Certificado previamente', formatAmount(prevValue));
    drawSummaryCard(14 + cardW + 4, 'Ejecutado del Periodo', 'Avance bruto de esta etapa', formatAmount(periodValue));
    drawSummaryCard(14 + (cardW + 4) * 2, 'Valor Acumulado Actual', 'Total ejecutado a la fecha', formatAmount(accumValue));
    y += cardH + 10;

    // --- Table 1: Resumen de Ejecución Financiera Acumulada ---
    doc.setFontSize(10.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 41, 59);
    doc.text('RESUMEN DE EJECUCIÓN FINANCIERA', 14, y);
    y += 4;

    const summaryRows = [
        [
            '1. Valor Bruto de Obra Ejecutada',
            formatAmount(prevValue),
            formatAmount(periodValue),
            formatAmount(accumValue)
        ],
        [
            '2. Descuento de Anticipo Proporcional',
            formatAmount(prevCert ? prevCert.snapshot.cumulativeAnticipoDeducted : 0),
            formatAmount(cert.snapshot.anticipoDeduction),
            formatAmount(cert.snapshot.cumulativeAnticipoDeducted)
        ],
        [
            '3. Neto Facturable / Cobrable',
            formatAmount(prevCert ? prevCert.snapshot.cumulativeNetBillable - prevCert.snapshot.finalBillableAmount : 0),
            formatAmount(cert.snapshot.finalBillableAmount),
            formatAmount(cert.snapshot.cumulativeNetBillable)
        ]
    ];

    (doc as any).autoTable({
        startY: y,
        head: [['Concepto / Estado Financiero', 'Acumulado Anterior', 'Ejecutado del Período', 'Acumulado Actual']],
        body: summaryRows,
        theme: 'grid',
        headStyles: { fillColor: [15, 118, 110], textColor: 255, fontStyle: 'bold', fontSize: 9, halign: 'center' },
        bodyStyles: { fontSize: 8.5 },
        columnStyles: {
            0: { fontStyle: 'bold' },
            1: { halign: 'right' },
            2: { halign: 'right', fontStyle: 'bold', textColor: [15, 118, 110] },
            3: { halign: 'right' }
        },
        margin: { left: 14, right: 14 }
    });

    y = (doc as any).lastAutoTable.finalY + 14;

    // --- Page 2: Mano de Obra Ejecutada (Cómputo Técnico) ---
    doc.addPage();
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 41, 59);
    doc.text('CÓMPUTO TÉCNICO DE MANO DE OBRA EJECUTADA', 14, 20);

    const laborRows = cert.snapshot.completedLaborItems.map(item => {
        const prevItem = prevCert?.snapshot.completedLaborItems.find(pi => pi.name === item.name);
        const prevQty = prevItem ? (prevItem.quantityCompleted || 0) : 0;
        const totalQty = item.quantityCompleted || 0;
        const periodQty = Math.max(0, totalQty - prevQty);

        return [
            item.name,
            item.unit,
            formatAmount(item.unitPrice),
            formatQty(prevQty),
            formatQty(periodQty),
            formatQty(totalQty),
            formatAmount(periodQty * item.unitPrice),
            formatAmount(totalQty * item.unitPrice)
        ];
    });

    (doc as any).autoTable({
        startY: 25,
        head: [['Actividad Constructiva', 'Uni.', 'Precio Unit.', 'Cant. Ant.', 'Cant. Per.', 'Cant. Act.', 'Importe Per.', 'Importe Act.']],
        body: laborRows,
        foot: [
            [
                { content: 'SUBTOTAL COSTO MANO DE OBRA DIRECTA', colSpan: 6, styles: { halign: 'right', fontStyle: 'bold' } },
                { content: formatAmount(cert.snapshot.completedLaborCost - (prevCert?.snapshot.completedLaborCost || 0)), styles: { fontStyle: 'bold' } },
                { content: formatAmount(cert.snapshot.completedLaborCost), styles: { fontStyle: 'bold' } }
            ]
        ],
        theme: 'striped',
        headStyles: { fillColor: [15, 118, 110], textColor: 255, fontSize: 8, fontStyle: 'bold', halign: 'center' },
        bodyStyles: { fontSize: 7.5 },
        columnStyles: {
            2: { halign: 'right' },
            3: { halign: 'right' },
            4: { halign: 'right' },
            5: { halign: 'right' },
            6: { halign: 'right' },
            7: { halign: 'right' }
        },
        footStyles: { fillColor: [240, 249, 250], textColor: [15, 118, 110], fontSize: 8 },
        alternateRowStyles: { fillColor: [248, 250, 252] },
        margin: { left: 14, right: 14 }
    });

    y = (doc as any).lastAutoTable.finalY + 12;

    // --- Gastos Indirectos, Utilidad e Impuestos Table ---
    if (y > pageHeight - 65) {
        doc.addPage();
        y = 20;
    }

    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 41, 59);
    doc.text('COSTOS INDIRECTOS, UTILIDAD E IMPUESTOS', 14, y);
    y += 4;

    const getIndirectRow = (name: string, pct: number, val: number, prevVal: number) => {
        return [
            name,
            pct > 0 ? `${pct}%` : '-',
            formatAmount(prevVal),
            formatAmount(val - prevVal),
            formatAmount(val)
        ];
    };

    const indirectRows = [];
    if (cert.snapshot.logisticsPercentage) {
        indirectRows.push(getIndirectRow('Logística (sobre Mano de Obra)', cert.snapshot.logisticsPercentage, cert.snapshot.logisticsCost, prevCert?.snapshot.logisticsCost || 0));
    }
    if (cert.snapshot.technicalAssistancePercentage) {
        indirectRows.push(getIndirectRow('Asistencia Técnica (sobre Mano de Obra)', cert.snapshot.technicalAssistancePercentage, cert.snapshot.technicalAssistanceCost, prevCert?.snapshot.technicalAssistanceCost || 0));
    }
    if (cert.snapshot.toolsAndUtilitiesPercentage) {
        indirectRows.push(getIndirectRow('Gastos de Útiles y Herramientas (sobre Mano de Obra)', cert.snapshot.toolsAndUtilitiesPercentage, cert.snapshot.toolsAndUtilitiesCost || 0, prevCert?.snapshot.toolsAndUtilitiesCost || 0));
    }
    if (cert.snapshot.profitPercentage) {
        indirectRows.push(getIndirectRow('Utilidad de Empresa', cert.snapshot.profitPercentage, cert.snapshot.profitCost, prevCert?.snapshot.profitCost || 0));
    }
    if (cert.snapshot.hasServiceTax && cert.snapshot.serviceTaxPercentage) {
        indirectRows.push(getIndirectRow('Impuesto Comercial de Servicios', cert.snapshot.serviceTaxPercentage, cert.snapshot.serviceTaxCost, prevCert?.snapshot.serviceTaxCost || 0));
    }

    if (indirectRows.length > 0) {
        (doc as any).autoTable({
            startY: y,
            head: [['Concepto Indirecto', 'Tasa', 'Acumulado Anterior', 'Ejecutado Período', 'Acumulado Actual']],
            body: indirectRows,
            theme: 'grid',
            headStyles: { fillColor: [15, 118, 110], textColor: 255, fontSize: 8.5, fontStyle: 'bold', halign: 'center' },
            bodyStyles: { fontSize: 8 },
            columnStyles: {
                1: { halign: 'center' },
                2: { halign: 'right' },
                3: { halign: 'right', fontStyle: 'bold' },
                4: { halign: 'right' }
            },
            margin: { left: 14, right: 14 }
        });
        y = (doc as any).lastAutoTable.finalY + 12;
    }

    // --- Page 3: Materiales, Transportación y Gastos Varios del Periodo (if any exist) ---
    const expensesRows: any[] = [];
    if (cert.snapshot.materialTransactions) {
        cert.snapshot.materialTransactions.forEach(t => {
            expensesRows.push([parseLocalDate(t.date).toLocaleDateString(), 'Materiales', t.description, formatAmount(t.amount)]);
        });
    }
    if (cert.snapshot.transportTransactions) {
        cert.snapshot.transportTransactions.forEach(t => {
            expensesRows.push([parseLocalDate(t.date).toLocaleDateString(), 'Transportación', t.description, formatAmount(t.amount)]);
        });
    }
    if (cert.snapshot.manualExpenseItems) {
        cert.snapshot.manualExpenseItems.forEach(t => {
            expensesRows.push([parseLocalDate(t.date).toLocaleDateString(), t.category || 'Gastos Varios', t.description, formatAmount(t.amount)]);
        });
    }

    if (expensesRows.length > 0) {
        doc.addPage();
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(30, 41, 59);
        doc.text('SISTEMAS DE SUMINISTRO, MATERIALES Y GASTOS VARIOS DEL PERÍODO', 14, 20);

        (doc as any).autoTable({
            startY: 25,
            head: [['Fecha', 'Categoría de Gasto', 'Concepto / Descripción del Movimiento', 'Importe']],
            body: expensesRows,
            theme: 'striped',
            headStyles: { fillColor: [15, 118, 110], textColor: 255, fontSize: 8.5, fontStyle: 'bold' },
            bodyStyles: { fontSize: 8 },
            columnStyles: {
                3: { halign: 'right', fontStyle: 'bold' }
            },
            alternateRowStyles: { fillColor: [248, 250, 252] },
            margin: { left: 14, right: 14 }
        });

        y = (doc as any).lastAutoTable.finalY + 12;
    }

    // --- Signatures Block ---
    if (y > pageHeight - 50) {
        doc.addPage();
        y = 30;
    } else {
        y += 10;
    }

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);

    // Line for signatures
    const sigLineW = 55;
    const leftSigX = 25;
    const rightSigX = pageWidth - sigLineW - 25;

    doc.setDrawColor(203, 213, 225);
    doc.setLineWidth(0.4);
    
    // Left signature line (Constructor)
    doc.line(leftSigX, y + 20, leftSigX + sigLineW, y + 20);
    // Right signature line (Supervisor/Inversionista)
    doc.line(rightSigX, y + 20, rightSigX + sigLineW, y + 20);

    doc.setFont('helvetica', 'bold');
    doc.text('CONTRATISTA / CONSTRUCTOR', leftSigX + sigLineW/2, y + 25, { align: 'center' });
    doc.text('SUPERVISOR / INVERSIONISTA', rightSigX + sigLineW/2, y + 25, { align: 'center' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text('Firma y Sello Comercial', leftSigX + sigLineW/2, y + 29, { align: 'center' });
    doc.text('Firma de Conformidad Técnica', rightSigX + sigLineW/2, y + 29, { align: 'center' });

    // Header and footers overlays
    addPageOverlays(doc, `Certificación: ${cert.name}`, true);

    doc.save(`Certificacion_${cert.name.replace(/\s/g, '_')}_${project.name.replace(/\s/g, '_')}.pdf`);
};
