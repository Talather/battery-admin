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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
  FormControlLabel,
  Switch,
} from '@mui/material';
import { supabase } from '../../lib/supabase';

interface EditFTOProps {
  open: boolean;
  onClose: () => void;
  ftoId: string;
  onUpdate: () => void;
}

interface FTO {
  id: string;
  athleteId: string;
  tokensForSale: number;
  purchaseLimit: number;
  roundNumber: number;
  startDate: string;
  endDate: string;
  coverImageUrl: string;
  videoUrl: string;
  active: boolean;
}

interface Athlete {
  id: string;
  firstName: string;
  lastName: string;
  fanTokenSymbol: string;
}

export default function EditFTO({ open, onClose, ftoId, onUpdate }: EditFTOProps) {
  const [fto, setFto] = useState<FTO | null>(null);
  const [athletes, setAthletes] = useState<Athlete[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [otherActiveFtoExists, setOtherActiveFtoExists] = useState(false);
  const [activeWarning, setActiveWarning] = useState(false);

  useEffect(() => {
    if (open && ftoId) {
      fetchFTOData();
      fetchAthletes();
      checkOtherActiveFTOs();
    }
  }, [open, ftoId]);

  const fetchFTOData = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('Ftos')
        .select('*')
        .eq('id', ftoId)
        .single();

      if (error) throw error;
      setFto(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch FTO data');
    } finally {
      setLoading(false);
    }
  };

  const fetchAthletes = async () => {
    try {
      const { data, error } = await supabase
        .from('Athletes')
        .select('id, firstName, lastName, fanTokenSymbol');

      if (error) throw error;
      setAthletes(data || []);
    } catch (err) {
      console.error('Error fetching athletes:', err);
    }
  };

  const checkOtherActiveFTOs = async () => {
    try {
      const { data, error } = await supabase
        .from('Ftos')
        .select('id')
        .eq('active', true)
        .neq('id', ftoId);
      
      if (error) throw error;
      setOtherActiveFtoExists(data && data.length > 0);
    } catch (err) {
      console.error('Error checking active FTOs:', err);
    }
  };

  const handleTextChange = (field: keyof FTO) => (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    if (!fto) return;
    setFto({ ...fto, [field]: event.target.value });
  };

  const handleNumberChange = (field: keyof FTO) => (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    if (!fto) return;
    setFto({ ...fto, [field]: Number(event.target.value) });
  };

  const handleSelectChange = (field: keyof FTO) => (
    event: SelectChangeEvent
  ) => {
    if (!fto) return;
    setFto({ ...fto, [field]: event.target.value });
  };

  const handleSwitchChange = (field: keyof FTO) => (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    if (!fto) return;
    
    const newValue = event.target.checked;
    
    if (field === 'active' && newValue && otherActiveFtoExists) {
      setActiveWarning(true);
    } else {
      setActiveWarning(false);
    }
    
    setFto({ ...fto, [field]: newValue });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fto) return;

    try {
      setSaving(true);
      
      // If this FTO is being set to active, deactivate any other active FTOs
      if (fto.active && otherActiveFtoExists) {
        const { error: updateError } = await supabase
          .from('Ftos')
          .update({ active: false })
          .neq('id', ftoId)
          .eq('active', true);
        
        if (updateError) throw updateError;
      }
      
      const { error } = await supabase
        .from('Ftos')
        .update(fto)
        .eq('id', ftoId);

      if (error) throw error;
      onUpdate();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update FTO');
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

  if (!fto) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Edit Fan Token Offering</DialogTitle>
      <form onSubmit={handleSubmit}>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Athlete</InputLabel>
                <Select
                  value={fto.athleteId}
                  onChange={handleSelectChange('athleteId')}
                  label="Athlete"
                  required
                >
                  {athletes.map((athlete) => (
                    <MenuItem key={athlete.id} value={athlete.id}>
                      {athlete.firstName} {athlete.lastName} ({athlete.fanTokenSymbol})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Tokens for Sale"
                type="number"
                value={fto.tokensForSale}
                onChange={handleNumberChange('tokensForSale')}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Purchase Limit"
                type="number"
                value={fto.purchaseLimit}
                onChange={handleNumberChange('purchaseLimit')}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Round Number"
                type="number"
                value={fto.roundNumber}
                onChange={handleNumberChange('roundNumber')}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Start Date"
                type="datetime-local"
                value={fto.startDate ? new Date(fto.startDate).toISOString().slice(0, 16) : ''}
                onChange={handleTextChange('startDate')}
                InputLabelProps={{ shrink: true }}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="End Date"
                type="datetime-local"
                value={fto.endDate ? new Date(fto.endDate).toISOString().slice(0, 16) : ''}
                onChange={handleTextChange('endDate')}
                InputLabelProps={{ shrink: true }}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Cover Image URL"
                value={fto.coverImageUrl}
                onChange={handleTextChange('coverImageUrl')}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Video URL"
                value={fto.videoUrl}
                onChange={handleTextChange('videoUrl')}
              />
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={fto.active || false}
                    onChange={handleSwitchChange('active')}
                    name="active"
                  />
                }
                label="Set as Active FTO"
              />
              {activeWarning && (
                <Alert severity="warning" sx={{ mt: 1 }}>
                  Another FTO is currently active. Setting this FTO as active will deactivate the other one.
                </Alert>
              )}
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
