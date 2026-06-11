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
    const categories = [
        { key: 'materials', label: 'Materiales' },
        { key: 'labor', label: 'Mano de Obra' },
        { key: 'transportation', label: 'Transporte' },
        { key: 'manual', label: 'G. Manuales' },
        { key: 'indirect', label: 'G. Indirectos' },
    ];
    
    const Bar = ({ x, y, width, height, color, value }: { x: number, y: number, width: number, height: number, color: string, value: number }) => {
        const [isHovered, setIsHovered] = React.useState(false);
        const formattedValue = value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        return (
            <g onMouseEnter={() => setIsHovered(true)} onMouseLeave={() => setIsHovered(false)}>
                <rect x={x} y={y} width={width} height={height} fill={color} className="transition-all" />
                {isHovered && (
                     <g className="pointer-events-none">
                        <rect x={x - 5} y={y - 28} width={width + 10} height={24} rx="4" fill="rgba(0,0,0,0.7)" />
                        <text x={x + width / 2} y={y - 12} textAnchor="middle" fill="white" fontSize="12" fontWeight="bold">
                            {`$${formattedValue}`}
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
        return max === 0 ? 1000 : Math.ceil(max * 1.1); // Add 10% padding
    }, [chartData]);
    
    const chartHeight = 250;
    const chartWidth = 500;
    const yAxisLabelWidth = 60;
    const xAxisLabelHeight = 40;
    const barGroupWidth = (chartWidth - yAxisLabelWidth) / categories.length;
    const barPadding = 0.2; // 20% padding within group
    const barWidth = (barGroupWidth * (1 - barPadding)) / 2;

    const Legend = () => (
        <div className="flex justify-center items-center gap-6 mt-4 text-sm text-slate-600">
            <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-sm bg-cyan-500"></div>
                <span>Planificado</span>
            </div>
            <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-sm bg-slate-400"></div>
                <span>Real</span>
            </div>
        </div>
    );
    
    return (
        <div className="w-full">
            <svg viewBox={`0 0 ${chartWidth} ${chartHeight + xAxisLabelHeight}`} className="w-full h-auto">
                {/* Y-axis lines and labels */}
                {[0, 0.25, 0.5, 0.75, 1].map(tick => {
                     const y = chartHeight - (chartHeight * tick);
                     const value = maxValue * tick;
                     return (
                         <g key={tick}>
                             <line x1={yAxisLabelWidth} x2={chartWidth} y1={y} y2={y} stroke="#e2e8f0" strokeWidth="1" />
                             <text x={yAxisLabelWidth - 8} y={y + 4} textAnchor="end" fontSize="10" fill="#64748b">
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
                            />
                            <Bar
                                x={groupX + barWidth}
                                y={chartHeight - realHeight}
                                width={barWidth}
                                height={realHeight}
                                color="#94a3b8" // slate-400
                                value={data.real}
                            />
                            {/* X-axis label */}
                             <text x={groupX + barWidth} y={chartHeight + 20} textAnchor="middle" fontSize="12" fill="#334155">
                                {data.label}
                            </text>
                        </g>
                    )
                })}
            </svg>
            <Legend />
        </div>
    );
};

export default FinancialChart;