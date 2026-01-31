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

    // Helper function to parse function signature from detail string
    const parseSignature = (detail) => {
      if (!detail) return null;

      // Match pattern: "returnType functionName(param1, param2, ...)"
      // Example: "int|float abs(int|float $number)"
      const match = detail.match(/^([\w|\\]+)\s+(\w+)\((.*)\)$/);
      if (!match) return null;

      const [, returnType, funcName, paramsStr] = match;

      // Parse parameters
      const parameters = [];
      if (paramsStr.trim()) {
        // Split by comma, but be careful with nested arrays/types
        let depth = 0;
        let currentParam = '';

        for (let i = 0; i < paramsStr.length; i++) {
          const char = paramsStr[i];
          if (char === '<' || char === '[' || char === '(') depth++;
          else if (char === '>' || char === ']' || char === ')') depth--;
          else if (char === ',' && depth === 0) {
            parameters.push(currentParam.trim());
            currentParam = '';
            continue;
          }
          currentParam += char;
        }
        if (currentParam.trim()) {
          parameters.push(currentParam.trim());
        }
      }

      return {
        returnType,
        funcName,
        parameters
      };
    };

    // Helper function to find which function is being called and active parameter
    const getFunctionContext = (model, position) => {
      const textUntilPosition = model.getValueInRange({
        startLineNumber: position.lineNumber,
        startColumn: 1,
        endLineNumber: position.lineNumber,
        endColumn: position.column,
      });

      // Find the last unmatched opening parenthesis
      let depth = 0;
      let functionStart = -1;
      let commaCount = 0;

      for (let i = textUntilPosition.length - 1; i >= 0; i--) {
        const char = textUntilPosition[i];

        if (char === ')') {
          depth++;
        } else if (char === '(') {
          depth--;
          if (depth < 0) {
            functionStart = i;
            break;
          }
        } else if (char === ',' && depth === 0) {
          commaCount++;
        }
      }

      if (functionStart === -1) return null;

      // Extract function name before the opening parenthesis
      const textBeforeOpen = textUntilPosition.substring(0, functionStart);
      const funcMatch = textBeforeOpen.match(/(\w+)$/);

      if (!funcMatch) return null;

      return {
        functionName: funcMatch[1],
        activeParameter: commaCount
      };
    };

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

    // Register signature help provider
    monaco.languages.registerSignatureHelpProvider('php', {
      signatureHelpTriggerCharacters: ['(', ','],
      signatureHelpRetriggerCharacters: [','],

      provideSignatureHelp: (model, position) => {
        const context = getFunctionContext(model, position);
        if (!context) return null;

        // Merge all completions to search for function
        const allCompletions = [
          ...(completionsRef.current.php || []),
          ...(completionsRef.current.wordpress || [])
        ];

        // Find matching function
        const func = allCompletions.find(
          item => item.label.toLowerCase() === context.functionName.toLowerCase()
        );

        if (!func || !func.detail) return null;

        const parsed = parseSignature(func.detail);
        if (!parsed) return null;

        // Build parameter information
        const parameters = parsed.parameters.map(param => ({
          label: param,
          documentation: '' // Could be enhanced with individual param docs
        }));

        return {
          dispose: () => {},
          value: {
            signatures: [
              {
                label: func.detail,
                documentation: func.documentation,
                parameters: parameters
              }
            ],
            activeSignature: 0,
            activeParameter: Math.min(context.activeParameter, parameters.length - 1)
          }
        };
      }
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
          parameterHints: {
            enabled: true,
            above: false // Display signature help below the function, not above
          },
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
