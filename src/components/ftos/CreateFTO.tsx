import { useState, useEffect } from 'react';
import { Box, Button, TextField, Typography, Paper, MenuItem, FormControlLabel, Switch, Alert } from '@mui/material';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { supabase } from '../../lib/supabase';

interface AthleteToken {
  id: string;
  firstName: string;
  lastName: string;
  fanTokenSymbol: string;
}

const validationSchema = Yup.object({
  athleteTokenId: Yup.string().required('Athlete Token is required'),
  tokensForSale: Yup.number().required('Number of tokens is required').positive().integer(),
  purchaseLimit: Yup.number().required('Purchase limit is required').positive().integer(),
  roundNumber: Yup.number().required('Round number is required').positive().integer(),
  startDate: Yup.date().required('Start date is required'),
  endDate: Yup.date().required('End date is required')
    .min(Yup.ref('startDate'), 'End date must be after start date'),
  active: Yup.boolean(),
});

export default function CreateFTO() {
  const [athleteTokens, setAthleteTokens] = useState<AthleteToken[]>([]);
  const [coverImage, setCoverImage] = useState<File | null>(null);
  const [video, setVideo] = useState<File | null>(null);
  const [activeFtoExists, setActiveFtoExists] = useState(false);
  const [activeWarning, setActiveWarning] = useState(false);

  useEffect(() => {
    fetchAthleteTokens();
    checkActiveFTO();
  }, []);

  const fetchAthleteTokens = async () => {
    try {
      const { data, error } = await supabase
        .from('Atheletes')
        .select('id, firstName, lastName, fanTokenSymbol');
      if (error) throw error;
      setAthleteTokens(data || []);
    } catch (error) {
      console.error('Error fetching athlete tokens:', error);
    }
  };

  const checkActiveFTO = async () => {
    try {
      const { data, error } = await supabase
        .from('Ftos')
        .select('id')
        .eq('active', true);
      
      if (error) throw error;
      setActiveFtoExists(data && data.length > 0);
    } catch (error) {
      console.error('Error checking active FTOs:', error);
    }
  };

  const formik = useFormik({
    initialValues: {
      athleteTokenId: '',
      tokensForSale: '',
      purchaseLimit: '',
      roundNumber: '',
      startDate: null,
      endDate: null,
      active: false,
    },
    validationSchema,
    onSubmit: async (values) => {
      try {
        // If this FTO is being set to active, deactivate any currently active FTOs
        if (values.active) {
          const { error: updateError } = await supabase
            .from('Ftos')
            .update({ active: false })
            .eq('active', true);
          
          if (updateError) throw updateError;
        }

        let coverImageUrl = '';
        let videoUrl = '';

        if (coverImage) {
          const { data: imageData, error: imageError } = await supabase.storage
            .from('athletes')
            .upload(`cover-${Date.now()}`, coverImage);
          if (imageError) throw imageError;
          coverImageUrl = "https://veoivkpeywpcyxaikgng.supabase.co/storage/v1/object/public/" + imageData.fullPath;
        }

        if (video) {
          const { data: videoData, error: videoError } = await supabase.storage
            .from('athletes')
            .upload(`video-${Date.now()}`, video);
          if (videoError) throw videoError;
          videoUrl = "https://veoivkpeywpcyxaikgng.supabase.co/storage/v1/object/public/" + videoData.fullPath;
        }
        console.log(coverImageUrl, videoUrl);
        const { error } = await supabase.from('Ftos').insert([{
          ...values,
          coverImageUrl: coverImageUrl,
          videoUrl: videoUrl,
        }]);
        console.log(error);

        if (error) throw error;
        alert('FTO created successfully!');
        // formik.resetForm();
        setCoverImage(null);
        setVideo(null);
      } catch (error) {
        console.error('Error:', error);
        alert('Error creating FTO');
      }
    },
  });

  const handleActiveChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newActiveValue = event.target.checked;
    
    if (newActiveValue && activeFtoExists) {
      setActiveWarning(true);
    } else {
      setActiveWarning(false);
    }
    
    formik.setFieldValue('active', newActiveValue);
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Paper sx={{ p: 4 }}>
        <Typography variant="h5" gutterBottom>
          Create New FTO
        </Typography>
        <Box component="form" onSubmit={formik.handleSubmit} sx={{ mt: 2 }}>
          <TextField
            fullWidth
            margin="normal"
            name="athleteTokenId"
            label="Select Athlete Token"
            select
            value={formik.values.athleteTokenId}
            onChange={formik.handleChange}
            error={formik.touched.athleteTokenId && Boolean(formik.errors.athleteTokenId)}
            helperText={formik.touched.athleteTokenId && formik.errors.athleteTokenId}
          >
            {athleteTokens.map((token) => (
              <MenuItem key={token.id} value={token.id}>
                {token.firstName} {token.lastName} ({token.fanTokenSymbol})
              </MenuItem>
            ))}
          </TextField>

          <TextField
            fullWidth
            margin="normal"
            name="tokensForSale"
            label="Number of Fan Tokens for Sale"
            type="number"
            value={formik.values.tokensForSale}
            onChange={formik.handleChange}
            error={formik.touched.tokensForSale && Boolean(formik.errors.tokensForSale)}
            helperText={formik.touched.tokensForSale && formik.errors.tokensForSale}
          />

          <TextField
            fullWidth
            margin="normal"
            name="purchaseLimit"
            label="Fan Tokens Purchase Limit"
            type="number"
            value={formik.values.purchaseLimit}
            onChange={formik.handleChange}
            error={formik.touched.purchaseLimit && Boolean(formik.errors.purchaseLimit)}
            helperText={formik.touched.purchaseLimit && formik.errors.purchaseLimit}
          />

          <TextField
            fullWidth
            margin="normal"
            name="roundNumber"
            label="Round Number"
            type="number"
            value={formik.values.roundNumber}
            onChange={formik.handleChange}
            error={formik.touched.roundNumber && Boolean(formik.errors.roundNumber)}
            helperText={formik.touched.roundNumber && formik.errors.roundNumber}
          />

          <DateTimePicker
            label="FTO Start Date"
            value={formik.values.startDate}
            onChange={(value) => formik.setFieldValue('startDate', value)}
            sx={{ mt: 2, mb: 2, width: '100%' }}
          />

          <DateTimePicker
            label="FTO End Date"
            value={formik.values.endDate}
            onChange={(value) => formik.setFieldValue('endDate', value)}
            sx={{ mt: 2, mb: 2, width: '100%' }}
          />

          <Button
            variant="contained"
            component="label"
            sx={{ mt: 2, mb: 1 }}
          >
            Upload Cover Image
            <input
              type="file"
              hidden
              accept="image/*"
              onChange={(e) => setCoverImage(e.target.files?.[0] || null)}
            />
          </Button>
          {coverImage && (
            <Typography variant="body2" sx={{ ml: 2, mb: 2 }}>
              Selected image: {coverImage.name}
            </Typography>
          )}

          <Button
            variant="contained"
            component="label"
            sx={{ mt: 2, mb: 1 }}
          >
            Upload Video
            <input
              type="file"
              hidden
              accept="video/*"
              onChange={(e) => setVideo(e.target.files?.[0] || null)}
            />
          </Button>
          {video && (
            <Typography variant="body2" sx={{ ml: 2, mb: 2 }}>
              Selected video: {video.name}
            </Typography>
          )}

          <Box sx={{ mt: 2, mb: 2 }}>
            <FormControlLabel
              control={
                <Switch
                  checked={formik.values.active}
                  onChange={handleActiveChange}
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
          </Box>

          <Button
            type="submit"
            variant="contained"
            color="primary"
            sx={{ mt: 3 }}
            disabled={formik.isSubmitting}
          >
            Create FTO
          </Button>
        </Box>
      </Paper>
    </LocalizationProvider>
  );
}
