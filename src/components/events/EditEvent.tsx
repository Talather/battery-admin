import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Box,
  Typography,
  FormHelperText,
  CircularProgress,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { supabase } from '../../lib/supabase';
import { isBefore, startOfDay, parseISO } from 'date-fns';

interface Athlete {
  id: string;
  firstName: string;
  lastName: string;
  profilePicture?: string;
  dayOfTheWeek?: string;
}

interface EditEventProps {
  eventId: string;
  open: boolean;
  onClose: () => void;
  athletes: Athlete[];
}

interface EventData {
  id: string;
  athelete_token_id: string;
  name: string;
  description: string;
  type: 'video' | 'live_stream' | 'contest';
  day: string | null;
  contest_end_date?: Date | null;
  video_url: string | null;
  live_stream_url: string | null;
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
    then: (schema) => schema.required('Video URL is required for video events'),
    otherwise: (schema) => schema.optional(),
  }),
  live_stream_url: Yup.string().when('type', {
    is: 'live_stream',
    then: (schema) => schema.required('Live stream URL is required for live stream events'),
    otherwise: (schema) => schema.optional(),
  }),
});

export default function EditEvent({ eventId, open, onClose, athletes }: EditEventProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedAthlete, setSelectedAthlete] = useState<Athlete | null>(null);
  const [initialValues, setInitialValues] = useState<any>({
    athelete_token_id: '',
    name: '',
    description: '',
    type: '',
    day:  '',
    contest_end_date: null,
    video_url: '',
    live_stream_url: '',
  });

  useEffect(() => {
    if (open && eventId) {
      fetchEventDetails();
    }
  }, [eventId, open]);

  const fetchEventDetails = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('Events')
        .select('*')
        .eq('id', eventId)
        .single();
      
      if (error) throw error;
      
      if (data) {
        setInitialValues({
          athelete_token_id: data.athelete_token_id || '',
          name: data.name || '',
          description: data.description || '',
          type: data.type || '',
          day: data.day || '',
          contest_end_date: data.contest_end_date || null,
          video_url: data.video_url || '',
          live_stream_url: data.live_stream_url || '',
        });

        // Set the selected athlete
        const athlete = athletes.find(a => a.id === data.athelete_token_id) || null;
        setSelectedAthlete(athlete);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred while fetching event details');
    } finally {
      setLoading(false);
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
    const athlete = athletes.find(a => a.id === athleteId) || null;
    setSelectedAthlete(athlete);
    
    // Reset the day field when athlete changes
    formik.setFieldValue('day', null);
  };

  const formik = useFormik({
    initialValues,
    validationSchema,
    enableReinitialize: true,
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
        }const formatDateToLocalDateString = (date: Date) =>
          date.toLocaleDateString('en-CA'); // gives '2025-04-13'
        // Prepare data for update
        const eventData: EventData = {
          id: eventId,
          athelete_token_id: values.athelete_token_id,
          name: values.name,
          description: values.description,
          type: values.type,
          day: formatDateToLocalDateString(values.day),
          contest_end_date: values.type === 'contest' ? values.contest_end_date : null,
          video_url: values.type === 'video' ? videoUrl : null,
          live_stream_url: values.type === 'live_stream' ? values.live_stream_url : null,
        };

        // Update the event in the database
        const { error } = await supabase
          .from('Events')
          .update(eventData)
          .eq('id', eventId);

        if (error) throw error;
        
        alert('Event updated successfully!');
        onClose();
      } catch (error) {
        console.error('Error:', error);
        alert('Error updating event');
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

  if (loading) {
    return (
      <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
        <DialogContent>
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 5 }}>
            <CircularProgress />
          </Box>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Edit Event</DialogTitle>
      <form onSubmit={formik.handleSubmit}>
        <DialogContent>
          {error && (
            <Typography color="error" sx={{ mb: 2 }}>
              {error}
            </Typography>
          )}

          {/* Athlete Token Selector */}
          <TextField
            fullWidth
            margin="normal"
            name="athlete_token_id"
            label="Select Athlete"
            select
            value={formik.values.athelete_token_id}
            onChange={handleAthleteChange}
            error={formik.touched.athelete_token_id && Boolean(formik.errors.athelete_token_id)}
            helperText={formik.touched.athelete_token_id && (formik.errors.athelete_token_id as string)}
          >
            {athletes.map((athlete) => (
              <MenuItem key={athlete.id} value={athlete.id}>
                {athlete.firstName} {athlete.lastName}
                {athlete.dayOfTheWeek && ` - Available on ${athlete.dayOfTheWeek}s`}
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
            helperText={formik.touched.name && (formik.errors.name as string)}
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
            helperText={formik.touched.description && (formik.errors.description as string)}
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
              <FormHelperText>{formik.errors.type as string}</FormHelperText>
            )}
          </FormControl>

          {/* Contest End Date - Only visible for contest type */}
          {formik.values.type === 'contest' && (
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <DatePicker
                label="Contest End Date"
                value={formik.values.contest_end_date}
                onChange={(date) => formik.setFieldValue('contest_end_date', date)}
                shouldDisableDate={(date) => {
                  const startDate = formik.values.day;
                  if (!startDate) return false;
                  // Parse the date properly if it's a string
                  const parsedStartDate = typeof startDate === 'string' ? parseISO(startDate) : startDate;
                  return isBefore(date, parsedStartDate);
                }}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    margin: 'normal',
                    error: formik.touched.contest_end_date && Boolean(formik.errors.contest_end_date),
                    helperText: formik.touched.contest_end_date && (formik.errors.contest_end_date as string),
                  }
                }}
              />
            </LocalizationProvider>
          )}

          {/* Conditional Fields Based on Type */}
          {formik.values.type === 'video' && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle1" gutterBottom>
                Update Video or Provide Video URL
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
                      {formik.values.video_url ? 'Change Video File' : 'Select Video File'}
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
                    helperText={formik.touched.video_url && (formik.errors.video_url as string)}
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
              helperText={formik.touched.live_stream_url && (formik.errors.live_stream_url as string)}
            />
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Cancel</Button>
          <Button 
            type="submit" 
            variant="contained" 
            color="primary"
            disabled={isUploading}
          >
            {isUploading ? 'Updating...' : 'Update Event'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
