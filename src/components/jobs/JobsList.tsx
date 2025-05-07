import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  TextField,
  InputAdornment,

  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Menu,
  MenuItem,
  Avatar,
  CircularProgress
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import BusinessIcon from '@mui/icons-material/Business';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import PersonIcon from '@mui/icons-material/Person';
import WorkIcon from '@mui/icons-material/Work';
import { 
  collection, 
  getDocs, 
  deleteDoc, 
  doc, 
  db,
  getDoc
} from '../../lib/firebase';

interface Job {
  id: string;
  companyProfileId: string;
  contactName: string;
  createdAt: string;
  email: string;
  geohash: string;
  jobDescription: string;
  jobLink: string;
  jobTitle: string;
  lat: number;
  lng: number;
  locationId: string;
  type: string;
  userId: string;
  companyName?: string;
  locationName?: string;
  userName?: string;
}

const JobsList = () => {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);


  useEffect(() => {
    const fetchJobs = async () => {
      setLoading(true);
      try {
        // Fetch jobs from mapData collection
        const jobsCollection = collection(db, 'mapData');
        const jobsSnapshot = await getDocs(jobsCollection);
        
        // Get all jobs
        const jobsList = jobsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        })) as Job[];
        
        // Get unique company, location, and user IDs
        const companyIds = Array.from(new Set(
          jobsList
            .filter(job => job.companyProfileId)
            .map(job => job.companyProfileId)
        ));
        
        const locationIds = Array.from(new Set(
          jobsList
            .filter(job => job.locationId)
            .map(job => job.locationId)
        ));
        
        const userIds = Array.from(new Set(
          jobsList
            .filter(job => job.userId)
            .map(job => job.userId)
        ));
        
        // Fetch company details
        const companyData: {[key: string]: {name: string, id: string}} = {};
        for (const companyId of companyIds) {
          if (!companyId) continue;
          
          try {
            const companyDoc = await getDoc(doc(db, 'companyProfiles', companyId));
            if (companyDoc.exists()) {
              companyData[companyId] = {
                id: companyDoc.id,
                name: companyDoc.data().companyName || 'Unnamed Company'
              };
            }
          } catch (error) {
            console.error(`Failed to fetch company ${companyId}:`, error);
          }
        }
        
        // Fetch location details
        const locationData: {[key: string]: {address: string, id: string}} = {};
        for (const locationId of locationIds) {
          if (!locationId) continue;
          
          // Since locations are stored in subcollections, we need to check each company
          for (const companyId of companyIds) {
            try {
              const locationDoc = await getDoc(doc(db, `companyProfiles/${companyId}/locations`, locationId));
              if (locationDoc.exists()) {
                locationData[locationId] = {
                  id: locationDoc.id,
                  address: locationDoc.data().address || 'Unknown Location'
                };
                break; // Found the location, no need to check other companies
              }
            } catch (error) {
              console.error(`Failed to fetch location ${locationId} for company ${companyId}:`, error);
            }
          }
        }
        
        // Fetch user details
        const userData: {[key: string]: {name: string, id: string}} = {};
        for (const userId of userIds) {
          if (!userId) continue;
          
          try {
            const userDoc = await getDoc(doc(db, 'users', userId));
            if (userDoc.exists()) {
              userData[userId] = {
                id: userDoc.id,
                name: userDoc.data().name || 'Unknown User'
              };
            }
          } catch (error) {
            console.error(`Failed to fetch user ${userId}:`, error);
          }
        }
        
        // Add company, location, and user names to jobs
        const jobsWithDetails = jobsList.map(job => ({
          ...job,
          companyName: job.companyProfileId && companyData[job.companyProfileId] 
            ? companyData[job.companyProfileId].name 
            : undefined,
          locationName: job.locationId && locationData[job.locationId]
            ? locationData[job.locationId].address
            : undefined,
          userName: job.userId && userData[job.userId]
            ? userData[job.userId].name
            : undefined
        }));
        
        setJobs(jobsWithDetails);
        // All data is now embedded in the jobs objects, so we don't need to store separate references
      } catch (error) {
        console.error('Error fetching jobs:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchJobs();
  }, []);

  // Filter jobs based on search query
  const filteredJobs = jobs.filter(job => 
    job.jobTitle?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    job.companyName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    job.jobDescription?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    job.contactName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    job.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Handle job action menu
  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, job: Job) => {
    setAnchorEl(event.currentTarget);
    setSelectedJob(job);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  // Handle delete dialog
  const handleDeleteClick = () => {
    setDeleteDialogOpen(true);
    handleMenuClose();
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setSelectedJob(null);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedJob) return;
    
    try {
      await deleteDoc(doc(db, 'mapData', selectedJob.id));
      setJobs(jobs.filter(job => job.id !== selectedJob.id));
      setDeleteDialogOpen(false);
      setSelectedJob(null);
    } catch (error) {
      console.error('Error deleting job:', error);
    }
  };

  // Format date
  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString();
  };
  
  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Jobs
        </Typography>
        {/* <Button 
          variant="contained" 
          color="primary" 
          onClick={() => navigate('/jobs/create')}
          startIcon={<WorkIcon />}
        >
          Add Job
        </Button> */}
      </Box>
      
      <Card>
        <CardContent>
          <TextField
            fullWidth
            placeholder="Search jobs by title, company, description, or contact details..."
            sx={{ mb: 3 }}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
          />

          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
              <CircularProgress />
            </Box>
          ) : (
            <TableContainer component={Paper} sx={{ boxShadow: 'none', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Job Title</TableCell>
                    <TableCell>Company</TableCell>
                    <TableCell>Contact</TableCell>
                    <TableCell>Location</TableCell>
                    <TableCell>Posted By</TableCell>
                    <TableCell>Created</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredJobs.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} align="center" sx={{ py: 3 }}>
                        No jobs found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredJobs.map((job) => (
                      <TableRow key={job.id}>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Avatar sx={{ bgcolor: 'rgba(23, 146, 182, 0.2)' }}>
                              <WorkIcon />
                            </Avatar>
                            <Box>
                              <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                                {job.jobTitle || 'Untitled Job'}
                              </Typography>
                              <Typography variant="body2" color="text.secondary" sx={{ 
                                maxWidth: 250, 
                                overflow: 'hidden', 
                                textOverflow: 'ellipsis', 
                                whiteSpace: 'nowrap' 
                              }}>
                                {job.jobDescription || 'No description'}
                              </Typography>
                            </Box>
                          </Box>
                        </TableCell>
                        <TableCell>
                          {job.companyName ? (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <BusinessIcon fontSize="small" color="action" />
                              <Typography variant="body2">{job.companyName}</Typography>
                            </Box>
                          ) : (
                            <Typography variant="body2" color="text.secondary">No company</Typography>
                          )}
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">{job.contactName || 'No contact'}</Typography>
                          <Typography variant="body2" color="text.secondary">{job.email || 'No email'}</Typography>
                        </TableCell>
                        <TableCell>
                          {job.locationName ? (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <LocationOnIcon fontSize="small" color="action" />
                              <Typography 
                                variant="body2" 
                                sx={{ 
                                  maxWidth: 200, 
                                  overflow: 'hidden', 
                                  textOverflow: 'ellipsis', 
                                  whiteSpace: 'nowrap' 
                                }}
                              >
                                {job.locationName}
                              </Typography>
                            </Box>
                          ) : (
                            <Typography variant="body2" color="text.secondary">No location</Typography>
                          )}
                        </TableCell>
                        <TableCell>
                          {job.userName ? (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <PersonIcon fontSize="small" color="action" />
                              <Typography variant="body2">{job.userName}</Typography>
                            </Box>
                          ) : (
                            <Typography variant="body2" color="text.secondary">Unknown user</Typography>
                          )}
                        </TableCell>
                        <TableCell>{formatDate(job.createdAt)}</TableCell>
                        <TableCell align="right">
                          <IconButton 
                            size="small" 
                            onClick={(e) => handleMenuOpen(e, job)}
                            aria-label="more actions"
                          >
                            <MoreVertIcon fontSize="small" />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>
      
      {/* Job actions menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => {
          navigate(`/jobs/edit/${selectedJob?.id}`);
          handleMenuClose();
        }}>
          <EditIcon fontSize="small" sx={{ mr: 1 }} />
          Edit Job
        </MenuItem>
        <MenuItem onClick={handleDeleteClick}>
          <DeleteIcon fontSize="small" sx={{ mr: 1 }} />
          Delete Job
        </MenuItem>
      </Menu>
      
      {/* Delete confirmation dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={handleDeleteCancel}
      >
        <DialogTitle>Delete Job</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete "{selectedJob?.jobTitle}"? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteCancel}>Cancel</Button>
          <Button onClick={handleDeleteConfirm} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default JobsList;
