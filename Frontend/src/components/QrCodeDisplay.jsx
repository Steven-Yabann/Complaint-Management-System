import React from 'react';
import { QRCodeSVG } from 'qrcode.react'; // Using QRCodeSVG for better scalability and styling

const QrCodeDisplay = () => {
//using ip is better for same network access
    const redirectUrl = "http://192.168.100.24:5173/";

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
            backgroundColor: '#f8f8f8',
            borderRadius: '8px',
            boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
            maxWidth: '300px',
            margin: '20px auto'
        }}>
            <h2>Scan to Access Complaint System</h2>
            <p>Use your phone's camera to scan the QR code and go directly to the homepage.</p>
            <div style={{ marginTop: '20px' }}>
                <QRCodeSVG
                    value={redirectUrl}
                    size={256} 
                    level={"H"} 
                    includeMargin={true} 
                    
                    bgColor="#FFFFFF" 
                    fgColor="#000000" 
                />
            </div>
            <p style={{ marginTop: '15px', fontSize: '0.9em', color: '#555' }}>
                URL: <a href={redirectUrl} target="_blank" rel="noopener noreferrer">{redirectUrl}</a>
            </p>
            <p style={{ fontSize: '0.8em', color: '#888' }}>
                (Make sure your device is on the same network if accessing from a different machine.)
            </p>
        </div>
    );
};

export default QrCodeDisplay;