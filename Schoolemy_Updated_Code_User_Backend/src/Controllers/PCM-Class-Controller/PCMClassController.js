import  logger  from "../../Utils/logger.js";

import PCMClass from "../../Models/PCM-Class-Model/PCMClass.js";



// Get PCM classes by subject with timing-based status and join conditions
export const getClassesBySubject = async (req, res) => {
  try {
    // Accept subject from either query params or request body
    const { subject } = req.body || req.query;

    // Validate subject
    const validSubjects = ["physics", "chemistry", "mathematics"];
    if (!subject || !validSubjects.includes(subject.toLowerCase())) {
      // Return empty array instead of error for missing/invalid subject
      return res.status(200).json({
        success: true,
        subject: subject || "unknown",
        count: 0,
        data: [],
        message: !subject ? "No subject specified" : `Subject must be one of: ${validSubjects.join(", ")}`,
      });
    }

    // Fetch all active classes of this subject
    const classes = await PCMClass.find({
      selectedSubject: subject.toLowerCase(),
      is_active: true,
    })
      .sort({ startTime: 1 })
      .lean();

    const now = new Date();

    // Add computed live status and joinable flag (15 minutes before start time)
    const updatedClasses = classes.map((cls) => {
      const startTime = new Date(cls.startTime);
      const endTime = new Date(cls.endTime);
      const fifteenMinutesBefore = new Date(startTime.getTime() - 15 * 60 * 1000);

      let status = "upcoming";
      let isJoinable = false;

      // Class is joinable from 15 minutes before start until end time
      if (now >= fifteenMinutesBefore && now <= endTime) {
        status = "live";
        isJoinable = true;
      } else if (now > endTime) {
        status = "completed";
      }

      const timeUntilStart = Math.max(0, startTime - now);

      return {
        ...cls,
        status,
        isJoinable,
        timeUntilStart,
      };
    });

    return res.status(200).json({
      success: true,
      subject: subject.toLowerCase(),
      count: updatedClasses.length,
      data: updatedClasses,
    });
  } catch (error) {
    logger.error("Error fetching classes:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch classes",
      error: error.message,
    });
  }
};
