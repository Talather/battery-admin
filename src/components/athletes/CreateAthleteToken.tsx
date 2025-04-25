import { useState } from 'react';
import { Box, Button, TextField, MenuItem, Typography, Paper, FormControl, InputLabel, Select } from '@mui/material';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { supabase } from '../../lib/supabase';
import { countries } from '../../lib/countries';

const sports = [
  'Football',
  'Basketball',
  'Tennis',
  'Baseball',
  'Golf',
  'Boxing',
  'MMA',
  'US Football',
  'Rugby',
  'Cricket',
  'Formula 1',
  'Hockey',
  'E-sports'
];

const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const validationSchema = Yup.object({
  firstName: Yup.string().required('First name is required'),
  lastName: Yup.string().required('Last name is required'),
  nickName: Yup.string(),
  description: Yup.string().required('Description is required'),
  country: Yup.string().required('Country is required'),
  sport: Yup.string().required('Sport is required'),
  dayOfTheWeek: Yup.string().required('Day of the week is required'),
  fanTokenSymbol: Yup.string().required('Token symbol is required'),
  fanTokenInitialPrice: Yup.number().required('Initial price is required').positive(),
  totalNoOfFanTokens: Yup.number().required('Total number of tokens is required').positive().integer(),
});

export default function CreateAthleteToken() {
  const [profilePicture, setProfilePicture] = useState<File | null>(null);

  const formik = useFormik({
    initialValues: {
      firstName: '',
      lastName: '',
      nickName: '',
      description: '',
      country: '',
      sport: '',
      dayOfTheWeek: '',
      fanTokenSymbol: '',
      fanTokenInitialPrice: '',
      totalNoOfFanTokens: '',
    },
    validationSchema,
    onSubmit: async (values) => {
      try {
        let profilePictureUrl = '';
        
        if (profilePicture) {
          const fileExt = profilePicture.name.split('.').pop();
          const fileName = `${Math.random()}.${fileExt}`;
          console.log(fileExt , fileName);
          const { data, error } = await supabase.storage
            .from('athletes')
            .upload(fileName, profilePicture);
            console.log(error);


          if (error) throw error;
          profilePictureUrl = "https://veoivkpeywpcyxaikgng.supabase.co/storage/v1/object/public/" + data.fullPath;
        }
        const { error } = await supabase.from('Atheletes').insert([
          {
            ...values,
            profilePicture: profilePictureUrl,
          },
        ]);

        if (error) throw error;
        alert('Athlete token created successfully!');
        // formik.resetForm();
        setProfilePicture(null);
      } catch (error) {
        console.error('Error:', error);
        alert('Error creating athlete token');
      }
    },
  });

  return (
    <Paper sx={{ p: 4 }}>
      <Typography variant="h5" gutterBottom>
        Create New Athlete Fan Token
      </Typography>
      <Box component="form" onSubmit={formik.handleSubmit} sx={{ mt: 2 }}>
        <TextField
          fullWidth
          margin="normal"
          name="firstName"
          label="First Name"
          value={formik.values.firstName}
          onChange={formik.handleChange}
          error={formik.touched.firstName && Boolean(formik.errors.firstName)}
          helperText={formik.touched.firstName && formik.errors.firstName}
        />
        <TextField
          fullWidth
          margin="normal"
          name="lastName"
          label="Last Name"
          value={formik.values.lastName}
          onChange={formik.handleChange}
          error={formik.touched.lastName && Boolean(formik.errors.lastName)}
          helperText={formik.touched.lastName && formik.errors.lastName}
        />
        <TextField
          fullWidth
          margin="normal"
          name="nickName"
          label="Nickname (Optional)"
          value={formik.values.nickName}
          onChange={formik.handleChange}
        />
        <Button
          variant="contained"
          component="label"
          sx={{ mt: 2, mb: 2 }}
        >
          Upload Profile Picture
          <input
            type="file"
            hidden
            accept="image/*"
            onChange={(e) => setProfilePicture(e.target.files?.[0] || null)}
          />
        </Button>
        {profilePicture && (
          <Typography variant="body2" sx={{ ml: 2 }}>
            Selected: {profilePicture.name}
          </Typography>
        )}
        <TextField
          fullWidth
          margin="normal"
          name="description"
          label="Description"
          multiline
          rows={4}
          value={formik.values.description}
          onChange={formik.handleChange}
          error={formik.touched.description && Boolean(formik.errors.description)}
          helperText={formik.touched.description && formik.errors.description}
        />
        <FormControl fullWidth margin="normal" error={formik.touched.country && Boolean(formik.errors.country)}>
          <InputLabel id="country-label">Country</InputLabel>
          <Select
            labelId="country-label"
            id="country"
            name="country"
            value={formik.values.country}
            label="Country"
            onChange={formik.handleChange}
          >
            {countries.map((country: { code: string; name: string }) => (
              <MenuItem key={country.code} value={country.name}>
                {country.name}
              </MenuItem>
            ))}
          </Select>
          {formik.touched.country && formik.errors.country && (
            <Typography variant="caption" color="error">
              {formik.errors.country.toString()}
            </Typography>
          )}
        </FormControl>
        <TextField
          fullWidth
          margin="normal"
          name="sport"
          label="Sport"
          select
          value={formik.values.sport}
          onChange={formik.handleChange}
          error={formik.touched.sport && Boolean(formik.errors.sport)}
          helperText={formik.touched.sport && formik.errors.sport}
        >
          {sports.map((sport) => (
            <MenuItem key={sport} value={sport}>
              {sport}
            </MenuItem>
          ))}
        </TextField>
        <TextField
          fullWidth
          margin="normal"
          name="dayOfTheWeek"
          label="Day of the Week"
          select
          value={formik.values.dayOfTheWeek}
          onChange={formik.handleChange}
          error={formik.touched.dayOfTheWeek && Boolean(formik.errors.dayOfTheWeek)}
          helperText={formik.touched.dayOfTheWeek && formik.errors.dayOfTheWeek}
        >
          {daysOfWeek.map((day) => (
            <MenuItem key={day} value={day}>
              {day}
            </MenuItem>
          ))}
        </TextField>
        <TextField
          fullWidth
          margin="normal"
          name="fanTokenSymbol"
          label="Fan Token Symbol"
          value={formik.values.fanTokenSymbol}
          onChange={formik.handleChange}
          error={formik.touched.fanTokenSymbol && Boolean(formik.errors.fanTokenSymbol)}
          helperText={formik.touched.fanTokenSymbol && formik.errors.fanTokenSymbol}
        />
        <TextField
          fullWidth
          margin="normal"
          name="fanTokenInitialPrice"
          label="Initial Price"
          type="number"
          value={formik.values.fanTokenInitialPrice}
          onChange={formik.handleChange}
          error={formik.touched.fanTokenInitialPrice && Boolean(formik.errors.fanTokenInitialPrice)}
          helperText={formik.touched.fanTokenInitialPrice && formik.errors.fanTokenInitialPrice}
        />
        <TextField
          fullWidth
          margin="normal"
          name="totalNoOfFanTokens"
          label="Total Number of Fan Tokens"
          type="number"
          value={formik.values.totalNoOfFanTokens}
          onChange={formik.handleChange}
          error={formik.touched.totalNoOfFanTokens && Boolean(formik.errors.totalNoOfFanTokens)}
          helperText={formik.touched.totalNoOfFanTokens && formik.errors.totalNoOfFanTokens}
        />
        <Button
          type="submit"
          variant="contained"
          color="primary"
          size="large"
          sx={{ mt: 3 }}
        >
          Create Athlete Token
        </Button>
      </Box>
    </Paper>
  );
}
