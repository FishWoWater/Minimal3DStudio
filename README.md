# Minimal 3D Studio

**English** | [中文](README_zh.md)

A minimal cross-platform(Win/Mac/Web) application for 3D model generation. Built with React, TypeScript, Three.js, and Electron. Support Tripo and Replicate as the API providers. 


![Demo](./assets/demo.gif)

## API Providers 
### Tripo
[Tripo]() is one of the best 3DAIGC providers. You can get 600 free API credits (separated from web credits) upon registration on Tripo so it worths a try! Beyond 600 credits, each image generation costs around $0.05, each model generation costs around $0.2.


### Replicate 
Current [Replicate](https://replicate.com) API builts upon  [Flux-Schnell](https://replicate.com/black-forest-labs/flux-schnell) for text2image generation and [TRELLIS](https://replicate.com/firtoz/trellis) for image2model generation. Replicate is in a pay-as-you-go way, which costs about $0.01 per text2image generation and $0.04 per imageTo3D model.

## Features

### 🎨 TextTo3d & ImageTo3D
- **Text-to-Image**: Generate images from text prompts
- **Image-to-3D**: Convert 2D images into 3D models

### ⚙️ **Replicate Advanced Parameters** 
- **Texture Size**: texture resolution, [256, 2048]
- **Simplify Ratio**: decimation ratio for the final geometry (0.5 - 0.95, largest value means fewer faces)


### ⚙️ **Tripo Advanced Parameters**
> check out the [Tripo Pricing Page](https://platform.tripo3d.ai/docs/billing) for the credits required.
- **Generate Texture**: Generate textured mesh or raw mesh
- **PBR Texture**: Generate PBR texture
- **HD Texture**: High-Quality texture
- **Generate In Parts**: Generate Part-Level Geometries (conflicts with texture generation)
- **Low Poly**: Generate the model in a low-poly style
- **Quad Topology**: Generate the geometry as a quad mesh instead of a triangle mesh
- **Face Limit**: Limitation on the number of faces of generated geometry

## Quick Start

### Prerequisites
- Node.js 16 or higher & npm
- Tripo3D API key (get one at [platform.tripo3d.ai](https://platform.tripo3d.ai))
- Replicate API key (get one at [Replicate API](https://replicate.com/account/api-tokens))

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
   - In development, use environment variables to configure your API key `cp .env.example .env`.
   - For production, check out the settings panel.
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
```


## Project Structure
```
minimal_3d_studio/
├── public/
│   ├── electron.js          # Electron main process
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

### TODO
- [ ] Support other API providers like Replicate/Hunyuan
- [ ] Support local API backend with [3DAIGC-Backend](https://github.com/FishWoWater/3DAIGC-API), and develop a more comprehensive 3D studio (including rigging/segmentation etc.).


## License

This project is licensed under the Apache2.0 License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments
- [Tripo3D](https://platform.tripo3d.ai) for the powerful 3D generation API
- [React Three Fiber](https://github.com/pmndrs/react-three-fiber) for 3D rendering
- [Lucide](https://lucide.dev) for beautiful icons
- Cursor + Claude4 

