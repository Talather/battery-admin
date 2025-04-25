import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  Grid,
  CircularProgress,
  Alert,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Typography,
} from '@mui/material';
import { supabase } from '../../lib/supabase';
import { countries } from './../../lib/countries';

interface EditAthleteTokenProps {
  open: boolean;
  onClose: () => void;
  athleteId: string;
  onUpdate: () => void;
}

interface AthleteToken {
  firstName: string;
  lastName: string;
  nickName: string;
  description: string;
  country: string;
  sport: string;
  dayOfTheWeek: string;
  fanTokenSymbol: string;
  fanTokenInitialPrice: number;
  totalNoOfFanTokens: number;
  profilePicture?: string;
}

export default function EditAthleteToken({ open, onClose, athleteId, onUpdate }: EditAthleteTokenProps) {
  const [athlete, setAthlete] = useState<AthleteToken | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [profilePicture, setProfilePicture] = useState<File | null>(null);
  const [currentProfilePicture, setCurrentProfilePicture] = useState<string>('');

  useEffect(() => {
    if (open && athleteId) {
      fetchAthleteData();
    }
  }, [open, athleteId]);

  const fetchAthleteData = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('Atheletes')
        .select('*')
        .eq('id', athleteId)
        .single();

      if (error) throw error;
      setAthlete(data);
      if (data.profilePicture) {
        setCurrentProfilePicture(data.profilePicture);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch athlete data');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: keyof AthleteToken) => (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!athlete) return;
    
    const value = field === 'fanTokenInitialPrice' || field === 'totalNoOfFanTokens' 
      ? Number(event.target.value)
      : event.target.value;
    
    setAthlete({ ...athlete, [field]: value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!athlete) return;

    try {
      setSaving(true);
      
      let profilePictureUrl = currentProfilePicture;
      
      // Upload new profile picture if one was selected
      if (profilePicture) {
        const fileExt = profilePicture.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        
        const { data, error: uploadError } = await supabase.storage
          .from('athletes')
          .upload(fileName, profilePicture);

        if (uploadError) throw uploadError;
        profilePictureUrl = "https://veoivkpeywpcyxaikgng.supabase.co/storage/v1/object/public/" + data.fullPath;
      }

      const { error } = await supabase
        .from('Atheletes')
        .update({
          ...athlete,
          profilePicture: profilePictureUrl
        })
        .eq('id', athleteId);

      if (error) throw error;
      onUpdate();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update athlete');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Dialog open={open} onClose={onClose}>
        <DialogContent>
          <Box display="flex" justifyContent="center" p={3}>
            <CircularProgress />
          </Box>
        </DialogContent>
      </Dialog>
    );
  }

  if (!athlete) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Edit Athlete Token</DialogTitle>
      <form onSubmit={handleSubmit}>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="First Name"
                value={athlete.firstName}
                onChange={handleChange('firstName')}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Last Name"
                value={athlete.lastName}
                onChange={handleChange('lastName')}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Nickname"
                value={athlete.nickName}
                onChange={handleChange('nickName')}
              />
            </Grid>
            
            {/* Profile Picture Section */}
            <Grid item xs={12}>
              <Box sx={{ mb: 2 }}>
                {currentProfilePicture && (
                  <Box mb={2}>
                    <Typography variant="subtitle1" gutterBottom>Current Profile Picture:</Typography>
                    <img 
                      src={currentProfilePicture} 
                      alt="Athlete profile" 
                      style={{ width: 100, height: 100, objectFit: 'cover', borderRadius: '4px' }} 
                    />
                  </Box>
                )}
                
                <Button
                  variant="contained"
                  component="label"
                >
                  Update Profile Picture
                  <input
                    type="file"
                    hidden
                    accept="image/*"
                    onChange={(e) => setProfilePicture(e.target.files?.[0] || null)}
                  />
                </Button>
                {profilePicture && (
                  <Typography variant="body2" sx={{ mt: 1 }}>
                    New image selected: {profilePicture.name}
                  </Typography>
                )}
              </Box>
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                value={athlete.description}
                onChange={handleChange('description')}
                multiline
                rows={4}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required>
                <InputLabel id="country-label">Country</InputLabel>
                <Select
                  labelId="country-label"
                  id="country"
                  value={athlete.country}
                  label="Country"
                  onChange={(e) => {
                    setAthlete({ ...athlete, country: e.target.value });
                  }}
                >
                  {countries.map((country: { code: string; name: string }) => (
                    <MenuItem key={country.code} value={country.name}>
                      {country.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Sport"
                value={athlete.sport}
                onChange={handleChange('sport')}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Day of the Week"
                value={athlete.dayOfTheWeek}
                onChange={handleChange('dayOfTheWeek')}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Fan Token Symbol"
                value={athlete.fanTokenSymbol}
                onChange={handleChange('fanTokenSymbol')}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Fan Token Initial Price"
                type="number"
                value={athlete.fanTokenInitialPrice}
                onChange={handleChange('fanTokenInitialPrice')}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Total Number of Fan Tokens"
                type="number"
                value={athlete.totalNoOfFanTokens}
                onChange={handleChange('totalNoOfFanTokens')}
                required
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Cancel</Button>
          <Button
            type="submit"
            variant="contained"
            disabled={saving}
            startIcon={saving ? <CircularProgress size={20} /> : null}
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
