# WP Shell - User Interface

## Main Interface

The WP Shell application consists of two main views:

### 1. Directory Selection View (Initial Screen)
When the app first launches, users see:
- **Title**: "WP Shell" (large, bold heading)
- **Subtitle**: "Select your WordPress installation directory"
- **Recent Directories**: A list of up to 5 recently used WordPress directories (if any)
- **Primary Button**: "Select Directory" - Opens a directory picker
- **Secondary Button**: "Quit" - Closes the application

### 2. Code Editor View (After WordPress Directory Selected)

Once a WordPress directory is selected, the interface changes to:

#### Top Section
- **WordPress Directory Display**: Shows the selected directory path in a monospace font
- **Change Directory Button**: Allows switching to a different WordPress installation

#### Main Section - Side-by-Side Layout
The interface uses a side-by-side layout with two columns:

**Left Side - Code Editor:**
- **Code Editor**: A dark-themed text area (background: #1e1e1e, text: #d4d4d4)
  - Syntax highlighting with monospace font
  - Tab key support for indentation
  - Keyboard shortcut: Ctrl/Cmd + Enter to execute code
  - Pre-filled with helpful example code:
    ```php
    // Enter your WordPress PHP code here
    // Example:
    // $posts = get_posts(array('numberposts' => 5));
    // foreach ($posts as $post) {
    //     echo $post->post_title . "\n";
    // }
    ```
- **Action Buttons** (below Code Editor):
  - **Execute Code** (Green): Runs the PHP code in the WordPress context
  - **Clear Output** (Gray): Clears the output panel

**Right Side - Output:**
- **Output Display**: A light-themed panel (background: #f8f9fa)
  - Monospace font for code output
  - Scrollable area for long outputs
  - Shows execution results or error messages
  - Placeholder text when empty: "No output yet. Execute some code to see results here."
- **Action Button** (below Output):
  - **Quit** (Red): Closes the application

## Color Scheme
- **Primary Color**: Blue (#3b82f6) for action buttons
- **Success Color**: Green (#22c55e) for execute button
- **Danger Color**: Red (#ef4444) for quit button
- **Editor Background**: Dark (#1e1e1e)
- **Editor Text**: Light (#d4d4d4)
- **Output Background**: Light gray (#f8f9fa)

## Features
- Clean, modern design using Tailwind CSS
- Responsive layout that adapts to window size
- Clear visual hierarchy
- Consistent with WP Debug's UI style
- System tray icon for quick access
- About dialog with app information

## Keyboard Shortcuts
- **Ctrl/Cmd + Enter**: Execute code
- **Tab**: Insert 4 spaces for indentation
- **Ctrl/Cmd + Q**: Quit application (via menu)
