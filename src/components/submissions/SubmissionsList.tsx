import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Box,
  Typography,
  CircularProgress,
  Alert,
  Tooltip,
  IconButton,
  Avatar,
  TablePagination
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import DownloadIcon from '@mui/icons-material/Download';
import { format } from 'date-fns';
import { supabase } from '../../lib/supabase';

interface Submission {
  id: number;
  created_at: string;
  eventId: string;
  userId: string;
  fileLink: string;
  fileName: string;
}

interface User {
  id: string;
  email: string;
  created_at: string;
}

interface Event {
  id: string;
  name: string;
}

export default function SubmissionsList() {
  const { eventId } = useParams<{ eventId: string }>();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [users, setUsers] = useState<Record<string, User>>({});
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  useEffect(() => {
    if (eventId) {
      fetchSubmissions();
      fetchEventDetails();
    }
  }, [eventId]);

  const fetchSubmissions = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('Submissions')
        .select('*')
        .eq('eventId', eventId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      setSubmissions(data || []);
      
      // Collect unique user IDs
      const userIds = [...new Set((data || []).map(s => s.userId))];
      if (userIds.length > 0) {
        fetchUsers(userIds);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred while fetching submissions');
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async (userIds: string[]) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .in('id', userIds);
      
      if (error) throw error;
      
      const usersMap: Record<string, User> = {};
      data?.forEach(user => {
        usersMap[user.id] = user;
      });
      
      setUsers(usersMap);
    } catch (err) {
      console.error('Error fetching users:', err);
    }
  };

  const fetchEventDetails = async () => {
    try {
      const { data, error } = await supabase
        .from('Events')
        .select('id, name')
        .eq('id', eventId)
        .single();
      
      if (error) throw error;
      
      setEvent(data || null);
    } catch (err) {
      console.error('Error fetching event details:', err);
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MMM dd, yyyy HH:mm:ss');
    } catch (e) {
      console.error('Error formatting date:', e);
      return 'Invalid date';
    }
  };

  const handleDownload = (fileLink: string) => {
    window.open(fileLink, '_blank');
  };

  // Create abbreviation from email for avatar
  const getEmailAbbreviation = (email: string) => {
    if (!email) return 'U';
    return email.substring(0, 2).toUpperCase();
  };

  const paginatedSubmissions = submissions.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Link to="/events" style={{ textDecoration: 'none', marginRight: '15px' }}>
            <IconButton>
              <ArrowBackIcon />
            </IconButton>
          </Link>
          <Typography variant="h5" component="h1">
            Submissions for {event?.name || 'Contest'}
          </Typography>
        </Box>
      </Box>

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
        <>
          {submissions.length === 0 ? (
            <Alert severity="info">No submissions found for this contest.</Alert>
          ) : (
            <>
              <TableContainer component={Paper} sx={{ mt: 3 }}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>User</TableCell>
                      <TableCell>File Name</TableCell>
                      <TableCell>Submitted On</TableCell>
                      <TableCell align="right">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {paginatedSubmissions.map((submission) => (
                      <TableRow key={submission.id}>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Avatar sx={{ mr: 2, bgcolor: 'primary.main' }}>
                              {getEmailAbbreviation(users[submission.userId]?.email || '')}
                            </Avatar>
                            <Typography>
                              {users[submission.userId]?.email || 'Unknown User'}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>{submission.fileName}</TableCell>
                        <TableCell>{formatDate(submission.created_at)}</TableCell>
                        <TableCell align="right">
                          <Tooltip title="Download">
                            <IconButton
                              size="small"
                              onClick={() => handleDownload(submission.fileLink)}
                            >
                              <DownloadIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
              <TablePagination
                rowsPerPageOptions={[5, 10, 25]}
                component="div"
                count={submissions.length}
                rowsPerPage={rowsPerPage}
                page={page}
                onPageChange={(_, newPage) => setPage(newPage)}
                onRowsPerPageChange={(event) => {
                  setRowsPerPage(parseInt(event.target.value, 10));
                  setPage(0);
                }}
              />
            </>
          )}
        </>
      )}
    </Box>
  );
}
