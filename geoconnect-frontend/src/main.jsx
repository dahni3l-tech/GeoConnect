import { registerSW } from 'virtual:pwa-register'
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import 'leaflet/dist/leaflet.css';

registerSW({
  onNeedRefresh: () => {
    console.log('Service worker updated, refreshing...');
  },
  onOfflineReady: () => {
    console.log('App is ready to work offline');
  },
})

ReactDOM.createRoot(document.getElementById('root')).render(
    <BrowserRouter>
        <App />
    </BrowserRouter>
);
