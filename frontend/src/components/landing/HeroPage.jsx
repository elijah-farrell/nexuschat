import React, { useState, useRef } from 'react'

export default function NexusChatHeroPage({ mode = 'light' }) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const contentRef = useRef(null)



  const scrollToSection = (sectionId) => {
    const container = contentRef.current
    const element = container?.querySelector(`#${sectionId}`)
    if (element && container) {
      const elementTop = element.offsetTop
      container.scrollTo({
        top: elementTop - 20,
        behavior: 'smooth'
      })
    }
    setIsDropdownOpen(false)
  }

  return (
    <div ref={contentRef} className="content">
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
          color: ${mode === 'dark' ? 'white' : 'black'};
          background: ${mode === 'dark' 
            ? 'linear-gradient(135deg, #0F0F23 0%, #1E1B4B 50%, #312E81 100%)'
            : 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 50%, #A855F7 100%)'};
        }

        .content {
          width: 334px;
          height: 216px;
          background: transparent;
          border-radius: 3px;
          overflow-y: auto;
          padding: 0;
          font-family: inter;
        }

        .website {
          padding: 15px;
          background: ${mode === 'dark' 
            ? 'rgba(30, 27, 75, 0.9)' 
            : 'rgba(255, 255, 255, 0.95)'};
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          min-height: 300px;
          border-radius: 0;
        }

        .navbar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
          padding-bottom: 10px;
          border-bottom: 1px solid ${mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : '#e5e7eb'};
          position: relative;
        }

        .logo {
          font-size: 18px;
          font-weight: bold;
          color: #4f46e5;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .nav-menu {
          position: relative;
        }

        .nav-toggle {
          background: none;
          border: none;
          font-size: 16px;
          cursor: pointer;
          color: #6b7280;
          padding: 4px;
        }

        .nav-dropdown {
          position: absolute;
          top: 100%;
          right: 0;
          background: ${mode === 'dark' ? 'rgba(30, 27, 75, 0.95)' : 'white'};
          backdrop-filter: blur(20px);
          border: 1px solid ${mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : '#e5e7eb'};
          border-radius: 6px;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
          min-width: 120px;
          z-index: 10;
          display: ${isDropdownOpen ? 'block' : 'none'};
        }

        .nav-dropdown a {
          display: block;
          padding: 8px 12px;
          color: ${mode === 'dark' ? 'rgba(255, 255, 255, 0.8)' : '#6b7280'};
          text-decoration: none;
          font-size: 11px;
          border-bottom: 1px solid ${mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : '#f3f4f6'};
          cursor: pointer;
        }

        .nav-dropdown a:last-child {
          border-bottom: none;
        }

        .nav-dropdown a:hover {
          background: ${mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : '#f9fafb'};
          color: ${mode === 'dark' ? 'white' : '#374151'};
        }

        .nav-dropdown-buttons {
          display: flex;
          flex-direction: column;
          gap: 4px;
          padding: 8px 12px;
          border-top: 1px solid ${mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : '#f3f4f6'};
        }

        .nav-btn {
          padding: 4px 8px;
          border-radius: 4px;
          text-decoration: none;
          font-size: 9px;
          font-weight: 500;
          text-align: center;
        }

        .nav-btn-primary {
          background: #6366F1;
          color: white !important;
          transition: all 0.2s ease;
        }

        .nav-btn-primary:hover {
          background: #8B5CF6 !important;
          color: white !important;
          transform: translateY(-1px);
          box-shadow: 0 2px 4px rgba(99, 102, 241, 0.3);
        }

        .nav-btn-primary:hover,
        .nav-btn-primary:hover a {
          color: white !important;
        }

        .nav-btn-secondary {
          background: ${mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'white'};
          color: #6366F1;
          border: 1px solid ${mode === 'dark' ? 'rgba(255, 255, 255, 0.2)' : '#d1d5db'};
          transition: all 0.2s ease;
        }

        .nav-btn-secondary:hover {
          background: ${mode === 'dark' ? 'rgba(255, 255, 255, 0.2)' : '#f9fafb'};
          border-color: #6366F1;
          transform: translateY(-1px);
          box-shadow: 0 2px 4px rgba(99, 102, 241, 0.1);
        }

        .hero {
          text-align: center;
          margin-bottom: 20px;
        }

        .hero-title {
          font-size: 16px;
          font-weight: bold;
          color: ${mode === 'dark' ? 'white' : '#111827'};
          margin-bottom: 8px;
        }

        .hero-subtitle {
          font-size: 12px;
          color: ${mode === 'dark' ? 'rgba(255, 255, 255, 0.8)' : '#6b7280'};
          margin-bottom: 15px;
        }

        .buttons {
          display: flex;
          gap: 10px;
          justify-content: center;
          margin-bottom: 20px;
        }

        .btn-primary {
          background: #6366F1;
          color: white;
          padding: 6px 12px;
          border-radius: 4px;
          text-decoration: none;
          font-size: 11px;
          font-weight: 500;
          transition: all 0.2s ease;
        }

        .btn-primary:hover {
          background: #8B5CF6;
          transform: translateY(-1px);
          box-shadow: 0 2px 4px rgba(99, 102, 241, 0.3);
        }

        .btn-secondary {
          background: ${mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'white'};
          color: #6366F1;
          padding: 6px 12px;
          border-radius: 4px;
          text-decoration: none;
          font-size: 11px;
          font-weight: 500;
          border: 1px solid ${mode === 'dark' ? 'rgba(255, 255, 255, 0.2)' : '#d1d5db'};
          transition: all 0.2s ease;
        }

        .btn-secondary:hover {
          border-color: #6366F1;
          transform: translateY(-1px);
          box-shadow: 0 2px 4px rgba(99, 102, 241, 0.1);
        }

        .features {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 10px;
          margin-bottom: 20px;
        }

        .feature {
          background: ${mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : '#f9fafb'};
          padding: 10px;
          border-radius: 6px;
          border: 1px solid ${mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : '#e5e7eb'};
          text-align: center;
        }

        .feature-icon {
          font-size: 16px;
          margin-bottom: 5px;
        }

        .feature-title {
          font-size: 10px;
          font-weight: 600;
          color: ${mode === 'dark' ? 'white' : '#111827'};
          margin-bottom: 3px;
        }

        .feature-desc {
          font-size: 9px;
          color: ${mode === 'dark' ? 'rgba(255, 255, 255, 0.8)' : '#6b7280'};
        }

        .about-section {
          margin-bottom: 20px;
          padding: 15px;
          background: ${mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : '#f9fafb'};
          border-radius: 6px;
          border: 1px solid ${mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : '#e5e7eb'};
        }

        .about-title {
          font-size: 12px;
          font-weight: 600;
          color: ${mode === 'dark' ? 'white' : '#111827'};
          margin-bottom: 8px;
        }

        .about-text {
          font-size: 10px;
          color: ${mode === 'dark' ? 'rgba(255, 255, 255, 0.8)' : '#6b7280'};
          line-height: 1.4;
        }

        .tech-section {
          margin-bottom: 20px;
          padding: 15px;
          background: ${mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : '#f9fafb'};
          border-radius: 6px;
          border: 1px solid ${mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : '#e5e7eb'};
        }

        .tech-title {
          font-size: 12px;
          font-weight: 600;
          color: ${mode === 'dark' ? 'white' : '#111827'};
          margin-bottom: 8px;
        }

        .tech-list {
          font-size: 10px;
          color: ${mode === 'dark' ? 'rgba(255, 255, 255, 0.8)' : '#6b7280'};
        }

        .deployment-section {
          margin-bottom: 20px;
          padding: 15px;
          background: ${mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : '#f9fafb'};
          border-radius: 6px;
          border: 1px solid ${mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : '#e5e7eb'};
        }

        .deployment-title {
          font-size: 12px;
          font-weight: 600;
          color: ${mode === 'dark' ? 'white' : '#111827'};
          margin-bottom: 8px;
        }

        .deployment-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 8px;
          margin-top: 8px;
        }

        .deployment-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 8px;
          background: ${mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'white'};
          border-radius: 4px;
          border: 1px solid ${mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : '#e5e7eb'};
          text-align: center;
        }

        .deployment-icon {
          font-size: 14px;
          margin-bottom: 4px;
        }

        .deployment-name {
          font-size: 8px;
          font-weight: 500;
          color: ${mode === 'dark' ? 'rgba(255, 255, 255, 0.8)' : '#374151'};
        }

        .footer {
          text-align: center;
          font-size: 9px;
          color: ${mode === 'dark' ? 'rgba(255, 255, 255, 0.6)' : '#9ca3af'};
          margin-top: 15px;
          padding-top: 10px;
          border-top: 1px solid ${mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : '#e5e7eb'};
        }
      `}</style>
      
      <div className="website">
        <div className="navbar">
          <div className="logo">
            <svg width="35" height="35" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <linearGradient id="heroGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" style={{ stopColor: '#6366F1', stopOpacity: 1 }} />
                  <stop offset="100%" style={{ stopColor: '#8B5CF6', stopOpacity: 1 }} />
                </linearGradient>
              </defs>
              
              {/* Background circle with gradient */}
              <circle cx="16" cy="16" r="15" fill="url(#heroGradient)" stroke="rgba(255,255,255,0.2)" strokeWidth="1"/>
              
              {/* Hub icon */}
              <g transform="translate(8, 8)" fill="white">
                {/* Center circle */}
                <circle cx="8" cy="8" r="3" fill="white"/>
                
                {/* Connection lines */}
                <rect x="7" y="2" width="2" height="4" rx="1" fill="white"/>
                <rect x="7" y="10" width="2" height="4" rx="1" fill="white"/>
                <rect x="2" y="7" width="4" height="2" rx="1" fill="white"/>
                <rect x="10" y="7" width="4" height="2" rx="1" fill="white"/>
                
                {/* Corner dots */}
                <circle cx="4" cy="4" r="1.5" fill="white"/>
                <circle cx="12" cy="4" r="1.5" fill="white"/>
                <circle cx="4" cy="12" r="1.5" fill="white"/>
                <circle cx="12" cy="12" r="1.5" fill="white"/>
              </g>
            </svg>
          </div>
          <div className="nav-menu">
            <button 
              className="nav-toggle" 
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            >
              ☰
            </button>
            <div className="nav-dropdown">
              <a onClick={() => scrollToSection('features')}>Features</a>
              <a onClick={() => scrollToSection('about')}>About</a>
              <a onClick={() => scrollToSection('tech')}>Tech Stack</a>
              <a onClick={() => scrollToSection('deployment')}>Deployment</a>
              <a href="https://elijahfarrell.com" target="_blank" rel="noopener noreferrer">Portfolio</a>
              <div className="nav-dropdown-buttons">
                <a href="/login" className="nav-btn nav-btn-secondary">Sign In</a>
                <a href="/register" className="nav-btn nav-btn-primary">Sign Up</a>
              </div>
            </div>
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

        <div id="features" className="features">
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

        <div id="about" className="about-section">
          <div className="about-title">About NexusChat</div>
          <div className="about-text">
            NexusChat is a modern real-time messaging platform designed for seamless communication. 
            Built with cutting-edge technologies, it offers instant messaging, secure conversations, 
            and a beautiful user interface. Perfect for staying connected with friends and colleagues.
          </div>
        </div>

        <div id="tech" className="tech-section">
          <div className="tech-title">Tech Stack</div>
          <div className="tech-list">
            <strong>Frontend:</strong> React 18, Vite, Material-UI, Three.js<br/>
            <strong>Real-time:</strong> Socket.IO, React Router<br/>
            <strong>Backend:</strong> Node.js, Express, JWT, Bcrypt, CORS<br/>
            <strong>Database:</strong> PostgreSQL
          </div>
        </div>

        <div id="deployment" className="deployment-section">
          <div className="deployment-title">Deployed On</div>
          <div className="deployment-grid">
            <div className="deployment-item">
              <div className="deployment-icon">▲</div>
              <div className="deployment-name">Vercel</div>
            </div>
            <div className="deployment-item">
              <div className="deployment-icon">⚡</div>
              <div className="deployment-name">Supabase</div>
            </div>
            <div className="deployment-item">
              <div className="deployment-icon">🚀</div>
              <div className="deployment-name">Render</div>
            </div>
          </div>
        </div>

        <div className="footer">
          Developed by Elijah Farrell
        </div>
      </div>
    </div>
  )
}
