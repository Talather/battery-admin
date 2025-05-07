import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Alert,

  Snackbar,
  IconButton,
  InputAdornment,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { collection, getDocs, doc, setDoc, db } from '../lib/firebase';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';


// Interface for company profiles
interface CompanyProfile {
  id: string;
  name: string;
}

const CreateUser = () => {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [companyProfileId, setCompanyProfileId] = useState('');
  const [companyProfiles, setCompanyProfiles] = useState<CompanyProfile[]>([]);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  // Fetch company profiles on component mount
  useEffect(() => {
    const fetchCompanyProfiles = async () => {
      try {
        const companyProfilesCollection = collection(db, 'companyProfiles');
        const snapshot = await getDocs(companyProfilesCollection);
        const companies = snapshot.docs.map(doc => ({
          id: doc.id,
          name: doc.data().companyName,
        }));
        setCompanyProfiles(companies);
      } catch (error) {
        console.error('Error fetching company profiles:', error);
      }
    };

    fetchCompanyProfiles();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    // Basic validation
    if (!name.trim()) {
      setError('Name is required');
      return;
    }

    if (!email.trim()) {
      setError('Email is required');
      return;
    }

    if (!password.trim() || password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    try {
      // Create user in Firebase Authentication
      const auth = getAuth();
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const uid = userCredential.user.uid;

      // Create user record in Firestore
      const userDoc = {
        name,
        email,
        uid,
        companyProfileId: companyProfileId || null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isLocked: false,
      };

      // Add to users collection
      await setDoc(doc(db, 'users', uid), userDoc);
      
      setSuccess(true);
      setSnackbarMessage('User created successfully');
      setSnackbarOpen(true);

      // Redirect to user list after a short delay
      setTimeout(() => {
        navigate('/users');
      }, 2000);
    } catch (error: any) {
      console.error('Error creating user:', error);
      setError(error.message || 'Failed to create user');
    } finally {
      setLoading(false);
    }
  };



  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4" component="h1">
          Add New User
        </Typography>
        <Button 
          variant="outlined" 
          onClick={() => navigate('/users')}
          sx={{ borderRadius: 2 }}
        >
          Cancel
        </Button>
      </Box>

      <Card>
        <CardContent>
          {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}
          {success && <Alert severity="success" sx={{ mb: 3 }}>User created successfully</Alert>}

          <form onSubmit={handleSubmit}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <TextField
                  label="Full Name"
                  fullWidth
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={loading}
                  required
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  label="Email Address"
                  type="email"
                  fullWidth
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                  required
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  label="Password"
                  type={showPassword ? 'text' : 'password'}
                  fullWidth
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  required
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={() => setShowPassword(!showPassword)}
                          edge="end"
                        >
                          {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Associated Company (Optional)</InputLabel>
                  <Select
                    value={companyProfileId}
                    onChange={(e) => setCompanyProfileId(e.target.value)}
                    label="Associated Company (Optional)"
                    disabled={loading}
                  >
                    <MenuItem value="">
                      <em>None</em>
                    </MenuItem>
                    {companyProfiles.map((company) => (
                      <MenuItem key={company.id} value={company.id}>
                        {company.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              {/* <Grid item xs={12} md={6}>
                <TextField
                  label="Referral Code"
                  fullWidth
                  value={referralCode}
                  disabled
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton 
                          edge="end" 
                          onClick={handleCopyReferralCode}
                          title="Copy referral code"
                        >
                          <ContentCopyIcon />
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
                <FormHelperText>
                  This code can be used to link new users to this account
                </FormHelperText>
              </Grid> */}
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                  <Button
                    type="submit"
                    variant="contained"
                    color="primary"
                    disabled={loading}
                    sx={{ 
                      minWidth: 120,
                      height: 48
                    }}
                  >
                    {loading ? <CircularProgress size={24} /> : 'Create User'}
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </form>
        </CardContent>
      </Card>

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={4000}
        onClose={() => setSnackbarOpen(false)}
        message={snackbarMessage}
      />
    </Box>
  );
};

export default CreateUser;
