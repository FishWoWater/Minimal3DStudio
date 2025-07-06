# Changelog

All notable changes to the Minimal 3D Studio project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2025-07.06

### Added
- Initial release of Minimal 3D Studio
- **Core Features:**
  - Text-to-image generation using Tripo3D API
  - Image-to-3D model conversion
  - Interactive 3D model viewer with Three.js
  - Advanced generation parameters with credit calculation
  - Dark/Light theme support
  - Cross-platform desktop app with Electron

- **UI Components:**
  - Professional header with credits display and theme toggle
  - Image viewport with drag & drop upload functionality
  - 3D viewport with multiple view modes (Solid, Wireframe, Rendered)
  - Control panel with parameter toggles and generation controls
  - Real-time progress tracking and status updates

- **Technical Implementation:**
  - React 19 with TypeScript for type safety
  - Three.js integration via React Three Fiber
  - Responsive CSS design matching UI prototype
  - Modular component architecture for scalability
  - API service abstraction for easy provider switching

- **Desktop App Features:**
  - Electron-based cross-platform packaging
  - Native desktop menus and shortcuts
  - Secure external link handling
  - Professional window management

- **Advanced Parameters:**
  - Generate Texture (+2 credits)
  - HD Texture Quality (+4 credits)
  - Generate In Parts (+3 credits)
  - Low Poly optimization (+1 credit)
  - Quad Topology (+2 credits)

### Technical Details
- **Frontend:** React 19, TypeScript, Three.js
- **3D Rendering:** React Three Fiber, React Three Drei
- **Desktop:** Electron with security best practices
- **API:** Tripo3D integration with polling-based status updates
- **Styling:** CSS variables for theming, responsive grid layout
- **Icons:** Lucide React for consistent iconography

### Known Limitations
- API key must be configured manually in code
- 3D viewer currently shows placeholder geometry
- Export functionality creates download links (not native file dialogs)
- No persistence layer for projects or settings

### Development Setup
- Node.js 16+ required
- Supports npm/yarn package managers
- Hot reload in development mode
- Electron development mode with DevTools

### Deployment Options
- Web deployment via static hosting
- Desktop packaging for Windows, macOS, Linux
- Development and production build scripts included 