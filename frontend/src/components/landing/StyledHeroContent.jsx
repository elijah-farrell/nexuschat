import React from 'react'
import { Box, Typography, Button } from '@mui/material'
import { useNavigate } from 'react-router-dom'
// Colors are now hardcoded for better performance

// NexusChat Logo component using the new logo image
const CustomHubIcon = ({ size = 48 }) => (
  <Box
    sx={{
      width: size,
      height: size,
      backgroundImage: 'url(/nexuschatlogo.png)',
      backgroundSize: 'contain',
      backgroundRepeat: 'no-repeat',
      backgroundPosition: 'center',
      borderRadius: '12px',
      filter: 'drop-shadow(0 4px 8px rgba(59, 130, 246, 0.3))',
    }}
  />
);

const StyledHeroContent = ({ mode, setMode }) => {
  const navigate = useNavigate()

  // Clean Telegram-inspired colors
  const textColor = mode === 'dark' ? '#FFFFFF' : '#1F1F1F'
  const accentColor = '#3B82F6'
  const secondaryColor = '#2563EB'  // Changed from green to darker blue
  const smallTextColor = mode === 'dark' ? '#B9BBBE' : '#606060'

  return (
    <Box sx={{ 
      color: textColor, 
      fontFamily: 'Inter, sans-serif',
      lineHeight: 1.3,
      userSelect: 'none',
      maxWidth: '600px',
      mx: 'auto'
    }}>
      {/* Decorative accent squares */}
      <Box sx={{ display: 'flex', gap: 1, mb: 4, justifyContent: 'center' }}>
        <Box sx={{ width: 8, height: 8, bgcolor: accentColor, borderRadius: 0.5 }} />
        <Box sx={{ width: 8, height: 8, bgcolor: secondaryColor, borderRadius: 0.5 }} />
        <Box sx={{ width: 8, height: 8, bgcolor: accentColor, borderRadius: 0.5 }} />
      </Box>

      {/* Date */}
      <Typography 
        sx={{ 
          fontSize: 11, 
          fontWeight: 600, 
          letterSpacing: '0.15em',
          color: smallTextColor,
          mb: 4,
          textAlign: 'center'
        }}
      >
        EST. 2025
      </Typography>

      {/* Category header */}
      <Box sx={{ textAlign: 'center', mb: 5 }}>
        <Typography 
          sx={{ 
            fontSize: 12, 
            fontWeight: 700, 
            letterSpacing: '0.2em',
            color: accentColor,
            mb: 0.5
          }}
        >
          REAL-TIME MESSAGING
        </Typography>
        <Typography 
          sx={{ 
            fontSize: 10, 
            fontWeight: 500, 
            letterSpacing: '0.1em',
            color: smallTextColor
          }}
        >
          FOR MODERN COMMUNICATION
        </Typography>
      </Box>

      {/* Modus operandi */}
      <Typography 
        sx={{ 
          fontSize: 16, 
          fontWeight: 500, 
          letterSpacing: '0.05em',
          color: textColor,
          mb: 1
        }}
      >
        MODUS OPERANDI
      </Typography>
      <Typography 
        sx={{ 
          fontSize: 16, 
          fontWeight: 500, 
          letterSpacing: '0.05em',
          color: textColor,
          mb: 6
        }}
      >
        FOR THE CONNECTION OF MINDS
      </Typography>

      {/* Main title with logo */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2, mb: 3 }}>
        <CustomHubIcon size={48} />
        <Typography 
          sx={{ 
            fontSize: 48, 
            fontWeight: 800, 
            letterSpacing: '-0.02em',
            color: accentColor,
            lineHeight: 1.1,
            '@media (max-width: 768px)': {
              fontSize: 36
            }
          }}
        >
          NexusChat
        </Typography>
      </Box>

      {/* Main content paragraphs */}
      <Typography 
        sx={{ 
          fontSize: 42, 
          fontWeight: 700, 
          letterSpacing: '-0.01em',
          color: textColor,
          mb: 2,
          lineHeight: 1.2,
          textAlign: 'center',
          '@media (max-width: 768px)': {
            fontSize: 32
          }
        }}
      >
        Build connections with
      </Typography>
      <Typography 
        sx={{ 
          fontSize: 42, 
          fontWeight: 700, 
          letterSpacing: '-0.01em',
          color: textColor,
          mb: 2,
          lineHeight: 1.2,
          textAlign: 'center',
          '@media (max-width: 768px)': {
            fontSize: 32
          }
        }}
      >
        modern real-time
      </Typography>
      <Typography 
        sx={{ 
          fontSize: 42, 
          fontWeight: 700, 
          letterSpacing: '-0.01em',
          color: textColor,
          mb: 4,
          lineHeight: 1.2,
          textAlign: 'center',
          '@media (max-width: 768px)': {
            fontSize: 32
          }
        }}
      >
        messaging platform
      </Typography>

      {/* Subtitle */}
      <Typography 
        sx={{ 
          fontSize: 18, 
          fontWeight: 400, 
          letterSpacing: '0.01em',
          color: smallTextColor,
          mb: 6,
          lineHeight: 1.5,
          textAlign: 'center',
          maxWidth: '400px',
          mx: 'auto'
        }}
      >
        Secure, fast, and beautiful communication for teams and individuals
      </Typography>

      {/* Action buttons */}
      <Box sx={{ display: 'flex', flexDirection: 'row', gap: 3, mb: 8, justifyContent: 'center' }}>
        <Button
          variant="contained"
          onClick={() => navigate('/register')}
          sx={{
            bgcolor: accentColor,
            color: 'white',
            fontSize: 16,
            fontWeight: 600,
            py: 1.5,
            px: 4,
            borderRadius: 2,
            textTransform: 'none',
            boxShadow: `0 4px 12px #3B82F630`,
            '&:hover': {
              bgcolor: '#2563EB',
              transform: 'translateY(-1px)',
              boxShadow: `0 6px 16px #3B82F640`,
            },
            transition: 'all 0.2s ease'
          }}
        >
          Get Started
        </Button>
        <Button
          variant="outlined"
          onClick={() => navigate('/login')}
          sx={{
            borderColor: mode === 'dark' ? 'rgba(255,255,255,0.4)' : '#E4E4E7',
            color: mode === 'dark' ? 'white' : '#1F1F1F',
            fontSize: 16,
            fontWeight: 600,
            py: 1.5,
            px: 4,
            borderRadius: 2,
            textTransform: 'none',
            '&:hover': {
              borderColor: accentColor,
              color: accentColor,
              bgcolor: mode === 'dark' ? '#3B82F620' : '#3B82F610',
              transform: 'translateY(-1px)',
            },
            transition: 'all 0.2s ease'
          }}
        >
          Sign In
        </Button>
      </Box>

      {/* Features */}
      <Box sx={{ mb: 8 }}>
        <Typography sx={{ 
          fontSize: 16, 
          fontWeight: 700, 
          color: accentColor, 
          mb: 4, 
          textAlign: 'center',
          letterSpacing: '0.1em'
        }}>
          FEATURES
        </Typography>
        <Box sx={{ 
          display: 'grid', 
          gridTemplateColumns: '1fr 1fr', 
          gap: 3,
          '@media (max-width: 768px)': {
            gridTemplateColumns: '1fr'
          }
        }}>
          {[
            { 
              icon: (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M8.5 19H8C4 19 2 17 2 13V8C2 4 4 2 8 2H16C20 2 22 4 22 8V13C22 17 20 19 16 19H15.5C15.19 19 14.89 19.15 14.7 19.4L13.2 21.4C12.54 22.28 11.46 22.28 10.8 21.4L9.3 19.4C9.14 19.18 8.77 19 8.5 19Z" stroke="#3B82F6" strokeWidth="1.5" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M15.9965 11H16.0054" stroke="#3B82F6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M11.9955 11H12.0045" stroke="#3B82F6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M7.99451 11H8.00349" stroke="#3B82F6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              ), 
              title: 'Real-time', 
              desc: 'Live messaging' 
            },
            { 
              icon: (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M6 10V8C6 5.79086 7.79086 4 10 4H14C16.2091 4 18 5.79086 18 8V10M6 10C4.89543 10 4 10.8954 4 12V18C4 19.1046 4.89543 20 6 20H18C19.1046 20 20 19.1046 20 18V12C20 10.8954 19.1046 10 18 10M6 10H18M12 14V16" stroke="#3B82F6" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              ), 
              title: 'Secure', 
              desc: 'Encrypted chats' 
            },
            { 
              icon: (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M13 2L3 14H12L11 22L21 10H12L13 2Z" stroke="#3B82F6" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              ), 
              title: 'Fast', 
              desc: 'Instant delivery' 
            },
            { 
              icon: (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 2L13.09 8.26L20 9L13.09 9.74L12 16L10.91 9.74L4 9L10.91 8.26L12 2Z" stroke="#3B82F6" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M5 3L6 6L9 7L6 8L5 11L4 8L1 7L4 6L5 3Z" stroke="#3B82F6" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M19 3L20 6L23 7L20 8L19 11L18 8L15 7L18 6L19 3Z" stroke="#3B82F6" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              ), 
              title: 'Modern', 
              desc: 'Clean design' 
            }
          ].map((feature, i) => (
            <Box key={i} sx={{ 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center', 
              textAlign: 'center',
              p: 2,
              borderRadius: 2,
              bgcolor: 'rgba(255,255,255,0.05)',
              backdropFilter: 'blur(10px)'
            }}>
              <Box sx={{ mb: 1 }}>{feature.icon}</Box>
              <Typography sx={{ 
                fontSize: 16, 
                fontWeight: 600, 
                color: textColor,
                mb: 0.5
              }}>
                {feature.title}
              </Typography>
              <Typography sx={{ 
                fontSize: 12, 
                color: smallTextColor,
                fontWeight: 400
              }}>
                {feature.desc}
              </Typography>
            </Box>
          ))}
        </Box>
      </Box>

      {/* Tech Stack */}
      <Box sx={{ mb: 8, textAlign: 'center' }}>
        <Typography sx={{ 
          fontSize: 16, 
          fontWeight: 700, 
          color: accentColor, 
          mb: 3,
          letterSpacing: '0.1em'
        }}>
          TECH STACK
        </Typography>
        <Box sx={{ 
          display: 'flex', 
          flexDirection: 'column', 
          gap: 1.5,
          maxWidth: '400px',
          mx: 'auto'
        }}>
          <Typography sx={{ fontSize: 13, color: smallTextColor, fontWeight: 500 }}>
            <strong style={{color: textColor}}>Frontend:</strong> React 18, Vite, Material-UI, Three.js
          </Typography>
          <Typography sx={{ fontSize: 13, color: smallTextColor, fontWeight: 500 }}>
            <strong style={{color: textColor}}>Real-time:</strong> Socket.IO, React Router
          </Typography>
          <Typography sx={{ fontSize: 13, color: smallTextColor, fontWeight: 500 }}>
            <strong style={{color: textColor}}>Backend:</strong> Node.js, Express, JWT, Bcrypt, CORS
          </Typography>
          <Typography sx={{ fontSize: 13, color: smallTextColor, fontWeight: 500 }}>
            <strong style={{color: textColor}}>Database:</strong> PostgreSQL
          </Typography>
        </Box>
      </Box>

      {/* Footer */}
      <Box sx={{ 
        textAlign: 'center',
        borderTop: '1px solid rgba(255,255,255,0.1)',
        pt: 6,
        mt: 6
      }}>
        <Typography 
          sx={{ 
            fontSize: 14, 
            fontWeight: 500, 
            color: smallTextColor,
            mb: 2
          }}
        >
          Developed by
        </Typography>
        <Typography 
          sx={{ 
            fontSize: 16, 
            fontWeight: 600, 
            color: accentColor
          }}
        >
          Elijah Farrell
        </Typography>
      </Box>
    </Box>
  )
}

export default StyledHeroContent
