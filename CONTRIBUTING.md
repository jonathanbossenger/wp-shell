# Contributing to WP Shell

Thank you for your interest in contributing to WP Shell! This document provides guidelines and instructions for contributing.

## Development Setup

1. **Fork and Clone**
   ```bash
   git clone https://github.com/YOUR_USERNAME/wp-shell.git
   cd wp-shell
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Run in Development Mode**
   ```bash
   npm run dev
   ```

## Project Structure

```
wp-shell/
├── main/               # Electron main process
│   └── index.js       # Main process logic
├── renderer/          # Electron renderer process
│   ├── src/
│   │   ├── App.js            # Main React component
│   │   ├── components/       # React components
│   │   │   └── RecentDirectories.js
│   │   ├── index.js         # React entry point
│   │   └── styles.css       # Global styles
│   ├── index.html           # Main HTML file
│   └── about.html          # About dialog HTML
├── assets/            # Icons and images
├── scripts/           # Build scripts
├── preload.js        # Preload script for IPC
├── package.json      # Dependencies and scripts
├── webpack.config.js # Webpack configuration
└── forge.config.js   # Electron Forge configuration
```

## Development Workflow

### Making Changes

1. Create a new branch:
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. Make your changes

3. Test your changes:
   ```bash
   npm run dev
   ```

4. Build the project:
   ```bash
   npm run build
   ```

### Code Style

- Use 2 spaces for indentation
- Follow existing code style
- Use meaningful variable names
- Add comments for complex logic
- Keep functions focused and single-purpose

### Commit Messages

- Use clear, descriptive commit messages
- Start with a verb (Add, Fix, Update, Remove, etc.)
- Keep the first line under 72 characters
- Add detailed description if needed

Example:
```
Add timeout handling for PHP code execution

- Set 30-second timeout for exec command
- Display timeout error message to user
- Update documentation with timeout information
```

## Testing

Before submitting a pull request:

1. **Test Core Functionality**
   - Directory selection
   - Code execution
   - Output display
   - Error handling

2. **Test Edge Cases**
   - Long-running code
   - Large output
   - Invalid PHP syntax
   - Missing WordPress directory

3. **Cross-Platform Testing** (if possible)
   - Windows
   - macOS
   - Linux

## Building

### Development Build
```bash
npm run build
```

### Production Build
```bash
npm run make
```

This creates distributable packages for your platform in the `out/` directory.

## Releases

WP Shell uses an automated GitHub Actions workflow to create releases:

1. **Prerequisites**
   - Ensure all changes are merged to the main branch
   - Update version in `package.json` if needed
   - Tag the commit with the version (e.g., `v1.0.0`)

2. **Automated Release**
   - Navigate to **Actions** → **Release app** in the GitHub repository
   - Click **Run workflow**
   - Select the branch/tag to release
   - The workflow will automatically:
     - Build for Linux, Windows, and macOS
     - Create distributable packages
     - Publish to GitHub Releases
     - Add macOS quarantine workaround instructions

3. **Manual Release** (alternative)
   ```bash
   npm run publish
   ```
   
   Note: Requires `GH_TOKEN` environment variable with GitHub Personal Access Token.

## Pull Request Process

1. **Update Documentation**
   - Update README.md if needed
   - Update QUICK_START.md for user-facing changes
   - Add code comments for complex logic

2. **Test Thoroughly**
   - Ensure all existing functionality still works
   - Test your new feature/fix
   - Check for console errors

3. **Submit Pull Request**
   - Provide a clear title and description
   - Reference any related issues
   - List the changes made
   - Include screenshots for UI changes

4. **Code Review**
   - Address reviewer feedback
   - Make requested changes
   - Re-test after changes

## Feature Requests

Have an idea for WP Shell? Great! Please:

1. Check existing issues first
2. Create a new issue with:
   - Clear description of the feature
   - Use case / why it's needed
   - Proposed implementation (if any)

## Bug Reports

Found a bug? Please create an issue with:

1. **Clear Title**: Brief description of the issue
2. **Steps to Reproduce**: Numbered list of steps
3. **Expected Behavior**: What should happen
4. **Actual Behavior**: What actually happens
5. **Environment**:
   - OS and version
   - WP Shell version
   - PHP version
   - WordPress version
6. **Screenshots**: If applicable
7. **Error Messages**: Full error text if available

## Security Issues

If you discover a security vulnerability, please email directly instead of creating a public issue. This allows us to fix the issue before it can be exploited.

## License

By contributing to WP Shell, you agree that your contributions will be licensed under the GPL-2.0-or-later license.

## Questions?

If you have questions about contributing, feel free to:
- Open an issue for discussion
- Comment on existing issues
- Reach out to the maintainers

Thank you for contributing to WP Shell! 🎉
