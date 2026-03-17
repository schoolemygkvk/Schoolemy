import React, { useState } from "react";
import { useNavigate } from 'react-router-dom';
import api from "../../../Utils/api";
import { 
  Box, 
  Container, 
  Typography, 
  TextField, 
  Select, 
  MenuItem, 
  FormControl, 
  InputLabel, 
  Button, 
  Paper, 
  Alert, 
  Stack,
  Stepper,
  Step,
  StepLabel,
  Grid,
  IconButton,
  Tooltip
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { 
  School as SchoolIcon,
  Science as ScienceIcon,
  CheckCircle as CheckCircleIcon,
  RestartAlt as RestartAltIcon
} from '@mui/icons-material';

// Styled components
const StyledPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(4),
  borderRadius: theme.spacing(2),
  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
}));

const StyledTextField = styled(TextField)(({ theme }) => ({
  '& .MuiOutlinedInput-root': {
    borderRadius: theme.spacing(1),
  }
}));

const steps = ['Basic Information', 'Subject Selection', 'Schedule'];

const CreateClass = () => {
    const navigate = useNavigate();
	const [className, setClassName] = useState("");
	const [batch, setBatch] = useState("");
	const [academicYear, setAcademicYear] = useState("");
	const [selectedSubject, setSelectedSubject] = useState("physics");
	const [startTime, setStartTime] = useState("");
	const [endTime, setEndTime] = useState("");
	
	const [loading, setLoading] = useState(false);
	const [message, setMessage] = useState("");
	const [messageType, setMessageType] = useState("error");
	const [activeStep, setActiveStep] = useState(0);

	const toISO = (localDatetime) => {
		if (!localDatetime) return null;
		const dt = new Date(localDatetime);
		return dt.toISOString();
	};

	const handleSubmit = async (e) => {
		e.preventDefault();
		setMessage("");
		setMessageType("error");
		setLoading(true);

		try {
			const payload = {
				className,
				batch,
				academicYear,
				selectedSubject,
				startTime: toISO(startTime),
				endTime: toISO(endTime)
			};

			const token = localStorage.getItem("token");
			const res = await api.post("/classes", payload, {
				headers: token ? { Authorization: `Bearer ${token}` } : {},
			});

			if (res.data && res.data.success) {
				setMessageType("success");
				setMessage("Class created successfully.");
				// clear inputs
				setClassName("");
				setBatch("");
				setAcademicYear("");
				setStartTime("");
				setEndTime("");
				setSelectedSubject("physics");

				// navigate to home after a short delay so user can see success message
				setTimeout(() => {
					navigate('/schoolemy/pcm-class-details');
				}, 900);
			} else {
				setMessageType("error");
				setMessage(res.data?.error || "Failed to create class");
			}
		} catch (err) {
			setMessageType("error");
			setMessage(err.response?.data?.error || err.message || "Request failed");
		} finally {
			setLoading(false);
		}
	};

	const handleNext = () => {
		setActiveStep((prevStep) => prevStep + 1);
	};

	const handleBack = () => {
		setActiveStep((prevStep) => prevStep - 1);
	};

	const handleReset = () => {
		setClassName("");
		setBatch("");
		setAcademicYear("");
		setSelectedSubject("physics");
		setStartTime("");
		setEndTime("");
		setActiveStep(0);
	};

	const getStepContent = (step) => {
		switch (step) {
			case 0:
				return (
					<Stack spacing={3}>
						<StyledTextField
							required
							fullWidth
							label="Class Name"
							value={className}
							onChange={(e) => setClassName(e.target.value)}
							variant="outlined"
							placeholder="Enter class name"
						/>
						<StyledTextField
							required
							fullWidth
							label="Batch"
							value={batch}
							onChange={(e) => setBatch(e.target.value)}
							variant="outlined"
							placeholder="Enter batch"
						/>
						<StyledTextField
							required
							fullWidth
							label="Academic Year"
							value={academicYear}
							onChange={(e) => setAcademicYear(e.target.value)}
							variant="outlined"
							placeholder="e.g. 2025-2026"
							helperText="Format: YYYY-YYYY"
						/>
					</Stack>
				);
			case 1:
				return (
					<FormControl fullWidth>
						<InputLabel>Subject</InputLabel>
						<Select
							value={selectedSubject}
							label="Subject"
							onChange={(e) => setSelectedSubject(e.target.value)}
						>
							<MenuItem value="physics">
								<Stack direction="row" spacing={1} alignItems="center">
									<ScienceIcon /> Physics
								</Stack>
							</MenuItem>
							<MenuItem value="chemistry">
								<Stack direction="row" spacing={1} alignItems="center">
									<ScienceIcon /> Chemistry
								</Stack>
							</MenuItem>
							<MenuItem value="mathematics">
								<Stack direction="row" spacing={1} alignItems="center">
									<ScienceIcon /> Mathematics
								</Stack>
							</MenuItem>
						</Select>
					</FormControl>
				);
			case 2:
				return (
					<Grid container spacing={3}>
						<Grid item xs={12} md={6}>
							<StyledTextField
								required
								fullWidth
								label="Start Time"
								type="datetime-local"
								value={startTime}
								onChange={(e) => setStartTime(e.target.value)}
								InputLabelProps={{ shrink: true }}
							/>
						</Grid>
						<Grid item xs={12} md={6}>
							<StyledTextField
								required
								fullWidth
								label="End Time"
								type="datetime-local"
								value={endTime}
								onChange={(e) => setEndTime(e.target.value)}
								InputLabelProps={{ shrink: true }}
							/>
						</Grid>
					</Grid>
				);
			default:
				return null;
		}
	};

	return (
		<Container maxWidth="md" sx={{ py: 4 }}>
			<StyledPaper elevation={0}>
				<Stack spacing={4}>
					<Box sx={{ textAlign: 'center', mb: 2 }}>
						<SchoolIcon sx={{ fontSize: 40, color: 'primary.main', mb: 2 }} />
						<Typography variant="h4" component="h1" gutterBottom>
							Create PCM Class
						</Typography>
						<Typography variant="body1" color="text.secondary">
							Fill in the details below to create a new PCM class
						</Typography>
					</Box>

					<Stepper activeStep={activeStep} alternativeLabel>
						{steps.map((label) => (
							<Step key={label}>
								<StepLabel>{label}</StepLabel>
							</Step>
						))}
					</Stepper>

					<form onSubmit={handleSubmit}>
						<Box sx={{ mt: 4 }}>
							{getStepContent(activeStep)}
						</Box>

						{message && (
							<Alert 
								severity={messageType} 
								sx={{ mt: 2 }}
								action={
									messageType === "success" && (
										<IconButton
											color="inherit"
											size="small"
											onClick={handleReset}
										>
											<RestartAltIcon />
										</IconButton>
									)
								}
							>
								{message}
							</Alert>
						)}

						<Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
							<Button
								disabled={activeStep === 0}
								onClick={handleBack}
								variant="outlined"
							>
								Back
							</Button>
							<Box>
								<Tooltip title="Reset form">
									<IconButton 
										onClick={handleReset} 
										sx={{ mr: 1 }}
										color="primary"
									>
										<RestartAltIcon />
									</IconButton>
								</Tooltip>
								{activeStep === steps.length - 1 ? (
									<Button
										variant="contained"
										type="submit"
										disabled={loading}
										startIcon={loading ? null : <CheckCircleIcon />}
									>
										{loading ? "Creating..." : "Create Class"}
									</Button>
								) : (
									<Button
										variant="contained"
										onClick={handleNext}
									>
										Next
									</Button>
								)}
							</Box>
						</Box>
					</form>
				</Stack>
			</StyledPaper>
		</Container>
	);
};



export default CreateClass;
