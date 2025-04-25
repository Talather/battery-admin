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
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { ChipProps } from '@mui/material/Chip';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import SearchIcon from '@mui/icons-material/Search';
import GridViewIcon from '@mui/icons-material/GridView';
import ViewListIcon from '@mui/icons-material/ViewList';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import LiveTvIcon from '@mui/icons-material/LiveTv';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import EventIcon from '@mui/icons-material/Event';
import AssignmentIcon from '@mui/icons-material/Assignment';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import EditEvent from './EditEvent.tsx';
import { format, parseISO, isValid } from 'date-fns';

interface Event {
  id: string;
  created_at: string;
  athelete_token_id: string;
  name: string;
  description: string;
  type: 'video' | 'live_stream' | 'contest';
  day: string | null;
  contest_end_date: string | null;
  video_url: string | null;
  live_stream_url: string | null;
}

interface Athlete {
  id: string;
  firstName: string;
  lastName: string;
  profilePicture: string;
  dayOfTheWeek:string;
}

interface Filters {
  type: string;
  athleteId: string;
  day: Date | null;
}

export default function EventList() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [events, setEvents] = useState<Event[]>([]);
  const [athletes, setAthletes] = useState<Record<string, Athlete>>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('table');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(isMobile ? 5 : 10);
  const [filters, setFilters] = useState<Filters>({
    type: '',
    athleteId: '',
    day: null,
  });
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [athletesList, setAthletesList] = useState<Athlete[]>([]);

  useEffect(() => {
    fetchEvents();
    fetchAthletes();
  }, []);

  useEffect(() => {
    setRowsPerPage(isMobile ? 5 : 10);
  }, [isMobile]);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('Events')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setEvents(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred while fetching events');
    } finally {
      setLoading(false);
    }
  };

  const fetchAthletes = async () => {
    try {
      const { data, error } = await supabase
        .from('Atheletes')
        .select('id, firstName, lastName, profilePicture, dayOfTheWeek');
      
      if (error) throw error;
      
      const athletesMap: Record<string, Athlete> = {};
      data?.forEach(athlete => {
        athletesMap[athlete.id] = athlete;
      });
      
      setAthletes(athletesMap);
      setAthletesList(data || []);
    } catch (err) {
      console.error('Error fetching athletes:', err);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this event?')) {
      try {
        const { error } = await supabase
          .from('events')
          .delete()
          .eq('id', id);
        
        if (error) throw error;
        setEvents(events.filter(event => event.id !== id));
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred while deleting the event');
      }
    }
  };

  const handleEdit = (eventId: string) => {
    setSelectedEventId(eventId);
    setEditModalOpen(true);
  };

  const handleEditClose = () => {
    setEditModalOpen(false);
    setSelectedEventId(null);
    // Refresh events list after edit
    fetchEvents();
  };

  const filterEvents = (events: Event[]) => {
    return events.filter(event => {
      const matchesSearch = 
        event.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.description.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesType = !filters.type || event.type === filters.type;
      const matchesAthlete = !filters.athleteId || event.athelete_token_id === filters.athleteId;
      
      // Date filtering
      let matchesDay = true;
      if (filters.day && event.day) {
        try {
          const eventDate = parseISO(event.day);
          const filterDate = filters.day;
          matchesDay = (
            eventDate.getDate() === filterDate.getDate() &&
            eventDate.getMonth() === filterDate.getMonth() &&
            eventDate.getFullYear() === filterDate.getFullYear()
          );
        } catch (e) {
          console.error('Error parsing date:', e);
          matchesDay = false;
        }
      }

      return matchesSearch && matchesType && matchesAthlete && matchesDay;
    });
  };

  const handleFilterChange = (filterName: keyof Filters, value: any) => {
    setFilters(prev => ({ ...prev, [filterName]: value }));
    setPage(0);
  };

  const getEventTypeIcon = (type: string) => {
    switch (type) {
      case 'video':
        return <PlayArrowIcon />;
      case 'live_stream':
        return <LiveTvIcon />;
      case 'contest':
        return <EmojiEventsIcon />;
      default:
        return <></>;
    }
  };

  const getEventTypeColor = (type: string): ChipProps['color'] => {
    switch (type) {
      case 'video':
        return 'primary';
      case 'live_stream':
        return 'error';
      case 'contest':
        return 'success';
      default:
        return 'default';
    }
  };

  // Format date for display
  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Not specified';
    try {
      const date = parseISO(dateString);
      if (isValid(date)) {
        return format(date, 'MMM dd, yyyy');
      }
      return 'Invalid date';
    } catch (e) {
      console.error('Error formatting date:', e);
      return 'Invalid date';
    }
  };

  const renderFilters = () => (
    <Box sx={{ mb: 3, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
      <FormControl sx={{ minWidth: 200 }}>
        <InputLabel>Event Type</InputLabel>
        <Select
          value={filters.type}
          onChange={(e) => handleFilterChange('type', e.target.value)}
          label="Event Type"
        >
          <MenuItem value="">All Types</MenuItem>
          <MenuItem value="video">Video</MenuItem>
          <MenuItem value="live_stream">Live Stream</MenuItem>
          <MenuItem value="contest">Contest</MenuItem>
        </Select>
      </FormControl>

      <FormControl sx={{ minWidth: 200 }}>
        <InputLabel>Athlete</InputLabel>
        <Select
          value={filters.athleteId}
          onChange={(e) => handleFilterChange('athleteId', e.target.value)}
          label="Athlete"
        >
          <MenuItem value="">All Athletes</MenuItem>
          {athletesList.map(athlete => (
            <MenuItem key={athlete.id} value={athlete.id}>
              {athlete.firstName} {athlete.lastName}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      <LocalizationProvider dateAdapter={AdapterDateFns}>
        <DatePicker
          label="Filter by Date"
          value={filters.day}
          onChange={(date) => handleFilterChange('day', date)}
          slotProps={{
            textField: {
              margin: 'normal',
              sx: { minWidth: 200, mt: 0 }
            }
          }}
        />
      </LocalizationProvider>
    </Box>
  );

  const renderTableView = () => {
    const filteredEvents = filterEvents(events);
    const paginatedEvents = filteredEvents.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

    return (
      <>
        <TableContainer component={Paper} sx={{ mt: 3 }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Event Name</TableCell>
                <TableCell>Athlete</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Event Date</TableCell>
                {filters.type === 'contest' || paginatedEvents.some(e => e.type === 'contest') ? (
                  <TableCell>Contest End Date</TableCell>
                ) : null}
                <TableCell>Date Created</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedEvents.map((event) => (
                <TableRow key={event.id}>
                  <TableCell>{event.name}</TableCell>
                  <TableCell>
                    {athletes[event.athelete_token_id] ? 
                      `${athletes[event.athelete_token_id].firstName} ${athletes[event.athelete_token_id].lastName}` : 
                      'Unknown Athlete'}
                  </TableCell>
                  <TableCell>
                    <Chip 
                      icon={getEventTypeIcon(event.type)} 
                      label={event.type.charAt(0).toUpperCase() + event.type.slice(1)}
                      color={getEventTypeColor(event.type)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>{formatDate(event.day)}</TableCell>
                  {filters.type === 'contest' || paginatedEvents.some(e => e.type === 'contest') ? (
                    <TableCell>
                      {event.type === 'contest' ? formatDate(event.contest_end_date) : '-'}
                    </TableCell>
                  ) : null}
                  <TableCell>
                    {new Date(event.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell align="right">
                    {(event.type === 'video' && event.video_url) || 
                     (event.type === 'live_stream' && event.live_stream_url) ? (
                      <Tooltip title="Open Link">
                        <IconButton
                          size="small"
                          onClick={() => {
                            const url = event.type === 'video' ? event.video_url : event.live_stream_url;
                            if (url) window.open(url, '_blank');
                          }}
                        >
                          <OpenInNewIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    ) : null}
                    {event.type === 'contest' && (
                      <Tooltip title="View Submissions">
                        <IconButton
                          size="small"
                          component={Link}
                          to={`/submissions/${event.id}`}
                        >
                          <AssignmentIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    )}
                    <Tooltip title="Edit">
                      <IconButton
                        size="small"
                        onClick={() => handleEdit(event.id)}
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete">
                      <IconButton
                        size="small"
                        onClick={() => handleDelete(event.id)}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
              {paginatedEvents.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    No events found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={filteredEvents.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={(_, newPage) => setPage(newPage)}
          onRowsPerPageChange={(event) => {
            setRowsPerPage(parseInt(event.target.value, 10));
            setPage(0);
          }}
        />
      </>
    );
  };

  const renderGridView = () => {
    const filteredEvents = filterEvents(events);
    const paginatedEvents = filteredEvents.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

    return (
      <>
        <Grid container spacing={3} sx={{ mt: 1 }}>
          {paginatedEvents.map((event) => (
            <Grid item xs={12} sm={6} md={4} key={event.id}>
              <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <CardContent sx={{ flexGrow: 1 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h6" component="div" sx={{ fontWeight: 'bold' }}>
                      {event.name}
                    </Typography>
                    <Chip 
                      icon={getEventTypeIcon(event.type)} 
                      label={event.type.charAt(0).toUpperCase() + event.type.slice(1)}
                      color={getEventTypeColor(event.type)}
                      size="small"
                    />
                  </Box>
                  
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    {event.description.length > 100 
                      ? `${event.description.substring(0, 100)}...` 
                      : event.description}
                  </Typography>

                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <Typography variant="body2" color="text.secondary">
                      Athlete: {athletes[event.athelete_token_id] ? 
                        `${athletes[event.athelete_token_id].firstName} ${athletes[event.athelete_token_id].lastName}` : 
                        'Unknown Athlete'}
                    </Typography>
                  </Box>

                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <CalendarTodayIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                    <Typography variant="body2" color="text.secondary">
                      Date: {formatDate(event.day)}
                    </Typography>
                  </Box>

                  {event.type === 'contest' && event.contest_end_date && (
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <EventIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                      <Typography variant="body2" color="text.secondary">
                        Contest Ends: {formatDate(event.contest_end_date)}
                      </Typography>
                    </Box>
                  )}

                  <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                    {(event.type === 'video' && event.video_url) || 
                    (event.type === 'live_stream' && event.live_stream_url) ? (
                      <Tooltip title="Open Link">
                        <IconButton
                          size="small"
                          onClick={() => {
                            const url = event.type === 'video' ? event.video_url : event.live_stream_url;
                            if (url) window.open(url, '_blank');
                          }}
                        >
                          <OpenInNewIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    ) : null}
                    {event.type === 'contest' && (
                      <Tooltip title="View Submissions">
                        <IconButton
                          size="small"
                          component={Link}
                          to={`/submissions/${event.id}`}
                        >
                          <AssignmentIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    )}
                    <Tooltip title="Edit">
                      <IconButton
                        size="small"
                        onClick={() => handleEdit(event.id)}
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete">
                      <IconButton
                        size="small"
                        onClick={() => handleDelete(event.id)}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
          {paginatedEvents.length === 0 && (
            <Grid item xs={12}>
              <Typography variant="body1" align="center" sx={{ mt: 3 }}>
                No events found
              </Typography>
            </Grid>
          )}
        </Grid>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={filteredEvents.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={(_, newPage) => setPage(newPage)}
          onRowsPerPageChange={(event) => {
            setRowsPerPage(parseInt(event.target.value, 10));
            setPage(0);
          }}
        />
      </>
    );
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" component="h1">
          Events
        </Typography>
      
        <Box sx={{ display: 'flex', gap: 1 }}>
        <Link to="/create-event" style={{ textDecoration: 'none' }}>
        <Button 
          variant="contained" 
          color="primary" 
          // sx={{ position: 'fixed', bottom: 24, right: 24 }}
        >
          Create New Event
        </Button>
      </Link>
          <Tooltip title="Grid View">
            <IconButton 
              color={viewMode === 'grid' ? 'primary' : 'default'} 
              onClick={() => setViewMode('grid')}
            >
              <GridViewIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Table View">
            <IconButton 
              color={viewMode === 'table' ? 'primary' : 'default'} 
              onClick={() => setViewMode('table')}
            >
              <ViewListIcon />
            </IconButton>
          </Tooltip>

        </Box>
      
      </Box>
    

      <Box sx={{ mb: 3 }}>
        <TextField
          fullWidth
          placeholder="Search events..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
        />
      </Box>

      {renderFilters()}

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 5 }}>
          <CircularProgress />
        </Box>
      ) : (
        viewMode === 'table' ? renderTableView() : renderGridView()
      )}

      {selectedEventId && editModalOpen && (
        <EditEvent
          eventId={selectedEventId}
          open={editModalOpen}
          onClose={handleEditClose}
          athletes={athletesList}
        />
      )}


    </Box>
  );
}
