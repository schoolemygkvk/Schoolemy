import express from 'express';
import { getAllStaff } from '../../Controllers/Resources-Controller/staff-details.js';
const router = express.Router();


// Get all staff with pagination
router.get('/staff-details', getAllStaff);


export default router;