import React from 'react';
import QRScanner from './components/QRScanner';
import './App.css';

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <h1>QR Code Scanner</h1>
      </header>
      <main className="App-main">
        <QRScanner />
      </main>
    </div>
  );
}

export default App;
