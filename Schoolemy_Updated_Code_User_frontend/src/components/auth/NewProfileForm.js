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
  const [submitValidationMessage, setSubmitValidationMessage] = React.useState('');

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProfilePicture(file);
      setFieldErrors((prev) => ({ ...prev, profilePicture: '' }));
      const reader = new FileReader();
      reader.onloadend = () => setProfilePreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const validateRequiredFields = () => {
    const nextErrors = { username: '', email: '', mobile: '', profilePicture: '' };
    const missingFields = [];

    if (!profilePicture) {
      nextErrors.profilePicture = 'Profile picture is required.';
      missingFields.push('Profile picture');
    }

    if (!formData.username?.trim()) {
      nextErrors.username = 'Username is required.';
      missingFields.push('Username');
    }

    if (isEmailSignup) {
      if (!formData.mobile?.trim()) {
        nextErrors.mobile = 'Mobile number is required.';
        missingFields.push('Mobile number');
      }
    } else if (!formData.email?.trim()) {
      nextErrors.email = 'Email address is required.';
      missingFields.push('Email address');
    }

    setFieldErrors(nextErrors);

    if (missingFields.length > 0) {
      const msg = missingFields.length === 1 && missingFields[0] === 'Profile picture'
        ? 'Please upload profile image to continue.'
        : `Please fill required field(s): ${missingFields.join(', ')}`;
      setSubmitValidationMessage(msg);
      onError(msg);
      return false;
    }
    setSubmitValidationMessage('');
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitValidationMessage('');
    if (!validateRequiredFields()) {
      return;
    }

    // FRONTEND VALIDATION: Confirm username/mobile cannot be changed after first registration
    const userIdentifierEmail = userIdentifier.email || formData.email;
    const userIdentifierMobile = userIdentifier.mobile || formData.mobile;

    // Check if trying to change username or mobile from initial registration
    if (userIdentifier.currentUsername && userIdentifier.currentUsername !== formData.username) {
      const confirmed = window.confirm(
        '⚠️ WARNING: You cannot change your username after initial registration. ' +
        'This value is permanent and used for your account identity. ' +
        '\n\nAre you absolutely sure about this username?'
      );
      if (!confirmed) return;
    }

    if (userIdentifier.currentMobile && userIdentifier.currentMobile !== formData.mobile) {
      const confirmed = window.confirm(
        '⚠️ WARNING: You cannot change your mobile number after initial registration. ' +
        'This value is permanent and used for account recovery. ' +
        '\n\nAre you absolutely sure about this mobile number?'
      );
      if (!confirmed) return;
    }

    // FRONTEND VALIDATION: Validate username format
    if (formData.username && formData.username.length < 3) {
      const msg = "Username must be at least 3 characters long.";
      setFieldErrors(prev => ({ ...prev, username: msg }));
      onError(msg);
      return;
    }

    // FRONTEND VALIDATION: Username can only contain alphanumeric and underscore
    if (formData.username && !/^[a-zA-Z0-9_]{3,20}$/.test(formData.username)) {
      const msg = "Username must be 3-20 characters and contain only letters, numbers, and underscores.";
      setFieldErrors(prev => ({ ...prev, username: msg }));
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

      // FRONTEND VALIDATION: Parse specific field errors from response
      setFieldErrors(prev => ({
        ...prev,
        username: lowered.includes('username') ? msg : prev.username,
        email: lowered.includes('email') ? msg : prev.email,
        mobile: lowered.includes('mobile') || lowered.includes('number') || lowered.includes('phone') ? msg : prev.mobile,
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
          <input type="file" hidden accept="image/*" onChange={handleFileChange} />
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
          onChange={(e) => {
            handleChange(e);
            if (fieldErrors.username) {
              setFieldErrors((prev) => ({ ...prev, username: '' }));
            }
          }}
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
          onChange={(e) => {
            handleChange(e);
            if (fieldErrors.email) {
              setFieldErrors((prev) => ({ ...prev, email: '' }));
            }
          }}
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
          onChange={(e) => {
            handleChange(e);
            if (fieldErrors.mobile) {
              setFieldErrors((prev) => ({ ...prev, mobile: '' }));
            }
          }}
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
        {submitValidationMessage && (
          <Typography
            variant="body2"
            color="error"
            sx={{ mt: 1, textAlign: 'center', fontWeight: 500 }}
          >
            {submitValidationMessage}
          </Typography>
        )}
    </Box>
  );
};

export default NewProfileForm;