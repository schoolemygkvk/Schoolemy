// // src/components/auth/ProfileForm.js

// import React, { useState } from 'react';
// import { 
//   Box, 
//   TextField, 
//   Button, 
//   CircularProgress, 
//   Typography, 
//   Grid, 
//   Avatar, 
//   InputLabel, 
//   Select, 
//   MenuItem, 
//   FormControl, 
//   Paper, 
//   Divider,
//   Card,
//   CardContent,
//   Fade,
//   Slide,
//   IconButton,
//   useTheme,
//   useMediaQuery
// } from '@mui/material';
// import AccountCircleIcon from '@mui/icons-material/AccountCircle';
// import CloudUploadIcon from '@mui/icons-material/CloudUpload';
// import PersonIcon from '@mui/icons-material/Person';
// import HomeIcon from '@mui/icons-material/Home';
// import EmailIcon from '@mui/icons-material/Email';
// import PhoneIcon from '@mui/icons-material/Phone';

// // --- Enhanced Styles for Modern Design & Mobile Responsiveness ---
// const styles = {
//   formContainer: {
//     padding: { xs: 2, sm: 3, md: 4 },
//     maxWidth: '900px',
//     margin: '0 auto',
//     minHeight: '100vh',
//     backgroundColor: '#f8fafc',
//     display: 'flex',
//     flexDirection: 'column',
//     justifyContent: 'flex-start',
//     paddingTop: { xs: 2, sm: 4 },
//   },
//   mainCard: {
//     borderRadius: { xs: '16px', sm: '20px' },
//     boxShadow: '0 4px 20px rgba(59, 130, 246, 0.1)',
//     background: '#ffffff',
//     border: '1px solid #e2e8f0',
//     overflow: 'hidden',
//     transition: 'box-shadow 0.3s ease-in-out',
//     '&:hover': {
//       boxShadow: '0 8px 30px rgba(59, 130, 246, 0.15)',
//     },
//   },
//   profileSection: {
//     display: 'flex',
//     flexDirection: 'column',
//     alignItems: 'center',
//     justifyContent: 'center',
//     mb: { xs: 3, sm: 4 },
//     pt: { xs: 2, sm: 3 },
//   },
//   avatar: {
//     width: { xs: 100, sm: 120, md: 140 },
//     height: { xs: 100, sm: 120, md: 140 },
//     mb: 2,
//     boxShadow: '0 4px 20px rgba(59, 130, 246, 0.2)',
//     border: '3px solid #3b82f6',
//     transition: 'transform 0.3s ease, box-shadow 0.3s ease',
//     '&:hover': {
//       transform: 'scale(1.02)',
//       boxShadow: '0 8px 30px rgba(59, 130, 246, 0.3)',
//     },
//   },
//   uploadButton: {
//     textTransform: 'none',
//     borderRadius: '8px',
//     padding: { xs: '8px 16px', sm: '10px 20px' },
//     fontSize: { xs: '0.85rem', sm: '0.95rem' },
//     backgroundColor: '#3b82f6',
//     color: 'white',
//     fontWeight: '500',
//     transition: 'all 0.3s ease',
//     '&:hover': {
//       backgroundColor: '#2563eb',
//       transform: 'translateY(-1px)',
//       boxShadow: '0 4px 12px rgba(59, 130, 246, 0.4)',
//     },
//   },
//   sectionCard: {
//     borderRadius: '12px',
//     boxShadow: '0 2px 8px rgba(59, 130, 246, 0.08)',
//     border: '1px solid #e2e8f0',
//     mb: { xs: 2, sm: 3 },
//     overflow: 'hidden',
//     transition: 'box-shadow 0.3s ease',
//     '&:hover': {
//       boxShadow: '0 4px 16px rgba(59, 130, 246, 0.12)',
//     },
//   },
//   sectionHeader: {
//     backgroundColor: '#3b82f6',
//     color: 'white',
//     p: { xs: 2, sm: 2.5 },
//     display: 'flex',
//     alignItems: 'center',
//     gap: 1.5,
//   },
//   sectionTitle: {
//     fontWeight: 600,
//     fontSize: { xs: '1rem', sm: '1.1rem' },
//     display: 'flex',
//     alignItems: 'center',
//     gap: 1,
//   },
//   sectionContent: {
//     p: { xs: 2.5, sm: 3 },
//     backgroundColor: '#ffffff',
//   },
//   textField: {
//     '& .MuiOutlinedInput-root': {
//       borderRadius: '8px',
//       backgroundColor: '#f8fafc',
//       transition: 'all 0.3s ease',
//       height: { xs: '48px', sm: '56px' }, // Fixed height for alignment
//       '& fieldset': {
//         borderColor: '#e2e8f0',
//       },
//       '&:hover fieldset': {
//         borderColor: '#3b82f6',
//         boxShadow: '0 2px 8px rgba(59, 130, 246, 0.1)',
//       },
//       '&.Mui-focused fieldset': {
//         borderColor: '#3b82f6',
//         boxShadow: '0 2px 8px rgba(59, 130, 246, 0.2)',
//       },
//     },
//     '& .MuiInputLabel-root': {
//       fontSize: { xs: '0.9rem', sm: '1rem' },
//       fontWeight: '500',
//       color: '#64748b',
//       '&.Mui-focused': {
//         color: '#3b82f6',
//       },
//     },
//     '& .MuiOutlinedInput-input': {
//       padding: { xs: '14px', sm: '16px' },
//       fontSize: { xs: '0.9rem', sm: '1rem' },
//       height: 'auto',
//     },
//   },
//   selectField: {
//     '& .MuiOutlinedInput-root': {
//       borderRadius: '8px',
//       backgroundColor: '#f8fafc',
//       height: { xs: '48px', sm: '56px' }, // Fixed height for alignment
//       '& fieldset': {
//         borderColor: '#e2e8f0',
//       },
//       '&:hover fieldset': {
//         borderColor: '#3b82f6',
//       },
//       '&.Mui-focused fieldset': {
//         borderColor: '#3b82f6',
//       },
//     },
//     '& .MuiSelect-select': {
//       padding: { xs: '14px', sm: '16px' },
//       fontSize: { xs: '0.9rem', sm: '1rem' },
//       display: 'flex',
//       alignItems: 'center',
//     },
//     '& .MuiInputLabel-root': {
//       fontSize: { xs: '0.9rem', sm: '1rem' },
//       fontWeight: '500',
//       color: '#64748b',
//       '&.Mui-focused': {
//         color: '#3b82f6',
//       },
//     },
//   },
//   submitButton: {
//     mt: { xs: 3, sm: 4 },
//     mb: 2,
//     py: { xs: 1.5, sm: 2 },
//     px: { xs: 3, sm: 4 },
//     fontSize: { xs: '1rem', sm: '1.1rem' },
//     fontWeight: '600',
//     borderRadius: '8px',
//     backgroundColor: '#3b82f6',
//     color: 'white',
//     textTransform: 'none',
//     boxShadow: '0 4px 16px rgba(59, 130, 246, 0.3)',
//     transition: 'all 0.3s ease',
//     '&:hover': {
//       backgroundColor: '#2563eb',
//       transform: 'translateY(-2px)',
//       boxShadow: '0 8px 24px rgba(59, 130, 246, 0.4)',
//     },
//     '&:disabled': {
//       backgroundColor: '#94a3b8',
//       color: 'white',
//       transform: 'none',
//       boxShadow: 'none',
//     },
//   },
//   disabledInput: {
//     '& .MuiOutlinedInput-root': {
//       backgroundColor: '#f1f5f9',
//       borderRadius: '8px',
//       height: { xs: '48px', sm: '56px' }, // Fixed height for alignment
//     },
//     '& .MuiInputBase-input.Mui-disabled': {
//       textOverflow: 'ellipsis',
//       WebkitTextFillColor: '#64748b',
//       backgroundColor: 'transparent',
//       padding: { xs: '14px', sm: '16px' },
//       fontSize: { xs: '0.9rem', sm: '1rem' },
//     },
//     '& .MuiOutlinedInput-root.Mui-disabled': {
//       '& fieldset': {
//         borderColor: '#cbd5e1',
//       },
//     },
//     '& .MuiInputLabel-root': {
//       fontSize: { xs: '0.9rem', sm: '1rem' },
//       fontWeight: '500',
//       color: '#64748b',
//     },
//   },
//   formGrid: {
//     alignItems: 'stretch', // Changed from flex-start to stretch for better alignment
//     '& .MuiGrid-item': {
//       display: 'flex',
//       flexDirection: 'column',
//     },
//   },
// };

// const ProfileForm = ({ userIdentifier, onProfileSaved, onError }) => {
//   const theme = useTheme();
//   const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
//   const isTablet = useMediaQuery(theme.breakpoints.between('sm', 'md'));
//   const isEmailSignup = userIdentifier && userIdentifier.email;

//   const [formData, setFormData] = useState({
//     username: '', email: '', mobile: '', fatherName: '', dateofBirth: '', gender: '',
//     bloodGroup: '', Nationality: '', Occupation: '', street: '', city: '',
//     state: '', country: '', zipCode: '',
//   });
//   const [profilePicture, setProfilePicture] = useState(null);
//   const [profilePreview, setProfilePreview] = useState('');
//   const [loading, setLoading] = useState(false);

//   const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

//   const handleFileChange = (e) => {
//     const file = e.target.files[0];
//     if (file) {
//       setProfilePicture(file);
//       const reader = new FileReader();
//       reader.onloadend = () => setProfilePreview(reader.result);
//       reader.readAsDataURL(file);
//     }
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault(); setLoading(true);
//     const dataPayload = new FormData();
//     for (const key in formData) { if (formData[key]) dataPayload.append(key, formData[key]); }
//     // if(isEmailSignup) dataPayload.append('email', userIdentifier.email); else dataPayload.append('mobile', userIdentifier.mobile);
//     if (formData.street || formData.city) dataPayload.append('address', JSON.stringify({ street: formData.street, city: formData.city, state: formData.state, country: formData.country, zipCode: formData.zipCode }));
//     if (profilePicture) dataPayload.append('profilePicture', profilePicture); else { onError("Profile picture is required."); setLoading(false); return; }
//     try { onProfileSaved(dataPayload); } catch (err) { onError(err.message || 'Profile update failed.'); } finally { setLoading(false); }
//   };

//   return (
//     <Box sx={styles.formContainer}>
//       <Fade in={true} timeout={800}>
//         <Card sx={styles.mainCard}>
//           <CardContent sx={{ p: { xs: 2, sm: 3, md: 4 } }}>
//             <Box component="form" onSubmit={handleSubmit}>
              
//               {/* Profile Picture Section */}
//               <Slide direction="down" in={true} timeout={600}>
//                 <Box sx={styles.profileSection}>
//                   <Avatar src={profilePreview} sx={styles.avatar}>
//                     {!profilePreview && <AccountCircleIcon sx={{ fontSize: { xs: '4rem', sm: '5rem' }, color: 'grey.400' }} />}
//                   </Avatar>
//                   <Button 
//                     variant="contained" 
//                     component="label" 
//                     startIcon={<CloudUploadIcon />} 
//                     sx={styles.uploadButton}
//                     size={isMobile ? 'small' : 'medium'}
//                   >
//                     {isMobile ? 'Upload Photo' : 'Upload Profile Picture'}
//                     <input type="file" hidden accept="image/*" onChange={handleFileChange} name="profilePicture" />
//                   </Button>
//                 </Box>
//               </Slide>

//               <Grid container spacing={{ xs: 2, sm: 3 }}>
                
//                 {/* User Details Section */}
//                 <Grid item xs={12}>
//                   <Slide direction="up" in={true} timeout={800}>
//                     <Card sx={styles.sectionCard}>
//                       <Box sx={styles.sectionHeader}>
//                         <PersonIcon />
//                         <Typography variant="h6" sx={styles.sectionTitle}>
//                           Personal Information
//                         </Typography>
//                       </Box>
//                       <CardContent sx={styles.sectionContent}>
//                         <Grid container spacing={{ xs: 2, sm: 2.5 }} sx={styles.formGrid}>
//                           <Grid item xs={12} sm={6}>
//                             <TextField
//                               name="username"
//                               label="Username"
//                               fullWidth
//                               required
//                               value={formData.username}
//                               onChange={handleChange}
//                               sx={styles.textField}
//                               size={isMobile ? 'small' : 'medium'}
//                             />
//                           </Grid>
//                           <Grid item xs={12} sm={6}>
//                             <TextField
//                               name="fatherName"
//                               label="Father's Name"
//                               fullWidth
//                               value={formData.fatherName}
//                               onChange={handleChange}
//                               sx={styles.textField}
//                               size={isMobile ? 'small' : 'medium'}
//                             />
//                           </Grid>
//                           <Grid item xs={12} sm={6}>
//                             <TextField
//                               name="dateofBirth"
//                               label="Date of Birth"
//                               type="date"
//                               fullWidth
//                               value={formData.dateofBirth}
//                               onChange={handleChange}
//                               InputLabelProps={{ shrink: true }}
//                               sx={styles.textField}
//                               size={isMobile ? 'small' : 'medium'}
//                             />
//                           </Grid>
//                           <Grid item xs={12} sm={6}>
//                             <FormControl fullWidth variant="outlined" size={isMobile ? 'small' : 'medium'}>
//                               <InputLabel id="gender-label">Gender</InputLabel>
//                               <Select
//                                 labelId="gender-label"
//                                 name="gender"
//                                 value={formData.gender}
//                                 label="Gender"
//                                 onChange={handleChange}
//                                 sx={{
//                                   borderRadius: '8px',
//                                   backgroundColor: '#f8fafc',
//                                   height: { xs: '48px', sm: '56px' },
//                                   '& fieldset': {
//                                     borderColor: '#e2e8f0',
//                                   },
//                                   '&:hover fieldset': {
//                                     borderColor: '#3b82f6',
//                                   },
//                                   '&.Mui-focused fieldset': {
//                                     borderColor: '#3b82f6',
//                                   },
//                                   '& .MuiSelect-select': {
//                                     padding: { xs: '14px', sm: '16px' },
//                                     fontSize: { xs: '0.9rem', sm: '1rem' },
//                                     display: 'flex',
//                                     alignItems: 'center',
//                                   },
//                                 }}
//                               >
//                                 <MenuItem value="Male">Male</MenuItem>
//                                 <MenuItem value="Female">Female</MenuItem>
//                                 <MenuItem value="Other">Other</MenuItem>
//                               </Select>
//                             </FormControl>
//                           </Grid>
//                           <Grid item xs={12} sm={6}>
//                             <TextField
//                               name="bloodGroup"
//                               label="Blood Group"
//                               fullWidth
//                               value={formData.bloodGroup}
//                               onChange={handleChange}
//                               sx={styles.textField}
//                               size={isMobile ? 'small' : 'medium'}
//                             />
//                           </Grid>
//                           <Grid item xs={12} sm={6}>
//                             <TextField
//                               name="Nationality"
//                               label="Nationality"
//                               fullWidth
//                               value={formData.Nationality}
//                               onChange={handleChange}
//                               sx={styles.textField}
//                               size={isMobile ? 'small' : 'medium'}
//                             />
//                           </Grid>
//                           <Grid item xs={12}>
//                             <TextField
//                               name="Occupation"
//                               label="Occupation"
//                               fullWidth
//                               value={formData.Occupation}
//                               onChange={handleChange}
//                               sx={styles.textField}
//                               size={isMobile ? 'small' : 'medium'}
//                             />
//                           </Grid>
//                         </Grid>
//                       </CardContent>
//                     </Card>
//                   </Slide>
//                 </Grid>

//                 {/* Contact Information Section */}
//                 <Grid item xs={12}>
//                   <Slide direction="up" in={true} timeout={1000}>
//                     <Card sx={styles.sectionCard}>
//                       <Box sx={styles.sectionHeader}>
//                         <Box sx={{ display: 'flex', gap: 1 }}>
//                           <EmailIcon />
//                           <PhoneIcon />
//                         </Box>
//                         <Typography variant="h6" sx={styles.sectionTitle}>
//                           Contact Information
//                         </Typography>
//                       </Box>
//                       <CardContent sx={styles.sectionContent}>
//                         <Grid container spacing={{ xs: 2, sm: 2.5 }} sx={styles.formGrid}>
//                           <Grid item xs={12} sm={6}>
//                             <TextField
//                               name="email"
//                               label="Email Address"
//                               fullWidth
//                               value={isEmailSignup ? userIdentifier.email : formData.email}
//                               onChange={handleChange}
//                               required={!isEmailSignup}
//                               disabled={isEmailSignup}
//                               variant={isEmailSignup ? "filled" : "outlined"}
//                               sx={isEmailSignup ? styles.disabledInput : styles.textField}
//                               size={isMobile ? 'small' : 'medium'}
//                             />
//                           </Grid>
//                           <Grid item xs={12} sm={6}>
//                             <TextField
//                               name="mobile"
//                               label="Mobile Number"
//                               fullWidth
//                               value={!isEmailSignup ? userIdentifier.mobile : formData.mobile}
//                               onChange={handleChange}
//                               required={isEmailSignup}
//                               disabled={!isEmailSignup}
//                               variant={!isEmailSignup ? "filled" : "outlined"}
//                               sx={!isEmailSignup ? styles.disabledInput : styles.textField}
//                               size={isMobile ? 'small' : 'medium'}
//                             />
//                           </Grid>
//                         </Grid>
//                       </CardContent>
//                     </Card>
//                   </Slide>
//                 </Grid>
                
//                 {/* Address Section */}
//                 <Grid item xs={12}>
//                   <Slide direction="up" in={true} timeout={1200}>
//                     <Card sx={styles.sectionCard}>
//                       <Box sx={styles.sectionHeader}>
//                         <HomeIcon />
//                         <Typography variant="h6" sx={styles.sectionTitle}>
//                           Address Information
//                         </Typography>
//                       </Box>
//                       <CardContent sx={styles.sectionContent}>
//                         <Grid container spacing={{ xs: 2, sm: 2.5 }} sx={styles.formGrid}>
//                           <Grid item xs={12}>
//                             <TextField
//                               name="street"
//                               label="Street Address"
//                               fullWidth
//                               value={formData.street}
//                               onChange={handleChange}
//                               sx={styles.textField}
//                               size={isMobile ? 'small' : 'medium'}
//                             />
//                           </Grid>
//                           <Grid item xs={12} sm={6}>
//                             <TextField
//                               name="city"
//                               label="City"
//                               fullWidth
//                               value={formData.city}
//                               onChange={handleChange}
//                               sx={styles.textField}
//                               size={isMobile ? 'small' : 'medium'}
//                             />
//                           </Grid>
//                           <Grid item xs={12} sm={6}>
//                             <TextField
//                               name="state"
//                               label="State/Province"
//                               fullWidth
//                               value={formData.state}
//                               onChange={handleChange}
//                               sx={styles.textField}
//                               size={isMobile ? 'small' : 'medium'}
//                             />
//                           </Grid>
//                           <Grid item xs={12} sm={6}>
//                             <TextField
//                               name="country"
//                               label="Country"
//                               fullWidth
//                               value={formData.country}
//                               onChange={handleChange}
//                               sx={styles.textField}
//                               size={isMobile ? 'small' : 'medium'}
//                             />
//                           </Grid>
//                           <Grid item xs={12} sm={6}>
//                             <TextField
//                               name="zipCode"
//                               label="Pincode/ZIP Code"
//                               fullWidth
//                               value={formData.zipCode}
//                               onChange={handleChange}
//                               sx={styles.textField}
//                               size={isMobile ? 'small' : 'medium'}
//                             />
//                           </Grid>
//                         </Grid>
//                       </CardContent>
//                     </Card>
//                   </Slide>
//                 </Grid>
//               </Grid>
              
//               {/* Submit Button */}
//               <Slide direction="up" in={true} timeout={1400}>
//                 <Button
//                   type="submit"
//                   fullWidth
//                   variant="contained"
//                   sx={styles.submitButton}
//                   disabled={loading}
//                   size={isMobile ? 'medium' : 'large'}
//                 >
//                   {loading ? (
//                     <CircularProgress size={isMobile ? 20 : 26} color="inherit" />
//                   ) : (
//                     isMobile ? 'Save & Complete' : 'Save Profile & Complete Signup'
//                   )}
//                 </Button>
//               </Slide>
//             </Box>
//           </CardContent>
//         </Card>
//       </Fade>
//     </Box>
//   );
// };

// export default ProfileForm;

import React from 'react';
import { Box, TextField, Button, CircularProgress, Typography, Grid, Avatar, InputLabel, Select, MenuItem, FormControl, Divider } from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';

const ProfileForm = ({ userIdentifier, onProfileSaved, onError }) => {
  const isEmailSignup = !!userIdentifier.email;
  
  const [formData, setFormData] = React.useState({
    username: '',
    email: isEmailSignup ? '' : '',
    mobile: isEmailSignup ? '' : '',
    fatherName: '',
    dateofBirth: '',
    gender: '',
    bloodGroup: '',
    Nationality: '',
    Occupation: '',
    street: '',
    city: '',
    state: '',
    country: '',
    zipCode: '',
  });
  const [profilePicture, setProfilePicture] = React.useState(null);
  const [profilePreview, setProfilePreview] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [fieldErrors, setFieldErrors] = React.useState({
    username: '',
    email: '',
    mobile: '',
    profilePicture: '',
  });

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProfilePicture(file);
      const reader = new FileReader();
      reader.onloadend = () => setProfilePreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFieldErrors({ username: '', email: '', mobile: '', profilePicture: '' });
    if (!profilePicture) {
      const msg = "Profile picture is required.";
      setFieldErrors(prev => ({ ...prev, profilePicture: msg }));
      onError(msg);
      return;
    }
    setLoading(true);
    const dataPayload = new FormData();
    for (const key in formData) {
      if (formData[key]) dataPayload.append(key, formData[key]);
    }
    dataPayload.append('profilePicture', profilePicture);

    try {
      await onProfileSaved(dataPayload);
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Profile update failed.';
      onError(msg);
      const lowered = msg.toLowerCase();
      setFieldErrors(prev => ({
        ...prev,
        username: lowered.includes('username') ? msg : prev.username,
        email: lowered.includes('email') ? msg : prev.email,
        mobile: lowered.includes('mobile') || lowered.includes('number') ? msg : prev.mobile,
      }));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ width: '100%', maxHeight: { xs: '70vh', sm: '65vh' }, overflowY: 'auto', pr: { xs: 1, sm: 2 } }}>
      <Box sx={{ textAlign: 'center', mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 600, color: 'text.primary' }}>
          Complete Your Profile
        </Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary', mt: 1 }}>
          This information helps us personalize your experience.
        </Typography>
      </Box>

      <Box component="form" onSubmit={handleSubmit}>
        <Grid container spacing={2.5}>
          
          <Grid item xs={12} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1.5 }}>
            <Avatar
              src={profilePreview}
              sx={{
                width: 100,
                height: 100,
                mb: 1,
                border: fieldErrors.profilePicture ? '2px solid #d32f2f' : '2px solid lightgray',
              }}
            />
            <Button
              variant="outlined"
              component="label"
              size="small"
              startIcon={<CloudUploadIcon />}
            >
              Upload Picture *
              <input type="file" hidden required accept="image/*" onChange={handleFileChange} />
            </Button>
            {fieldErrors.profilePicture && (
              <Typography variant="caption" color="error">
                {fieldErrors.profilePicture}
              </Typography>
            )}
          </Grid>

          <Grid item xs={12}><Divider sx={{ my: 1 }}>Personal Information</Divider></Grid>
          
          <Grid item xs={12} sm={6}>
            <TextField
              name="username"
              label="Username"
              fullWidth
              required
              value={formData.username}
              onChange={handleChange}
              error={!!fieldErrors.username}
              helperText={fieldErrors.username}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField name="fatherName" label="Father's Name" fullWidth value={formData.fatherName} onChange={handleChange} />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField name="dateofBirth" label="Date of Birth" type="date" fullWidth InputLabelProps={{ shrink: true }} value={formData.dateofBirth} onChange={handleChange} />
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel id="gender-label">Gender</InputLabel>
              <Select labelId="gender-label" name="gender" label="Gender" value={formData.gender} onChange={handleChange}>
                <MenuItem value="Male">Male</MenuItem>
                <MenuItem value="Female">Female</MenuItem>
                <MenuItem value="Other">Other</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField name="bloodGroup" label="Blood Group" fullWidth value={formData.bloodGroup} onChange={handleChange} />
          </Grid>
           <Grid item xs={12} sm={6}>
            <TextField name="Occupation" label="Occupation" fullWidth value={formData.Occupation} onChange={handleChange} />
          </Grid>
          <Grid item xs={12}>
            <TextField name="Nationality" label="Nationality" fullWidth value={formData.Nationality} onChange={handleChange} />
          </Grid>

          <Grid item xs={12}><Divider sx={{ my: 1 }}>Contact Information</Divider></Grid>
          
          <Grid item xs={12} sm={6}>
            <TextField
              label="Email Address"
              fullWidth
              value={userIdentifier.email || formData.email}
              disabled={isEmailSignup}
              required={!isEmailSignup}
              name="email"
              onChange={handleChange}
              error={!!fieldErrors.email}
              helperText={fieldErrors.email}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              label="Mobile Number"
              fullWidth
              value={userIdentifier.mobile || formData.mobile}
              disabled={!isEmailSignup}
              required={isEmailSignup}
              name="mobile"
              onChange={handleChange}
              error={!!fieldErrors.mobile}
              helperText={fieldErrors.mobile}
            />
          </Grid>

          <Grid item xs={12}><Divider sx={{ my: 1 }}>Address Information</Divider></Grid>
          
          <Grid item xs={12}>
            <TextField name="street" label="Street Address" fullWidth value={formData.street} onChange={handleChange} />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField name="city" label="City" fullWidth value={formData.city} onChange={handleChange} />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField name="state" label="State / Province" fullWidth value={formData.state} onChange={handleChange} />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField name="country" label="Country" fullWidth value={formData.country} onChange={handleChange} />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField name="zipCode" label="Pincode / ZIP Code" fullWidth value={formData.zipCode} onChange={handleChange} />
          </Grid>
          
          <Grid item xs={12} sx={{ mt: 2 }}>
            <Button type="submit" fullWidth variant="contained" disabled={loading} sx={{ py: 1.5, borderRadius: '12px', fontWeight: '600' }}>
              {loading ? <CircularProgress size={24} color="inherit" /> : 'Save Profile & Complete Signup'}
            </Button>
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
};

export default ProfileForm;