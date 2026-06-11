import React from 'react';
import Modal from './Modal';

interface LicenseModalProps {
    isOpen: boolean;
    onClose: () => void;
    onActivate: (key: string) => Promise<{ success: boolean; message: string }>;
    deviceId: string | null;
    status: 'free' | 'pro';
    licenseKey?: string;
}

const LicenseModal: React.FC<LicenseModalProps> = ({ isOpen, onClose, onActivate, deviceId, status, licenseKey }) => {
    const [keyInput, setKeyInput] = React.useState('');
    const [isLoading, setIsLoading] = React.useState(false);
    const [feedback, setFeedback] = React.useState<{ type: 'success' | 'error', message: string } | null>(null);
    const [expirationDate, setExpirationDate] = React.useState<string | null>(null);
    const [remainingDays, setRemainingDays] = React.useState<number | null>(null);

    React.useEffect(() => {
        if (isOpen) {
            setKeyInput('');
            setIsLoading(false);
            setFeedback(null);
            setExpirationDate(null);
            setRemainingDays(null);
            
            if (status === 'pro' && licenseKey) {
                try {
                    const payloadB64 = licenseKey.split('.')[0];
                    const payloadStr = atob(payloadB64);
                    const payload = JSON.parse(payloadStr);

                    if (payload.expiresAt) {
                        const date = new Date(payload.expiresAt);
                        setExpirationDate(date.toLocaleDateString('es-ES', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                        }));

                        const now = new Date();
                        const diffTime = date.getTime() - now.getTime();
                        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                        setRemainingDays(diffDays);

                    } else {
                        // Handle older, permanent keys
                        setExpirationDate('Permanente (de por vida)');
                    }
                } catch (e) {
                    console.error("Could not parse license key payload:", e);
                    setExpirationDate('No se pudo determinar');
                }
            } else {
                setExpirationDate(null);
            }
        }
    }, [isOpen, status, licenseKey]);

    const handleActivate = async () => {
        if (!keyInput.trim()) {
            setFeedback({ type: 'error', message: 'Por favor, introduzca una clave de licencia.' });
            return;
        }
        setIsLoading(true);
        setFeedback(null);
        const result = await onActivate(keyInput.trim());
        if (result.success) {
            setFeedback({ type: 'success', message: result.message });
        } else {
            setFeedback({ type: 'error', message: result.message });
        }
        setIsLoading(false);
    };
    
    const copyToClipboard = () => {
        if (deviceId) {
            navigator.clipboard.writeText(deviceId).then(() => {
                alert('Device ID copiado al portapapeles.');
            }, (err) => {
                alert('No se pudo copiar el Device ID.');
                console.error('Could not copy text: ', err);
            });
        }
    };

    const sendToWhatsApp = () => {
        if (deviceId) {
            const message = `Hola, me gustaría activar mi licencia Pro para Habitex Calcula. Mi Device ID es: ${deviceId}`;
            const whatsappUrl = `https://wa.me/5352529446?text=${encodeURIComponent(message)}`;
            window.open(whatsappUrl, '_blank');
        }
    };
    
    return (
        <Modal isOpen={isOpen} onClose={onClose} title={status === 'pro' ? 'Estado de la Licencia' : 'Activar Licencia Pro'}>
            {status === 'pro' ? (
                <div className="text-center p-4">
                    <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-4">
                        <svg className="h-10 w-10 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                    <h3 className="text-xl font-bold text-slate-800">¡Licencia Profesional Activada!</h3>
                    <p className="mt-2 text-slate-600">Todas las funciones premium están desbloqueadas en este dispositivo.</p>
                    
                    {expirationDate && (
                        <div className="mt-4 inline-block">
                            {remainingDays !== null && remainingDays > 0 ? (
                                <div className="bg-blue-100 text-blue-800 rounded-lg px-4 py-2">
                                    <p className="font-bold text-lg">{remainingDays} {remainingDays === 1 ? 'día restante' : 'días restantes'}</p>
                                    <p className="text-xs">Válida hasta: {expirationDate}</p>
                                </div>
                            ) : remainingDays !== null && remainingDays <= 0 ? (
                                <div className="bg-red-100 text-red-800 rounded-lg px-4 py-2">
                                    <p className="font-bold text-lg">Licencia Expirada</p>
                                    <p className="text-xs">Expiró el: {expirationDate}</p>
                                </div>
                            ) : (
                                 <div className="bg-green-100 text-green-800 rounded-lg px-4 py-2">
                                    <p className="font-bold text-lg">Licencia Permanente</p>
                                    <p className="text-xs">(De por vida)</p>
                                </div>
                            )}
                        </div>
                    )}

                    <div className="mt-6 text-sm text-slate-500 break-all text-left bg-slate-50 p-3 rounded-lg">
                        <p><strong>Clave:</strong> {licenseKey?.substring(0, licenseKey.length - 10)}**********</p>
                        <p><strong>Device ID:</strong> {deviceId}</p>
                    </div>
                </div>
            ) : (
                <div className="space-y-4">
                    <div>
                        <h4 className="text-lg font-semibold text-slate-700">1. Obtenga su Clave de Licencia</h4>
                        <p className="text-sm text-slate-600 mt-1">
                            Para activar la versión Pro, necesita una clave de licencia única vinculada a su dispositivo.
                        </p>
                        <div className="mt-3 p-3 bg-slate-100 rounded-lg">
                            <label className="block text-xs font-medium text-slate-500">Su Device ID único es:</label>
                            <div className="flex items-center gap-2 mt-1">
                                <input
                                    type="text"
                                    readOnly
                                    value={deviceId || 'Cargando...'}
                                    className="w-full px-3 py-1 bg-white border border-slate-300 rounded-md shadow-sm select-all"
                                />
                                <button
                                    onClick={copyToClipboard}
                                    className="px-3 py-1.5 bg-slate-200 text-slate-700 rounded-md hover:bg-slate-300 transition-colors text-sm"
                                >
                                    Copiar
                                </button>
                                <button
                                    onClick={sendToWhatsApp}
                                    className="p-1.5 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors"
                                    title="Enviar por WhatsApp"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="currentColor" viewBox="0 0 16 16">
                                        <path d="M13.601 2.326A7.85 7.85 0 0 0 7.994 0C3.627 0 .068 3.558.064 7.926c0 1.399.366 2.76 1.057 3.965L0 16l4.204-1.102a7.9 7.9 0 0 0 3.79.965h.004c4.368 0 7.926-3.558 7.93-7.93A7.898 7.898 0 0 0 13.6 2.326zM7.994 14.521a6.57 6.57 0 0 1-3.356-.92l-.24-.144-2.494.654.666-2.433-.156-.251a6.56 6.56 0 0 1-1.007-3.505c0-3.626 2.957-6.584 6.591-6.584a6.56 6.56 0 0 1 4.66 1.931 6.56 6.56 0 0 1 1.928 4.66c-.004 3.639-2.961 6.592-6.592 6.592zm3.615-4.934c-.197-.099-1.17-.578-1.353-.646-.182-.065-.315-.099-.445.099-.133.197-.513.646-.627.775-.114.133-.232.148-.43.05-.197-.1-.836-.308-1.592-.985-.59-.525-.985-1.175-1.103-1.372-.114-.198-.011-.304.088-.403.087-.088.197-.232.296-.346.1-.114.133-.198.198-.33.065-.134.034-.248-.015-.347-.05-.099-.445-1.076-.612-1.47-.16-.389-.323-.335-.445-.34-.114-.007-.247-.007-.38-.007a.73.73 0 0 0-.529.247c-.182.198-.691.677-.691 1.654 0 .977.71 1.916.81 2.049.098.133 1.394 2.132 3.383 2.992.47.205.84.326 1.129.418.475.152.904.129 1.246.08.38-.058 1.171-.48 1.338-.943.164-.464.164-.86.114-.943-.049-.084-.182-.133-.38-.232z"/>
                                    </svg>
                                </button>
                            </div>
                            <p className="text-xs text-slate-500 mt-2">
                                Copie este ID y envíelo al proveedor de la aplicación para recibir su clave de licencia.
                            </p>
                        </div>
                    </div>
                    <div>
                        <h4 className="text-lg font-semibold text-slate-700">2. Active su Licencia</h4>
                        <p className="text-sm text-slate-600 mt-1">
                            Una vez que reciba su clave, introdúzcala a continuación.
                        </p>
                        <div className="mt-3">
                            <input
                                type="text"
                                value={keyInput}
                                onChange={(e) => setKeyInput(e.target.value)}
                                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
                                placeholder="XXXX-XXXX-XXXX-XXXX"
                            />
                        </div>
                    </div>

                    {feedback && (
                        <div className={`p-3 rounded-md text-sm ${feedback.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                            {feedback.message}
                        </div>
                    )}

                    <div className="flex justify-end gap-4 pt-4 border-t">
                        <button onClick={onClose} className="px-4 py-2 bg-slate-200 text-slate-700 rounded-md hover:bg-slate-300">Cerrar</button>
                        <button
                            onClick={handleActivate}
                            disabled={isLoading}
                            className="px-4 py-2 bg-cyan-600 text-white rounded-md hover:bg-cyan-700 shadow disabled:bg-cyan-400 disabled:cursor-not-allowed"
                        >
                            {isLoading ? 'Verificando...' : 'Activar'}
                        </button>
                    </div>
                </div>
            )}
        </Modal>
    );
};

export default LicenseModal;