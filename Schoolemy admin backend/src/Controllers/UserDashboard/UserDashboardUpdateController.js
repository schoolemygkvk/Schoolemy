import TopBannerSection from '../../Models/UserDashboard/TopBannerSectionModel.js';
import HeroSection from '../../Models/UserDashboard/HeroSectionModel.js';
import WhyChooseUsSection from '../../Models/UserDashboard/WhyChooseUsSectionModel.js';
import CoursesSection from '../../Models/UserDashboard/CoursesSectionModel.js';
import CategorySection from '../../Models/UserDashboard/CategorySectionModel.js';
import WhatWeOfferSection from '../../Models/UserDashboard/WhatWeOfferSectionModel.js';
import DemoVideoSection from '../../Models/UserDashboard/DemoVideoSectionModel.js';
import FeedbackSection from '../../Models/UserDashboard/FeedbackSectionModel.js';
import CtaSection from '../../Models/UserDashboard/CtaSectionModel.js';
import fs from 'fs';

// ==================== ADMIN UPDATE OPERATIONS ====================

// Update Top Banner Section
export const updateTopBannerSection = async (req, res) => {
  try {
    let { slides } = req.body;

    // Parse slides if it's a string (from form-data)
    if (typeof slides === 'string') {
      try {
        slides = JSON.parse(slides);
      } catch (e) {
        return res.status(400).json({
          success: false,
          message: 'Invalid slides format'
        });
      }
    }

    if (!slides || !Array.isArray(slides)) {
      return res.status(400).json({
        success: false,
        message: 'Slides array is required'
      });
    }

    // Handle uploaded images - convert to base64 and map to slides based on field names
    // Supports field names like: slide0Image, slide1Image, images[0], images, etc.
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        // Extract index from field name (e.g., "slide0Image" -> 0, "slide1Image" -> 1)
        const fieldName = file.fieldname;
        let index = null;

        // Check for pattern: slide0Image, slide1Image, etc.
        const slideMatch = fieldName.match(/slide(\d+)Image/i);
        if (slideMatch) {
          index = parseInt(slideMatch[1]);
        } else if (fieldName.startsWith('images[') && fieldName.endsWith(']')) {
          // Check for pattern: images[0], images[1], etc.
          const arrayMatch = fieldName.match(/images\[(\d+)\]/);
          if (arrayMatch) {
            index = parseInt(arrayMatch[1]);
          }
        } else if (fieldName === 'images' || fieldName.startsWith('images')) {
          // If field name is just 'images' or starts with 'images', use file order
          // This handles upload.array('images') case
          index = req.files.indexOf(file);
        }

        // Update the slide at the extracted index
        if (index !== null && index >= 0 && index < slides.length) {
          try {
            // Read file and convert to base64
            const fileBuffer = fs.readFileSync(file.path);
            const base64Image = fileBuffer.toString('base64');
            const mimeType = file.mimetype || 'image/jpeg';
            const base64String = `data:${mimeType};base64,${base64Image}`;
            
            // Set bgImage as base64 string
            slides[index].bgImage = base64String;
            
            // Delete the temporary file since we're storing as base64
            fs.unlinkSync(file.path);
          } catch (fileError) {
            console.error(`Error processing file ${file.filename}:`, fileError);
            // Continue with other files even if one fails
          }
        }
      }
    }

    const updatedSection = await TopBannerSection.findOneAndUpdate(
      {},
      { slides },
      { new: true, upsert: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      message: 'Top banner section updated successfully',
      data: updatedSection
    });
  } catch (error) {
    console.error('Error updating top banner section:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating top banner section',
      error: error.message
    });
  }
};

// Update Hero Section
export const updateHeroSection = async (req, res) => {
  try {
    const updateData = { ...req.body };

    // Parse cardTop and cardBottom first if they're strings (from form-data) - ensures proper structure before file processing
    if (updateData.cardTop && typeof updateData.cardTop === 'string') {
      try {
        updateData.cardTop = JSON.parse(updateData.cardTop);
      } catch (e) {
        // If parsing fails, keep as is
      }
    }

    if (updateData.cardBottom && typeof updateData.cardBottom === 'string') {
      try {
        updateData.cardBottom = JSON.parse(updateData.cardBottom);
      } catch (e) {
        // If parsing fails, keep as is
      }
    }

    // Helper to convert file to base64 string for DB storage
    const fileToBase64 = (file) => {
      const fileBuffer = fs.readFileSync(file.path);
      const base64Image = fileBuffer.toString('base64');
      const mimeType = file.mimetype || 'image/jpeg';
      return `data:${mimeType};base64,${base64Image}`;
    };

    // Handle uploaded images - convert to base64 and save in DB
    // Supports field names: mainImage, cardTopImage, cardBottomImage (and variations)
    const processFile = (file) => {
      try {
        const base64String = fileToBase64(file);
        const fieldName = file.fieldname.toLowerCase().replace(/-/g, '_');

        if (fieldName === 'mainimage' || fieldName === 'main_image') {
          updateData.mainImage = base64String;
        } else if (fieldName === 'cardtopimage' || fieldName === 'card_top_image') {
          if (!updateData.cardTop || typeof updateData.cardTop !== 'object') {
            updateData.cardTop = {};
          }
          updateData.cardTop.image = base64String;
        } else if (
          fieldName === 'cardbottomimage' ||
          fieldName === 'card_bottom_image' ||
          fieldName === 'bottomcardimage' ||
          fieldName === 'bottom_card_image'
        ) {
          // Ensure cardBottom exists and has proper structure for base64 image storage
          if (!updateData.cardBottom || typeof updateData.cardBottom !== 'object') {
            updateData.cardBottom = {};
          }
          updateData.cardBottom.image = base64String;
        }

        fs.unlinkSync(file.path);
      } catch (fileError) {
        console.error(`Error processing file ${file.filename}:`, fileError);
      }
    };

    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        processFile(file);
      }
    }

    // Also handle single file upload (req.file) for backward compatibility
    if (req.file) {
      processFile(req.file);
    }

    const updatedSection = await HeroSection.findOneAndUpdate(
      {},
      updateData,
      { new: true, upsert: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      message: 'Hero section updated successfully',
      data: updatedSection
    });
  } catch (error) {
    console.error('Error updating hero section:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating hero section',
      error: error.message
    });
  }
};

// Update Why Choose Us Section
export const updateWhyChooseUsSection = async (req, res) => {
  try {
    const updateData = { ...req.body };

    // Handle uploaded image - convert to base64
    // Supports field name: image
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        try {
          // Read file and convert to base64
          const fileBuffer = fs.readFileSync(file.path);
          const base64Image = fileBuffer.toString('base64');
          const mimeType = file.mimetype || 'image/jpeg';
          const base64String = `data:${mimeType};base64,${base64Image}`;
          
          // Map file to image field based on field name
          const fieldName = file.fieldname.toLowerCase();
          
          if (fieldName === 'image') {
            updateData.image = base64String;
          }
          
          // Delete the temporary file since we're storing as base64
          fs.unlinkSync(file.path);
        } catch (fileError) {
          console.error(`Error processing file ${file.filename}:`, fileError);
          // Continue with other files even if one fails
        }
      }
    }

    // Parse features if it's a string (from form-data)
    if (updateData.features && typeof updateData.features === 'string') {
      try {
        updateData.features = JSON.parse(updateData.features);
      } catch (e) {
        // If parsing fails, keep as is
      }
    }

    const updatedSection = await WhyChooseUsSection.findOneAndUpdate(
      {},
      updateData,
      { new: true, upsert: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      message: 'Why choose us section updated successfully',
      data: updatedSection
    });
  } catch (error) {
    console.error('Error updating why choose us section:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating why choose us section',
      error: error.message
    });
  }
};

// Update Courses Section
export const updateCoursesSection = async (req, res) => {
  try {
    let updateData = { ...req.body };

    // Parse courses if it's a string (from form-data)
    if (updateData.courses && typeof updateData.courses === 'string') {
      try {
        updateData.courses = JSON.parse(updateData.courses);
      } catch (e) {
        return res.status(400).json({
          success: false,
          message: 'Invalid courses format'
        });
      }
    }

    // Handle uploaded images - convert to base64 and map files to courses based on field names
    // Supports field names like: course0Image, course1Image, images[0], images, etc.
    if (req.files && req.files.length > 0 && updateData.courses) {
      for (const file of req.files) {
        try {
          const fieldName = file.fieldname;
          let index = null;

          // Check for pattern: course0Image, course1Image, etc.
          const courseMatch = fieldName.match(/course(\d+)Image/i);
          if (courseMatch) {
            index = parseInt(courseMatch[1]);
          } else if (fieldName.startsWith('images[') && fieldName.endsWith(']')) {
            const arrayMatch = fieldName.match(/images\[(\d+)\]/);
            if (arrayMatch) {
              index = parseInt(arrayMatch[1]);
            }
          } else if (fieldName === 'images' || fieldName.startsWith('images')) {
            index = req.files.indexOf(file);
          }

          if (index !== null && index >= 0 && index < updateData.courses.length) {
            // Read file and convert to base64
            const fileBuffer = fs.readFileSync(file.path);
            const base64Image = fileBuffer.toString('base64');
            const mimeType = file.mimetype || 'image/jpeg';
            const base64String = `data:${mimeType};base64,${base64Image}`;
            
            // Set image as base64 string
            updateData.courses[index].image = base64String;
            
            // Delete the temporary file since we're storing as base64
            fs.unlinkSync(file.path);
          }
        } catch (fileError) {
          console.error(`Error processing file ${file.filename}:`, fileError);
          // Continue with other files even if one fails
        }
      }
    }

    const updatedSection = await CoursesSection.findOneAndUpdate(
      {},
      updateData,
      { new: true, upsert: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      message: 'Courses section updated successfully',
      data: updatedSection
    });
  } catch (error) {
    console.error('Error updating courses section:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating courses section',
      error: error.message
    });
  }
};

// Update Category Section
export const updateCategorySection = async (req, res) => {
  try {
    let updateData = { ...req.body };

    // Get existing document to merge with for partial updates
    const existingSection = await CategorySection.findOne();
    
    // If categories are being updated, merge with existing categories if they exist
    if (updateData.categories) {
      // Parse categories if it's a string (from form-data)
      if (typeof updateData.categories === 'string') {
        try {
          updateData.categories = JSON.parse(updateData.categories);
        } catch (e) {
          return res.status(400).json({
            success: false,
            message: 'Invalid categories format'
          });
        }
      }

      // If existing section has categories, merge them to preserve missing fields
      if (existingSection && existingSection.categories && Array.isArray(existingSection.categories)) {
        updateData.categories = updateData.categories.map((newCategory, index) => {
          const existingCategory = existingSection.categories[index] || {};
          // Merge: new data overrides existing, but keep existing if new doesn't have it
          return {
            title: newCategory.title !== undefined ? newCategory.title : existingCategory.title,
            image: newCategory.image !== undefined ? newCategory.image : existingCategory.image,
            color: newCategory.color !== undefined ? newCategory.color : existingCategory.color,
            bgColor: newCategory.bgColor !== undefined ? newCategory.bgColor : existingCategory.bgColor
          };
        });
      }
    } else if (existingSection && existingSection.categories) {
      // If categories not provided, keep existing categories
      updateData.categories = existingSection.categories;
    }

    // Preserve sectionTitle if not provided
    if (!updateData.sectionTitle && existingSection && existingSection.sectionTitle) {
      updateData.sectionTitle = existingSection.sectionTitle;
    }

    // Handle uploaded images - convert to base64 and map files to categories based on field names
    // Supports field names like: category0Image, category1Image, images[0], images, etc.
    if (req.files && req.files.length > 0 && updateData.categories) {
      for (const file of req.files) {
        try {
          const fieldName = file.fieldname;
          let index = null;

          // Check for pattern: category0Image, category1Image, etc.
          const categoryMatch = fieldName.match(/category(\d+)Image/i);
          if (categoryMatch) {
            index = parseInt(categoryMatch[1]);
          } else if (fieldName.startsWith('images[') && fieldName.endsWith(']')) {
            const arrayMatch = fieldName.match(/images\[(\d+)\]/);
            if (arrayMatch) {
              index = parseInt(arrayMatch[1]);
            }
          } else if (fieldName === 'images' || fieldName.startsWith('images')) {
            index = req.files.indexOf(file);
          }

          if (index !== null && index >= 0 && index < updateData.categories.length) {
            // Read file and convert to base64
            const fileBuffer = fs.readFileSync(file.path);
            const base64Image = fileBuffer.toString('base64');
            const mimeType = file.mimetype || 'image/jpeg';
            const base64String = `data:${mimeType};base64,${base64Image}`;
            
            // Set image as base64 string
            updateData.categories[index].image = base64String;
            
            // Delete the temporary file since we're storing as base64
            fs.unlinkSync(file.path);
          }
        } catch (fileError) {
          console.error(`Error processing file ${file.filename}:`, fileError);
          // Continue with other files even if one fails
        }
      }
    }

    // Validate that all categories have required fields (after merging)
    if (updateData.categories && Array.isArray(updateData.categories)) {
      const missingFields = [];
      updateData.categories.forEach((category, index) => {
        if (!category.title) missingFields.push(`categories[${index}].title`);
        if (!category.image) missingFields.push(`categories[${index}].image`);
        if (!category.color) missingFields.push(`categories[${index}].color`);
        if (!category.bgColor) missingFields.push(`categories[${index}].bgColor`);
      });

      if (missingFields.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed: Missing required fields',
          missingFields: missingFields,
          details: `The following required fields are missing: ${missingFields.join(', ')}`
        });
      }
    }

    // Validate sectionTitle if provided (allow partial updates)
    if (updateData.sectionTitle !== undefined && (updateData.sectionTitle === null || updateData.sectionTitle === '')) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed: sectionTitle cannot be empty if provided'
      });
    }

    const updatedSection = await CategorySection.findOneAndUpdate(
      {},
      updateData,
      { new: true, upsert: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      message: 'Category section updated successfully',
      data: updatedSection
    });
  } catch (error) {
    console.error('Error updating category section:', error);
    
    // Handle Mongoose validation errors
    if (error.name === 'ValidationError') {
      const validationErrors = Object.keys(error.errors || {}).map(key => ({
        field: key,
        message: error.errors[key].message
      }));
      
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validationErrors,
        details: error.message
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Server error while updating category section',
      error: error.message
    });
  }
};

// Update What We Offer Section
export const updateWhatWeOfferSection = async (req, res) => {
  try {
    const updateData = req.body;

    const updatedSection = await WhatWeOfferSection.findOneAndUpdate(
      {},
      updateData,
      { new: true, upsert: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      message: 'What we offer section updated successfully',
      data: updatedSection
    });
  } catch (error) {
    console.error('Error updating what we offer section:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating what we offer section',
      error: error.message
    });
  }
};

// Update Demo Video Section
export const updateDemoVideoSection = async (req, res) => {
  try {
    const updateData = { ...req.body };

    // Get existing document to merge with for partial updates
    const existingSection = await DemoVideoSection.findOne();

    // Parse nested objects if they're strings (from form-data)
    if (updateData.metrics && typeof updateData.metrics === 'string') {
      try {
        updateData.metrics = JSON.parse(updateData.metrics);
      } catch (e) {
        // If parsing fails, keep as is
      }
    }

    if (updateData.review && typeof updateData.review === 'string') {
      try {
        updateData.review = JSON.parse(updateData.review);
      } catch (e) {
        // If parsing fails, keep as is
      }
    }

    // Merge review data with existing review if it exists
    // Review can be null (optional), but if provided, must have image and text
    if (updateData.review !== undefined) {
      if (updateData.review === null) {
        // Explicitly set to null if provided
        updateData.review = null;
      } else if (updateData.review && typeof updateData.review === 'object') {
        if (existingSection && existingSection.review) {
          // Merge: new data overrides existing, but keep existing if new doesn't have it
          updateData.review = {
            image: updateData.review.image !== undefined ? updateData.review.image : existingSection.review.image,
            text: updateData.review.text !== undefined ? updateData.review.text : existingSection.review.text
          };
        }
        // If no existing review, use the provided review object as is
      }
    } else if (existingSection && existingSection.review) {
      // If review not provided in update, keep existing review
      updateData.review = existingSection.review;
    }

    // Preserve other fields if not provided
    if (!updateData.title && existingSection && existingSection.title) {
      updateData.title = existingSection.title;
    }
    if (!updateData.subtitle && existingSection && existingSection.subtitle) {
      updateData.subtitle = existingSection.subtitle;
    }
    if (!updateData.videoUrl && existingSection && existingSection.videoUrl) {
      updateData.videoUrl = existingSection.videoUrl;
    }
    if (!updateData.statsTitle && existingSection && existingSection.statsTitle) {
      updateData.statsTitle = existingSection.statsTitle;
    }
    if (!updateData.buttonText && existingSection && existingSection.buttonText) {
      updateData.buttonText = existingSection.buttonText;
    }
    if (!updateData.buttonLink && existingSection && existingSection.buttonLink) {
      updateData.buttonLink = existingSection.buttonLink;
    }
    if (!updateData.metrics && existingSection && existingSection.metrics) {
      updateData.metrics = existingSection.metrics;
    }
    if (!updateData.videoThumbnail && existingSection && existingSection.videoThumbnail) {
      updateData.videoThumbnail = existingSection.videoThumbnail;
    }

    // Handle uploaded images - convert to base64
    // Supports field names: videoThumbnail, reviewImage, review.image
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        try {
          // Read file and convert to base64
          const fileBuffer = fs.readFileSync(file.path);
          const base64Image = fileBuffer.toString('base64');
          const mimeType = file.mimetype || 'image/jpeg';
          const base64String = `data:${mimeType};base64,${base64Image}`;
          
          // Map file to appropriate field based on field name
          const fieldName = file.fieldname.toLowerCase();
          
          if (fieldName === 'videothumbnail' || fieldName === 'video_thumbnail') {
            updateData.videoThumbnail = base64String;
          } else if (fieldName === 'reviewimage' || fieldName === 'review_image' || fieldName === 'review.image') {
            // Ensure review object exists, merge with existing if available
            if (!updateData.review || typeof updateData.review !== 'object') {
              updateData.review = existingSection && existingSection.review ? { ...existingSection.review } : {};
            }
            updateData.review.image = base64String;
          }
          
          // Delete the temporary file since we're storing as base64
          fs.unlinkSync(file.path);
        } catch (fileError) {
          console.error(`Error processing file ${file.filename}:`, fileError);
          // Continue with other files even if one fails
        }
      }
    }

    // Also handle single file upload (for backward compatibility)
    if (req.file) {
      try {
        const fileBuffer = fs.readFileSync(req.file.path);
        const base64Image = fileBuffer.toString('base64');
        const mimeType = req.file.mimetype || 'image/jpeg';
        const base64String = `data:${mimeType};base64,${base64Image}`;
        
        // Default to videoThumbnail if field name matches
        const fieldName = req.file.fieldname ? req.file.fieldname.toLowerCase() : '';
        if (fieldName === 'videothumbnail' || fieldName === 'video_thumbnail' || !fieldName) {
          updateData.videoThumbnail = base64String;
        } else if (fieldName === 'reviewimage' || fieldName === 'review_image' || fieldName === 'review.image') {
          if (!updateData.review || typeof updateData.review !== 'object') {
            updateData.review = existingSection && existingSection.review ? { ...existingSection.review } : {};
          }
          updateData.review.image = base64String;
        }
        
        // Delete the temporary file since we're storing as base64
        fs.unlinkSync(req.file.path);
      } catch (fileError) {
        console.error(`Error processing file ${req.file.filename}:`, fileError);
      }
    }

    // Validate required fields after merging
    const missingFields = [];
    if (!updateData.title) missingFields.push('title');
    if (!updateData.subtitle) missingFields.push('subtitle');
    if (!updateData.videoThumbnail) missingFields.push('videoThumbnail');
    if (!updateData.videoUrl) missingFields.push('videoUrl');
    if (!updateData.statsTitle) missingFields.push('statsTitle');
    if (!updateData.buttonText) missingFields.push('buttonText');
    
    // Review is optional (can be null), but if provided, it must have both image and text
    if (updateData.review !== null && updateData.review !== undefined) {
      if (typeof updateData.review === 'object' && Object.keys(updateData.review).length > 0) {
        if (!updateData.review.image) missingFields.push('review.image');
        if (!updateData.review.text) missingFields.push('review.text');
      }
    }

    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed: Missing required fields',
        missingFields: missingFields,
        details: `The following required fields are missing: ${missingFields.join(', ')}`
      });
    }

    const updatedSection = await DemoVideoSection.findOneAndUpdate(
      {},
      updateData,
      { new: true, upsert: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      message: 'Demo video section updated successfully',
      data: updatedSection
    });
  } catch (error) {
    console.error('Error updating demo video section:', error);
    
    // Handle Mongoose validation errors
    if (error.name === 'ValidationError') {
      const validationErrors = Object.keys(error.errors || {}).map(key => ({
        field: key,
        message: error.errors[key].message
      }));
      
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validationErrors,
        details: error.message
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Server error while updating demo video section',
      error: error.message
    });
  }
};

// Update Feedback Section
export const updateFeedbackSection = async (req, res) => {
  try {
    let updateData = { ...req.body };

    // Get existing document to merge with for partial updates
    const existingSection = await FeedbackSection.findOne();

    // Parse arrays if they're strings (from form-data)
    if (updateData.stats && typeof updateData.stats === 'string') {
      try {
        updateData.stats = JSON.parse(updateData.stats);
      } catch (e) {
        return res.status(400).json({
          success: false,
          message: 'Invalid stats format'
        });
      }
    }

    if (updateData.testimonials && typeof updateData.testimonials === 'string') {
      try {
        updateData.testimonials = JSON.parse(updateData.testimonials);
      } catch (e) {
        return res.status(400).json({
          success: false,
          message: 'Invalid testimonials format'
        });
      }
    }

    // Merge testimonials with existing testimonials if they exist
    if (updateData.testimonials && Array.isArray(updateData.testimonials)) {
      if (existingSection && existingSection.testimonials && Array.isArray(existingSection.testimonials)) {
        updateData.testimonials = updateData.testimonials.map((newTestimonial, index) => {
          const existingTestimonial = existingSection.testimonials[index] || {};
          // Merge: new data overrides existing, but keep existing if new doesn't have it
          return {
            name: newTestimonial.name !== undefined ? newTestimonial.name : existingTestimonial.name,
            role: newTestimonial.role !== undefined ? newTestimonial.role : existingTestimonial.role,
            avatar: newTestimonial.avatar !== undefined ? newTestimonial.avatar : existingTestimonial.avatar,
            rating: newTestimonial.rating !== undefined ? newTestimonial.rating : existingTestimonial.rating,
            text: newTestimonial.text !== undefined ? newTestimonial.text : existingTestimonial.text
          };
        });
      }
    } else if (existingSection && existingSection.testimonials) {
      // If testimonials not provided, keep existing testimonials
      updateData.testimonials = existingSection.testimonials;
    }

    // Merge stats with existing stats if they exist
    if (updateData.stats && Array.isArray(updateData.stats)) {
      if (existingSection && existingSection.stats && Array.isArray(existingSection.stats)) {
        updateData.stats = updateData.stats.map((newStat, index) => {
          const existingStat = existingSection.stats[index] || {};
          return {
            value: newStat.value !== undefined ? newStat.value : existingStat.value,
            label: newStat.label !== undefined ? newStat.label : existingStat.label
          };
        });
      }
    } else if (existingSection && existingSection.stats) {
      updateData.stats = existingSection.stats;
    }

    // Preserve other fields if not provided
    if (!updateData.badgeText && existingSection && existingSection.badgeText) {
      updateData.badgeText = existingSection.badgeText;
    }
    if (!updateData.title && existingSection && existingSection.title) {
      updateData.title = existingSection.title;
    }
    if (!updateData.subtitle && existingSection && existingSection.subtitle) {
      updateData.subtitle = existingSection.subtitle;
    }

    // Handle uploaded avatar images - convert to base64 and map files to testimonials based on field names
    // Supports field names like: avatar0, avatar1, avatars[0], avatars, testimonial0Avatar, testimonial1Avatar, etc.
    if (req.files && req.files.length > 0 && updateData.testimonials) {
      for (const file of req.files) {
        try {
          const fieldName = file.fieldname;
          let index = null;

          // Check for pattern: testimonial0Avatar, testimonial1Avatar, etc.
          const testimonialAvatarMatch = fieldName.match(/testimonial(\d+)avatar/i);
          if (testimonialAvatarMatch) {
            index = parseInt(testimonialAvatarMatch[1]);
          }
          // Check for pattern: avatar0, avatar1, etc.
          else if (fieldName.match(/avatar(\d+)/i)) {
            const avatarMatch = fieldName.match(/avatar(\d+)/i);
            if (avatarMatch) {
              index = parseInt(avatarMatch[1]);
            }
          } 
          // Check for pattern: avatars[0], avatars[1], etc.
          else if (fieldName.startsWith('avatars[') && fieldName.endsWith(']')) {
            const arrayMatch = fieldName.match(/avatars\[(\d+)\]/);
            if (arrayMatch) {
              index = parseInt(arrayMatch[1]);
            }
          } 
          // Check for generic avatars field
          else if (fieldName === 'avatars' || fieldName.startsWith('avatars')) {
            index = req.files.indexOf(file);
          }

          if (index !== null && index >= 0 && index < updateData.testimonials.length) {
            // Read file and convert to base64
            const fileBuffer = fs.readFileSync(file.path);
            const base64Image = fileBuffer.toString('base64');
            const mimeType = file.mimetype || 'image/jpeg';
            const base64String = `data:${mimeType};base64,${base64Image}`;
            
            // Set avatar as base64 string
            updateData.testimonials[index].avatar = base64String;
            
            // Delete the temporary file since we're storing as base64
            fs.unlinkSync(file.path);
          }
        } catch (fileError) {
          console.error(`Error processing file ${file.filename}:`, fileError);
          // Continue with other files even if one fails
        }
      }
    }

    // Clean up any avatar fields that contain field names instead of base64 strings
    // This handles cases where the frontend sends the field name as the avatar value
    if (updateData.testimonials && Array.isArray(updateData.testimonials)) {
      updateData.testimonials.forEach((testimonial, index) => {
        if (testimonial.avatar && typeof testimonial.avatar === 'string') {
          // Check if avatar contains a field name pattern (like "testimonial0Avatar", "avatar0", etc.)
          const isFieldNamePattern = /^(testimonial\d+avatar|avatar\d+|avatars?)$/i.test(testimonial.avatar);
          if (isFieldNamePattern) {
            // If it's a field name pattern and no file was uploaded for this index, keep existing avatar
            if (existingSection && existingSection.testimonials && existingSection.testimonials[index]) {
              testimonial.avatar = existingSection.testimonials[index].avatar;
            } else {
              // If no existing avatar, remove the field name pattern (will be caught by validation)
              testimonial.avatar = undefined;
            }
          }
        }
      });
    }

    // Validate required fields after merging
    const missingFields = [];
    if (!updateData.badgeText) missingFields.push('badgeText');
    if (!updateData.title) missingFields.push('title');
    if (!updateData.subtitle) missingFields.push('subtitle');
    
    if (updateData.stats && Array.isArray(updateData.stats)) {
      updateData.stats.forEach((stat, index) => {
        if (!stat.value) missingFields.push(`stats[${index}].value`);
        if (!stat.label) missingFields.push(`stats[${index}].label`);
      });
    }

    if (updateData.testimonials && Array.isArray(updateData.testimonials)) {
      updateData.testimonials.forEach((testimonial, index) => {
        if (!testimonial.name) missingFields.push(`testimonials[${index}].name`);
        if (!testimonial.role) missingFields.push(`testimonials[${index}].role`);
        if (!testimonial.avatar) missingFields.push(`testimonials[${index}].avatar`);
        if (testimonial.rating === undefined || testimonial.rating === null) missingFields.push(`testimonials[${index}].rating`);
        if (!testimonial.text) missingFields.push(`testimonials[${index}].text`);
      });
    }

    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed: Missing required fields',
        missingFields: missingFields,
        details: `The following required fields are missing: ${missingFields.join(', ')}`
      });
    }

    const updatedSection = await FeedbackSection.findOneAndUpdate(
      {},
      updateData,
      { new: true, upsert: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      message: 'Feedback section updated successfully',
      data: updatedSection
    });
  } catch (error) {
    console.error('Error updating feedback section:', error);
    
    // Handle Mongoose validation errors
    if (error.name === 'ValidationError') {
      const validationErrors = Object.keys(error.errors || {}).map(key => ({
        field: key,
        message: error.errors[key].message
      }));
      
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validationErrors,
        details: error.message
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Server error while updating feedback section',
      error: error.message
    });
  }
};

// Update CTA Section
export const updateCtaSection = async (req, res) => {
  try {
    const updateData = req.body;

    const updatedSection = await CtaSection.findOneAndUpdate(
      {},
      updateData,
      { new: true, upsert: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      message: 'CTA section updated successfully',
      data: updatedSection
    });
  } catch (error) {
    console.error('Error updating CTA section:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating CTA section',
      error: error.message
    });
  }
};
