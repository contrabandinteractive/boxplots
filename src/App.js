import React, { useState } from 'react';
import BoxPlotChart from './components/BoxPlotChart';
import sampleData from './data/sampleData.json';

function App() {
  const [darkMode, setDarkMode] = useState(false);

  return (
    <div className="w-full">
      <button onClick={() => setDarkMode(!darkMode)}>
        Toggle {darkMode ? 'Light' : 'Dark'} Mode
      </button>
      <BoxPlotChart darkMode={darkMode} rawData={sampleData} />
    </div>

    

  );
}

export default App;
