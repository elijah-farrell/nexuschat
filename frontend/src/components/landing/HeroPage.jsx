import React from 'react'

export default function NexusChatHeroPage() {
  return (
    <div className="content">
      <style>{`
        @import url('https://rsms.me/inter/inter.css');

        * {
          box-sizing: border-box;
        }

        html,
        body,
        main,
        #root {
          width: 100%;
          height: 100%;
          margin: 0;
          padding: 0;
        }

        body {
          font-family: inter;
          color: black;
          background: #202025;
        }

        .content {
          width: 334px;
          height: 216px;
          background: white;
          border-radius: 3px;
          overflow-y: auto;
          padding: 0;
          font-family: inter;
        }

        .website {
          padding: 15px;
          background: white;
          min-height: 300px;
        }

        .navbar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
          padding-bottom: 10px;
          border-bottom: 1px solid #e5e7eb;
        }

        .logo {
          font-size: 18px;
          font-weight: bold;
          color: #4f46e5;
        }

        .nav-links {
          display: flex;
          gap: 15px;
          font-size: 12px;
        }

        .nav-link {
          color: #6b7280;
          text-decoration: none;
        }

        .nav-link:hover {
          color: #374151;
        }

        .hero {
          text-align: center;
          margin-bottom: 20px;
        }

        .hero-title {
          font-size: 16px;
          font-weight: bold;
          color: #111827;
          margin-bottom: 8px;
        }

        .hero-subtitle {
          font-size: 12px;
          color: #6b7280;
          margin-bottom: 15px;
        }

        .buttons {
          display: flex;
          gap: 10px;
          justify-content: center;
          margin-bottom: 20px;
        }

        .btn-primary {
          background: #4f46e5;
          color: white;
          padding: 6px 12px;
          border-radius: 4px;
          text-decoration: none;
          font-size: 11px;
          font-weight: 500;
        }

        .btn-secondary {
          background: white;
          color: #4f46e5;
          padding: 6px 12px;
          border-radius: 4px;
          text-decoration: none;
          font-size: 11px;
          font-weight: 500;
          border: 1px solid #d1d5db;
        }

        .features {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 10px;
          margin-bottom: 20px;
        }

        .feature {
          background: #f9fafb;
          padding: 10px;
          border-radius: 6px;
          border: 1px solid #e5e7eb;
          text-align: center;
        }

        .feature-icon {
          font-size: 16px;
          margin-bottom: 5px;
        }

        .feature-title {
          font-size: 10px;
          font-weight: 600;
          color: #111827;
          margin-bottom: 3px;
        }

        .feature-desc {
          font-size: 9px;
          color: #6b7280;
        }

        .about-section {
          margin-bottom: 20px;
          padding: 15px;
          background: #f9fafb;
          border-radius: 6px;
          border: 1px solid #e5e7eb;
        }

        .about-title {
          font-size: 12px;
          font-weight: 600;
          color: #111827;
          margin-bottom: 8px;
        }

        .about-text {
          font-size: 10px;
          color: #6b7280;
          line-height: 1.4;
        }

        .tech-section {
          margin-bottom: 20px;
          padding: 15px;
          background: #f9fafb;
          border-radius: 6px;
          border: 1px solid #e5e7eb;
        }

        .tech-title {
          font-size: 12px;
          font-weight: 600;
          color: #111827;
          margin-bottom: 8px;
        }

        .tech-list {
          font-size: 10px;
          color: #6b7280;
        }

        .footer {
          text-align: center;
          font-size: 9px;
          color: #9ca3af;
          margin-top: 20px;
          padding-top: 15px;
          border-top: 1px solid #e5e7eb;
        }
      `}</style>
      
      <div className="website">
        <div className="navbar">
          <div className="logo">NexusChat</div>
          <div className="nav-links">
            <a href="#features" className="nav-link">Features</a>
            <a href="#about" className="nav-link">About</a>
            <a href="https://elijahfarrell.com" target="_blank" rel="noopener noreferrer" className="nav-link">Dev</a>
          </div>
        </div>

        <div className="hero">
          <h1 className="hero-title">Build connections with NexusChat</h1>
          <p className="hero-subtitle">Real-time messaging platform for modern communication</p>
          
          <div className="buttons">
            <a href="/register" className="btn-primary">Get Started</a>
            <a href="/login" className="btn-secondary">Sign In</a>
          </div>
        </div>

        <div className="features">
          <div className="feature">
            <div className="feature-icon">💬</div>
            <div className="feature-title">Real-time</div>
            <div className="feature-desc">Live messaging</div>
          </div>
          <div className="feature">
            <div className="feature-icon">🔒</div>
            <div className="feature-title">Secure</div>
            <div className="feature-desc">Encrypted chats</div>
          </div>
          <div className="feature">
            <div className="feature-icon">⚡</div>
            <div className="feature-title">Fast</div>
            <div className="feature-desc">Instant delivery</div>
          </div>
          <div className="feature">
            <div className="feature-icon">🎨</div>
            <div className="feature-title">Modern</div>
            <div className="feature-desc">Clean design</div>
          </div>
        </div>

        <div className="about-section">
          <div className="about-title">About NexusChat</div>
          <div className="about-text">
            A modern real-time messaging platform built with React, Socket.IO, and Material-UI. 
            Connect with friends, share messages instantly, and experience seamless communication.
          </div>
        </div>

        <div className="tech-section">
          <div className="tech-title">Built With</div>
          <div className="tech-list">
            React • Socket.IO • Material-UI • Node.js • Express • PostgreSQL
          </div>
        </div>

        <div className="footer">
          Built with React, Socket.IO & Material-UI
        </div>
      </div>
    </div>
  )
}
