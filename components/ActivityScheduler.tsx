import React from 'react';
import type { Project, LaborItem } from '../types';
import ManagedNumberInput from './ManagedNumberInput';
import { calculateSchedule, getDefaultProductivity } from '../services/schedule';

export { getDefaultProductivity };

// Get custom background color for labor items in Gantt chart based on keywords
const getLaborColor = (name: string): string => {
    const n = name.toLowerCase();
    if (n.includes('muro') || n.includes('bloque') || n.includes('ladrillo') || n.includes('levante')) {
        return 'bg-amber-600 text-amber-50 border-amber-700';
    }
    if (n.includes('revestimiento') || n.includes('repello') || n.includes('fino') || n.includes('grueso') || n.includes('enlucido')) {
        return 'bg-cyan-600 text-cyan-50 border-cyan-700';
    }
    if (n.includes('piso') || n.includes('mosaico') || n.includes('cerámica') || n.includes('platea')) {
        return 'bg-emerald-600 text-emerald-50 border-emerald-700';
    }
    if (n.includes('pintura') || n.includes('pintar') || n.includes('masilla')) {
        return 'bg-yellow-500 text-yellow-950 border-yellow-600';
    }
    if (n.includes('columna') || n.includes('viga') || n.includes('castillo') || n.includes('fundición') || n.includes('hormigón')) {
        return 'bg-blue-600 text-blue-50 border-blue-700';
    }
    if (n.includes('losa') || n.includes('techo')) {
        return 'bg-indigo-600 text-indigo-50 border-indigo-700';
    }
    if (n.includes('enchape') || n.includes('azulejo') || n.includes('porcelanato') || n.includes('baño')) {
        return 'bg-teal-600 text-teal-50 border-teal-700';
    }
    if (n.includes('pladur') || n.includes('yeso')) {
        return 'bg-purple-600 text-purple-50 border-purple-700';
    }
    if (n.includes('zapata') || n.includes('cimiento') || n.includes('cimentación')) {
        return 'bg-slate-500 text-slate-100 border-slate-600';
    }
    if (n.includes('excavación') || n.includes('excavar') || n.includes('tierra')) {
        return 'bg-amber-800 text-amber-100 border-amber-900';
    }
    return 'bg-sky-600 text-sky-50 border-sky-700';
};




interface ActivitySchedulerProps {
    project: Project;
    laborItems: LaborItem[];
    onUpdateLaborItem: (item: LaborItem) => Promise<void>;
    onUpdateProject: (project: Project) => Promise<void>;
    isPro: boolean;
    onUpgrade: () => void;
}

export default function ActivityScheduler({
    project,
    laborItems,
    onUpdateLaborItem,
    onUpdateProject,
    isPro,
    onUpgrade
}: ActivitySchedulerProps) {
    const [projectStartDate, setProjectStartDate] = React.useState<string>(() => {
        if (project.startDate) return project.startDate;
        const d = project.createdAt ? new Date(project.createdAt) : new Date();
        return d.toISOString().slice(0, 10);
    });

    const [scale, setScale] = React.useState<'days' | 'weeks' | 'months'>('days');
    const [editingItemId, setEditingItemId] = React.useState<number | null>(null);

    const navigateTimeline = (direction: 'prev' | 'next') => {
        const d = new Date(projectStartDate);
        
        if (direction === 'prev') {
            if (scale === 'days') d.setDate(d.getDate() - 1);
            else if (scale === 'weeks') d.setDate(d.getDate() - 7);
            else if (scale === 'months') d.setMonth(d.getMonth() - 1);
        } else {
            if (scale === 'days') d.setDate(d.getDate() + 1);
            else if (scale === 'weeks') d.setDate(d.getDate() + 7);
            else if (scale === 'months') d.setMonth(d.getMonth() + 1);
        }
        
        const newDate = d.toISOString().slice(0, 10);
        setProjectStartDate(newDate);
        onUpdateProject({ ...project, startDate: newDate });
    };

    // Sync projectStartDate state when project prop changes
    React.useEffect(() => {
        if (project.startDate) {
            setProjectStartDate(project.startDate);
        }
    }, [project.startDate]);

    const handleStartDateChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const newDate = e.target.value;
        setProjectStartDate(newDate);
        const updatedProject = { ...project, startDate: newDate };
        await onUpdateProject(updatedProject);
    };

    // Parse and estimate duration/dates using centralized schedule service
    const scheduleData = React.useMemo(() => {
        const metrics = calculateSchedule(
            laborItems, 
            projectStartDate,
            !!project.excludeSaturdays,
            !!project.excludeSundays
        );
        
        // Find earliest start and latest end for proper Gantt rendering
        const scheduleItemsArr = Object.values(metrics.scheduleItems);
        const earliestStart = scheduleItemsArr.length > 0
            ? new Date(Math.min(...scheduleItemsArr.map(s => s.startDate.getTime())))
            : new Date();
        const latestEnd = scheduleItemsArr.length > 0
            ? new Date(Math.max(...scheduleItemsArr.map(s => s.endDate.getTime())))
            : new Date();

        return {
            schedule: metrics.scheduleItems,
            totalDurationDays: metrics.totalDurationDays,
            remainingDurationDays: metrics.remainingDurationDays,
            totalCalendarDays: metrics.totalCalendarDays || 0,
            remainingCalendarDays: metrics.remainingCalendarDays || 0,
            startDate: earliestStart,
            endDate: latestEnd,
            avgWorkers: metrics.avgWorkers,
            maxWorkers: metrics.maxWorkers
        };
    }, [laborItems, projectStartDate, project.excludeSaturdays, project.excludeSundays]);

    const containerRef = React.useRef<HTMLDivElement>(null);
    const [barCoords, setBarCoords] = React.useState<Record<number, { xStart: number, xEnd: number, y: number }>>({});

    const measureBars = React.useCallback(() => {
        const coords: Record<number, { xStart: number, xEnd: number, y: number }> = {};
        const container = containerRef.current;
        if (!container) return;
        const containerRect = container.getBoundingClientRect();

        const sortedList = Object.values(scheduleData.schedule).sort((a, b) => a.startDate.getTime() - b.startDate.getTime());

        sortedList.forEach((item) => {
            const barEl = container.querySelector(`#gantt-bar-${item.id}`);
            if (barEl) {
                const rect = barEl.getBoundingClientRect();
                coords[item.id] = {
                    xStart: rect.left - containerRect.left,
                    xEnd: rect.right - containerRect.left,
                    y: (rect.top + rect.bottom) / 2 - containerRect.top
                };
            }
        });
        setBarCoords(coords);
    }, [scheduleData.schedule, scale]);

    React.useEffect(() => {
        // Measure immediately to update instant changes
        measureBars();

        // Staged timeouts to capture and update positions during rendering/transitions
        const handle1 = setTimeout(() => {
            measureBars();
        }, 50);

        const handle2 = setTimeout(() => {
            measureBars();
        }, 150);

        const handle3 = setTimeout(() => {
            measureBars();
        }, 350);

        window.addEventListener('resize', measureBars);
        return () => {
            clearTimeout(handle1);
            clearTimeout(handle2);
            clearTimeout(handle3);
            window.removeEventListener('resize', measureBars);
        };
    }, [measureBars, scale]);

    const handleUpdateLaborItemSchedule = async (
        itemId: number, 
        workers: number, 
        productivity: number, 
        predecessorId: number | undefined,
        startDate?: string
    ) => {
        const originalItem = laborItems.find(a => a.id === itemId);
        if (!originalItem) return;

        const updatedItem: LaborItem = {
            ...originalItem,
            scheduleWorkers: workers,
            scheduleProductivity: productivity,
            schedulePredecessorId: predecessorId,
            scheduleStartDate: startDate
        };
        await onUpdateLaborItem(updatedItem);
    };

    if (!isPro) {
        return (
            <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center max-w-lg mx-auto my-12 shadow-sm">
                <div className="w-16 h-16 bg-cyan-150 rounded-full flex items-center justify-center mx-auto mb-6">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-cyan-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                </div>
                <h3 className="text-2xl font-bold text-slate-800 mb-3">Cronograma de Ejecución</h3>
                <p className="text-slate-600 mb-6">
                    Estime tiempos de ejecución de forma automática basándose en cuadrillas, rendimientos y dependencias entre actividades con un diagrama de Gantt interactivo.
                </p>
                <button
                    onClick={onUpgrade}
                    className="px-6 py-3 bg-gradient-to-r from-cyan-600 to-blue-600 text-white font-bold rounded-xl hover:from-cyan-700 hover:to-blue-700 shadow-md transform hover:-translate-y-0.5 transition-all duration-150"
                >
                    Desbloquear con Plan Pro
                </button>
            </div>
        );
    }

    if (laborItems.length === 0) {
        return (
            <div className="bg-white p-8 rounded-2xl border border-dashed border-slate-250 text-center py-16">
                <div className="w-14 h-14 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                </div>
                <h3 className="text-lg font-bold text-slate-700 mb-1">Sin actividades de mano de obra</h3>
                <p className="text-sm text-slate-500 max-w-md mx-auto">
                    Primero agregue actividades en la pestaña <strong>Mano de Obra</strong>. El cronograma calculará automáticamente el tiempo de duración según el rendimiento de trabajo.
                </p>
            </div>
        );
    }

    // Prepare chronological list of items for the schedule view
    const sortedScheduleList = Object.values(scheduleData.schedule).sort((a, b) => a.startDate.getTime() - b.startDate.getTime());

    // Timeline columns generation for visual rendering
    const timelineDuration = scheduleData.totalCalendarDays || scheduleData.totalDurationDays || 1;
    const projectStart = scheduleData.startDate;

    const timelineHeaders: string[] = [];
    const timelineDates: Date[] = [];
    if (scale === 'days') {
        // Display all columns in Gantt based on duration
        const showDays = timelineDuration;
        for (let i = 0; i < showDays; i++) {
            const d = new Date(projectStart);
            d.setDate(projectStart.getDate() + i);
            timelineHeaders.push(d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' }));
            timelineDates.push(d);
        }
    } else if (scale === 'months') {
        const monthsCount = Math.max(4, Math.ceil(timelineDuration / 30));
        for (let i = 0; i < monthsCount; i++) {
            const d = new Date(projectStart);
            d.setMonth(projectStart.getMonth() + i);
            timelineHeaders.push(d.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' }));
            timelineDates.push(d);
        }
    } else {
        const weeksCount = Math.ceil(timelineDuration / 7);
        for (let i = 0; i < Math.max(4, weeksCount); i++) {
            timelineHeaders.push(`Semana ${i + 1}`);
            const d = new Date(projectStart);
            d.setDate(projectStart.getDate() + i * 7);
            timelineDates.push(d);
        }
    }

    // Calculate a dynamic minimum width for the Gantt timeline to ensure columns never compress or cut off text
    const colWidth = scale === 'days' ? 55 : scale === 'weeks' ? 120 : 175;
    const columnsWidth = timelineHeaders.length * colWidth;
    const totalTimelineWidth = Math.max(900, Math.ceil(columnsWidth / 0.67));

    const getSegments = (itemStartDate: Date, itemEndDate: Date, startCol: number, colSpan: number) => {
        if (scale !== 'days') {
            const sDate = new Date(itemStartDate);
            const eDate = new Date(itemEndDate);
            return [{
                startCol: startCol,
                colSpan: colSpan,
                datesLabel: sDate.toLocaleDateString('es-ES', { day: 'numeric' }) === eDate.toLocaleDateString('es-ES', { day: 'numeric' })
                    ? sDate.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })
                    : `${sDate.toLocaleDateString('es-ES', { day: 'numeric' })} - ${eDate.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}`
            }];
        }

        const segments: Array<{ startCol: number; colSpan: number; datesLabel: string }> = [];
        let currentSegmentStartIdx: number | null = null;

        for (let idx = 0; idx < timelineDates.length; idx++) {
            const date = timelineDates[idx];
            
            const compDate = new Date(date);
            compDate.setHours(0,0,0,0);
            
            const sDate = new Date(itemStartDate);
            sDate.setHours(0,0,0,0);
            
            const eDate = new Date(itemEndDate);
            eDate.setHours(0,0,0,0);

            const inRange = compDate >= sDate && compDate <= eDate;
            
            const day = compDate.getDay();
            const isSaturday = day === 6;
            const isSunday = day === 0;
            const isWorkingDay = !((isSaturday && !!project.excludeSaturdays) || (isSunday && !!project.excludeSundays));

            if (inRange && isWorkingDay) {
                if (currentSegmentStartIdx === null) {
                    currentSegmentStartIdx = idx;
                }
            } else {
                if (currentSegmentStartIdx !== null) {
                    const segStartCol = currentSegmentStartIdx;
                    const segColSpan = idx - currentSegmentStartIdx;
                    
                    const sSegDate = timelineDates[segStartCol];
                    const eSegDate = timelineDates[idx - 1];
                    const datesLabel = sSegDate.toLocaleDateString('es-ES', { day: 'numeric' }) === eSegDate.toLocaleDateString('es-ES', { day: 'numeric' })
                        ? sSegDate.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })
                        : `${sSegDate.toLocaleDateString('es-ES', { day: 'numeric' })} - ${eSegDate.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}`;

                    segments.push({
                        startCol: segStartCol,
                        colSpan: segColSpan,
                        datesLabel
                    });
                    currentSegmentStartIdx = null;
                }
            }
        }

        if (currentSegmentStartIdx !== null) {
            const segStartCol = currentSegmentStartIdx;
            const segColSpan = timelineDates.length - currentSegmentStartIdx;
            const sSegDate = timelineDates[segStartCol];
            const eSegDate = timelineDates[timelineDates.length - 1];
            
            const finalEnd = eSegDate < itemEndDate ? eSegDate : itemEndDate;
            const datesLabel = sSegDate.toLocaleDateString('es-ES', { day: 'numeric' }) === finalEnd.toLocaleDateString('es-ES', { day: 'numeric' })
                ? sSegDate.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })
                : `${sSegDate.toLocaleDateString('es-ES', { day: 'numeric' })} - ${finalEnd.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}`;

            segments.push({
                startCol: segStartCol,
                colSpan: segColSpan,
                datesLabel
            });
        }

        return segments;
    };

    const workforceDays = React.useMemo(() => {
        if (!sortedScheduleList.length) return [];
        
        const days: Array<{
            date: Date;
            dateStr: string;
            dayName: string;
            isWorkingDay: boolean;
            workers: number;
            activeTasks: Array<{ name: string; workers: number }>;
        }> = [];

        const projectStart = scheduleData.startDate;
        const projectEnd = scheduleData.endDate;
        const startTimestamp = projectStart.getTime();
        const endTimestamp = projectEnd.getTime();
        const oneDayMs = 1000 * 60 * 60 * 24;

        for (let t = startTimestamp; t <= endTimestamp; t += oneDayMs) {
            const currentDay = new Date(t);
            const dateStr = currentDay.toISOString().slice(0, 10);
            
            const day = currentDay.getDay();
            const isSaturday = day === 6;
            const isSunday = day === 0;
            const isWorkingDay = !((isSaturday && !!project.excludeSaturdays) || (isSunday && !!project.excludeSundays));

            const activeTasksOnDay = sortedScheduleList.filter(item => {
                const s = new Date(item.startDate);
                s.setHours(0,0,0,0);
                const e = new Date(item.endDate);
                e.setHours(0,0,0,0);
                const curr = new Date(currentDay);
                curr.setHours(0,0,0,0);
                return curr >= s && curr <= e;
            });

            const workers = activeTasksOnDay.reduce((acc, item) => acc + item.workers, 0);

            days.push({
                date: currentDay,
                dateStr,
                dayName: currentDay.toLocaleDateString('es-ES', { weekday: 'short' }),
                isWorkingDay,
                workers,
                activeTasks: activeTasksOnDay.map(t => ({ name: t.laborItem.name, workers: t.workers }))
            });
        }
        return days;
    }, [sortedScheduleList, scheduleData.startDate, scheduleData.endDate, project.excludeSaturdays, project.excludeSundays]);

    const peakDates = React.useMemo(() => {
        if (!workforceDays.length) return [];
        const maxW = scheduleData.maxWorkers;
        if (maxW === 0) return [];
        return workforceDays.filter(d => d.workers === maxW && d.isWorkingDay);
    }, [workforceDays, scheduleData.maxWorkers]);

    const scheduleAlerts = React.useMemo(() => {
        const alerts: string[] = [];
        if (workforceDays.length < 3) return alerts;

        let lastActiveDayIdx = -1;
        let firstActiveDayIdx = -1;
        for (let i = 0; i < workforceDays.length; i++) {
            if (workforceDays[i].workers > 0) {
                if (firstActiveDayIdx === -1) firstActiveDayIdx = i;
                lastActiveDayIdx = i;
            }
        }

        if (firstActiveDayIdx !== -1 && lastActiveDayIdx !== -1) {
            // Check for gaps (0 workers on a working day between first and last active days)
            let gapDaysCount = 0;
            const gapRanges: string[] = [];
            let inGap = false;
            let gapStart: Date | null = null;

            for (let i = firstActiveDayIdx; i <= lastActiveDayIdx; i++) {
                const day = workforceDays[i];
                if (day.isWorkingDay && day.workers === 0) {
                    gapDaysCount++;
                    if (!inGap) {
                        inGap = true;
                        gapStart = day.date;
                    }
                } else if (day.workers > 0 && inGap) {
                    inGap = false;
                    if (gapStart) {
                        const startLabel = gapStart.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
                        const endLabel = workforceDays[i - 1].date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
                        gapRanges.push(startLabel === endLabel ? startLabel : `del ${startLabel} al ${endLabel}`);
                    }
                }
            }

            if (gapDaysCount > 0) {
                alerts.push(`Se detectan lapsos de inactividad (${gapDaysCount} días sin labores) ${gapRanges.join(', ')}. Considere reorganizar las dependencias de las tareas para que el personal tenga continuidad laboral y evitar costos innecesarios.`);
            }
        }

        if (scheduleData.maxWorkers > scheduleData.avgWorkers * 1.8 && scheduleData.avgWorkers > 0) {
            alerts.push(`El pico máximo de personal (${scheduleData.maxWorkers} obreros) supera considerablemente el promedio diario (${scheduleData.avgWorkers} obreros). Esto indica una alta concentración de actividades paralelas. Considere encadenar algunas tareas mediante predecesoras para nivelar el personal en obra.`);
        }

        return alerts;
    }, [workforceDays, scheduleData.maxWorkers, scheduleData.avgWorkers]);

    const [selectedWorkforceDayStr, setSelectedWorkforceDayStr] = React.useState<string | null>(null);

    const selectedWorkforceDay = React.useMemo(() => {
        if (!selectedWorkforceDayStr) return null;
        return workforceDays.find(d => d.dateStr === selectedWorkforceDayStr) || null;
    }, [workforceDays, selectedWorkforceDayStr]);

    return (
        <div className="space-y-6">
            {/* Informative Guidance Section */}
            <div className="bg-gradient-to-r from-cyan-50/60 to-blue-50/40 p-5 rounded-2xl border border-cyan-100/50 flex flex-col xl:flex-row xl:items-center justify-between gap-4 shadow-sm">
                <div className="space-y-1 max-w-3xl">
                    <h4 className="font-bold text-slate-800 flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-cyan-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Planificación de Tiempos de Mano de Obra
                    </h4>
                    <p className="text-xs sm:text-sm text-slate-650 leading-relaxed">
                        El programa estima las duraciones de cada actividad de mano de obra automáticamente: <strong className="text-cyan-800">Duración = Cantidad / (Obreros × Rendimiento Diario)</strong>.
                        Configure las dependencias (predecesoras) para encadenar las fases una tras otra, o déjelas vacías para realizarlas de forma conjunta en paralelo.
                    </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-end">
                    <div>
                        <label className="block text-xs font-bold text-slate-600 mb-1 tracking-wide uppercase">Inicio de Obra</label>
                        <input
                            type="date"
                            value={projectStartDate}
                            onChange={handleStartDateChange}
                            className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm font-semibold shadow-sm focus:border-cyan-500 focus:ring-cyan-500 text-slate-850"
                        />
                    </div>
                    
                    <div className="flex items-center gap-4 bg-white/80 p-2 px-3.5 rounded-xl border border-slate-200/80 shadow-xs">
                        <label className="flex items-center gap-2 cursor-pointer select-none text-xs font-bold text-slate-700">
                            <input
                                type="checkbox"
                                checked={!!project.excludeSaturdays}
                                onChange={async (e) => {
                                    await onUpdateProject({
                                        ...project,
                                        excludeSaturdays: e.target.checked
                                    });
                                }}
                                className="w-4 h-4 text-cyan-650 border-slate-300 rounded focus:ring-cyan-550 cursor-pointer"
                            />
                            <span>Quitar Sábados</span>
                        </label>
                        
                        <div className="w-px h-4 bg-slate-200" />

                        <label className="flex items-center gap-2 cursor-pointer select-none text-xs font-bold text-slate-700">
                            <input
                                type="checkbox"
                                checked={!!project.excludeSundays}
                                onChange={async (e) => {
                                    await onUpdateProject({
                                        ...project,
                                        excludeSundays: e.target.checked
                                    });
                                }}
                                className="w-4 h-4 text-cyan-650 border-slate-300 rounded focus:ring-cyan-550 cursor-pointer"
                            />
                            <span>Quitar Domingos</span>
                        </label>
                    </div>
                </div>
            </div>

            {/* Overall Metrics Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-4.5 rounded-2xl border border-slate-200/60 shadow-sm flex items-center gap-4">
                    <div className="p-3 bg-cyan-100 text-cyan-700 rounded-xl">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <div>
                        <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Duración de Obra</p>
                        <h4 className="text-2xl font-bold text-slate-800">
                            {scheduleData.totalDurationDays} <span className="text-sm font-medium text-slate-500">días hábiles</span>
                        </h4>
                        <p className="text-xs font-bold text-slate-500 mt-0.5">{scheduleData.totalCalendarDays} días totales</p>
                        <p className="text-[11px] font-bold text-cyan-600 mt-1">
                            Restan: {scheduleData.remainingDurationDays} hábiles ({scheduleData.remainingCalendarDays} tot.)
                        </p>
                    </div>
                </div>

                <div className="bg-white p-4.5 rounded-2xl border border-slate-200/60 shadow-sm flex items-center gap-4">
                    <div className="p-3 bg-emerald-100 text-emerald-700 rounded-xl">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                    </div>
                    <div>
                        <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Fecha de Finalización</p>
                        <h4 className="text-lg font-bold text-slate-800">
                            {scheduleData.endDate.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </h4>
                    </div>
                </div>

                <div className="bg-white p-4.5 rounded-2xl border border-slate-200/60 shadow-sm flex items-center gap-4">
                    <div className="p-3 bg-purple-100 text-purple-700 rounded-xl">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                    </div>
                    <div>
                        <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Obreros Requeridos</p>
                        <h4 className="text-2xl font-bold text-slate-800">{scheduleData.avgWorkers} <span className="text-sm font-medium text-slate-500">promedio</span></h4>
                        <p className="text-[11px] font-bold text-purple-750 mt-1">Pico máximo: {scheduleData.maxWorkers} {scheduleData.maxWorkers === 1 ? 'obrero' : 'obreros'}</p>
                    </div>
                </div>

                <div className="bg-white p-4.5 rounded-2xl border border-slate-200/60 shadow-sm flex items-center gap-4">
                    <div className="p-3 bg-blue-100 text-blue-700 rounded-xl">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                        </svg>
                    </div>
                    <div>
                        <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Total Actividades</p>
                        <h4 className="text-2xl font-bold text-slate-800">{laborItems.length} <span className="text-sm font-medium text-slate-500">tareas</span></h4>
                    </div>
                </div>
            </div>

            {/* Visual Gantt Chart / Chronogram */}
            <div className="bg-white rounded-2xl border border-slate-200/65 shadow-sm overflow-hidden">
                <div className="p-4 border-b border-slate-200/60 bg-slate-50/50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h3 className="font-bold text-slate-800 text-lg">Cronograma Visual (Gantt)</h3>
                        <p className="text-xs text-slate-550">Línea de tiempo detallada de las actividades de mano de obra</p>
                    </div>
                    <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-200/60 items-center">
                        <button
                            onClick={() => navigateTimeline('prev')}
                            className="p-1.5 text-slate-500 hover:text-slate-800 transition-all"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                            </svg>
                        </button>
                        <button
                            onClick={() => setScale('days')}
                            className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${scale === 'days' ? 'bg-white text-slate-800 shadow-xs' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            Vista Diaria
                        </button>
                        <button
                            onClick={() => setScale('weeks')}
                            className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${scale === 'weeks' ? 'bg-white text-slate-800 shadow-xs' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            Vista Semanal
                        </button>
                        <button
                            onClick={() => setScale('months')}
                            className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${scale === 'months' ? 'bg-white text-slate-800 shadow-xs' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            Vista Mensual
                        </button>
                        <button
                            onClick={() => navigateTimeline('next')}
                            className="p-1.5 text-slate-500 hover:text-slate-800 transition-all"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                            </svg>
                        </button>
                        <div className="w-px h-4 bg-slate-300 mx-2" />
                    </div>
                </div>

                <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-slate-200">
                    <div 
                        className="p-6 space-y-4"
                        style={{ minWidth: `${totalTimelineWidth}px` }}
                    >
                        {/* Timeline Header bar */}
                        <div className="flex gap-4 text-xs font-bold text-slate-450 tracking-wider uppercase border-b border-slate-100 pb-2">
                            <div className="w-[240px] shrink-0">Actividad / Tarea</div>
                            <div className="w-[70px] shrink-0 text-center">Duración</div>
                            <div className="flex-1 grid" style={{ gridTemplateColumns: `repeat(${timelineHeaders.length}, minmax(0, 1fr))` }}>
                                {timelineHeaders.map((head, i) => {
                                    const date = timelineDates[i];
                                    const day = date?.getDay();
                                    const isSaturday = day === 6;
                                    const isSunday = day === 0;
                                    const isExcludedSat = isSaturday && !!project.excludeSaturdays;
                                    const isExcludedSun = isSunday && !!project.excludeSundays;
                                    const isWeekend = isExcludedSat || isExcludedSun;
                                    return (
                                        <div 
                                            key={i} 
                                            className={`text-center text-[11px] font-bold uppercase tracking-wide whitespace-nowrap border-l border-slate-100 px-1.5 py-1 transition-colors ${
                                                isWeekend && scale === 'days'
                                                    ? 'bg-slate-100/90 text-slate-400 font-medium' 
                                                    : 'text-slate-500'
                                            }`} 
                                            title={`${head}${isWeekend && scale === 'days' ? ' (Fin de semana no laborable)' : ''}`}
                                        >
                                            {head}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Timeline Rows */}
                        <div ref={containerRef} className="space-y-3.5 relative">
                            {/* SVG overlay to render dependency connecting lines/arrows */}
                            {Object.keys(barCoords).length > 0 && (
                                <svg className="absolute inset-0 w-full h-full pointer-events-none z-10 overflow-visible">
                                    <defs>
                                        <marker id="gantt-arrow" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                                            <path d="M 0 1.5 L 7 5 L 0 8.5 z" fill="#0891b2" />
                                        </marker>
                                    </defs>
                                    {sortedScheduleList.map((item) => {
                                        if (!item.predecessorId) return null;
                                        const pred = barCoords[item.predecessorId];
                                        const curr = barCoords[item.id];
                                        if (!pred || !curr) return null;

                                        // Path drawing algorithm
                                        const x1 = pred.xEnd;
                                        const y1 = pred.y;
                                        const x2 = curr.xStart;
                                        const y2 = curr.y;

                                        let pathD = '';
                                        const minExit = 12; // minimum horizontal distance to exit the bar before turning
                                        
                                        if (x2 >= x1 + minExit) {
                                            // Normal: successor starts after predecessor ends
                                            const midX = x1 + (x2 - x1) / 2;
                                            pathD = `M ${x1} ${y1} L ${midX} ${y1} L ${midX} ${y2} L ${x2} ${y2}`;
                                        } else {
                                            // Overlap: successor starts before predecessor ends (loop back path)
                                            const exitX = x1 + minExit;
                                            const entryX = x2 - minExit;
                                            const midY = y1 + (y2 - y1) / 2;
                                            pathD = `M ${x1} ${y1} L ${exitX} ${y1} L ${exitX} ${midY} L ${entryX} ${midY} L ${entryX} ${y2} L ${x2} ${y2}`;
                                        }

                                        return (
                                            <g key={`dep-line-${item.id}`}>
                                                <path
                                                    d={pathD}
                                                    fill="none"
                                                    stroke="#0891b2"
                                                    strokeWidth="1.5"
                                                    strokeDasharray="3.5, 3"
                                                    markerEnd="url(#gantt-arrow)"
                                                    className="transition-all duration-300 opacity-60 hover:opacity-100 hover:stroke-2"
                                                />
                                            </g>
                                        );
                                    })}
                                </svg>
                            )}

                            {sortedScheduleList.map((item) => {
                                // Calculate starting column offset and duration span
                                let startCol = 0;
                                let colSpan = 0;

                                if (scale === 'days') {
                                    const diffFromStart = Math.ceil((item.startDate.getTime() - projectStart.getTime()) / (1000 * 60 * 60 * 24));
                                    startCol = Math.max(0, diffFromStart);
                                    
                                    // Calculate total calendar span days for correct width placement
                                    const taskCalendarDays = Math.max(1, Math.ceil((item.endDate.getTime() - item.startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1);
                                    colSpan = taskCalendarDays;
                                } else if (scale === 'weeks') {
                                    const diffFromStartDays = Math.ceil((item.startDate.getTime() - projectStart.getTime()) / (1000 * 60 * 60 * 24));
                                    startCol = diffFromStartDays / 7;
                                    
                                    const taskCalendarDays = Math.max(1, Math.ceil((item.endDate.getTime() - item.startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1);
                                    colSpan = taskCalendarDays / 7;
                                } else {
                                    const diffFromStartDays = Math.ceil((item.startDate.getTime() - projectStart.getTime()) / (1000 * 60 * 60 * 24));
                                    startCol = diffFromStartDays / 30;
                                    
                                    const taskCalendarDays = Math.max(1, Math.ceil((item.endDate.getTime() - item.startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1);
                                    colSpan = taskCalendarDays / 30;
                                }

                                const colorClass = getLaborColor(item.laborItem.name);
                                const totalCols = timelineHeaders.length;
                                const taskCalendarSpan = Math.max(1, Math.ceil((item.endDate.getTime() - item.startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1);

                                return (
                                    <div key={item.id} className="flex gap-4 items-center group">
                                        {/* Activity Name & Specs */}
                                        <div className="w-[240px] shrink-0">
                                            <h5 className="font-bold text-slate-800 text-xs sm:text-sm truncate" title={item.laborItem.name}>
                                                {item.laborItem.name}
                                            </h5>
                                            <p className="text-[10px] text-slate-450 truncate">
                                                {item.quantity.toFixed(1)} {item.unit} · {item.workers} {item.workers === 1 ? 'obrero' : 'obreros'}
                                            </p>
                                        </div>

                                        {/* Duration text */}
                                        <div className="w-[70px] shrink-0 text-center text-xs font-semibold text-slate-600 bg-slate-50 py-1 px-1.5 rounded-lg border" title={`${item.durationDays} días hábiles (${taskCalendarSpan} días totales)`}>
                                            {item.durationDays} d.
                                        </div>

                                        {/* Visual Timeline Bar representation */}
                                        <div className="flex-1 relative h-8 bg-slate-50 rounded-xl border border-slate-100/80 overflow-hidden">
                                            {/* Background weekend columns */}
                                            {scale === 'days' && timelineDates.map((date, idx) => {
                                                const day = date.getDay();
                                                const isSaturday = day === 6;
                                                const isSunday = day === 0;
                                                const isExcludedSat = isSaturday && !!project.excludeSaturdays;
                                                const isExcludedSun = isSunday && !!project.excludeSundays;
                                                if (isExcludedSat || isExcludedSun) {
                                                    return (
                                                        <div 
                                                            key={`bg-day-${idx}`}
                                                            className="absolute top-0 bottom-0 bg-slate-200/55 border-r border-slate-300/20"
                                                            style={{
                                                                left: `${(idx / totalCols) * 100}%`,
                                                                width: `${(1 / totalCols) * 100}%`
                                                            }}
                                                        />
                                                    );
                                                }
                                                return null;
                                            })}

                                            {/* Invisible dummy tracking bar for dependency line calculations */}
                                            <div 
                                                id={`gantt-bar-${item.id}`}
                                                className="absolute top-1 h-6 pointer-events-none opacity-0"
                                                style={{
                                                    left: `${Math.min(99, Math.max(0, (startCol / totalCols) * 100))}%`,
                                                    width: `${Math.max(1, Math.min(100, (colSpan / totalCols) * 100))}%`
                                                }}
                                            />

                                            {/* Real visible segments segmenting around weekends */}
                                            {getSegments(item.startDate, item.endDate, startCol, colSpan).map((seg, sIdx) => (
                                                <div 
                                                    key={`${item.id}-seg-${sIdx}`}
                                                    className={`absolute top-1 h-6 rounded-lg border shadow-xs flex items-center px-2.5 transition-all duration-300 ${colorClass}`}
                                                    style={{
                                                        left: `${Math.min(99, Math.max(0, (seg.startCol / totalCols) * 100))}%`,
                                                        width: `${Math.max(1, Math.min(100, (seg.colSpan / totalCols) * 100))}%`
                                                    }}
                                                    title={`${item.laborItem.name}: ${item.durationDays} días hábiles, ${taskCalendarSpan} días totales (${item.startDate.toLocaleDateString()} - ${item.endDate.toLocaleDateString()})`}
                                                >
                                                    <span className="text-[10px] font-bold tracking-wider truncate uppercase select-none">
                                                        {seg.datesLabel}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>

            {/* Parallel Crew & Overlap Analysis Module */}
            <div className="bg-white rounded-2xl border border-slate-200/65 shadow-sm overflow-hidden">
                <div className="p-5 border-b border-slate-200/60 bg-slate-50/50 flex flex-col md:flex-row md:items-center justify-between gap-2">
                    <div>
                        <h3 className="font-bold text-slate-800 text-lg">Análisis de Cuadrillas y Continuidad</h3>
                        <p className="text-xs text-slate-550">Detección automática de solapamientos de tareas en paralelo y brechas de inactividad</p>
                    </div>
                    {peakDates.length > 0 && (
                        <div className="bg-purple-50 text-purple-700 border border-purple-100 rounded-lg px-3 py-1.5 text-xs font-semibold flex items-center gap-1.5 self-start md:self-auto">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                            Pico Máximo: <span className="font-bold">{scheduleData.maxWorkers} obreros</span> el {peakDates[0].date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
                            {peakDates.length > 1 && ` (+${peakDates.length - 1} días)`}
                        </div>
                    )}
                </div>

                <div className="p-5 grid grid-cols-1 lg:grid-cols-12 gap-6">
                    {/* Diagnostic column */}
                    <div className="lg:col-span-5 space-y-4">
                        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Diagnóstico de la Obra</h4>
                        
                        {scheduleAlerts.length > 0 ? (
                            <div className="space-y-3">
                                {scheduleAlerts.map((alert, idx) => (
                                    <div key={idx} className="p-3.5 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl text-xs sm:text-sm flex items-start gap-3 shadow-xs">
                                        <span className="text-lg leading-none mt-0.5">⚠️</span>
                                        <div>
                                            <p className="font-semibold leading-relaxed text-slate-750">{alert}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="p-4 bg-emerald-50 border border-emerald-100 text-emerald-850 rounded-xl text-xs sm:text-sm flex items-start gap-3 shadow-xs">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <div>
                                    <h5 className="font-bold">Distribución de personal óptima</h5>
                                    <p className="text-emerald-700 mt-1 leading-relaxed">Las actividades están encadenadas continuamente. No se detectan baches de inactividad ni picos excesivos de personal que compliquen la administración en la obra.</p>
                                </div>
                            </div>
                        )}

                        <div className="bg-slate-50/70 p-4 rounded-xl border border-slate-150 text-xs text-slate-650 space-y-2">
                            <span className="font-bold text-slate-700 block uppercase tracking-wider text-[10px]">¿Cómo optimizar su cuadrilla?</span>
                            <p className="leading-relaxed">
                                Si el pico máximo de personal es muy alto, significa que hay tareas paralelas demandando trabajadores al mismo tiempo. Puede <strong>modificar las predecesoras</strong> en la tabla de abajo para hacerlas secuenciales. Esto reduce el tamaño de cuadrilla requerido en simultáneo, facilitando la administración de la obra.
                            </p>
                        </div>
                    </div>

                    {/* Interactive Histogram and Detail Column */}
                    <div className="lg:col-span-7 flex flex-col justify-between space-y-4">
                        <div>
                            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex justify-between items-center">
                                <span>Demanda Diaria de Personal (Histograma)</span>
                                <span className="text-[10px] text-slate-400 font-normal">Haga clic en un día para ver detalles</span>
                            </h4>
                            
                            {/* Simple, scrollable daily histogram */}
                            <div className="border border-slate-150 rounded-xl bg-slate-50/30 p-4 overflow-x-auto scrollbar-thin scrollbar-thumb-slate-200">
                                <div className="flex items-end gap-1.5 h-28 min-w-[350px] pb-1">
                                    {workforceDays.map((day) => {
                                        const isSelected = selectedWorkforceDayStr === day.dateStr;
                                        const isPeak = day.workers === scheduleData.maxWorkers && day.isWorkingDay;
                                        const maxW = scheduleData.maxWorkers || 1;
                                        const heightPercent = Math.max(8, (day.workers / maxW) * 100);
                                        const barHeight = day.isWorkingDay ? `${heightPercent}%` : '15%';

                                        let barColor = 'bg-slate-350 hover:bg-slate-400';
                                        if (day.isWorkingDay) {
                                            if (day.workers === 0) {
                                                barColor = 'bg-slate-100 border border-dashed border-slate-300';
                                            } else if (isPeak) {
                                                barColor = 'bg-purple-600 hover:bg-purple-700 ring-2 ring-purple-100 ring-offset-1';
                                            } else if (day.workers > scheduleData.avgWorkers) {
                                                barColor = 'bg-cyan-600 hover:bg-cyan-700';
                                            } else {
                                                barColor = 'bg-cyan-500 hover:bg-cyan-600';
                                            }
                                        } else {
                                            barColor = 'bg-slate-200/60 hover:bg-slate-200';
                                        }

                                        if (isSelected) {
                                            barColor = 'bg-indigo-600 hover:bg-indigo-700 ring-4 ring-indigo-100 ring-offset-1 scale-y-105 transition-all';
                                        }

                                        return (
                                            <button
                                                key={day.dateStr}
                                                type="button"
                                                onClick={() => setSelectedWorkforceDayStr(isSelected ? null : day.dateStr)}
                                                className="flex-1 flex flex-col items-center justify-end h-full min-w-[20px] group focus:outline-none transition-all duration-200"
                                                title={`${day.date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}: ${day.workers} obreros${!day.isWorkingDay ? ' (No laborable)' : ''}`}
                                            >
                                                {/* Bar */}
                                                <div 
                                                    className={`w-full rounded-md transition-all duration-200 ${barColor}`}
                                                    style={{ height: barHeight }}
                                                />
                                                {/* Label */}
                                                <span className={`text-[9px] mt-2 font-bold select-none ${isSelected ? 'text-indigo-600 font-extrabold' : 'text-slate-450'}`}>
                                                    {day.date.getDate()}
                                                </span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>

                        {/* Selected day active parallel activities breakdown */}
                        <div className="flex-1 min-h-[100px]">
                            {selectedWorkforceDay ? (
                                <div className="p-4 bg-indigo-50/50 border border-indigo-100 rounded-xl space-y-2.5 animate-fadeIn">
                                    <div className="flex justify-between items-center border-b border-indigo-100/60 pb-2">
                                        <h5 className="font-bold text-slate-850 text-xs sm:text-sm">
                                            Detalles del {selectedWorkforceDay.date.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
                                        </h5>
                                        <span className="px-2.5 py-0.5 bg-indigo-100 text-indigo-800 rounded-full text-xs font-bold">
                                            {selectedWorkforceDay.workers} {selectedWorkforceDay.workers === 1 ? 'obrero' : 'obreros'} activos
                                        </span>
                                    </div>
                                    {selectedWorkforceDay.activeTasks.length > 0 ? (
                                        <div className="space-y-1.5">
                                            <p className="text-[11px] text-slate-500 font-bold uppercase tracking-wider">Actividades en Paralelo:</p>
                                            <ul className="space-y-1.5">
                                                {selectedWorkforceDay.activeTasks.map((task, tIdx) => (
                                                    <li key={tIdx} className="text-xs text-slate-700 flex justify-between items-center bg-white px-3 py-1.5 rounded-lg border border-indigo-50 shadow-2xs">
                                                        <span className="font-bold text-slate-850 truncate mr-2">
                                                            {task.name}
                                                        </span>
                                                        <span className="font-semibold text-slate-500 text-[10px] bg-slate-100 px-2 py-0.5 rounded shrink-0">
                                                            {task.workers} {task.workers === 1 ? 'obrero' : 'obreros'}
                                                        </span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    ) : (
                                        <p className="text-xs text-slate-500 italic">No hay actividades de mano de obra programadas para este día.</p>
                                    )}
                                </div>
                            ) : (
                                <div className="h-full flex items-center justify-center p-4 border border-dashed border-slate-200 rounded-xl bg-slate-50/20 text-center">
                                    <div className="space-y-1">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-slate-400 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
                                        </svg>
                                        <p className="text-xs text-slate-400 font-medium">Toque una barra del histograma para analizar los solapamientos de ese día.</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Interactive Schedule Configuration List */}
            <div className="bg-white rounded-2xl border border-slate-200/65 shadow-sm overflow-hidden">
                <div className="p-5 border-b border-slate-200/60 bg-slate-50/50">
                    <h3 className="font-bold text-slate-800 text-lg">Parámetros de las Actividades de Mano de Obra</h3>
                    <p className="text-xs text-slate-550">Ajuste las cuadrillas (cantidad de obreros) y el rendimiento diario para recalcular la duración del proyecto en tiempo real</p>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs sm:text-sm border-collapse text-slate-700 font-medium">
                        <thead>
                            <tr className="bg-slate-100 text-slate-600 uppercase text-[10px] tracking-wider border-b">
                                <th className="p-4">Actividad / Cantidad de Obra</th>
                                <th className="p-4 text-center">Nº Obreros (Cuadrilla)</th>
                                <th className="p-4">Rendimiento Obrero/Día</th>
                                <th className="p-4">Fase Predecesora (Dependencia)</th>
                                <th className="p-4 text-center">Duración Estimada</th>
                                <th className="p-4 text-center">Fechas Planificadas</th>
                                <th className="p-4 w-20"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {sortedScheduleList.map((item) => {
                                const isEditing = editingItemId === item.id;

                                return (
                                    <tr key={item.id} className={`hover:bg-slate-50/60 transition-colors ${isEditing ? 'bg-cyan-50/40' : ''}`}>
                                        <td className="p-4">
                                            <span className="font-bold text-slate-800 block text-sm">{item.laborItem.name}</span>
                                            <span className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
                                                <span className="inline-block w-2 h-2 rounded-full bg-slate-400"></span>
                                                Volumen: <strong className="text-slate-700">{item.quantity.toFixed(2)} {item.unit}</strong>
                                            </span>
                                        </td>

                                        <td className="p-4 text-center">
                                            {isEditing ? (
                                                <select
                                                    value={item.workers}
                                                    onChange={(e) => handleUpdateLaborItemSchedule(item.id, Number(e.target.value), item.productivity, item.predecessorId, item.laborItem.scheduleStartDate)}
                                                    className="bg-white border rounded-lg px-2.5 py-1 text-xs font-semibold focus:ring-1 focus:ring-cyan-500"
                                                >
                                                    {[1, 2, 3, 4, 5, 6, 7, 8, 10, 12].map(n => (
                                                        <option key={n} value={n}>{n} {n === 1 ? 'Obrero' : 'Obreros'}</option>
                                                    ))}
                                                </select>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-700 px-2.5 py-1 rounded-full text-xs font-bold border border-slate-200">
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                                                    {item.workers}
                                                </span>
                                            )}
                                        </td>

                                        <td className="p-4">
                                            {isEditing ? (
                                                <div className="flex items-center gap-2">
                                                    <ManagedNumberInput
                                                        type="number"
                                                        value={item.productivity}
                                                        onCommit={(v) => handleUpdateLaborItemSchedule(item.id, item.workers, parseFloat(v) || 1, item.predecessorId, item.laborItem.scheduleStartDate)}
                                                        className="w-20 px-2 py-1 border rounded-lg text-xs font-bold text-slate-900"
                                                        step="0.1"
                                                        min="0.1"
                                                    />
                                                    <span className="text-xs text-slate-500 whitespace-nowrap">{item.unit}/día</span>
                                                </div>
                                            ) : (
                                                <div className="text-xs">
                                                    <span className="font-bold text-slate-800">{item.productivity} {item.unit}/día</span>
                                                    <span className="block text-[10px] text-slate-400">
                                                        Rendimiento por obrero-día
                                                    </span>
                                                </div>
                                            )}
                                        </td>

                                        <td className="p-4">
                                            {isEditing ? (
                                                <select
                                                    value={item.predecessorId || ""}
                                                    onChange={(e) => {
                                                        const val = e.target.value ? Number(e.target.value) : undefined;
                                                        const sDate = val ? undefined : item.laborItem.scheduleStartDate;
                                                        handleUpdateLaborItemSchedule(item.id, item.workers, item.productivity, val, sDate);
                                                    }}
                                                    className="bg-white border rounded-lg px-2.5 py-1 text-xs font-semibold w-full focus:ring-1 focus:ring-cyan-500 max-w-[200px]"
                                                >
                                                    <option value="">Ninguna (Paralela)</option>
                                                    {laborItems
                                                        .filter(a => a.id !== item.id) // avoid self-predecessor
                                                        .map(a => (
                                                            <option key={a.id} value={a.id}>{a.name}</option>
                                                        ))
                                                    }
                                                </select>
                                            ) : (
                                                <div>
                                                    {item.predecessorId ? (
                                                        <span className="inline-flex items-center gap-1.5 bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full text-xs font-bold border border-blue-100">
                                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" /></svg>
                                                            {laborItems.find(a => a.id === item.predecessorId)?.name || 'Actividad previa'}
                                                        </span>
                                                    ) : (
                                                        <span className="text-slate-400 font-normal italic text-xs">Sin predecesora (Inicia en paralelo)</span>
                                                    )}
                                                </div>
                                            )}
                                        </td>

                                        <td className="p-4 text-center">
                                            <span className="bg-cyan-50 text-cyan-800 px-2.5 py-1.5 rounded-xl font-bold border border-cyan-150 text-xs">
                                                {item.durationDays} {item.durationDays === 1 ? 'Día' : 'Días'}
                                            </span>
                                        </td>

                                        <td className="p-4 text-center text-xs font-semibold text-slate-650">
                                            {!item.predecessorId ? (
                                                <div className="flex flex-col items-center gap-1 min-w-[125px]">
                                                    <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Inicio (Raíz):</span>
                                                    <input
                                                        type="date"
                                                        value={item.laborItem.scheduleStartDate || projectStartDate}
                                                        onChange={(e) => handleUpdateLaborItemSchedule(item.id, item.workers, item.productivity, item.predecessorId, e.target.value)}
                                                        className="bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg px-2 py-1 text-xs font-bold text-slate-800 focus:ring-1 focus:ring-cyan-500 text-center w-full max-w-[130px] cursor-pointer"
                                                    />
                                                    <span className="text-[10px] text-slate-450 font-semibold block">
                                                        Fin: {item.endDate.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
                                                    </span>
                                                </div>
                                            ) : (
                                                <div className="flex flex-col items-center">
                                                    <span className="block font-bold text-slate-800">
                                                        {item.startDate.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
                                                    </span>
                                                    <span className="text-[10px] text-slate-450">
                                                        al {item.endDate.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
                                                    </span>
                                                </div>
                                            )}
                                        </td>

                                        <td className="p-4 text-right">
                                            <button
                                                onClick={() => setEditingItemId(isEditing ? null : item.id)}
                                                className={`px-3 py-1.5 rounded-lg font-bold text-xs transition-colors shadow-xs border ${
                                                    isEditing 
                                                        ? 'bg-slate-800 text-white border-slate-800 hover:bg-slate-900' 
                                                        : 'bg-white text-slate-750 border-slate-200 hover:bg-slate-50'
                                                }`}
                                            >
                                                {isEditing ? 'Listo' : 'Ajustar'}
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
