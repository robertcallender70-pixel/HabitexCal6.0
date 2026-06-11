import React from 'react';
import Modal from './Modal';
import { generateUserManualPDF } from '../services/manual';
import { PdfIcon } from '../constants';

declare const jspdf: any;

// Helper components for styling
const Title: React.FC<{ children: React.ReactNode }> = ({ children }) => <h2 className="text-2xl font-bold text-slate-800 mt-6 mb-3 border-b pb-2">{children}</h2>;
const Subtitle: React.FC<{ children: React.ReactNode }> = ({ children }) => <h3 className="text-xl font-semibold text-cyan-600 mt-4 mb-2">{children}</h3>;
const Text: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => <p className={`text-slate-600 mb-3 text-base leading-relaxed ${className}`}>{children}</p>;
const ListItem: React.FC<{ children: React.ReactNode }> = ({ children }) => <li className="text-slate-600 ml-5 mb-2 leading-relaxed">{children}</li>;
const CodeBlock: React.FC<{ children: React.ReactNode }> = ({ children }) => <pre className="bg-slate-100 p-3 rounded-md text-sm text-slate-800 my-3 whitespace-pre-wrap font-mono">{children}</pre>;

const ManualContent = () => (
    <div>
        <Title>1. Introducción</Title>
        <Text>Bienvenido a Habitex Calcula, su herramienta definitiva para el cálculo de materiales de construcción. Esta aplicación está diseñada para funcionar 100% offline, guardando todos sus datos de forma segura en su propio dispositivo. Cree proyectos, calcule materiales, gestione presupuestos y finanzas sin necesidad de una conexión a internet.</Text>
        
        <Title>2. Primeros Pasos</Title>
        <Subtitle>2.1. Creando un Proyecto</Subtitle>
        <Text>En la pantalla principal, haga clic en "Nuevo Proyecto". Asigne un nombre y, opcionalmente, los datos del cliente. Esto creará un espacio de trabajo para su obra.</Text>
        <Subtitle>2.2. Vista de Proyectos</Subtitle>
        <Text>La pantalla inicial muestra una lista de todos sus proyectos. Cada uno muestra su nombre, fecha de creación y el costo total planificado. Puede editar (icono de lápiz) o eliminar (icono de basura) cualquier proyecto desde aquí.</Text>

        <Title>3. Licencia: Plan Gratuito vs. Pro</Title>
        <Text>La aplicación opera en un modelo "freemium":</Text>
        <ul className="list-disc list-outside">
            <ListItem><b>Plan Gratuito:</b> Le permite crear hasta 2 proyectos y usar las funciones básicas de cálculo de materiales y mano de obra. Las funciones avanzadas están bloqueadas.</ListItem>
            <ListItem><b>Plan Pro:</b> Desbloquea todas las funciones, incluyendo proyectos ilimitados, gestión de inventario, finanzas avanzadas, certificaciones, facturación, ofertas comerciales y gestión de datos (importar/exportar).</ListItem>
        </ul>
        <Subtitle>3.1. Cómo Activar la Licencia Pro</Subtitle>
        <ol className="list-decimal list-inside space-y-2 text-slate-600">
            <li>Haga clic en cualquier función Pro (marcada con una estrella) o en el aviso para actualizar.</li>
            <li>En la ventana de licencia, encontrará su "Device ID". Este es un código único para su navegador/dispositivo.</li>
            <li>Copie este ID y envíelo al proveedor de la aplicación (por ejemplo, vía WhatsApp) para solicitar su clave de licencia.</li>
            <li>Una vez reciba la clave, introdúzcala en el campo correspondiente y haga clic en "Activar".</li>
        </ol>
        <Text className="mt-2">La licencia Pro tiene una duración de 365 días. Las licencias de prueba tienen una duración más corta. Las licencias Pro más antiguas, sin fecha de caducidad, se consideran permanentes. Puede consultar el estado y la fecha de caducidad en la misma ventana de licencia o en la Biblioteca de Datos &gt; Información de Empresa.</Text>
        
        <Title>4. La Biblioteca de Datos</Title>
        <Text>Accesible desde la lista de proyectos, la Biblioteca es el "cerebro" de la aplicación. Aquí configura los datos base que se usarán en todos sus proyectos.</Text>
        <Subtitle>4.1. Mano de Obra</Subtitle>
        <Text>Edite los precios de las actividades de mano de obra predefinidas. Estos precios se usarán por defecto al añadir estas actividades a un proyecto. Con la licencia Pro, puede añadir sus propias actividades a la lista.</Text>
        <Subtitle>4.2. Precios de Materiales (Pro)</Subtitle>
        <Text>Esta es su lista de precios maestra. Añada materiales y asigne un precio por unidad. Cuando la aplicación calcula un material, buscará su precio aquí para determinar el costo. Puede añadir nuevos materiales a la lista en cualquier momento.</Text>
        <Subtitle>4.3. Actividades Personalizadas (Pro)</Subtitle>
        <Text>Cree sus propias plantillas de cálculo. Defina un nombre (ej. "Zapata 25x25"), una unidad de medida (m, m², m³, unidad) y los materiales que consume por cada unidad. Por ejemplo:</Text>
        <CodeBlock>
            Actividad: "Pintura Impermeabilizante"<br/>
            Unidad de Medida: m²<br/>
            Materiales:<br/>
            &nbsp;&nbsp;- Pintura: 0.25 litros / m²<br/>
            &nbsp;&nbsp;- Malla: 1.1 m² / m²
        </CodeBlock>
        <Text>Estas plantillas aparecerán en la sección de "Cálculo de Materiales" para ser usadas en cualquier proyecto.</Text>
        <Subtitle>4.4. Unidades Comerciales (Pro)</Subtitle>
        <Text>Esta potente función convierte las cantidades calculadas (ej. 150 m de acero) en unidades de compra reales (ej. 17 barras de 9m). Puede definir reglas como:</Text>
        <ul className="list-disc list-outside">
            <ListItem><b>"Redondear hacia arriba":</b> Para items que se compran por unidad entera (ej. sacos de cemento).</ListItem>
            <ListItem><b>"Múltiplo (Incremento Fijo)":</b> Para items en cajas con una cantidad fija. Ej: Cajas de losa que cubren 1.44 m² cada una.</ListItem>
            <ListItem><b>"Múltiplo (Opciones Fijas)":</b> Para items con longitudes estándar. Ej: Barras de acero que se venden en 6m, 9m, o 12m. Usted elige cuál usar para el cálculo.</ListItem>
            <ListItem><b>"Mejor Combinación":</b> Para items como la pintura, que se vende en diferentes tamaños (ej. 20L, 5L, 1L). La app calculará la combinación más eficiente para minimizar el desperdicio.</ListItem>
        </ul>
        
        <Title>5. Cálculo de Materiales</Title>
        <Text>Dentro de un proyecto, en la pestaña "Cálculo de Materiales", puede añadir actividades para que la app calcule los materiales necesarios.</Text>
        <Subtitle>5.1. Añadir una Actividad</Subtitle>
        <Text>Haga clic en uno de los botones de actividad (ej. "Columna", "Levante de Muro"). La aplicación le sugerirá un nombre por defecto para la actividad, el cual puede personalizar para identificarla fácilmente (ej. "Columna del Patio", "Pintura Fachada"). Luego, rellene los datos solicitados (dimensiones, resistencia, etc.) y guarde. La app añadirá una tarjeta con el resultado y el nombre que le asignó.</Text>
        <Subtitle>5.2. El Resumen de Materiales</Subtitle>
        <Text>A la derecha, verá una tabla con todos los materiales de todas las actividades, agregados por tipo. Esta tabla muestra:</Text>
        <ul className="list-disc list-outside">
            <ListItem><b>Material y Cantidad Requerida:</b> El total que necesita para el proyecto.</ListItem>
            <ListItem><b>Precio Unitario:</b> Puede editar el precio directamente aquí para este proyecto específico. El cambio no afecta a la Biblioteca.</ListItem>
            <ListItem><b>Precio Total:</b> El costo total para esa línea de material.</ListItem>
            <ListItem><b>Inventario/Necesario:</b> Muestra cuánto tiene en inventario y cuánto le falta por comprar. Esto se actualiza automáticamente con la pestaña "Inventario".</ListItem>
        </ul>
        <Subtitle>5.3. Acciones del Resumen</Subtitle>
        <Text>Para los materiales que le faltan (Necesario &gt; 0), tiene varias acciones:</Text>
        <ul className="list-disc list-outside">
            <ListItem><b>"Comprar":</b> Abre un modal para registrar un gasto y, opcionalmente, añadir el material comprado al inventario.</ListItem>
            <ListItem><b>"Usar" (Pro):</b> Si tiene algo en inventario, le permite especificar cuánto de ese stock va a usar para cubrir la necesidad.</ListItem>
            <ListItem><b>"Añadir" (Pro):</b> Le permite añadir material directamente al inventario, sin registrar un gasto (útil si ya tenía el material).</ListItem>
        </ul>
        
        <Title>6. Mano de Obra</Title>
        <Text>En esta pestaña, gestiona los costos de mano de obra. Puede añadir actividades desde la biblioteca (con precios predefinidos) o crear una personalizada. Cada actividad tiene una cantidad, unidad y precio. El total se suma al presupuesto del proyecto.</Text>
        <Subtitle>6.1. Seguimiento del Progreso (Pro)</Subtitle>
        <Text>Puede registrar la cantidad ejecutada ("Cant. Ejec.") para cada actividad. Esto es crucial para el sistema de Certificaciones, ya que representa el trabajo real completado que puede ser facturado.</Text>
        
        <Title>7. Otros Gastos (Pro)</Title>
        <Text>Aquí se gestionan los costos que no son ni materiales directos ni mano de obra.</Text>
        <Subtitle>7.1. Gastos Calculados (Indirectos)</Subtitle>
        <Text>Configure porcentajes para costos como Logística, Asistencia Técnica, Transporte, Imprevistos y Utilidad. Estos se calculan automáticamente sobre la base del costo de materiales y/o mano de obra.</Text>
        <Subtitle>7.2. Gastos Manuales</Subtitle>
        <Text>Añada gastos planificados específicos que no encajan en otras categorías, como el costo de permisos o alquiler de equipos. Estos se suman al presupuesto total.</Text>

        <Title>8. Control Financiero</Title>
        <Text>Esta es la pestaña principal del proyecto. Aquí controla el flujo de dinero real.</Text>
        <Subtitle>8.1. Tarjetas de Resumen</Subtitle>
        <Text>Vea de un vistazo el presupuesto total planificado, el total de ingresos recibidos, el total de gastos realizados y el balance actual.</Text>
        <Subtitle>8.2. Gráfico Comparativo</Subtitle>
        <Text>Visualice la diferencia entre sus costos planificados y sus gastos reales, desglosado por categorías (Materiales, Mano de Obra, etc.).</Text>
        <Subtitle>8.3. Historial de Transacciones</Subtitle>
        <Text>Registre cada ingreso (ej. pago de un cliente) y cada gasto (ej. compra de cemento, pago a un trabajador). Esto alimenta el balance y el gráfico de costos reales. Las transacciones de compra de materiales pueden vincularse automáticamente al inventario.</Text>

        <Title>9. Inventario (Pro)</Title>
        <Text>Lleve un control del stock de materiales en obra. Los materiales pueden entrar al inventario al registrar una compra de "Materiales" y marcar la casilla correspondiente, o añadiéndolos manualmente desde esta pestaña o desde el resumen de materiales.</Text>
        <Text>Puede ver un resumen de cuánto ha comprado, cuánto ha usado y cuánto queda disponible. La acción de "Usar" descuenta el material del stock.</Text>
        
        <Title>10. Certificaciones y Facturas (Pro)</Title>
        <Text>Esta sección le permite formalizar y facturar el trabajo ejecutado.</Text>
        <Subtitle>10.1. Crear una Certificación</Subtitle>
        <Text>Una certificación es una "foto" del estado financiero del proyecto en un momento dado. Calcula el valor total del trabajo ejecutado (mano de obra completada) y los gastos reales incurridos (materiales, transporte, etc.) hasta la fecha. Si ya existen certificaciones anteriores, calculará solo el valor incremental desde la última.</Text>
        <Subtitle>10.2. Generar una Factura</Subtitle>
        <Text>Desde una certificación guardada, puede generar una factura en PDF. La factura detallará los conceptos que componen el valor de esa certificación (el trabajo incremental). Puede editar los datos del cliente, firmante y número de factura antes de generarla.</Text>
        <Subtitle>10.3. Certificar y Facturar Obra Completa</Subtitle>
        <Text>Este botón automatiza el cierre del proyecto: marca toda la mano de obra como completada, crea transacciones de gasto para cubrir todos los costos restantes del presupuesto y genera una certificación final, lista para ser facturada.</Text>

        <Title>11. Documentos PDF (Pro)</Title>
        <Text>Desde el encabezado del proyecto, puede generar varios documentos:</Text>
        <ul className="list-disc list-outside">
            <ListItem><b>Reporte General:</b> Un PDF completo con el resumen financiero, lista de materiales, mano de obra y otros gastos.</ListItem>
            <ListItem><b>Oferta Comercial:</b> Cree una oferta para su cliente. Puede ser a "Precio Fijo" (solo muestra el total) o "Detallada" (desglosa todos los costos).</ListItem>
        </ul>
        
        <Title>12. Gestión de Datos (Pro)</Title>
        <Text>Desde la pantalla de lista de proyectos, tiene opciones para gestionar sus datos:</Text>
        <ul className="list-disc list-outside">
            <ListItem><b>Exportar:</b> Guarda una copia de seguridad de TODOS sus proyectos y de la configuración de su biblioteca en un archivo .json.</ListItem>
            <ListItem><b>Importar:</b> Carga un archivo de respaldo. ¡CUIDADO! Esto añadirá los proyectos del archivo a los suyos, pero SOBRESCRIBIRÁ la configuración de su Biblioteca de Datos (precios, fórmulas, etc.) con la del archivo importado.</ListItem>
        </ul>
    </div>
);


interface UserManualModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const UserManualModal: React.FC<UserManualModalProps> = ({ isOpen, onClose }) => {

    const handleDownloadPdf = () => {
        try {
            const { jsPDF } = jspdf;
            const doc = new jsPDF();
            generateUserManualPDF(doc);
            doc.save('Manual_Usuario_Habitex_Calcula.pdf');
        } catch (error) {
            console.error("Error generating user manual PDF:", error);
            alert("No se pudo generar el manual. Por favor, intente de nuevo.");
        }
    };

    const modalFooter = (
        <>
            <button onClick={onClose} className="px-4 py-2 bg-slate-200 text-slate-700 rounded-md hover:bg-slate-300 transition-colors">
                Cerrar
            </button>
            <button onClick={handleDownloadPdf} className="flex items-center gap-2 px-4 py-2 bg-cyan-600 text-white rounded-md hover:bg-cyan-700 transition-colors shadow">
                <PdfIcon className="h-5 w-5" />
                Descargar en PDF
            </button>
        </>
    );

    return (
        <Modal 
            isOpen={isOpen} 
            onClose={onClose} 
            title="Manual de Usuario - Habitex Calcula"
            size="4xl"
            footer={modalFooter}
        >
            <ManualContent />
        </Modal>
    );
};

export default UserManualModal;