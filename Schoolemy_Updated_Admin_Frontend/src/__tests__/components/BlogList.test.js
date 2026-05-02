import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { BrowserRouter } from 'react-router-dom';
import BlogList from '../../Components/Pages/Blog/BlogList';

const routerFuture = { v7_startTransition: true, v7_relativeSplatPath: true };

// Mock dependencies
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: jest.fn(),
}));

jest.mock('../../Utils/blogApi.js', () => ({
  getPublishedBlogs: jest.fn(),
  getImageUrl: jest.fn((imagePath) => `https://example.com/${imagePath}`),
}));

// Import mocked modules
import { useNavigate } from 'react-router-dom';
import { getPublishedBlogs, getImageUrl } from '../../Utils/blogApi.js';

const mockNavigate = jest.fn();

const mockBlogs = [
  {
    _id: '1',
    title: 'Getting Started with React',
    excerpt: 'Learn the basics of React development',
    author: 'John Doe',
    createdAt: '2024-01-15',
    image: 'blog1.jpg',
    tags: ['React', 'Tutorial'],
  },
  {
    _id: '2',
    title: 'Advanced JavaScript Tips',
    excerpt: 'Master JavaScript with these pro tips',
    author: 'Jane Smith',
    createdAt: '2024-01-10',
    image: 'blog2.jpg',
    tags: ['JavaScript', 'Tips'],
  },
  {
    _id: '3',
    title: 'Web Performance Optimization',
    excerpt: 'Make your website faster and more efficient',
    author: 'Bob Johnson',
    createdAt: '2024-01-05',
    image: 'blog3.jpg',
    tags: ['Performance', 'Web'],
  },
];

describe('BlogList Component', () => {
  beforeAll(() => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });
  afterAll(() => {
    console.error.mockRestore();
  });

  beforeEach(() => {
    jest.clearAllMocks();
    useNavigate.mockReturnValue(mockNavigate);
    getPublishedBlogs.mockReset();
    getPublishedBlogs.mockResolvedValue({ data: mockBlogs });
  });

  describe('Loading and Rendering', () => {
    it('displays loading state initially', async () => {
      getPublishedBlogs.mockImplementation(() => new Promise(() => {})); // Never resolves

      render(
        <BrowserRouter future={routerFuture}>
          <BlogList />
        </BrowserRouter>
      );

      expect(screen.getByText('Loading blogs...')).toBeInTheDocument();
    });

    it('renders blog grid after successful fetch', async () => {
      render(
        <BrowserRouter future={routerFuture}>
          <BlogList />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Getting Started with React')).toBeInTheDocument();
        expect(screen.getByText('Advanced JavaScript Tips')).toBeInTheDocument();
        expect(screen.getByText('Web Performance Optimization')).toBeInTheDocument();
      });
    });

    it('renders hero section with title and subtitle', async () => {
      render(
        <BrowserRouter future={routerFuture}>
          <BlogList />
        </BrowserRouter>
      );

      expect(screen.getByText('Our Blog')).toBeInTheDocument();
      expect(screen.getByText('Discover insights, tutorials, and updates')).toBeInTheDocument();
    });

    it('renders search input', async () => {
      render(
        <BrowserRouter future={routerFuture}>
          <BlogList />
        </BrowserRouter>
      );

      expect(screen.getByPlaceholderText('Search blogs...')).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('displays error message on fetch failure', async () => {
      const errorMessage = 'Failed to fetch blogs';
      getPublishedBlogs.mockRejectedValue(new Error(errorMessage));

      render(
        <BrowserRouter future={routerFuture}>
          <BlogList />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByText(errorMessage)).toBeInTheDocument();
      });
    });

    it('displays retry button on error', async () => {
      getPublishedBlogs.mockRejectedValue(new Error('Network error'));

      render(
        <BrowserRouter future={routerFuture}>
          <BlogList />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Retry')).toBeInTheDocument();
      });
    });

    it('refetches blogs when retry button is clicked', async () => {
      getPublishedBlogs.mockRejectedValueOnce(new Error('Network error'));
      getPublishedBlogs.mockResolvedValueOnce({ data: mockBlogs });

      render(
        <BrowserRouter future={routerFuture}>
          <BlogList />
        </BrowserRouter>
      );

      const retryButton = await screen.findByText('Retry');
      fireEvent.click(retryButton);

      await waitFor(() => {
        expect(screen.getByText('Getting Started with React')).toBeInTheDocument();
      });
    });

    it('clears error message after successful retry', async () => {
      getPublishedBlogs.mockRejectedValueOnce(new Error('Network error'));
      getPublishedBlogs.mockResolvedValueOnce({ data: mockBlogs });

      const { rerender } = render(
        <BrowserRouter future={routerFuture}>
          <BlogList />
        </BrowserRouter>
      );

      const retryButton = await screen.findByText('Retry');
      fireEvent.click(retryButton);

      await waitFor(() => {
        expect(screen.queryByText('Network error')).not.toBeInTheDocument();
      });
    });
  });

  describe('Empty State', () => {
    it('displays empty state when no blogs are available', async () => {
      getPublishedBlogs.mockResolvedValue({ data: [] });

      render(
        <BrowserRouter future={routerFuture}>
          <BlogList />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('No blogs found')).toBeInTheDocument();
        expect(screen.getByText('Check back soon for new content!')).toBeInTheDocument();
      });
    });

    it('displays custom empty state message when filters are applied', async () => {
      getPublishedBlogs.mockResolvedValue({ data: mockBlogs });

      render(
        <BrowserRouter future={routerFuture}>
          <BlogList />
        </BrowserRouter>
      );

      const searchInput = screen.getByPlaceholderText('Search blogs...');
      await userEvent.type(searchInput, 'nonexistent blog');

      await waitFor(() => {
        expect(screen.getByText('Try adjusting your filters')).toBeInTheDocument();
      });
    });
  });

  describe('Blog Cards', () => {
    it('renders blog cards with correct information', async () => {
      render(
        <BrowserRouter future={routerFuture}>
          <BlogList />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Getting Started with React')).toBeInTheDocument();
        expect(screen.getByText('Learn the basics of React development')).toBeInTheDocument();
        expect(screen.getByText('By John Doe')).toBeInTheDocument();
      });
    });

    it('renders blog images with correct src', async () => {
      render(
        <BrowserRouter future={routerFuture}>
          <BlogList />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(getImageUrl).toHaveBeenCalledWith('blog1.jpg');
      });
    });

    it('renders blog tags', async () => {
      render(
        <BrowserRouter future={routerFuture}>
          <BlogList />
        </BrowserRouter>
      );

      await waitFor(() => {
        const post = screen.getByRole('heading', { level: 2, name: 'Getting Started with React' }).closest('article');
        expect(post).toBeTruthy();
        expect(within(post).getByText('React')).toBeInTheDocument();
        expect(within(post).getByText('Tutorial')).toBeInTheDocument();
      });
      const post2 = screen.getByRole('heading', { level: 2, name: 'Advanced JavaScript Tips' }).closest('article');
      expect(within(post2).getByText('JavaScript')).toBeInTheDocument();
    });

    it('formats dates correctly', async () => {
      render(
        <BrowserRouter future={routerFuture}>
          <BlogList />
        </BrowserRouter>
      );

      await waitFor(() => {
        // Date format: "January 15, 2024"
        const dateElements = screen.getAllByText(/January|December|November|October|September|August|July|June|May|April|March|February/);
        expect(dateElements.length).toBeGreaterThan(0);
      });
    });

    it('renders "Read More" button on each card', async () => {
      render(
        <BrowserRouter future={routerFuture}>
          <BlogList />
        </BrowserRouter>
      );

      await waitFor(() => {
        const readMoreButtons = screen.getAllByText(/Read More/i);
        expect(readMoreButtons.length).toBeGreaterThanOrEqual(mockBlogs.length);
      });
    });

    it('navigates to blog detail when card is clicked', async () => {
      render(
        <BrowserRouter future={routerFuture}>
          <BlogList />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByRole('heading', { level: 2, name: 'Getting Started with React' })).toBeInTheDocument();
      });
      const blogCard = screen.getByRole('heading', { level: 2, name: 'Getting Started with React' }).closest('article');
      fireEvent.click(blogCard);

      expect(mockNavigate).toHaveBeenCalledWith('/blogs/1');
    });

    it('navigates to blog detail when Read More button is clicked', async () => {
      render(
        <BrowserRouter future={routerFuture}>
          <BlogList />
        </BrowserRouter>
      );

      await waitFor(() => {
        const firstReadMoreButton = screen.getAllByText(/Read More/i)[0];
        fireEvent.click(firstReadMoreButton);
      });

      expect(mockNavigate).toHaveBeenCalledWith('/blogs/1');
    });
  });

  describe('Tag Filtering', () => {
    it('extracts and displays unique tags', async () => {
      render(
        <BrowserRouter future={routerFuture}>
          <BlogList />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'All' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'React' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Tutorial' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'JavaScript' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Tips' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Performance' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Web' })).toBeInTheDocument();
      });
    });

    it('filters blogs by selected tag', async () => {
      render(
        <BrowserRouter future={routerFuture}>
          <BlogList />
        </BrowserRouter>
      );

      const reactTagButton = await screen.findByRole('button', { name: 'React' });
      await userEvent.click(reactTagButton);

      await waitFor(() => {
        expect(screen.getByText('Getting Started with React')).toBeInTheDocument();
        expect(screen.queryByText('Advanced JavaScript Tips')).not.toBeInTheDocument();
      });
    });

    it('shows all blogs when "All" tag is clicked', async () => {
      render(
        <BrowserRouter future={routerFuture}>
          <BlogList />
        </BrowserRouter>
      );

      const reactTagButton = await screen.findByRole('button', { name: 'React' });
      await userEvent.click(reactTagButton);

      await userEvent.click(screen.getByRole('button', { name: 'All' }));

      await waitFor(() => {
        expect(screen.getByText('Getting Started with React')).toBeInTheDocument();
        expect(screen.getByText('Advanced JavaScript Tips')).toBeInTheDocument();
        expect(screen.getByText('Web Performance Optimization')).toBeInTheDocument();
      });
    });

    it('does not render tag filter when no blogs have tags', async () => {
      getPublishedBlogs.mockResolvedValue({
        data: [
          { _id: '1', title: 'Blog', excerpt: 'Excerpt', author: 'Author', createdAt: '2024-01-01' },
        ],
      });

      render(
        <BrowserRouter future={routerFuture}>
          <BlogList />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.queryByText('All')).not.toBeInTheDocument();
      });
    });
  });

  describe('Search Functionality', () => {
    it('filters blogs by title search', async () => {
      render(
        <BrowserRouter future={routerFuture}>
          <BlogList />
        </BrowserRouter>
      );

      const searchInput = await screen.findByPlaceholderText('Search blogs...');
      await userEvent.type(searchInput, 'React');

      await waitFor(() => {
        expect(screen.getByText('Getting Started with React')).toBeInTheDocument();
        expect(screen.queryByText('Advanced JavaScript Tips')).not.toBeInTheDocument();
      });
    });

    it('filters blogs by excerpt search', async () => {
      render(
        <BrowserRouter future={routerFuture}>
          <BlogList />
        </BrowserRouter>
      );

      const searchInput = await screen.findByPlaceholderText('Search blogs...');
      await userEvent.type(searchInput, 'pro tips');

      await waitFor(() => {
        expect(screen.getByText('Advanced JavaScript Tips')).toBeInTheDocument();
        expect(screen.queryByText('Getting Started with React')).not.toBeInTheDocument();
      });
    });

    it('is case-insensitive', async () => {
      render(
        <BrowserRouter future={routerFuture}>
          <BlogList />
        </BrowserRouter>
      );

      const searchInput = await screen.findByPlaceholderText('Search blogs...');
      await userEvent.type(searchInput, 'REACT');

      await waitFor(() => {
        expect(screen.getByText('Getting Started with React')).toBeInTheDocument();
      });
    });

    it('clears filter when search input is cleared', async () => {
      render(
        <BrowserRouter future={routerFuture}>
          <BlogList />
        </BrowserRouter>
      );

      const searchInput = await screen.findByPlaceholderText('Search blogs...');
      await userEvent.type(searchInput, 'React');

      await waitFor(() => {
        expect(screen.getByText('Getting Started with React')).toBeInTheDocument();
      });

      await userEvent.clear(searchInput);

      await waitFor(() => {
        expect(screen.getByText('Advanced JavaScript Tips')).toBeInTheDocument();
      });
    });
  });

  describe('Combined Filtering', () => {
    it('filters by both search and tag', async () => {
      render(
        <BrowserRouter future={routerFuture}>
          <BlogList />
        </BrowserRouter>
      );

      const searchInput = await screen.findByPlaceholderText('Search blogs...');
      await userEvent.type(searchInput, 'tips');

      const javascriptTagButton = await screen.findByRole('button', { name: 'JavaScript' });
      await userEvent.click(javascriptTagButton);

      await waitFor(() => {
        expect(screen.getByText('Advanced JavaScript Tips')).toBeInTheDocument();
        expect(screen.queryByText('Getting Started with React')).not.toBeInTheDocument();
      });
    });
  });

  describe('Results Information', () => {
    it('displays results count when blogs are shown', async () => {
      render(
        <BrowserRouter future={routerFuture}>
          <BlogList />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByText(`Showing ${mockBlogs.length} of ${mockBlogs.length} blogs`)).toBeInTheDocument();
      });
    });

    it('updates results count when filters are applied', async () => {
      render(
        <BrowserRouter future={routerFuture}>
          <BlogList />
        </BrowserRouter>
      );

      const searchInput = await screen.findByPlaceholderText('Search blogs...');
      await userEvent.type(searchInput, 'React');

      await waitFor(() => {
        expect(screen.getByText('Showing 1 of 3 blogs')).toBeInTheDocument();
      });
    });

    it('does not show results info when no blogs match filters', async () => {
      render(
        <BrowserRouter future={routerFuture}>
          <BlogList />
        </BrowserRouter>
      );

      const searchInput = await screen.findByPlaceholderText('Search blogs...');
      await userEvent.type(searchInput, 'nonexistent');

      await waitFor(() => {
        expect(screen.queryByText(/Showing/)).not.toBeInTheDocument();
      });
    });
  });

  describe('Hover Effects', () => {
    it('applies hover state when mouse enters card', async () => {
      render(
        <BrowserRouter future={routerFuture}>
          <BlogList />
        </BrowserRouter>
      );

      const heading = await screen.findByRole('heading', { level: 2, name: 'Getting Started with React' });
      const card = heading.closest('article');
      fireEvent.mouseEnter(card);

      // The component applies transform on hover
      expect(card).toHaveStyle('transform: translateY(-4px)');
    });

    it('removes hover state when mouse leaves card', async () => {
      render(
        <BrowserRouter future={routerFuture}>
          <BlogList />
        </BrowserRouter>
      );

      const heading = await screen.findByRole('heading', { level: 2, name: 'Getting Started with React' });
      const card = heading.closest('article');
      fireEvent.mouseEnter(card);
      fireEvent.mouseLeave(card);

      // Hover styles should be removed
      expect(card).not.toHaveStyle('transform: translateY(-4px)');
    });
  });

  describe('Blogs with Missing Fields', () => {
    it('handles blogs without images', async () => {
      const blogsWithoutImage = [
        { _id: '1', title: 'No Image Blog', excerpt: 'Excerpt', author: 'Author', createdAt: '2024-01-01', tags: ['React'] },
      ];
      getPublishedBlogs.mockResolvedValue({ data: blogsWithoutImage });

      render(
        <BrowserRouter future={routerFuture}>
          <BlogList />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('No Image Blog')).toBeInTheDocument();
      });
    });

    it('handles blogs without tags', async () => {
      const blogsWithoutTags = [
        { _id: '1', title: 'No Tags Blog', excerpt: 'Excerpt', author: 'Author', createdAt: '2024-01-01' },
      ];
      getPublishedBlogs.mockResolvedValue({ data: blogsWithoutTags });

      render(
        <BrowserRouter future={routerFuture}>
          <BlogList />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('No Tags Blog')).toBeInTheDocument();
      });
    });
  });
});
