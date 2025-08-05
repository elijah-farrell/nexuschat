import React from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  Container,
  Grid,
  Card,
  CardContent,
  CardActions,
  Chip,
  Avatar,
  Divider,
} from '@mui/material';
import {
  Construction as ConstructionIcon,
  Message as MessageIcon,
  Group as GroupIcon,
  Settings as SettingsIcon,
  Add as AddIcon,
  Star as StarIcon,
} from '@mui/icons-material';

const Servers = () => {
  const handleContact = () => {
    // You can customize this to open email, Discord, or any contact method
    window.open('mailto:elijah.farrell@example.com?subject=NexusChat Servers Feature Request', '_blank');
  };

  const upcomingFeatures = [
    {
      icon: <GroupIcon />,
      title: 'Create & Join Servers',
      description: 'Create your own communities or join existing ones',
      color: '#5865F2'
    },
    {
      icon: <MessageIcon />,
      title: 'Channel Management',
      description: 'Organize conversations with text and voice channels',
      color: '#57F287'
    },
    {
      icon: <SettingsIcon />,
      title: 'Server Administration',
      description: 'Manage roles, permissions, and server settings',
      color: '#FEE75C'
    },
    {
      icon: <StarIcon />,
      title: 'Collaboration Tools',
      description: 'Share files, create polls, and integrate with other services',
      color: '#ED4245'
    }
  ];

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ textAlign: 'center', mb: 6 }}>
        <ConstructionIcon sx={{ fontSize: 80, color: '#9B59B6', mb: 2 }} />
        <Typography variant="h3" component="h1" gutterBottom sx={{ color: 'text.primary', fontWeight: 'bold' }}>
          Servers Coming Soon!
        </Typography>
        <Typography variant="h6" color="text.secondary" sx={{ mb: 3, maxWidth: 600, mx: 'auto' }}>
          We're working hard to bring you powerful server functionality. 
          Create communities, manage channels, and collaborate with your team.
        </Typography>
        <Chip 
          label="In Development" 
          color="primary" 
          variant="outlined"
          sx={{ fontSize: '1rem', py: 1 }}
        />
      </Box>

      {/* Features Grid */}
      <Grid container spacing={4} sx={{ mb: 6 }}>
        {upcomingFeatures.map((feature, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <Card 
              sx={{ 
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                transition: 'transform 0.2s ease-in-out',
                '&:hover': {
                  transform: 'translateY(-4px)',
                }
              }}
            >
              <CardContent sx={{ flexGrow: 1, textAlign: 'center' }}>
                <Avatar 
                  sx={{ 
                    width: 60, 
                    height: 60, 
                    bgcolor: feature.color,
                    mx: 'auto',
                    mb: 2
                  }}
                >
                  {feature.icon}
                </Avatar>
                <Typography variant="h6" component="h3" gutterBottom sx={{ fontWeight: 'bold' }}>
                  {feature.title}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {feature.description}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Divider sx={{ my: 4 }} />

      {/* Call to Action */}
      <Paper 
        elevation={3} 
        sx={{ 
          p: 4, 
          textAlign: 'center',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white'
        }}
      >
        <Typography variant="h5" component="h2" gutterBottom sx={{ fontWeight: 'bold' }}>
          Want to see this feature implemented?
        </Typography>
        <Typography variant="body1" sx={{ mb: 3, opacity: 0.9 }}>
          We'd love to hear from you! Send us a message if you'd like to see servers implemented 
          or have any other feature requests.
        </Typography>
        <Button
          variant="contained"
          size="large"
          startIcon={<MessageIcon />}
          onClick={handleContact}
          sx={{
            bgcolor: 'white',
            color: '#667eea',
            px: 4,
            py: 1.5,
            fontSize: '1.1rem',
            fontWeight: 'bold',
            '&:hover': {
              bgcolor: '#f5f5f5',
            }
          }}
        >
          Send Feedback
        </Button>
      </Paper>

      {/* Progress Indicator */}
      <Box sx={{ textAlign: 'center', mt: 4 }}>
        <Typography variant="body2" color="text.secondary">
          Development Progress: 25%
        </Typography>
        <Box 
          sx={{ 
            width: '100%', 
            maxWidth: 400, 
            height: 8, 
            bgcolor: '#2F3136', 
            borderRadius: 4, 
            mx: 'auto',
            mt: 1,
            overflow: 'hidden'
          }}
        >
          <Box 
            sx={{ 
              width: '25%', 
              height: '100%', 
              bgcolor: '#9B59B6',
              borderRadius: 4,
              transition: 'width 0.3s ease'
            }} 
          />
        </Box>
      </Box>
    </Container>
  );
};

export default Servers; 