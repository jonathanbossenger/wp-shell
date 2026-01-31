# WordPress Function Metadata

This directory contains comprehensive JSON files with WordPress function metadata for versions 6.0 through 6.5.

## Files

- **6.0.json** - WordPress 6.0 functions (259 functions)
- **6.1.json** - WordPress 6.1 functions (198 functions) + Interactivity API
- **6.2.json** - WordPress 6.2 functions (203 functions) + Theme.json enhancements
- **6.3.json** - WordPress 6.3 functions (207 functions) + Layout definitions
- **6.4.json** - WordPress 6.4 functions (215 functions) + Script modules
- **6.5.json** - WordPress 6.5 functions (225 functions) + Block patterns & Font library

## Structure

Each JSON file follows this structure:

```json
{
  "version": "6.x.0",
  "functions": [
    {
      "label": "function_name",
      "kind": "Function",
      "documentation": "Brief description",
      "insertText": "function_name(${1:param})",
      "detail": "return_type function_name(param_type $param)",
      "source": "core"
    }
  ]
}
```

## Coverage

Each file includes the most commonly used WordPress functions organized by category:

### Core Categories (All Versions)
- **Post/Page Functions**: get_posts, wp_insert_post, get_the_title, etc.
- **Database/Options**: get_option, update_option, get_post_meta, etc.
- **User Functions**: wp_get_current_user, current_user_can, wp_create_user, etc.
- **Taxonomy/Term Functions**: get_terms, wp_get_post_terms, get_categories, etc.
- **Template Functions**: get_template_part, get_header, body_class, etc.
- **URL/Link Functions**: home_url, site_url, get_permalink, esc_url, etc.
- **Hooks/Filters**: add_action, add_filter, do_action, apply_filters, etc.
- **Enqueue Functions**: wp_enqueue_script, wp_enqueue_style, wp_localize_script, etc.
- **Utility Functions**: esc_html, sanitize_text_field, wp_mail, wp_json_encode, etc.
- **Media/Attachment Functions**: wp_get_attachment_url, wp_insert_attachment, etc.
- **Block Editor Functions**: register_block_type, render_block, parse_blocks, etc.

### Version-Specific Features

**WordPress 6.1**
- `wp_interactivity_state()` - Interactivity API state management
- `wp_interactivity_config()` - Interactivity API configuration

**WordPress 6.2**
- `wp_get_block_name_from_theme_json_path()` - Theme.json block name extraction
- `wp_theme_has_theme_json()` - Check for theme.json file
- `wp_get_global_settings()` - Global theme settings
- `wp_get_global_styles()` - Global theme styles
- `wp_get_block_css_selector()` - Block CSS selector generation

**WordPress 6.3**
- `wp_get_layout_definitions()` - Layout definitions from theme.json
- `wp_render_layout_support_flag()` - Layout support rendering
- `wp_get_typography_font_size_value()` - Typography font size values
- `wp_get_typography_value_and_unit()` - Parse typography values

**WordPress 6.4**
- `wp_register_script_module()` - Register script modules
- `wp_enqueue_script_module()` - Enqueue script modules
- `wp_dequeue_script_module()` - Dequeue script modules
- `wp_deregister_script_module()` - Deregister script modules
- `wp_get_script_tag()` - Generate script tags
- `wp_print_script_tag()` - Print script tags
- `wp_get_inline_script_tag()` - Generate inline script tags
- `wp_print_inline_script_tag()` - Print inline script tags

**WordPress 6.5**
- `register_block_pattern()` - Register block patterns
- `unregister_block_pattern()` - Unregister block patterns
- `register_block_pattern_category()` - Register pattern categories
- `unregister_block_pattern_category()` - Unregister pattern categories
- `wp_get_font_dir()` - Get font directory paths
- `wp_register_font_collection()` - Register font collections
- `wp_unregister_font_collection()` - Unregister font collections
- `wp_get_font_collections()` - Get all font collections
- `wp_html_split()` - Split HTML elements
- `wp_get_word_count_type()` - Get word count type for locale

## Usage

These files are designed for Monaco Editor IntelliSense integration. Each function includes:

- **label**: Function name for autocomplete
- **kind**: Always "Function" for filtering
- **documentation**: Brief description shown in hover tooltip
- **insertText**: Snippet with parameter placeholders for autocomplete insertion
- **detail**: Full function signature with types
- **source**: Always "core" to distinguish from plugin/theme functions

## Monaco Snippet Format

The `insertText` field uses Monaco Editor's snippet syntax:
- `${1:param}` - First tab stop with placeholder name "param"
- `${2:param2}` - Second tab stop with placeholder name "param2"
- Multiple parameters create tab stops for easy navigation

Example:
```javascript
"insertText": "wp_insert_post(${1:postarr}, ${2:wp_error}, ${3:fire_after_hooks})"
```

When triggered, this allows the user to tab through each parameter.

## Validation

All JSON files have been validated for:
- Valid JSON syntax
- Proper structure and formatting
- Correct version numbers
- Version-specific function inclusions

## Notes

- Function counts vary by version due to new additions and documentation improvements
- All functions include proper Monaco Editor snippet formatting
- Each version builds upon the previous with new features
- Core WordPress functions are included across all versions
- Version-specific functions are only added to their respective versions and later

## Related Files

This metadata is used by the Monaco Editor integration in WP Shell for providing:
- Function autocomplete
- Parameter hints
- Hover documentation
- Signature help
