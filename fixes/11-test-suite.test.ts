      expect(response.status).toBe(400);
      expect(data.error).toBe('User with this email already exists');
    });

    it('should validate password requirements', async () => {
      const { POST } = await import('@/app/api/auth/signup/route');
      
      const requestBody = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'short',
        confirmPassword: 'short',
        acceptTerms: true,
        acceptPrivacy: true,
      };

      const response = await POST(mockRequest(requestBody));
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Validation failed');
      expect(data.details).toContainEqual(
        expect.objectContaining({
          message: 'Password must be at least 8 characters',
        })
      );
    });
  });

  describe('GET /api/lessons', () => {
    it('should return paginated lessons', async () => {
      const mockLessons = [
        { id: '1', title: 'Lesson 1', lessonNumber: 1 },
        { id: '2', title: 'Lesson 2', lessonNumber: 2 },
      ];

      prisma.lesson.findMany.mockResolvedValue(mockLessons);
      prisma.lesson.count.mockResolvedValue(10);
      cache.get.mockResolvedValue(null);

      const { GET } = await import('@/app/api/lessons/route');
      const request = new Request('http://localhost:3000/api/lessons?page=1&limit=2');
      
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.lessons).toHaveLength(2);
      expect(data.total).toBe(10);
      expect(data.totalPages).toBe(5);
    });
  });
});

// Component Tests
describe('Components', () => {
  describe('LessonCard', () => {
    it('should render lesson information', () => {
      const { LessonCard } = require('@/components/lesson-card');
      
      const lesson = {
        id: '1',
        title: 'Test Lesson',
        description: 'This is a test lesson',
        difficulty: 'beginner',
        estimatedTime: 30,
        tools: ['ChatGPT', 'Claude'],
      };

      render(<LessonCard lesson={lesson} />);

      expect(screen.getByText('Test Lesson')).toBeInTheDocument();
      expect(screen.getByText('This is a test lesson')).toBeInTheDocument();
      expect(screen.getByText('Beginner')).toBeInTheDocument();
      expect(screen.getByText('30 min')).toBeInTheDocument();
      expect(screen.getByText('ChatGPT')).toBeInTheDocument();
    });

    it('should handle click events', async () => {
      const { LessonCard } = require('@/components/lesson-card');
      const onClick = jest.fn();
      
      const lesson = {
        id: '1',
        title: 'Test Lesson',
      };

      render(<LessonCard lesson={lesson} onClick={onClick} />);
      
      await userEvent.click(screen.getByRole('article'));
      
      expect(onClick).toHaveBeenCalledWith('1');
    });
  });

  describe('ProgressBar', () => {
    it('should display correct progress', () => {
      const { ProgressBar } = require('@/components/progress-bar');
      
      render(<ProgressBar progress={75} />);

      const progressBar = screen.getByRole('progressbar');
      expect(progressBar).toHaveAttribute('aria-valuenow', '75');
      expect(progressBar).toHaveAttribute('aria-valuemin', '0');
      expect(progressBar).toHaveAttribute('aria-valuemax', '100');
    });
  });
});

// Integration Tests
describe('Integration Tests', () => {
  describe('User Registration Flow', () => {
    it('should complete full registration process', async () => {
      const user = userEvent.setup();
      
      // Mock API responses
      global.fetch = jest.fn()
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ token: 'csrf-token' }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ 
            message: 'Account created successfully',
            user: { id: '123', email: 'test@example.com' },
          }),
        });

      const { SignupForm } = require('@/components/auth/signup-form');
      render(<SignupForm />);

      // Fill form
      await user.type(screen.getByLabelText(/name/i), 'Test User');
      await user.type(screen.getByLabelText(/email/i), 'test@example.com');
      await user.type(screen.getByLabelText(/^password/i), 'password123');
      await user.type(screen.getByLabelText(/confirm password/i), 'password123');
      await user.click(screen.getByLabelText(/accept terms/i));
      await user.click(screen.getByLabelText(/accept privacy/i));

      // Submit form
      await user.click(screen.getByRole('button', { name: /sign up/i }));

      // Check success state
      await waitFor(() => {
        expect(screen.getByText(/account created successfully/i)).toBeInTheDocument();
      });
    });
  });
});

// Performance Tests
describe('Performance', () => {
  it('should cache lesson queries', async () => {
    const { OptimizedQueries } = await import('@/lib/database-optimization');
    const queries = new OptimizedQueries(prisma);

    // First call - should hit database
    cache.get.mockResolvedValueOnce(null);
    prisma.lesson.findMany.mockResolvedValueOnce([]);
    prisma.lesson.count.mockResolvedValueOnce(0);

    await queries.getLessonsOptimized({ take: 10 });

    expect(cache.get).toHaveBeenCalledTimes(1);
    expect(prisma.lesson.findMany).toHaveBeenCalledTimes(1);
    expect(cache.set).toHaveBeenCalledTimes(1);

    // Reset mocks
    jest.clearAllMocks();

    // Second call - should hit cache
    cache.get.mockResolvedValueOnce({ lessons: [], total: 0 });

    await queries.getLessonsOptimized({ take: 10 });

    expect(cache.get).toHaveBeenCalledTimes(1);
    expect(prisma.lesson.findMany).not.toHaveBeenCalled();
  });
});

// E2E Test Example
describe('E2E Tests', () => {
  it('should complete lesson progression', async () => {
    // This would use Playwright in real implementation
    // Example structure:
    
    // const browser = await chromium.launch();
    // const page = await browser.newPage();
    
    // await page.goto('http://localhost:3000');
    // await page.click('text=Sign In');
    // await page.fill('[name=email]', 'test@example.com');
    // await page.fill('[name=password]', 'password123');
    // await page.click('button[type=submit]');
    
    // await page.waitForNavigation();
    // await page.click('text=Lesson 1');
    // await page.click('text=Mark as Complete');
    
    // const progress = await page.textContent('.progress-bar');
    // expect(progress).toContain('100%');
    
    // await browser.close();
  });
});
