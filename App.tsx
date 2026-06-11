
import React from 'react';
// FIX: Changed import to named import as ProjectManager is not a default export.
import { ProjectManager } from './components/ProjectManager';
import { LogoIcon, QuestionMarkCircleIcon, APP_VERSION } from './constants';
import UserManualModal from './components/UserManualModal';

// Icon for the update notification
const ArrowPathIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0011.667 0l3.181-3.183m-4.991-2.691V5.25a2.25 2.25 0 00-2.25-2.25h-4.5a2.25 2.25 0 00-2.25 2.25v4.5A2.25 2.25 0 006.75 12h4.5a2.25 2.25 0 002.25-2.25v-2.25" />
    </svg>
);


// Notification component for PWA updates
const UpdateNotification = ({ onUpdate }: { onUpdate: () => void }) => {
    return (
        <div
            role="alert"
            className="fixed bottom-4 right-4 bg-slate-800 text-white p-4 rounded-lg shadow-2xl flex items-center gap-4 z-50 animate-fade-in-up"
        >
            <ArrowPathIcon className="h-6 w-6 text-cyan-400 animate-spin-slow" />
            <div>
                <p className="font-semibold">Nueva versión disponible.</p>
                <p className="text-sm text-slate-300">Recargue para aplicar las últimas mejoras.</p>
            </div>
            <button
                onClick={onUpdate}
                className="ml-auto flex-shrink-0 px-4 py-2 bg-cyan-600 rounded-md hover:bg-cyan-700 font-semibold text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 focus:ring-cyan-500"
            >
                Actualizar
            </button>
        </div>
    );
};


const App: React.FC = () => {
    const [isManualOpen, setIsManualOpen] = React.useState(false);
    const [isUpdateAvailable, setIsUpdateAvailable] = React.useState(false);
    const [waitingWorker, setWaitingWorker] = React.useState<ServiceWorker | null>(null);

    React.useEffect(() => {
        const handleUpdate = (event: Event) => {
            const reg = (event as CustomEvent).detail;
            if (reg && reg.waiting) {
                setWaitingWorker(reg.waiting);
                setIsUpdateAvailable(true);
            }
        };

        window.addEventListener('swUpdate', handleUpdate);
        return () => window.removeEventListener('swUpdate', handleUpdate);
    }, []);

    const handleUpdateClick = () => {
        if (waitingWorker) {
            // Add a listener that will reload the page once the new service worker has taken control
            navigator.serviceWorker.addEventListener('controllerchange', () => {
                window.location.reload();
            });

            // Send a message to the waiting service worker to activate it
            waitingWorker.postMessage({ type: 'SKIP_WAITING' });
            setIsUpdateAvailable(false); // Hide notification after clicking
        }
    };

    const handleOpenManual = () => {
        setIsManualOpen(true);
    };

    return (
        <div className="min-h-screen-real bg-gradient-to-tr from-slate-50 via-slate-50 to-slate-100 font-sans text-slate-800 antialiased selection:bg-cyan-500 selection:text-white">
            <header className="bg-white/80 backdrop-blur-md border-b border-slate-100 sticky top-0 z-40 transition-all duration-300">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        <div className="flex items-center space-x-3 group">
                            <div className="p-2 bg-gradient-to-br from-cyan-500 to-cyan-600 rounded-xl shadow-md shadow-cyan-500/10 transition-transform group-hover:scale-105 duration-350">
                                <LogoIcon className="h-6 w-6 text-white" />
                            </div>
                            <h1 className="text-xl sm:text-2xl font-bold text-slate-700 tracking-tight">
                                Habitex <span className="font-light text-cyan-600">Calcula Pro</span>
                            </h1>
                        </div>
                         <div className="flex items-center">
                             <button
                                onClick={handleOpenManual}
                                className="p-2.5 text-slate-400 hover:text-cyan-600 rounded-xl hover:bg-slate-100/80 transition-all duration-200"
                                title="Ver Manual de Usuario"
                            >
                                <QuestionMarkCircleIcon className="h-6 w-6" />
                            </button>
                        </div>
                    </div>
                </div>
            </header>
            <main className="container mx-auto p-4 sm:p-6 lg:p-8">
                <ProjectManager />
            </main>
            <footer className="text-center py-6 text-xs text-slate-400 border-t border-slate-100 mt-12 bg-white/40">
                <p>&copy; {new Date().getFullYear()} Habitex. v{APP_VERSION}. Todos los derechos reservados.</p>
            </footer>

            <UserManualModal 
                isOpen={isManualOpen} 
                onClose={() => setIsManualOpen(false)} 
            />
            
            {isUpdateAvailable && <UpdateNotification onUpdate={handleUpdateClick} />}
        </div>
    );
};

export default App;
