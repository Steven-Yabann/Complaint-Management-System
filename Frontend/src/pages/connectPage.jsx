import React from 'react';
import QRCodeDisplay from '../components/QrCodeDisplay';

const ConnectPage = () => {
    return (
        <div style={{ textAlign: 'center', padding: '20px' }}>
            <h1>Connect to Our System</h1>
            <p>Scan the QR code below to quickly access the complaint system on any device.</p>
            <QRCodeDisplay />
        </div>
    );
};

export default ConnectPage;