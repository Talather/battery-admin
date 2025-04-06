import { useState, useEffect } from 'react';
import {
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  TextField,
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Avatar,
  Chip,
  Button,
  Tooltip,
  CircularProgress,
  Alert,
  InputAdornment,
  useTheme,
  useMediaQuery,
  TablePagination,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Slider,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import SearchIcon from '@mui/icons-material/Search';
import GridViewIcon from '@mui/icons-material/GridView';
import ViewListIcon from '@mui/icons-material/ViewList';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import EditAthleteToken from './EditAthleteToken';

interface AthleteToken {
  id: string;
  firstName: string;
  lastName: string;
  nickName: string;
  profilePicture: string;
  description: string;
  country: string;
  sport: string;
  dayOfTheWeek: string;
  fanTokenSymbol: string;
  fanTokenInitialPrice: number;
  totalNoOfFanTokens: number;
  created_at: string;
}

interface Filters {
  sport: string;
  country: string;
  priceRange: [number, number];
}

export default function AthleteTokenList() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [athletes, setAthletes] = useState<AthleteToken[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(isMobile ? 5 : 10);
  const [filters, setFilters] = useState<Filters>({
    sport: '',
    country: '',
    priceRange: [0, 1000],
  });
  const [sports, setSports] = useState<string[]>([]);
  const [countries, setCountries] = useState<string[]>([]);
  const [maxPrice, setMaxPrice] = useState(1000);
  const [selectedAthleteId, setSelectedAthleteId] = useState<string | null>(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  useEffect(() => {
    fetchAthletes();
  }, []);

  useEffect(() => {
    setRowsPerPage(isMobile ? 5 : 10);
  }, [isMobile]);

  useEffect(() => {
    if (athletes.length > 0) {
      // Extract unique sports and countries
      const uniqueSports = [...new Set(athletes.map(token => token.sport))];
      const uniqueCountries = [...new Set(athletes.map(token => token.country))];
      const highestPrice = Math.max(...athletes.map(token => token.fanTokenInitialPrice));
      
      setSports(uniqueSports);
      setCountries(uniqueCountries);
      setMaxPrice(highestPrice);
      setFilters(prev => ({ ...prev, priceRange: [0, highestPrice] }));
    }
  }, [athletes]);

  const fetchAthletes = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('Atheletes')
        .select('*')
        .order('created_at', { ascending: false })
      if (error) throw error;
      setAthletes(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred while fetching athletes');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this athlete token?')) {
      try {
        const { error } = await supabase
          .from('Atheletes')
          .delete()
          .eq('id', id);
        
        if (error) throw error;
        setAthletes(athletes.filter(athlete => athlete.id !== id));
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred while deleting the athlete');
      }
    }
  };

  const handleEdit = (athleteId: string) => {
    setSelectedAthleteId(athleteId);
    setEditModalOpen(true);
  };

  const handleEditClose = () => {
    setEditModalOpen(false);
    setSelectedAthleteId(null);
  };

  const filterAthleteTokens = (tokens: AthleteToken[]) => {
    return tokens.filter(token => {
      const matchesSearch = 
        token.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        token.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        token.fanTokenSymbol.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesSport = !filters.sport || token.sport === filters.sport;
      const matchesCountry = !filters.country || token.country === filters.country;
      const matchesPriceRange = 
        token.fanTokenInitialPrice >= filters.priceRange[0] &&
        token.fanTokenInitialPrice <= filters.priceRange[1];

      return matchesSearch && matchesSport && matchesCountry && matchesPriceRange;
    });
  };

  const handleFilterChange = (filterName: keyof Filters, value: any) => {
    setFilters(prev => ({ ...prev, [filterName]: value }));
    setPage(0);
  };

  const renderFilters = () => (
    <Box sx={{ mb: 3, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
      <FormControl sx={{ minWidth: 200 }}>
        <InputLabel>Sport</InputLabel>
        <Select
          value={filters.sport}
          onChange={(e) => handleFilterChange('sport', e.target.value)}
          label="Sport"
        >
          <MenuItem value="">All Sports</MenuItem>
          {sports.map(sport => (
            <MenuItem key={sport} value={sport}>{sport}</MenuItem>
          ))}
        </Select>
      </FormControl>

      <FormControl sx={{ minWidth: 200 }}>
        <InputLabel>Country</InputLabel>
        <Select
          value={filters.country}
          onChange={(e) => handleFilterChange('country', e.target.value)}
          label="Country"
        >
          <MenuItem value="">All Countries</MenuItem>
          {countries.map(country => (
            <MenuItem key={country} value={country}>{country}</MenuItem>
          ))}
        </Select>
      </FormControl>

      <Box sx={{ width: 300 }}>
        <Typography gutterBottom>Price Range</Typography>
        <Slider
          value={filters.priceRange}
          onChange={(_, value) => handleFilterChange('priceRange', value)}
          valueLabelDisplay="auto"
          min={0}
          max={maxPrice}
          sx={{ mt: 1 }}
        />
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
          <Typography variant="body2" color="text.secondary">
            ${filters.priceRange[0]}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            ${filters.priceRange[1]}
          </Typography>
        </Box>
      </Box>
    </Box>
  );

  const handleChangePage = (_: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const paginatedAthletes = filterAthleteTokens(athletes).slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Paper 
      elevation={2} 
      sx={{ 
        p: { xs: 2, sm: 3 },
        bgcolor: 'background.default',
        borderRadius: 2,
      }}
    >
      <Box sx={{ mb: 4 }}>
        <Box sx={{ 
          display: 'flex', 
          flexDirection: { xs: 'column', sm: 'row' }, 
          justifyContent: 'space-between',
          alignItems: { xs: 'stretch', sm: 'center' },
          gap: 2,
        }}>
          <Typography variant="h5" sx={{ fontWeight: 600 }}>
            Athlete Fan Tokens
          </Typography>
          <Box sx={{ 
            display: 'flex', 
            gap: 1,
            flexDirection: { xs: 'column', sm: 'row' },
          }}>
            <Button
              variant={viewMode === 'grid' ? 'contained' : 'outlined'}
              onClick={() => setViewMode('grid')}
              startIcon={<GridViewIcon />}
              fullWidth={isMobile}
            >
              Grid
            </Button>
            <Button
              variant={viewMode === 'table' ? 'contained' : 'outlined'}
              onClick={() => setViewMode('table')}
              startIcon={<ViewListIcon />}
              fullWidth={isMobile}
            >
              Table
            </Button>
            <Button
              variant="contained"
              color="primary"
              component={Link}
              to="/athletes/create"
              fullWidth={isMobile}
            >
              Create New Token
            </Button>
          </Box>
        </Box>

        <TextField
          fullWidth
          margin="normal"
          placeholder="Search athletes..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          sx={{ 
            mt: 3,
            '& .MuiOutlinedInput-root': {
              backgroundColor: 'background.paper',
              borderRadius: 2,
            },
          }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon color="action" />
              </InputAdornment>
            ),
          }}
        />
        {renderFilters()}
      </Box>

      {error && (
        <Alert 
          severity="error" 
          sx={{ 
            mb: 3,
            borderRadius: 2,
          }}
        >
          {error}
        </Alert>
      )}

      {viewMode === 'grid' ? (
        <>
          <Grid container spacing={2}>
            {paginatedAthletes.map((athlete) => (
              <Grid item xs={12} sm={6} md={4} key={athlete.id}>
                <Card 
                  sx={{ 
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    borderRadius: 2,
                    transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: 4,
                    },
                  }}
                >
                  <CardContent sx={{ flexGrow: 1, p: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <Avatar
                        src={athlete.profilePicture}
                        sx={{ 
                          width: 64,
                          height: 64,
                          mr: 2,
                          border: 2,
                          borderColor: 'primary.main',
                        }}
                      />
                      <Box>
                        <Typography variant="h6" sx={{ fontWeight: 600 }}>
                          {athlete.firstName} {athlete.lastName}
                        </Typography>
                        <Typography color="text.secondary" variant="subtitle2">
                          {athlete.nickName}
                        </Typography>
                      </Box>
                    </Box>
                    <Box sx={{ mb: 2, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                      <Chip 
                        label={athlete.sport}
                        color="primary"
                        size="small"
                        sx={{ borderRadius: 1 }}
                      />
                      <Chip 
                        label={athlete.country}
                        size="small"
                        sx={{ borderRadius: 1 }}
                      />
                    </Box>
                    <Typography 
                      variant="body2" 
                      color="text.secondary" 
                      sx={{ 
                        mb: 2,
                        display: '-webkit-box',
                        WebkitLineClamp: 3,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                      }}
                    >
                      {athlete.description}
                    </Typography>
                    <Box sx={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center',
                      mt: 'auto',
                    }}>
                      <Box>
                        <Typography variant="subtitle2" color="primary.main" sx={{ fontWeight: 600 }}>
                          {athlete.fanTokenSymbol}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          ${athlete.fanTokenInitialPrice} · {athlete.totalNoOfFanTokens} tokens
                        </Typography>
                      </Box>
                      <Box>
                        <Tooltip title="Edit">
                          <IconButton
                            onClick={() => handleEdit(athlete.id)}
                            size="small"
                            sx={{ 
                              mr: 1,
                              color: 'primary.main',
                              '&:hover': { bgcolor: 'primary.lighter' },
                            }}
                          >
                            <EditIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete">
                          <IconButton
                            onClick={() => handleDelete(athlete.id)}
                            size="small"
                            sx={{ 
                              color: 'error.main',
                              '&:hover': { bgcolor: 'error.lighter' },
                            }}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
          <Box sx={{ mt: 3 }}>
            <TablePagination
              component="div"
              count={filterAthleteTokens(athletes).length}
              page={page}
              onPageChange={handleChangePage}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={handleChangeRowsPerPage}
              rowsPerPageOptions={isMobile ? [5, 10] : [10, 25, 50]}
            />
          </Box>
        </>
      ) : (
        <Box sx={{ bgcolor: 'background.paper', borderRadius: 2, overflow: 'hidden' }}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Athlete</TableCell>
                  <TableCell>Sport</TableCell>
                  <TableCell>Country</TableCell>
                  <TableCell>Token Symbol</TableCell>
                  <TableCell align="right">Initial Price</TableCell>
                  <TableCell align="right">Total Tokens</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {paginatedAthletes.map((athlete) => (
                  <TableRow 
                    key={athlete.id}
                    sx={{ 
                      '&:hover': { 
                        bgcolor: 'action.hover',
                      },
                    }}
                  >
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Avatar 
                          src={athlete.profilePicture} 
                          sx={{ 
                            width: 40, 
                            height: 40, 
                            mr: 2,
                            border: 1,
                            borderColor: 'primary.main',
                          }} 
                        />
                        <Box>
                          <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                            {athlete.firstName} {athlete.lastName}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {athlete.nickName}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>{athlete.sport}</TableCell>
                    <TableCell>{athlete.country}</TableCell>
                    <TableCell>
                      <Chip 
                        label={athlete.fanTokenSymbol}
                        size="small"
                        color="primary"
                        sx={{ borderRadius: 1 }}
                      />
                    </TableCell>
                    <TableCell align="right">${athlete.fanTokenInitialPrice}</TableCell>
                    <TableCell align="right">{athlete.totalNoOfFanTokens}</TableCell>
                    <TableCell>
                      <Tooltip title="Edit">
                        <IconButton
                          onClick={() => handleEdit(athlete.id)}
                          size="small"
                          sx={{ 
                            mr: 1,
                            color: 'primary.main',
                            '&:hover': { bgcolor: 'primary.lighter' },
                          }}
                        >
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <IconButton
                          onClick={() => handleDelete(athlete.id)}
                          size="small"
                          sx={{ 
                            color: 'error.main',
                            '&:hover': { bgcolor: 'error.lighter' },
                          }}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          <TablePagination
            component="div"
            count={filterAthleteTokens(athletes).length}
            page={page}
            onPageChange={handleChangePage}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            rowsPerPageOptions={isMobile ? [5, 10] : [10, 25, 50]}
          />
        </Box>
      )}
      {selectedAthleteId && (
        <EditAthleteToken
          open={editModalOpen}
          onClose={handleEditClose}
          athleteId={selectedAthleteId}
          onUpdate={fetchAthletes}
        />
      )}
    </Paper>
  );
}
