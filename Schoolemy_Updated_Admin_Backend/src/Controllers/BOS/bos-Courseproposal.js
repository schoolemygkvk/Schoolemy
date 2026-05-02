import CourseProposal from '../../Models/BOS/bos-Courseproposal.js';
import { sendSuccess, sendError, sendPaginated, sendValidationError, sendNoContent } from "../../Utils/responseHandler.js";

const isS3Url = (url) =>
  typeof url === "string" && /^https?:\/\/.+\.s3\..+\.amazonaws\.com\/.+/i.test(url);

// Submit a new course proposal (JSON or multipart with optional pdf_file field)
export async function createProposal(req, res) {
  try {
    // Generate a unique Proposal_id (you might want to adjust this format)
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 8);
    const proposalId = `PROP-${timestamp}-${randomStr}`;

    let pdf_file = req.body.pdf_file || "";
    if (req.file) {
      const isLambda = process.env.NODE_ENV === "lambda" || !!process.env.AWS_EXECUTION_ENV;
      const uploadsPrefix = isLambda ? "/tmp/bos-proposals" : "/uploads/bos-proposals";
      pdf_file = `${uploadsPrefix}/${req.file.filename}`;
    }

    const proposalData = {
      title: req.body.title,
      description: req.body.description,
      department: req.body.department,
      syllabus: req.body.syllabus,
      Proposal_by: req.body.Proposal_by,
      document_link: req.body.document_link,
      pdf_file,
      Proposal_id: proposalId,
      submited_on: new Date(),
    };

    // Accept only S3 URL for PDF attachments
    if (proposalData.pdf_file && proposalData.pdf_file.length > 0) {
      if (!isS3Url(proposalData.pdf_file)) {
        return res.status(400).json({
          error: "Invalid PDF attachment. Upload PDF to S3 and send the S3 URL.",
        });
      }
    }

    // Validate required fields
    const requiredFields = ['title', 'description', 'department', 'Proposal_by'];
    const missingFields = requiredFields.filter(field => !proposalData[field]);

    if (missingFields.length > 0) {
      return res.status(400).json({
        error: `Missing required fields: ${missingFields.join(', ')}`
      });
    }

    const proposal = new CourseProposal(proposalData);
    await proposal.save();
    res.status(201).json(proposal);
  } catch (err) {
    res.status(500).json({ error: "Failed to create proposal" });
  }
}

// Get all proposals
export async function getAllProposals(req, res) {
  try {
    const proposals = await CourseProposal.find()
      .sort({ submited_on: -1 }); // Sort by submission date, newest first
    res.json(proposals);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// Get single proposal by ID
export async function getProposalById(req, res) {
  try {
    // First try to find by Proposal_id
    let proposal = await CourseProposal.findOne({ Proposal_id: req.params.id });
    
    // If not found, try to find by MongoDB _id
    if (!proposal) {
      proposal = await CourseProposal.findById(req.params.id);
    }
    
    if (!proposal) return res.status(404).json({ error: 'Proposal not found' });
    res.json(proposal);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// Update (edit) proposal
export async function updateProposal(req, res) {
  try {
    // Don't allow updating Proposal_id or submited_on
    const { Proposal_id, submited_on, ...updateData } = req.body;

    if (updateData.pdf_file) {
      if (!isS3Url(updateData.pdf_file)) {
        return res.status(400).json({
          error: "Invalid PDF file URL. Upload PDF to S3 and send the S3 URL.",
        });
      }
    }
    
    // First try to find by Proposal_id
    let proposal = await CourseProposal.findOneAndUpdate(
      { Proposal_id: req.params.id },
      updateData,
      { new: true }
    );
    
    // If not found, try to update by MongoDB _id
    if (!proposal) {
      proposal = await CourseProposal.findByIdAndUpdate(
        req.params.id,
        updateData,
        { new: true }
      );
    }
    
    if (!proposal) return res.status(404).json({ error: 'Proposal not found' });
    res.json(proposal);
  } catch (err) {
    res.status(500).json({ error: "Failed to update proposal" });
  }
}

// Approve or reject proposal
export async function updateStatus(req, res) {
  try {
    const { status, comments } = req.body;
    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    // First try to find by Proposal_id
    let proposal = await CourseProposal.findOneAndUpdate(
      { Proposal_id: req.params.id },
      { status, comments },
      { new: true }
    );
    
    // If not found, try to update by MongoDB _id
    if (!proposal) {
      proposal = await CourseProposal.findByIdAndUpdate(
        req.params.id,
        { status, comments },
        { new: true }
      );
    }
    
    if (!proposal) return res.status(404).json({ error: 'Proposal not found' });
    res.json(proposal);
  } catch (err) {
    res.status(500).json({ error: "Failed to update proposal status" });
  }
}
