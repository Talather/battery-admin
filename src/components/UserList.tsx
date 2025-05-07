import React, { useState, useEffect } from 'react';
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
  Chip,
  Avatar,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Divider,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Menu,
  MenuItem
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import DeleteIcon from '@mui/icons-material/Delete';
import BusinessIcon from '@mui/icons-material/Business';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { 
  collection, 
  getDocs, 
  deleteDoc, 
  doc, 
  updateDoc,
  db
} from '../lib/firebase';

interface Company {
  id: string;
  companyName: string;
  // Add other properties as needed
}

interface User {
  id: string;
  name: string;
  email: string;
  uid: string;
  companyProfileId?: string;
  createdAt: string;
  updatedAt: string;
  isLocked?: boolean;
  companyName?: string;
}

const UserList = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [assignCompanyDialogOpen, setAssignCompanyDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [, setCompanyProfiles] = useState<{[key: string]: {name: string, id: string}}>({});
  const [companies, setCompanies] = useState<Company[]>([]);
  const [companySearchQuery, setCompanySearchQuery] = useState('');

  // Fetch users and companies
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch users
        const usersCollection = collection(db, 'users');
        const userSnapshot = await getDocs(usersCollection);
        
        // Get all users
        const usersList = userSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        })) as User[];
        
        // Fetch all companies
        const companiesCollection = collection(db, 'companyProfiles');
        const companiesSnapshot = await getDocs(companiesCollection);
        const companiesList = companiesSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        })) as Company[];
        
        // Create a map for company lookup
        const companyData: {[key: string]: {name: string, id: string}} = {};
        companiesList.forEach(company => {
          companyData[company.id] = {
            id: company.id,
            name: company.companyName || 'Unnamed Company'
          };
        });
        
        // Add company names to users
        const usersWithCompanies = usersList.map(user => ({
          ...user,
          companyName: user.companyProfileId && companyData[user.companyProfileId] 
            ? companyData[user.companyProfileId].name 
            : undefined
        }));
        
        setUsers(usersWithCompanies);
        setCompanyProfiles(companyData);
        setCompanies(companiesList);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Filter users based on search query
  const filteredUsers = users.filter(user => 
    user.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.companyName?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Handle user action menu
  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, user: User) => {
    setAnchorEl(event.currentTarget);
    setSelectedUser(user);
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
    setSelectedUser(null);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedUser) return;
    
    try {
      await deleteDoc(doc(db, 'users', selectedUser.id));
      setUsers(users.filter(user => user.id !== selectedUser.id));
      setDeleteDialogOpen(false);
      setSelectedUser(null);
    } catch (error) {
      console.error('Error deleting user:', error);
    }
  };

  // Handle opening assign company dialog
  const handleAssignCompanyClick = () => {
    setAssignCompanyDialogOpen(true);
    handleMenuClose();
  };

  const handleAssignCompanyClose = () => {
    setAssignCompanyDialogOpen(false);
    setCompanySearchQuery('');
  };

  // Filter companies based on search
  const filteredCompanies = companies.filter(company => 
    company.companyName.toLowerCase().includes(companySearchQuery.toLowerCase())
  );

  // Assign company to user
  const handleAssignCompany = async (companyId: string) => {
    if (!selectedUser) return;
    
    try {
      await updateDoc(doc(db, 'users', selectedUser.id), {
        companyProfileId: companyId,
        updatedAt: new Date().toISOString()
      });
      
      // Get the company name
      const companyName = companies.find(c => c.id === companyId)?.companyName || 'Unnamed Company';
      
      // Update local state
      setUsers(users.map(user => 
        user.id === selectedUser.id 
          ? {...user, companyProfileId: companyId, companyName: companyName} 
          : user
      ));
      
      handleAssignCompanyClose();
    } catch (error) {
      console.error('Error assigning company to user:', error);
    }
  };

  // Get user avatar initials from name
  const getUserInitials = (name: string) => {
    if (!name) return '?';
    return name.split(' ').map(part => part[0]).join('').toUpperCase().substring(0, 2);
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
          Users
        </Typography>
        <Button variant="contained" color="primary" onClick={() => navigate('/users/create')}>
          Add User
        </Button>
      </Box>
      
      <Card>
        <CardContent>
          <TextField
            fullWidth
            placeholder="Search users by name, email or company..."
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
                    <TableCell>User</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Company</TableCell>
                    <TableCell>Created</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredUsers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} align="center" sx={{ py: 3 }}>
                        No users found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredUsers.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Avatar sx={{ bgcolor: user.isLocked ? 'rgba(211, 47, 47, 0.2)' : 'rgba(23, 146, 182, 0.2)' }}>
                              {getUserInitials(user.name)}
                            </Avatar>
                            <Box>
                              <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                                {user.name || 'Unnamed User'}
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                {user.email}
                              </Typography>
                            </Box>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Chip 
                            label={user.isLocked ? "Locked" : "Active"} 
                            color={user.isLocked ? "error" : "success"} 
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          {user.companyName ? (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <BusinessIcon fontSize="small" color="action" />
                              <Typography variant="body2">{user.companyName}</Typography>
                            </Box>
                          ) : (
                            <Typography variant="body2" color="text.secondary">No company</Typography>
                          )}
                        </TableCell>
                        <TableCell>{formatDate(user.createdAt)}</TableCell>
                        <TableCell align="right">
                          <IconButton 
                            size="small" 
                            onClick={(e) => handleMenuOpen(e, user)}
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
      
      {/* User actions menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={handleAssignCompanyClick}>
          <BusinessIcon fontSize="small" sx={{ mr: 1 }} />
          Assign Company
        </MenuItem>
        <MenuItem onClick={handleDeleteClick}>
          <DeleteIcon fontSize="small" sx={{ mr: 1 }} />
          Delete User
        </MenuItem>
      </Menu>
      
      {/* Delete confirmation dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={handleDeleteCancel}
      >
        <DialogTitle>Delete User</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete {selectedUser?.name}? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteCancel}>Cancel</Button>
          <Button onClick={handleDeleteConfirm} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Assign company dialog */}
      <Dialog
        open={assignCompanyDialogOpen}
        onClose={handleAssignCompanyClose}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Assign Company to User</DialogTitle>
        <DialogContent>
          <Box sx={{ mb: 2, mt: 1 }}>
            <TextField
              fullWidth
              placeholder="Search companies by name..."
              value={companySearchQuery}
              onChange={(e) => setCompanySearchQuery(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />
          </Box>
          
          <List sx={{ maxHeight: 300, overflow: 'auto' }}>
            {filteredCompanies.length === 0 ? (
              <ListItem>
                <ListItemText primary="No companies found" />
              </ListItem>
            ) : (
              filteredCompanies.map((company) => (
                <React.Fragment key={company.id}>
                  <ListItem 
                    onClick={() => handleAssignCompany(company.id)}
                    sx={{
                      '&:hover': { bgcolor: 'rgba(23, 146, 182, 0.08)' },
                      cursor: 'pointer',
                      py: 1
                    }}
                  >
                    <ListItemAvatar>
                      <Avatar sx={{ bgcolor: 'rgba(23, 146, 182, 0.2)' }}>
                        <BusinessIcon />
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText 
                      primary={company.companyName} 
                      secondary={selectedUser?.companyProfileId === company.id ? "Currently assigned" : undefined}
                    />
                    {selectedUser?.companyProfileId === company.id && (
                      <CheckCircleIcon color="success" />
                    )}
                  </ListItem>
                  <Divider variant="inset" component="li" />
                </React.Fragment>
              ))
            )}
          </List>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleAssignCompanyClose}>Cancel</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default UserList;
