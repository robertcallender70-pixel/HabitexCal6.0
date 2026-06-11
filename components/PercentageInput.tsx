
import React from 'react';
import type { Project } from '../types';

const PercentageInput = ({ label, field, value, onChange }: { label: string, field: keyof Project, value: number | undefined, onChange: (field: keyof Project, value: string) => void }) => {
    const [localValue, setLocalValue] = React.useState(value != null ? String(value) : '');
    const inputRef = React.useRef<HTMLInputElement>(null);

    React.useEffect(() => {
        if (document.activeElement !== inputRef.current) {
            setLocalValue(value != null ? String(value) : '');
        }
    }, [value]);

    const handleLocalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setLocalValue(e.target.value);
    };

    const handleBlur = () => {
        onChange(field, localValue);
    };

    return (
        <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">{label}</label>
            <div className="relative">
                <input
                    ref={inputRef}
                    type="number"
                    value={localValue}
                    onChange={handleLocalChange}
                    onBlur={handleBlur}
                    className="w-full pl-3 pr-8 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    placeholder="0"
                    step="0.1"
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <span className="text-slate-500 sm:text-sm">%</span>
                </div>
            </div>
        </div>
    );
};

export default PercentageInput;
