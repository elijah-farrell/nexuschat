import React, { Suspense } from 'react'
import { Canvas } from '@react-three/fiber'
import { Box } from '@mui/material'
import StyledHeroContent from '../components/landing/StyledHeroContent.jsx'
import WobblingSphere from '../components/ui/WobblingSphere.jsx'
// Colors are now hardcoded for the clean Telegram-inspired theme
import './LandingPage.css'

const LandingPage = ({ mode, setMode }) => {
  return (
    <div 
      className="landing-container"
      style={{ 
        width: '100vw', 
        height: '100vh', 
        position: 'relative', 
        overflow: 'hidden',
        background: mode === 'dark' 
          ? '#1E1F22'
          : '#FFFFFF',
        display: 'flex'
      }}
    >
      {/* Full Page Background Gradient */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: mode === 'dark' 
            ? 'linear-gradient(135deg, #1E1F22 0%, #2C2F33 100%)'
            : 'linear-gradient(135deg, #FFFFFF 0%, #F4F4F5 100%)',
          zIndex: 1
        }}
      />

      {/* CSS-based background pattern */}
      <div className="background-pattern" data-mode={mode} />

      {/* Left Side - Scrollable Content Overlay (Now Wider) */}
      <div
        className="content-section"
        style={{
          width: '65%', // Increased from 50% to 65%
          height: '100vh',
          position: 'relative',
          zIndex: 10,
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        {/* Scrollable content container with smooth scrolling */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            overflowX: 'hidden',
            scrollBehavior: 'smooth',
            paddingTop: '60px', // Reduced padding since no top elements
            paddingLeft: '60px', // Increased padding for better spacing
            paddingRight: '40px',
            paddingBottom: '40px',
            // Hide scrollbar but keep functionality
            scrollbarWidth: 'none', // Firefox
            msOverflowStyle: 'none', // IE/Edge
          }}
          className="smooth-scroll"
        >
          <StyledHeroContent mode={mode} setMode={setMode} />
        </div>
      </div>

      {/* Right Side - 3D Sphere Canvas (Now Smaller) */}
      <div
        style={{
          width: '35%', // Reduced from 50% to 35%
          height: '100vh',
          position: 'relative',
          zIndex: 5
        }}
      >
        {/* 3D Wobbling Sphere Canvas */}
        <Canvas 
          camera={{ position: [0, 0, 4], fov: 75 }}
          style={{ 
            width: '100%',
            height: '100%',
            background: 'transparent'
          }}
          gl={{ 
            antialias: true,
            alpha: true,
            powerPreference: 'high-performance',
            preserveDrawingBuffer: false,
            stencil: false,
            depth: true
          }}
          frameloop="always"
          dpr={[1, 1.5]}
          performance={{ min: 0.5 }}
        >
          <Suspense fallback={null}>
            <WobblingSphere mode={mode} onModeToggle={setMode} />
          </Suspense>
        </Canvas>
      </div>
    </div>
  )
}

export default LandingPage;