declare const jspdf: any;

export const generateUserManualPDF = (doc: any) => {
    let y = 20;
    const margin = 14;
    const pageHeight = doc.internal.pageSize.height;
    const pageWidth = doc.internal.pageSize.width;
    const contentWidth = pageWidth - margin * 2;

    const checkPageBreak = (neededHeight = 20) => {
        if (y + neededHeight > pageHeight - margin) {
            doc.addPage();
            y = margin;
        }
    };

    const addTitle = (text: string, size = 18) => {
        checkPageBreak(size);
        doc.setFontSize(size);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(30, 41, 59); // slate-800
        doc.text(text, margin, y);
        y += size / 2 + 4;
    };

    const addSubtitle = (text: string, size = 14) => {
        checkPageBreak(size + 8);
        y += 4;
        doc.setFontSize(size);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(8, 145, 178); // cyan-600
        doc.text(text, margin, y);
        y += size / 2 + 2;
    };
    
    const addText = (text: string, options: { isListItem?: boolean, size?: number } = {}) => {
        const { isListItem = false, size = 10 } = options;
        const splitText = doc.splitTextToSize(text, contentWidth - (isListItem ? 5 : 0));
        const neededHeight = splitText.length * (size * 0.4);
        checkPageBreak(neededHeight);

        doc.setFontSize(size);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(71, 85, 105); // slate-600
        
        if (isListItem) {
            doc.text('•', margin, y);
            doc.text(splitText, margin + 5, y);
        } else {
            doc.text(splitText, margin, y);
        }
        
        y += neededHeight + 3;
    };
    
    const addCode = (text: string) => {
        const splitText = doc.splitTextToSize(text, contentWidth);
        const neededHeight = (splitText.length * 4) + 8;
        checkPageBreak(neededHeight);
        
        doc.setFillColor(241, 245, 249); // slate-100
        doc.rect(margin, y - 2, contentWidth, neededHeight - 4, 'F');
        
        doc.setFontSize(9);
        doc.setFont('courier', 'normal');
        doc.setTextColor(51, 65, 85); // slate-700
        doc.text(splitText, margin + 2, y + 4);
        
        y += neededHeight;
    };


    // --- MANUAL CONTENT START ---

    // Cover Page
    doc.setFontSize(36);
    doc.setFont('helvetica', 'bold');
    doc.text('Manual de Usuario', pageWidth / 2, pageHeight / 2 - 20, { align: 'center' });
    doc.setFontSize(24);
    doc.setFont('helvetica', 'normal');
    doc.text('Habitex Calcula Pro 3.0', pageWidth / 2, pageHeight / 2, { align: 'center' });
    doc.setFontSize(12);
    doc.text(`Generado: ${new Date().toLocaleDateString()}`, pageWidth / 2, pageHeight - 20, { align: 'center' });
    doc.addPage();
    y = margin;

    // Table of Contents (Simplified)
    addTitle('Contenido');
    addText('1. Introducción\n2. Primeros Pasos\n3. Licencia: Plan Gratuito vs. Pro\n4. La Biblioteca de Datos (El Corazón de la App)\n5. Cálculo de Materiales\n6. Mano de Obra\n7. Otros Gastos (Pro)\n8. Control Financiero\n9. Inventario (Pro)\n10. Certificaciones y Facturas (Pro)\n11. Documentos PDF (Pro)\n12. Gestión de Datos (Pro)');
    y += 10;
    
    // --- Section 1 ---
    checkPageBreak(40);
    addTitle('1. Introducción');
    addText('Bienvenido a Habitex Calcula, su herramienta definitiva para el cálculo de materiales de construcción. Esta aplicación está diseñada para funcionar 100% offline, guardando todos sus datos de forma segura en su propio dispositivo. Cree proyectos, calcule materiales, gestione presupuestos y finanzas sin necesidad de una conexión a internet.');

    // --- Section 2 ---
    checkPageBreak(40);
    addTitle('2. Primeros Pasos');
    addSubtitle('2.1. Creando un Proyecto');
    addText('En la pantalla principal, haga clic en "Nuevo Proyecto". Asigne un nombre y, opcionalmente, los datos del cliente. Esto creará un espacio de trabajo para su obra.');
    addSubtitle('2.2. Vista de Proyectos');
    addText('La pantalla inicial muestra una lista de todos sus proyectos. Cada uno muestra su nombre, fecha de creación y el costo total planificado. Puede editar (icono de lápiz) o eliminar (icono de basura) cualquier proyecto desde aquí.');

    // --- Section 3 ---
    checkPageBreak(40);
    addTitle('3. Licencia: Plan Gratuito vs. Pro');
    addText('La aplicación opera en un modelo "freemium":');
    addText('Plan Gratuito: Le permite crear hasta 2 proyectos y usar las funciones básicas de cálculo de materiales y mano de obra. Las funciones avanzadas están bloqueadas.', { isListItem: true });
    addText('Plan Pro: Desbloquea todas las funciones, incluyendo proyectos ilimitados, gestión de inventario, finanzas avanzadas, certificaciones, facturación, ofertas comerciales y gestión de datos (importar/exportar).', { isListItem: true });
    addSubtitle('3.1. Cómo Activar la Licencia Pro');
    addText('1. Haga clic en cualquier función Pro (marcada con una estrella) o en el aviso para actualizar.', { isListItem: true });
    addText('2. En la ventana de licencia, encontrará su "Device ID". Este es un código único para su navegador/dispositivo.', { isListItem: true });
    addText('3. Copie este ID y envíelo al proveedor de la aplicación (por ejemplo, vía WhatsApp) para solicitar su clave de licencia.', { isListItem: true });
    addText('4. Una vez reciba la clave, introdúzcala en el campo correspondiente y haga clic en "Activar".', { isListItem: true });
    addText('La licencia Pro tiene una duración de 365 días. Las licencias de prueba tienen una duración más corta. Las licencias Pro más antiguas pueden ser permanentes. Puede consultar el estado y la fecha de caducidad en la misma ventana de licencia o en la Biblioteca de Datos > Información de Empresa.');
    
    // --- Section 4 ---
    doc.addPage();
    y = margin;
    addTitle('4. La Biblioteca de Datos');
    addText('Accesible desde la lista de proyectos, la Biblioteca es el "cerebro" de la aplicación. Aquí configura los datos base que se usarán en todos sus proyectos.');
    addSubtitle('4.1. Mano de Obra');
    addText('Edite los precios de las actividades de mano de obra predefinidas. Estos precios se usarán por defecto al añadir estas actividades a un proyecto. Con la licencia Pro, puede añadir sus propias actividades a la lista.');
    addSubtitle('4.2. Precios de Materiales (Pro)');
    addText('Esta es su lista de precios maestra. Añada materiales y asigne un precio por unidad. Cuando la aplicación calcula un material, buscará su precio aquí para determinar el costo. Puede añadir nuevos materiales a la lista en cualquier momento.');
    addSubtitle('4.3. Actividades Personalizadas (Pro)');
    addText('Cree sus propias plantillas de cálculo. Defina un nombre (ej. "Zapata 25x25"), una unidad de medida (m, m², m³, unidad) y los materiales que consume por cada unidad. Por ejemplo:');
    addCode('Actividad: "Pintura Impermeabilizante"\nUnidad de Medida: m²\nMateriales:\n  - Pintura: 0.25 litros / m²\n  - Malla: 1.1 m² / m²');
    addText('Estas plantillas aparecerán en la sección de "Cálculo de Materiales" para ser usadas en cualquier proyecto.');
    addSubtitle('4.4. Unidades Comerciales (Pro)');
    addText('Esta potente función convierte las cantidades calculadas (ej. 150 m de acero) en unidades de compra reales (ej. 17 barras de 9m). Puede definir reglas como:');
    addText('"Redondear hacia arriba": Para items que se compran por unidad entera (ej. sacos de cemento).', { isListItem: true });
    addText('"Múltiplo (Incremento Fijo)": Para items en cajas con una cantidad fija. Ej: Cajas de losa que cubren 1.44 m² cada una.', { isListItem: true });
    addText('"Múltiplo (Opciones Fijas)": Para items con longitudes estándar. Ej: Barras de acero que se venden en 6m, 9m, o 12m. Usted elige cuál usar para el cálculo.', { isListItem: true });
    addText('"Mejor Combinación": Para items como la pintura, que se vende en diferentes tamaños (ej. 20L, 5L, 1L). La app calculará la combinación más eficiente para minimizar el desperdicio.', { isListItem: true });
    
    // --- Section 5 ---
    doc.addPage();
    y = margin;
    addTitle('5. Cálculo de Materiales');
    addText('Dentro de un proyecto, en la pestaña "Cálculo de Materiales", puede añadir actividades para que la app calcule los materiales necesarios.');
    addSubtitle('5.1. Añadir una Actividad');
    addText('Haga clic en uno de los botones de actividad (ej. "Columna", "Levante de Muro"). La aplicación le sugerirá un nombre por defecto para la actividad, el cual puede personalizar para identificarla fácilmente (ej. "Columna del Patio", "Pintura Fachada"). Luego, rellene los datos solicitados (dimensiones, resistencia, etc.) y guarde. La app añadirá una tarjeta con el resultado y el nombre que le asignó.');
    addSubtitle('5.2. El Resumen de Materiales');
    addText('A la derecha, verá una tabla con todos los materiales de todas las actividades, agregados por tipo. Esta tabla muestra:');
    addText('Material y Cantidad Requerida: El total que necesita para el proyecto.', { isListItem: true });
    addText('Precio Unitario: Puede editar el precio directamente aquí para este proyecto específico. El cambio no afecta a la Biblioteca.', { isListItem: true });
    addText('Precio Total: El costo total para esa línea de material.', { isListItem: true });
    addText('Inventario/Necesario: Muestra cuánto tiene en inventario y cuánto le falta por comprar. Esto se actualiza automáticamente con la pestaña "Inventario".', { isListItem: true });
    addSubtitle('5.3. Acciones del Resumen');
    addText('Para los materiales que le faltan (Necesario > 0), tiene varias acciones:');
    addText('"Comprar": Abre un modal para registrar un gasto y, opcionalmente, añadir el material comprado al inventario.', { isListItem: true });
    addText('"Usar" (Pro): Si tiene algo en inventario, le permite especificar cuánto de ese stock va a usar para cubrir la necesidad.', { isListItem: true });
    addText('"Añadir" (Pro): Le permite añadir material directamente al inventario, sin registrar un gasto (útil si ya tenía el material).', { isListItem: true });
    
    // --- Section 6 ---
    checkPageBreak(40);
    addTitle('6. Mano de Obra');
    addText('En esta pestaña, gestiona los costos de mano de obra. Puede añadir actividades desde la biblioteca (con precios predefinidos) o crear una personalizada. Cada actividad tiene una cantidad, unidad y precio. El total se suma al presupuesto del proyecto.');
    addSubtitle('6.1. Seguimiento del Progreso (Pro)');
    addText('Puede registrar la cantidad ejecutada ("Cant. Ejec.") para cada actividad. Esto es crucial para el sistema de Certificaciones, ya que representa el trabajo real completado que puede ser facturado.');
    
    addTitle('7. Otros Gastos (Pro)');
    addText('Aquí se gestionan los costos que no son ni materiales directos ni mano de obra.');
    addSubtitle('7.1. Gastos Calculados (Indirectos)');
    addText('Configure porcentajes para costos como Logística, Asistencia Técnica, Transporte, Imprevistos y Utilidad. Estos se calculan automáticamente sobre la base del costo de materiales y/o mano de obra.');
    addSubtitle('7.2. Gastos Manuales');
    addText('Añada gastos planificados específicos que no encajan en otras categorías, como el costo de permisos o alquiler de equipos. Estos se suman al presupuesto total.');

    doc.addPage();
    y = margin;
    addTitle('8. Control Financiero');
    addText('Esta es la pestaña principal del proyecto. Aquí controla el flujo de dinero real.');
    addSubtitle('8.1. Tarjetas de Resumen');
    addText('Vea de un vistazo el presupuesto total planificado, el total de ingresos recibidos, el total de gastos realizados y el balance actual.');
    addSubtitle('8.2. Gráfico Comparativo');
    addText('Visualice la diferencia entre sus costos planificados y sus gastos reales, desglosado por categorías (Materiales, Mano de Obra, etc.).');
    addSubtitle('8.3. Historial de Transacciones');
    addText('Registre cada ingreso (ej. pago de un cliente) y cada gasto (ej. compra de cemento, pago a un trabajador). Esto alimenta el balance y el gráfico de costos reales. Las transacciones de compra de materiales pueden vincularse automáticamente al inventario.');

    addTitle('9. Inventario (Pro)');
    addText('Lleve un control del stock de materiales en obra. Los materiales pueden entrar al inventario al registrar una compra de "Materiales" y marcar la casilla correspondiente, o añadiéndolos manualmente desde esta pestaña o desde el resumen de materiales.');
    addText('Puede ver un resumen de cuánto ha comprado, cuánto ha usado y cuánto queda disponible. La acción de "Usar" descuenta el material del stock.');
    
    addTitle('10. Certificaciones y Facturas (Pro)');
    addText('Esta sección le permite formalizar y facturar el trabajo ejecutado.');
    addSubtitle('10.1. Crear una Certificación');
    addText('Una certificación es una "foto" del estado financiero del proyecto en un momento dado. Calcula el valor total del trabajo ejecutado (mano de obra completada) y los gastos reales incurridos (materiales, transporte, etc.) hasta la fecha. Si ya existen certificaciones anteriores, calculará solo el valor incremental desde la última.');
    addSubtitle('10.2. Generar una Factura');
    addText('Desde una certificación guardada, puede generar una factura en PDF. La factura detallará los conceptos que componen el valor de esa certificación (el trabajo incremental). Puede editar los datos del cliente, firmante y número de factura antes de generarla.');
    addSubtitle('10.3. Certificar y Facturar Obra Completa');
    addText('Este botón automatiza el cierre del proyecto: marca toda la mano de obra como completada, crea transacciones de gasto para cubrir todos los costos restantes del presupuesto y genera una certificación final, lista para ser facturada.');

    addTitle('11. Documentos PDF (Pro)');
    addText('Desde el encabezado del proyecto, puede generar varios documentos:');
    addText('Reporte General: Un PDF completo con el resumen financiero, lista de materiales, mano de obra y otros gastos.', { isListItem: true });
    addText('Oferta Comercial: Cree una oferta para su cliente. Puede ser a "Precio Fijo" (solo muestra el total) o "Detallada" (desglosa todos los costos).', { isListItem: true });
    
    addTitle('12. Gestión de Datos (Pro)');
    addText('Desde la pantalla de lista de proyectos, tiene opciones para gestionar sus datos:');
    addText('Exportar: Guarda una copia de seguridad de TODOS sus proyectos y de la configuración de su biblioteca en un archivo .json.', { isListItem: true });
    addText('Importar: Carga un archivo de respaldo. ¡CUIDADO! Esto añadirá los proyectos del archivo a los suyos, pero SOBRESCRIBIRÁ la configuración de su Biblioteca de Datos (precios, fórmulas, etc.) con la del archivo importado.', { isListItem: true });
};