import React, { useState, useRef, useEffect } from 'react';
import QrScanner from 'qr-scanner';
import './QRScanner.css';

const QRScanner = () => {
  const [scannedData, setScannedData] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState('');
  const [cameras, setCameras] = useState([]);
  const [selectedCamera, setSelectedCamera] = useState('');
  const videoRef = useRef(null);
  const qrScannerRef = useRef(null);

  useEffect(() => {
    // Load available cameras on component mount
    loadCameras();
    
    return () => {
      // Cleanup scanner on component unmount
      if (qrScannerRef.current) {
        qrScannerRef.current.stop();
        qrScannerRef.current.destroy();
      }
    };
  }, []);

  const loadCameras = async () => {
    try {
      const availableCameras = await QrScanner.listCameras(true);
      
      // Filter for only back-facing cameras
      const backCameras = availableCameras.filter(camera => {
        const label = camera.label.toLowerCase();
        const facingMode = camera.facingMode;
        
        // Check for back-facing indicators (Samsung-optimized)
        const isBackCamera = (
          label.includes('back') || 
          label.includes('environment') ||
          label.includes('rear') ||
          label.includes('telephoto') ||
          label.includes('zoom') ||
          label.includes('wide') ||
          label.includes('ultra') ||
          label.includes('facing back') ||  // Samsung specific
          facingMode === 'environment' ||
          // Samsung cameras often start with "camera" and don't have front indicators
          (label.startsWith('camera') && !label.includes('front') && !label.includes('user') && !label.includes('face') && !label.includes('selfie') && facingMode !== 'user')
        );
        
        return isBackCamera;
      });
      
      // Rename cameras to simple "Camera 1", "Camera 2", etc.
      const renamedCameras = backCameras.map((camera, index) => ({
        ...camera,
        displayName: `Camera ${index + 1}`
      }));
      
      setCameras(renamedCameras);
      
      if (renamedCameras.length > 0) {
        // Select the first back camera
        setSelectedCamera(renamedCameras[0].id);
      }
    } catch (err) {
      console.log('Could not load cameras:', err);
    }
  };

  const startScanning = async () => {
    try {
      setError('');
      setIsScanning(true);

      // Check if camera is available
      const hasCamera = await QrScanner.hasCamera();
      if (!hasCamera) {
        throw new Error('No camera found on this device');
      }

      // Initialize QR scanner with selected camera
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
          preferredCamera: selectedCamera || 'environment',
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

  const switchCamera = async (cameraId) => {
    const wasScanning = isScanning;
    if (wasScanning) {
      stopScanning();
    }
    setSelectedCamera(cameraId);
    if (wasScanning) {
      // Small delay to ensure the previous scanner is fully stopped
      setTimeout(() => {
        startScanning();
      }, 100);
    }
  };

  const clearResult = () => {
    setScannedData('');
    setError('');
  };

  return (
    <div className="qr-scanner-container">
      {/* Camera Selection */}
      {cameras.length > 1 && !isScanning && (
        <div className="camera-selection">
          <label htmlFor="camera-select">Choose Camera:</label>
          <select
            id="camera-select"
            value={selectedCamera}
            onChange={(e) => switchCamera(e.target.value)}
            className="camera-select"
          >
            {cameras.map((camera) => (
              <option key={camera.id} value={camera.id}>
                {camera.displayName}
              </option>
            ))}
          </select>
        </div>
      )}

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
