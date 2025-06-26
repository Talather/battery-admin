import { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  TextField,
  InputAdornment,

  Chip
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import SearchIcon from '@mui/icons-material/Search';
import { Link } from 'react-router-dom';
import { collection, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../../lib/firebase';



interface Company {
  id: string;
  companyName: string;
  address?: string;
  companyAbout?: string;
  website?: string;
  companyLinkedn?: string;
  contactEmail?: string;
  phoneNumber?: string;
  createdAt?: string;
  updatedAt?: string;
  referralCode?: string;
  keywords?: string[];
  locationCount?: number;
}

const CompanyList = () => {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        setLoading(true);
        const companiesCollection = collection(db, 'companyProfiles');
        const companiesSnapshot = await getDocs(companiesCollection);
        
        // Get companies data
        const companiesList = await Promise.all(
          companiesSnapshot.docs.map(async (doc) => {
            const companyData = doc.data();
            
            // Get location count for each company
            const locationsCollection = collection(db, `companyProfiles/${doc.id}/locations`);
            const locationsSnapshot = await getDocs(locationsCollection);
            const locationCount = locationsSnapshot.size;
            
            return {
              id: doc.id,
              ...companyData,
              locationCount
            } as Company;
          })
        );
        
        setCompanies(companiesList);
      } catch (error) {
        console.error('Error fetching companies:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchCompanies();
  }, []);

  const handleDeleteCompany = async (id: string) => {
    try {
      // Delete the company document
      await deleteDoc(doc(db, 'companyProfiles', id));
      
      // Update the local state
      setCompanies(companies.filter(company => company.id !== id));
    } catch (error) {
      console.error('Error deleting company:', error);
    }
  };

  const filteredCompanies = companies.filter(company => 
    company.companyName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    company.address?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    company.contactEmail?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    company.companyAbout?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Companies
        </Typography>
        <Button 
          variant="contained" 
          color="primary" 
          component={Link} 
          to="/companies/create"
          startIcon={<AddIcon />}
        >
          Add Company
        </Button>
      </Box>
      
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <TextField
            fullWidth
            variant="outlined"
            placeholder="Search companies..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            sx={{ mb: 2 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
          />

          <TableContainer component={Paper} sx={{ 
            boxShadow: 'none',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: 2,
            bgcolor: 'transparent' 
          }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Company Name</TableCell>
                  {/* <TableCell>About</TableCell> */}
                  {/* <TableCell>Contact</TableCell> */}
                  <TableCell>Website</TableCell>
                  <TableCell>LinkedIn</TableCell>
                  <TableCell>Referral Code</TableCell>
                  <TableCell>Locations</TableCell>
                  <TableCell>Created</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={8} align="center">Loading...</TableCell>
                  </TableRow>
                ) : filteredCompanies.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} align="center">No companies found</TableCell>
                  </TableRow>
                ) : (
                  filteredCompanies.map((company) => (
                    <TableRow key={company.id}>
                      <TableCell sx={{ fontWeight: 'medium' }}>{company.companyName}</TableCell>
                      {/* <TableCell>{company.address}</TableCell> */}
                      <TableCell>
                        {company.website ? (
                          <a 
                            href={company.website.startsWith('http') ? company.website : `https://${company.website}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ color: '#1792B6', textDecoration: 'none' }}
                          >
                            {company.website}
                          </a>
                        ) : 'No website'}
                      </TableCell>
                      <TableCell>
                        {company.companyLinkedn ? (
                          <a 
                            href={company.companyLinkedn.startsWith('http') ? company.companyLinkedn : `https://${company.companyLinkedn}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ color: '#1792B6', textDecoration: 'none' }}
                          >
                            LinkedIn
                          </a>
                        ) : 'No LinkedIn'}
                      </TableCell>
                      <TableCell>
                        {company.referralCode ? (
                          <Chip 
                            label={company.referralCode} 
                            size="small" 
                            color="secondary"
                            sx={{ 
                              fontFamily: 'monospace',
                              fontSize: '0.75rem',
                              bgcolor: 'rgba(23, 146, 182, 0.1)',
                              color: '#1792B6'
                            }}
                          />
                        ) : 'No code'}
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={`${company.locationCount || 0} locations`} 
                          size="small" 
                          color="primary"
                        />
                      </TableCell>
                      <TableCell>
                        {company.createdAt ? new Date(company.createdAt).toLocaleDateString() : 'Unknown'}
                      </TableCell>
                      <TableCell align="right">
                        <IconButton 
                          size="small" 
                          component={Link} 
                          to={`/companies/${company.id}`}
                          sx={{ color: '#1792B6' }}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                        <IconButton 
                          size="small" 
                          onClick={() => handleDeleteCompany(company.id)}
                          sx={{ color: 'error.main' }}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>
    </Box>
  );
};

export default CompanyList;
