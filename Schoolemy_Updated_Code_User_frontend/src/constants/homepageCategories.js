/**
 * Shared homepage category carousel data — keeps Header Explore and CategoriesSection in sync.
 */
export const categoryBrowsePath = (name) =>
  `/courses/category/${encodeURIComponent(name)}`;

export const DEFAULT_HOMEPAGE_CATEGORIES = [
  { title: "Technology", image: "/Tech.jpg", bgColor: "#b6e0d1" },
  { title: "Business", image: "/business.jpg", bgColor: "#F8F4D5" },
  { title: "Academic", image: "/y22.jpg", bgColor: "#E6F6F0" },
  { title: "Creative Arts", image: "/y25.jpg", bgColor: "#a3c7d1" },
  { title: "Personal Development", image: "/yoga1.jpeg", bgColor: "#d28181ff" },
  { title: "Career Development", image: "/yoga2.jpg", bgColor: "#b1d4dcff" },
  { title: "Language Learning", image: "/yoga3.jpeg", bgColor: "#d6a2d4ff" },
  { title: "Health and Wellness", image: "/yoga4.jpg", bgColor: "#cfdca6ff" },
];

export const toExploreLinks = (categories) =>
  categories.map((c) => ({
    label: c.title,
    path: categoryBrowsePath(c.title),
  }));
