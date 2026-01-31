# WP Shell - Screenshots & UI Preview

Since we cannot provide actual screenshots in this environment, here's a detailed description of what users will see when using WP Shell:

## 1. Initial Launch Screen

```
┌─────────────────────────────────────────────────────────────┐
│ WP Shell                                                    │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│                      WP Shell                               │
│                                                             │
│         Select your WordPress installation directory        │
│                                                             │
│  ┌────────────── Recent Directories ─────────────────┐    │
│  │                                                     │    │
│  │  /Users/john/sites/mysite                          │    │
│  │  /Users/john/sites/test-wp                         │    │
│  │  /var/www/html/wordpress                           │    │
│  │                                                     │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                             │
│            ┌────────────────┐  ┌──────────┐               │
│            │ Select Directory │  │   Quit   │               │
│            └────────────────┘  └──────────┘               │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Key Elements:**
- Large "WP Shell" heading in bold
- Clear instruction text
- Recent directories shown as clickable buttons (if available)
- Prominent blue "Select Directory" button
- Red "Quit" button in bottom right

## 2. Main Code Editor Screen

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ WP Shell                                                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  WordPress Directory: /Users/john/sites/mysite          [Change Directory] │
│                                                                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Code Editor                                    Ctrl/Cmd + Enter to execute│
│  ┌───────────────────────────────────────────────────────────────────────┐ │
│  │ // Enter your WordPress PHP code here                                │ │
│  │ // Example:                                                           │ │
│  │ // $posts = get_posts(array('numberposts' => 5));                    │ │
│  │ // foreach ($posts as $post) {                                       │ │
│  │ //     echo $post->post_title . "\n";                                │ │
│  │ // }                                                                  │ │
│  │                                                                       │ │
│  │ $posts = get_posts(array('numberposts' => 5));                       │ │
│  │ foreach ($posts as $post) {                                          │ │
│  │     echo $post->post_title . "\n";                                   │ │
│  │ }                                                                     │ │
│  └───────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
│  [Execute Code] [Clear Output]                                      [Quit] │
│                                                                             │
│  Output                                                                     │
│  ┌───────────────────────────────────────────────────────────────────────┐ │
│  │ Hello World Post                                                      │ │
│  │ Sample Page                                                           │ │
│  │ Another Post                                                          │ │
│  │ Test Post 1                                                           │ │
│  │ Test Post 2                                                           │ │
│  │                                                                       │ │
│  └───────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Key Elements:**
- WordPress directory path shown at top with "Change Directory" button
- Dark-themed code editor (background: #1e1e1e, text: #d4d4d4)
- Helpful hint text about keyboard shortcut
- Three action buttons:
  - Green "Execute Code" button (primary action)
  - Gray "Clear Output" button
  - Red "Quit" button (right-aligned)
- Light-themed output panel showing results
- Monospace font for both code and output

## 3. About Dialog

```
┌─────────────────────────────────┐
│ About WP Shell                  │
├─────────────────────────────────┤
│                                 │
│        WP Shell                 │
│       Version 1.0.0             │
│                                 │
│  Execute WordPress PHP code     │
│        in an app.               │
│                                 │
│  Built with Electron and React. │
│                                 │
│      View on GitHub             │
│                                 │
└─────────────────────────────────┘
```

**Key Elements:**
- Purple gradient background
- White card with rounded corners
- App name and version
- Brief description
- Link to GitHub repository

## 4. System Tray

The app appears in the system tray with a small terminal icon:

- **macOS**: Menu bar (top right)
- **Windows**: System tray (bottom right)
- **Linux**: System tray (varies by desktop environment)

Click the icon to:
- Show/hide the main window
- Quick access to the app

## Color Scheme

### Primary Colors
- **Blue (Primary)**: `#3b82f6` - Used for primary actions
- **Green (Success)**: `#22c55e` - Execute button
- **Red (Danger)**: `#ef4444` - Quit button
- **Purple (Accent)**: `#667eea` to `#764ba2` gradient - Branding

### Editor Colors
- **Background**: `#1e1e1e` - Dark gray
- **Text**: `#d4d4d4` - Light gray
- **Selection**: `#264f78` - Blue highlight

### Output Colors
- **Background**: `#f8f9fa` - Light gray
- **Text**: `#212529` - Dark gray
- **Border**: `#dee2e6` - Light border

## Responsive Design

The window is designed to be resizable with a minimum comfortable size of 1200x850 pixels. All elements scale appropriately:

- Code editor expands to fill available space
- Output panel scrolls when content exceeds height
- Buttons remain fixed size for easy clicking
- Text remains readable at all sizes

## Accessibility Features

- High contrast text for readability
- Clear button labels
- Keyboard shortcuts for power users
- Monospace fonts for code areas
- Adequate spacing between interactive elements
- Error messages in red with clear text

## Platform-Specific UI Elements

### macOS
- Native title bar
- Menu bar with "WP Shell" menu
- Dock icon shows when app is running
- Standard macOS window controls (red, yellow, green)

### Windows
- Standard Windows title bar
- Window controls (minimize, maximize, close)
- System tray icon
- Native file picker dialog

### Linux
- Adapts to desktop environment theme
- Standard window decorations
- System tray (where supported)
- GTK file picker

---

**Note**: For actual screenshots, run the application and take screenshots of the UI. The above descriptions provide a detailed text representation of what users will experience.
