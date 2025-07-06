# Minimal 3D Studio

**English** | [中文](README_zh.md)

A minimal cross-platform(Win/Mac/Web) application for 3D model generation. Built with Tripo3D API, React, TypeScript, Three.js, and Electron.
(~6 hours of vibe coding using Cursor + Claude4 in the weekend)

> You can get 300 free API credits(separated from 300 web credits) upon registration on Tripo so it worths a try!

![Demo](./assets/demo.gif)


## Features

### 🎨 TextTo3d & ImageTo3D
- **Text-to-Image**: Generate images from text prompts
- **Image-to-3D**: Convert 2D images into 3D models
- **Advanced Parameters**: Fine-tune generation with texture quality, topology options, and more

### ⚙️ **Advanced Parameters**
> check out the [Tripo Pricing Page](https://platform.tripo3d.ai/docs/billing) for the credits required.
- **Generate Texture** : Adds realistic textures
- **PBR Texture**: Generate PBR texture
- **HD Texture** : High-definition texture quality
- **Generate In Parts** : Segmented model components
- **Low Poly** : Optimized geometry for gaming/AR
- **Quad Topology** : Clean quad-based mesh
- **Face Limit** : Limit the number of faces in the generated mesh.

## Quick Start

### Prerequisites
- Node.js 16 or higher & npm
- Tripo3D API key (get one at [platform.tripo3d.ai](https://platform.tripo3d.ai))

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/minimal_3d_studio.git
   cd minimal_3d_studio
   ```
2. **Install dependencies**
   ```bash
   npm install
   ```
3. **Configure API Key**
   - In development, replace `api-key'` in `src/App.tsx` with your actual Tripo3D API key
   - For production, use environment variables, or set the envar in settings panel
4. **Start development server**
   ```bash
   npm start
   ```
5. **Open the application**
   - Web: http://localhost:3000
   - Desktop: `npm run electron-dev`

## Development Scripts
```bash
# Start web development server
npm start
# Start Electron development mode
npm run electron-dev
# Build for production
npm run build
# Package as desktop app (for distribution)
npm run electron-pack
# Package as desktop app (development - no code signing)
npm run electron-pack-dev
# Run tests
npm test
```


## Project Structure
```
minimal_3d_studio/
├── public/
│   ├── electron.js          # Electron main process
│   │   └── ui-prototype.html    # Original UI prototype
├── src/
│   ├── components/          # React components
│   │   ├── Header.tsx
│   │   ├── ImageViewport.tsx
│   │   ├── ModelViewport.tsx
│   │   ├── Model3D.tsx
│   │   └── ControlPanel.tsx
│   ├── services/
│   │   └── api.ts          # Tripo3D API integration
│   ├── types/
│   │   └── api.ts          # TypeScript definitions
│   ├── App.tsx             # Main application component
│   ├── App.css             # Styling (matches prototype)
│   └── index.tsx           # Application entry point
├── docs/                   # Documentation and assets
└── package.json           # Dependencies and scripts
```

## Deployment

### Web Deployment
```bash
npm run build
# Deploy the build/ folder to your web server
```

### Desktop App Packaging

#### For Development (No Code Signing)
```bash
# Current platform
npm run electron-pack-dev
# Specific platforms
npm run electron-pack-dev -- --mac
npm run electron-pack-dev -- --win
npm run electron-pack-dev -- --linux
```

#### For Production/Distribution
```bash
# Current platform (requires valid code signing certificates)
npm run electron-pack
# Specific platforms
npm run electron-pack -- --win
npm run electron-pack -- --mac
npm run electron-pack -- --linux
```

> **Note**: For macOS distribution, you'll need valid Apple Developer certificates. For development builds, use the `electron-pack-dev` script to skip code signing.

### TODO
- [ ] Support other API providers like piapi/fal.ai
- [ ] Support local API backend with [3DAIGC-Backend](https://github.com/FishWoWater/3DAIGC-API), and develop a more comprehensive 3D studio (including rigging/segmentation etc.).


## License

This project is licensed under the Apache2.0 License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments
- [Tripo3D](https://platform.tripo3d.ai) for the powerful 3D generation API
- [React Three Fiber](https://github.com/pmndrs/react-three-fiber) for 3D rendering
- [Lucide](https://lucide.dev) for beautiful icons
- Cursor + Claude4 

