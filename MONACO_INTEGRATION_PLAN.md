# Monaco Editor Integration Plan for WP Shell

## Overview

Replace the current textarea code editor with Monaco Editor to add IntelliSense support, syntax highlighting, and a professional code editing experience for WordPress PHP code.

## Approach

Use `@monaco-editor/react` wrapper for easier React integration and automatic web worker configuration. This approach minimizes webpack complexity while providing full IntelliSense capabilities.

**Key Benefits:**
- Built-in syntax highlighting for PHP
- WordPress function autocomplete (starting with 14 common functions)
- Preserves existing keyboard shortcuts (Tab for indent, Ctrl/Cmd+Enter to execute)
- Maintains dark theme consistency (#1e1e1e)
- Modular design allows easy rollback if needed

## Implementation Steps

### 1. Install Dependencies

Add to package.json:
```json
"monaco-editor": "^0.52.0",
"@monaco-editor/react": "^4.6.0",
"monaco-webpack-plugin": "^7.1.0"
```

Run `npm install` to install dependencies.

### 2. Configure Webpack

**File:** `webpack.config.js`

- Add `monaco-webpack-plugin` import and instantiate plugin
- Configure plugin to include only PHP language support (reduces bundle from ~8MB to ~2MB)
- Add TTF font loader for Monaco's custom fonts: `{ test: /\.ttf$/, type: 'asset/resource' }`
- Set `publicPath: './'` in output config for correct worker loading
- Enable Monaco features: suggest, parameterHints, hover, bracketMatching, etc.

### 3. Create CodeEditor Component

**File:** `renderer/src/components/CodeEditor.js` (new file)

Create a wrapper component that:
- Imports `@monaco-editor/react` Editor component
- Configures Monaco with PHP language support
- Registers WordPress function completions (get_posts, get_post, wp_insert_post, get_option, update_option, get_user_by, wp_get_current_user, get_term, get_terms, wp_create_user, get_permalink, get_post_meta, update_post_meta, WP_Query)
- Adds Ctrl/Cmd+Enter keyboard shortcut using `editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, onExecute)`
- Sets editor options:
  - `theme: "vs-dark"` (matches #1e1e1e)
  - `minimap: { enabled: false }`
  - `fontSize: 14`
  - `tabSize: 4`
  - `insertSpaces: true`
  - IntelliSense settings enabled

**Props:**
- `value`: Current code string
- `onChange`: Callback when code changes (receives new value directly, not event object)
- `onExecute`: Callback for Ctrl/Cmd+Enter execution

### 4. Integrate into App.js

**File:** `renderer/src/App.js`

Changes:
- Import CodeEditor: `import CodeEditor from './components/CodeEditor';`
- Remove `textareaRef` useRef (line 11)
- Remove `handleKeyDown` function (lines 75-95)
- Replace textarea (lines 137-146) with:
  ```jsx
  <CodeEditor
    value={code}
    onChange={(newValue) => setCode(newValue || '')}
    onExecute={handleExecuteCode}
  />
  ```

### 5. Update Styling

**File:** `renderer/src/styles.css`

Replace textarea styles (lines 20-42) with Monaco-specific styles:
- Keep `.code-editor` wrapper with #1e1e1e background and border-radius
- Add `position: relative` for proper Monaco positioning
- Customize scrollbar colors to match VS Code dark theme
- Remove textarea-specific CSS (no longer needed)

### 6. Testing

**Manual Testing Checklist:**

Basic Functionality:
- [ ] Editor loads with initial code
- [ ] Typing updates state
- [ ] Execute Code button works
- [ ] Ctrl/Cmd+Enter executes code
- [ ] Clear Output works

Monaco Features:
- [ ] PHP syntax highlighting displays
- [ ] Tab key indents (4 spaces)
- [ ] Auto-closing brackets work
- [ ] IntelliSense appears when typing WordPress functions
- [ ] Selecting suggestions inserts function with parameters
- [ ] Line numbers display
- [ ] Find/Replace (Ctrl/Cmd+F) works

Theme & Layout:
- [ ] Dark background (#1e1e1e) maintained
- [ ] Side-by-side layout preserved
- [ ] Editor resizes with window
- [ ] Scrolling works

WordPress Integration:
- [ ] Code executes in WordPress context
- [ ] WordPress functions work correctly
- [ ] Errors display in output

**Build Testing:**
```bash
# Development
npm run dev

# Production build
npm run build

# Package
npm run make
```

Verify:
- No webpack errors
- Workers load correctly
- Bundle size ~2.5MB for editor + ~350KB for workers
- Packaged app works on target platforms

## Critical Files to Modify

1. **webpack.config.js** - Add MonacoWebpackPlugin, configure workers
2. **package.json** - Add dependencies
3. **renderer/src/components/CodeEditor.js** - New Monaco wrapper component
4. **renderer/src/App.js** - Replace textarea with CodeEditor
5. **renderer/src/styles.css** - Update for Monaco styling

## Verification

After implementation:
1. Run `npm run dev` and verify editor loads with syntax highlighting
2. Type `get_p` and verify IntelliSense suggestions appear
3. Execute sample WordPress code:
   ```php
   $posts = get_posts(array('numberposts' => 5));
   foreach ($posts as $post) {
       echo $post->post_title . "\n";
   }
   ```
4. Verify Ctrl/Cmd+Enter executes code
5. Build production package with `npm run make` and test packaged app

## Rollback Plan

If issues arise:
1. Revert package.json changes
2. Revert webpack.config.js
3. Restore textarea in App.js
4. Restore textarea styles in styles.css
5. Delete CodeEditor.js
6. Run `npm run build`

All changes are isolated and non-breaking.

## Future Enhancements

- Expand WordPress function library (currently 14 functions, can grow to hundreds)
- Add code snippets for common WordPress patterns
- Theme customization options
- Font size controls
- Code history/saved snippets
- PHP Language Server integration for advanced IntelliSense

## Expected Outcomes

- Professional code editing experience with syntax highlighting
- WordPress function autocomplete improves productivity
- All existing functionality preserved
- ~2.4MB bundle size increase (acceptable for desktop app)
- No performance degradation
