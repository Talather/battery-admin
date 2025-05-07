import { useState, useEffect, useRef } from 'react';
import {
  Box,
  TextField,
  List,
  ListItem,
  ListItemText,
  Paper,
  CircularProgress,
  Typography
} from '@mui/material';
import LocationOnIcon from '@mui/icons-material/LocationOn';

interface AddressAutocompleteProps {
  setAddress: (address: string) => void;
  setCoordinates: (coords: { lat: number; lng: number }) => void;
  defaultAddress?: string;
}

declare global {
  interface Window {
    google: any;
  }
}

const AddressAutocomplete = ({ 
  setAddress, 
  setCoordinates, 
  defaultAddress = '' 
}: AddressAutocompleteProps) => {
  const [query, setQuery] = useState(defaultAddress);
  const [predictions, setPredictions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const inputRef = useRef<HTMLInputElement>(null);

  // Set initial value if defaultAddress is provided
  useEffect(() => {
    if (defaultAddress) {
      setQuery(defaultAddress);
    }
  }, [defaultAddress]);

  // Handle input changes and fetch predictions
  useEffect(() => {
    if (!window.google) {
      setError('Google Maps API not loaded');
      return;
    }

    if (query.length < 3) {
      setPredictions([]);
      return;
    }

    const fetchPredictions = () => {
      setLoading(true);
      setError('');
      
      const autocompleteService = new window.google.maps.places.AutocompleteService();
      
      autocompleteService.getPlacePredictions(
        { input: query },
        (results: any[], status: string) => {
          setLoading(false);
          
          if (status === 'OK' && results) {
            setPredictions(results);
          } else {
            setPredictions([]);
            if (status !== 'ZERO_RESULTS') {
              setError('Failed to fetch address suggestions');
            }
          }
        }
      );
    };

    // Debounce the input to avoid excessive API calls
    const timer = setTimeout(() => {
      fetchPredictions();
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  // Handle address selection
  const handleSelectAddress = (placeId: string, description: string) => {
    setQuery(description);
    setPredictions([]);
    
    const geocoder = new window.google.maps.Geocoder();
    
    geocoder.geocode({ placeId }, (results: any[], status: string) => {
      if (status === 'OK' && results && results.length > 0) {
        const location = results[0].geometry.location;
        const formattedAddress = results[0].formatted_address;
        
        const latitude = location.lat();
        const longitude = location.lng();
        
        setAddress(formattedAddress);
        setCoordinates({ lat: latitude, lng: longitude });
      } else {
        setError('Failed to get coordinates for this address');
      }
    });
  };

  return (
    <Box sx={{ position: 'relative', width: '100%' }}>
      <TextField
        fullWidth
        label="Search Address"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Enter an address to search"
        inputRef={inputRef}
        required
        autoComplete="off"
        InputProps={{
          endAdornment: loading ? <CircularProgress size={20} /> : null,
        }}
      />
      
      {error && (
        <Typography color="error" variant="caption" sx={{ mt: 1 }}>
          {error}
        </Typography>
      )}
      
      {predictions.length > 0 && (
        <Paper
          elevation={3}
          sx={{
            position: 'absolute',
            width: '100%',
            maxHeight: 300,
            overflow: 'auto',
            mt: 0.5,
            zIndex: 1000,
          }}
        >
          <List sx={{ p: 0 }}>
            {predictions.map((prediction) => (
              <ListItem
                key={prediction.place_id}
                onClick={() => handleSelectAddress(prediction.place_id, prediction.description)}
                sx={{
                  '&:hover': { bgcolor: 'rgba(23, 146, 182, 0.08)' },
                  cursor: 'pointer',
                  py: 1
                }}
              >
                <LocationOnIcon sx={{ mr: 2, color: 'primary.main' }} />
                <ListItemText 
                  primary={prediction.structured_formatting?.main_text || prediction.description}
                  secondary={prediction.structured_formatting?.secondary_text}
                />
              </ListItem>
            ))}
          </List>
        </Paper>
      )}
    </Box>
  );
};

export default AddressAutocomplete;
