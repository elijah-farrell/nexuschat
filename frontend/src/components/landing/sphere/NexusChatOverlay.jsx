import React from 'react'
import { a } from '@react-spring/web'

export default function Overlay({ fill }) {
  // Just a Figma export, the fill is animated
  return (
    <div className="overlay">
      <a.svg viewBox="0 0 583 720" fill={fill} xmlns="http://www.w3.org/2000/svg">
        <path fill="#3B82F6" d="M50.5 61h9v9h-9zM50.5 50.5h9v9h-9zM40 50.5h9v9h-9z" />
        <path fillRule="evenodd" clipRule="evenodd" d="M61 40H50.5v9H61v10.5h9V40h-9z" fill="#3B82F6" />
        <text style={{ whiteSpace: 'pre' }} fontFamily="Inter" fontSize={6} fontWeight="bold" letterSpacing="-.02em">
          <tspan x={328} y={46.182} children="2025" />
        </text>
        <text style={{ whiteSpace: 'pre' }} fontFamily="Inter" fontSize={6} fontWeight="bold" letterSpacing="-.02em">
          <tspan x={392} y={46.182} children="CONNECT " />
          <tspan x={392} y={54.182} children="COMMUNICATE " />
          <tspan x={392} y={62.182} children="COLLABORATE" />
        </text>
        <text style={{ whiteSpace: 'pre' }} fontFamily="Inter" fontSize={10.5} fontWeight={500} letterSpacing="0em">
          <tspan x={40} y={175.318} children="REAL-TIME MESSAGING " />
          <tspan x={40} y={188.318} children="FOR THE MODERN ERA" />
        </text>
        <text fill="#3B82F6" style={{ whiteSpace: 'pre' }} fontFamily="Inter" fontSize={52} fontWeight="bold" letterSpacing="0em">
          <tspan x={115} y={257.909} children={'NexusChat \u2014'} />
        </text>
        <image 
          href="/nexuschatlogo.png" 
          x={40} 
          y={205} 
          width={60} 
          height={60}
        />
        <text style={{ whiteSpace: 'pre' }} fontFamily="Inter" fontSize={12} fontWeight="bold" letterSpacing="0em">
          <tspan x={40} y={270.909} />
        </text>
        <text style={{ whiteSpace: 'pre' }} fontFamily="Inter" fontSize={48} fontWeight="bold" letterSpacing="0em">
          <tspan x={40} y={321.909} children="Connect with friends " />
          <tspan x={40} y={372.909} children="and communities " />
          <tspan x={40} y={423.909} children="through seamless " />
          <tspan x={40} y={474.909} children="real-time messaging. " />
          <tspan x={40} y={525.909} children="Experience the future " />
          <tspan x={40} y={576.909} children="of communication;" />
        </text>
        <foreignObject x={40} y={590} width={400} height={80}>
          <div className="auth-buttons-inline">
            <button 
              className="auth-btn auth-btn-signin"
              onClick={() => window.location.href = '/login'}
            >
              Sign In
            </button>
            <button 
              className="auth-btn auth-btn-register"
              onClick={() => window.location.href = '/register'}
            >
              Get Started
            </button>
          </div>
        </foreignObject>
      </a.svg>
    </div>
  )
}
