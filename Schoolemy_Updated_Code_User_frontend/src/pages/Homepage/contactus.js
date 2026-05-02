import React, { useState } from "react";
import api from "../../service/api"; // Use centralized API instance
import { Box, TextField, Button, Typography, CircularProgress } from "@mui/material";
import { toast } from "react-toastify";
import { isValidEmail, getEmailErrorMessage } from "../../utils/emailValidator";
import "react-toastify/dist/ReactToastify.css";

const ContactUs = () => {
	const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
	const [loading, setLoading] = useState(false);

	const handleChange = (e) => {
		const { name, value } = e.target;
		setForm((prev) => ({ ...prev, [name]: value }));
	};

	const validate = () => {
		if (!form.name.trim()) return "Please enter your name.";
		if (!form.email.trim()) return "Please enter your email.";
		// SECURITY FIX 3.33.1: Use centralized email validator
		if (!isValidEmail(form.email)) return getEmailErrorMessage(form.email);
		if (!form.message.trim()) return "Please enter your message.";
		return null;
	};

	const handleSubmit = async (e) => {
		e.preventDefault();
		const error = validate();
		if (error) return toast.error(error);
		setLoading(true);
		try {
			const resp = await api.post(`/api/v1/contact/contact`, form);
			if (resp.data?.success) {
				toast.success(resp.data.message || "Message sent successfully.");
				setForm({ name: "", email: "", subject: "", message: "" });
			} else {
				toast.error(resp.data?.message || "Failed to send message.");
			}
		} catch (err) {
			console.error(err);
			toast.error(err.response?.data?.message || "Network error. Please try again later.");
		} finally {
			setLoading(false);
		}
	};

	return (
		<Box sx={{ maxWidth: 760, mx: "auto", py: 6, px: 2 }}>
			<Typography variant="h4" sx={{ mb: 2, fontWeight: 700 }}>Contact Us</Typography>
			<Typography variant="body1" sx={{ mb: 4, color: "text.secondary" }}>Have a question or feedback? Fill the form below and we'll get back to you shortly.</Typography>

			<Box component="form" onSubmit={handleSubmit} sx={{ display: 'grid', gap: 2 }}>
				<TextField label="Name" name="name" value={form.name} onChange={handleChange} fullWidth />
				<TextField label="Email" name="email" value={form.email} onChange={handleChange} fullWidth />
				<TextField label="Subject (optional)" name="subject" value={form.subject} onChange={handleChange} fullWidth />
				<TextField label="Message" name="message" value={form.message} onChange={handleChange} fullWidth multiline minRows={4} />

				<Button type="submit" variant="contained" color="primary" disabled={loading} sx={{ alignSelf: 'start', mt: 1 }}>
					{loading ? <CircularProgress size={20} color="inherit" /> : "Send Message"}
				</Button>
			</Box>
		</Box>
	);
};

export default ContactUs;
