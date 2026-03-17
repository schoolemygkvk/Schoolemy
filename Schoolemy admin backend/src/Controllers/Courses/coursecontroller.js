import Course from "../../Models/Courses/coursemodel.js";
import { PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import s3 from "../../DB/adudios3.js";
import dotenv from "dotenv";
import path from "path";
import { URL } from "url";
import { fixUtf8InObject, decodeUtf8Text } from "../../Utils/utf8Helper.js";

dotenv.config();

// Upload file to S3
const uploadToS3 = async (file, folder, rawName = null) => {
  const ext = path.extname(file.originalname);
  
  // Helper function to detect and fix latin1-encoded UTF-8 filenames
  const fixLatinEncodedUtf8 = (filename) => {
    // Use the existing utility function for consistent handling
    return decodeUtf8Text(filename);
  };
  
  // Fix the original filename encoding if needed
  const correctedOriginalName = fixLatinEncodedUtf8(file.originalname);
  
  // Use rawName if provided, otherwise use corrected original file name
  let baseName;
  if (rawName && typeof rawName === "string" && rawName.trim()) {
    // Also fix rawName encoding if it has issues
    const correctedRawName = fixLatinEncodedUtf8(rawName.trim());
    baseName = path.basename(correctedRawName, path.extname(correctedRawName));
    console.log(`   📝 Using custom name: "${baseName}"`);
  } else {
    baseName = path.basename(correctedOriginalName, ext);
    console.log(`   📄 Using original filename: "${baseName}"`);
  }

  // Preserve the exact name as provided (now properly UTF-8 encoded)
  const filename = `${baseName}${ext}`;
  

  
  // Encode the key properly for S3 to handle Unicode characters
  const Key = `${folder}/${filename}`;

  const command = new PutObjectCommand({
    Bucket: process.env.AWS_S3_BUCKET_SCHOOLEMY,
    Key,
    Body: file.buffer,
    ContentType: file.mimetype,
    // Preserve original filename with UTF-8 encoding for downloads
    ContentDisposition: `inline; filename*=UTF-8''${encodeURIComponent(filename)}`,
  });

  try {
    await s3.send(command);
    
    // Construct URL with proper encoding
    // Split the Key into folder and filename parts
    const keyParts = Key.split('/');
    const encodedKeyParts = keyParts.map(part => encodeURIComponent(part));
    const encodedKey = encodedKeyParts.join('/');
    
    const s3Url = `https://${process.env.AWS_S3_BUCKET_SCHOOLEMY}.s3.${process.env.AWS_REGION}.amazonaws.com/${encodedKey}`;
    
  
    
    // Return the original filename (preserving UTF-8 characters)
    return {
      name: filename,
      originalName: baseName,
      url: s3Url,
    };
  } catch (error) {
    console.error("❌ S3 upload error:", error);
    throw new Error(`Failed to upload file to S3: ${error.message}`);
  }
};

const generateCourseMotherId = (coursename, courseduration) => {
  // Sanitize & create abbreviation
  const nameAbbreviation = coursename
    .split(/\s+/)
    .map((word) => word[0]) // Take first letter of each word
    .join("")
    .toUpperCase()
    .substring(0, 10); // Optional: limit max length

  const durationMap = {
    "6 months": "6M",
    "1 year": "1Y",
    "2 years": "2Y",
  };

  const durationCode = durationMap[courseduration] || "XX";
  const id = `${nameAbbreviation}-${durationCode}`;
  console.log(`🆔 Generated CourseMotherId: ${id}`);
  return id;
};

// Create Course
export const createCourse = async (req, res) => {
  try {
    // Fix UTF-8 encoding issues in the entire request body
    const fixedBody = fixUtf8InObject(req.body);
    
    const {
      coursename,
      category,
      courseduration,
      CourseMotherId,
      useAutoCourseMotherId,
    } = fixedBody;
    console.log("📝 Request body:", fixedBody);
    
    // Parse EMI from FormData format (emi.isAvailable, emi.emiDurationMonths, etc.)
    const emiIsAvailable = fixedBody['emi.isAvailable'] === 'true';
    const emi = {
      isAvailable: emiIsAvailable,
      emiDurationMonths: emiIsAvailable && fixedBody['emi.emiDurationMonths'] ? parseInt(fixedBody['emi.emiDurationMonths']) : null,
      totalAmount: emiIsAvailable && fixedBody['emi.totalAmount'] ? parseFloat(fixedBody['emi.totalAmount']) : null,
      monthlyAmount: emiIsAvailable && fixedBody['emi.monthlyAmount'] ? parseFloat(fixedBody['emi.monthlyAmount']) : null,
      notes: emiIsAvailable ? (fixedBody['emi.notes'] || '') : '',
    };
    console.log("📊 Parsed EMI data:", emi);
    // Auto-generate CourseMotherId if useAutoCourseMotherId is true or CourseMotherId is not provided
    let finalCourseMotherId = CourseMotherId;
    if (useAutoCourseMotherId === "true" || !CourseMotherId) {
      console.log("🔄 Auto-generating CourseMotherId");
      finalCourseMotherId = generateCourseMotherId(coursename, courseduration);
    }

    if (!coursename || !category || !courseduration) {
      return res.status(400).json({
        error: "coursename, category, and courseduration are required",
      });
    }

    //EMI -Validation
    if (emi.isAvailable === true) {
      if (!emi.emiDurationMonths || !emi.totalAmount) {
        return res.status(400).json({
          error: "If EMI is available, emiDurationMonths and totalAmount are required",
        });
      }
    }

    const existing = await Course.findOne({ coursename });
    if (existing)
      return res.status(400).json({ error: "Course already exists" });

    const courseFolder = coursename.toLowerCase().replace(/\s+/g, "-");
    const files = req.files || [];

    const fileMap = {};

    // 🔁 Upload each file and categorize
    for (const file of files) {
      const field = file.fieldname;
      let folder = "misc";

      if (field.includes("previewvideo")) folder = "preview";
      else if (field.includes("thumbnail")) folder = "thumbnail";
      else if (field.includes("audio")) folder = "audio";
      else if (field.includes("video")) folder = "video";
      else if (field.includes("pdf")) folder = "pdf";

      // 🔍 Extract raw name from body
      let rawName = null;
      const match = field.match(
        /chapters\[(\d+)\]\.lessons\[(\d+)\]\.(audio|video|pdf)/
      );
      if (match) {
        const [_, chIdx, lsnIdx, type] = match;
        const key = `chapters[${chIdx}].lessons[${lsnIdx}].${type}name`;
        const val = fixedBody[key]; // Use fixed body with UTF-8 encoding
        if (Array.isArray(val)) rawName = val[fileMap[field]?.length || 0];
        else rawName = val;
        
        // Debug: Log custom name if provided
        if (rawName) {
          console.log(`📝 Custom ${type} filename for ${field}:`, rawName);
          console.log(`📝 Filename bytes:`, Array.from(Buffer.from(rawName, 'utf8')).slice(0, 20));
        }
      }

      const uploadResult = await uploadToS3(
        file,
        `${courseFolder}/${folder}`,
        rawName
      );

      if (!fileMap[field]) fileMap[field] = [];
      // uploadResult.name already contains the custom name with extension from uploadToS3
      fileMap[field].push({ 
        name: uploadResult.name,
        url: uploadResult.url 
      });
      
      console.log(`✅ Stored file in map - Key: ${field}, Name: ${uploadResult.name}`);
    }

    // 📚 Build chapters & lessons
    const chapters = [];
    let chapterIndex = 0;

    while (fixedBody[`chapters[${chapterIndex}].title`]) {
      const title = fixedBody[`chapters[${chapterIndex}].title`];
      const lessons = [];

      let lessonIndex = 0;
      while (
        fixedBody[`chapters[${chapterIndex}].lessons[${lessonIndex}].lessonname`]
      ) {
        const base = `chapters[${chapterIndex}].lessons[${lessonIndex}]`;
        const lessonData = {
          lessonname: fixedBody[`${base}.lessonname`],
          audioFile: fileMap[`${base}.audio`] || [],
          videoFile: fileMap[`${base}.video`] || [],
          pdfFile: fileMap[`${base}.pdf`] || [],
        };
        
        // Log what's being saved to database
        console.log(`📚 Lesson ${lessonIndex} data for database:`, {
          lessonname: lessonData.lessonname,
          audioFiles: lessonData.audioFile.map(f => ({
            name: f.name,
            url: f.url.substring(0, 100) + '...'
          })),
          videoFiles: lessonData.videoFile.length,
          pdfFiles: lessonData.pdfFile.length,
        });
        
        lessons.push(lessonData);

        lessonIndex++;
      }

      chapters.push({ title, lessons });
      chapterIndex++;
    }

    // Handle price
    const amount = parseFloat(fixedBody["price.amount"]) || 0;
    const discount = parseFloat(fixedBody["price.discount"]) || 0;
    const finalPrice = amount * (1 - discount / 100);

    // Assemble course
    const course = new Course({
      CourseMotherId: finalCourseMotherId,
      coursename,
      category,
      courseduration,
      thumbnail: fileMap["thumbnail"]?.[0]?.url || fixedBody.thumbnail || "",
      previewVideo: fileMap["previewvideo"] || [],
      contentduration: {
        hours: parseInt(fixedBody["contentduration.hours"]) || 0,
        minutes: parseInt(fixedBody["contentduration.minutes"]) || 0,
      },
      chapters,
      price: {
        amount,
        currency: fixedBody["price.currency"] || "INR",
        discount,
        finalPrice,
      },
      level: fixedBody.level,
      language: fixedBody.language,
      certificates: fixedBody.certificates,
      instructor: {
        name: fixedBody["instructor.name"],
        role: fixedBody["instructor.role"],
        socialmedia_id: fixedBody["instructor.socialmedia_id"],
      },
      description: fixedBody.description || "",
      whatYoullLearn: Array.isArray(fixedBody.whatYoullLearn)
        ? fixedBody.whatYoullLearn
        : typeof fixedBody.whatYoullLearn === "string"
        ? fixedBody.whatYoullLearn.split(",")
        : [],
      emi: {
        isAvailable: emi?.isAvailable || false,
        emiDurationMonths: emi?.emiDurationMonths || null,
        monthlyAmount: emi?.monthlyAmount || null,
        totalAmount: emi?.totalAmount || null,
        notes: emi?.notes || "",
      },
    });

    console.log("🛠️ Saving course to DB...");
    const saved = await course.save();
    console.log("✅ Course created successfully:", saved._id);

    res.status(201).json({
      success: true,
      message: "Course created successfully",
      data: {
        courseId: saved._id,
        CourseMotherId: saved.CourseMotherId,
        coursename: saved.coursename,
      },
    });
  } catch (error) {
    console.error("❌ Course creation failed:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

/**
 * Create course using pre-uploaded S3 files (NO file uploads here)
 * This endpoint only receives metadata + S3 URLs
 * 
 * ✅ Bypasses API Gateway's 10MB limit
 * ✅ Works with files up to 5GB
 * ✅ ZERO 413 errors
 * 
 * @route POST /api/courses/create-with-s3-urls
 * @access Protected (requires authentication)
 * 
 * Workflow:
 * 1. Frontend uploads files to S3 using presigned URLs
 * 2. Frontend calls this endpoint with S3 URLs + metadata
 * 3. Backend saves course to MongoDB with S3 references
 */
export const createCourseWithS3Urls = async (req, res) => {
  try {
    const fixedBody = fixUtf8InObject(req.body);
    
    const {
      coursename,
      category,
      courseduration,
      CourseMotherId,
      useAutoCourseMotherId,
      thumbnail,
      previewVideo,
      contentduration,
      chapters,
      price,
      level,
      language,
      certificates,
      description,
      whatYoullLearn,
      emi,
      instructor,
    } = fixedBody;

    console.log("📝 Creating course with S3 URLs (no file uploads)");
    console.log("📚 Chapters count:", chapters?.length || 0);

    // Auto-generate CourseMotherId if needed
    let finalCourseMotherId = CourseMotherId;
    if (useAutoCourseMotherId === true || useAutoCourseMotherId === "true" || !CourseMotherId) {
      console.log("🔄 Auto-generating CourseMotherId");
      finalCourseMotherId = generateCourseMotherId(coursename, courseduration);
    }

    // Validate required fields
    if (!coursename || !category || !courseduration) {
      return res.status(400).json({
        error: "coursename, category, and courseduration are required",
      });
    }

    // Check if course already exists
    const existing = await Course.findOne({ coursename });
    if (existing) {
      return res.status(400).json({ error: "Course already exists" });
    }

    // EMI validation
    if (emi?.isAvailable === true) {
      if (!emi.emiDurationMonths || !emi.totalAmount) {
        return res.status(400).json({
          error: "If EMI is available, emiDurationMonths and totalAmount are required",
        });
      }
    }

    // Calculate price
    const amount = parseFloat(price?.amount) || 0;
    const discount = parseFloat(price?.discount) || 0;
    const finalPrice = amount * (1 - discount / 100);

    // Create course document (all file URLs already provided)
    const course = new Course({
      CourseMotherId: finalCourseMotherId,
      coursename,
      category,
      courseduration,
      thumbnail: thumbnail || "",
      previewVideo: previewVideo || [],
      contentduration: {
        hours: parseInt(contentduration?.hours) || 0,
        minutes: parseInt(contentduration?.minutes) || 0,
      },
      chapters: chapters || [],
      price: {
        amount,
        currency: price?.currency || "INR",
        discount,
        finalPrice,
      },
      level,
      language,
      certificates,
      instructor: instructor || {
        name: "",
        role: "",
        socialmedia_id: "",
      },
      description: description || "",
      whatYoullLearn: Array.isArray(whatYoullLearn) ? whatYoullLearn : [],
      emi: {
        isAvailable: emi?.isAvailable || false,
        emiDurationMonths: emi?.emiDurationMonths || null,
        monthlyAmount: emi?.monthlyAmount || null,
        totalAmount: emi?.totalAmount || null,
        notes: emi?.notes || "",
      },
    });

    console.log("🛠️ Saving course to DB...");
    const saved = await course.save();
    console.log("✅ Course created successfully with S3 URLs:", saved._id);

    res.status(201).json({
      success: true,
      message: "Course created successfully",
      data: {
        courseId: saved._id,
        CourseMotherId: saved.CourseMotherId,
        coursename: saved.coursename,
      },
    });
  } catch (error) {
    console.error("❌ Course creation failed:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// Get courses name
export const getCourseNames = async (req, res) => {
  try {
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    
    // Include _id and category for course selection in forms
    const courses = await Course.find({}, "coursename category chapters.title");

    // Fix UTF-8 encoding and format the response
    const formattedCourses = courses.map((course) => {
      const courseObj = course.toObject();
      return {
        _id: courseObj._id.toString(), // Convert ObjectId to string
        coursename: courseObj.coursename,
        category: courseObj.category || 'N/A',
        chapters: courseObj.chapters.map((chapter) => chapter.title),
      };
    });
    
    const fixedCourses = fixUtf8InObject(formattedCourses);
    
    // Debug log first course
    if (fixedCourses.length > 0) {
      console.log('📤 Sending course example:', {
        _id: fixedCourses[0]._id,
        _id_type: typeof fixedCourses[0]._id,
        coursename: fixedCourses[0].coursename
      });
    }

    res.status(200).json(fixedCourses);
  } catch (error) {
    console.error("❌ Failed to get course names:", error);
    res.status(500).json({ error: "Failed to fetch course names" });
  }
};

// Get courses
export const getCourseByName = async (req, res) => {
  try {
    // Ensure UTF-8 response
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    
    const { coursename } = req.params;

    if (!coursename) {
      return res.status(400).json({ error: "coursename is required" });
    }

    const course = await Course.findOne({ coursename });

    if (!course) {
      return res.status(404).json({ error: "Course not found" });
    }

    // Fix any corrupted UTF-8 text in the course data
    const fixedCourse = fixUtf8InObject(course.toObject());
    
    // Fix double-encoded URLs in file objects
    const fixFileUrls = (chapters) => {
      if (!chapters) return chapters;
      
      return chapters.map(chapter => ({
        ...chapter,
        lessons: (chapter.lessons || []).map(lesson => {
          const fixMediaFiles = (files) => {
            if (!Array.isArray(files)) return files;
            return files.map(file => {
              if (file && file.url) {
                // Check if URL contains double-encoded characters (like %C3%A0)
                // Pattern: %C3%[80-BF] indicates double encoding of UTF-8
                const doubleEncodedPattern = /%C3%[89AB][0-9A-F]|%C2%[89AB][0-9A-F]/i;
                
                if (doubleEncodedPattern.test(file.url)) {
                  try {
                    // Decode once to fix double encoding
                    const decodedUrl = decodeURIComponent(file.url);
                    // Re-encode properly
                    const urlParts = decodedUrl.split('/');
                    const fixedParts = urlParts.slice(0, -1); // All parts except filename
                    const filename = urlParts[urlParts.length - 1]; // Just the filename
                    const properUrl = [...fixedParts, encodeURIComponent(filename)].join('/');
                    
                    console.log(`🔧 Fixed double-encoded URL:`);
                    console.log(`   Original: ${file.url.substring(0, 100)}...`);
                    console.log(`   Fixed: ${properUrl.substring(0, 100)}...`);
                    
                    return {
                      ...file,
                      url: properUrl
                    };
                  } catch (e) {
                    console.warn('Failed to fix URL:', file.url);
                    return file;
                  }
                }
              }
              return file;
            });
          };
          
          return {
            ...lesson,
            audioFile: fixMediaFiles(lesson.audioFile),
            videoFile: fixMediaFiles(lesson.videoFile),
            pdfFile: fixMediaFiles(lesson.pdfFile),
          };
        })
      }));
    };
    
    fixedCourse.chapters = fixFileUrls(fixedCourse.chapters);
    
    console.log('📤 Sending course with UTF-8 fix and URL cleanup applied');
    res.json(fixedCourse);
  } catch (error) {
    console.error("❌ Error fetching course:", error);
    res.status(500).json({ error: error.message });
  }
};

// Delete file from S3
const deleteFromS3 = async (fileUrl) => {
  try {
    const parsedUrl = new URL(fileUrl);
    const Key = parsedUrl.pathname.substring(1); // Remove leading slash

    const command = new DeleteObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET_SCHOOLEMY,
      Key,
    });

    await s3.send(command);
    return true;
  } catch (error) {
    console.error(`❌ Error deleting file from S3:`, error);
    return false;
  }
};

// Update Course
export const updateCourse = async (req, res) => {
  try {
    // Ensure UTF-8 response
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    
    // Fix UTF-8 encoding issues in the entire request body
    const fixedBody = fixUtf8InObject(req.body);
    
    // Detect if this is a JSON request (S3 direct upload) or FormData (legacy)
    const isJsonRequest = req.headers['content-type']?.includes('application/json');
    console.log(`📥 Update request type: ${isJsonRequest ? 'JSON (S3 URLs)' : 'FormData (with files)'}`);
    
    const courseName = req.params.coursename;
    const existingCourse = await Course.findOne({ coursename: courseName });

    if (!existingCourse) {
      return res.status(404).json({ success: false, error: "Course not found" });
    }

    // ===== HANDLE JSON REQUEST (S3 Direct Upload) =====
    if (isJsonRequest) {
      console.log("📋 Processing JSON update with S3 URLs...");
      
      // Delete files from S3 if requested
      const filesToDelete = fixedBody.filesToDelete || [];
      if (filesToDelete.length > 0) {
        console.log(`🗑️ Deleting ${filesToDelete.length} files from S3...`);
        await Promise.all(
          filesToDelete.map(async (fileUrl) => {
            try {
              const url = typeof fileUrl === 'string' ? fileUrl : fileUrl.url;
              if (url) {
                await deleteFromS3(url);
                console.log('✅ Deleted:', url);
              }
            } catch (error) {
              console.error('❌ Delete error:', error);
            }
          })
        );
      }
      
      // Update course metadata
      existingCourse.coursename = fixedBody.coursename || existingCourse.coursename;
      existingCourse.category = fixedBody.category || existingCourse.category;
      existingCourse.courseduration = fixedBody.courseduration || existingCourse.courseduration;
      existingCourse.level = fixedBody.level || existingCourse.level;
      existingCourse.language = fixedBody.language || existingCourse.language;
      existingCourse.certificates = fixedBody.certificates || existingCourse.certificates;
      existingCourse.description = fixedBody.description || existingCourse.description;
      existingCourse.whatYoullLearn = fixedBody.whatYoullLearn || existingCourse.whatYoullLearn;
      
      // Update price
      if (fixedBody.price) {
        existingCourse.price.amount = fixedBody.price.amount ?? existingCourse.price.amount;
        existingCourse.price.discount = fixedBody.price.discount ?? existingCourse.price.discount;
        existingCourse.price.currency = fixedBody.price.currency || existingCourse.price.currency;
        
        // Recalculate final price
        const amount = existingCourse.price.amount;
        const discount = existingCourse.price.discount;
        existingCourse.price.finalPrice = amount * (1 - discount / 100);
      }
      
      // Update content duration
      if (fixedBody.contentduration) {
        existingCourse.contentduration.hours = fixedBody.contentduration.hours ?? existingCourse.contentduration.hours;
        existingCourse.contentduration.minutes = fixedBody.contentduration.minutes ?? existingCourse.contentduration.minutes;
      }
      
      // Update EMI
      if (fixedBody.emi) {
        existingCourse.emi.isAvailable = fixedBody.emi.isAvailable ?? existingCourse.emi.isAvailable;
        existingCourse.emi.emiDurationMonths = fixedBody.emi.emiDurationMonths ?? existingCourse.emi.emiDurationMonths;
        existingCourse.emi.totalAmount = fixedBody.emi.totalAmount ?? existingCourse.emi.totalAmount;
        existingCourse.emi.monthlyAmount = fixedBody.emi.monthlyAmount ?? existingCourse.emi.monthlyAmount;
        existingCourse.emi.notes = fixedBody.emi.notes ?? existingCourse.emi.notes;
      }
      
      // Update chapters (with S3 URLs already in place)
      if (fixedBody.chapters) {
        existingCourse.chapters = fixedBody.chapters;
      }
      
      // Save and return
      const updatedCourse = await existingCourse.save();
      console.log("✅ Course updated successfully (JSON/S3 method)");
      
      return res.status(200).json({
        success: true,
        message: "Course updated successfully",
        data: updatedCourse,
      });
    }
    
    // ===== HANDLE FORMDATA REQUEST (Legacy method with file uploads) =====
    console.log("📋 Processing FormData update with file uploads...");

    // Debug: Log all custom name fields in request body
    console.log("📋 Request body keys containing 'name':");
    Object.keys(fixedBody).forEach(key => {
      if (key.includes('name')) {
        console.log(`  ${key}: "${fixedBody[key]}"`);
      }
    });

    const courseFolder = existingCourse.coursename
      .toLowerCase()
      .replace(/\s+/g, "-");
    const files = req.files || [];
    const fileMap = {};
    
    // Parse filesToDelete - handle string, array, or undefined
    let filesToDelete = [];
    try {
      if (fixedBody.filesToDelete) {
        if (typeof fixedBody.filesToDelete === 'string') {
          // Single JSON string
          filesToDelete = [JSON.parse(fixedBody.filesToDelete)];
        } else if (Array.isArray(fixedBody.filesToDelete)) {
          // Array of strings (each is JSON) or array of objects
          filesToDelete = fixedBody.filesToDelete.map(item => 
            typeof item === 'string' ? JSON.parse(item) : item
          );
        }
      }
    } catch (error) {
      console.error('❌ Error parsing filesToDelete:', error);
      filesToDelete = [];
    }

    // Step 1: Delete requested files from S3
    if (filesToDelete.length > 0) {
      await Promise.all(
        filesToDelete.map(async (file) => {
          try {
            if (!file || !file.url) return;
            await deleteFromS3(file.url);
            console.log('✅ Deleted file from S3:', file.url);
          } catch (error) {
            console.error(`❌ Error deleting file from S3:`, error);
          }
        })
      );
    }

    // Step 2: Upload new files to S3
    for (const file of files) {
      const field = file.fieldname;
      let folder = "misc";

      // Determine folder based on file type
      if (field.includes("previewvideo")) folder = "preview";
      else if (field.includes("thumbnail")) folder = "thumbnail";
      else if (field.includes("audio")) folder = "audio";
      else if (field.includes("video")) folder = "video";
      else if (field.includes("pdf")) folder = "pdf";

      let rawName = null;
      const match = field.match(
        /chapters\[(\d+)\]\.lessons\[(\d+)\]\.(audio|video|pdf)File/
      );

      if (match) {
        const [_, chIdx, lsnIdx, type] = match;
        // The custom name field is sent as 'audioname', 'videoname', 'pdfname' (without 'File')
        const key = `chapters[${chIdx}].lessons[${lsnIdx}].${type}name`;
        console.log(`🔍 Looking for custom name with key: ${key}`);
        const val = fixedBody[key]; // Use fixed body with UTF-8 encoding
        console.log(`🔍 Found value:`, val, `(type: ${typeof val})`);
        
        if (Array.isArray(val)) {
          // If multiple files for this lesson, get the corresponding name
          const currentFileIndex = fileMap[field]?.length || 0;
          rawName = val[currentFileIndex];
        } else {
          rawName = val;
        }
        
        // Debug log
        if (rawName) {
          console.log(`📝 Custom ${type} name for ${field}: "${rawName}"`);
          console.log(`📝 Raw name length: ${rawName.length} characters`);
          console.log(`📝 Raw name bytes:`, Array.from(Buffer.from(rawName, 'utf8')).slice(0, 20));
        } else {
          console.log(`⚠️ No custom name found for ${field}, will use original filename`);
        }
      }

      console.log("📝 Final raw name to upload:", rawName); // Debug log for raw name in update

      const uploadResult = await uploadToS3(
        file,
        `${courseFolder}/${folder}`,
        rawName
      );

      if (!fileMap[field]) fileMap[field] = [];
      // uploadResult.name already contains the custom name with extension from uploadToS3
      fileMap[field].push({
        name: uploadResult.name,
        url: uploadResult.url
      });
      
      console.log(`✅ Stored file in map - Key: ${field}, Name: ${uploadResult.name}`);
    }

    // Step 3: Rebuild course structure
    const updatedChapters = [];
    let chapterIndex = 0;

    while (fixedBody[`chapters[${chapterIndex}].title`] !== undefined) {
      const title = fixedBody[`chapters[${chapterIndex}].title`];
      const lessons = [];

      let lessonIndex = 0;
      while (
        fixedBody[
          `chapters[${chapterIndex}].lessons[${lessonIndex}].lessonname`
        ] !== undefined
      ) {
        const base = `chapters[${chapterIndex}].lessons[${lessonIndex}]`;

        // Get existing lesson or create new one
        const existingLesson = existingCourse.chapters[chapterIndex]?.lessons[
          lessonIndex
        ] || { audioFile: [], videoFile: [], pdfFile: [] };

        // Get custom names from request (if user wants to rename existing files)
        // Ensure proper UTF-8 decoding for Tamil and other Unicode characters
        const customAudioName = fixedBody[`${base}.audioname`];
        const customVideoName = fixedBody[`${base}.videoname`];
        const customPdfName = fixedBody[`${base}.pdfname`];

        console.log(`📝 Custom names for lesson ${lessonIndex}:`, {
          audio: customAudioName,
          video: customVideoName,
          pdf: customPdfName
        });

        // Helper function to update file name if custom name provided
        const updateFileName = (file, customName, fileIndex = 0) => {
          if (customName && customName.trim()) {
            // Extract file extension from current file name
            const ext = file.name.includes('.') ? file.name.substring(file.name.lastIndexOf('.')) : '';
            // Use the custom name directly (it's already UTF-8 decoded by Express)
            const newName = `${customName.trim()}${ext}`;
            console.log(`🔄 Updating file name from "${file.name}" to "${newName}"`);
            return { 
              name: newName,
              url: file.url 
            };
          }
          return file;
        };

        // Process existing files - update names if custom name provided
        const existingAudioFiles = (existingLesson.audioFile || [])
          .filter((file) => !filesToDelete.some((f) => f.url === file.url))
          .map((file, idx) => {
            // For single file, use the single custom name
            // For multiple files, would need array handling
            return updateFileName(file, customAudioName, idx);
          });

        const existingVideoFiles = (existingLesson.videoFile || [])
          .filter((file) => !filesToDelete.some((f) => f.url === file.url))
          .map((file, idx) => updateFileName(file, customVideoName, idx));

        const existingPdfFiles = (existingLesson.pdfFile || [])
          .filter((file) => !filesToDelete.some((f) => f.url === file.url))
          .map((file, idx) => updateFileName(file, customPdfName, idx));

        // Combine with newly uploaded files
        const lessonData = {
          lessonname: fixedBody[`${base}.lessonname`],
          audioFile: [
            ...existingAudioFiles,
            ...(fileMap[`${base}.audioFile`] || []),
          ],
          videoFile: [
            ...existingVideoFiles,
            ...(fileMap[`${base}.videoFile`] || []),
          ],
          pdfFile: [
            ...existingPdfFiles,
            ...(fileMap[`${base}.pdfFile`] || []),
          ],
        };

        // Log the final lesson data for debugging
        console.log(`📚 Lesson ${lessonIndex} final data:`, {
          lessonname: lessonData.lessonname,
          audioFiles: lessonData.audioFile.map(f => f.name),
          videoFiles: lessonData.videoFile.map(f => f.name),
          pdfFiles: lessonData.pdfFile.map(f => f.name),
        });

        lessons.push(lessonData);
        lessonIndex++;
      }

      updatedChapters.push({ title, lessons });
      chapterIndex++;
    }

    // Step 4: Update course metadata
    existingCourse.coursename =
      fixedBody.coursename || existingCourse.coursename;
    existingCourse.category = fixedBody.category || existingCourse.category;
    existingCourse.courseduration =
      fixedBody.courseduration || existingCourse.courseduration;

    // Handle thumbnail update/removal
    if (fileMap["thumbnail"]?.[0]) {
      existingCourse.thumbnail = fileMap["thumbnail"][0].url;
    } else if (fixedBody.thumbnail === "") {
      // If thumbnail was explicitly set to empty, remove it
      if (existingCourse.thumbnail) {
        await deleteFromS3(existingCourse.thumbnail);
      }
      existingCourse.thumbnail = undefined;
    }

    // Handle preview video update/removal
    if (fileMap["previewvideo"]?.[0]) {
      existingCourse.previewvedio = fileMap["previewvideo"][0].url;
    } else if (fixedBody.previewvedio === "") {
      // If preview video was explicitly set to empty, remove it
      if (existingCourse.previewvedio) {
        await deleteFromS3(existingCourse.previewvedio);
      }
      existingCourse.previewvedio = undefined;
    }

    // Update other fields
    existingCourse.contentduration = {
      hours:
        parseInt(fixedBody["contentduration.hours"]) ||
        existingCourse.contentduration.hours ||
        0,
      minutes:
        parseInt(fixedBody["contentduration.minutes"]) ||
        existingCourse.contentduration.minutes ||
        0,
    };

    existingCourse.level = fixedBody.level || existingCourse.level;
    existingCourse.language = fixedBody.language || existingCourse.language;
    existingCourse.certificates =
      fixedBody.certificates || existingCourse.certificates;

    existingCourse.instructor = {
      name: fixedBody["instructor.name"] || existingCourse.instructor?.name,
      role: fixedBody["instructor.role"] || existingCourse.instructor?.role,
      socialmedia_id:
        fixedBody["instructor.socialmedia_id"] ||
        existingCourse.instructor?.socialmedia_id,
    };

    existingCourse.description =
      fixedBody.description || existingCourse.description;

    if (fixedBody.whatYoullLearn) {
      existingCourse.whatYoullLearn = Array.isArray(fixedBody.whatYoullLearn)
        ? fixedBody.whatYoullLearn
        : fixedBody.whatYoullLearn.split(",").map((item) => item.trim());
    }

    // Update pricing
    const amount =
      parseFloat(fixedBody["price.amount"]) || existingCourse.price.amount;
    const discount =
      parseFloat(fixedBody["price.discount"]) ||
      existingCourse.price.discount ||
      0;

    existingCourse.price = {
      amount,
      currency:
        fixedBody["price.currency"] || existingCourse.price.currency || "INR",
      discount,
      finalPrice: amount * (1 - discount / 100),
    };

    // Update EMI - Handle both JSON object format and FormData format
    console.log("📊 EMI data received:", {
      flatFormat: fixedBody['emi.isAvailable'],
      objectFormat: fixedBody.emi,
      fullBody: Object.keys(fixedBody).filter(k => k.includes('emi'))
    });
    
    // Check if EMI fields are present (either as nested object or flat FormData)
    const hasEmiObject = fixedBody.emi && typeof fixedBody.emi === 'object';
    const hasEmiFlat = 'emi.isAvailable' in fixedBody;
    const emiFieldsPresent = hasEmiObject || hasEmiFlat;
    
    if (emiFieldsPresent) {
      let emiIsAvailable, emiDurationMonths, totalAmount, monthlyAmount, notes;
      
      // Parse based on format
      if (hasEmiObject) {
        // JSON object format: { emi: { isAvailable: true, ... } }
        console.log("🔍 Parsing EMI from JSON object format");
        emiIsAvailable = fixedBody.emi.isAvailable === true || fixedBody.emi.isAvailable === 'true';
        emiDurationMonths = fixedBody.emi.emiDurationMonths ? parseInt(fixedBody.emi.emiDurationMonths) : null;
        totalAmount = fixedBody.emi.totalAmount ? parseFloat(fixedBody.emi.totalAmount) : null;
        monthlyAmount = fixedBody.emi.monthlyAmount ? parseFloat(fixedBody.emi.monthlyAmount) : null;
        notes = fixedBody.emi.notes || '';
      } else {
        // FormData flat format: { 'emi.isAvailable': 'true', ... }
        console.log("🔍 Parsing EMI from FormData flat format");
        emiIsAvailable = fixedBody['emi.isAvailable'] === 'true';
        emiDurationMonths = fixedBody['emi.emiDurationMonths'] ? parseInt(fixedBody['emi.emiDurationMonths']) : null;
        totalAmount = fixedBody['emi.totalAmount'] ? parseFloat(fixedBody['emi.totalAmount']) : null;
        monthlyAmount = fixedBody['emi.monthlyAmount'] ? parseFloat(fixedBody['emi.monthlyAmount']) : null;
        notes = fixedBody['emi.notes'] || '';
      }
      
      console.log("🔍 Parsed EMI values:", { emiIsAvailable, emiDurationMonths, totalAmount, monthlyAmount, notes });
      
      if (emiIsAvailable) {
        // EMI ENABLED - Set values
        existingCourse.emi = {
          isAvailable: true,
          emiDurationMonths,
          totalAmount,
          monthlyAmount: monthlyAmount || (totalAmount && emiDurationMonths ? totalAmount / emiDurationMonths : null),
          notes,
        };
        
        console.log("✅ EMI ENABLED with data:", existingCourse.emi);
      } else {
        // EMI DISABLED - Clear all fields to null
        existingCourse.emi = {
          isAvailable: false,
          emiDurationMonths: null,
          totalAmount: null,
          monthlyAmount: null,
          notes: '',
        };
        
        console.log("❌ EMI DISABLED - all fields cleared to null");
      }
    } else {
      // EMI fields not in request - preserve existing values
      console.log("📊 No EMI update in request - preserving existing values");
    }

    // Validate updated EMI (only if EMI was updated in this request)
    if (emiFieldsPresent && existingCourse.emi.isAvailable === true) {
      if (!existingCourse.emi.emiDurationMonths || !existingCourse.emi.totalAmount) {
        return res.status(400).json({
          error: "If EMI is available, emiDurationMonths and totalAmount are required",
        });
      }
    }

    // Update chapters
    if (updatedChapters.length > 0) {
      existingCourse.chapters = updatedChapters;
    }

    // Save the updated course
    const updatedCourse = await existingCourse.save();
    
    // Fix UTF-8 encoding in response
    const fixedCourse = fixUtf8InObject(updatedCourse.toObject());

    res.status(200).json({
      success: true,
      message: "Course updated successfully",
      course: fixedCourse,
    });
  } catch (error) {
    console.error("❌ Update course error:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// Delete course function (was missing)
export const deleteCourse = async (req, res) => {
  try {
    const { coursename } = req.params;
    const { hard = false } = req.query;

    if (!coursename) {
      return res.status(400).json({
        success: false,
        error: "coursename is required",
      });
    }

    const course = await Course.findOne({ coursename });
    if (!course) {
      return res.status(404).json({
        success: false,
        error: "Course not found",
      });
    }

    if (hard === "true") {
      // Hard delete: Remove from database and clean up S3 files
      const deletePromises = [];

      if (course.thumbnail) deletePromises.push(deleteFromS3(course.thumbnail));
      if (course.previewvedio)
        deletePromises.push(deleteFromS3(course.previewvedio));

      course.chapters.forEach((chapter) => {
        chapter.lessons.forEach((lesson) => {
          lesson.audioFile.forEach((file) =>
            deletePromises.push(deleteFromS3(file.url))
          );
          lesson.videoFile.forEach((file) =>
            deletePromises.push(deleteFromS3(file.url))
          );
          lesson.pdfFile.forEach((file) =>
            deletePromises.push(deleteFromS3(file.url))
          );
        });
      });

      await Promise.allSettled(deletePromises);
      await Course.findByIdAndDelete(course._id);

      res.status(200).json({
        success: true,
        message: "Course permanently deleted successfully",
      });
    } else {
      // Soft delete
      course.isDeleted = true;
      course.deletedAt = new Date();
      await course.save();

      res.status(200).json({
        success: true,
        message: "Course deleted successfully",
      });
    }
  } catch (error) {
    console.error("❌ Delete course error:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// Get courses by category
export const getCoursesByCategory = async (req, res) => {
  try {
    // URL-லிருந்து category பெயரைப் பெறுகிறோம் (e.g., "Yoga", "Siddha Medicine")
    const { categoryName } = req.params;

    if (!categoryName) {
      return res.status(400).json({ error: "Category name is required" });
    }

    // category ஃபீல்டை வைத்து டேட்டாபேஸில் தேடுகிறோம்
    const courses = await Course.find({ category: categoryName });

    if (!courses || courses.length === 0) {
      return res
        .status(404)
        .json({ message: `No courses found for category: ${categoryName}` });
    }

    res.status(200).json({
      success: true,
      count: courses.length,
      data: courses,
    });
  } catch (error) {
    console.error(`❌ Error fetching courses by category: ${error.message}`);
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * Update course with pre-uploaded S3 URLs (lightweight method)
 * Use this when files are uploaded directly to S3 via presigned URLs
 * This bypasses the 10MB API Gateway payload limit
 */
export const updateCourseWithS3Urls = async (req, res) => {
  try {
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    
    const courseName = req.params.coursename;
    const fixedBody = fixUtf8InObject(req.body);
    
    const existingCourse = await Course.findOne({ coursename: courseName });

    if (!existingCourse) {
      return res.status(404).json({ error: "Course not found" });
    }

    // Parse filesToDelete
    let filesToDelete = [];
    try {
      if (fixedBody.filesToDelete) {
        filesToDelete = Array.isArray(fixedBody.filesToDelete) 
          ? fixedBody.filesToDelete 
          : JSON.parse(fixedBody.filesToDelete);
      }
    } catch (error) {
      console.error('❌ Error parsing filesToDelete:', error);
    }

    // Delete requested files from S3
    if (filesToDelete.length > 0) {
      await Promise.all(
        filesToDelete.map(async (file) => {
          try {
            if (file && file.url) {
              await deleteFromS3(file.url);
              console.log('✅ Deleted file from S3:', file.url);
            }
          } catch (error) {
            console.error(`❌ Error deleting file:`, error);
          }
        })
      );
    }

    // Build chapters from pre-uploaded S3 URLs
    const updatedChapters = [];
    let chapterIndex = 0;

    while (fixedBody.chapters && fixedBody.chapters[chapterIndex]) {
      const chapter = fixedBody.chapters[chapterIndex];
      const lessons = [];

      for (const lesson of chapter.lessons || []) {
        // Get existing lesson files
        const existingLesson = existingCourse.chapters[chapterIndex]?.lessons
          .find(l => l.lessonname === lesson.lessonname) || 
          { audioFile: [], videoFile: [], pdfFile: [] };

        // Filter out deleted files
        const existingAudioFiles = (existingLesson.audioFile || [])
          .filter((file) => !filesToDelete.some((f) => f.url === file.url));
        const existingVideoFiles = (existingLesson.videoFile || [])
          .filter((file) => !filesToDelete.some((f) => f.url === file.url));
        const existingPdfFiles = (existingLesson.pdfFile || [])
          .filter((file) => !filesToDelete.some((f) => f.url === file.url));

        // Combine with new S3 URLs
        lessons.push({
          lessonname: lesson.lessonname,
          audioFile: [
            ...existingAudioFiles,
            ...(lesson.audioFile || []),
          ],
          videoFile: [
            ...existingVideoFiles,
            ...(lesson.videoFile || []),
          ],
          pdfFile: [
            ...existingPdfFiles,
            ...(lesson.pdfFile || []),
          ],
        });
      }

      updatedChapters.push({ 
        title: chapter.title, 
        lessons 
      });
      chapterIndex++;
    }

    // Update course metadata
    if (fixedBody.coursename) existingCourse.coursename = fixedBody.coursename;
    if (fixedBody.category) existingCourse.category = fixedBody.category;
    if (fixedBody.courseduration) existingCourse.courseduration = fixedBody.courseduration;
    if (fixedBody.thumbnail) existingCourse.thumbnail = fixedBody.thumbnail;
    if (fixedBody.previewvedio) existingCourse.previewvedio = fixedBody.previewvedio;
    if (fixedBody.description) existingCourse.description = fixedBody.description;
    if (fixedBody.level) existingCourse.level = fixedBody.level;
    if (fixedBody.language) existingCourse.language = fixedBody.language;
    if (fixedBody.certificates) existingCourse.certificates = fixedBody.certificates;

    // Update contentduration
    if (fixedBody.contentduration) {
      existingCourse.contentduration = {
        hours: parseInt(fixedBody.contentduration.hours) || 0,
        minutes: parseInt(fixedBody.contentduration.minutes) || 0,
      };
    }

    // Update instructor
    if (fixedBody.instructor) {
      existingCourse.instructor = {
        name: fixedBody.instructor.name || existingCourse.instructor?.name,
        role: fixedBody.instructor.role || existingCourse.instructor?.role,
        socialmedia_id: fixedBody.instructor.socialmedia_id || existingCourse.instructor?.socialmedia_id,
      };
    }

    // Update whatYoullLearn
    if (fixedBody.whatYoullLearn) {
      existingCourse.whatYoullLearn = Array.isArray(fixedBody.whatYoullLearn)
        ? fixedBody.whatYoullLearn
        : fixedBody.whatYoullLearn.split(",").map((item) => item.trim());
    }

    // Update pricing
    if (fixedBody.price) {
      const amount = parseFloat(fixedBody.price.amount) || existingCourse.price.amount;
      const discount = parseFloat(fixedBody.price.discount) || 0;

      existingCourse.price = {
        amount,
        currency: fixedBody.price.currency || existingCourse.price.currency || "INR",
        discount,
        finalPrice: amount * (1 - discount / 100),
      };
    }

    // Update EMI
    if (fixedBody.emi) {
      const emiIsAvailable = fixedBody.emi.isAvailable === true;
      
      if (emiIsAvailable) {
        // EMI enabled - set values
        const totalAmount = fixedBody.emi.totalAmount ? parseFloat(fixedBody.emi.totalAmount) : null;
        const emiDurationMonths = fixedBody.emi.emiDurationMonths ? parseInt(fixedBody.emi.emiDurationMonths) : null;
        const monthlyAmount = fixedBody.emi.monthlyAmount ? parseFloat(fixedBody.emi.monthlyAmount) : 
                            (totalAmount && emiDurationMonths ? totalAmount / emiDurationMonths : null);
        
        existingCourse.emi = {
          isAvailable: true,
          emiDurationMonths,
          totalAmount,
          monthlyAmount,
          notes: fixedBody.emi.notes || "",
        };
        
        // Validate EMI when enabled
        if (!existingCourse.emi.emiDurationMonths || !existingCourse.emi.totalAmount) {
          return res.status(400).json({
            error: "If EMI is available, emiDurationMonths and totalAmount are required",
          });
        }
      } else {
        // EMI disabled - clear all fields
        existingCourse.emi = {
          isAvailable: false,
          emiDurationMonths: null,
          totalAmount: null,
          monthlyAmount: null,
          notes: "",
        };
      }
    }

    // Update chapters
    if (updatedChapters.length > 0) {
      existingCourse.chapters = updatedChapters;
    }

    // Save
    const updatedCourse = await existingCourse.save();
    const fixedCourse = fixUtf8InObject(updatedCourse.toObject());

    res.status(200).json({
      success: true,
      message: "Course updated successfully",
      course: fixedCourse,
    });
  } catch (error) {
    console.error("❌ Update course error:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// ===== AWS Lambda friendly handler for API Gateway (PUT /course/update/{courseId}) =====
// Provides full CORS, OPTIONS handling, safe JSON parsing, and never throws without response.
const lambdaCorsHeaders = {
  "Access-Control-Allow-Origin": "*", // tighten to allowed domains in production
  "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
  
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Requested-With, Cache-Control",
  "Access-Control-Allow-Credentials": "false",
};

const lambdaResponse = (statusCode, body) => ({
  statusCode,
  headers: lambdaCorsHeaders,
  body: JSON.stringify(body ?? {}),
});

// Safe JSON parser that never throws
const safeParseJson = (text) => {
  try {
    return text ? JSON.parse(text) : {};
  } catch (err) {
    return { __parseError: true };
  }
};

export const lambdaUpdateCourse = async (event) => {
  try {
    // OPTIONS preflight
    if (event.httpMethod === "OPTIONS") {
      return lambdaResponse(200, { ok: true });
    }

    // Enforce method
    if (event.httpMethod !== "PUT") {
      return lambdaResponse(405, { error: "Method Not Allowed" });
    }

    // Path param
    const courseId = event.pathParameters?.courseId;
    if (!courseId) {
      return lambdaResponse(400, { error: "courseId is required" });
    }

    // Parse body safely
    const parsed = safeParseJson(event.body);
    if (parsed.__parseError) {
      return lambdaResponse(400, { error: "Invalid JSON body" });
    }

    // Fetch course
    const course = await Course.findById(courseId);
    if (!course) {
      return lambdaResponse(404, { error: "Course not found" });
    }

    // Apply updates (lightweight: metadata only; assumes files already on S3)
    const payload = parsed;
    if (payload.coursename) course.coursename = payload.coursename;
    if (payload.category) course.category = payload.category;
    if (payload.courseduration) course.courseduration = payload.courseduration;
    if (payload.thumbnail) course.thumbnail = payload.thumbnail;
    if (payload.previewvedio) course.previewvedio = payload.previewvedio;
    if (payload.description) course.description = payload.description;
    if (payload.level) course.level = payload.level;
    if (payload.language) course.language = payload.language;
    if (payload.certificates) course.certificates = payload.certificates;

    if (payload.contentduration) {
      course.contentduration = {
        hours: parseInt(payload.contentduration.hours) || 0,
        minutes: parseInt(payload.contentduration.minutes) || 0,
      };
    }

    if (payload.instructor) {
      course.instructor = {
        name: payload.instructor.name || course.instructor?.name,
        role: payload.instructor.role || course.instructor?.role,
        socialmedia_id: payload.instructor.socialmedia_id || course.instructor?.socialmedia_id,
      };
    }

    if (payload.whatYoullLearn) {
      course.whatYoullLearn = Array.isArray(payload.whatYoullLearn)
        ? payload.whatYoullLearn
        : payload.whatYoullLearn.split(",").map((item) => item.trim());
    }

    if (payload.price) {
      const amount = parseFloat(payload.price.amount) || course.price.amount;
      const discount = parseFloat(payload.price.discount) || 0;
      course.price = {
        amount,
        currency: payload.price.currency || course.price.currency || "INR",
        discount,
        finalPrice: amount * (1 - discount / 100),
      };
    }

    if (payload.emi) {
      course.emi = {
        isAvailable: payload.emi.isAvailable || false,
        emiDurationMonths: payload.emi.emiDurationMonths || null,
        totalAmount: payload.emi.totalAmount || null,
        monthlyAmount: payload.emi.monthlyAmount || null,
        notes: payload.emi.notes || "",
      };

      if (course.emi.isAvailable && (!course.emi.emiDurationMonths || !course.emi.totalAmount)) {
        return lambdaResponse(400, {
          error: "If EMI is available, emiDurationMonths and totalAmount are required",
        });
      }
    }

    // Chapters: overwrite if provided
    if (payload.chapters && Array.isArray(payload.chapters)) {
      course.chapters = payload.chapters;
    }

    // Save and respond
    const saved = await course.save();
    return lambdaResponse(200, {
      success: true,
      message: "Course updated successfully",
      course: fixUtf8InObject(saved.toObject()),
    });
  } catch (err) {
    console.error("❌ Lambda update course error:", err);
    return lambdaResponse(500, { error: "Internal Server Error" });
  }
};
