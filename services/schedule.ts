import type { LaborItem } from '../types';

export function getDefaultProductivity(name: string, unit: string): number {
    const n = name.toLowerCase();
    const u = unit.toLowerCase();

    if (n.includes('muro') || n.includes('bloque') || n.includes('ladrillo') || n.includes('levante')) {
        return 6.0; // m²/día
    }
    if (n.includes('revestimiento') || n.includes('repello') || n.includes('fino') || n.includes('grueso') || n.includes('enlucido')) {
        return 8.0; // m²/día
    }
    if (n.includes('piso') || n.includes('mosaico') || n.includes('cerámica') || n.includes('platea') || n.includes('fretazo')) {
        return 10.0; // m²/día
    }
    if (n.includes('pintura') || n.includes('pintar') || n.includes('masilla')) {
        return 25.0; // m²/día
    }
    if (n.includes('columna') || n.includes('castillo')) {
        return 0.5; // u/día
    }
    if (n.includes('viga')) {
        return 2.0; // m/día
    }
    if (n.includes('losa') || n.includes('techo')) {
        return 4.0; // m²/día
    }
    if (n.includes('enchape') || n.includes('azulejo') || n.includes('porcelanato')) {
        return 5.0; // m²/día
    }
    if (n.includes('pladur') || n.includes('yeso')) {
        return 12.0; // m²/día
    }
    if (n.includes('zapata') || n.includes('cimiento') || n.includes('cimentación')) {
        return 1.5; // m o u/día
    }
    if (n.includes('excavación') || n.includes('excavar') || n.includes('tierra')) {
        return 2.0; // m³/día
    }
    if (n.includes('acero') || n.includes('armadura') || n.includes('cabilla')) {
        return 50.0; // kg/día
    }
    if (n.includes('encofrado') || n.includes('molde')) {
        return 6.0; // m²/día
    }

    // Default by unit
    if (u.includes('m²') || u.includes('m2')) return 8.0;
    if (u.includes('m³') || u.includes('m3')) return 2.0;
    if (u.includes('m')) return 5.0;
    if (u.includes('kg') || u.includes('ton')) return 50.0;

    return 5.0; // General default
}

interface ScheduleItem {
    id: number;
    laborItem: LaborItem;
    quantity: number;
    unit: string;
    workers: number;
    productivity: number;
    durationDays: number;
    predecessorId: number | undefined;
    startDate: Date;
    endDate: Date;
}

export interface ScheduleMetrics {
    totalDurationDays: number;
    remainingDurationDays: number;
    totalWorkers: number;
    avgWorkers: number;
    maxWorkers: number;
    scheduleItems: Record<number, ScheduleItem>;
    remainingScheduleItems: Record<number, ScheduleItem>;
}

export function calculateSchedule(laborItems: LaborItem[], startDateStr?: string): ScheduleMetrics {
    if (!laborItems || laborItems.length === 0) {
        return {
            totalDurationDays: 0,
            remainingDurationDays: 0,
            totalWorkers: 0,
            avgWorkers: 0,
            maxWorkers: 0,
            scheduleItems: {},
            remainingScheduleItems: {}
        };
    }

    const start = startDateStr ? new Date(startDateStr) : new Date();
    // Correct timezone offset to avoid date shifting to previous day
    const localStart = new Date(start.getTime() + start.getTimezoneOffset() * 60 * 1000);

    // 1. Initial Schedule (full quantity)
    const initialSpecs = laborItems.map(item => {
        const workers = item.scheduleWorkers != null ? Number(item.scheduleWorkers) : 2;
        const productivity = item.scheduleProductivity != null ? Number(item.scheduleProductivity) : getDefaultProductivity(item.name, item.unit);
        const durationDays = Math.max(1, Math.ceil(item.quantity / (workers * productivity)));
        const predecessorId = item.schedulePredecessorId ? Number(item.schedulePredecessorId) : undefined;
        
        return {
            id: item.id!,
            laborItem: item,
            quantity: item.quantity,
            unit: item.unit,
            workers,
            productivity,
            durationDays,
            predecessorId
        };
    });

    const initialSchedule: Record<number, ScheduleItem> = {};
    let resolvedIds = new Set<number>();
    let maxPasses = initialSpecs.length * 2;
    let passes = 0;

    while (resolvedIds.size < initialSpecs.length && passes < maxPasses) {
        passes++;
        for (const spec of initialSpecs) {
            if (resolvedIds.has(spec.id)) continue;

            if (!spec.predecessorId || !laborItems.some(a => a.id === spec.predecessorId)) {
                const sDate = new Date(localStart);
                const eDate = new Date(sDate);
                eDate.setDate(sDate.getDate() + spec.durationDays - 1);
                
                initialSchedule[spec.id] = {
                    ...spec,
                    startDate: sDate,
                    endDate: eDate
                };
                resolvedIds.add(spec.id);
            } else {
                const pred = initialSchedule[spec.predecessorId];
                if (pred) {
                    const sDate = new Date(pred.endDate);
                    sDate.setDate(pred.endDate.getDate() + 1);
                    const eDate = new Date(sDate);
                    eDate.setDate(sDate.getDate() + spec.durationDays - 1);

                    initialSchedule[spec.id] = {
                        ...spec,
                        startDate: sDate,
                        endDate: eDate
                    };
                    resolvedIds.add(spec.id);
                }
            }
        }
    }

    // Default unresolved initial items
    for (const spec of initialSpecs) {
        if (!resolvedIds.has(spec.id)) {
            const sDate = new Date(localStart);
            const eDate = new Date(sDate);
            eDate.setDate(sDate.getDate() + spec.durationDays - 1);
            initialSchedule[spec.id] = {
                ...spec,
                startDate: sDate,
                endDate: eDate
            };
        }
    }

    // Calculate initial overall duration
    const earliestStart = new Date(Math.min(...Object.values(initialSchedule).map(s => s.startDate.getTime())));
    const latestEnd = new Date(Math.max(...Object.values(initialSchedule).map(s => s.endDate.getTime())));
    const diffTime = latestEnd.getTime() - earliestStart.getTime();
    const totalDurationDays = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1);

    // 2. Remaining Schedule (remaining quantity)
    const remainingSpecs = laborItems.map(item => {
        const workers = item.scheduleWorkers != null ? Number(item.scheduleWorkers) : 2;
        const productivity = item.scheduleProductivity != null ? Number(item.scheduleProductivity) : getDefaultProductivity(item.name, item.unit);
        const completed = item.quantityCompleted != null ? Number(item.quantityCompleted) : 0;
        const remainingQty = Math.max(0, item.quantity - completed);
        const durationDays = remainingQty <= 0.01 ? 0 : Math.max(1, Math.ceil(remainingQty / (workers * productivity)));
        const predecessorId = item.schedulePredecessorId ? Number(item.schedulePredecessorId) : undefined;
        
        return {
            id: item.id!,
            laborItem: item,
            quantity: remainingQty,
            unit: item.unit,
            workers,
            productivity,
            durationDays,
            predecessorId
        };
    });

    const remainingSchedule: Record<number, ScheduleItem> = {};
    resolvedIds = new Set<number>();
    passes = 0;

    while (resolvedIds.size < remainingSpecs.length && passes < maxPasses) {
        passes++;
        for (const spec of remainingSpecs) {
            if (resolvedIds.has(spec.id)) continue;

            if (!spec.predecessorId || !laborItems.some(a => a.id === spec.predecessorId)) {
                const sDate = new Date(localStart);
                const eDate = new Date(sDate);
                eDate.setDate(sDate.getDate() + spec.durationDays - 1);
                
                remainingSchedule[spec.id] = {
                    ...spec,
                    startDate: sDate,
                    endDate: eDate
                };
                resolvedIds.add(spec.id);
            } else {
                const pred = remainingSchedule[spec.predecessorId];
                if (pred) {
                    const sDate = new Date(pred.endDate);
                    sDate.setDate(pred.endDate.getDate() + 1);
                    const eDate = new Date(sDate);
                    eDate.setDate(sDate.getDate() + spec.durationDays - 1);

                    remainingSchedule[spec.id] = {
                        ...spec,
                        startDate: sDate,
                        endDate: eDate
                    };
                    resolvedIds.add(spec.id);
                }
            }
        }
    }

    // Default unresolved remaining items
    for (const spec of remainingSpecs) {
        if (!resolvedIds.has(spec.id)) {
            const sDate = new Date(localStart);
            const eDate = new Date(sDate);
            eDate.setDate(sDate.getDate() + spec.durationDays - 1);
            remainingSchedule[spec.id] = {
                ...spec,
                startDate: sDate,
                endDate: eDate
            };
        }
    }

    // Calculate remaining overall duration (only count activities with actual durationDays left)
    const activeRemainingItems = Object.values(remainingSchedule).filter(s => s.durationDays > 0);
    let remainingDurationDays = 0;
    if (activeRemainingItems.length > 0) {
        const earliestRemainingStart = new Date(Math.min(...activeRemainingItems.map(s => s.startDate.getTime())));
        const latestRemainingEnd = new Date(Math.max(...activeRemainingItems.map(s => s.endDate.getTime())));
        const diffTimeRemaining = latestRemainingEnd.getTime() - earliestRemainingStart.getTime();
        remainingDurationDays = Math.max(1, Math.ceil(diffTimeRemaining / (1000 * 60 * 60 * 24)) + 1);
    }

    // Worker Metrics
    const totalWorkersAssigned = initialSpecs.reduce((acc, s) => acc + s.workers, 0);
    const avgWorkers = initialSpecs.length > 0 ? Number((totalWorkersAssigned / initialSpecs.length).toFixed(1)) : 0;

    // Peak workers calculation (max workers scheduled on any single day)
    let maxWorkers = 0;
    if (initialSpecs.length > 0) {
        // Find date range of initial schedule
        const startTimestamp = earliestStart.getTime();
        const endTimestamp = latestEnd.getTime();
        const oneDayMs = 1000 * 60 * 60 * 24;
        
        for (let t = startTimestamp; t <= endTimestamp; t += oneDayMs) {
            const currentDay = new Date(t);
            let workersOnDay = 0;
            for (const item of Object.values(initialSchedule)) {
                if (item.startDate <= currentDay && currentDay <= item.endDate) {
                    workersOnDay += item.workers;
                }
            }
            if (workersOnDay > maxWorkers) {
                maxWorkers = workersOnDay;
            }
        }
    }

    return {
        totalDurationDays,
        remainingDurationDays,
        totalWorkers: totalWorkersAssigned,
        avgWorkers,
        maxWorkers: maxWorkers || totalWorkersAssigned,
        scheduleItems: initialSchedule,
        remainingScheduleItems: remainingSchedule
    };
}
