import { ActivityType, type Material, type CustomMaterialActivity, type CustomActivityUnit, type CommercialUnitRule } from '../types';
import { getDataLibrary } from './database';
import { DOSIFICACIONES_REFERENCIA } from '../constants';

// Función para estimar la resistencia
export const estimateStrengthFromRatio = (ratio: string) => {
    return DOSIFICACIONES_REFERENCIA.find(d => d.ratio === ratio) || null;
};

const getConstants = async () => {
    return await getDataLibrary();
};


const addMaterial = (materials: Material[], name: string, quantity: number, unit: string) => {
    if (quantity > 0) {
        const existing = materials.find(m => m.name === name && m.unit === unit);
        if (existing) {
            existing.quantity += quantity;
        } else {
            materials.push({ name, quantity, unit });
        }
    }
};

const applyCommercialRules = (materials: Material[], rules: CommercialUnitRule[]): Material[] => {
    if (!rules || rules.length === 0) {
        return materials;
    }

    const processedMaterials = materials.flatMap(material => {
        const matchingRule = rules
            .filter(r => material.name.toLowerCase().includes(r.materialName.toLowerCase()) && material.unit === r.baseUnit)
            .sort((a, b) => b.materialName.length - a.materialName.length)[0];

        if (!matchingRule) {
            return [material]; // Return as array for flatMap
        }

        switch (matchingRule.rule) {
            case 'ceil':
                return [{ ...material, quantity: Math.ceil(material.quantity) }];
            
            case 'multiple-increment':
                if (matchingRule.increment && matchingRule.increment > 0) {
                    const increment = matchingRule.increment;
                    const numUnits = Math.ceil(material.quantity / increment);
                    if (matchingRule.outputUnitFormat) {
                        return [{ ...material, quantity: numUnits, unit: matchingRule.outputUnitFormat.replace('{increment}', String(increment)) }];
                    } else {
                        // This case is less useful but kept for compatibility. It returns the total quantity in the base unit, rounded up to the nearest package size.
                        return [{ ...material, quantity: numUnits * increment }];
                    }
                }
                return [material];

            case 'multiple-options':
                if (matchingRule.selectedOption && matchingRule.options?.includes(matchingRule.selectedOption)) {
                    const selectedLength = matchingRule.selectedOption;
                    const numBars = Math.ceil(material.quantity / selectedLength);
                    return [{
                        ...material,
                        name: material.name.replace('(longitud)', '').trim(),
                        quantity: numBars,
                        unit: matchingRule.outputUnitFormat
                            ? matchingRule.outputUnitFormat.replace('{option}', String(selectedLength))
                            : `barras de ${selectedLength}${material.unit}`
                    }];
                }
                return [material];

            case 'best-fit-combination': {
                const sizes = (matchingRule.options || []).sort((a, b) => b - a);
                if (sizes.length === 0) return [material];

                const newMaterials: Material[] = [];
                let remainingQty = material.quantity;

                for (const size of sizes) {
                    if (remainingQty >= size) {
                        const count = Math.floor(remainingQty / size);
                         const newUnit = matchingRule.outputUnitFormat
                            ? matchingRule.outputUnitFormat.replace('{option}', String(size))
                            : `${size}${material.unit} unit`;
                        
                        newMaterials.push({
                            ...material,
                            name: material.name.replace('(longitud)', '').trim(),
                            quantity: count,
                            unit: newUnit,
                        });
                        remainingQty %= size;
                    }
                }

                if (remainingQty > 0.001) { // Use a tolerance for floating point
                    const smallestSize = sizes[sizes.length - 1];
                    const unitForSmallest = matchingRule.outputUnitFormat
                        ? matchingRule.outputUnitFormat.replace('{option}', String(smallestSize))
                        : `${smallestSize}${material.unit} unit`;
                    
                    const existingSmallest = newMaterials.find(m => m.unit === unitForSmallest);
                    if (existingSmallest) {
                        existingSmallest.quantity += 1;
                    } else {
                        newMaterials.push({
                            ...material,
                            name: material.name.replace('(longitud)', '').trim(),
                            quantity: 1,
                            unit: unitForSmallest,
                        });
                    }
                }
                return newMaterials.length > 0 ? newMaterials : [material];
            }

            default:
                return [material];
        }
    });
    
    // Re-aggregate materials after processing rules, as some rules might create multiple new items
    // or change units, leading to items that can now be combined.
    const finalMaterials: Material[] = [];
    processedMaterials.forEach(m => {
        const existing = finalMaterials.find(fm => fm.name === m.name && fm.unit === m.unit && fm.layer === m.layer);
        if(existing) {
            existing.quantity += m.quantity;
        } else {
            finalMaterials.push({...m});
        }
    });

    return finalMaterials;
};


export const calculateMaterials = async (type: ActivityType, inputs: Record<string, any>): Promise<Material[]> => {
    const constants = await getConstants();
    const { 
        hormigones: HORMIGONES_DATA, 
        acero_barras: ACERO_BARRAS_DATA, 
        morteros_muros: MORTEROS_MUROS_DATA,
        morteros_revestimiento: MORTEROS_REVESTIMIENTO_DATA,
        morteros_piso: MORTEROS_PISO_DATA,
        pintura: PINTURA_DATA,
        enchape: ENCHAPE_DATA,
        pladur_pared: PLADUR_PARED_DATA,
        pladur_techo: PLADUR_TECHO_DATA,
        custom_material_activities: CUSTOM_MATERIAL_ACTIVITIES_DATA,
        commercial_unit_rules: COMMERCIAL_UNIT_RULES_DATA,
        commercial_rules_enabled: COMMERCIAL_RULES_ENABLED,
    } = constants;

    const calculateHormigon = (volumen: number, resistencia: number, ratio?: string) => {
        if (ratio) {
            const dosage = DOSIFICACIONES_REFERENCIA.find(d => d.ratio === ratio);
            if (dosage && volumen > 0) {
                return [
                    { name: 'Cemento', quantity: dosage.factores.cemento * volumen, unit: 'sacos' },
                    { name: 'Arena', quantity: dosage.factores.arena * volumen, unit: 'm³' },
                    { name: 'Piedra', quantity: dosage.factores.piedra * volumen, unit: 'm³' },
                    { name: 'Agua', quantity: dosage.factores.agua * volumen, unit: 'litros' },
                 ];
            }
        }
        
        const hormigon = HORMIGONES_DATA.find((h: any) => h.resistencia === resistencia);
        if (!hormigon || volumen <= 0) return [];
        
        return [
            { name: 'Cemento', quantity: hormigon.cemento * volumen, unit: 'sacos' },
            { name: 'Arena', quantity: hormigon.arena * volumen, unit: 'm³' },
            { name: 'Piedra', quantity: hormigon.piedra * volumen, unit: 'm³' },
            { name: 'Agua', quantity: hormigon.agua * volumen, unit: 'litros' },
        ];
    };

    const getPesoAcero = (barraNum: number): number => {
        return ACERO_BARRAS_DATA.find((b: any) => b.barra === barraNum)?.pesoUnit || 0;
    };

    const getNombreAcero = (barraNum: number): string => {
        const barra = ACERO_BARRAS_DATA.find((b: any) => b.barra === barraNum);
        return barra ? `Acero #${barra.barra} (${barra.pulgadas})` : `Acero #${barraNum}`;
    };


    let materials: Material[] = [];
    let totalAceroKg = 0;

    switch (type) {
        case ActivityType.CIMENTACION_AISLADA: {
            const { platoLargo, platoAncho, platoAltura, platoCantidad, resistencia,
                    pedestalLargo, pedestalAncho, pedestalAltura, pedestalCantidad, calcularEncofrado } = inputs;

            const volPlato = platoLargo * platoAncho * platoAltura * platoCantidad;
            const volPedestal = pedestalLargo * pedestalAncho * pedestalAltura * pedestalCantidad;
            const volTotal = volPlato + volPedestal;
            
            calculateHormigon(volTotal, resistencia, inputs.ratio).forEach(m => addMaterial(materials, m.name, m.quantity, m.unit));

            // Acero Plato
            const { distBarrasPlato, tipoBarraPlato } = inputs;
            if (distBarrasPlato > 0 && tipoBarraPlato) {
                const pesoAceroPlato = getPesoAcero(tipoBarraPlato);
                const longLargoPlato = ((platoLargo / distBarrasPlato) + 1) * platoAncho * platoCantidad;
                const longAnchoPlato = ((platoAncho / distBarrasPlato) + 1) * platoLargo * platoCantidad;
                const longTotalPlato = longLargoPlato + longAnchoPlato;
                const pesoTotalPlatoKg = longTotalPlato * pesoAceroPlato;
                addMaterial(materials, getNombreAcero(tipoBarraPlato), pesoTotalPlatoKg, 'kg');
                addMaterial(materials, `${getNombreAcero(tipoBarraPlato)} (longitud)`, longTotalPlato, 'm');
                totalAceroKg += pesoTotalPlatoKg;
            }

            // Acero Pedestal
            const { cantBarrasPedestal, tipoBarraPedestal, distArosPedestal, tipoBarraArosPedestal } = inputs;
            if (cantBarrasPedestal > 0 && tipoBarraPedestal) {
                const pesoAceroPedestal = getPesoAcero(tipoBarraPedestal);
                const longLinealPedestal = cantBarrasPedestal * pedestalAltura * pedestalCantidad;
                const pesoTotalPedestalKg = longLinealPedestal * pesoAceroPedestal;
                addMaterial(materials, getNombreAcero(tipoBarraPedestal), pesoTotalPedestalKg, 'kg');
                addMaterial(materials, `${getNombreAcero(tipoBarraPedestal)} (longitud)`, longLinealPedestal, 'm');
                totalAceroKg += pesoTotalPedestalKg;
            }
            if (distArosPedestal > 0 && tipoBarraArosPedestal) {
                const pesoAceroAros = getPesoAcero(tipoBarraArosPedestal);
                const cantAros = (pedestalAltura / distArosPedestal);
                const longAro = (pedestalLargo + pedestalAncho) * 2;
                const longTotalAros = cantAros * longAro * pedestalCantidad;
                const pesoTotalArosKg = longTotalAros * pesoAceroAros;
                addMaterial(materials, getNombreAcero(tipoBarraArosPedestal), pesoTotalArosKg, 'kg');
                addMaterial(materials, `${getNombreAcero(tipoBarraArosPedestal)} (longitud)`, longTotalAros, 'm');
                totalAceroKg += pesoTotalArosKg;
            }

            // Encofrado del Pedestal
            if (calcularEncofrado && pedestalLargo > 0 && pedestalAncho > 0 && pedestalAltura > 0 && pedestalCantidad > 0) {
                const areaContacto = (pedestalLargo + pedestalAncho) * 2 * pedestalAltura * pedestalCantidad;
                const areaSoporte = areaContacto; // Bracing related to surface area
                addMaterial(materials, 'Madera para encofrado', areaContacto * 1.1, 'm²');
                addMaterial(materials, 'Puntales de madera', Math.ceil(areaSoporte), 'unidades');
                addMaterial(materials, 'Vigas de soporte (encofrado)', areaSoporte, 'm');
                addMaterial(materials, 'Clavos para encofrado', areaContacto * 0.3, 'kg');
            }
            break;
        }
        case ActivityType.ZAPATA_CORRIDA:
        case ActivityType.COLUMNA:
        case ActivityType.VIGA: {
            const { largo, ancho, altura, cantidad, resistencia, cantBarras, tipoBarra, distAros, tipoBarraAros, calcularEncofrado } = inputs;
            const volTotal = largo * ancho * altura * cantidad;
            calculateHormigon(volTotal, resistencia, inputs.ratio).forEach(m => addMaterial(materials, m.name, m.quantity, m.unit));

            // Acero Lineal
            if(cantBarras > 0 && tipoBarra){
                const pesoAcero = getPesoAcero(tipoBarra);
                const longitudTotal = cantBarras * largo * cantidad;
                const pesoTotalLinealKg = longitudTotal * pesoAcero;
                addMaterial(materials, getNombreAcero(tipoBarra), pesoTotalLinealKg, 'kg');
                addMaterial(materials, `${getNombreAcero(tipoBarra)} (longitud)`, longitudTotal, 'm');
                totalAceroKg += pesoTotalLinealKg;
            }
            // Aros
            if(distAros > 0 && tipoBarraAros){
                const pesoAros = getPesoAcero(tipoBarraAros);
                const cantAros = (largo / distAros);
                const longAro = (ancho + altura) * 2; // Simplificación
                const longitudTotalAros = cantAros * longAro * cantidad;
                const pesoTotalArosKg = longitudTotalAros * pesoAros;
                addMaterial(materials, getNombreAcero(tipoBarraAros), pesoTotalArosKg, 'kg');
                addMaterial(materials, `${getNombreAcero(tipoBarraAros)} (longitud)`, longitudTotalAros, 'm');
                totalAceroKg += pesoTotalArosKg;
            }

            // Encofrado
            if (calcularEncofrado && largo > 0 && ancho > 0 && altura > 0 && cantidad > 0) {
                let areaContacto = 0;
                let areaSoporte = 0;
        
                if (type === ActivityType.ZAPATA_CORRIDA) {
                    areaContacto = largo * altura * 2 * cantidad; // Sides of the strip
                    areaSoporte = areaContacto; // Bracing related to side area
                } else if (type === ActivityType.COLUMNA) {
                    areaContacto = (ancho + altura) * 2 * largo * cantidad; // Perimeter * height
                    areaSoporte = areaContacto; // Bracing related to surface area
                } else if (type === ActivityType.VIGA) {
                    areaContacto = (((altura * 2) + ancho) * largo) * cantidad; // 2 sides + bottom
                    areaSoporte = largo * ancho * cantidad; // Supports are based on bottom area
                }
                
                if (areaContacto > 0) {
                    addMaterial(materials, 'Madera para encofrado', areaContacto * 1.1, 'm²');
                    addMaterial(materials, 'Puntales de madera', Math.ceil(areaSoporte), 'unidades');
                    addMaterial(materials, 'Vigas de soporte (encofrado)', areaSoporte, 'm');
                    addMaterial(materials, 'Clavos para encofrado', areaContacto * 0.3, 'kg');
                }
            }
            break;
        }
        case ActivityType.LEVANTE_MURO: {
            const { largo, altura, tipoMuro } = inputs;
            const area = largo * altura;
            const muroData = MORTEROS_MUROS_DATA.find((m: any) => m.id === tipoMuro);
            if(muroData && area > 0) {
                addMaterial(materials, muroData.nombre, muroData.unidades * area, 'unidades');
                addMaterial(materials, 'Cemento', muroData.cemento * area, 'sacos');
                addMaterial(materials, 'Arena', muroData.arena * area, 'm³');
                addMaterial(materials, 'Polvo de Piedra', muroData.polvoPiedra * area, 'm³');
            }
            break;
        }
        case ActivityType.REVESTIMIENTO: {
            const { largo, altura, numCaras, tiposRevestimiento } = inputs;
            const area = largo * altura * numCaras;
            if (tiposRevestimiento && area > 0) {
                for (const tipoId in tiposRevestimiento) {
                    if (tiposRevestimiento[tipoId]) { // If checked
                        const revestimientoData = MORTEROS_REVESTIMIENTO_DATA.find((r: any) => r.id === tipoId);
                        if (revestimientoData) {
                            const cementoQty = revestimientoData.cemento * area;
                            if (cementoQty > 0) {
                                materials.push({ name: 'Cemento', quantity: cementoQty, unit: 'sacos', layer: revestimientoData.nombre });
                            }
                            const arenaQty = revestimientoData.arena * area;
                            if (arenaQty > 0) {
                                materials.push({ name: 'Arena', quantity: arenaQty, unit: 'm³', layer: revestimientoData.nombre });
                            }
                            const polvoPiedraQty = revestimientoData.polvoPiedra * area;
                            if (polvoPiedraQty > 0) {
                                materials.push({ name: 'Polvo de Piedra', quantity: polvoPiedraQty, unit: 'm³', layer: revestimientoData.nombre });
                            }
                        }
                    }
                }
            }
            break;
        }
        case ActivityType.PISO: {
             const { area, tipoPiso, tileLength, tileWidth } = inputs;
             const pisoData = MORTEROS_PISO_DATA.find((p: any) => p.id === tipoPiso);
             if (pisoData && area > 0) {
                 if (tipoPiso === 'piso_ceramica' && tileLength > 0 && tileWidth > 0) {
                    const areaWithWaste = area * 1.10; // 10% waste for cuts and breakage
                    addMaterial(materials, `Piso de ${tileLength}x${tileWidth}m`, areaWithWaste, 'm²');
                 } else if (pisoData.unidades > 0) {
                     addMaterial(materials, pisoData.nombre, pisoData.unidades * area, 'unidades');
                 }
                 // Morter materials are based on the original area, not the area with waste.
                 addMaterial(materials, 'Cemento', pisoData.cemento * area, 'sacos');
                 addMaterial(materials, 'Arena', pisoData.arena * area, 'm³');
                 addMaterial(materials, 'Polvo de Piedra', pisoData.polvoPiedra * area, 'm³');
             }
             break;
        }
        case ActivityType.LOSA: {
            const { largo, ancho, altura, cantidad, resistencia, distBarras, tipoBarra, calcularEncofrado } = inputs;
            const volTotal = largo * ancho * altura * cantidad;
            calculateHormigon(volTotal, resistencia, inputs.ratio).forEach(m => addMaterial(materials, m.name, m.quantity, m.unit));

            if(distBarras > 0 && tipoBarra){
                const pesoAcero = getPesoAcero(tipoBarra);
                const longLargo = ((largo / distBarras) + 1) * ancho * cantidad;
                const longAncho = ((ancho / distBarras) + 1) * largo * cantidad;
                const longitudTotal = longLargo + longAncho;
                const pesoTotalKg = longitudTotal * pesoAcero;
                addMaterial(materials, getNombreAcero(tipoBarra), pesoTotalKg, 'kg');
                addMaterial(materials, `${getNombreAcero(tipoBarra)} (longitud)`, longitudTotal, 'm');
                totalAceroKg += pesoTotalKg;
            }
            if (calcularEncofrado && largo > 0 && ancho > 0 && altura > 0 && cantidad > 0) {
                const areaContacto = ((largo * ancho) + ((largo + ancho) * 2 * altura)) * cantidad;
                const areaSoporte = largo * ancho * cantidad;
                addMaterial(materials, 'Madera para encofrado', areaContacto * 1.1, 'm²');
                addMaterial(materials, 'Puntales de madera', Math.ceil(areaSoporte), 'unidades');
                addMaterial(materials, 'Vigas de soporte (encofrado)', areaSoporte, 'm');
                addMaterial(materials, 'Clavos para encofrado', areaContacto * 0.3, 'kg');
            }
            break;
        }
        case ActivityType.PINTURA: {
            const { area, tipoPintura, numManos } = inputs;
            let rendimiento = 0;
            let materialName = 'Pintura';

            switch(tipoPintura) {
                case 'vinyl_lisa':
                    rendimiento = PINTURA_DATA.vinyl_lisa;
                    materialName = 'Pintura Vinílica (Lisa)';
                    break;
                case 'vinyl_rustico':
                    rendimiento = PINTURA_DATA.vinyl_rustico;
                    materialName = 'Pintura Vinílica (Rústica)';
                    break;
                case 'aceite_aparejo':
                    rendimiento = PINTURA_DATA.aceite_aparejo;
                    materialName = 'Aparejo de Aceite';
                    break;
                case 'aceite_pintura':
                    rendimiento = PINTURA_DATA.aceite_pintura;
                    materialName = 'Pintura de Aceite';
                    break;
                case 'lechada_cal':
                    rendimiento = PINTURA_DATA.lechada_cal;
                    materialName = 'Lechada de Cal';
                    break;
                case 'lechada_masilla':
                    rendimiento = PINTURA_DATA.lechada_masilla;
                    materialName = 'Lechada de Masilla';
                    break;
            }
            
            if (rendimiento > 0 && area > 0) {
                addMaterial(materials, materialName, area * rendimiento * numManos, 'litros');
            }
            break;
        }
        case ActivityType.ENCHAPE_PARED: {
            const { area, tipoLosa } = inputs;
             if (area > 0) {
                 addMaterial(materials, `Losa ${tipoLosa}`, area, 'm²');
                 addMaterial(materials, 'Cemento Cola', area * ENCHAPE_DATA.cemento_cola, 'kg');
                 addMaterial(materials, 'Cemento Blanco', area * ENCHAPE_DATA.cemento_blanco, 'kg');
             }
            break;
        }
        case ActivityType.ESTRUCTURA_PLADUR: {
            const { largo, altura, tipoEstructura, incluirAislamiento } = inputs;
            const area = largo * altura;
            if (area > 0) {
                if (tipoEstructura === 'pared') {
                    addMaterial(materials, 'Placa de Pladur (PYL)', area * PLADUR_PARED_DATA.placa, 'm²');
                    addMaterial(materials, 'Perfil Montante', area * PLADUR_PARED_DATA.montante, 'm');
                    addMaterial(materials, 'Perfil Canal', area * PLADUR_PARED_DATA.canal, 'm');
                    addMaterial(materials, 'Tornillos para Placa (TTPC)', area * PLADUR_PARED_DATA.tornilloPlaca, 'unidades');
                    addMaterial(materials, 'Tornillos de Fijación', area * PLADUR_PARED_DATA.tornilloFijacion, 'unidades');
                    addMaterial(materials, 'Cinta para Juntas', area * PLADUR_PARED_DATA.cintaJuntas, 'm');
                    addMaterial(materials, 'Pasta para Juntas', area * PLADUR_PARED_DATA.pastaJuntas, 'kg');
                } else if (tipoEstructura === 'techo') {
                    addMaterial(materials, 'Placa de Pladur (PYL)', area * PLADUR_TECHO_DATA.placa, 'm²');
                    addMaterial(materials, 'Perfil Secundario (T-47/T-60)', area * PLADUR_TECHO_DATA.perfilSecundario, 'm');
                    addMaterial(materials, 'Perfil Primario (Maestra)', area * PLADUR_TECHO_DATA.perfilPrimario, 'm');
                    addMaterial(materials, 'Cuelgues / Varillas', area * PLADUR_TECHO_DATA.cuelgues, 'unidades');
                    addMaterial(materials, 'Tornillos para Placa (TTPC)', area * PLADUR_TECHO_DATA.tornilloPlaca, 'unidades');
                    addMaterial(materials, 'Tornillos para Perfil', area * PLADUR_TECHO_DATA.tornilloPerfil, 'unidades');
                    addMaterial(materials, 'Fijaciones para Cuelgues', area * PLADUR_TECHO_DATA.fijacionCuelgue, 'unidades');
                    addMaterial(materials, 'Cinta para Juntas', area * PLADUR_TECHO_DATA.cintaJuntas, 'm');
                    addMaterial(materials, 'Pasta para Juntas', area * PLADUR_TECHO_DATA.pastaJuntas, 'kg');
                }
                if (incluirAislamiento) {
                    addMaterial(materials, 'Lana de Roca / Aislante', area, 'm²');
                }
            }
            break;
        }
        case ActivityType.CUSTOM_MATERIAL_CALCULATION: {
            const { customActivityId } = inputs;
            const activityTemplate: CustomMaterialActivity | undefined = CUSTOM_MATERIAL_ACTIVITIES_DATA.find((a: any) => a.id === customActivityId);
        
            if (activityTemplate) {
                let baseQuantity = 0;
                switch (activityTemplate.unitOfMeasure) {
                    case 'm':
                        baseQuantity = inputs.longitud || 0;
                        break;
                    case 'm²':
                        baseQuantity = (inputs.largo || 0) * (inputs.ancho || 0);
                        break;
                    case 'm³':
                        baseQuantity = (inputs.largo || 0) * (inputs.ancho || 0) * (inputs.altura || 0);
                        break;
                    case 'unidad':
                        baseQuantity = inputs.cantidad || 0;
                        break;
                }
        
                if (baseQuantity > 0) {
                    activityTemplate.materials.forEach(material => {
                        addMaterial(materials, material.materialName, baseQuantity * material.ratio, material.unit);
                    });
                }
            }
            break;
        }
        case ActivityType.CUSTOM: {
            if (inputs.materials && Array.isArray(inputs.materials)) {
                materials = inputs.materials
                    .filter((m: any) => m.name && m.quantity > 0 && m.unit)
                    .map((m: any) => ({
                        name: m.name,
                        quantity: parseFloat(m.quantity) || 0,
                        unit: m.unit,
                    }));
            } else {
                 materials = [];
            }
            // Early return for custom activity as it shouldn't have post-processing
            return materials;
        }
    }
    
    if (totalAceroKg > 0) {
        addMaterial(materials, 'Alambre', totalAceroKg * 0.027, 'kg');
    }
    
    const calculatedMaterials = materials.filter(m => m.quantity > 0).map(m => ({...m, quantity: parseFloat(m.quantity.toFixed(3))}));
    
    if (COMMERCIAL_RULES_ENABLED === false) {
        return calculatedMaterials;
    }
    
    return applyCommercialRules(calculatedMaterials, COMMERCIAL_UNIT_RULES_DATA || []);
};