# PHP Function Metadata Files

This directory contains comprehensive JSON files with PHP function metadata for different PHP versions.

## Files

- **7.4.json** - PHP 7.4 functions (241 functions)
- **8.0.json** - PHP 8.0 functions (246 functions)
- **8.1.json** - PHP 8.1 functions (156 functions)
- **8.2.json** - PHP 8.2 functions (124 functions)
- **8.3.json** - PHP 8.3 functions (127 functions)

## Format

Each JSON file contains:
- `version`: PHP version string (e.g., "8.3.0")
- `functions`: Array of function objects

Each function object has:
- `label`: Function name
- `kind`: Always "Function"
- `documentation`: Brief description of what the function does
- `insertText`: Monaco Editor snippet with parameter placeholders (e.g., `${1:param}`)
- `detail`: Full function signature with types
- `source`: Extension name ("core", "json", "mbstring", "curl", "mysqli", etc.)

## Coverage

### Core Functions
- Array functions (array_*, arsort, asort, etc.)
- String functions (str_*, explode, implode, strlen, etc.)
- File I/O (fopen, fread, fwrite, file_get_contents, etc.)
- Type checking (is_*, gettype, isset, empty, etc.)
- Math functions (abs, ceil, floor, round, sqrt, etc.)
- Date/Time functions (date, time, strtotime, microtime, etc.)
- Variable handling (var_dump, var_export, print_r, serialize, etc.)

### Extension Functions
- **json**: json_encode, json_decode, json_last_error, json_validate (8.3+)
- **curl**: curl_init, curl_exec, curl_setopt, curl_close
- **mysqli**: mysqli_connect, mysqli_query, mysqli_fetch_assoc, mysqli_execute_query (8.2+)
- **mbstring**: mb_strlen, mb_substr, mb_strpos, mb_str_pad (8.3+)
- **hash**: hash, hash_equals, hash_file, hash_hmac
- **filter**: filter_var, filter_input
- **session**: session_start, session_destroy, session_id
- **pcre**: preg_match, preg_replace, preg_split
- **openssl**: openssl_cipher_key_length (8.2+)

## Version-Specific Features

### PHP 8.0 New Functions
- `str_contains()` - Check if string contains substring
- `str_starts_with()` - Check if string starts with substring
- `str_ends_with()` - Check if string ends with substring
- `fdiv()` - IEEE 754 compliant division
- `get_debug_type()` - Get debug-friendly type name
- `get_resource_id()` - Get resource identifier

### PHP 8.1 New Functions
- `array_is_list()` - Check if array is a list
- `enum_exists()` - Check if enum is defined
- `fsync()` - Synchronize file changes
- `fdatasync()` - Synchronize file data

### PHP 8.2 New Functions
- `ini_parse_quantity()` - Parse ini size notation
- `mysqli_execute_query()` - Simplified query execution
- `openssl_cipher_key_length()` - Get cipher key length

### PHP 8.3 New Functions
- `json_validate()` - Validate JSON without decoding
- `mb_str_pad()` - Multibyte string padding
- `stream_context_set_options()` - Set stream context options

## Usage in Monaco Editor

These files are designed to be loaded by Monaco Editor for IntelliSense:

```javascript
// Load PHP function metadata
const phpFunctions = await fetch(`data/php/${phpVersion}.json`).then(r => r.json());

// Register as completion items
monaco.languages.registerCompletionItemProvider('php', {
  provideCompletionItems: () => {
    return {
      suggestions: phpFunctions.functions.map(fn => ({
        label: fn.label,
        kind: monaco.languages.CompletionItemKind[fn.kind],
        documentation: fn.documentation,
        insertText: fn.insertText,
        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
        detail: fn.detail
      }))
    };
  }
});
```

## Maintenance

To update these files:
1. Check PHP documentation for new functions in each version
2. Add new functions with proper metadata format
3. Ensure `insertText` uses Monaco snippet syntax with numbered placeholders
4. Categorize functions by source (core vs extension)
5. Update function counts in this README
