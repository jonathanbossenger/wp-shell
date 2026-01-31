import React, { useRef, useEffect } from 'react';
import Editor from '@monaco-editor/react';

const CodeEditor = ({ value, onChange, onExecute, completions, isLoadingCompletions }) => {
  const editorRef = useRef(null);
  const monacoRef = useRef(null);
  const completionProviderRef = useRef(null);
  const completionsRef = useRef(completions); // Store completions in ref for closure access

  // Update completions ref whenever completions prop changes
  useEffect(() => {
    completionsRef.current = completions;
  }, [completions]);

  const handleEditorDidMount = (editor, monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;

    // Register dynamic completion provider with trigger characters
    completionProviderRef.current = monaco.languages.registerCompletionItemProvider('php', {
      triggerCharacters: ['_', '$', '>'], // Trigger on underscore, $variable, ->method
      provideCompletionItems: (model, position) => {
        // Extract the word prefix before the cursor
        const textUntilPosition = model.getValueInRange({
          startLineNumber: position.lineNumber,
          startColumn: 1,
          endLineNumber: position.lineNumber,
          endColumn: position.column,
        });

        // Match the word being typed (alphanumeric and underscore)
        const match = textUntilPosition.match(/(\w+)$/);
        const prefix = match ? match[1].toLowerCase() : '';

        // Merge PHP and WordPress completions from ref (always current)
        const allCompletions = [
          ...(completionsRef.current.php || []),
          ...(completionsRef.current.wordpress || [])
        ];

        // If no prefix, return all completions (or empty if too many)
        if (!prefix) {
          // Return empty suggestions if no prefix typed (avoid showing 5000+ items)
          return { suggestions: [] };
        }

        // Filter suggestions by prefix
        let suggestions = allCompletions.filter(item =>
          item.label.toLowerCase().startsWith(prefix)
        );

        // Limit to 100 suggestions for performance
        suggestions = suggestions.slice(0, 100);

        // Convert to Monaco format
        return {
          suggestions: suggestions.map(item => ({
            label: item.label,
            kind: monaco.languages.CompletionItemKind[item.kind] || monaco.languages.CompletionItemKind.Function,
            documentation: item.documentation,
            insertText: item.insertText,
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            detail: item.detail,
            sortText: item.label, // Sort alphabetically
          }))
        };
      },
    });

    // Add keyboard shortcut for Ctrl/Cmd+Enter to execute code
    editor.addCommand(
      monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter,
      () => {
        if (onExecute) {
          onExecute();
        }
      }
    );
  };

  // Update completions when they change
  useEffect(() => {
    if (monacoRef.current && editorRef.current && !isLoadingCompletions) {
      const totalPhp = completions.php?.length || 0;
      const totalWp = completions.wordpress?.length || 0;
      const total = totalPhp + totalWp;

      if (total > 0) {
        console.log(`IntelliSense updated: ${totalPhp} PHP + ${totalWp} WordPress = ${total} functions`);
      }
    }
  }, [completions, isLoadingCompletions]);

  const handleEditorChange = (newValue) => {
    if (onChange) {
      onChange(newValue || '');
    }
  };

  return (
    <div className="code-editor">
      <Editor
        height="100%"
        defaultLanguage="php"
        value={value}
        onChange={handleEditorChange}
        onMount={handleEditorDidMount}
        theme="vs-dark"
        options={{
          minimap: { enabled: false },
          fontSize: 14,
          tabSize: 4,
          insertSpaces: true,
          automaticLayout: true,
          scrollBeyondLastLine: false,
          wordWrap: 'on',
          // Enhanced autocomplete settings
          suggestOnTriggerCharacters: true,
          quickSuggestions: {
            other: true,
            comments: false,
            strings: true
          },
          suggest: {
            snippetsPreventQuickSuggestions: false,
            showWords: false, // Don't show word-based suggestions, only our custom ones
          },
          acceptSuggestionOnCommitCharacter: true,
          acceptSuggestionOnEnter: 'on',
          parameterHints: { enabled: true },
          hover: { enabled: true },
          bracketPairColorization: { enabled: true },
          matchBrackets: 'always',
          folding: true,
          lineNumbers: 'on',
          renderLineHighlight: 'all',
        }}
      />
    </div>
  );
};

export default CodeEditor;
