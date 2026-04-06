# Crystal 3D Configurator

A WordPress plugin that allows users to create and customize 3D crystal engravings with AI-powered background removal and real-time 3D visualization.

## 🌟 Features

### 3D Crystal Visualization
- **Multiple Crystal Shapes**: Choose from Diamond, Cube, and Sphere shapes
- **Real-time 3D Rendering**: Powered by Three.js with realistic glass materials
- **Interactive Controls**: Rotate, zoom, and inspect crystals using OrbitControls
- **Professional Lighting**: Warm white lighting system with HDRI environment mapping

### AI-Powered Background Removal
- **Automatic Background Removal**: Uses remove.bg API for instant background removal
- **Smart Image Processing**: Converts uploaded images to crystal-ready format
- **Base64 Processing**: Secure client-side image handling

### Dual Viewing Modes
- **Standard Mode**: View crystal with embedded 2D image
- **Laser Engraved Mode**: Preview 3D point cloud representation for laser engraving

## 🚀 Installation

1. Copy the `crystal-3d-generator` folder to `/wp-content/plugins/`
2. Activate the plugin in WordPress admin
3. Use the shortcode `[crystal_viewer]` on any page or post

## ⚙️ Configuration

### API Setup
- Add your remove.bg API key in `crystal-3d-generator.php` (line 43)
- Current API key location: `wp-content/plugins/crystal-3d-generator/crystal-3d-generator.php`

### Dependencies
- **Three.js** v0.147.0: 3D rendering engine
- **WordPress** 5.0+: Plugin framework
- **remove.bg API**: Background removal service

## 📁 Project Structure

```
crystal-configurator/
├── wp-content/
│   └── plugins/
│       └── crystal-3d-generator/
│           ├── crystal-3d-generator.php    # Main plugin file
│           ├── assets/
│           │   ├── css/
│           │   │   └── style.css          # Plugin styling
│           │   └── js/
│           │       └── main.js            # Three.js implementation
│           └── templates/
│               └── viewer.php             # Frontend HTML template
├── package.json                           # Node.js dependencies
└── README.md                             # This file
```

## 🎯 Usage

### For Users
1. **Select Crystal Shape**: Choose Diamond, Cube, or Sphere
2. **Upload Image**: Select any image file
3. **Background Removal**: Optional AI-powered background removal
4. **3D Preview**: Interact with the crystal in real-time
5. **Laser Mode**: Toggle to see laser engraving preview

### For Developers
- **Shortcode**: `[crystal_viewer]`
- **AJAX Endpoint**: `wp_ajax_remove_background`
- **JavaScript Globals**: `crystalApp` object with AJAX URL and nonce

## 🔧 Technical Details

### Frontend Technologies
- **Three.js**: WebGL-based 3D graphics
- **OrbitControls**: User interaction system
- **RoomEnvironment**: Realistic lighting environments

### Backend Features
- **WordPress Hooks**: Custom AJAX handlers
- **Security**: Nonce verification and sanitization
- **API Integration**: remove.bg service integration

### Material Properties
- **Glass Material**: Realistic transparency and refraction
- **Warm Lighting**: Professional crystal visualization
- **HDRI Environment**: Enhanced realism

## 🎨 Customization

### Adding New Crystal Shapes
1. Modify `setShape()` function in `main.js`
2. Add new geometry options
3. Update template buttons in `viewer.php`

### Styling Changes
- Edit `assets/css/style.css` for UI customization
- Modify lighting parameters in `main.js` for visual changes

## 🔐 Security Notes
- API key should be replaced with your own remove.bg key
- All AJAX requests use WordPress nonces
- Image data is processed as base64 for security

## 📄 License
This plugin is licensed under the same terms as WordPress.

## 👤 Author
**Manan Makwana** - WordPress Plugin Developer

## 🤝 Support
For issues and feature requests, please contact the plugin author.
