import UserExamAnswer from '../../Models/Data-Maintenance/exam-mark-records-model.js';
import UserExamAttempt from '../../Models/Courses/UserExamAnswer.js';
import mongoose from 'mongoose';

// Helper function to calculate grade from percentage
const calculateGrade = (percentage) => {
  if (percentage >= 90) return 'A+';
  if (percentage >= 80) return 'A';
  if (percentage >= 70) return 'B';
  if (percentage >= 60) return 'C';
  if (percentage >= 50) return 'D';
  if (percentage >= 40) return 'E';
  return 'F';
};

// Helper function to convert exam attempt to mark record format
const convertAttemptToMarkRecord = async (attempt) => {
  try {
    // Populate course details if not already populated
    if (attempt.courseId && !attempt.courseId.coursename) {
      await attempt.populate('courseId', 'coursename category');
    }
    
    const percentage = attempt.totalMarks > 0 
      ? ((attempt.obtainedMarks / attempt.totalMarks) * 100).toFixed(2) 
      : 0;
    
    const grade = calculateGrade(parseFloat(percentage));
    const status = parseFloat(percentage) >= 40 ? 'Pass' : 'Fail';
    
    return {
      _id: attempt._id,
      studentName: attempt.username || 'N/A',
      studentId: attempt.studentRegisterNumber || 'N/A',
      courseName: attempt.courseId?.coursename || 'N/A',
      category: attempt.courseId?.category || 'N/A',
      chapterTitle: attempt.chapterTitle || 'N/A',
      lessonName: attempt.lessonName || 'N/A',
      CourseMotherId: attempt.CourseMotherId || 'N/A',
      grade: grade,
      percentage: parseFloat(percentage),
      mark: attempt.obtainedMarks || 0,
      totalMarks: attempt.totalMarks || 0,
      status: status,
      examDate: attempt.attemptedAt || attempt.createdAt,
      createdAt: attempt.createdAt,
      updatedAt: attempt.updatedAt,
      source: 'exam_attempt', // Flag to indicate this came from exam attempts
    };
  } catch (error) {
    console.error('Error converting attempt to mark record:', error);
    return null;
  }
};

// Create new student exam record
export const createStudentNewExamRecords = async (req, res) => {
  try {
    const { 
      studentName, 
      studentId, 
      grade, 
      percentage, 
      mark, 
      status,
      courseName,
      category,
      chapterTitle,
      examinationName,
      subject,
      totalMarks,
      remarks,
      examDate
    } = req.body;

    // Validate required fields
    if (!studentName || !studentId || !grade || percentage == null || mark == null || !status) {
      return res.status(400).json({
        success: false,
        message: 'Required fields: studentName, studentId, grade, percentage, mark, status.',
      });
    }

    // Create record with all fields
    const newRecord = await UserExamAnswer.create({
      studentName,
      studentId,
      grade,
      percentage,
      mark,
      status,
      courseName: courseName || undefined,
      category: category || undefined,
      chapterTitle: chapterTitle || undefined,
      examinationName: examinationName || undefined,
      subject: subject || undefined,
      totalMarks: totalMarks || undefined,
      remarks: remarks || undefined,
      examDate: examDate || undefined,
    });

    console.log('✅ Exam record created:', {
      studentId: newRecord.studentId,
      courseName: newRecord.courseName,
      grade: newRecord.grade,
    });

    res.status(201).json({
      success: true,
      message: 'Exam record created successfully.',
      data: newRecord,
    });
  } catch (error) {
    console.error('❌ Error in createStudentNewExamRecords:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred while creating the exam record.',
      details: error.message,
    });
  }
};

// Update existing student exam record
export const updateStudentExamRecords = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Record ID is required.',
      });
    }

    const updatedRecord = await UserExamAnswer.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true,
    });

    if (!updatedRecord) {
      return res.status(404).json({
        success: false,
        message: 'Exam record not found.',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Exam record updated successfully.',
      data: updatedRecord,
    });
  } catch (error) {
    console.error('Error in updateStudentExamRecords:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred while updating the exam record.',
      details: error.message,
    });
  }
};

// Get all student exam marks (with pagination, filtering, sorting)
export const getAllStudentExamMarks = async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const skip = (page - 1) * limit;

    // Build filter for UserExamAnswer
    const filter = {};
    if (req.query.studentId) filter.studentId = req.query.studentId.trim();
    if (req.query.grade) filter.grade = req.query.grade;
    if (req.query.status) filter.status = req.query.status;
    if (req.query.courseName) filter.courseName = req.query.courseName.trim();
    if (req.query.category) filter.category = req.query.category.trim();

    // Build filter for UserExamAttempt
    const attemptFilter = {};
    if (req.query.studentId) attemptFilter.studentRegisterNumber = req.query.studentId.trim();
    if (req.query.courseName) attemptFilter.chapterTitle = req.query.courseName.trim(); // Approximate match

    console.log('📊 Fetching exam records with filter:', filter);
    console.log('📊 Fetching exam attempts with filter:', attemptFilter);

    // Fetch from both collections
    const [markRecords, examAttempts] = await Promise.all([
      UserExamAnswer.find(filter).sort({ createdAt: -1 }).lean(),
      UserExamAttempt.find(attemptFilter)
        .populate('courseId', 'coursename category')
        .sort({ attemptedAt: -1 })
        .lean()
    ]);

    console.log(`✅ Found ${markRecords.length} mark records`);
    console.log(`✅ Found ${examAttempts.length} exam attempts`);

    // Convert exam attempts to mark record format
    const convertedAttempts = [];
    for (const attempt of examAttempts) {
      const converted = await convertAttemptToMarkRecord(attempt);
      if (converted) {
        // Only include if not already in markRecords (avoid duplicates)
        const isDuplicate = markRecords.some(
          record => record.studentId === converted.studentId && 
                    record.courseName === converted.courseName
        );
        if (!isDuplicate) {
          convertedAttempts.push(converted);
        }
      }
    }

    console.log(`✅ Converted ${convertedAttempts.length} exam attempts to mark records`);

    // Combine both sources
    let allRecords = [...markRecords, ...convertedAttempts];

    // Apply grade and status filters to converted attempts
    if (req.query.grade) {
      allRecords = allRecords.filter(r => r.grade === req.query.grade);
    }
    if (req.query.status) {
      allRecords = allRecords.filter(r => r.status === req.query.status);
    }

    // Sort combined records
    const sortKey = req.query.sortBy ? req.query.sortBy.split(':')[0] : 'createdAt';
    const sortOrder = req.query.sortBy && req.query.sortBy.split(':')[1] === 'asc' ? 1 : -1;
    
    allRecords.sort((a, b) => {
      const aVal = a[sortKey];
      const bVal = b[sortKey];
      if (aVal < bVal) return -1 * sortOrder;
      if (aVal > bVal) return 1 * sortOrder;
      return 0;
    });

    // Pagination
    const total = allRecords.length;
    const paginatedRecords = allRecords.slice(skip, skip + limit);

    console.log(`✅ Returning ${paginatedRecords.length} records (Total: ${total})`);
    if (paginatedRecords.length > 0) {
      console.log('📝 Sample record:', {
        studentId: paginatedRecords[0].studentId,
        studentName: paginatedRecords[0].studentName,
        courseName: paginatedRecords[0].courseName,
        grade: paginatedRecords[0].grade,
        source: paginatedRecords[0].source || 'mark_record',
      });
    }

    res.status(200).json({
      success: true,
      count: paginatedRecords.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      data: paginatedRecords,
    });
  } catch (error) {
    console.error('❌ Error in getAllStudentExamMarks:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred while fetching exam marks.',
      details: error.message,
    });
  }
};

// Download student exam records (basic version - you can customize further)
export const downloadStudentExamRecords = async (req, res) => {
  try {
    const records = await UserExamAnswer.find({}).lean();

    if (!records.length) {
      return res.status(404).json({
        success: false,
        message: 'No exam records found to download.',
      });
    }

    res.setHeader('Content-Disposition', 'attachment; filename="exam_records.json"');
    res.setHeader('Content-Type', 'application/json');
    res.status(200).send(JSON.stringify(records, null, 2));
  } catch (error) {
    console.error('Error in downloadStudentExamRecords:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred while downloading exam records.',
      details: error.message,
    });
  }
};

// Get overall exam statistics
export const getStudentExamStatistics = async (req, res) => {
  try {
    const statistics = await UserExamAnswer.aggregate([
      {
        $group: {
          _id: '$grade',
          count: { $sum: 1 },
          avgPercentage: { $avg: '$percentage' },
          avgMark: { $avg: '$mark' },
          passCount: {
            $sum: {
              $cond: [{ $eq: ['$status', 'Pass'] }, 1, 0],
            },
          },
        },
      },
    ]);

    if (!statistics.length) {
      return res.status(404).json({
        success: false,
        message: 'No exam statistics available.',
      });
    }

    // Calculate global statistics
    const totalStudents = statistics.reduce((sum, item) => sum + item.count, 0);
    const averagePercentage = (
      statistics.reduce((sum, item) => sum + item.avgPercentage * item.count, 0) / totalStudents
    ).toFixed(2);
    const averageMark = (
      statistics.reduce((sum, item) => sum + item.avgMark * item.count, 0) / totalStudents
    ).toFixed(2);
    const passRate = (
      (statistics.reduce((sum, item) => sum + item.passCount, 0) / totalStudents) *
      100
    ).toFixed(2);

    res.status(200).json({
      success: true,
      data: {
        totalStudents,
        averagePercentage,
        averageMark,
        passRate,
        gradeDistribution: statistics.map((item) => ({
          grade: item._id,
          count: item.count,
        })),
      },
    });
  } catch (error) {
    console.error('Error in getStudentExamStatistics:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred while fetching exam statistics.',
      details: error.message,
    });
  }
};