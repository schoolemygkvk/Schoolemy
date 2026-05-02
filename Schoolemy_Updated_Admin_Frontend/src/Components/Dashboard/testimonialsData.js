// Testimonials data for "What Our Students Say" section
// This file contains 20 testimonials that will be randomly displayed

export const testimonialsData = [
  {
    quote:
      "Schoolemy transformed my understanding of Ayurveda. The courses are comprehensive and authentic.",
    author: "Dr. Ananya Patel, Medical Practitioner",
    rating: "5.0",
  },
  {
    quote:
      "The Siddha medicine course gave me practical knowledge I use daily in my practice.",
    author: "Vaidya Karthik, Traditional Healer",
    rating: "4.5",
  },
  {
    quote:
      "As a yoga teacher, the advanced certifications elevated my skills and credibility.",
    author: "Yogini Meera, Yoga Instructor",
    rating: "5.0",
  },
  {
    quote:
      "The integration of technology with traditional knowledge is revolutionary.",
    author: "Prof. Rajiv Menon, Educationist",
    rating: "5.0",
  },
  {
    quote:
      "I've completed multiple courses on Schoolemy and each one exceeded my expectations. The instructors are world-class.",
    author: "Dr. Priya Sharma, Wellness Consultant",
    rating: "5.0",
  },
  {
    quote:
      "The Panchakarma therapy course changed my entire approach to holistic healing. Highly recommended!",
    author: "Therapist Ramesh Kumar, Ayurvedic Practitioner",
    rating: "4.8",
  },
  {
    quote:
      "Schoolemy's meditation courses helped me find inner peace and improved my teaching methods significantly.",
    author: "Guru Lakshmi, Meditation Teacher",
    rating: "5.0",
  },
  {
    quote:
      "The herbal medicine course provided deep insights into traditional remedies. Excellent content and delivery.",
    author: "Dr. Suresh Nair, Naturopath",
    rating: "4.7",
  },
  {
    quote:
      "As a beginner, I found the courses well-structured and easy to follow. The support team is always helpful.",
    author: "Anita Desai, Yoga Enthusiast",
    rating: "4.9",
  },
  {
    quote:
      "The certification I received from Schoolemy opened new career opportunities for me. Thank you!",
    author: "Kavita Reddy, Wellness Coach",
    rating: "5.0",
  },
  {
    quote:
      "The Siddha nutrition course taught me how to integrate traditional dietary practices into modern life.",
    author: "Nutritionist Deepa Iyer",
    rating: "4.6",
  },
  {
    quote:
      "I've been practicing yoga for years, but Schoolemy's advanced courses took my practice to the next level.",
    author: "Master Yogi Arjun Singh",
    rating: "5.0",
  },
  {
    quote:
      "The Ayurvedic beauty treatments course is fantastic! I now offer these services in my spa.",
    author: "Beauty Therapist Neha Kapoor",
    rating: "4.8",
  },
  {
    quote:
      "Schoolemy's approach to teaching ancient wisdom through modern technology is brilliant and effective.",
    author: "Dr. Vikram Malhotra, Alternative Medicine Doctor",
    rating: "5.0",
  },
  {
    quote:
      "The Kundalini yoga course was life-changing. The instructors are knowledgeable and supportive.",
    author: "Yoga Practitioner Sunita Rao",
    rating: "4.9",
  },
  {
    quote:
      "I completed the teacher training program and now run my own successful yoga studio. Grateful to Schoolemy!",
    author: "Studio Owner Manoj Verma",
    rating: "5.0",
  },
  {
    quote:
      "The corporate wellness program helped me design effective wellness initiatives for my company.",
    author: "HR Manager Radhika Joshi",
    rating: "4.7",
  },
  {
    quote:
      "Schoolemy's courses are authentic, well-researched, and taught by genuine experts. Worth every penny!",
    author: "Dr. Amitabh Das, Holistic Health Practitioner",
    rating: "5.0",
  },
  {
    quote:
      "The prenatal yoga course was exactly what I needed during my pregnancy. Safe, effective, and empowering.",
    author: "New Mother Shalini Menon",
    rating: "4.9",
  },
  {
    quote:
      "I've recommended Schoolemy to all my colleagues. The quality of education here is unmatched.",
    author: "Dr. Rohit Agarwal, Integrative Medicine Specialist",
    rating: "5.0",
  },
];

// Function to get random testimonials
export const getRandomTestimonials = (count = 4) => {
  const shuffled = [...testimonialsData].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
};
