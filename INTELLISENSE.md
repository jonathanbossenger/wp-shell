# IntelliSense Features

WP Shell now includes IntelliSense functionality powered by Monaco Editor (the same editor that powers Visual Studio Code).

## Features

### 1. Code Completion (List Members)
As you type, WP Shell displays a list of possible completions including:
- WordPress functions (get_posts, wp_insert_post, get_option, etc.)
- PHP keywords and built-in functions
- Variables and methods

**How to use:**
- Simply start typing and the autocomplete menu will appear
- Use arrow keys to navigate the suggestions
- Press `Tab` or `Enter` to accept a suggestion
- Press `Esc` to dismiss the menu

**Example:**
```php
get_p  // Start typing and "get_posts" will appear in suggestions
```

### 2. Parameter Info (Signature Help)
When typing a function call, WP Shell displays:
- Function signature showing parameter names and types
- Parameter descriptions
- Highlights the current parameter you're typing

**How to use:**
- Type a function name followed by `(`
- The parameter info popup will appear automatically
- As you type parameters and add commas, it highlights the next parameter

**Example:**
```php
get_option(  // Shows: get_option(string $option, mixed $default = false)
```

### 3. Quick Info (Hover Documentation)
Hovering over WordPress functions reveals:
- Function signature
- Return type
- Description of what the function does

**How to use:**
- Hover your mouse over any WordPress function name
- A popup will show detailed information about the function

**Supported functions include:**
- get_posts
- wp_insert_post
- get_bloginfo
- get_option, update_option, add_option, delete_option
- get_post_meta, update_post_meta, add_post_meta, delete_post_meta
- get_users, get_user_by, wp_insert_user
- get_terms, wp_insert_term
- And many more...

### 4. Member Lists (Object Notation)
When working with objects using the object notation (`$object->`), Monaco suggests available members (properties and methods).

**Example:**
```php
$post->  // Shows available WP_Post properties like post_title, post_content, etc.
```

## Keyboard Shortcuts

- **Execute Code**: `Ctrl/Cmd + Enter`
- **Autocomplete**: `Ctrl + Space` (force show suggestions)
- **Find**: `Ctrl/Cmd + F`
- **Replace**: `Ctrl/Cmd + H`
- **Format Document**: `Shift + Alt + F`
- **Comment/Uncomment**: `Ctrl/Cmd + /`

## WordPress Functions with IntelliSense Support

The following WordPress functions have full IntelliSense support with parameter hints and hover documentation:

### Post Functions
- get_posts
- get_post
- wp_insert_post
- wp_update_post
- wp_delete_post

### Site/Blog Functions
- get_bloginfo
- get_site_url
- home_url

### Option Functions
- get_option
- update_option
- add_option
- delete_option

### User Functions
- get_users
- get_user_by
- wp_insert_user

### Meta Functions
- get_post_meta
- update_post_meta
- add_post_meta
- delete_post_meta

### Taxonomy Functions
- get_terms
- wp_insert_term

### Plugin/Theme Functions
- get_template_directory
- get_stylesheet_directory
- plugin_dir_path

### Database
- $wpdb global variable

### Output Functions
- echo
- print_r
- var_dump

## Tips for Best Results

1. **Start with a few letters**: Type at least 2-3 letters before expecting suggestions
2. **Use descriptive names**: IntelliSense works better with clear function/variable names
3. **Enable quick suggestions**: Suggestions appear automatically as you type
4. **Check the documentation**: Hover over functions to see what parameters they expect
5. **Use snippets**: Many WordPress functions include snippets with placeholder parameters

## Technical Details

- **Editor**: Monaco Editor (same as VS Code)
- **Language**: PHP with WordPress-specific extensions
- **Theme**: VS Dark (matches the original WP Shell dark theme)
- **Features**: Autocomplete, Parameter Hints, Hover Documentation, Syntax Highlighting
