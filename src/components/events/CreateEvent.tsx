import { useState, useEffect } from 'react';
import { 
  Box, 
  Button, 
  TextField, 
  Typography, 
  Paper, 
  MenuItem, 
  FormControlLabel, 
  Switch, 
  Alert,
  FormControl,
  FormHelperText,
  InputLabel,
  Select,
  Grid
} from '@mui/material';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { supabase } from '../../lib/supabase';

interface AthleteToken {
  id: string;
  firstName: string;
  lastName: string;
  fanTokenSymbol: string;
}

// Validation schema for event creation
const validationSchema = Yup.object({
  athelete_token_id: Yup.string().required('Athlete Token is required'),
  name: Yup.string().required('Event name is required'),
  description: Yup.string().required('Description is required'),
  type: Yup.string()
    .required('Event type is required')
    .oneOf(['video', 'live_stream', 'contest'], 'Invalid event type'),
  video_url: Yup.string().when('type', {
    is: 'video',
    then: (schema) => schema.optional(),
    otherwise: (schema) => schema.optional(),
  }),
  live_stream_url: Yup.string().when('type', {
    is: 'live_stream',
    then: (schema) => schema.required('Live stream URL is required for live stream events'),
    otherwise: (schema) => schema.optional(),
  }),
});

export default function CreateEvent() {
  const [athleteTokens, setAthleteTokens] = useState<AthleteToken[]>([]);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoUploadProgress, setVideoUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    fetchAthleteTokens();
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

  const formik = useFormik({
    initialValues: {
      athelete_token_id: '',
      name: '',
      description: '',
      type: '',
      video_url: '',
      live_stream_url: '',
    },
    validationSchema,
    onSubmit: async (values) => {
      try {
        setIsUploading(true);
        let videoUrl = values.video_url;

        // Handle video upload for video type events when a file is selected
        if (values.type === 'video' && videoFile) {
          const { data: videoData, error: videoError } = await supabase.storage
            .from('athletes')
            .upload(`video-${Date.now()}-${videoFile.name}`, videoFile);
          
          if (videoError) throw videoError;
          
          videoUrl = supabase.storage.from('athletes').getPublicUrl(videoData.path).data.publicUrl;
        }

        // Prepare data for insertion
        const eventData = {
          athelete_token_id: values.athelete_token_id,
          name: values.name,
          description: values.description,
          type: values.type,
          video_url: values.type === 'video' ? videoUrl : null,
          live_stream_url: values.type === 'live_stream' ? values.live_stream_url : null,
        };

        // Insert the event into the database
        const { error } = await supabase.from('Events').insert([eventData]);

        if (error) throw error;
        
        alert('Event created successfully!');
        formik.resetForm();
        setVideoFile(null);
        setVideoUploadProgress(0);
      } catch (error) {
        console.error('Error:', error);
        alert('Error creating event');
      } finally {
        setIsUploading(false);
      }
    },
  });

  const handleTypeChange = (event: React.ChangeEvent<{ value: unknown }>) => {
    const newType = event.target.value as string;
    formik.setFieldValue('type', newType);
    
    // Reset video URL and file when switching away from video type
    if (newType !== 'video') {
      formik.setFieldValue('video_url', '');
      setVideoFile(null);
    }
    
    // Reset live stream URL when switching away from live stream type
    if (newType !== 'live_stream') {
      formik.setFieldValue('live_stream_url', '');
    }
  };

  const handleVideoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      setVideoFile(file);
      // Clear the text field since we're using a file
      formik.setFieldValue('video_url', '');
    }
  };

  return (
    <Paper sx={{ p: 4 }}>
      <Typography variant="h5" gutterBottom>
        Create New Event
      </Typography>
      <Box component="form" onSubmit={formik.handleSubmit} sx={{ mt: 2 }}>
        {/* Athlete Token Selector */}
        <TextField
          fullWidth
          margin="normal"
          name="athelete_token_id"
          label="Select Athlete"
          select
          value={formik.values.athelete_token_id}
          onChange={formik.handleChange}
          error={formik.touched.athelete_token_id && Boolean(formik.errors.athelete_token_id)}
          helperText={formik.touched.athelete_token_id && formik.errors.athelete_token_id}
        >
          {athleteTokens.map((token) => (
            <MenuItem key={token.id} value={token.id}>
              {token.firstName} {token.lastName} ({token.fanTokenSymbol})
            </MenuItem>
          ))}
        </TextField>

        {/* Event Name */}
        <TextField
          fullWidth
          margin="normal"
          name="name"
          label="Event Name"
          value={formik.values.name}
          onChange={formik.handleChange}
          error={formik.touched.name && Boolean(formik.errors.name)}
          helperText={formik.touched.name && formik.errors.name}
        />

        {/* Event Description */}
        <TextField
          fullWidth
          margin="normal"
          name="description"
          label="Event Description"
          multiline
          rows={4}
          value={formik.values.description}
          onChange={formik.handleChange}
          error={formik.touched.description && Boolean(formik.errors.description)}
          helperText={formik.touched.description && formik.errors.description}
        />

        {/* Event Type */}
        <FormControl 
          fullWidth 
          margin="normal"
          error={formik.touched.type && Boolean(formik.errors.type)}
        >
          <InputLabel id="event-type-label">Event Type</InputLabel>
          <Select
            labelId="event-type-label"
            name="type"
            value={formik.values.type}
            onChange={(e) => handleTypeChange(e as React.ChangeEvent<{ value: unknown }>)}
            label="Event Type"
          >
            <MenuItem value="video">Video</MenuItem>
            <MenuItem value="live_stream">Live Stream</MenuItem>
            <MenuItem value="contest">Contest</MenuItem>
          </Select>
          {formik.touched.type && formik.errors.type && (
            <FormHelperText>{formik.errors.type}</FormHelperText>
          )}
        </FormControl>

        {/* Conditional Fields Based on Type */}
        {formik.values.type === 'video' && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle1" gutterBottom>
              Upload Video or Provide Video URL
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <input
                  accept="video/*"
                  style={{ display: 'none' }}
                  id="video-upload"
                  type="file"
                  onChange={handleVideoChange}
                />
                <label htmlFor="video-upload">
                  <Button
                    variant="contained"
                    component="span"
                    fullWidth
                    sx={{ mb: 2 }}
                  >
                    Select Video File
                  </Button>
                </label>
                {videoFile && (
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    Selected: {videoFile.name}
                  </Typography>
                )}
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  Or provide video URL:
                </Typography>
                <TextField
                  fullWidth
                  name="video_url"
                  label="Video URL"
                  value={formik.values.video_url}
                  onChange={formik.handleChange}
                  disabled={!!videoFile}
                  error={formik.touched.video_url && Boolean(formik.errors.video_url)}
                  helperText={formik.touched.video_url && formik.errors.video_url}
                />
              </Grid>
            </Grid>
          </Box>
        )}

        {formik.values.type === 'live_stream' && (
          <TextField
            fullWidth
            margin="normal"
            name="live_stream_url"
            label="Live Stream URL"
            value={formik.values.live_stream_url}
            onChange={formik.handleChange}
            error={formik.touched.live_stream_url && Boolean(formik.errors.live_stream_url)}
            helperText={formik.touched.live_stream_url && formik.errors.live_stream_url}
          />
        )}

        {/* Submit Button */}
        <Button 
          type="submit" 
          variant="contained" 
          color="primary" 
          sx={{ mt: 3 }}
          disabled={isUploading}
        >
          {isUploading ? 'Creating Event...' : 'Create Event'}
        </Button>
      </Box>
    </Paper>
  );
}
