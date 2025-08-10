import React from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { useSpring } from '@react-spring/core'
import { a } from '@react-spring/web'
import NexusChatOverlay from '../components/landing/sphere/NexusChatOverlay.jsx'
import SphereScene from '../components/landing/sphere/SphereScene.jsx'
import '../components/landing/sphere/sphere.css'

export default function LandingPage({ mode, setMode }) {
  // This spring controls the background and the svg fill (text color)
  const [{ background, fill }, set] = useSpring({ 
    background: mode === 'dark' ? '#1E1F22' : '#FFFFFF', 
    fill: mode === 'dark' ? '#FFFFFF' : '#1F1F1F' 
  }, [mode])
  return (
    <a.main style={{ background }}>
      <Canvas className="canvas" dpr={[1, 2]}>
        <SphereScene setBg={set} mode={mode} setMode={setMode} />
        <OrbitControls enablePan={false} enableZoom={false} maxPolarAngle={Math.PI / 2} minPolarAngle={Math.PI / 2} />
      </Canvas>
      <NexusChatOverlay fill={fill} />
    </a.main>
  )
}
