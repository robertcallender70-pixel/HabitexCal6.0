
import React from 'react';

const ManagedNumberInput = ({ value: propValue, onCommit, type = 'number', hideLabel, ...props }: { value: number | string | undefined, onCommit: (value: string) => void, type?: string, hideLabel?: boolean, [key:string]: any }) => {
    const [localValue, setLocalValue] = React.useState(propValue != null ? String(propValue) : '');
    const inputRef = React.useRef<HTMLInputElement>(null);

    React.useEffect(() => {
        if (document.activeElement !== inputRef.current) {
            setLocalValue(propValue != null ? String(propValue) : '');
        }
    }, [propValue]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setLocalValue(e.target.value);
    };

    const handleBlur = () => {
        onCommit(localValue);
    };
    
    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            onCommit(localValue);
            (e.target as HTMLInputElement).blur();
        }
    };

    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
        // If the value is '0', select it so the user can just start typing.
        if (e.target.value === '0') {
            e.target.select();
        }
    };

    return <input {...props} ref={inputRef} type={type} value={localValue} onChange={handleChange} onBlur={handleBlur} onKeyDown={handleKeyDown} onFocus={handleFocus} />;
};

export default ManagedNumberInput;
