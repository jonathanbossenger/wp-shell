import React, { useEffect, useRef } from 'react';
import Editor from '@monaco-editor/react';

const MonacoEditor = ({ value, onChange, onKeyDown }) => {
  const editorRef = useRef(null);
  const monacoRef = useRef(null);

  const handleEditorDidMount = (editor, monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;

    // Register WordPress function definitions for IntelliSense
    monaco.languages.registerCompletionItemProvider('php', {
      provideCompletionItems: (model, position) => {
        const suggestions = getWordPressSuggestions(monaco);
        return { suggestions };
      },
    });

    // Register hover provider for Quick Info
    monaco.languages.registerHoverProvider('php', {
      provideHover: (model, position) => {
        const word = model.getWordAtPosition(position);
        if (!word) return null;

        const hoverInfo = getWordPressHoverInfo(word.word);
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

    // Register signature help provider for Parameter Info
    monaco.languages.registerSignatureHelpProvider('php', {
      signatureHelpTriggerCharacters: ['(', ','],
      provideSignatureHelp: (model, position) => {
        const textUntilPosition = model.getValueInRange({
          startLineNumber: position.lineNumber,
          startColumn: 1,
          endLineNumber: position.lineNumber,
          endColumn: position.column,
        });

        const functionMatch = textUntilPosition.match(/(\w+)\s*\([^)]*$/);
        if (!functionMatch) return null;

        const functionName = functionMatch[1];
        const signatureInfo = getWordPressSignature(functionName);
        if (!signatureInfo) return null;

        return {
          value: signatureInfo,
          dispose: () => {},
        };
      },
    });

    // Set up keyboard shortcuts
    editor.addCommand(
      monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter,
      () => {
        // Trigger execute code
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

// WordPress function suggestions for autocomplete
const getWordPressSuggestions = (monaco) => {
  const wordPressFunctions = [
    // Post functions
    {
      label: 'get_posts',
      kind: monaco.languages.CompletionItemKind.Function,
      insertText: 'get_posts(${1:$args})',
      insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
      documentation: 'Retrieves an array of the latest posts, or posts matching given criteria.',
      detail: 'array get_posts(array $args = array())',
    },
    {
      label: 'wp_insert_post',
      kind: monaco.languages.CompletionItemKind.Function,
      insertText: 'wp_insert_post(${1:$postarr})',
      insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
      documentation: 'Inserts or updates a post.',
      detail: 'int|WP_Error wp_insert_post(array $postarr, bool $wp_error = false)',
    },
    {
      label: 'wp_update_post',
      kind: monaco.languages.CompletionItemKind.Function,
      insertText: 'wp_update_post(${1:$postarr})',
      insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
      documentation: 'Updates a post with new post data.',
      detail: 'int|WP_Error wp_update_post(array $postarr, bool $wp_error = false)',
    },
    {
      label: 'wp_delete_post',
      kind: monaco.languages.CompletionItemKind.Function,
      insertText: 'wp_delete_post(${1:$postid})',
      insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
      documentation: 'Trashes or deletes a post or page.',
      detail: 'WP_Post|false|null wp_delete_post(int $postid = 0, bool $force_delete = false)',
    },
    {
      label: 'get_post',
      kind: monaco.languages.CompletionItemKind.Function,
      insertText: 'get_post(${1:$post})',
      insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
      documentation: 'Retrieves post data given a post ID or post object.',
      detail: 'WP_Post|array|null get_post(int|WP_Post|null $post = null, string $output = OBJECT)',
    },
    // Site/Blog functions
    {
      label: 'get_bloginfo',
      kind: monaco.languages.CompletionItemKind.Function,
      insertText: 'get_bloginfo(${1:\'name\'})',
      insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
      documentation: 'Retrieves information about the current site.',
      detail: 'string get_bloginfo(string $show = \'\')',
    },
    {
      label: 'get_site_url',
      kind: monaco.languages.CompletionItemKind.Function,
      insertText: 'get_site_url()',
      documentation: 'Retrieves the URL for the current site.',
      detail: 'string get_site_url(int $blog_id = null, string $path = \'\', string|null $scheme = null)',
    },
    {
      label: 'home_url',
      kind: monaco.languages.CompletionItemKind.Function,
      insertText: 'home_url(${1:\'/\'})',
      insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
      documentation: 'Retrieves the URL for the current site where the front end is accessible.',
      detail: 'string home_url(string $path = \'\', string|null $scheme = null)',
    },
    // Option functions
    {
      label: 'get_option',
      kind: monaco.languages.CompletionItemKind.Function,
      insertText: 'get_option(${1:\'option_name\'})',
      insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
      documentation: 'Retrieves an option value based on an option name.',
      detail: 'mixed get_option(string $option, mixed $default = false)',
    },
    {
      label: 'update_option',
      kind: monaco.languages.CompletionItemKind.Function,
      insertText: 'update_option(${1:\'option_name\'}, ${2:$value})',
      insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
      documentation: 'Updates the value of an option that was already added.',
      detail: 'bool update_option(string $option, mixed $value, string|bool $autoload = null)',
    },
    {
      label: 'delete_option',
      kind: monaco.languages.CompletionItemKind.Function,
      insertText: 'delete_option(${1:\'option_name\'})',
      insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
      documentation: 'Removes an option by name.',
      detail: 'bool delete_option(string $option)',
    },
    {
      label: 'add_option',
      kind: monaco.languages.CompletionItemKind.Function,
      insertText: 'add_option(${1:\'option_name\'}, ${2:$value})',
      insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
      documentation: 'Adds a new option.',
      detail: 'bool add_option(string $option, mixed $value = \'\', string $deprecated = \'\', string|bool $autoload = \'yes\')',
    },
    // User functions
    {
      label: 'get_users',
      kind: monaco.languages.CompletionItemKind.Function,
      insertText: 'get_users(${1:$args})',
      insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
      documentation: 'Retrieves list of users matching criteria.',
      detail: 'array get_users(array $args = array())',
    },
    {
      label: 'get_user_by',
      kind: monaco.languages.CompletionItemKind.Function,
      insertText: 'get_user_by(${1:\'id\'}, ${2:$value})',
      insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
      documentation: 'Retrieves user info by user ID, email, slug, or login.',
      detail: 'WP_User|false get_user_by(string $field, int|string $value)',
    },
    {
      label: 'wp_insert_user',
      kind: monaco.languages.CompletionItemKind.Function,
      insertText: 'wp_insert_user(${1:$userdata})',
      insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
      documentation: 'Inserts a user into the database.',
      detail: 'int|WP_Error wp_insert_user(array|object $userdata)',
    },
    // Database functions
    {
      label: '$wpdb',
      kind: monaco.languages.CompletionItemKind.Variable,
      insertText: '$wpdb',
      documentation: 'WordPress database object for running custom queries.',
      detail: 'wpdb $wpdb',
    },
    // Taxonomy functions
    {
      label: 'get_terms',
      kind: monaco.languages.CompletionItemKind.Function,
      insertText: 'get_terms(${1:$args})',
      insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
      documentation: 'Retrieves the terms in a given taxonomy or list of taxonomies.',
      detail: 'array|WP_Error get_terms(array|string $args = array())',
    },
    {
      label: 'wp_insert_term',
      kind: monaco.languages.CompletionItemKind.Function,
      insertText: 'wp_insert_term(${1:$term}, ${2:$taxonomy})',
      insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
      documentation: 'Adds a new term to the database.',
      detail: 'array|WP_Error wp_insert_term(string $term, string $taxonomy, array $args = array())',
    },
    // Meta functions
    {
      label: 'get_post_meta',
      kind: monaco.languages.CompletionItemKind.Function,
      insertText: 'get_post_meta(${1:$post_id}, ${2:$key})',
      insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
      documentation: 'Retrieves a post meta field for the given post ID.',
      detail: 'mixed get_post_meta(int $post_id, string $key = \'\', bool $single = false)',
    },
    {
      label: 'update_post_meta',
      kind: monaco.languages.CompletionItemKind.Function,
      insertText: 'update_post_meta(${1:$post_id}, ${2:$meta_key}, ${3:$meta_value})',
      insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
      documentation: 'Updates a post meta field based on the given post ID.',
      detail: 'int|bool update_post_meta(int $post_id, string $meta_key, mixed $meta_value, mixed $prev_value = \'\')',
    },
    {
      label: 'add_post_meta',
      kind: monaco.languages.CompletionItemKind.Function,
      insertText: 'add_post_meta(${1:$post_id}, ${2:$meta_key}, ${3:$meta_value})',
      insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
      documentation: 'Adds a meta field to the given post.',
      detail: 'int|false add_post_meta(int $post_id, string $meta_key, mixed $meta_value, bool $unique = false)',
    },
    {
      label: 'delete_post_meta',
      kind: monaco.languages.CompletionItemKind.Function,
      insertText: 'delete_post_meta(${1:$post_id}, ${2:$meta_key})',
      insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
      documentation: 'Deletes a post meta field for the given post ID.',
      detail: 'bool delete_post_meta(int $post_id, string $meta_key, mixed $meta_value = \'\')',
    },
    // Plugin/Theme functions
    {
      label: 'get_template_directory',
      kind: monaco.languages.CompletionItemKind.Function,
      insertText: 'get_template_directory()',
      documentation: 'Retrieves template directory path for current theme.',
      detail: 'string get_template_directory()',
    },
    {
      label: 'get_stylesheet_directory',
      kind: monaco.languages.CompletionItemKind.Function,
      insertText: 'get_stylesheet_directory()',
      documentation: 'Retrieves stylesheet directory path for current theme.',
      detail: 'string get_stylesheet_directory()',
    },
    {
      label: 'plugin_dir_path',
      kind: monaco.languages.CompletionItemKind.Function,
      insertText: 'plugin_dir_path(${1:__FILE__})',
      insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
      documentation: 'Gets the filesystem directory path for a plugin.',
      detail: 'string plugin_dir_path(string $file)',
    },
    // Output functions
    {
      label: 'echo',
      kind: monaco.languages.CompletionItemKind.Keyword,
      insertText: 'echo ${1:$var};',
      insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
      documentation: 'Output one or more strings.',
      detail: 'void echo(string $arg1, ...)',
    },
    {
      label: 'print_r',
      kind: monaco.languages.CompletionItemKind.Function,
      insertText: 'print_r(${1:$var});',
      insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
      documentation: 'Prints human-readable information about a variable.',
      detail: 'bool|string print_r(mixed $value, bool $return = false)',
    },
    {
      label: 'var_dump',
      kind: monaco.languages.CompletionItemKind.Function,
      insertText: 'var_dump(${1:$var});',
      insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
      documentation: 'Dumps information about a variable.',
      detail: 'void var_dump(mixed $value, ...)',
    },
  ];

  return wordPressFunctions;
};

// Hover information for WordPress functions
const getWordPressHoverInfo = (word) => {
  const hoverData = {
    get_posts: '**get_posts**(array $args = array()): array\n\nRetrieves an array of the latest posts, or posts matching given criteria.',
    wp_insert_post: '**wp_insert_post**(array $postarr, bool $wp_error = false): int|WP_Error\n\nInserts or updates a post.',
    get_bloginfo: '**get_bloginfo**(string $show = \'\'): string\n\nRetrieves information about the current site.',
    get_option: '**get_option**(string $option, mixed $default = false): mixed\n\nRetrieves an option value based on an option name.',
    update_option: '**update_option**(string $option, mixed $value, string|bool $autoload = null): bool\n\nUpdates the value of an option that was already added.',
    get_post_meta: '**get_post_meta**(int $post_id, string $key = \'\', bool $single = false): mixed\n\nRetrieves a post meta field for the given post ID.',
    update_post_meta: '**update_post_meta**(int $post_id, string $meta_key, mixed $meta_value, mixed $prev_value = \'\'): int|bool\n\nUpdates a post meta field based on the given post ID.',
    wpdb: '**$wpdb**: wpdb\n\nWordPress database object for running custom queries.',
    get_users: '**get_users**(array $args = array()): array\n\nRetrieves list of users matching criteria.',
    get_terms: '**get_terms**(array|string $args = array()): array|WP_Error\n\nRetrieves the terms in a given taxonomy or list of taxonomies.',
  };

  return hoverData[word] || null;
};

// Signature help for WordPress functions
const getWordPressSignature = (functionName) => {
  const signatures = {
    get_posts: {
      signatures: [
        {
          label: 'get_posts(array $args = array())',
          documentation: 'Retrieves an array of the latest posts, or posts matching given criteria.',
          parameters: [
            {
              label: '$args',
              documentation: 'Optional. Array of arguments for retrieving posts.',
            },
          ],
        },
      ],
      activeSignature: 0,
      activeParameter: 0,
    },
    wp_insert_post: {
      signatures: [
        {
          label: 'wp_insert_post(array $postarr, bool $wp_error = false)',
          documentation: 'Inserts or updates a post.',
          parameters: [
            {
              label: '$postarr',
              documentation: 'Array of elements that make up a post to insert.',
            },
            {
              label: '$wp_error',
              documentation: 'Optional. Whether to return a WP_Error on failure. Default false.',
            },
          ],
        },
      ],
      activeSignature: 0,
      activeParameter: 0,
    },
    get_option: {
      signatures: [
        {
          label: 'get_option(string $option, mixed $default = false)',
          documentation: 'Retrieves an option value based on an option name.',
          parameters: [
            {
              label: '$option',
              documentation: 'Name of the option to retrieve.',
            },
            {
              label: '$default',
              documentation: 'Optional. Default value to return if the option does not exist.',
            },
          ],
        },
      ],
      activeSignature: 0,
      activeParameter: 0,
    },
    update_option: {
      signatures: [
        {
          label: 'update_option(string $option, mixed $value, string|bool $autoload = null)',
          documentation: 'Updates the value of an option that was already added.',
          parameters: [
            {
              label: '$option',
              documentation: 'Name of the option to update.',
            },
            {
              label: '$value',
              documentation: 'Option value.',
            },
            {
              label: '$autoload',
              documentation: 'Optional. Whether to load the option when WordPress starts up.',
            },
          ],
        },
      ],
      activeSignature: 0,
      activeParameter: 0,
    },
    get_post_meta: {
      signatures: [
        {
          label: 'get_post_meta(int $post_id, string $key = \'\', bool $single = false)',
          documentation: 'Retrieves a post meta field for the given post ID.',
          parameters: [
            {
              label: '$post_id',
              documentation: 'Post ID.',
            },
            {
              label: '$key',
              documentation: 'Optional. The meta key to retrieve.',
            },
            {
              label: '$single',
              documentation: 'Optional. Whether to return a single value.',
            },
          ],
        },
      ],
      activeSignature: 0,
      activeParameter: 0,
    },
  };

  return signatures[functionName] || null;
};

export default MonacoEditor;
