import React from 'react';

interface ChartData {
    materials: number;
    labor: number;
    transportation: number;
    manual: number;
    indirect: number;
}

interface FinancialChartProps {
    plannedCosts: ChartData;
    realCosts: ChartData;
    currency: 'MN' | 'USD';
    exchangeRate: number;
}

const FinancialChart: React.FC<FinancialChartProps> = ({ plannedCosts, realCosts, currency, exchangeRate }) => {
    const [activeBar, setActiveBar] = React.useState<{ index: number, type: 'planned' | 'real' } | null>(null);

    const categories = [
        { key: 'materials', label: 'Materiales' },
        { key: 'labor', label: 'Mano de Obra' },
        { key: 'transportation', label: 'Transporte' },
        { key: 'manual', label: 'G. Manuales' },
        { key: 'indirect', label: 'G. Indirectos' },
    ];
    
    const Bar = ({ 
        x, 
        y, 
        width, 
        height, 
        color, 
        value,
        isActive,
        onActivate,
        onDeactivate
    }: { 
        x: number, 
        y: number, 
        width: number, 
        height: number, 
        color: string, 
        value: number,
        isActive: boolean,
        onActivate: () => void,
        onDeactivate: () => void
    }) => {
        const formattedValue = value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        const symbol = currency === 'MN' ? 'CUP ' : '$';
        const textContent = `${symbol}${formattedValue}`;
        
        // Calculate dynamic width based on text length to avoid truncation
        const tooltipWidth = Math.max(95, textContent.length * 7.5 + 16);
        
        // Clamp the tooltip horizontally to stay inside the SVG canvas
        const rectX = Math.max(yAxisLabelWidth + 4, Math.min(chartWidth - tooltipWidth - 4, x + width / 2 - tooltipWidth / 2));
        
        // Clamp the tooltip vertically so it doesn't get cut off at the top
        const rectY = Math.max(6, y - 32);
        const textY = rectY + 17;

        return (
            <g 
                onMouseEnter={onActivate} 
                onMouseLeave={onDeactivate}
                onTouchStart={(e) => {
                    e.stopPropagation();
                    onActivate();
                }}
                onClick={(e) => {
                    e.stopPropagation();
                    onActivate();
                }}
                className="cursor-pointer"
            >
                <rect 
                    x={x} 
                    y={y} 
                    width={width} 
                    height={height} 
                    fill={color} 
                    className="transition-all duration-200" 
                    opacity={isActive ? 1 : 0.85}
                    rx="1.5"
                />
                {isActive && (
                    <g className="pointer-events-none" style={{ zIndex: 50 }}>
                        {/* Background with shadow effect */}
                        <rect 
                            x={rectX} 
                            y={rectY} 
                            width={tooltipWidth} 
                            height={25} 
                            rx="5" 
                            fill="#0f172a" 
                            stroke="#334155"
                            strokeWidth="1"
                        />
                        <text 
                            x={rectX + tooltipWidth / 2} 
                            y={textY} 
                            textAnchor="middle" 
                            fill="#f8fafc" 
                            fontSize="11" 
                            fontWeight="bold"
                            fontFamily="monospace"
                        >
                            {textContent}
                        </text>
                    </g>
                )}
            </g>
        );
    };

    const convertValue = (usdValue: number) => {
        return currency === 'MN' ? usdValue * exchangeRate : usdValue;
    };
    
    const chartData = categories.map(cat => ({
        label: cat.label,
        planned: convertValue(plannedCosts[cat.key as keyof ChartData]),
        real: convertValue(realCosts[cat.key as keyof ChartData]),
    }));

    const maxValue = React.useMemo(() => {
        const allValues = chartData.flatMap(d => [d.planned, d.real]);
        const max = Math.max(...allValues);
        return max === 0 ? 1000 : Math.ceil(max * 1.15); // Add 15% padding to ensure top tooltips fit
    }, [chartData]);
    
    const chartHeight = 250;
    const chartWidth = 500;
    const yAxisLabelWidth = 65;
    const xAxisLabelHeight = 40;
    const barGroupWidth = (chartWidth - yAxisLabelWidth) / categories.length;
    const barPadding = 0.25; // padding within group
    const barWidth = (barGroupWidth * (1 - barPadding)) / 2;

    const Legend = () => (
        <div className="flex justify-center items-center gap-6 mt-4 text-sm font-semibold text-slate-600">
            <div className="flex items-center gap-2">
                <div className="w-3.5 h-3.5 rounded-md bg-cyan-500"></div>
                <span>Planificado</span>
            </div>
            <div className="flex items-center gap-2">
                <div className="w-3.5 h-3.5 rounded-md bg-slate-400"></div>
                <span>Real</span>
            </div>
        </div>
    );
    
    return (
        <div className="w-full">
            <div className="relative overflow-hidden bg-white/50 backdrop-blur-sm border border-slate-100 rounded-2xl p-4">
                <svg 
                    viewBox={`0 0 ${chartWidth} ${chartHeight + xAxisLabelHeight}`} 
                    className="w-full h-auto select-none"
                    onClick={() => setActiveBar(null)}
                >
                    {/* Y-axis lines and labels */}
                    {[0, 0.25, 0.5, 0.75, 1].map(tick => {
                         const y = chartHeight - (chartHeight * tick);
                         const value = maxValue * tick;
                         return (
                             <g key={tick}>
                                 <line x1={yAxisLabelWidth} x2={chartWidth} y1={y} y2={y} stroke="#f1f5f9" strokeWidth="1" />
                                 <text x={yAxisLabelWidth - 10} y={y + 3} textAnchor="end" fontSize="10" fontWeight="500" fill="#64748b" fontFamily="monospace">
                                    {value.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                                 </text>
                             </g>
                         )
                    })}
    
                    {/* Bars */}
                    {chartData.map((data, index) => {
                        const groupX = yAxisLabelWidth + index * barGroupWidth + (barGroupWidth * barPadding / 2);
                        const plannedHeight = (data.planned / maxValue) * chartHeight;
                        const realHeight = (data.real / maxValue) * chartHeight;
                        
                        return (
                            <g key={data.label}>
                                <Bar
                                    x={groupX}
                                    y={chartHeight - plannedHeight}
                                    width={barWidth}
                                    height={plannedHeight}
                                    color="#06b6d4" // cyan-500
                                    value={data.planned}
                                    isActive={activeBar?.index === index && activeBar?.type === 'planned'}
                                    onActivate={() => setActiveBar({ index, type: 'planned' })}
                                    onDeactivate={() => setActiveBar(null)}
                                />
                                <Bar
                                    x={groupX + barWidth}
                                    y={chartHeight - realHeight}
                                    width={barWidth}
                                    height={realHeight}
                                    color="#94a3b8" // slate-400
                                    value={data.real}
                                    isActive={activeBar?.index === index && activeBar?.type === 'real'}
                                    onActivate={() => setActiveBar({ index, type: 'real' })}
                                    onDeactivate={() => setActiveBar(null)}
                                />
                                {/* X-axis label */}
                                 <text x={groupX + barWidth} y={chartHeight + 20} textAnchor="middle" fontSize="11" fontWeight="600" fill="#475569">
                                    {data.label}
                                </text>
                            </g>
                        )
                    })}
                </svg>
                <Legend />
            </div>
        </div>
    );
};

export default FinancialChart;