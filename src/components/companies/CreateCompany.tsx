import { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Grid,
  Divider,
  Alert,
  CircularProgress,
  Paper
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import AddressAutocomplete from '../common/AddressAutocomplete';
  import { Link, useParams } from 'react-router-dom';
import { 
  db, 
  collection, 
  doc,
  getDoc,
  updateDoc, 
  addDoc,
  geohashForLocation
} from '../../lib/firebase';

// Function to generate unique referral code
const generateReferralCode = () => {
  // Generate a random 8-character alphanumeric code
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

interface Coords {
  lat: number;
  lng: number;
}

const CreateCompany = () => {
  // const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  
  const [formData, setFormData] = useState({
    name: '',
    companyAbout: '',
    website: '',
    keywords: '',
  });
  
  const [address, setAddress] = useState('');
  const [selectedCoords, setSelectedCoords] = useState<Coords | null>(null);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(id ? true : false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [referralCode, setReferralCode] = useState('');
  const [existingProfile, setExistingProfile] = useState<any>(null);

  // Load existing company profile if id is provided
  useEffect(() => {
    const fetchCompanyProfile = async () => {
      if (id) {
        try {
          setInitialLoading(true);
          const companyDoc = await getDoc(doc(db, "companyProfiles", id));
          
          if (companyDoc.exists()) {
            const companyData = companyDoc.data();
            setFormData({
              name: companyData.name || '',
              companyAbout: companyData.companyAbout || '',
              website: companyData.website || '',
              keywords: Array.isArray(companyData.keywords) 
                ? companyData.keywords.join(', ') 
                : companyData.keywords || '',
            });
            setReferralCode(companyData.referralCode || '');
            setExistingProfile({
              id,
              ...companyData
            });
          } else {
            setError('Company profile not found');
          }
        } catch (error) {
          console.error('Error fetching company profile:', error);
          setError('Failed to load company profile');
        } finally {
          setInitialLoading(false);
        }
      }
    };

    fetchCompanyProfile();
  }, [id]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };
  
  const handleAddressChange = (newAddress: string) => {
    setAddress(newAddress);
  };
  
  const handleCoordsChange = (coords: Coords) => {
    setSelectedCoords(coords);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      if(!selectedCoords || !address){
        setError("Please select a valid address");
        setLoading(false);
        return;
      }

      // Create geohash for location
      const geoHash = geohashForLocation([
        selectedCoords.lat,
        selectedCoords.lng,
      ]);
      
      // Create company data without locations (they'll be in a subcollection)
      const companyData: any = {
        companyName: formData.name,
        companyAbout: formData.companyAbout,
        website: formData.website,
        keywords: formData.keywords.split(',').map(k => k.trim()).filter(Boolean),
        createdAt: existingProfile?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      let companyId;
      let newReferralCode;

      if (existingProfile) {
        // Update existing profile (don't change referral code)
        await updateDoc(
          doc(db, "companyProfiles", existingProfile.id),
          companyData
        );
        companyId = existingProfile.id;
        
        // Add new location to the locations subcollection
        const locationData = {
          address: address,
          lat: selectedCoords.lat,
          lng: selectedCoords.lng,
          geoHash: geoHash,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        
        await addDoc(collection(db, `companyProfiles/${companyId}/locations`), locationData);
        
        setSuccess(true);
        setError(null);
      } else {
        // Generate a unique referral code for new profiles
        newReferralCode = generateReferralCode();
        companyData.referralCode = newReferralCode;
        
        // Create new profile
        const docRef = await addDoc(collection(db, "companyProfiles"), companyData);
        companyId = docRef.id;
        setReferralCode(newReferralCode);
        
        // Add first location to the locations subcollection
        const locationData = {
          address: address,
          lat: selectedCoords.lat,
          lng: selectedCoords.lng,
          geoHash: geoHash,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        
        await addDoc(collection(db, `companyProfiles/${companyId}/locations`), locationData);
        
        setSuccess(true);
        setError(null);
      }
    } catch (error: any) {
      console.error('Error creating company profile:', error);
      setError(error.message || 'Failed to create company profile');
      setSuccess(false);
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ py: 4, px: { xs: 2, md: 0 } }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
        <Button 
          component={Link} 
          to="/companies" 
          startIcon={<ArrowBackIcon />}
          sx={{ mr: 2 }}
        >
          Back to Companies
        </Button>
        <Typography variant="h5" component="h1">
          {existingProfile ? 'Edit Company Profile' : 'Create New Company Profile'}
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {success ? (
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Company Profile Created!
              </Typography>
              <Typography paragraph sx={{ mb: 3, textAlign: 'center' }}>
                The company profile has been {existingProfile ? 'updated' : 'created'} successfully. Location has been added to the company profile.
              </Typography>
              {!existingProfile && referralCode && (
                <Paper elevation={0} sx={{ p: 3, bgcolor: 'rgba(23, 146, 182, 0.1)', borderRadius: 2, mb: 3, width: '100%', maxWidth: 300 }}>
                  <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 600 }}>
                    Company Referral Code:
                  </Typography>
                  <Typography variant="h5" sx={{ fontFamily: 'monospace', textAlign: 'center', p: 1, bgcolor: 'background.paper', borderRadius: 1 }}>
                    {referralCode}
                  </Typography>
                  <Typography variant="caption" display="block" sx={{ mt: 1, textAlign: 'center' }}>
                    Share this code with company users to connect their accounts
                  </Typography>
                </Paper>
              )}
              <Button
                component={Link}
                to="/companies"
                variant="contained"
                sx={{ mt: 2 }}
              >
                View All Companies
              </Button>
            </Box>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent>
            <form onSubmit={handleSubmit}>
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <TextField
                    required
                    fullWidth
                    label="Company Name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                  />
                </Grid>
                
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    multiline
                    rows={3}
                    label="Company About"
                    name="companyAbout"
                    value={formData.companyAbout}
                    onChange={handleChange}
                    placeholder="Brief description of the company"
                  />
                </Grid>

                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Website"
                    name="website"
                    value={formData.website}
                    onChange={handleChange}
                    placeholder="e.g. https://example.com"
                  />
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Keywords (comma separated)"
                    name="keywords"
                    value={formData.keywords}
                    onChange={handleChange}
                    placeholder="e.g. batteries, energy, solar"
                  />
                </Grid>

                <Grid item xs={12}>
                  <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                    Location
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                </Grid>
                
                <Grid item xs={12}>
                  <AddressAutocomplete
                    setAddress={handleAddressChange}
                    setCoordinates={handleCoordsChange}
                    defaultAddress={address}
                  />
                </Grid>
                
                {selectedCoords && (
                  <Grid item xs={12}>
                    <Paper 
                      elevation={0} 
                      sx={{ 
                        p: 2, 
                        bgcolor: 'rgba(23, 146, 182, 0.1)', 
                        borderRadius: 2,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1
                      }}
                    >
                      <LocationOnIcon color="primary" />
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                          Selected Location:
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {address}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Coordinates: {selectedCoords.lat.toFixed(6)}, {selectedCoords.lng.toFixed(6)}
                        </Typography>
                      </Box>
                    </Paper>
                  </Grid>
                )}

                <Grid item xs={12} sx={{ mt: 3 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                    <Button
                      component={Link}
                      to="/companies"
                      variant="outlined"
                      color="inherit"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      variant="contained"
                      color="primary"
                      disabled={loading}
                    >
                      {loading ? (
                        <>
                          <CircularProgress size={20} sx={{ mr: 1 }} color="inherit" />
                          {existingProfile ? 'Updating...' : 'Creating...'}
                        </>
                      ) : (
                        existingProfile ? 'Update Company' : 'Create Company'
                      )}
                    </Button>
                  </Box>
                </Grid>
              </Grid>
            </form>
          </CardContent>
        </Card>
      )}
    </Box>
  );
};

export default CreateCompany;