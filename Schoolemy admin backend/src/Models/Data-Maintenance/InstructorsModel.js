import mongoose from "mongoose";

const instructorsSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Name is required'],
        trim: true,
        maxlength: [100, 'Name cannot exceed 100 characters']
    },
    designation: {
        type: String,
        required: [true, 'Designation is required'],
        trim: true,
        maxlength: [100, 'Designation cannot exceed 100 characters']
    },
    tenure: {
        type: String,
        required: [true, 'Tenure is required'],
        trim: true,
        maxlength: [50, 'Tenure cannot exceed 50 characters']
    },
    remuneration: {
        type: String,
        required: [true, 'Remuneration is required'],
        trim: true,
        maxlength: [50, 'Remuneration cannot exceed 50 characters']
    },
    qualification: {
        type: String,
        required: [true, 'Qualification is required'],
        trim: true,
        maxlength: [200, 'Qualification cannot exceed 200 characters']
    },
    imageUrl: {
        type: String,
        default: null,
        trim: true
    },
    order: {
        type: Number,
        unique: true,
        sparse: true,
        required: false
    }
}, { timestamps: true });

const Instructors = mongoose.model('Instructors', instructorsSchema);
export default Instructors;
