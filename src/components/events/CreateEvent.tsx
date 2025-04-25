import { useState, useEffect } from 'react';
import { 
  Box, 
  Button, 
  TextField, 
  Typography, 
  Paper, 
  MenuItem, 
  FormControl,
  FormHelperText,
  InputLabel,
  Select,
  Grid
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { supabase } from '../../lib/supabase';
import { isBefore, startOfDay } from 'date-fns';

interface AthleteToken {
  id: string;
  firstName: string;
  lastName: string;
  fanTokenSymbol: string;
  dayOfTheWeek?: string;
}

// Map day names to their numeric values (0 = Sunday, 1 = Monday, etc.)
const dayNameToNumber: Record<string, number> = {
  'Sunday': 0,
  'Monday': 1,
  'Tuesday': 2,
  'Wednesday': 3,
  'Thursday': 4,
  'Friday': 5,
  'Saturday': 6
};

// Validation schema for event creation
const validationSchema = Yup.object({
  athelete_token_id: Yup.string().required('Athlete Token is required'),
  name: Yup.string().required('Event name is required'),
  description: Yup.string().required('Description is required'),
  type: Yup.string()
    .required('Event type is required')
    .oneOf(['video', 'live_stream', 'contest'], 'Invalid event type'),
  day: Yup.date()
    .required('Event date is required')
    .nullable(),
  contest_end_date: Yup.date()
    .nullable()
    .when('type', {
      is: 'contest',
      then: (schema) => schema.required('Contest end date is required'),
      otherwise: (schema) => schema.nullable(),
    }),
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
  const [selectedAthlete, setSelectedAthlete] = useState<AthleteToken | null>(null);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoUploadProgress, setVideoUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    fetchAthleteTokens();
  }, []);
  console.log(videoUploadProgress);

  const fetchAthleteTokens = async () => {
    try {
      const { data, error } = await supabase
        .from('Atheletes')
        .select('id, firstName, lastName, fanTokenSymbol, dayOfTheWeek');
      if (error) throw error;
      setAthleteTokens(data || []);
    } catch (error) {
      console.error('Error fetching athlete tokens:', error);
    }
  };

  // Function to determine if a date should be disabled
  const shouldDisableDate = (date: Date) => {
    // Disable dates in the past
    if (isBefore(date, startOfDay(new Date()))) {
      return true;
    }

    // If no athlete is selected, don't disable based on day of week
    if (!selectedAthlete || !selectedAthlete.dayOfTheWeek) {
      return false;
    }

    // Check if the date's day of week matches the athlete's dayOfTheWeek
    const dayNumber = date.getDay(); // 0 for Sunday, 1 for Monday, etc.
    const athleteDayNumber = dayNameToNumber[selectedAthlete.dayOfTheWeek];
    
    return dayNumber !== athleteDayNumber;
  };

  const handleAthleteChange = (event: React.ChangeEvent<{ value: unknown }>) => {
    const athleteId = event.target.value as string;
    formik.setFieldValue('athelete_token_id', athleteId);
    
    // Find the selected athlete
    const athlete = athleteTokens.find(a => a.id === athleteId) || null;
    setSelectedAthlete(athlete);
    
    // Reset the day field when athlete changes
    formik.setFieldValue('day', null);
  };

  const formik = useFormik({
    initialValues: {
      athelete_token_id: '',
      name: '',
      description: '',
      type: '',
      day: null,
      contest_end_date: null,
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
        const formatDateToLocalDateString = (date: Date) =>
          date.toLocaleDateString('en-CA'); // gives '2025-04-13'
          if(values.day === null) {
            return;
          }
        // Prepare data for insertion
        const eventData = {
          athelete_token_id: values.athelete_token_id,
          name: values.name,
          description: values.description,
          type: values.type,
          day: formatDateToLocalDateString(values.day),
          contest_end_date: values.type === 'contest' ? values.contest_end_date : null,
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
        setSelectedAthlete(null);
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

    // Reset contest end date when switching away from contest type
    if (newType !== 'contest') {
      formik.setFieldValue('contest_end_date', null);
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
          onChange={handleAthleteChange}
          error={formik.touched.athelete_token_id && Boolean(formik.errors.athelete_token_id)}
          helperText={formik.touched.athelete_token_id && formik.errors.athelete_token_id}
        >
          {athleteTokens.map((token) => (
            <MenuItem key={token.id} value={token.id}>
              {token.firstName} {token.lastName} ({token.fanTokenSymbol})
              {token.dayOfTheWeek && ` - Available on ${token.dayOfTheWeek}s`}
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

        {/* Event Date */}
        <LocalizationProvider dateAdapter={AdapterDateFns}>
          <DatePicker
            label="Event Date"
            value={formik.values.day}
            onChange={(date) => formik.setFieldValue('day', date)}
            shouldDisableDate={shouldDisableDate} 
            slotProps={{
              textField: {
                fullWidth: true,
                margin: 'normal',
                error: formik.touched.day && Boolean(formik.errors.day),
                helperText: selectedAthlete?.dayOfTheWeek 
                  ? `Select a ${selectedAthlete.dayOfTheWeek}${formik.touched.day && formik.errors.day ? ` - ${formik.errors.day}` : ''}`
                  : (formik.touched.day && formik.errors.day as string) || "Select an athlete first to see available days",
              }
            }}
          />
        </LocalizationProvider>

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

        {/* Contest End Date - Only visible for contest type */}
        {formik.values.type === 'contest' && (
          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <DatePicker
              label="Contest End Date"
              value={formik.values.contest_end_date}
              onChange={(date) => formik.setFieldValue('contest_end_date', date)}
              shouldDisableDate={(date) => isBefore(date, formik.values.day || new Date())}
              slotProps={{
                textField: {
                  fullWidth: true,
                  margin: 'normal',
                  error: formik.touched.contest_end_date && Boolean(formik.errors.contest_end_date),
                  helperText: formik.touched.contest_end_date && formik.errors.contest_end_date as string,
                }
              }}
            />
          </LocalizationProvider>
        )}

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
