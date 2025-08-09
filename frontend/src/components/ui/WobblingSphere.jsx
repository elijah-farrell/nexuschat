import * as THREE from 'three'
import React, { Suspense, useEffect, useState, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { PerspectiveCamera, Environment, MeshDistortMaterial, ContactShadows } from '@react-three/drei'
import { useSpring } from '@react-spring/core'
import { a } from '@react-spring/three'
// Colors are now hardcoded for the clean Telegram-inspired theme

// React-spring animates native elements, in this case <mesh/> etc,
// but it can also handle 3rd–party objs, just wrap them in "a".
const AnimatedMaterial = a(MeshDistortMaterial)

export default function WobblingSphere({ mode, onModeToggle }) {
  const sphere = useRef()
  const light = useRef()
  const [down, setDown] = useState(false)
  const [hovered, setHovered] = useState(false)

  // Change cursor on hovered state - only on landing page
  useEffect(() => {
    // Only apply custom cursor on landing page
    if (window.location.pathname === '/') {
      document.body.style.cursor = hovered
        ? 'none'
        : `url('data:image/svg+xml;base64,${btoa(
            `<svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="16" cy="16" r="10" fill="#3B82F6"/></svg>`
          )}'), auto`
    }
  }, [hovered])

  // Clean up cursor when component unmounts or path changes
  useEffect(() => {
    return () => {
      // Always reset cursor on unmount, regardless of path
      document.body.style.cursor = 'auto'
    }
  }, [])

  // Make the bubble float and follow the mouse - EXACTLY like original
  useFrame((state) => {
    if (light.current) {
      light.current.position.x = state.mouse.x * 20
      light.current.position.y = state.mouse.y * 20
    }
    if (sphere.current) {
      sphere.current.position.x = THREE.MathUtils.lerp(sphere.current.position.x, hovered ? state.mouse.x / 2 : 0, 0.2)
      sphere.current.position.y = THREE.MathUtils.lerp(
        sphere.current.position.y,
        Math.sin(state.clock.elapsedTime / 1.5) / 6 + (hovered ? state.mouse.y / 2 : 0),
        0.2
      )
    }
  })

  // Springs for color and overall looks - EXACTLY like original but with our colors
  const [{ wobble, coat, color, ambient, env }] = useSpring(
    {
      wobble: down ? 1.2 : hovered ? 1.05 : 1,
      coat: mode === 'dark' && !hovered ? 0.04 : 1,
      ambient: mode === 'dark' && !hovered ? 1.5 : 0.5,
      env: mode === 'dark' && !hovered ? 0.4 : 1,
      // Clean Telegram-inspired colors: hover = blue, default = white/dark based on mode
      color: hovered ? '#3B82F6' : mode === 'dark' ? '#2C2F33' : '#FFFFFF',
      config: (n) => n === 'wobble' && hovered && { mass: 2, tension: 1000, friction: 10 }
    },
    [mode, hovered, down]
  )

  return (
    <>
      <PerspectiveCamera makeDefault position={[0, 0, 4]} fov={75}>
        <a.ambientLight intensity={ambient} />
        <a.pointLight ref={light} position-z={-15} intensity={env} color={'#3B82F6'} />
      </PerspectiveCamera>
      <Suspense fallback={null}>
        <a.mesh
          ref={sphere}
          scale={wobble}
          onPointerOver={() => setHovered(true)}
          onPointerOut={() => setHovered(false)}
          onPointerDown={() => setDown(true)}
          onPointerUp={() => {
            setDown(false)
            // Toggle mode between dark and light
            const newMode = mode === 'dark' ? 'light' : 'dark'
            onModeToggle(newMode)
          }}>
          {/* Use original geometry for better performance and look */}
          <sphereGeometry args={[1, 64, 64]} />
          {/* Use original material settings - no custom distort/speed */}
          <AnimatedMaterial 
            color={color} 
            envMapIntensity={env} 
            clearcoat={coat} 
            clearcoatRoughness={0} 
            metalness={0.2}
            roughness={0.1}
            distort={0.3}
            speed={2}
          />
        </a.mesh>
        <Environment preset="warehouse" />
        {/* EXACTLY like original ContactShadows */}
        <ContactShadows
          rotation={[Math.PI / 2, 0, 0]}
          position={[0, -1.6, 0]}
          opacity={mode === 'dark' ? 0.6 : 0.25}
          width={20}
          height={20}
          blur={3}
          far={2}
          color={mode === 'dark' ? '#1E1F22' : '#E4E4E7'}
        />
      </Suspense>
    </>
  )
}