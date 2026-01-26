# WP Shell - Quick Start Guide

## What is WP Shell?

WP Shell is a desktop application that allows you to execute WordPress PHP code directly from your computer without needing to create PHP files or use the command line. It's perfect for:
- Testing WordPress functions
- Debugging WordPress code
- Running one-off scripts
- Exploring the WordPress API
- Database queries using WordPress functions

## Installation

### Prerequisites
- **PHP**: PHP must be installed and available in your system PATH
- **WordPress**: A local WordPress installation

### From Source
1. Clone the repository:
   ```bash
   git clone https://github.com/jonathanbossenger/wp-shell.git
   cd wp-shell
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Run the application:
   ```bash
   npm run dev
   ```

### Building for Distribution
```bash
npm run build
npm run make
```

This will create distributable packages in the `out/` directory.

## Usage

### Step 1: Connect to WordPress
1. Launch WP Shell
2. Click "Select Directory"
3. Navigate to your WordPress installation root directory (where `wp-config.php` is located)
4. Click "Select"

The app will verify it's a valid WordPress directory and remember it for future use.

### Step 2: Write Your Code
In the code editor, write any PHP code you want to execute. You don't need to include `<?php` tags - they're automatically added. The WordPress environment is automatically loaded, so all WordPress functions are available.

**Example - Get Recent Posts:**
```php
$posts = get_posts(array('numberposts' => 5));
foreach ($posts as $post) {
    echo $post->post_title . "\n";
}
```

**Example - Site Information:**
```php
echo "Site URL: " . get_site_url() . "\n";
echo "Site Name: " . get_bloginfo('name') . "\n";
echo "WordPress Version: " . get_bloginfo('version') . "\n";
```

**Example - Database Query:**
```php
global $wpdb;
$results = $wpdb->get_results("SELECT post_title, post_date FROM {$wpdb->posts} WHERE post_status = 'publish' LIMIT 5");
foreach ($results as $post) {
    echo $post->post_title . " - " . $post->post_date . "\n";
}
```

**Example - Create a Post:**
```php
$post_data = array(
    'post_title'   => 'Test Post from WP Shell',
    'post_content' => 'This post was created using WP Shell!',
    'post_status'  => 'publish',
    'post_author'  => 1
);
$post_id = wp_insert_post($post_data);
echo "Created post with ID: " . $post_id . "\n";
```

### Step 3: Execute
- Click the "Execute Code" button, or
- Press **Ctrl+Enter** (Windows/Linux) or **Cmd+Enter** (Mac)

The output will appear in the Output panel below.

## Tips & Tricks

### Keyboard Shortcuts
- **Ctrl/Cmd + Enter**: Execute the code
- **Tab**: Insert 4 spaces (for indentation)

### Error Handling
If your code has errors, they'll be displayed in the output panel with:
- Error message
- File name and line number
- Stack trace

### Output Formatting
- Use `echo` or `print` to display output
- Use `\n` for line breaks
- Use `print_r()` or `var_dump()` for debugging arrays and objects

### Timeouts
Code execution has a 30-second timeout to prevent hanging. If your code takes longer, it will be terminated.

### Recent Directories
The app remembers your last 5 WordPress directories for quick access. They appear on the initial screen for one-click connection.

## Troubleshooting

### "Selected directory is not a WordPress installation"
- Make sure you've selected the root WordPress directory (containing `wp-config.php`)
- Check that `wp-config.php` exists and is readable

### "Error executing code"
- Check the output panel for the specific error message
- Make sure your PHP syntax is correct
- Verify that PHP is installed and in your system PATH

### No Output Displayed
- Make sure you're using `echo`, `print`, or similar output functions
- Check for PHP errors in the output panel
- Try a simple test like `echo "Hello World";`

## Safety Notes

⚠️ **Important**: WP Shell executes code directly on your WordPress installation. Always:
- Use it on development/local sites only
- Back up your database before running destructive operations
- Test queries carefully before running them
- Be cautious with `DELETE`, `UPDATE`, or `DROP` operations

## Support

For issues, questions, or contributions, visit:
https://github.com/jonathanbossenger/wp-shell

## Related Projects

- **WP Debug**: https://github.com/jonathanbossenger/wp-debug - Monitor WordPress debug logs in real-time
