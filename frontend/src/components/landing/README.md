# Landing Page Components

This directory contains the original interactive3dlaptop components integrated into the NexusChat frontend.

## Files

- **HeroPage.jsx**: Custom NexusChat-focused content displayed on the 3D laptop screen
- **styles.css**: Original styling from the interactive3dlaptop project (backup)

## Tech Stack Compatibility

The original interactive3dlaptop project has been successfully integrated with the NexusChat frontend:

### ✅ Compatible Dependencies
- React 18.2.0
- Three.js 0.153.0
- @react-three/fiber 8.13.3
- @react-three/drei 9.76.0
- @headlessui/react (v1.4.0 → v2.2.7)
- @heroicons/react v1.0.6

### 🔄 Adaptations Made
- **Build Tool**: Original used Create React App (react-scripts), now uses Vite
- **Styling**: Original used Tailwind CSS, now uses Material-UI + custom CSS
- **File Structure**: Moved from standalone project to organized component structure

## Usage

The landing page is accessible at the root path (`/`) and displays a custom NexusChat experience with:

- Floating 3D laptop model
- NexusChat branding and messaging
- Login/Register buttons
- Chat preview with sample messages
- Developer portfolio links
- Modern gradient design with glassmorphism effects

## Integration

The components are properly integrated with:
- NexusChat routing system
- Material-UI theme system
- Authentication context
- Socket connection management 