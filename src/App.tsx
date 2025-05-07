import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import CompanyList from './components/companies/CompanyList';
import CreateCompany from './components/companies/CreateCompany';
import LocationList from './components/locations/LocationList';
import CreateLocation from './components/locations/CreateLocation';
import MapView from './components/map/MapView';
import AnalyticsView from './components/analytics/AnalyticsView';
import UserList from './components/UserList';
import CreateUser from './components/CreateUser';
import JobsList from './components/jobs/JobsList';
import { createTheme, ThemeProvider } from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';

const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#1792B6',
      light: '#30B2D7',
      dark: '#107895',
      contrastText: '#fff'
    },
    secondary: {
      main: '#146E88',
      light: '#1E8BA9',
      dark: '#0C5167',
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
          backgroundImage: 'linear-gradient(135deg, #1792B6 0%, #146E88 100%)',
          '&:hover': {
            backgroundImage: 'linear-gradient(135deg, #30B2D7 0%, #1E8BA9 100%)'
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
              <Route index element={<Navigate to="/analytics" replace />} />
              <Route path="map" element={<MapView />} />
              <Route path="companies" element={<CompanyList />} />
              <Route path="companies/create" element={<CreateCompany />} />
              <Route path="companies/edit/:id" element={<CreateCompany />} />
              <Route path="locations" element={<LocationList />} />
              <Route path="locations/create" element={<CreateLocation />} />
              <Route path="analytics" element={<AnalyticsView />} />
              <Route path="users" element={<UserList />} />
              <Route path="users/create" element={<CreateUser />} />
              <Route path="jobs" element={<JobsList />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </LocalizationProvider>
    </ThemeProvider>
  );
}

export default App;
