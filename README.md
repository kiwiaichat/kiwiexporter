# Hello World Extension

A basic browser extension that demonstrates "Hello World" functionality with catch and drop capabilities.

## Features

### 🚀 Hello World Display
- Shows a "Hello World" message on web pages
- Customizable position and styling
- Keyboard shortcut support (Ctrl+Shift+H)
- Toggle on/off functionality

### 🎯 Catch and Drop System
- Drag and drop elements from web pages into a collection zone
- Visual drop zone indicator
- Storage of dropped items with timestamps
- Context menu integration for easy catching
- Automatic cleanup of old items (7+ days)

### 💾 Data Management
- Local storage for dropped items
- Popup interface for managing collected items
- Clear all items functionality
- View dropped items by source URL and date

## Installation

1. **Download/Clone** this extension code
2. **Create Icons** (optional but recommended):
   - Add PNG icons to the `icons/` directory:
     - `icon16.png` (16x16)
     - `icon32.png` (32x32)
     - `icon48.png` (48x48)
     - `icon128.png` (128x128)
3. **Load in Browser**:
   - Open Chrome and go to `chrome://extensions/`
   - Enable "Developer mode" (toggle in top right)
   - Click "Load unpacked"
   - Select the extension directory
4. **Test the Extension**:
   - Visit any website
   - The extension should automatically inject and show the Hello World message
   - Try dragging elements to the green drop zone

## Usage

### Basic Controls
- **Toggle Hello World**: Press `Ctrl+Shift+H` on any webpage
- **Extension Popup**: Click the extension icon in the toolbar
- **Context Menu**: Right-click on elements for "Catch this element" option

### Popup Interface
The extension popup provides:
- Enable/disable the entire extension
- Toggle Hello World display on/off
- View all dropped items with timestamps
- Clear all stored items
- Manual refresh of stored data

### Drag and Drop
1. **Make elements draggable**: The extension automatically makes most page elements draggable
2. **Drop zone**: Look for the green "Drop elements here!" zone in the bottom-left corner
3. **Catch elements**: Drag any element into the drop zone to collect it
4. **View collected items**: Click the extension icon to see your collection

## Files Structure

```
extension-directory/
├── manifest.json          # Extension configuration
├── content.js            # Injected script for web pages
├── service-worker.js     # Background service worker
├── popup.html           # Extension popup interface
├── popup.js             # Popup functionality
├── icons/               # Icon files directory
│   ├── icon16.png
│   ├── icon32.png
│   ├── icon48.png
│   ├── icon128.png
│   └── README.md
└── README.md           # This file
```

## Development

### Key Components

- **Manifest V3**: Uses the latest Chrome extension manifest format
- **Content Script**: Injects into all web pages for functionality
- **Service Worker**: Handles background tasks and storage
- **Popup Interface**: Provides user controls and data management

### Customization

You can customize:
- Colors and styling in the CSS
- Drop zone behavior in `content.js`
- Storage limits and cleanup schedules
- Keyboard shortcuts in `manifest.json`

## Browser Support

- **Chrome**: Full support (Manifest V3)
- **Edge**: Full support (Chromium-based)
- **Firefox**: Limited support (requires Manifest V2 adaptation)
- **Safari**: Limited support (requires additional work)

## Troubleshooting

### Common Issues

1. **Extension not loading**:
   - Check the browser console for errors
   - Ensure all required files are present
   - Verify manifest.json syntax

2. **Content not injecting**:
   - Check if the site uses HTTPS
   - Look for content security policy issues
   - Verify permissions in manifest.json

3. **Drag and drop not working**:
   - Ensure elements are visible and not obscured
   - Check if the drop zone is visible on screen
   - Try refreshing the page

### Debug Mode

To enable debug logging:
1. Open browser DevTools (F12)
2. Go to Console tab
3. Look for messages from the extension
4. Check for any errors or warnings

## Contributing

Feel free to enhance this basic extension with:
- Better icons and UI design
- Additional catch and drop features
- More storage options
- Advanced filtering and search
- Export/import functionality

## License

This is a basic example extension for educational purposes.