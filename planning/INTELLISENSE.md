# IntelliSense Technical Documentation

## Overview

WP Shell provides comprehensive, version-aware IntelliSense for PHP and WordPress functions. This document explains the architecture, data structures, and implementation details.

## Architecture

### Components

1. **Version Detection** (`main/index.js`)
   - Detects PHP version via `php -v` command
   - Detects WordPress version from `wp-includes/version.php`
   - Caches version info in `electron-store`

2. **Function Loader** (`main/function-loader.js`)
   - Loads function metadata from bundled JSON files
   - Implements caching strategy with `electron-store`
   - Provides fallback completions when versions unavailable

3. **Bundled Data** (`data/` directory)
   - PHP function metadata for versions 7.4-8.3
   - WordPress function metadata for versions 6.0-6.5
   - Total size: ~684KB (uncompressed)

4. **Monaco Integration** (`renderer/src/components/CodeEditor.js`)
   - Dynamic completion provider
   - Prefix-based filtering
   - Performance optimization (100 suggestion limit)

### Data Flow

```
1. User selects WordPress directory
   ↓
2. App.js triggers version detection
   ↓
3. main/index.js detects PHP + WordPress versions
   ↓
4. function-loader.js loads/caches function data
   ↓
5. IPC returns completions to renderer
   ↓
6. CodeEditor.js registers Monaco completion provider
   ↓
7. User types → Monaco filters suggestions → Display
```

## Data Structure

### Function Metadata Format

Each function is represented as a JSON object:

```json
{
  "label": "get_posts",
  "kind": "Function",
  "documentation": "Retrieve a list of posts based on specified parameters",
  "insertText": "get_posts(${1:args})",
  "detail": "array get_posts(array $args = [])",
  "source": "core"
}
```

**Fields:**
- `label`: Function name (used for autocomplete matching)
- `kind`: Type ("Function", "Class", etc.) - determines icon in Monaco
- `documentation`: Brief description shown in hover tooltip
- `insertText`: Snippet with parameter placeholders (`${1:param}` format)
- `detail`: Full function signature with return type
- `source`: Origin ("core", extension name, or "plugin")

### JSON File Structure

Each version file contains:

```json
{
  "version": "8.3.0",
  "functions": [
    { ... },
    { ... }
  ]
}
```

**PHP Files:**
- `data/php/7.4.json` - PHP 7.4 functions
- `data/php/8.0.json` - PHP 8.0 functions
- `data/php/8.1.json` - PHP 8.1 functions
- `data/php/8.2.json` - PHP 8.2 functions
- `data/php/8.3.json` - PHP 8.3 functions

**WordPress Files:**
- `data/wordpress/6.0.json` - WordPress 6.0 functions
- `data/wordpress/6.1.json` - WordPress 6.1 functions
- `data/wordpress/6.2.json` - WordPress 6.2 functions
- `data/wordpress/6.3.json` - WordPress 6.3 functions
- `data/wordpress/6.4.json` - WordPress 6.4 functions
- `data/wordpress/6.5.json` - WordPress 6.5 functions

## Caching Strategy

### Cache Keys

```javascript
// PHP functions
"phpVersion" -> "8.1.5"
"php-functions:8.1.5" -> [array of functions]

// WordPress functions
"wpVersion:/path/to/wordpress" -> "6.4.2"
"wp-functions:/path/to/wordpress:6.4.2" -> [array of functions]
```

### Cache Lifetime

- **Duration**: 30 days (no explicit expiration, cleared manually if needed)
- **Invalidation**: Version change or manual clear via `clear-completion-cache` IPC

### Cache Performance

| Operation | Time | Notes |
|-----------|------|-------|
| First load | <3s | Reads JSON files from disk |
| Cached load | <100ms | Reads from electron-store |
| Version detection | <1s | PHP version + WordPress version |
| Total initial load | <5s | Version detect + function load |

## Version Matching

### PHP Version Matching

1. Extract major.minor from detected version (e.g., "8.1.5" → "8.1")
2. Look for exact match in `data/php/{version}.json`
3. If not found, fallback to earlier versions: 8.3 → 8.2 → 8.1 → 8.0 → 7.4
4. If no matches, return empty array (fallback completions used)

### WordPress Version Matching

1. Extract major.minor from detected version (e.g., "6.4.2" → "6.4")
2. Look for exact match in `data/wordpress/{version}.json`
3. If not found, fallback to earlier versions: 6.5 → 6.4 → 6.3 → 6.2 → 6.1 → 6.0
4. If no matches, return empty array (fallback completions used)

## Monaco Integration

### Completion Provider

The completion provider (`CodeEditor.js`) implements prefix-based filtering:

```javascript
provideCompletionItems: (model, position) => {
  // 1. Extract typed prefix
  const prefix = getTypedPrefix(model, position);

  // 2. Merge PHP + WordPress functions
  const allCompletions = [...phpFunctions, ...wordpressFunctions];

  // 3. Filter by prefix
  const suggestions = allCompletions.filter(item =>
    item.label.toLowerCase().startsWith(prefix.toLowerCase())
  );

  // 4. Limit to 100 for performance
  return suggestions.slice(0, 100);
}
```

### Performance Optimizations

1. **Prefix Filtering**: Only show functions starting with typed prefix
2. **Result Limiting**: Cap at 100 suggestions to avoid UI lag
3. **Lazy Loading**: Load completions in background, don't block UI
4. **Single Provider**: One completion provider for all functions (vs. multiple)

## Error Handling

### Graceful Degradation

| Scenario | Behavior | Fallback |
|----------|----------|----------|
| PHP not found | Log warning, use fallback completions | 4 basic PHP functions |
| WordPress version unknown | Log warning, use latest version | WordPress 6.5 data |
| Data file missing | Try earlier versions | Empty array |
| JSON parse error | Log error, return empty array | Fallback completions |
| IPC timeout | Log error, use empty completions | Basic editor (no IntelliSense) |

### Fallback Completions

When version detection fails completely, the system provides 10 essential functions:

**PHP (4 functions):**
- `array_map`
- `array_filter`
- `json_encode`
- `var_dump`

**WordPress (6 functions):**
- `get_posts`
- `get_option`
- `get_the_title`
- `wp_insert_post`
- `add_action`
- `add_filter`

## Troubleshooting

### No Completions Appearing

1. **Check console logs**: Look for version detection messages
2. **Verify PHP in PATH**: Run `php -v` in terminal
3. **Check WordPress directory**: Ensure `wp-config.php` exists
4. **Clear cache**: Use `window.electronAPI.clearCompletionCache(directory)` in DevTools
5. **Check data files**: Ensure `data/` directory exists with JSON files

### Wrong Version Detected

1. **PHP version mismatch**: Check `php -v` output, ensure it's the correct PHP binary
2. **WordPress version mismatch**: Check `wp-includes/version.php` in selected directory
3. **Cache staleness**: Clear cache and reload directory

### Performance Issues

1. **Slow first load**: Normal (reads JSON files), subsequent loads should be fast
2. **Slow filtering**: Check completion count (should be <5000 total)
3. **High memory usage**: Check cache size in electron-store, clear if >10MB

## Updating Function Data

### Adding New PHP Versions

1. Create `data/php/{version}.json` (e.g., `8.4.json`)
2. Follow existing JSON structure
3. Include version-specific functions
4. Update fallback version list in `function-loader.js`
5. Test with new PHP version

### Adding New WordPress Versions

1. Create `data/wordpress/{version}.json` (e.g., `6.6.json`)
2. Follow existing JSON structure
3. Include new functions introduced in this version
4. Update fallback version list in `function-loader.js`
5. Test with new WordPress version

### Regenerating Function Data

To regenerate function data from scratch:

1. **PHP functions**: Use `jetbrains/phpstorm-stubs` or parse php.net documentation
2. **WordPress functions**: Parse WordPress core source or use developer.wordpress.org API
3. Ensure JSON structure matches existing format
4. Validate JSON syntax before committing
5. Test IntelliSense with new data

## API Reference

### IPC Methods

**`get-version-info`**
```javascript
// Request
window.electronAPI.getVersionInfo(wpDirectory)

// Response
{ php: "8.1.5", wordpress: "6.4.2" }
```

**`get-completions`**
```javascript
// Request
window.electronAPI.getCompletions(wpDirectory)

// Response
{
  php: [...], // Array of PHP function objects
  wordpress: [...], // Array of WordPress function objects
  versions: { php: "8.1.5", wordpress: "6.4.2" }
}
```

**`clear-completion-cache`**
```javascript
// Request
window.electronAPI.clearCompletionCache(wpDirectory)

// Response
{ success: true }
```

### Function Loader API

```javascript
const {
    loadPhpFunctions,
    loadWordPressFunctions,
    discoverPhpFunctions,
    discoverWordPressFunctions,
    getAllCompletions,
    clearCompletionCache,
    getFallbackCompletions
} = require('./function-loader');

// Load PHP functions for specific version
const phpFunctions = await loadPhpFunctions('8.1.5');

// Load WordPress functions for specific version
const wpFunctions = await loadWordPressFunctions('6.4.2');

// Discover with caching
const phpFunctions = await discoverPhpFunctions('8.1.5', store);

// Get all completions
const completions = await getAllCompletions(
    '/path/to/wordpress',
    {php: '8.1.5', wordpress: '6.4.2'},
    store
);
```

## Performance Benchmarks

### Target Metrics

| Metric | Target | Actual |
|--------|--------|--------|
| PHP version detection | <1s | ~500ms |
| WordPress version detection | <500ms | ~200ms |
| Function load (uncached) | <3s | ~2s |
| Function load (cached) | <100ms | ~50ms |
| Completion filtering | <100ms | ~30ms |
| Memory usage | <50MB | ~35MB |
| Bundle size increase | <3MB | ~684KB |

### Load Time Breakdown

```
Total initial load time: ~5s
├── PHP version detection: 500ms
├── WordPress version detection: 200ms
├── Load PHP functions: 1000ms
├── Load WordPress functions: 1500ms
├── Cache storage: 100ms
└── Monaco registration: 100ms
```

## Future Enhancements

### Planned Features

1. **Plugin & Theme Parsing** (Phase 5 - not yet implemented)
   - Parse active plugins for custom functions
   - Extract functions from theme files
   - Add to completions dynamically

2. **PHP Reflection Integration**
   - Use PHP's Reflection API to discover installed extensions
   - Augment bundled data with runtime-available functions

3. **Function Signatures**
   - Show parameter types and descriptions
   - Display return value information
   - Link to official documentation

4. **Smart Caching**
   - Automatic cache expiration based on age
   - Cache size monitoring and cleanup
   - Differential updates for version changes

5. **Customization**
   - User-defined function snippets
   - Custom completion priorities
   - Function favorites/bookmarks

## Contributing

To contribute to the IntelliSense system:

1. **Adding Functions**: Edit JSON files in `data/` directory
2. **Improving Detection**: Modify `main/index.js` version detection
3. **Optimizing Performance**: Enhance `main/function-loader.js` caching
4. **UI Improvements**: Update `renderer/src/components/CodeEditor.js`

See `CONTRIBUTING.md` for general contribution guidelines.
