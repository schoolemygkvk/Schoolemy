import Postclass from "../../Models/Student-PCM/Postclass-Model.js";
import Subject from "../../Models/Student-PCM/SubjectModel.js";
import { sendSuccess, sendError, sendPaginated, sendValidationError, sendNoContent } from "../../Utils/responseHandler.js";

// Get Meet link dynamically from database based on subject code
async function getMeetLinkForSubject(subjectCode) {
    const subject = await Subject.findOne({ 
        code: subjectCode.toLowerCase(), 
        isActive: true 
    });
    
    if (!subject) {
        throw new Error(`Subject '${subjectCode}' not found or is inactive`);
    }
    
    return subject.meetLink;
}

// Validate that at least one active subject exists
async function validateSubjectsExist() {
    const count = await Subject.countDocuments({ isActive: true });
    if (count === 0) {
        throw new Error('No active subjects configured. Please add subjects first.');
    }
}

// Create a new PCM class document with meet link based on selected subject
export const createPostclass = async (req, res) => {
    try {
        // Validate that subjects exist in database
        await validateSubjectsExist();

        const { className, batch, academicYear, selectedSubject, startTime, endTime, timezone } = req.body;

        // Get the appropriate Meet link dynamically from database
        const meetLink = await getMeetLinkForSubject(selectedSubject);

        // Create the class document
        const created = await Postclass.create({
            className,
            batch,
            academicYear,
            selectedSubject,
            meetLink,
            startTime,
            endTime,
            timezone: timezone || "Asia/Kolkata",
        });

        return sendSuccess(res, 201, "Created successfully", created );
    } catch (error) {
        console.error("createPostclass error:", error);
        return res.status(500).json({ 
            success: false, 
            error: error.message || "Failed to create PCM class"
        });
    }
};

// List all PCM classes with filters
export const listPostclasses = async (req, res) => {
    try {
        const { className, batch, academicYear, selectedSubject } = req.query;
        
        // Build filter object based on query parameters
        const filter = {};
        if (className) filter.className = new RegExp(className, 'i');
        if (batch) filter.batch = new RegExp(batch, 'i');
        if (academicYear) filter.academicYear = academicYear;
        if (selectedSubject) filter.selectedSubject = selectedSubject;

        const docs = await Postclass.find(filter)
            .sort({ startTime: 1 }) // Sort by start time ascending
            .limit(100);

        return res.json({ 
            success: true, 
            count: docs.length,
            data: docs 
        });
    } catch (error) {
        console.error("listPostclasses error:", error);
        return res.status(500).json({ 
            success: false, 
            error: error.message || "Failed to fetch PCM classes"
        });
    }
};

// Update an existing PCM class document
export const updatePostclass = async (req, res) => {
    try {
        await validateSubjectsExist();
        
        const id = req.params.id;
        const { className, batch, academicYear, selectedSubject, startTime, endTime, timezone } = req.body;

        // If subject is being updated, get the new Meet link
        const updateData = {
            className,
            batch,
            academicYear,
            startTime,
            endTime
        };

        if (timezone) updateData.timezone = timezone;
        
        // Only update Meet link if subject is changing
        if (selectedSubject) {
            updateData.selectedSubject = selectedSubject;
            updateData.meetLink = await getMeetLinkForSubject(selectedSubject);
        }

        const updated = await Postclass.findByIdAndUpdate(
            id, 
            updateData,
            { new: true, runValidators: true }
        );

        if (!updated) {
            return res.status(404).json({ 
                success: false, 
                error: "PCM class not found" 
            });
        }

        return sendSuccess(res, 200, "Success", updated );
    } catch (error) {
        console.error("updatePostclass error:", error);
        return res.status(500).json({ 
            success: false, 
            error: error.message || "Failed to update PCM class"
        });
    }
};

// Delete a PCM class
export const deletePostclass = async (req, res) => {
    try {
        const id = req.params.id;
        const deleted = await Postclass.findByIdAndDelete(id);
        
        if (!deleted) {
            return res.status(404).json({ 
                success: false, 
                error: "PCM class not found" 
            });
        }

        return sendSuccess(res, 200, "PCM class deleted successfully", deleted 
        );
    } catch (error) {
        console.error("deletePostclass error:", error);
        return res.status(500).json({ 
            success: false, 
            error: error.message || "Failed to delete PCM class"
        });
    }
};

