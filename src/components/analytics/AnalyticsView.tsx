import { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  CircularProgress
} from '@mui/material';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../lib/firebase';

const AnalyticsView = () => {
  const [loading, setLoading] = useState(true);
  const [totalCompanies, setTotalCompanies] = useState(0);
  const [totalLocations, setTotalLocations] = useState(0);
  const [totalUsers, setTotalUsers] = useState(0);

  useEffect(() => {
    const fetchAnalyticsData = async () => {
      try {
        setLoading(true);
        
        // Get total companies
        const companyProfilesCollection = collection(db, 'companyProfiles');
        const companySnapshot = await getDocs(companyProfilesCollection);
        setTotalCompanies(companySnapshot.size);
        
        // Calculate total locations by iterating through company profiles
        let locationCount = 0;
        for (const companyDoc of companySnapshot.docs) {
          const locationsCollection = collection(db, `companyProfiles/${companyDoc.id}/locations`);
          const locationsSnapshot = await getDocs(locationsCollection);
          locationCount += locationsSnapshot.size;
        }
        setTotalLocations(locationCount);
        
        // Get total users
        const usersCollection = collection(db, 'users');
        const usersSnapshot = await getDocs(usersCollection);
        setTotalUsers(usersSnapshot.size);
        
      } catch (error) {
        console.error('Error fetching analytics data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchAnalyticsData();
  }, []);

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Battery Nexus Dashboard
        </Typography>
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 8 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <Card sx={{ height: '100%' }}>
              <CardContent sx={{ p: 4, textAlign: 'center' }}>
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  Total Companies
                </Typography>
                <Typography variant="h2" sx={{ fontWeight: 700, color: '#1792B6', my: 2 }}>
                  {totalCompanies}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Company profiles in the database
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={4}>
            <Card sx={{ height: '100%' }}>
              <CardContent sx={{ p: 4, textAlign: 'center' }}>
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  Total Locations
                </Typography>
                <Typography variant="h2" sx={{ fontWeight: 700, color: '#1792B6', my: 2 }}>
                  {totalLocations}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Battery installation locations
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={4}>
            <Card sx={{ height: '100%' }}>
              <CardContent sx={{ p: 4, textAlign: 'center' }}>
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  Total Users
                </Typography>
                <Typography variant="h2" sx={{ fontWeight: 700, color: '#1792B6', my: 2 }}>
                  {totalUsers}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Registered users in the system
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}
    </Box>
  );
};

export default AnalyticsView;
