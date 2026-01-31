# IntelliSense Testing Guide

## Quick Start

This guide helps you test the new version-aware IntelliSense feature in WP Shell.

## Prerequisites

- PHP installed and in your system PATH (run `php -v` to verify)
- A local WordPress installation (any version 6.0 or higher)
- WP Shell built from source

## Build & Run

```bash
# Install dependencies (if not already done)
npm install

# Generate icons
npm run generate-all

# Build the renderer bundle
npm run build

# Start in development mode
npm run dev
```

## Testing Checklist

### 1. Version Detection

**Test:** Select a WordPress directory

**Expected Behavior:**
- Console should log: "PHP X.X.X detected"
- Console should log: "WordPress X.X.X detected"
- UI should show version info below directory path (e.g., "PHP 8.1 | WordPress 6.4")

**Success Criteria:**
- ✓ PHP version matches `php -v` output
- ✓ WordPress version matches your installation
- ✓ Versions display correctly in UI

### 2. Function Loading

**Test:** After selecting directory, check console logs

**Expected Behavior:**
- Console should show: "Loaded X PHP functions and Y WordPress functions"
- Should see: "IntelliSense updated: X PHP + Y WordPress = Z functions"
- Loading indicator should briefly show "Loading IntelliSense..."

**Success Criteria:**
- ✓ At least 100+ PHP functions loaded
- ✓ At least 100+ WordPress functions loaded
- ✓ Total functions: 200+ (depending on versions)
- ✓ Loading completes in <3 seconds

### 3. Autocomplete - WordPress Functions

**Test:** Type the following in the code editor

```php
get_
```

**Expected Behavior:**
- Autocomplete dropdown appears
- Shows WordPress functions starting with "get_"
- Examples: `get_posts`, `get_option`, `get_the_title`, `get_permalink`, etc.

**Success Criteria:**
- ✓ At least 20+ suggestions appear
- ✓ Suggestions appear instantly (<100ms)
- ✓ Hovering over a function shows documentation
- ✓ Selecting a function inserts it with parameter placeholders

### 4. Autocomplete - PHP Functions

**Test:** Type the following in the code editor

```php
array_
```

**Expected Behavior:**
- Autocomplete dropdown appears
- Shows PHP functions starting with "array_"
- Examples: `array_map`, `array_filter`, `array_merge`, `array_keys`, etc.

**Success Criteria:**
- ✓ At least 20+ suggestions appear
- ✓ Suggestions appear instantly (<100ms)
- ✓ Hovering shows documentation
- ✓ Selecting inserts with parameter placeholders

### 5. Function Snippets

**Test:** Select a function from autocomplete (e.g., `get_posts`)

**Expected Behavior:**
- Function is inserted: `get_posts($args)`
- Cursor is positioned inside the parentheses
- Parameter placeholder `$args` is highlighted
- You can tab to next parameter (if any)

**Success Criteria:**
- ✓ Function inserted correctly
- ✓ Parameters have placeholders
- ✓ Tab key navigation works
- ✓ Can immediately start typing parameter value

### 6. Caching

**Test:** Close and reopen the app, select the same WordPress directory

**Expected Behavior:**
- Version detection runs (quick, <1 second)
- Function loading shows: "Using cached PHP functions"
- Function loading shows: "Using cached WordPress functions"
- IntelliSense available almost instantly (<100ms)

**Success Criteria:**
- ✓ No delay for function loading
- ✓ Console shows "Using cached" messages
- ✓ Autocomplete works immediately
- ✓ Same function count as before

### 7. Error Handling - No PHP

**Test:** Temporarily rename PHP binary (e.g., `mv /usr/bin/php /usr/bin/php.bak`)

**Expected Behavior:**
- Console warning: "PHP not detected in PATH"
- UI shows: "⚠ Version detection unavailable - using basic completions"
- Fallback completions available (10 essential functions)
- Editor still works, code execution fails

**Success Criteria:**
- ✓ App doesn't crash
- ✓ Warning message shown
- ✓ Basic completions available
- ✓ Editor remains functional

**Cleanup:** Restore PHP binary after test

### 8. Error Handling - Invalid WordPress Directory

**Test:** Create an empty directory, try to select it

**Expected Behavior:**
- Error message: "Selected directory is not a WordPress installation"
- Directory not added to recent list
- Previous directory (if any) remains selected

**Success Criteria:**
- ✓ Clear error message
- ✓ App doesn't crash
- ✓ Can try selecting another directory

### 9. Multiple Directories

**Test:** Select different WordPress directories with different versions

**Expected Behavior:**
- Each directory gets its own cached function set
- Version info updates when switching directories
- Completions update to match new versions
- No mixing of data between directories

**Success Criteria:**
- ✓ Version info changes correctly
- ✓ Function count may differ between versions
- ✓ Cache entries created for each directory
- ✓ No cache collisions

### 10. Code Execution

**Test:** Write and execute code using autocomplete functions

```php
$posts = get_posts(array('numberposts' => 5));
foreach ($posts as $post) {
    echo $post->post_title . "\n";
}
```

**Expected Behavior:**
- Autocomplete helps write the code
- Code executes successfully
- Output shows post titles

**Success Criteria:**
- ✓ Autocomplete works while typing
- ✓ Code executes without errors
- ✓ Output appears in output panel
- ✓ IntelliSense doesn't interfere with execution

## Performance Benchmarks

Use browser DevTools console (in development mode) to measure:

### First Load (Uncached)
```javascript
// In main process console
console.time('version-detection');
// Select WordPress directory
// Check console for "detected" messages
console.timeEnd('version-detection');
// Expected: <2 seconds
```

### Cached Load
```javascript
// Restart app, select same directory
// Check console for "Using cached" messages
// Expected: <100ms
```

### Autocomplete Filtering
```javascript
// In renderer console
console.time('autocomplete');
// Type "get_" and wait for suggestions
console.timeEnd('autocomplete');
// Expected: <100ms
```

## Known Issues

### Issue: PHP not found even though installed

**Solution:**
- Check if PHP is in system PATH: `which php` or `where php`
- If using XAMPP/MAMP, PHP may not be in PATH
- Add PHP to PATH or create symlink

### Issue: Completions not appearing

**Solution:**
- Open DevTools console and check for errors
- Verify data files exist in `data/` directory
- Clear cache: In DevTools console run:
  ```javascript
  await window.electronAPI.clearCompletionCache('/path/to/wordpress')
  ```
- Reload directory

### Issue: Wrong functions appearing

**Solution:**
- Check detected versions in console logs
- Verify your PHP/WordPress versions match detected versions
- Clear cache and reload

### Issue: Slow autocomplete

**Solution:**
- Check total function count (should be <5000)
- Check console for performance warnings
- Clear browser cache in development mode
- Restart app

## Debugging

### Enable Verbose Logging

In `main/index.js`, add at the top:
```javascript
process.env.DEBUG = 'true';
```

### Check Cached Data

Open DevTools console in development mode:
```javascript
// Check electron-store contents
await window.electronAPI.getVersionInfo('/path/to/wordpress')

// Check cache keys
// (In main process console)
console.log(Object.keys(store.store).filter(k => k.includes('function')))
```

### Clear All Caches

```javascript
// In main process console
const allKeys = Object.keys(store.store);
allKeys.filter(k => k.includes('function')).forEach(k => store.delete(k));
console.log('Cache cleared');
```

## Reporting Issues

When reporting IntelliSense issues, include:

1. **Environment:**
   - OS and version (e.g., macOS 14.0)
   - PHP version (`php -v`)
   - WordPress version
   - WP Shell version

2. **Console Logs:**
   - Copy all console output from DevTools
   - Include both main process and renderer logs

3. **Steps to Reproduce:**
   - Exact steps to trigger the issue
   - Expected vs actual behavior

4. **Screenshots:**
   - Show version info in UI
   - Show autocomplete dropdown (if relevant)
   - Show error messages (if any)

## Success Indicators

If all tests pass, you should see:

- ✅ Version detection works (PHP + WordPress)
- ✅ 200+ functions available in autocomplete
- ✅ Instant completions after caching
- ✅ No errors in console
- ✅ Code execution works normally
- ✅ Graceful error handling when issues occur

## Next Steps

After successful testing:

1. Test on other operating systems (Windows, Linux)
2. Test with different PHP versions (7.4, 8.0, 8.1, 8.2, 8.3)
3. Test with different WordPress versions (6.0-6.5)
4. Test with very large WordPress installations
5. Gather user feedback on function coverage
6. Consider implementing plugin function detection (Phase 5)

## Questions?

See `INTELLISENSE.md` for technical details and troubleshooting.
