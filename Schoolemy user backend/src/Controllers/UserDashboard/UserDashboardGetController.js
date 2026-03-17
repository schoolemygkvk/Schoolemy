import TopBannerSection from '../../Models/UserDashboard/TopBannerSectionModel.js';
import HeroSection from '../../Models/UserDashboard/HeroSectionModel.js';
import WhyChooseUsSection from '../../Models/UserDashboard/WhyChooseUsSectionModel.js';
import CoursesSection from '../../Models/UserDashboard/CoursesSectionModel.js';
import CategorySection from '../../Models/UserDashboard/CategorySectionModel.js';
import WhatWeOfferSection from '../../Models/UserDashboard/WhatWeOfferSectionModel.js';
import DemoVideoSection from '../../Models/UserDashboard/DemoVideoSectionModel.js';
import FeedbackSection from '../../Models/UserDashboard/FeedbackSectionModel.js';
import CtaSection from '../../Models/UserDashboard/CtaSectionModel.js';

// ==================== GET OPERATIONS ====================

// Get Top Banner Section
export const getTopBannerSection = async (req, res) => {
  try {
    const section = await TopBannerSection.findOne();
    if (!section) {
      return res.status(200).json({
        success: true,
        data: { slides: [] }
      });
    }
    res.status(200).json({
      success: true,
      data: section
    });
  } catch (error) {
    console.error('Error fetching top banner section:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching top banner section',
      error: error.message
    });
  }
};

// Get Hero Section
export const getHeroSection = async (req, res) => {
  try {
    const section = await HeroSection.findOne();
    res.status(200).json({
      success: true,
      data: section
    });
  } catch (error) {
    console.error('Error fetching hero section:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching hero section',
      error: error.message
    });
  }
};

// Get Why Choose Us Section
export const getWhyChooseUsSection = async (req, res) => {
  try {
    const section = await WhyChooseUsSection.findOne();
    res.status(200).json({
      success: true,
      data: section
    });
  } catch (error) {
    console.error('Error fetching why choose us section:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching why choose us section',
      error: error.message
    });
  }
};

// Get Courses Section
export const getCoursesSection = async (req, res) => {
  try {
    const section = await CoursesSection.findOne();
    res.status(200).json({
      success: true,
      data: section
    });
  } catch (error) {
    console.error('Error fetching courses section:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching courses section',
      error: error.message
    });
  }
};

// Get Category Section
export const getCategorySection = async (req, res) => {
  try {
    const section = await CategorySection.findOne();
    res.status(200).json({
      success: true,
      data: section
    });
  } catch (error) {
    console.error('Error fetching category section:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching category section',
      error: error.message
    });
  }
};

// Get What We Offer Section
export const getWhatWeOfferSection = async (req, res) => {
  try {
    const section = await WhatWeOfferSection.findOne();
    res.status(200).json({
      success: true,
      data: section
    });
  } catch (error) {
    console.error('Error fetching what we offer section:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching what we offer section',
      error: error.message
    });
  }
};

// Get Demo Video Section
export const getDemoVideoSection = async (req, res) => {
  try {
    const section = await DemoVideoSection.findOne();
    res.status(200).json({
      success: true,
      data: section
    });
  } catch (error) {
    console.error('Error fetching demo video section:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching demo video section',
      error: error.message
    });
  }
};

// Get Feedback Section
export const getFeedbackSection = async (req, res) => {
  try {
    const section = await FeedbackSection.findOne();
    res.status(200).json({
      success: true,
      data: section
    });
  } catch (error) {
    console.error('Error fetching feedback section:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching feedback section',
      error: error.message
    });
  }
};

// Get CTA Section
export const getCtaSection = async (req, res) => {
  try {
    const section = await CtaSection.findOne();
    res.status(200).json({
      success: true,
      data: section
    });
  } catch (error) {
    console.error('Error fetching CTA section:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching CTA section',
      error: error.message
    });
  }
};
