// src/components/auth/NewProfileForm.js

import React from 'react';
import { 
    Box, TextField, Button, CircularProgress, Typography, Avatar,
    FormControl, FormLabel, RadioGroup, FormControlLabel, Radio 
} from '@mui/material';
const NewProfileForm = ({ userIdentifier, onProfileSaved, onError }) => {
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
    <Box 
        component="form" 
        onSubmit={handleSubmit}
        sx={{ 
            width: '100%', 
            maxHeight: '65vh', 
            overflowY: 'auto', 
            pr: 2,
            display: 'flex',
            flexDirection: 'column',
            gap: 2 // This adds space between all form elements
        }}
    >
        <Typography variant="h5" sx={{ fontWeight: 600, textAlign: 'center' }}>
            Complete Your Profile
        </Typography>

        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
        <Avatar
          src={profilePreview}
          sx={{
            width: 80,
            height: 80,
            border: fieldErrors.profilePicture ? '2px solid #d32f2f' : 'none',
          }}
        />
        <Button variant="outlined" component="label" size="small">
          Upload Picture *
          <input type="file" hidden required accept="image/*" onChange={handleFileChange} />
        </Button>
        {fieldErrors.profilePicture && (
          <Typography variant="caption" color="error">
            {fieldErrors.profilePicture}
          </Typography>
        )}
      </Box>

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
        <TextField name="fatherName" label="Father's Name" fullWidth value={formData.fatherName} onChange={handleChange} />
        <TextField name="dateofBirth" label="Date of Birth" type="date" fullWidth InputLabelProps={{ shrink: true }} value={formData.dateofBirth} onChange={handleChange} />


<FormControl component="fieldset">
    <FormLabel component="legend">Gender</FormLabel>
    <RadioGroup
        row 
        name="gender"
        value={formData.gender}
        onChange={handleChange}
    >
        <FormControlLabel value="Female" control={<Radio />} label="Female" />
        <FormControlLabel value="Male" control={<Radio />} label="Male" />
        <FormControlLabel value="Other" control={<Radio />} label="Other" />
    </RadioGroup>
</FormControl>

        <TextField name="bloodGroup" label="Blood Group" fullWidth value={formData.bloodGroup} onChange={handleChange} />
        <TextField name="Occupation" label="Occupation" fullWidth value={formData.Occupation} onChange={handleChange} />
        <TextField name="Nationality" label="Nationality" fullWidth value={formData.Nationality} onChange={handleChange} />

        <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mt: 1 }}>Contact Information</Typography>
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

        <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mt: 1 }}>Address Information</Typography>
        <TextField name="street" label="Street Address" fullWidth value={formData.street} onChange={handleChange} />
        <TextField name="city" label="City" fullWidth value={formData.city} onChange={handleChange} />
        <TextField name="state" label="State / Province" fullWidth value={formData.state} onChange={handleChange} />
        <TextField name="country" label="Country" fullWidth value={formData.country} onChange={handleChange} />
        <TextField name="zipCode" label="Pincode / ZIP Code" fullWidth value={formData.zipCode} onChange={handleChange} />
          
        <Button type="submit" fullWidth variant="contained" disabled={loading} sx={{ py: 1.5, mt: 1 }}>
            {loading ? <CircularProgress size={24} /> : 'Save Profile & Complete Signup'}
        </Button>
    </Box>
  );
};

export default NewProfileForm;