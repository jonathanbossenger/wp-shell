import React, { useState, useRef } from 'react';
import RecentDirectories from './components/RecentDirectories';

function App() {
  const [selectedDirectory, setSelectedDirectory] = useState(null);
  const [isSelecting, setIsSelecting] = useState(false);
  const [code, setCode] = useState('// Enter your WordPress PHP code here\n// Example:\n// $posts = get_posts(array(\'numberposts\' => 5));\n// foreach ($posts as $post) {\n//     echo $post->post_title . "\\n";\n// }\n');
  const [output, setOutput] = useState('');
  const [isExecuting, setIsExecuting] = useState(false);
  const [error, setError] = useState(null);
  const textareaRef = useRef(null);

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

  const handleKeyDown = (e) => {
    // Handle Tab key for indentation
    if (e.key === 'Tab') {
      e.preventDefault();
      const start = e.target.selectionStart;
      const end = e.target.selectionEnd;
      const newCode = code.substring(0, start) + '    ' + code.substring(end);
      setCode(newCode);
      
      // Set cursor position after the tab
      setTimeout(() => {
        textareaRef.current.selectionStart = textareaRef.current.selectionEnd = start + 4;
      }, 0);
    }
    
    // Handle Ctrl/Cmd + Enter for execution
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      handleExecuteCode();
    }
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
                <div className="flex justify-between items-center gap-4">
                  <div className="flex-1">
                    <p className="font-medium text-gray-700 mb-2">WordPress Directory</p>
                    <p className="bg-white px-4 py-2.5 rounded-md border border-gray-200 font-mono text-sm text-gray-600 break-all">
                      {selectedDirectory}
                    </p>
                  </div>
                  <button
                    onClick={handleSelectDirectory}
                    disabled={isSelecting}
                    className="bg-blue-500 hover:bg-blue-600 text-white px-5 py-2.5 rounded-lg disabled:opacity-50 whitespace-nowrap transition-colors duration-200 shadow-sm h-[42px] self-end"
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
                    <span className="text-xs text-gray-500">Ctrl/Cmd + Enter to execute</span>
                  </div>
                  <div className="code-editor flex-1 min-h-0">
                    <textarea
                      ref={textareaRef}
                      value={code}
                      onChange={(e) => setCode(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder="Enter your WordPress PHP code here..."
                      className="h-full"
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
