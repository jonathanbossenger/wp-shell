import React, { useRef, useEffect } from 'react';
import Editor from '@monaco-editor/react';

const MonacoEditor = ({ value, onChange, onKeyDown, functionDefinitions, isLoadingDefinitions }) => {
  const editorRef = useRef(null);
  const monacoRef = useRef(null);
  const providersRef = useRef([]);

  // Clean up providers when component unmounts or definitions change
  useEffect(() => {
    return () => {
      providersRef.current.forEach(disposable => {
        if (disposable && disposable.dispose) {
          disposable.dispose();
        }
      });
      providersRef.current = [];
    };
  }, [functionDefinitions]);

  // Register providers when definitions are loaded
  useEffect(() => {
    if (!monacoRef.current || !functionDefinitions) return;

    const monaco = monacoRef.current;

    // Dispose old providers
    providersRef.current.forEach(disposable => {
      if (disposable && disposable.dispose) {
        disposable.dispose();
      }
    });
    providersRef.current = [];

    // Register completion provider
    const completionProvider = monaco.languages.registerCompletionItemProvider('php', {
      provideCompletionItems: (model, position) => {
        const suggestions = generateSuggestions(monaco, functionDefinitions);
        return { suggestions };
      },
    });
    providersRef.current.push(completionProvider);

    // Register hover provider
    const hoverProvider = monaco.languages.registerHoverProvider('php', {
      provideHover: (model, position) => {
        const word = model.getWordAtPosition(position);
        if (!word) return null;

        const hoverInfo = generateHoverInfo(word.word, functionDefinitions);
        if (!hoverInfo) return null;

        return {
          range: new monaco.Range(
            position.lineNumber,
            word.startColumn,
            position.lineNumber,
            word.endColumn
          ),
          contents: [{ value: hoverInfo }],
        };
      },
    });
    providersRef.current.push(hoverProvider);

    // Register signature help provider
    const signatureProvider = monaco.languages.registerSignatureHelpProvider('php', {
      signatureHelpTriggerCharacters: ['(', ','],
      provideSignatureHelp: (model, position) => {
        const textUntilPosition = model.getValueInRange({
          startLineNumber: position.lineNumber,
          startColumn: 1,
          endLineNumber: position.lineNumber,
          endColumn: position.column,
        });

        const functionMatch = textUntilPosition.match(/(\$?\w+)\s*\([^)]*$/);
        if (!functionMatch) return null;

        const functionName = functionMatch[1];
        const signatureInfo = generateSignature(functionName, functionDefinitions);
        if (!signatureInfo) return null;

        return {
          value: signatureInfo,
          dispose: () => {},
        };
      },
    });
    providersRef.current.push(signatureProvider);

  }, [functionDefinitions]);

  const handleEditorDidMount = (editor, monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;

    // Set up keyboard shortcuts
    editor.addCommand(
      monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter,
      () => {
        if (onKeyDown) {
          onKeyDown({ key: 'Enter', ctrlKey: true, metaKey: true, preventDefault: () => {} });
        }
      }
    );
  };

  return (
    <Editor
      height="100%"
      defaultLanguage="php"
      value={value}
      onChange={onChange}
      onMount={handleEditorDidMount}
      theme="vs-dark"
      loading={isLoadingDefinitions ? "Loading IntelliSense..." : "Loading editor..."}
      options={{
        minimap: { enabled: false },
        fontSize: 14,
        lineHeight: 21,
        fontFamily: "'Monaco', 'Menlo', 'Ubuntu Mono', monospace",
        scrollBeyondLastLine: false,
        automaticLayout: true,
        tabSize: 4,
        insertSpaces: true,
        wordWrap: 'on',
        quickSuggestions: true,
        suggestOnTriggerCharacters: true,
        acceptSuggestionOnEnter: 'on',
        parameterHints: {
          enabled: true,
        },
        hover: {
          enabled: true,
        },
      }}
    />
  );
};

// Generate suggestions from function definitions
const generateSuggestions = (monaco, definitions) => {
  const suggestions = [];

  if (!definitions) return suggestions;

  // Add WordPress functions
  if (definitions.wordpressFunctions) {
    definitions.wordpressFunctions.forEach(func => {
      const params = func.params.map((p, idx) => {
        const paramStr = p.type ? `${p.type} $${p.name}` : `$${p.name}`;
        if (p.optional && p.default !== undefined) {
          return `\${${idx + 1}:${paramStr} = ${p.default}}`;
        } else if (p.optional) {
          return `\${${idx + 1}:${paramStr}}`;
        }
        return `\${${idx + 1}:${paramStr}}`;
      }).join(', ');

      const insertText = params ? `${func.name}(${params})` : `${func.name}()`;
      
      // Extract brief description from docComment
      let documentation = '';
      if (func.docComment) {
        const lines = func.docComment.split('\n');
        const descLines = lines.filter(line => {
          const trimmed = line.trim();
          return trimmed && !trimmed.startsWith('/**') && !trimmed.startsWith('*/') && 
                 !trimmed.startsWith('* @') && trimmed.startsWith('*');
        });
        documentation = descLines.map(l => l.replace(/^\s*\*\s?/, '')).join('\n').trim();
        if (documentation.length > 200) {
          documentation = documentation.substring(0, 200) + '...';
        }
      }

      suggestions.push({
        label: func.name,
        kind: monaco.languages.CompletionItemKind.Function,
        insertText: insertText,
        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
        documentation: documentation || `WordPress function: ${func.name}`,
        detail: generateFunctionSignature(func),
      });
    });
  }

  // Add PHP functions
  if (definitions.phpFunctions) {
    definitions.phpFunctions.forEach(func => {
      const params = func.params.map((p, idx) => {
        return p.optional ? `\${${idx + 1}:$${p.name}}` : `\${${idx + 1}:$${p.name}}`;
      }).join(', ');

      const insertText = params ? `${func.name}(${params})` : `${func.name}()`;

      suggestions.push({
        label: func.name,
        kind: monaco.languages.CompletionItemKind.Function,
        insertText: insertText,
        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
        documentation: `PHP function: ${func.name}`,
        detail: generateFunctionSignature(func),
      });
    });
  }

  return suggestions;
};

// Generate hover information
const generateHoverInfo = (word, definitions) => {
  if (!definitions) return null;

  // Check WordPress functions
  if (definitions.wordpressFunctions) {
    const func = definitions.wordpressFunctions.find(f => f.name === word);
    if (func) {
      let doc = `**${func.name}**${generateFunctionSignature(func)}\n\n`;
      
      if (func.docComment) {
        const lines = func.docComment.split('\n');
        const descLines = lines.filter(line => {
          const trimmed = line.trim();
          return trimmed && !trimmed.startsWith('/**') && !trimmed.startsWith('*/') && 
                 !trimmed.startsWith('* @') && trimmed.startsWith('*');
        });
        const description = descLines.map(l => l.replace(/^\s*\*\s?/, '')).join('\n').trim();
        if (description) {
          doc += description;
        }
      }
      
      if (func.file && !func.file.includes('eval()') && !func.file.includes('runtime')) {
        doc += `\n\n_Defined in: ${func.file}_`;
      }
      
      return doc;
    }
  }

  // Check PHP functions
  if (definitions.phpFunctions) {
    const func = definitions.phpFunctions.find(f => f.name === word);
    if (func) {
      return `**${func.name}**${generateFunctionSignature(func)}\n\nPHP built-in function`;
    }
  }

  return null;
};

// Generate signature help
const generateSignature = (functionName, definitions) => {
  if (!definitions) return null;

  // Check WordPress functions
  if (definitions.wordpressFunctions) {
    const func = definitions.wordpressFunctions.find(f => f.name === functionName);
    if (func) {
      const params = func.params.map(p => {
        const paramStr = p.type ? `${p.type} $${p.name}` : `$${p.name}`;
        return {
          label: p.default !== undefined ? `${paramStr} = ${p.default}` : paramStr,
          documentation: p.type ? `Type: ${p.type}` : '',
        };
      });

      return {
        signatures: [
          {
            label: `${func.name}${generateFunctionSignature(func)}`,
            documentation: 'WordPress function',
            parameters: params,
          },
        ],
        activeSignature: 0,
        activeParameter: 0,
      };
    }
  }

  // Check PHP functions
  if (definitions.phpFunctions) {
    const func = definitions.phpFunctions.find(f => f.name === functionName);
    if (func) {
      const params = func.params.map(p => ({
        label: `$${p.name}`,
        documentation: '',
      }));

      return {
        signatures: [
          {
            label: `${func.name}${generateFunctionSignature(func)}`,
            documentation: 'PHP built-in function',
            parameters: params,
          },
        ],
        activeSignature: 0,
        activeParameter: 0,
      };
    }
  }

  return null;
};

// Helper function to generate function signature string
const generateFunctionSignature = (func) => {
  const params = func.params.map(p => {
    const paramStr = p.type ? `${p.type} $${p.name}` : `$${p.name}`;
    if (p.default !== undefined) {
      return `${paramStr} = ${p.default}`;
    }
    return paramStr;
  }).join(', ');

  return `(${params})`;
};

export default MonacoEditor;
