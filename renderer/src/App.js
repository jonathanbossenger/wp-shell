import React, { useState, useEffect } from 'react';
import RecentDirectories from './components/RecentDirectories';
import CodeEditor from './components/CodeEditor';

function App() {
  const [selectedDirectory, setSelectedDirectory] = useState(null);
  const [isSelecting, setIsSelecting] = useState(false);
  const [code, setCode] = useState('// Enter your WordPress PHP code here\n');
  const [output, setOutput] = useState('');
  const [isExecuting, setIsExecuting] = useState(false);
  const [error, setError] = useState(null);
  const [completions, setCompletions] = useState({ php: [], wordpress: [] });
  const [isLoadingCompletions, setIsLoadingCompletions] = useState(false);
  const [versionInfo, setVersionInfo] = useState({ php: null, wordpress: null });

  // Load completions when directory changes
  useEffect(() => {
    const loadCompletions = async () => {
      if (!selectedDirectory) return;

      setIsLoadingCompletions(true);
      try {
        const result = await window.electronAPI.getCompletions(selectedDirectory);
        const phpCount = result.php?.length || 0;
        const wpCount = result.wordpress?.length || 0;

        setCompletions({ php: result.php || [], wordpress: result.wordpress || [] });
        setVersionInfo(result.versions || { php: null, wordpress: null });

        // Log status
        if (!result.versions.php && !result.versions.wordpress) {
          console.warn('⚠ PHP and WordPress versions not detected. Using fallback completions.');
        } else if (!result.versions.php) {
          console.warn('⚠ PHP not detected. WordPress functions loaded.');
        } else if (!result.versions.wordpress) {
          console.warn('⚠ WordPress version not detected. Using fallback.');
        } else {
          console.log(`✓ Loaded ${phpCount} PHP functions and ${wpCount} WordPress functions`);
        }
      } catch (error) {
        console.error('Error loading completions:', error);
        setCompletions({ php: [], wordpress: [] });
      }
      setIsLoadingCompletions(false);
    };

    loadCompletions();
  }, [selectedDirectory]);

  const handleSelectDirectory = async () => {
    setIsSelecting(true);
    setError(null);
    try {
      const directory = await window.electronAPI.selectDirectory();
      if (directory) {
        setSelectedDirectory(directory);
      }
    } catch (error) {
      console.error('Error selecting directory:', error);
      setError(error.message || 'Error selecting WordPress directory');
      setSelectedDirectory(null);
    }
    setIsSelecting(false);
  };

  const handleSelectRecentDirectory = async (directory) => {
    setIsSelecting(true);
    setError(null);
    try {
      const validatedDirectory = await window.electronAPI.selectRecentDirectory(directory);
      if (validatedDirectory) {
        setSelectedDirectory(validatedDirectory);
      }
    } catch (error) {
      console.error('Error selecting directory:', error);
      setError(error.message || 'Error selecting WordPress directory');
      setSelectedDirectory(null);
    }
    setIsSelecting(false);
  };

  const handleExecuteCode = async () => {
    if (!selectedDirectory || !code.trim()) {
      return;
    }

    setIsExecuting(true);
    setError(null);
    setOutput('Executing...');

    try {
      const result = await window.electronAPI.executeCode(selectedDirectory, code);
      setOutput(result || '(No output)');
    } catch (error) {
      console.error('Error executing code:', error);
      setError(error.message || 'Error executing code');
      setOutput('');
    }

    setIsExecuting(false);
  };

  const handleClearOutput = () => {
    setOutput('');
    setError(null);
  };

  const handleQuit = async () => {
    await window.electronAPI.quitApp();
  };

  return (
    <div className="h-screen flex flex-col bg-gray-100">
      <div className="flex-1 p-4 overflow-hidden">
        <div className="h-full flex flex-col bg-white rounded-xl shadow-lg">
          <div className="p-6 flex-none">
            <h1 className="text-3xl font-bold text-gray-800">WP Shell</h1>
            {error && (
              <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-700">{error}</p>
              </div>
            )}
          </div>
          
          {selectedDirectory ? (
            <div className="flex-1 flex flex-col p-6 pt-0 overflow-hidden">
              <div className="bg-gray-50 rounded-lg p-6 border border-gray-200 flex-none">
                <div className="flex justify-between items-start gap-4">
                  <div className="flex-1">
                    <div className="mb-2">
                      <span className="font-medium text-gray-700">WordPress Directory: </span>
                      <span className="font-mono text-sm text-gray-600 break-all">{selectedDirectory}</span>
                    </div>
                    {!isLoadingCompletions && (
                      <div className="text-xs">
                        {(versionInfo.php || versionInfo.wordpress) ? (
                          <p className="text-gray-500">
                            {versionInfo.php && `PHP ${versionInfo.php}`}
                            {versionInfo.php && versionInfo.wordpress && ' | '}
                            {versionInfo.wordpress && `WordPress ${versionInfo.wordpress}`}
                          </p>
                        ) : (
                          <p className="text-amber-600">⚠ Version detection unavailable - using basic completions</p>
                        )}
                      </div>
                    )}
                  </div>
                  <button
                    onClick={handleSelectDirectory}
                    disabled={isSelecting}
                    className="bg-blue-500 hover:bg-blue-600 text-white px-5 py-2.5 rounded-lg disabled:opacity-50 whitespace-nowrap transition-colors duration-200 shadow-sm"
                  >
                    {isSelecting ? 'Selecting...' : 'Change Directory'}
                  </button>
                </div>
              </div>
              
              <div className="flex-1 flex gap-6 mt-6 min-h-0">
                {/* Left Side - Code Editor */}
                <div className="flex-1 flex flex-col min-h-0">
                  <div className="flex justify-between items-center mb-3">
                    <h2 className="text-xl font-semibold text-gray-800">Code Editor</h2>
                    <div className="flex items-center gap-3">
                      {isLoadingCompletions && (
                        <span className="text-xs text-blue-600">Loading IntelliSense...</span>
                      )}
                      <span className="text-xs text-gray-500">Ctrl/Cmd + Enter to execute</span>
                    </div>
                  </div>
                  <div className="flex-1 min-h-0">
                    <CodeEditor
                      value={code}
                      onChange={(newValue) => setCode(newValue || '')}
                      onExecute={handleExecuteCode}
                      completions={completions}
                      isLoadingCompletions={isLoadingCompletions}
                    />
                  </div>
                  <div className="flex gap-3 flex-none mt-4">
                    <button
                      onClick={handleExecuteCode}
                      disabled={isExecuting || !code.trim()}
                      className="bg-green-500 hover:bg-green-600 text-white px-6 py-2.5 rounded-lg disabled:opacity-50 transition-colors duration-200 shadow-sm font-medium"
                    >
                      {isExecuting ? 'Executing...' : 'Execute Code'}
                    </button>
                    <button
                      onClick={handleClearOutput}
                      className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2.5 rounded-lg transition-colors duration-200 shadow-sm"
                    >
                      Clear Output
                    </button>
                  </div>
                </div>
                
                {/* Right Side - Output */}
                <div className="flex-1 flex flex-col min-h-0">
                  <h2 className="text-xl font-semibold text-gray-800 mb-3">Output</h2>
                  <div className="output-area flex-1">
                    <div className="output-content">
                      {output || <span className="text-gray-400 italic">No output yet. Execute some code to see results here.</span>}
                    </div>
                  </div>
                  <div className="flex gap-3 flex-none mt-4 justify-end">
                    <button
                      onClick={handleQuit}
                      className="bg-red-500 hover:bg-red-600 text-white px-4 py-2.5 rounded-lg transition-colors duration-200 shadow-sm"
                    >
                      Quit
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center p-6">
              <div className="text-center">
                <h1 className="text-2xl font-semibold text-gray-800 mb-6">
                  Select your WordPress installation directory
                </h1>
                
                <RecentDirectories 
                  onDirectorySelect={handleSelectRecentDirectory} 
                  isSelecting={isSelecting}
                />

                <div className="space-x-3">
                  <button
                    onClick={handleSelectDirectory}
                    disabled={isSelecting}
                    className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg disabled:opacity-50 transition-colors duration-200 shadow-sm"
                  >
                    {isSelecting ? 'Selecting...' : 'Select Directory'}
                  </button>
                  <button
                    onClick={handleQuit}
                    className="bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-lg transition-colors duration-200 shadow-sm"
                  >
                    Quit
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
