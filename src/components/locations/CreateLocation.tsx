import { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Grid,
  MenuItem,
  Select,
  Divider,
  Alert,
  FormControl,
  InputLabel,
  CircularProgress,
  Paper
} from '@mui/material';
import { SelectChangeEvent } from '@mui/material/Select';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import { Link, useNavigate } from 'react-router-dom';
import { 
  collection, 
  addDoc, 
  getDocs,
  db,
  geohashForLocation
} from '../../lib/firebase';
import AddressAutocomplete from '../common/AddressAutocomplete';

interface Company {
  id: string;
  companyName: string;
}

interface Coords {
  lat: number;
  lng: number;
}

const CreateLocation = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    locationId: `loc${Date.now().toString().substring(9)}`, // Generate a simple location ID
    companyId: ''
  });
  
  const [address, setAddress] = useState('');
  const [selectedCoords, setSelectedCoords] = useState<Coords | null>(null);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        setInitialLoading(true);
        const companiesCollection = collection(db, 'companyProfiles');
        const companiesSnapshot = await getDocs(companiesCollection);
        const companiesList = companiesSnapshot.docs.map(doc => ({
          id: doc.id,
          companyName: doc.data().companyName || 'Unnamed Company'
        })) as Company[];
        setCompanies(companiesList);
      } catch (error) {
        console.error('Error fetching companies:', error);
        setError('Failed to load companies');
      } finally {
        setInitialLoading(false);
      }
    };
    
    fetchCompanies();
  }, []);

  const handleChange = (e: SelectChangeEvent<string>) => {
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
    
    // Basic validation
    if (!formData.companyId) {
      setError('Please select a company');
      return;
    }
    
    if(!selectedCoords || !address){
      setError('Please select a valid address with the address search');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Create geohash for location
      const geoHash = geohashForLocation([
        selectedCoords.lat,
        selectedCoords.lng,
      ]);
      
      // Create a location in the company's locations subcollection
      const locationData = {
        address: address,
        lat: selectedCoords.lat,
        lng: selectedCoords.lng,
        geoHash: geoHash,
        locationId: formData.locationId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      // Save location to the company's subcollection
      await addDoc(collection(db, `companyProfiles/${formData.companyId}/locations`), locationData);
      
      setSuccess(true);
      
      // Redirect after short delay
      setTimeout(() => {
        navigate('/locations');
      }, 2000);
    } catch (error) {
      console.error('Error creating location:', error);
      setError('Failed to create location');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box p={3}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <Button 
          component={Link} 
          to="/locations" 
          startIcon={<ArrowBackIcon />}
          sx={{ mr: 2 }}
        >
          Back to Locations
        </Button>
        <Typography variant="h4" component="h1">
          Add New Location
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 3 }}>
          Location created successfully!
        </Alert>
      )}

      {initialLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Card>
          <CardContent>
            <form onSubmit={handleSubmit}>
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <Typography variant="h6" gutterBottom>
                    Company Information
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                </Grid>
                
                <Grid item xs={12}>
                  <FormControl fullWidth required>
                    <InputLabel id="company-label">Company</InputLabel>
                    <Select
                      labelId="company-label"
                      id="company"
                      name="companyId"
                      value={formData.companyId}
                      label="Company"
                      onChange={handleChange}
                    >
                      {companies.map((company) => (
                        <MenuItem key={company.id} value={company.id}>
                          {company.companyName}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Location ID"
                    name="locationId"
                    value={formData.locationId}
                    InputProps={{
                      readOnly: true,
                    }}
                    helperText="Auto-generated ID for this location"
                  />
                </Grid>

                <Grid item xs={12}>
                  <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                    Location Address
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
                  <Button
                    type="submit"
                    variant="contained"
                    color="primary"
                    disabled={loading}
                    fullWidth
                  >
                    {loading ? (
                      <>
                        <CircularProgress size={20} sx={{ mr: 1 }} color="inherit" />
                        Creating Location...
                      </>
                    ) : 'Create Location'}
                  </Button>
                </Grid>
              </Grid>
            </form>
          </CardContent>
        </Card>
      )}
    </Box>
  );
};

export default CreateLocation;
