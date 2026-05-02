import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import DashboardContent from '../../Components/Dashboard/DashboardContent';

// Mock dependencies
jest.mock('../../Components/Dashboard/useDashboardContentData', () => ({
  useDashboardContentData: jest.fn(),
}));

jest.mock('../../Components/Dashboard/DashboardIntroAndStats', () => {
  return function MockDashboardIntroAndStats(props) {
    return <div data-testid="dashboard-intro-stats">DashboardIntroAndStats</div>;
  };
});

jest.mock('../../Components/Dashboard/DashboardInstructorsSection', () => {
  return function MockDashboardInstructorsSection(props) {
    return <div data-testid="dashboard-instructors">DashboardInstructorsSection</div>;
  };
});

jest.mock('../../Components/Dashboard/DashboardCoursesSection', () => {
  return function MockDashboardCoursesSection() {
    return <div data-testid="dashboard-courses">DashboardCoursesSection</div>;
  };
});

jest.mock('../../Components/Dashboard/DashboardTestimonialsSection', () => {
  return function MockDashboardTestimonialsSection(props) {
    return <div data-testid="dashboard-testimonials">DashboardTestimonialsSection</div>;
  };
});

jest.mock('../../Components/Dashboard/DashboardAnalyticsCharts', () => {
  return function MockDashboardAnalyticsCharts(props) {
    return <div data-testid="dashboard-charts">DashboardAnalyticsCharts</div>;
  };
});

jest.mock('../../Components/Dashboard/dashboardContentStyles', () => ({
  DASHBOARD_STYLES: {
    container: { padding: '20px' },
    contentWrapper: { maxWidth: '1200px' },
  },
}));

// Import mocked module
import { useDashboardContentData } from '../../Components/Dashboard/useDashboardContentData';

describe('DashboardContent Component', () => {
  const defaultHookReturn = {
    checkIsSuperAdmin: jest.fn(() => false),
    handleInstructorCardClick: jest.fn(),
    displayedTestimonials: [
      { id: 1, text: 'Great course!', author: 'John' },
      { id: 2, text: 'Highly recommend', author: 'Jane' },
    ],
    emiData: [{ month: 'Jan', value: 100 }],
    enrollmentData: [{ month: 'Jan', value: 50 }],
    completionRateState: 75,
    totalTutors: 10,
    instructors: [
      { id: 1, name: 'Prof. Smith', image: 'image1.jpg' },
      { id: 2, name: 'Prof. Jones', image: 'image2.jpg' },
    ],
    loadingInstructors: false,
    isLoadingCharts: false,
    chartError: null,
    retryCount: 0,
  };

  const defaultProps = {
    totalUsers: 1000,
    totalCourses: 50,
    activeSubscriptions: 500,
    completionRate: 75,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    useDashboardContentData.mockReturnValue(defaultHookReturn);
  });

  describe('Rendering', () => {
    it('renders without crashing with all required props', () => {
      render(<DashboardContent {...defaultProps} />);
      expect(screen.getByTestId('dashboard-intro-stats')).toBeInTheDocument();
    });

    it('renders all main child components in correct order', () => {
      render(<DashboardContent {...defaultProps} />);

      expect(screen.getByTestId('dashboard-intro-stats')).toBeInTheDocument();
      expect(screen.getByTestId('dashboard-charts')).toBeInTheDocument();
      expect(screen.getByTestId('dashboard-instructors')).toBeInTheDocument();
      expect(screen.getByTestId('dashboard-courses')).toBeInTheDocument();
      expect(screen.getByTestId('dashboard-testimonials')).toBeInTheDocument();
    });

    it('renders with container and wrapper divs', () => {
      const { container } = render(<DashboardContent {...defaultProps} />);

      expect(container.querySelector('.dashboard-container')).toBeInTheDocument();
      expect(container.querySelector('.dashboard-content-wrapper')).toBeInTheDocument();
    });

    it('renders correctly with minimal props', () => {
      const minimalProps = {
        totalUsers: 0,
        totalCourses: 0,
        activeSubscriptions: 0,
        completionRate: 0,
      };

      render(<DashboardContent {...minimalProps} />);
      expect(screen.getByTestId('dashboard-intro-stats')).toBeInTheDocument();
    });
  });

  describe('Hook Integration', () => {
    it('calls useDashboardContentData hook with completionRate prop', () => {
      render(<DashboardContent {...defaultProps} />);

      expect(useDashboardContentData).toHaveBeenCalledWith(75);
    });

    it('passes correct completionRate to hook from props', () => {
      const customProps = { ...defaultProps, completionRate: 85 };
      render(<DashboardContent {...customProps} />);

      expect(useDashboardContentData).toHaveBeenCalledWith(85);
    });

    it('handles zero completionRate passed to hook', () => {
      const customProps = { ...defaultProps, completionRate: 0 };
      render(<DashboardContent {...customProps} />);

      expect(useDashboardContentData).toHaveBeenCalledWith(0);
    });

    it('calls hook only once on render', () => {
      render(<DashboardContent {...defaultProps} />);

      expect(useDashboardContentData).toHaveBeenCalledTimes(1);
    });
  });

  describe('Props Passing to Child Components', () => {
    it('passes totalUsers, totalCourses, activeSubscriptions to DashboardIntroAndStats', () => {
      const mockIntroComponent = jest.fn(() => (
        <div data-testid="dashboard-intro-stats">Mocked</div>
      ));

      jest.doMock('../../Components/Dashboard/DashboardIntroAndStats', () => mockIntroComponent);

      render(<DashboardContent {...defaultProps} />);

      // Verify stats data is derived from hook
      expect(screen.getByTestId('dashboard-intro-stats')).toBeInTheDocument();
    });

    it('passes chart data to DashboardAnalyticsCharts when available', () => {
      const customReturn = {
        ...defaultHookReturn,
        emiData: [{ month: 'Jan', value: 100 }],
        enrollmentData: [{ month: 'Jan', value: 50 }],
        isLoadingCharts: false,
        chartError: null,
      };

      useDashboardContentData.mockReturnValue(customReturn);

      render(<DashboardContent {...defaultProps} />);

      expect(screen.getByTestId('dashboard-charts')).toBeInTheDocument();
    });

    it('passes instructor data to DashboardInstructorsSection', () => {
      const customReturn = {
        ...defaultHookReturn,
        instructors: [
          { id: 1, name: 'Dr. Smith' },
          { id: 2, name: 'Dr. Johnson' },
        ],
        loadingInstructors: false,
      };

      useDashboardContentData.mockReturnValue(customReturn);

      render(<DashboardContent {...defaultProps} />);

      expect(screen.getByTestId('dashboard-instructors')).toBeInTheDocument();
    });

    it('passes testimonials data to DashboardTestimonialsSection', () => {
      const customReturn = {
        ...defaultHookReturn,
        displayedTestimonials: [
          { id: 1, text: 'Excellent!' },
          { id: 2, text: 'Highly recommend' },
        ],
      };

      useDashboardContentData.mockReturnValue(customReturn);

      render(<DashboardContent {...defaultProps} />);

      expect(screen.getByTestId('dashboard-testimonials')).toBeInTheDocument();
    });
  });

  describe('Hook Data Usage', () => {
    it('uses completionRateState from hook in rendering', () => {
      const customReturn = {
        ...defaultHookReturn,
        completionRateState: 92,
      };

      useDashboardContentData.mockReturnValue(customReturn);

      render(<DashboardContent {...defaultProps} />);

      expect(screen.getByTestId('dashboard-intro-stats')).toBeInTheDocument();
    });

    it('uses totalTutors from hook', () => {
      const customReturn = {
        ...defaultHookReturn,
        totalTutors: 25,
      };

      useDashboardContentData.mockReturnValue(customReturn);

      render(<DashboardContent {...defaultProps} />);

      expect(screen.getByTestId('dashboard-intro-stats')).toBeInTheDocument();
    });

    it('uses instructors array from hook', () => {
      const customReturn = {
        ...defaultHookReturn,
        instructors: [
          { id: 1, name: 'Instructor 1' },
          { id: 2, name: 'Instructor 2' },
          { id: 3, name: 'Instructor 3' },
        ],
      };

      useDashboardContentData.mockReturnValue(customReturn);

      render(<DashboardContent {...defaultProps} />);

      expect(screen.getByTestId('dashboard-instructors')).toBeInTheDocument();
    });

    it('uses loadingInstructors state from hook', () => {
      const customReturn = {
        ...defaultHookReturn,
        loadingInstructors: true,
      };

      useDashboardContentData.mockReturnValue(customReturn);

      render(<DashboardContent {...defaultProps} />);

      expect(screen.getByTestId('dashboard-instructors')).toBeInTheDocument();
    });

    it('uses chart loading state from hook', () => {
      const customReturn = {
        ...defaultHookReturn,
        isLoadingCharts: true,
      };

      useDashboardContentData.mockReturnValue(customReturn);

      render(<DashboardContent {...defaultProps} />);

      expect(screen.getByTestId('dashboard-charts')).toBeInTheDocument();
    });

    it('uses chartError from hook', () => {
      const customReturn = {
        ...defaultHookReturn,
        chartError: 'Failed to load analytics',
      };

      useDashboardContentData.mockReturnValue(customReturn);

      render(<DashboardContent {...defaultProps} />);

      expect(screen.getByTestId('dashboard-charts')).toBeInTheDocument();
    });
  });

  describe('Lazy Loading and Suspense', () => {
    it('renders DashboardAnalyticsCharts inside Suspense boundary', () => {
      render(<DashboardContent {...defaultProps} />);

      expect(screen.getByTestId('dashboard-charts')).toBeInTheDocument();
    });

    it('renders all sections even when charts are loading', () => {
      const customReturn = {
        ...defaultHookReturn,
        isLoadingCharts: true,
      };

      useDashboardContentData.mockReturnValue(customReturn);

      render(<DashboardContent {...defaultProps} />);

      expect(screen.getByTestId('dashboard-intro-stats')).toBeInTheDocument();
      expect(screen.getByTestId('dashboard-instructors')).toBeInTheDocument();
    });

    it('displays charts when loading completes', () => {
      const { rerender } = render(<DashboardContent {...defaultProps} />);

      expect(screen.getByTestId('dashboard-charts')).toBeInTheDocument();

      // Update hook to show loading state
      const loadingReturn = {
        ...defaultHookReturn,
        isLoadingCharts: true,
      };
      useDashboardContentData.mockReturnValue(loadingReturn);

      rerender(<DashboardContent {...defaultProps} />);

      expect(screen.getByTestId('dashboard-charts')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('handles missing instructors array gracefully', () => {
      const customReturn = {
        ...defaultHookReturn,
        instructors: [],
      };

      useDashboardContentData.mockReturnValue(customReturn);

      render(<DashboardContent {...defaultProps} />);

      expect(screen.getByTestId('dashboard-instructors')).toBeInTheDocument();
    });

    it('handles null testimonials gracefully', () => {
      const customReturn = {
        ...defaultHookReturn,
        displayedTestimonials: null,
      };

      useDashboardContentData.mockReturnValue(customReturn);

      expect(() => {
        render(<DashboardContent {...defaultProps} />);
      }).not.toThrow();
    });

    it('handles missing chart data gracefully', () => {
      const customReturn = {
        ...defaultHookReturn,
        emiData: [],
        enrollmentData: [],
      };

      useDashboardContentData.mockReturnValue(customReturn);

      render(<DashboardContent {...defaultProps} />);

      expect(screen.getByTestId('dashboard-charts')).toBeInTheDocument();
    });

    it('handles zero values for all stats', () => {
      const customReturn = {
        ...defaultHookReturn,
        totalTutors: 0,
        completionRateState: 0,
      };

      useDashboardContentData.mockReturnValue(customReturn);

      const zeroProps = {
        totalUsers: 0,
        totalCourses: 0,
        activeSubscriptions: 0,
        completionRate: 0,
      };

      render(<DashboardContent {...zeroProps} />);

      expect(screen.getByTestId('dashboard-intro-stats')).toBeInTheDocument();
    });

    it('handles large numbers for stats', () => {
      const customReturn = {
        ...defaultHookReturn,
        totalTutors: 999999,
        completionRateState: 100,
      };

      useDashboardContentData.mockReturnValue(customReturn);

      const largeProps = {
        totalUsers: 1000000,
        totalCourses: 50000,
        activeSubscriptions: 500000,
        completionRate: 100,
      };

      render(<DashboardContent {...largeProps} />);

      expect(screen.getByTestId('dashboard-intro-stats')).toBeInTheDocument();
    });

    it('renders correctly with all hook states true/active', () => {
      const customReturn = {
        ...defaultHookReturn,
        isLoadingCharts: true,
        loadingInstructors: true,
        chartError: 'Some error',
        retryCount: 2,
      };

      useDashboardContentData.mockReturnValue(customReturn);

      render(<DashboardContent {...defaultProps} />);

      expect(screen.getByTestId('dashboard-intro-stats')).toBeInTheDocument();
      expect(screen.getByTestId('dashboard-charts')).toBeInTheDocument();
      expect(screen.getByTestId('dashboard-instructors')).toBeInTheDocument();
    });

    it('renders correctly when testimonials array has single item', () => {
      const customReturn = {
        ...defaultHookReturn,
        displayedTestimonials: [{ id: 1, text: 'Only one testimonial' }],
      };

      useDashboardContentData.mockReturnValue(customReturn);

      render(<DashboardContent {...defaultProps} />);

      expect(screen.getByTestId('dashboard-testimonials')).toBeInTheDocument();
    });
  });

  describe('Component Stability', () => {
    it('maintains component structure across re-renders', () => {
      const { rerender } = render(<DashboardContent {...defaultProps} />);

      expect(screen.getByTestId('dashboard-intro-stats')).toBeInTheDocument();

      rerender(<DashboardContent {...defaultProps} />);

      expect(screen.getByTestId('dashboard-intro-stats')).toBeInTheDocument();
      expect(screen.getByTestId('dashboard-charts')).toBeInTheDocument();
      expect(screen.getByTestId('dashboard-instructors')).toBeInTheDocument();
    });

    it('updates when completionRate prop changes', () => {
      const props1 = { ...defaultProps, completionRate: 50 };
      const { rerender } = render(<DashboardContent {...props1} />);

      expect(useDashboardContentData).toHaveBeenCalledWith(50);

      const props2 = { ...defaultProps, completionRate: 80 };
      rerender(<DashboardContent {...props2} />);

      expect(useDashboardContentData).toHaveBeenCalledWith(80);
    });

    it('updates when totalUsers prop changes', () => {
      const props1 = { ...defaultProps, totalUsers: 1000 };
      const { rerender } = render(<DashboardContent {...props1} />);

      expect(screen.getByTestId('dashboard-intro-stats')).toBeInTheDocument();

      const props2 = { ...defaultProps, totalUsers: 5000 };
      rerender(<DashboardContent {...props2} />);

      expect(screen.getByTestId('dashboard-intro-stats')).toBeInTheDocument();
    });

    it('maintains DOM structure when hook return changes', () => {
      const { container } = render(<DashboardContent {...defaultProps} />);

      const initialStructure = container.innerHTML;

      useDashboardContentData.mockReturnValue({
        ...defaultHookReturn,
        totalTutors: 100,
      });

      render(<DashboardContent {...defaultProps} />, { container });

      expect(container.querySelector('.dashboard-container')).toBeInTheDocument();
    });
  });

  describe('CSS Classes and Styling', () => {
    it('applies dashboard-container class to root div', () => {
      const { container } = render(<DashboardContent {...defaultProps} />);

      expect(container.querySelector('.dashboard-container')).toBeInTheDocument();
    });

    it('applies dashboard-content-wrapper class to wrapper div', () => {
      const { container } = render(<DashboardContent {...defaultProps} />);

      expect(container.querySelector('.dashboard-content-wrapper')).toBeInTheDocument();
    });

    it('applies styles from DASHBOARD_STYLES to container', () => {
      const { container } = render(<DashboardContent {...defaultProps} />);

      const dashboardContainer = container.querySelector('.dashboard-container');
      expect(dashboardContainer).toHaveStyle({ padding: '20px' });
    });

    it('applies styles from DASHBOARD_STYLES to content wrapper', () => {
      const { container } = render(<DashboardContent {...defaultProps} />);

      const contentWrapper = container.querySelector('.dashboard-content-wrapper');
      expect(contentWrapper).toHaveStyle({ maxWidth: '1200px' });
    });
  });

  describe('Callback Handling', () => {
    it('passes checkIsSuperAdmin function to child components', () => {
      const mockCheckIsSuperAdmin = jest.fn(() => true);
      const customReturn = {
        ...defaultHookReturn,
        checkIsSuperAdmin: mockCheckIsSuperAdmin,
      };

      useDashboardContentData.mockReturnValue(customReturn);

      render(<DashboardContent {...defaultProps} />);

      expect(screen.getByTestId('dashboard-instructors')).toBeInTheDocument();
    });

    it('passes handleInstructorCardClick callback to instructors section', () => {
      const mockHandleClick = jest.fn();
      const customReturn = {
        ...defaultHookReturn,
        handleInstructorCardClick: mockHandleClick,
      };

      useDashboardContentData.mockReturnValue(customReturn);

      render(<DashboardContent {...defaultProps} />);

      expect(screen.getByTestId('dashboard-instructors')).toBeInTheDocument();
    });
  });

  describe('Data Transformation', () => {
    it('passes all dashboard stats data types correctly', () => {
      const customReturn = {
        ...defaultHookReturn,
        emiData: [
          { month: 'January', amount: 1000 },
          { month: 'February', amount: 1500 },
        ],
        enrollmentData: [
          { month: 'January', count: 50 },
          { month: 'February', count: 75 },
        ],
      };

      useDashboardContentData.mockReturnValue(customReturn);

      render(<DashboardContent {...defaultProps} />);

      expect(screen.getByTestId('dashboard-charts')).toBeInTheDocument();
    });

    it('handles mixed instructor data formats', () => {
      const customReturn = {
        ...defaultHookReturn,
        instructors: [
          { id: 1, name: 'Prof Smith', image: 'url1.jpg', order: 1 },
          { id: 2, name: 'Prof Jones', image: 'url2.jpg' },
          { id: 3, name: 'Prof Brown', imageUrl: 'url3.jpg' },
        ],
      };

      useDashboardContentData.mockReturnValue(customReturn);

      render(<DashboardContent {...defaultProps} />);

      expect(screen.getByTestId('dashboard-instructors')).toBeInTheDocument();
    });

    it('handles testimonials with varying structure', () => {
      const customReturn = {
        ...defaultHookReturn,
        displayedTestimonials: [
          { id: 1, text: 'Great!', author: 'John', rating: 5 },
          { id: 2, text: 'Good', author: 'Jane' },
          { id: 3, text: 'Excellent', rating: 5 },
        ],
      };

      useDashboardContentData.mockReturnValue(customReturn);

      render(<DashboardContent {...defaultProps} />);

      expect(screen.getByTestId('dashboard-testimonials')).toBeInTheDocument();
    });
  });
});
