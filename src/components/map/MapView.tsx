import { useState, useEffect, useRef } from 'react';
import { Box, Card, CardContent, Typography, Grid, Button, TextField, CircularProgress, Chip, Divider } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import InfoIcon from '@mui/icons-material/Info';
import { GOOGLE_MAPS_API_KEY } from '../../lib/maps';
import { 
  db, 
  collection, 
  doc,
  getDoc,
  getDocs, 
  query, 
  where, 
  orderBy, 
  startAt, 
  endAt, 
  collectionGroup,
  geohashQueryBounds,
  distanceBetween
} from '../../lib/firebase';

// Interface for location data
interface LocationData {
  id: string;
  address: string;
  lat: number;
  lng: number;
  geoHash: string;
  createdAt: string;
  updatedAt: string;
}

// Interface for company profile data
interface CompanyProfileData {
  id: string;
  companyName: string;
  email?: string;
  phoneNumber?: string;
  website?: string;
  description?: string;
  companyType?: string;
  industry?: string;
  employees?: number;
  yearFounded?: number;
  referralCode?: string;
  createdAt: string;
  updatedAt: string;
}

// Combined interface for display
// interface CompanyLocationData {
//   id: string;
//   name: string;
//   companyProfileId: string;
//   location: LocationData;
// }

// Interface for map data job
interface MapDataJob {
  id: string;
  companyProfileId: string;
  title: string;
  description: string;
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
}

// Interface for display items on the map
interface DisplayLocation {
  id: string;
  locationId: string;
  name: string;
  address: string;
  companyId: string;
  companyName: string;
  lat: number;
  lng: number;
  batteryType?: string;
  batteryCapacity?: number;
  status: 'Operational' | 'Maintenance' | 'Offline';
}

// Interface for Google Map
declare global {
  interface Window {
    google: any;
    initMap: () => void;
  }
}

const MapView = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [displayLocations, setDisplayLocations] = useState<DisplayLocation[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<DisplayLocation | null>(null);
  const [loading, setLoading] = useState(true);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [jobs, setJobs] = useState<MapDataJob[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const mapRef = useRef<HTMLDivElement>(null);
  const googleMapRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);

  // Filter locations based on search term
  const filteredLocations = displayLocations.filter(location => 
    location.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    location.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
    location.companyName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Select a location to show details
  const handleSelectLocation = (location: DisplayLocation) => {
    setSelectedLocation(location);
    
    // Center map on selected location if map is loaded
    if (googleMapRef.current) {
      googleMapRef.current.setCenter({ lat: location.lat, lng: location.lng });
      googleMapRef.current.setZoom(12);
    }
  };

  // Get status color based on location status
  const getStatusColor = (status: DisplayLocation['status']) => {
    switch (status) {
      case 'Operational':
        return '#30B2D7';
      case 'Maintenance':
        return '#FF9800';
      case 'Offline':
        return '#FF5252';
      default:
        return '#757575';
    }
  };

  // Function to get data based on map center coordinates
  const getData = async (center: { lat: number, lng: number }) => {
    try {
      setIsLoading(true);
      // GeoFire requires [latitude, longitude] format
      const centered: [number, number] = [center.lat, center.lng];
      const radiusInM = 50 * 1000; // 50km radius
      const bounds = geohashQueryBounds(centered, radiusInM);
      const locationPromises = [];

      for (const b of bounds) {
        const q = query(
          collectionGroup(db, "locations"),
          orderBy("geoHash"),
          startAt(b[0]),
          endAt(b[1])
        );
        locationPromises.push(getDocs(q));
      }

      const locationSnapshots = await Promise.all(locationPromises);

      // Array of { companyId, locationData }
      const matchedPairs: { companyId: string, location: any }[] = [];

      for (const snap of locationSnapshots) {
        for (const docSnap of snap.docs) {
          const lat = docSnap.get("lat");
          const lng = docSnap.get("lng");
          const location: [number, number] = [lat, lng];
          const distanceInKm = distanceBetween(location, centered);
          const distanceInM = distanceInKm * 1000;

          if (distanceInM <= radiusInM) {
            const companyId = docSnap.ref.parent.parent?.id || '';

            matchedPairs.push({
              companyId,
              location: {
                id: docSnap.id,
                ...docSnap.data()
              }
            });
          }
        }
      }

      // Now fetch all companyProfiles
      const uniqueCompanyIds = Array.from(new Set(matchedPairs.map(p => p.companyId)));
      const companyDocPromises = uniqueCompanyIds.map(id =>
        getDoc(doc(db, "companyProfiles", id))
      );
      const companyDocs = await Promise.all(companyDocPromises);

      // Map companyId -> companyData
      const companyDataMap = new Map<string, CompanyProfileData>();
      for (const docSnap of companyDocs) {
        if (docSnap.exists()) {
          companyDataMap.set(docSnap.id, {
            id: docSnap.id,
            ...docSnap.data() as Omit<CompanyProfileData, 'id'>
          });
        }
      }

      // Combine each matched location with full company profile
      const results = matchedPairs
        .filter(p => companyDataMap.has(p.companyId))
        .map(p => ({
          ...companyDataMap.get(p.companyId)!,
          location: p.location
        }));

      // Now fetch jobs related to all matched companyIds
      const jobPromises = [];
      const chunkSize = 10;
      for (let i = 0; i < uniqueCompanyIds.length; i += chunkSize) {
        const chunk = uniqueCompanyIds.slice(i, i + chunkSize);
        const q = query(
          collection(db, "mapData"),
          where("companyProfileId", "in", chunk)
        );
        jobPromises.push(getDocs(q));
      }

      const jobSnapshots = await Promise.all(jobPromises);
      const matchingJobs: MapDataJob[] = [];
      for (const snap of jobSnapshots) {
        for (const docSnap of snap.docs) {
          matchingJobs.push({ id: docSnap.id, ...docSnap.data() } as MapDataJob);
        }
      }

      // Transform the results to DisplayLocation format
      const displayLocs = results.map(result => {
        const company = result as CompanyProfileData & { location: LocationData };
        return {
          id: `${company.id}-${company.location.id}`,
          locationId: company.location.id,
          name: company.companyName || 'Unnamed Company',
          address: company.location.address,
          companyId: company.id,
          companyName: company.companyName || 'Unnamed Company',
          lat: company.location.lat,
          lng: company.location.lng,
          status: 'Operational' as DisplayLocation['status'] // Default status
        };
      });

      // Set final results
      setDisplayLocations(displayLocs);
      setJobs(matchingJobs);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
      setLoading(false);
    }
  };

  // Initialize Google Maps
  useEffect(() => {
    // Load Google Maps API
    if (!window.google) {
      // Define the callback function
      window.initMap = () => {
        setMapLoaded(true);
      };

      // Create script tag and append to document
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&callback=initMap`;
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);

      return () => {
        // Clean up
        window.initMap = () => {};
        document.head.removeChild(script);
      };
    } else {
      setMapLoaded(true);
    }
  }, []);

  // Initialize map after API is loaded
  useEffect(() => {
    if (mapLoaded && mapRef.current) {
      // Create new map instance
      googleMapRef.current = new window.google.maps.Map(mapRef.current, {
        center: { lat: 39.8283, lng: -98.5795 }, // Center of the US
        zoom: 4,
        styles: [
          {
            "featureType": "water",
            "elementType": "geometry",
            "stylers": [
              { "color": "#e9e9e9" },
              { "lightness": 17 }
            ]
          },
          {
            "featureType": "landscape",
            "elementType": "geometry",
            "stylers": [
              { "color": "#f5f5f5" },
              { "lightness": 20 }
            ]
          },
          {
            "featureType": "road.highway",
            "elementType": "geometry.fill",
            "stylers": [
              { "color": "#ffffff" },
              { "lightness": 17 }
            ]
          },
          {
            "featureType": "administrative",
            "elementType": "geometry.stroke",
            "stylers": [
              { "color": "#1792B6" },
              { "lightness": 50 },
              { "weight": 1.2 }
            ]
          }
        ]
      });

      // Fetch data when map is ready
      getData({ lat: 39.8283, lng: -98.5795 });

      // Set up map idle event to fetch data for visible area
      googleMapRef.current.addListener('idle', () => {
        const center = googleMapRef.current.getCenter();
        getData({ 
          lat: center.lat(), 
          lng: center.lng() 
        });
      });
    }
  }, [mapLoaded]);

  // Update markers when locations change
  useEffect(() => {
    if (mapLoaded && googleMapRef.current) {
      // Clear existing markers
      if (markersRef.current) {
        markersRef.current.forEach(marker => marker.setMap(null));
      }

      // Add new markers
      markersRef.current = displayLocations.map(location => {
        const marker = new window.google.maps.Marker({
          position: { lat: location.lat, lng: location.lng },
          map: googleMapRef.current,
          title: location.name,
          icon: {
            path: window.google.maps.SymbolPath.CIRCLE,
            scale: 10,
            fillColor: getStatusColor(location.status),
            fillOpacity: 0.8,
            strokeColor: '#ffffff',
            strokeWeight: 2,
          }
        });

        // Add click event to marker
        marker.addListener('click', () => {
          setSelectedLocation(location);
        });

        return marker;
      });
      
      // Fit map to markers if there are any
      if (markersRef.current.length > 0) {
        const bounds = new window.google.maps.LatLngBounds();
        markersRef.current.forEach(marker => {
          bounds.extend(marker.getPosition());
        });
        googleMapRef.current.fitBounds(bounds);
      }
    }
  }, [displayLocations, mapLoaded]);

  return (
    <Box sx={{ height: 'calc(100vh - 120px)' }}>
      <Grid container spacing={3} sx={{ height: '100%' }}>
        {/* Map Panel */}
        <Grid item xs={12} md={8} sx={{ position: 'relative' }}>
          <Card sx={{ height: '100%', position: 'relative' }}>
            <CardContent sx={{ height: '100%', p: 0 }}>
              {loading || isLoading ? (
                <Box sx={{ 
                  height: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexDirection: 'column',
                  gap: 2
                }}>
                  <CircularProgress />
                  <Typography variant="body2" color="text.secondary">
                    {loading ? 'Loading map...' : 'Searching for locations...'}
                  </Typography>
                </Box>
              ) : (
                <Box
                  ref={mapRef}
                  sx={{
                    height: '100%',
                    width: '100%',
                    borderRadius: 2,
                    overflow: 'hidden',
                  }}
                >
                  {!mapLoaded && (
                    <Box sx={{ 
                      height: '100%',
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      bgcolor: '#E8F0F3',
                    }}>
                      <CircularProgress />
                    </Box>
                  )}
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Location List Panel */}
        <Grid item xs={12} md={4}>
          <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <CardContent sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>
                Battery Locations
              </Typography>
              
              {/* Search */}
              <Box sx={{ display: 'flex', mb: 2 }}>
                <TextField
                  fullWidth
                  size="small"
                  placeholder="Search locations..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  InputProps={{
                    startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />,
                  }}
                />
              </Box>
              
              {/* Selected Location Details */}
              {selectedLocation && (
                <Card sx={{ mb: 2, border: `1px solid ${getStatusColor(selectedLocation.status)}` }}>
                  <CardContent sx={{ p: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                        {selectedLocation.name}
                      </Typography>
                      <Chip 
                        label={selectedLocation.status} 
                        size="small"
                        sx={{ 
                          bgcolor: `${getStatusColor(selectedLocation.status)}20`, 
                          color: getStatusColor(selectedLocation.status),
                          fontWeight: 500
                        }} 
                      />
                    </Box>
                    
                    <Typography variant="body2" sx={{ mb: 1 }}>
                      <LocationOnIcon sx={{ fontSize: 16, mr: 0.5, verticalAlign: 'text-bottom' }} />
                      {selectedLocation.address}
                    </Typography>
                    
                    <Typography variant="body2" sx={{ mb: 1 }}>
                      Company: <b>{selectedLocation.companyName}</b>
                    </Typography>
                    
                    <Divider sx={{ my: 1 }} />
                    
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="body2">
                        Battery Type: <b>{selectedLocation.batteryType}</b>
                      </Typography>
                      <Typography variant="body2">
                        Capacity: <b>{selectedLocation.batteryCapacity} kWh</b>
                      </Typography>
                    </Box>
                    
                    <Button 
                      variant="outlined" 
                      size="small" 
                      startIcon={<InfoIcon />} 
                      sx={{ mt: 2, width: '100%' }}
                    >
                      View Full Details
                    </Button>
                  </CardContent>
                </Card>
              )}
              
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2, mb: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  {filteredLocations.length} location{filteredLocations.length !== 1 ? 's' : ''} found
                </Typography>
                {jobs.length > 0 && (
                  <Chip 
                    label={`${jobs.length} job${jobs.length !== 1 ? 's' : ''} available`} 
                    size="small" 
                    sx={{ bgcolor: 'rgba(23, 146, 182, 0.1)', color: '#1792B6' }} 
                  />
                )}
              </Box>
              
              {/* Location List */}
              <Box sx={{ overflow: 'auto', flexGrow: 1, maxHeight: selectedLocation ? 'calc(100vh - 440px)' : 'calc(100vh - 250px)' }}>
                {loading || isLoading ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}>
                    <CircularProgress size={24} />
                  </Box>
                ) : filteredLocations.length > 0 ? (
                  filteredLocations.map((location) => (
                    <Card 
                      key={location.id}
                      sx={{ 
                        mb: 1.5,
                        cursor: 'pointer',
                        boxShadow: selectedLocation?.id === location.id ? 
                          `0 0 0 2px ${getStatusColor(location.status)}` : 'none',
                        '&:hover': { bgcolor: 'background.paper' }
                      }}
                      onClick={() => handleSelectLocation(location)}
                    >
                      <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                            {location.name}
                          </Typography>
                          <Box 
                            sx={{ 
                              width: 10, 
                              height: 10, 
                              borderRadius: '50%', 
                              bgcolor: getStatusColor(location.status),
                              mt: 0.5
                            }}
                          />
                        </Box>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                          <LocationOnIcon sx={{ fontSize: 16, mr: 0.5, verticalAlign: 'text-bottom' }} />
                          {location.address.length > 30 ? `${location.address.substring(0, 30)}...` : location.address}
                        </Typography>
                        <Typography variant="caption" sx={{ display: 'block', color: 'text.secondary' }}>
                          {location.companyName}
                        </Typography>
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <Typography variant="body2" sx={{ textAlign: 'center', mt: 2 }}>
                    No locations found matching your search
                  </Typography>
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default MapView;
