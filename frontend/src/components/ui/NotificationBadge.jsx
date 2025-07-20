import React from 'react';
import { Box, Typography } from '@mui/material';

const NotificationBadge = ({ count, size = 'small', color = '#ED4245' }) => {
  if (count === 0) return null;

  const getBadgeSize = () => {
    switch (size) {
      case 'small':
        return { width: 16, height: 16, fontSize: '0.625rem' };
      case 'medium':
        return { width: 20, height: 20, fontSize: '0.75rem' };
      case 'large':
        return { width: 24, height: 24, fontSize: '0.875rem' };
      default:
        return { width: 16, height: 16, fontSize: '0.625rem' };
    }
  };

  const badgeSize = getBadgeSize();

  return (
    <Box
      sx={{
        position: 'absolute',
        top: -4,
        right: -4,
        width: badgeSize.width,
        height: badgeSize.height,
        borderRadius: '50%',
        backgroundColor: color,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        border: '2px solid',
        borderColor: '#2F3136',
        zIndex: 1,
        minWidth: badgeSize.width,
        boxSizing: 'border-box',
      }}
    >
      <Typography
        variant="caption"
        sx={{
          color: 'white',
          fontSize: badgeSize.fontSize,
          fontWeight: 'bold',
          lineHeight: 1,
          textAlign: 'center',
        }}
      >
        {count > 99 ? '99+' : count}
      </Typography>
    </Box>
  );
};

export default NotificationBadge; 