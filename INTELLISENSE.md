# IntelliSense Features

WP Shell now includes comprehensive IntelliSense functionality powered by Monaco Editor (the same editor that powers Visual Studio Code). The IntelliSense system **dynamically discovers all WordPress and PHP functions** available in your installation.

## How It Works

When you select a WordPress directory, WP Shell automatically:
1. Detects the PHP version running on your system
2. Detects the WordPress version in the selected installation
3. Extracts ALL WordPress function definitions using PHP reflection
4. Extracts ALL commonly used PHP built-in functions for that PHP version
5. Loads these definitions into the Monaco Editor for IntelliSense support

This means you get **complete, version-specific IntelliSense** for your exact WordPress and PHP setup!

## Features

### 1. Code Completion (List Members)
As you type, WP Shell displays a list of possible completions including:
- **ALL WordPress functions** from your installation (typically 2000+ functions)
- **ALL common PHP functions** for your PHP version
- Function signatures with parameter types
- Brief documentation from function doc comments

**How to use:**
- Simply start typing and the autocomplete menu will appear
- Use arrow keys to navigate the suggestions
- Press `Tab` or `Enter` to accept a suggestion
- Press `Esc` to dismiss the menu

**Example:**
```php
get_p  // Shows ALL WordPress functions starting with "get_p"
       // Including: get_posts, get_post, get_post_meta, get_post_type, etc.
```

### 2. Parameter Info (Signature Help)
When typing a function call, WP Shell displays:
- Complete function signature with all parameters
- Parameter types (when available)
- Default values for optional parameters
- Parameter descriptions

**How to use:**
- Type a function name followed by `(`
- The parameter info popup will appear automatically
- As you type parameters and add commas, it highlights the next parameter

**Example:**
```php
get_option(  // Shows the actual signature from your WordPress version
             // e.g., get_option(string $option, mixed $default = false)
```

### 3. Quick Info (Hover Documentation)
Hovering over WordPress functions reveals:
- Function signature with parameter types and defaults
- Documentation from the function's doc comment
- File location where the function is defined (for WordPress functions)

**How to use:**
- Hover your mouse over any WordPress or PHP function name
- A popup will show detailed information about the function

### 4. Member Lists (Object Notation)
When working with objects using the object notation (`$object->`), Monaco suggests available members (properties and methods).

**Example:**
```php
$post->  // Shows available WP_Post properties like post_title, post_content, etc.
```

## Version Detection

The IntelliSense system automatically adapts to your environment:

- **PHP Version**: Detects your PHP version and provides functions available in that version
- **WordPress Version**: Detects your WordPress version and provides all functions from that version

This ensures you only see functions that are actually available in your environment!

## Supported Functions

Unlike static IntelliSense that only supports a predefined list, WP Shell's dynamic IntelliSense supports:

### WordPress Functions
- **ALL functions** defined by WordPress core (typically 2000+ functions)
- **ALL functions** from active plugins
- **ALL functions** from active themes
- Complete with their actual signatures, parameter types, and documentation

### PHP Functions
- **ALL commonly used PHP built-in functions**, including:
  - String functions (str_*, trim, sprintf, etc.)
  - Array functions (array_*, count, in_array, etc.)
  - File functions (file_*, fopen, fclose, etc.)
  - Type checking functions (is_*, isset, empty, etc.)
  - Output functions (echo, print, print_r, var_dump, etc.)
  - JSON functions (json_*, serialize, unserialize, etc.)
  - Date/time functions (date, time, strtotime, etc.)
  - Regular expression functions (preg_*, etc.)
  - And many more!

## Keyboard Shortcuts

- **Execute Code**: `Ctrl/Cmd + Enter`
- **Autocomplete**: `Ctrl + Space` (force show suggestions)
- **Find**: `Ctrl/Cmd + F`
- **Replace**: `Ctrl/Cmd + H`
- **Format Document**: `Shift + Alt + F`
- **Comment/Uncomment**: `Ctrl/Cmd + /`

## Performance

The function definitions are loaded once when you select a WordPress directory and cached for the session. This means:
- First load may take a few seconds (extracting 2000+ function definitions)
- Subsequent autocomplete is instant
- Switching WordPress directories will reload definitions for that installation

## Tips for Best Results

1. **Wait for initial load**: The first time you select a directory, wait for "Loading IntelliSense..." to complete
2. **Start with a few letters**: Type at least 2-3 letters before expecting suggestions
3. **Use descriptive names**: IntelliSense works better with clear function/variable names
4. **Check the documentation**: Hover over functions to see what parameters they expect
5. **Version-specific**: The functions you see are specific to your WordPress and PHP versions

## Technical Details

- **Editor**: Monaco Editor (same as VS Code)
- **Language**: PHP with dynamic WordPress extensions
- **Theme**: VS Dark (matches the original WP Shell dark theme)
- **Discovery Method**: PHP Reflection API for runtime function detection
- **Features**: Autocomplete, Parameter Hints, Hover Documentation, Syntax Highlighting

## Differences from Previous Version

The new dynamic IntelliSense is a significant upgrade:

| Feature | Previous (Static) | New (Dynamic) |
|---------|------------------|---------------|
| WordPress Functions | 31 hardcoded functions | ALL functions (2000+) |
| PHP Functions | Limited set | ALL common PHP functions |
| Version Support | Generic | Specific to your versions |
| Updates | Manual code update | Automatic from your installation |
| Plugin Functions | Not supported | Fully supported |
| Theme Functions | Not supported | Fully supported |
| Documentation | Hardcoded descriptions | From actual doc comments |
| Accuracy | Generic signatures | Exact signatures |

## Troubleshooting

**Q: IntelliSense isn't working**
A: Make sure you've selected a valid WordPress directory. The editor will show "Loading IntelliSense..." while loading.

**Q: Some functions don't show up**
A: Only functions that can be reflected are included. Some dynamically generated functions may not appear.

**Q: Loading takes a long time**
A: The first load extracts all function definitions which can take a few seconds. This is normal for large WordPress installations with many plugins.

**Q: I switched directories but still see old functions**
A: The definitions are reloaded automatically when you select a new directory. If you see issues, try changing the directory again.
