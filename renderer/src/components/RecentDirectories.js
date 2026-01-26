import React, { useState, useEffect } from 'react';

const RecentDirectories = ({ onDirectorySelect, isSelecting }) => {
  const [recentDirs, setRecentDirs] = useState([]);

  useEffect(() => {
    loadRecentDirectories();
  }, []);

  const loadRecentDirectories = async () => {
    try {
      const directories = await window.electronAPI.getRecentDirectories();
      setRecentDirs(directories);
    } catch (error) {
      console.error('Error loading recent directories:', error);
    }
  };

  if (recentDirs.length === 0) {
    return null;
  }

  return (
    <div className="mb-6">
      <h2 className="text-lg font-medium text-gray-700 mb-3">Recent Directories</h2>
      <div className="space-y-2">
        {recentDirs.map((dir, index) => (
          <button
            key={index}
            onClick={() => onDirectorySelect(dir)}
            disabled={isSelecting}
            className="w-full text-left px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg disabled:opacity-50 transition-colors duration-200 text-sm font-mono text-gray-700 truncate"
          >
            {dir}
          </button>
        ))}
      </div>
    </div>
  );
};

export default RecentDirectories;
