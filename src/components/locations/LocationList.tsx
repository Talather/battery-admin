import { useState, useEffect } from 'react';
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

  Avatar
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import SearchIcon from '@mui/icons-material/Search';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import { Link } from 'react-router-dom';
import { collection, getDocs, deleteDoc, doc } from '../../lib/firebase';
import { db } from '../../lib/firebase';

interface Location {
  id: string;
  address: string;
  companyProfileId: string;
  companyName: string;
  lat: number;
  lng: number;
  geoHash?: string;
  locationId?: string;
  createdAt: string;
  updatedAt: string;
  status?: string;
}

const LocationList = () => {
  const [locations, setLocations] = useState<Location[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);


  useEffect(() => {
    const fetchLocations = async () => {
      try {
        setLoading(true);
        // First get all company profiles
        const companyProfilesCollection = collection(db, 'companyProfiles');
        const companySnapshot = await getDocs(companyProfilesCollection);
        
        // Store company names for reference
        const companyData: {[key: string]: {name: string}} = {};
        companySnapshot.docs.forEach(doc => {
          companyData[doc.id] = {
            name: doc.data().companyName || 'Unnamed Company'
          };
        });
        
        // Now get all locations from all company subcollections
        const allLocations: Location[] = [];
        
        // For each company, get its locations subcollection
        for (const companyDoc of companySnapshot.docs) {
          const companyId = companyDoc.id;
          const companyName = companyDoc.data().companyName || 'Unnamed Company';
          
          const locationsCollection = collection(db, `companyProfiles/${companyId}/locations`);
          const locationsSnapshot = await getDocs(locationsCollection);
          
          // Add each location with its company ID and name
          locationsSnapshot.docs.forEach(doc => {
            const locationData = doc.data();
            allLocations.push({
              id: doc.id,
              address: locationData.address || '',
              companyProfileId: companyId,
              companyName: companyName,
              lat: locationData.lat || 0,
              lng: locationData.lng || 0,
              geoHash: locationData.geoHash,
              locationId: locationData.locationId,
              createdAt: locationData.createdAt || '',
              updatedAt: locationData.updatedAt || '',
              status: locationData.status || 'Operational'
            });
          });
        }
        
        setLocations(allLocations);
      } catch (error) {
        console.error('Error fetching locations:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchLocations();
  }, []);

  const deleteLocation = async (location: Location) => {
    if (!window.confirm(`Are you sure you want to delete location: ${location.address}?`)) {
      return;
    }
    
    try {
      // Delete location from the company's subcollection
      await deleteDoc(doc(db, `companyProfiles/${location.companyProfileId}/locations`, location.id));
      // Update state to remove deleted location
      setLocations(locations.filter(loc => loc.id !== location.id));
    } catch (error) {
      console.error('Error deleting location:', error);
      alert('Failed to delete location. Please try again.');
    }
  };

  const filteredLocations = locations.filter(location => 
    location.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
    location.companyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (location.locationId && location.locationId.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Battery Locations
        </Typography>
        <Button 
          variant="contained" 
          color="primary" 
          component={Link} 
          to="/locations/create"
          startIcon={<AddIcon />}
        >
          Add Location
        </Button>
      </Box>
      
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <TextField
            fullWidth
            variant="outlined"
            placeholder="Search locations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            sx={{ mb: 2 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
          />

          <TableContainer component={Paper} sx={{ 
            boxShadow: 'none',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: 2,
            bgcolor: 'transparent' 
          }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Location ID</TableCell>
                  <TableCell>Address</TableCell>
                  <TableCell>Company</TableCell>
                  <TableCell>Coordinates</TableCell>
                  <TableCell>Created</TableCell>
                  <TableCell>Updated</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center">Loading...</TableCell>
                  </TableRow>
                ) : filteredLocations.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center">No locations found</TableCell>
                  </TableRow>
                ) : (
                  filteredLocations.map((location) => (
                    <TableRow key={location.id}>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Avatar sx={{ bgcolor: 'primary.light', width: 30, height: 30 }}>
                            <LocationOnIcon fontSize="small" />
                          </Avatar>
                          <Typography>{location.locationId || '-'}</Typography>
                        </Box>
                      </TableCell>
                      <TableCell sx={{ maxWidth: 250, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {location.address}
                      </TableCell>
                      <TableCell>{location.companyName}</TableCell>
                      <TableCell>
                        <Typography variant="body2">{location.lat.toFixed(6)}, {location.lng.toFixed(6)}</Typography>
                        <Typography variant="body2" color="text.secondary">
                          Geohash: {location.geoHash || '-'}
                        </Typography>
                      </TableCell>
                      <TableCell>{new Date(location.createdAt).toLocaleDateString()}</TableCell>
                      <TableCell>{new Date(location.updatedAt).toLocaleDateString()}</TableCell>
                      <TableCell align="right">
                        <IconButton 
                          size="small" 
                          component={Link} 
                          to={`/locations/${location.id}`}
                          sx={{ color: '#1792B6' }}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                        <IconButton 
                          color="error" 
                          size="small"
                          onClick={() => deleteLocation(location)}
                          title="Delete Location"
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>
    </Box>
  );
};

export default LocationList;
