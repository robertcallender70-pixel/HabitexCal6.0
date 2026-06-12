import React from 'react';
import { ActivityType, CustomMaterialActivity, CustomActivityUnit } from '../types';
import { TrashIcon, PlusIcon, DOSIFICACIONES_REFERENCIA } from '../constants';
import { getDataLibrary } from '../services/database';

// Helper icon for pro features
const ProStarIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-yellow-500" viewBox="0 0 20 20" fill="currentColor">
        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
    </svg>
);


const Input = (props: React.InputHTMLAttributes<HTMLInputElement> & { label: string }) => (
    <div>
        <label className="block text-sm font-medium text-slate-600 mb-1">{props.label}</label>
        <input {...props} className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition" />
    </div>
);

const Select = (props: React.SelectHTMLAttributes<HTMLSelectElement> & { label: string, children: React.ReactNode }) => (
     <div>
        <label className="block text-sm font-medium text-slate-600 mb-1">{props.label}</label>
        <select {...props} className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition bg-white">
            {props.children}
        </select>
    </div>
);

const ActivityForm = ({ activityType, onSave, onCancel, initialData = {}, initialName, customActivityData, isPro, onUpgrade }: { 
    activityType: ActivityType, 
    onSave: (name: string, inputs: Record<string, any>) => void, 
    onCancel: () => void, 
    initialData?: Record<string, any>, 
    initialName?: string,
    customActivityData?: CustomMaterialActivity,
    isPro: boolean,
    onUpgrade: () => void,
}) => {
    const [formData, setFormData] = React.useState<Record<string, any>>(() => {
        const data = { ...initialData };
        if (activityType === ActivityType.REVESTIMIENTO && data.tipoRevestimiento && !data.tiposRevestimiento) {
            data.tiposRevestimiento = { [data.tipoRevestimiento]: true };
            delete data.tipoRevestimiento;
        }
        if (activityType === ActivityType.CUSTOM) {
             if (!data.materials || !Array.isArray(data.materials) || data.materials.length === 0) {
                 data.materials = [{ name: '', quantity: '', unit: '' }];
             }
        }
        return data;
    });
    const [activityName, setActivityName] = React.useState('');
    const [library, setLibrary] = React.useState<Record<string, any> | null>(null);

    React.useEffect(() => {
        const loadLibrary = async () => {
            const data = await getDataLibrary();
            setLibrary(data);
        };
        loadLibrary();
    }, []);

     React.useEffect(() => {
        if (initialName) {
            setActivityName(initialName);
        } else if (activityType) {
            const defaultName = customActivityData 
                ? `${customActivityData.name}`
                : `${activityType}`;
            setActivityName(defaultName);
        }
    }, [initialName, activityType, customActivityData]);


    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        const isRevestimientoCheckbox = library?.morteros_revestimiento?.some((r: any) => r.id === name);

        if (type === 'checkbox') {
            const { checked } = e.target as HTMLInputElement;
            if (isRevestimientoCheckbox) {
                 setFormData(prev => ({
                    ...prev,
                    tiposRevestimiento: {
                        ...(prev.tiposRevestimiento || {}),
                        [name]: checked,
                    }
                }));
            } else {
                setFormData(prev => ({ ...prev, [name]: checked }));
            }
        } else {
            // Keep the raw string value from the input to allow for partial numbers (e.g., "0.00", "12.")
            setFormData(prev => {
                const newData = { ...prev, [name]: value };
                if (name === 'ratio' && value) {
                    delete newData.resistencia;
                } else if (name === 'resistencia' && value) {
                    delete newData.ratio;
                }
                return newData;
            });
        }
    };

    const handleMaterialChange = (index: number, field: string, value: string | number) => {
        const updatedMaterials = [...(formData.materials || [])];
        updatedMaterials[index] = { ...updatedMaterials[index], [field]: value };
        setFormData(prev => ({ ...prev, materials: updatedMaterials }));
    };

    const addMaterialRow = () => {
        const updatedMaterials = [...(formData.materials || []), { name: '', quantity: '', unit: '' }];
        setFormData(prev => ({ ...prev, materials: updatedMaterials }));
    };

    const removeMaterialRow = (index: number) => {
        const updatedMaterials = [...(formData.materials || [])];
        updatedMaterials.splice(index, 1);
        setFormData(prev => ({ ...prev, materials: updatedMaterials }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const dataToSave = { ...formData };
        if (activityType === ActivityType.CUSTOM_MATERIAL_CALCULATION && customActivityData) {
            dataToSave.customActivityId = customActivityData.id;
        }
        if (dataToSave.customName) {
            delete dataToSave.customName;
        }
        onSave(activityName, dataToSave);
    };

    const EncofradoCheckbox = () => (
        <div 
            className="md:col-span-2 mt-4 pt-4 border-t"
            onClick={!isPro ? onUpgrade : undefined}
        >
            <h4 className="text-md font-semibold text-slate-700 mb-2">Encofrado</h4>
            <label className={`flex items-center gap-2 ${!isPro ? 'cursor-pointer opacity-75' : 'cursor-pointer'}`}>
                <input
                    type="checkbox"
                    name="calcularEncofrado"
                    checked={!!formData.calcularEncofrado}
                    onChange={handleChange}
                    className="h-5 w-5 rounded border-gray-300 text-cyan-600 focus:ring-cyan-500 disabled:bg-slate-200 disabled:cursor-not-allowed"
                    disabled={!isPro}
                />
                <span className="text-sm text-slate-600 flex items-center gap-1.5">
                    Incluir cálculo de encofrado
                    {!isPro && <ProStarIcon />}
                </span>
            </label>
            <p className="text-xs text-slate-500 mt-1 pl-7">
                {isPro 
                    ? "Calcula un estimado para madera, puntales, vigas de soporte y clavos."
                    : "Función Pro: Actualice para calcular automáticamente los materiales de encofrado."
                }
            </p>
        </div>
    );

    const renderCimentacionAisladaForm = () => (
        <>
            <h4 className="text-lg font-semibold text-slate-700 border-b pb-2 mb-4">Datos del Plato</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <Input label="Largo (m)" name="platoLargo" type="number" step="0.01" value={formData.platoLargo || ''} onChange={handleChange} required />
                <Input label="Ancho (m)" name="platoAncho" type="number" step="0.01" value={formData.platoAncho || ''} onChange={handleChange} required />
                <Input label="Altura (m)" name="platoAltura" type="number" step="0.01" value={formData.platoAltura || ''} onChange={handleChange} required />
                <Input label="Cantidad" name="platoCantidad" type="number" step="1" value={formData.platoCantidad || ''} onChange={handleChange} required />
            </div>
            <h4 className="text-lg font-semibold text-slate-700 border-b pb-2 mb-4">Datos del Pedestal</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                 <Input label="Largo (m)" name="pedestalLargo" type="number" step="0.01" value={formData.pedestalLargo || ''} onChange={handleChange} required />
                <Input label="Ancho (m)" name="pedestalAncho" type="number" step="0.01" value={formData.pedestalAncho || ''} onChange={handleChange} required />
                <Input label="Altura (m)" name="pedestalAltura" type="number" step="0.01" value={formData.pedestalAltura || ''} onChange={handleChange} required />
                <Input label="Cantidad" name="pedestalCantidad" type="number" step="1" value={formData.pedestalCantidad || ''} onChange={handleChange} required />
            </div>
             <h4 className="text-lg font-semibold text-slate-700 border-b pb-2 mb-4">Hormigón y Acero</h4>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Select label="Dosificación (Proporción)" name="ratio" value={formData.ratio || ''} onChange={handleChange} disabled={!!formData.resistencia}>
                    <option value="">Seleccione (Opcional)</option>
                    {DOSIFICACIONES_REFERENCIA.map((d: any) => <option key={d.ratio} value={d.ratio}>{d.ratio} - {d.nombre}</option>)}
                </Select>
                {formData.ratio && (
                    <div className="p-3 bg-cyan-50 rounded-md text-sm text-cyan-800">
                        <p><strong>MPa Estimado:</strong> {DOSIFICACIONES_REFERENCIA.find(d => d.ratio === formData.ratio)?.mpa} MPa</p>
                        <p><strong>Uso Recomendado:</strong> {DOSIFICACIONES_REFERENCIA.find(d => d.ratio === formData.ratio)?.uso?.join(', ') || 'N/A'}</p>
                    </div>
                )}
                <Select label="Resistencia Hormigón (Kg/cm²) - Referencia" name="resistencia" value={formData.resistencia || ''} onChange={handleChange} disabled={!!formData.ratio}>
                    <option value="">Seleccione (Opcional)</option>
                    {library?.hormigones?.map((h: any) => <option key={h.resistencia} value={h.resistencia}>{h.resistencia}</option>)}
                </Select>
             </div>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <Select label="Tipo de Barra (Plato)" name="tipoBarraPlato" value={formData.tipoBarraPlato || ''} onChange={handleChange}>
                    <option value="">N/A</option>
                    {library?.acero_barras?.map((b: any) => <option key={b.barra} value={b.barra}>#{b.barra} ({b.pulgadas})</option>)}
                </Select>
                 <Input label="Dist. Barras Plato (m)" name="distBarrasPlato" type="number" step="0.01" value={formData.distBarrasPlato || ''} onChange={handleChange} />
             </div>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                 <Select label="Tipo de Barra (Pedestal)" name="tipoBarraPedestal" value={formData.tipoBarraPedestal || ''} onChange={handleChange}>
                    <option value="">N/A</option>
                    {library?.acero_barras?.map((b: any) => <option key={b.barra} value={b.barra}>#{b.barra} ({b.pulgadas})</option>)}
                </Select>
                <Input label="Cant. Barras Pedestal" name="cantBarrasPedestal" type="number" step="1" value={formData.cantBarrasPedestal || ''} onChange={handleChange} />
             </div>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <Select label="Tipo de Barra Aros (Pedestal)" name="tipoBarraArosPedestal" value={formData.tipoBarraArosPedestal || ''} onChange={handleChange}>
                    <option value="">N/A</option>
                    {library?.acero_barras?.map((b: any) => <option key={b.barra} value={b.barra}>#{b.barra} ({b.pulgadas})</option>)}
                </Select>
                <Input label="Dist. Aros Pedestal (m)" name="distArosPedestal" type="number" step="0.01" value={formData.distArosPedestal || ''} onChange={handleChange} />
             </div>
             <EncofradoCheckbox />
        </>
    );

    const renderZapataCorridaForm = () => (
         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label="Largo (m)" name="largo" type="number" step="0.01" value={formData.largo || ''} onChange={handleChange} required />
            <Input label="Ancho (m)" name="ancho" type="number" step="0.01" value={formData.ancho || ''} onChange={handleChange} required />
            <Input label="Altura (m)" name="altura" type="number" step="0.01" value={formData.altura || ''} onChange={handleChange} required />
            <Input label="Cantidad" name="cantidad" type="number" step="1" value={formData.cantidad || ''} onChange={handleChange} required />
            <Select label="Dosificación (Proporción)" name="ratio" value={formData.ratio || ''} onChange={handleChange} disabled={!!formData.resistencia}>
                <option value="">Seleccione (Opcional)</option>
                {DOSIFICACIONES_REFERENCIA.map((d: any) => <option key={d.ratio} value={d.ratio}>{d.ratio} - {d.nombre}</option>)}
            </Select>
            {formData.ratio && (
                <div className="p-3 bg-cyan-50 rounded-md text-sm text-cyan-800">
                    <p><strong>MPa Estimado:</strong> {DOSIFICACIONES_REFERENCIA.find(d => d.ratio === formData.ratio)?.mpa} MPa</p>
                    <p><strong>Uso Recomendado:</strong> {DOSIFICACIONES_REFERENCIA.find(d => d.ratio === formData.ratio)?.uso?.join(', ') || 'N/A'}</p>
                </div>
            )}
            <Select label="Resistencia Hormigón (Kg/cm²)" name="resistencia" value={formData.resistencia || ''} onChange={handleChange} disabled={!!formData.ratio}>
                <option value="">Seleccione (Opcional)</option>
                {library?.hormigones?.map((h: any) => <option key={h.resistencia} value={h.resistencia}>{h.resistencia}</option>)}
            </Select>
            <Input label="Cantidad de Barras Lineales" name="cantBarras" type="number" step="1" value={formData.cantBarras || ''} onChange={handleChange} />
            <Select label="Tipo de Barra Lineal" name="tipoBarra" value={formData.tipoBarra || ''} onChange={handleChange}>
                <option value="">N/A</option>
                {library?.acero_barras?.map((b: any) => <option key={b.barra} value={b.barra}>#{b.barra} ({b.pulgadas})</option>)}
            </Select>
             <Input label="Distancia entre Aros (m)" name="distAros" type="number" step="0.01" value={formData.distAros || ''} onChange={handleChange} />
             <Select label="Tipo de Barra para Aros" name="tipoBarraAros" value={formData.tipoBarraAros || ''} onChange={handleChange}>
                <option value="">N/A</option>
                {library?.acero_barras?.map((b: any) => <option key={b.barra} value={b.barra}>#{b.barra} ({b.pulgadas})</option>)}
            </Select>
            <EncofradoCheckbox />
        </div>
    );

    const renderMuroForm = () => (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label="Largo (m)" name="largo" type="number" step="0.01" value={formData.largo || ''} onChange={handleChange} required />
            <Input label="Altura (m)" name="altura" type="number" step="0.01" value={formData.altura || ''} onChange={handleChange} required />
            <Select label="Tipo de Muro" name="tipoMuro" value={formData.tipoMuro || ''} onChange={handleChange} required>
                <option value="">Seleccione</option>
                {library?.morteros_muros?.map((m: any) => <option key={m.id} value={m.id}>{m.nombre}</option>)}
            </Select>
        </div>
    );

    const renderRevestimientoForm = () => (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label="Largo (m)" name="largo" type="number" step="0.01" value={formData.largo || ''} onChange={handleChange} required />
            <Input label="Altura (m)" name="altura" type="number" step="0.01" value={formData.altura || ''} onChange={handleChange} required />
            <div className="md:col-span-2">
                <Input label="Número de Caras" name="numCaras" type="number" step="1" value={formData.numCaras || ''} onChange={handleChange} required />
            </div>
            
            <div className="md:col-span-2 mt-4 pt-4 border-t">
                <h4 className="text-md font-semibold text-slate-700 mb-2">Tipos de Capas de Revestimiento</h4>
                <p className="text-xs text-slate-500 mb-3">Seleccione una o más capas para aplicar al área calculada.</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2">
                    {library?.morteros_revestimiento?.map((r: any) => (
                        <label key={r.id} className="flex items-center gap-2 cursor-pointer p-2 rounded-md hover:bg-slate-100 transition-colors">
                            <input
                                type="checkbox"
                                name={r.id}
                                checked={!!formData.tiposRevestimiento?.[r.id]}
                                onChange={handleChange}
                                className="h-4 w-4 rounded border-gray-300 text-cyan-600 focus:ring-cyan-500"
                            />
                            <span className="text-sm text-slate-700">{r.nombre}</span>
                        </label>
                    ))}
                </div>
            </div>
        </div>
    );
    
    const renderPisoForm = () => (
         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input 
                label={formData.tipoPiso === 'rodapie_8x25' ? "Longitud (m)" : "Área (m²)"} 
                name="area" 
                type="number" 
                step="0.01" 
                value={formData.area || ''} 
                onChange={handleChange} 
                required 
            />
            <Select label="Tipo de Piso/Actividad" name="tipoPiso" value={formData.tipoPiso || ''} onChange={handleChange} required>
                <option value="">Seleccione</option>
                {library?.morteros_piso?.map((p: any) => <option key={p.id} value={p.id}>{p.nombre}</option>)}
            </Select>
            {formData.tipoPiso === 'piso_ceramica' && (
                <>
                    <Input 
                        label="Largo de la Losa (m)" 
                        name="tileLength" 
                        type="number" 
                        step="0.01" 
                        value={formData.tileLength || ''} 
                        onChange={handleChange} 
                        required
                        placeholder="Ej: 0.40"
                    />
                    <Input 
                        label="Ancho de la Losa (m)" 
                        name="tileWidth" 
                        type="number" 
                        step="0.01" 
                        value={formData.tileWidth || ''} 
                        onChange={handleChange} 
                        required
                        placeholder="Ej: 0.60"
                    />
                </>
            )}
        </div>
    );

    const renderLosaForm = () => (
         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label="Largo (m)" name="largo" type="number" step="0.01" value={formData.largo || ''} onChange={handleChange} required />
            <Input label="Ancho (m)" name="ancho" type="number" step="0.01" value={formData.ancho || ''} onChange={handleChange} required />
            <Input label="Altura (m)" name="altura" type="number" step="0.01" value={formData.altura || ''} onChange={handleChange} required />
            <Input label="Cantidad" name="cantidad" type="number" step="1" value={formData.cantidad || ''} onChange={handleChange} required />
            <Select label="Dosificación (Proporción)" name="ratio" value={formData.ratio || ''} onChange={handleChange} disabled={!!formData.resistencia}>
                <option value="">Seleccione (Opcional)</option>
                {DOSIFICACIONES_REFERENCIA.map((d: any) => <option key={d.ratio} value={d.ratio}>{d.ratio} - {d.nombre}</option>)}
            </Select>
            {formData.ratio && (
                <div className="p-3 bg-cyan-50 rounded-md text-sm text-cyan-800">
                    <p><strong>MPa Estimado:</strong> {DOSIFICACIONES_REFERENCIA.find(d => d.ratio === formData.ratio)?.mpa} MPa</p>
                    <p><strong>Uso Recomendado:</strong> {DOSIFICACIONES_REFERENCIA.find(d => d.ratio === formData.ratio)?.uso?.join(', ') || 'N/A'}</p>
                </div>
            )}
            <Select label="Resistencia Hormigón (Kg/cm²) - Referencia" name="resistencia" value={formData.resistencia || ''} onChange={handleChange} disabled={!!formData.ratio}>
                <option value="">Seleccione (Opcional)</option>
                {library?.hormigones?.map((h: any) => <option key={h.resistencia} value={h.resistencia}>{h.resistencia}</option>)}
            </Select>
            <Input label="Distancia entre Barras (m)" name="distBarras" type="number" step="0.01" value={formData.distBarras || ''} onChange={handleChange} />
            <Select label="Tipo de Barra" name="tipoBarra" value={formData.tipoBarra || ''} onChange={handleChange}>
                <option value="">N/A</option>
                {library?.acero_barras?.map((b: any) => <option key={b.barra} value={b.barra}>#{b.barra} ({b.pulgadas})</option>)}
            </Select>
            <EncofradoCheckbox />
        </div>
    );
    
    const renderPinturaForm = () => (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label="Área a pintar (m²)" name="area" type="number" step="0.01" value={formData.area || ''} onChange={handleChange} required />
            <Select label="Tipo de Pintura y Superficie" name="tipoPintura" value={formData.tipoPintura || ''} onChange={handleChange} required>
                <option value="">Seleccione</option>
                <option value="vinyl_lisa">Vinyl - Superficie Lisa</option>
                <option value="vinyl_rustico">Vinyl - Superficie Rústica</option>
                <option value="aceite_aparejo">Aceite - Aparejo</option>
                <option value="aceite_pintura">Aceite - Pintura</option>
                <option value="lechada_cal">Lechada - Cal</option>
                <option value="lechada_masilla">Lechada - Masilla</option>
            </Select>
            <Input label="Número de Manos" name="numManos" type="number" step="1" value={formData.numManos || ''} onChange={handleChange} required />
        </div>
    );

    const renderEnchapeParedForm = () => (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label="Área de Enchape (m²)" name="area" type="number" step="0.01" value={formData.area || ''} onChange={handleChange} required />
            <Select label="Tipo de Losa" name="tipoLosa" value={formData.tipoLosa || ''} onChange={handleChange} required>
                 <option value="">Seleccione</option>
                 <option value="30x30cm">30x30 cm</option>
                 <option value="40x40cm">40x40 cm</option>
                 <option value="60x60cm">60x60 cm</option>
                 <option value="personalizado">Personalizado</option>
            </Select>
        </div>
    );

    const renderPladurForm = () => (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label="Largo (m)" name="largo" type="number" step="0.01" value={formData.largo || ''} onChange={handleChange} required />
            <Input label="Altura / Ancho (m)" name="altura" type="number" step="0.01" value={formData.altura || ''} onChange={handleChange} required />
            <div className="md:col-span-2">
                <Select label="Tipo de Estructura" name="tipoEstructura" value={formData.tipoEstructura || ''} onChange={handleChange} required>
                    <option value="">Seleccione</option>
                    <option value="pared">Pared (Tabique)</option>
                    <option value="techo">Falso Techo</option>
                </Select>
            </div>
            <div className="md:col-span-2 mt-4 pt-4 border-t">
                <h4 className="text-md font-semibold text-slate-700 mb-2">Opciones Adicionales</h4>
                <label className="flex items-center gap-2 cursor-pointer">
                    <input
                        type="checkbox"
                        name="incluirAislamiento"
                        checked={!!formData.incluirAislamiento}
                        onChange={handleChange}
                        className="h-5 w-5 rounded border-gray-300 text-cyan-600 focus:ring-cyan-500"
                    />
                    <span className="text-sm text-slate-600">Incluir cálculo de Aislamiento</span>
                </label>
                <p className="text-xs text-slate-500 mt-1 pl-7">
                    Añade Lana de Roca o un aislante similar al cálculo (1 m² por cada m² de superficie).
                </p>
            </div>
        </div>
    );

    const renderCustomMaterialCalculationForm = () => {
        const unit = customActivityData?.unitOfMeasure;
    
        if (!unit) {
            return <p className="text-red-500">Error: No se ha definido una unidad de medida para esta actividad personalizada.</p>;
        }
    
        switch (unit) {
            case 'm':
                return (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input label="Longitud (m)" name="longitud" type="number" step="0.01" value={formData.longitud || ''} onChange={handleChange} required />
                    </div>
                );
            case 'm²':
                return (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input label="Largo (m)" name="largo" type="number" step="0.01" value={formData.largo || ''} onChange={handleChange} required />
                        <Input label="Ancho (m)" name="ancho" type="number" step="0.01" value={formData.ancho || ''} onChange={handleChange} required />
                    </div>
                );
            case 'm³':
                 return (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Input label="Largo (m)" name="largo" type="number" step="0.01" value={formData.largo || ''} onChange={handleChange} required />
                        <Input label="Ancho (m)" name="ancho" type="number" step="0.01" value={formData.ancho || ''} onChange={handleChange} required />
                        <Input label="Altura (m)" name="altura" type="number" step="0.01" value={formData.altura || ''} onChange={handleChange} required />
                    </div>
                );
            case 'unidad':
                return (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input label="Cantidad (unidades)" name="cantidad" type="number" step="1" value={formData.cantidad || ''} onChange={handleChange} required />
                    </div>
                );
            default:
                 return <p className="text-red-500">Unidad de medida "{unit}" no reconocida.</p>;
        }
    };

    const renderCustomActivityForm = () => (
        <div className="space-y-4">
            <h4 className="text-lg font-semibold text-slate-700 border-b pb-2 mb-2 mt-6">Materiales</h4>
            
            <div className="space-y-3">
                {(formData.materials || []).map((material: any, index: number) => (
                    <div key={index} className="grid grid-cols-1 md:grid-cols-8 gap-2 items-end p-3 bg-slate-50 rounded-md">
                        <div className="md:col-span-3">
                            <Input 
                                label={`Material #${index + 1}`}
                                type="text"
                                placeholder="Ej: Cemento"
                                value={material.name || ''}
                                onChange={(e) => handleMaterialChange(index, 'name', e.target.value)}
                            />
                        </div>
                        <div className="md:col-span-2">
                             <Input 
                                label="Cantidad"
                                type="number"
                                placeholder="0.00"
                                step="0.01"
                                value={material.quantity || ''}
                                onChange={(e) => handleMaterialChange(index, 'quantity', e.target.value)}
                            />
                        </div>
                         <div className="md:col-span-2">
                            <Input 
                                label="Unidad"
                                type="text"
                                placeholder="sacos, m³, kg"
                                value={material.unit || ''}
                                onChange={(e) => handleMaterialChange(index, 'unit', e.target.value)}
                            />
                        </div>
                        <div className="md:col-span-1">
                            <button 
                                type="button" 
                                onClick={() => removeMaterialRow(index)}
                                className="w-full p-2 bg-red-100 text-red-600 rounded-md hover:bg-red-200 transition-colors flex justify-center items-center"
                                aria-label="Eliminar material"
                            >
                                <TrashIcon className="h-5 w-5" />
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            <button 
                type="button" 
                onClick={addMaterialRow}
                className="flex items-center gap-2 px-3 py-2 bg-slate-200 text-slate-700 rounded-md hover:bg-slate-300 transition-colors text-sm"
            >
                <PlusIcon className="h-4 w-4" />
                Añadir Material
            </button>
        </div>
    );

    const renderFormFields = () => {
        switch (activityType) {
            case ActivityType.CIMENTACION_AISLADA: return renderCimentacionAisladaForm();
            case ActivityType.ZAPATA_CORRIDA:
            case ActivityType.COLUMNA:
            case ActivityType.VIGA:
                return renderZapataCorridaForm();
            case ActivityType.LEVANTE_MURO: return renderMuroForm();
            case ActivityType.REVESTIMIENTO: return renderRevestimientoForm();
            case ActivityType.PISO: return renderPisoForm();
            case ActivityType.LOSA: return renderLosaForm();
            case ActivityType.PINTURA: return renderPinturaForm();
            case ActivityType.ENCHAPE_PARED: return renderEnchapeParedForm();
            case ActivityType.ESTRUCTURA_PLADUR: return renderPladurForm();
            // FIX: Removed unused ActivityType 'ESTRUCTURA_METALICA' which was causing a compile error.
            case ActivityType.CUSTOM_MATERIAL_CALCULATION: return renderCustomMaterialCalculationForm();
            case ActivityType.CUSTOM: return renderCustomActivityForm();
            default: return <p>Tipo de actividad no reconocida.</p>;
        }
    };
    
    if (!library) {
        return (
            <div className="flex justify-center items-center p-8">
                <p className="text-slate-500">Cargando datos de la biblioteca...</p>
            </div>
        );
    }
    
    return (
        <form onSubmit={handleSubmit}>
            <div className="space-y-4">
                 <div className="mb-6">
                    <Input 
                        label="Nombre de la Actividad" 
                        name="activityName" 
                        type="text" 
                        value={activityName} 
                        onChange={(e) => setActivityName(e.target.value)} 
                        required 
                        placeholder="Ej: Columna del Patio"
                    />
                </div>
                {renderFormFields()}
            </div>
            <div className="flex justify-end items-center gap-4 mt-8 pt-4 border-t">
                <button type="button" onClick={onCancel} className="px-4 py-2 bg-slate-200 text-slate-700 rounded-md hover:bg-slate-300 transition-colors">Cancelar</button>
                <button type="submit" className="px-4 py-2 bg-cyan-600 text-white rounded-md hover:bg-cyan-700 transition-colors shadow">Guardar Actividad</button>
            </div>
        </form>
    );
};

export default ActivityForm;