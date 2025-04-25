import { useState } from 'react';
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  List,
  Typography,
  IconButton,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Avatar,
  useTheme,
  alpha,
  styled,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import DashboardIcon from '@mui/icons-material/Dashboard';
import TokenIcon from '@mui/icons-material/Token';
import CampaignIcon from '@mui/icons-material/Campaign';
import EventIcon from '@mui/icons-material/Event';
import PeopleIcon from '@mui/icons-material/People';
import { Link, Outlet, useLocation } from 'react-router-dom';

const drawerWidth = 280;

const StyledAppBar = styled(AppBar)(() => ({
  backgroundImage: 'linear-gradient(135deg, rgba(26, 22, 37, 0.98) 0%, rgba(19, 17, 28, 0.98) 100%)',
  backdropFilter: 'blur(10px)',
  borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
  boxShadow: 'none'
}));

const StyledDrawer = styled(Drawer)(({ theme }) => ({
  width: drawerWidth,
  flexShrink: 0,
  whiteSpace: 'nowrap',
  transition: theme.transitions.create('transform', {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  '& .MuiDrawer-paper': {
    width: drawerWidth,
    boxSizing: 'border-box',
    backgroundImage: 'linear-gradient(135deg, #1A1625 0%, #13111C 100%)',
    borderRight: '1px solid rgba(255, 255, 255, 0.1)',
  },
}));

interface StyledListItemButtonProps {
  to: string;
  selected: boolean;
  component?: React.ElementType;
}

const StyledListItemButtonWithLink = styled(ListItemButton)<StyledListItemButtonProps>(({ theme }) => ({
  margin: '4px 0',
  borderRadius: theme.shape.borderRadius,
  '&.Mui-selected': {
    backgroundColor: alpha(theme.palette.primary.main, 0.15),
    '&:hover': {
      backgroundColor: alpha(theme.palette.primary.main, 0.25),
    },
    '& .MuiListItemIcon-root': {
      color: theme.palette.primary.main,
    },
    '& .MuiListItemText-primary': {
      color: theme.palette.primary.main,
      fontWeight: 600,
    },
  },
  '&:hover': {
    backgroundColor: alpha(theme.palette.common.white, 0.05),
  },
}));

const menuItems = [
  { text: 'Dashboard', icon: <DashboardIcon />, path: '/' },
  { text: 'Athlete Tokens', icon: <TokenIcon />, path: '/athletes' },
  { text: 'FTOs', icon: <CampaignIcon />, path: '/ftos' },
  { text: 'Events', icon: <EventIcon />, path: '/events' },
  { text: 'Users', icon: <PeopleIcon />, path: '/users' },
];

export default function Layout() {
  const theme = useTheme();
  const [open, setOpen] = useState(true);
  const location = useLocation();

  const handleDrawerOpen = () => {
    setOpen(true);
  };

  const handleDrawerClose = () => {
    setOpen(false);
  };

  const drawer = (
    <Box>
      <Box sx={{ 
        p: 3, 
        display: 'flex', 
        alignItems: 'center', 
        gap: 2,
        backgroundImage: 'linear-gradient(135deg, #9C27B0 0%, #6A1B9A 100%)',
        color: 'white',
        borderRadius: '0 0 24px 0',
        mb: 2,
      }}>
        <Avatar 
          sx={{ 
            width: 48, 
            height: 48,
            bgcolor: 'rgba(255, 255, 255, 0.2)',
            border: '2px solid rgba(255, 255, 255, 0.5)',
          }}
        >
          AT
        </Avatar>
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Token Admin
          </Typography>
          <Typography variant="caption" sx={{ opacity: 0.8 }}>
            Athlete Fan Token Platform
          </Typography>
        </Box>
      </Box>
      <List sx={{ px: 2, py: 1 }}>
        {menuItems.map((item) => (
          <StyledListItemButtonWithLink
            key={item.text}
            to={item.path}
            selected={location.pathname.startsWith(item.path)}
            component={Link}
          >
            <ListItemIcon sx={{ color: 'text.secondary', minWidth: 40 }}>
              {item.icon}
            </ListItemIcon>
            <ListItemText 
              primary={item.text}
              primaryTypographyProps={{
                fontSize: '0.95rem',
              }}
            />
          </StyledListItemButtonWithLink>
        ))}
      </List>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex',  bgcolor: 'background.default' }}>
      <StyledAppBar position="fixed">
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            onClick={handleDrawerOpen}
            edge="start"
            sx={{ mr: 2, ...(open && { display: 'none' }) }}
          >
            <MenuIcon />
          </IconButton>
          <Box sx={{ flexGrow: 1 }} />
          <Box sx={{ display: 'flex', gap: 1 }}>
         
          </Box>
        </Toolbar>
      </StyledAppBar>
      <StyledDrawer
            variant="persistent"
            anchor="left"
            open={open}
            sx={{
              display: open ? 'block' : 'none',
            }}
>
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'flex-end',
          p: 1,
        }}>
          <IconButton onClick={handleDrawerClose}>
            <ChevronLeftIcon />
          </IconButton>
        </Box>
        {drawer}
      </StyledDrawer>
      <Box
  component="main"
  sx={{
    flexGrow: 1,
    p: 3,
    transition: theme.transitions.create(['margin', 'width'], {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.leavingScreen,
    }),
    marginLeft: open ? `0` : `10vw`,
    justifyContent:"center",
    alignItems:"center",
    width: open ? `80vw` : '80vw',
  }}
>
        <Toolbar />
        <Outlet />
      </Box>

    </Box>
  );
}
