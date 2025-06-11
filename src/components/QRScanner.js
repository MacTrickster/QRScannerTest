import React, { useState, useRef, useEffect } from 'react';
import QrScanner from 'qr-scanner';
import './QRScanner.css';

const QRScanner = () => {
  const [scannedData, setScannedData] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState('');
  const videoRef = useRef(null);
  const qrScannerRef = useRef(null);

  useEffect(() => {
    return () => {
      // Cleanup scanner on component unmount
      if (qrScannerRef.current) {
        qrScannerRef.current.stop();
        qrScannerRef.current.destroy();
      }
    };
  }, []);

  const startScanning = async () => {
    try {
      setError('');
      setIsScanning(true);

      // Check if camera is available
      const hasCamera = await QrScanner.hasCamera();
      if (!hasCamera) {
        throw new Error('No camera found on this device');
      }

      // Initialize QR scanner
      qrScannerRef.current = new QrScanner(
        videoRef.current,
        (result) => {
          setScannedData(result.data);
          stopScanning();
        },
        {
          onDecodeError: (error) => {
            // Ignore decode errors while scanning
            console.log('Decode error:', error);
          },
          highlightScanRegion: true,
          highlightCodeOutline: true,
        }
      );

      await qrScannerRef.current.start();
    } catch (err) {
      setError(`Failed to start camera: ${err.message}`);
      setIsScanning(false);
    }
  };

  const stopScanning = () => {
    if (qrScannerRef.current) {
      qrScannerRef.current.stop();
    }
    setIsScanning(false);
  };

  const clearResult = () => {
    setScannedData('');
    setError('');
  };

  return (
    <div className="qr-scanner-container">
      <div className="scanner-controls">
        {!isScanning ? (
          <button onClick={startScanning} className="scan-button">
            Start Scanning
          </button>
        ) : (
          <button onClick={stopScanning} className="stop-button">
            Stop Scanning
          </button>
        )}
        
        {(scannedData || error) && (
          <button onClick={clearResult} className="clear-button">
            Clear
          </button>
        )}
      </div>

      {isScanning && (
        <div className="video-container">
          <video ref={videoRef} className="scanner-video"></video>
          <div className="scanner-overlay">
            <div className="scanner-frame"></div>
          </div>
          <p className="scanning-text">Position the QR code within the frame</p>
        </div>
      )}

      {error && (
        <div className="error-message">
          <h3>Error</h3>
          <p>{error}</p>
        </div>
      )}

      {scannedData && (
        <div className="result-container">
          <h3>Scanned Content:</h3>
          <div className="result-content">
            <p>{scannedData}</p>
          </div>
          {scannedData.startsWith('http') && (
            <a 
              href={scannedData} 
              target="_blank" 
              rel="noopener noreferrer"
              className="link-button"
            >
              Open Link
            </a>
          )}
        </div>
      )}
    </div>
  );
};

export default QRScanner;
