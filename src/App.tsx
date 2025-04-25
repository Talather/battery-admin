import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import CreateAthleteToken from './components/athletes/CreateAthleteToken';
import AthleteTokenList from './components/athletes/AthleteTokenList';
import CreateFTO from './components/ftos/CreateFTO';
import FTOList from './components/ftos/FTOList';
import EventList from './components/events/EventList';
import CreateEvent from './components/events/CreateEvent';
import SubmissionsList from './components/submissions/SubmissionsList';
import UserList from './components/UserList';
import { createTheme, ThemeProvider } from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';

const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#9C27B0',
      light: '#BA68C8',
      dark: '#7B1FA2',
      contrastText: '#fff'
    },
    secondary: {
      main: '#6A1B9A',
      light: '#8E24AA',
      dark: '#4A148C',
      contrastText: '#fff'
    },
    background: {
      default: '#13111C',
      paper: '#1A1625'
    },
    text: {
      primary: '#fff',
      secondary: 'rgba(255, 255, 255, 0.7)'
    },
    divider: 'rgba(255, 255, 255, 0.12)',
    error: {
      main: '#FF5252',
      light: '#FF867C',
      dark: '#D32F2F'
    },
    success: {
      main: '#69F0AE',
      light: '#B9F6CA',
      dark: '#00C853'
    }
  },
  shape: {
    borderRadius: 12
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontWeight: 700
    },
    h2: {
      fontWeight: 700
    },
    h3: {
      fontWeight: 700
    },
    h4: {
      fontWeight: 600
    },
    h5: {
      fontWeight: 600
    },
    h6: {
      fontWeight: 600
    }
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: 8,
          fontWeight: 600,
          boxShadow: 'none',
          '&:hover': {
            boxShadow: 'none'
          }
        },
        contained: {
          backgroundImage: 'linear-gradient(135deg, #9C27B0 0%, #6A1B9A 100%)',
          '&:hover': {
            backgroundImage: 'linear-gradient(135deg, #BA68C8 0%, #8E24AA 100%)'
          }
        }
      }
    },
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundImage: 'linear-gradient(135deg, rgba(26, 22, 37, 0.95) 0%, rgba(19, 17, 28, 0.95) 100%)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.1)'
        }
      }
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'linear-gradient(135deg, rgba(26, 22, 37, 0.95) 0%, rgba(19, 17, 28, 0.95) 100%)',
          backdropFilter: 'blur(10px)'
        }
      }
    }
  }
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <LocalizationProvider dateAdapter={AdapterDateFns}>
        <BrowserRouter>
          <Routes>
            <Route path="/*" element={<Layout />}>
              <Route index element={<Navigate to="/athletes" replace />} />
              <Route path="athletes" element={<AthleteTokenList />} />
              <Route path="athletes/create" element={<CreateAthleteToken />} />
              <Route path="ftos" element={<FTOList />} />
              <Route path="ftos/create" element={<CreateFTO />} />
              <Route path="events" element={<EventList />} />
              <Route path="create-event" element={<CreateEvent />} />
              <Route path="submissions/:eventId" element={<SubmissionsList />} />
              <Route path="users" element={<UserList />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </LocalizationProvider>
    </ThemeProvider>
  );
}

export default App;
