# WP Shell

A companion app to [WP Debug](https://github.com/jonathanbossenger/wp-debug) that lets you connect to a local WordPress installation and execute any WordPress PHP code directly from a desktop application.

## Features

- **Connect to WordPress**: Select your local WordPress installation directory
- **Execute PHP Code**: Run any WordPress PHP code in the WordPress context
- **View Output**: See the results of your code execution in real-time
- **Code Editor**: Monaco Editor with IntelliSense support
  - **Code Completion**: WordPress and PHP function autocomplete
  - **Parameter Info**: See function parameters as you type
  - **Quick Info**: Hover over functions for documentation
  - **Syntax Highlighting**: Full PHP syntax support
- **Recent Directories**: Quick access to recently used WordPress installations
- **Keyboard Shortcuts**: Ctrl/Cmd + Enter to execute code

## Installation

### From Source

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run in development mode:
   ```bash
   npm run dev
   ```

### Building

To build the application:

```bash
npm run build
npm run make
```

## Usage

1. Launch the application
2. Select your WordPress installation directory
3. Write your PHP code in the editor (with IntelliSense support!)
4. Press `Ctrl/Cmd + Enter` or click "Execute Code" to run your code
5. View the output in the output panel

For more details on IntelliSense features, see [INTELLISENSE.md](INTELLISENSE.md).

## Requirements

- PHP must be installed and available in your system PATH
- A local WordPress installation

## Example Code

```php
// Get recent posts
$posts = get_posts(array('numberposts' => 5));
foreach ($posts as $post) {
    echo $post->post_title . "\n";
}

// Get site information
echo "Site URL: " . get_site_url() . "\n";
echo "Site Name: " . get_bloginfo('name') . "\n";

// Create a new post
$post_data = array(
    'post_title' => 'Test Post',
    'post_content' => 'This is a test post',
    'post_status' => 'publish'
);
$post_id = wp_insert_post($post_data);
echo "Created post with ID: " . $post_id . "\n";
```

## Technology Stack

- Electron
- React
- Tailwind CSS
- Node.js

## License

GPL-2.0-or-later
