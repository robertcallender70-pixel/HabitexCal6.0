import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

declare const idb: any;
declare const jspdf: any;

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);
root.render(
    <React.StrictMode>
        <App />
    </React.StrictMode>
);
