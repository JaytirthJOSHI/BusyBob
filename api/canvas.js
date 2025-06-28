import axios from 'axios';
import express from 'express';

class CanvasAPIError extends Error {
  constructor(message, statusCode, response) {
    super(message);
    this.name = 'CanvasAPIError';
    this.statusCode = statusCode;
    this.response = response;
  }
}

class CanvasClient {
  constructor(token, domain, options = {}) {
    const sanitizedDomain = domain.replace(/^https?:\/\//, '');
    this.baseURL = `https://${sanitizedDomain}/api/v1`;
    this.token = token;
    this.maxRetries = options.maxRetries || 3;
    this.retryDelay = options.retryDelay || 1000;
    this.timeout = options.timeout || 30000;

    this.client = axios.create({
      baseURL: this.baseURL,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      timeout: this.timeout
    });

    this.setupInterceptors();
  }

  setupInterceptors() {
    // Request interceptor for logging
    this.client.interceptors.request.use(
      (config) => {
        console.log(`[Canvas API] ${config.method?.toUpperCase()} ${config.url}`);
        return config;
      },
      (error) => {
        console.error('[Canvas API] Request error:', error);
        return Promise.reject(error);
      }
    );

    // Response interceptor for pagination and retry logic
    this.client.interceptors.response.use(
      async (response) => {
        const { headers, data } = response;
        const linkHeader = headers.link;

        // Handle pagination automatically
        if (Array.isArray(data) && linkHeader) {
          let allData = [...data];
          let nextUrl = this.getNextPageUrl(linkHeader);

          while (nextUrl) {
            const nextResponse = await this.client.get(nextUrl);
            allData = [...allData, ...nextResponse.data];
            nextUrl = this.getNextPageUrl(nextResponse.headers.link);
          }

          response.data = allData;
        }

        return response;
      },
      async (error) => {
        const config = error.config;

        // Retry logic for specific errors
        if (this.shouldRetry(error) && config && config.__retryCount < this.maxRetries) {
          config.__retryCount = config.__retryCount || 0;
          config.__retryCount++;

          const delay = this.retryDelay * Math.pow(2, config.__retryCount - 1); // Exponential backoff
          console.log(`[Canvas API] Retrying request (${config.__retryCount}/${this.maxRetries}) after ${delay}ms`);

          await this.sleep(delay);
          return this.client.request(config);
        }

        // Transform error
        if (error.response) {
          const { status, data } = error.response;
          throw new CanvasAPIError(
            `Canvas API Error (${status}): ${data?.message || JSON.stringify(data)}`,
            status,
            data
          );
        }

        throw error;
      }
    );
  }

  shouldRetry(error) {
    if (!error.response) return true; // Network errors

    const status = error.response.status;
    return status === 429 || status >= 500; // Rate limit or server errors
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  getNextPageUrl(linkHeader) {
    if (!linkHeader) return null;

    const links = linkHeader.split(',');
    const nextLink = links.find(link => link.includes('rel="next"'));
    if (!nextLink) return null;

    const match = nextLink.match(/<(.+?)>/);
    return match ? match[1] : null;
  }

  // Health check
  async healthCheck() {
    try {
      const user = await this.getUserProfile();
      return {
        status: 'ok',
        timestamp: new Date().toISOString(),
        user: { id: user.id, name: user.name }
      };
    } catch (error) {
      return {
        status: 'error',
        timestamp: new Date().toISOString(),
        error: error.message
      };
    }
  }

  // User profile
  async getUserProfile() {
    const response = await this.client.get('/users/self/profile');
    return response.data;
  }

  // Courses
  async listCourses(includeEnded = false) {
    const params = {
      include: ['total_students', 'teachers', 'term', 'course_progress']
    };

    if (!includeEnded) {
      params.state = ['available', 'completed'];
    }

    const response = await this.client.get('/courses', { params });
    return response.data;
  }

  async getCourse(courseId) {
    const response = await this.client.get(`/courses/${courseId}`, {
      params: {
        include: ['total_students', 'teachers', 'term', 'course_progress', 'sections', 'syllabus_body']
      }
    });
    return response.data;
  }

  // Assignments
  async listAssignments(courseId, includeSubmissions = false) {
    const params = {
      include: ['submission', 'assignment_visibility', 'all_dates', 'overrides']
    };

    if (includeSubmissions) {
      params.include.push('submission');
    }

    const response = await this.client.get(`/courses/${courseId}/assignments`, { params });
    return response.data;
  }

  async getAssignment(courseId, assignmentId, includeSubmission = false) {
    const params = {
      include: ['submission', 'assignment_visibility', 'all_dates', 'overrides', 'rubric_assessment']
    };

    if (includeSubmission) {
      params.include.push('submission');
    }

    const response = await this.client.get(`/courses/${courseId}/assignments/${assignmentId}`, { params });
    return response.data;
  }

  // Submissions
  async getSubmissions(courseId, assignmentId) {
    const response = await this.client.get(`/courses/${courseId}/assignments/${assignmentId}/submissions`, {
      params: {
        include: ['submission_history', 'submission_comments', 'rubric_assessment', 'assignment', 'user']
      }
    });
    return response.data;
  }

  async getSubmission(courseId, assignmentId, userId = 'self') {
    const response = await this.client.get(`/courses/${courseId}/assignments/${assignmentId}/submissions/${userId}`, {
      params: {
        include: ['submission_history', 'submission_comments', 'rubric_assessment', 'assignment', 'user']
      }
    });
    return response.data;
  }

  async submitAssignment(courseId, assignmentId, submissionData) {
    const response = await this.client.post(`/courses/${courseId}/assignments/${assignmentId}/submissions`, submissionData);
    return response.data;
  }

  // Grades
  async getUserGrades() {
    const response = await this.client.get('/users/self/enrollments', {
      params: {
        include: ['grades', 'course']
      }
    });
    return response.data;
  }

  async getCourseGrades(courseId) {
    const response = await this.client.get(`/courses/${courseId}/enrollments`, {
      params: {
        include: ['grades', 'user']
      }
    });
    return response.data;
  }

  // Modules
  async listModules(courseId) {
    const response = await this.client.get(`/courses/${courseId}/modules`, {
      params: {
        include: ['items', 'content_details']
      }
    });
    return response.data;
  }

  async getModule(courseId, moduleId) {
    const response = await this.client.get(`/courses/${courseId}/modules/${moduleId}`, {
      params: {
        include: ['items', 'content_details']
      }
    });
    return response.data;
  }

  async listModuleItems(courseId, moduleId) {
    const response = await this.client.get(`/courses/${courseId}/modules/${moduleId}/items`, {
      params: {
        include: ['content_details', 'completion_requirement']
      }
    });
    return response.data;
  }

  async markModuleItemComplete(courseId, moduleId, itemId) {
    const response = await this.client.put(`/courses/${courseId}/modules/${moduleId}/items/${itemId}/mark_read`);
    return response.data;
  }

  // Discussions
  async listDiscussions(courseId) {
    const response = await this.client.get(`/courses/${courseId}/discussion_topics`, {
      params: {
        include: ['all_dates', 'sections', 'sections_user_count', 'assignment']
      }
    });
    return response.data;
  }

  async getDiscussion(courseId, topicId) {
    const response = await this.client.get(`/courses/${courseId}/discussion_topics/${topicId}`, {
      params: {
        include: ['all_dates', 'sections', 'sections_user_count', 'assignment']
      }
    });
    return response.data;
  }

  async postToDiscussion(courseId, topicId, message) {
    const response = await this.client.post(`/courses/${courseId}/discussion_topics/${topicId}/entries`, {
      message: message
    });
    return response.data;
  }

  // Announcements
  async listAnnouncements(courseId) {
    const response = await this.client.get(`/courses/${courseId}/discussion_topics`, {
      params: {
        only_announcements: true,
        include: ['all_dates', 'sections', 'sections_user_count']
      }
    });
    return response.data;
  }

  // Files
  async listFiles(courseId, folderId = null) {
    const params = {};
    if (folderId) {
      params.folder_id = folderId;
    }

    const response = await this.client.get(`/courses/${courseId}/files`, { params });
    return response.data;
  }

  async getFile(fileId) {
    const response = await this.client.get(`/files/${fileId}`);
    return response.data;
  }

  // Pages
  async listPages(courseId) {
    const response = await this.client.get(`/courses/${courseId}/pages`);
    return response.data;
  }

  async getPage(courseId, pageUrl) {
    const response = await this.client.get(`/courses/${courseId}/pages/${pageUrl}`);
    return response.data;
  }

  // Calendar
  async listCalendarEvents(startDate = null, endDate = null) {
    const params = {};
    if (startDate) params.start_date = startDate;
    if (endDate) params.end_date = endDate;

    const response = await this.client.get('/calendar_events', { params });
    return response.data;
  }

  async getUpcomingAssignments(limit = 10) {
    const response = await this.client.get('/users/self/upcoming_events', {
      params: {
        context_codes: ['user_self'],
        type: 'assignment',
        limit: limit
      }
    });
    return response.data;
  }

  // Dashboard
  async getDashboard() {
    const response = await this.client.get('/dashboard');
    return response.data;
  }

  async getDashboardCards() {
    const response = await this.client.get('/dashboard/dashboard_cards');
    return response.data;
  }

  // Syllabus
  async getSyllabus(courseId) {
    const response = await this.client.get(`/courses/${courseId}`, {
      params: {
        include: ['syllabus_body']
      }
    });
    return {
      course_id: courseId,
      syllabus_body: response.data.syllabus_body
    };
  }

  // Conversations/Messages
  async listConversations() {
    const response = await this.client.get('/conversations', {
      params: {
        include: ['participant_avatars']
      }
    });
    return response.data;
  }

  async getConversation(conversationId) {
    const response = await this.client.get(`/conversations/${conversationId}`, {
      params: {
        include: ['participant_avatars']
      }
    });
    return response.data;
  }

  async createConversation(recipients, body, subject = null) {
    const data = {
      recipients: recipients,
      body: body
    };

    if (subject) {
      data.subject = subject;
    }

    const response = await this.client.post('/conversations', data);
    return response.data;
  }

  // Quizzes
  async listQuizzes(courseId) {
    const response = await this.client.get(`/courses/${courseId}/quizzes`);
    return response.data;
  }

  async getQuiz(courseId, quizId) {
    const response = await this.client.get(`/courses/${courseId}/quizzes/${quizId}`);
    return response.data;
  }
}

// Express router setup
const router = express.Router();

// Middleware to validate Canvas credentials
function validateCanvasCredentials(req, res, next) {
  const { canvasToken, canvasDomain } = req.body;

  if (!canvasToken || !canvasDomain) {
    return res.status(400).json({
      error: 'Missing Canvas credentials',
      message: 'Both canvasToken and canvasDomain are required'
    });
  }

  // Store credentials in request for use in route handlers
  req.canvasCredentials = { token: canvasToken, domain: canvasDomain };
  next();
}

// Health check endpoint
router.post('/health', validateCanvasCredentials, async (req, res) => {
  try {
    const { token, domain } = req.canvasCredentials;
    const client = new CanvasClient(token, domain);
    const health = await client.healthCheck();

    res.json(health);
  } catch (error) {
    console.error('Canvas health check error:', error);
    res.status(500).json({
      error: 'Canvas health check failed',
      message: error.message
    });
  }
});

// Get user profile
router.post('/profile', validateCanvasCredentials, async (req, res) => {
  try {
    const { token, domain } = req.canvasCredentials;
    const client = new CanvasClient(token, domain);
    const profile = await client.getUserProfile();

    res.json(profile);
  } catch (error) {
    console.error('Canvas profile error:', error);
    res.status(500).json({
      error: 'Failed to get Canvas profile',
      message: error.message
    });
  }
});

// List courses
router.post('/courses', validateCanvasCredentials, async (req, res) => {
  try {
    const { token, domain } = req.canvasCredentials;
    const { includeEnded = false } = req.body;

    const client = new CanvasClient(token, domain);
    const courses = await client.listCourses(includeEnded);

    res.json(courses);
  } catch (error) {
    console.error('Canvas courses error:', error);
    res.status(500).json({
      error: 'Failed to get Canvas courses',
      message: error.message
    });
  }
});

// Get course details
router.post('/course', validateCanvasCredentials, async (req, res) => {
  try {
    const { token, domain } = req.canvasCredentials;
    const { courseId } = req.body;

    if (!courseId) {
      return res.status(400).json({
        error: 'Missing courseId parameter'
      });
    }

    const client = new CanvasClient(token, domain);
    const course = await client.getCourse(courseId);

    res.json(course);
  } catch (error) {
    console.error('Canvas course error:', error);
    res.status(500).json({
      error: 'Failed to get Canvas course',
      message: error.message
    });
  }
});

// List assignments
router.post('/assignments', validateCanvasCredentials, async (req, res) => {
  try {
    const { token, domain } = req.canvasCredentials;
    const { courseId, includeSubmissions = false } = req.body;

    if (!courseId) {
      return res.status(400).json({
        error: 'Missing courseId parameter'
      });
    }

    const client = new CanvasClient(token, domain);
    const assignments = await client.listAssignments(courseId, includeSubmissions);

    res.json(assignments);
  } catch (error) {
    console.error('Canvas assignments error:', error);
    res.status(500).json({
      error: 'Failed to get Canvas assignments',
      message: error.message
    });
  }
});

// Get assignment details
router.post('/assignment', validateCanvasCredentials, async (req, res) => {
  try {
    const { token, domain } = req.canvasCredentials;
    const { courseId, assignmentId, includeSubmission = false } = req.body;

    if (!courseId || !assignmentId) {
      return res.status(400).json({
        error: 'Missing courseId or assignmentId parameter'
      });
    }

    const client = new CanvasClient(token, domain);
    const assignment = await client.getAssignment(courseId, assignmentId, includeSubmission);

    res.json(assignment);
  } catch (error) {
    console.error('Canvas assignment error:', error);
    res.status(500).json({
      error: 'Failed to get Canvas assignment',
      message: error.message
    });
  }
});

// Get grades
router.post('/grades', validateCanvasCredentials, async (req, res) => {
  try {
    const { token, domain } = req.canvasCredentials;
    const { courseId } = req.body;

    const client = new CanvasClient(token, domain);

    if (courseId) {
      const grades = await client.getCourseGrades(courseId);
      res.json(grades);
    } else {
      const grades = await client.getUserGrades();
      res.json(grades);
    }
  } catch (error) {
    console.error('Canvas grades error:', error);
    res.status(500).json({
      error: 'Failed to get Canvas grades',
      message: error.message
    });
  }
});

// List modules
router.post('/modules', validateCanvasCredentials, async (req, res) => {
  try {
    const { token, domain } = req.canvasCredentials;
    const { courseId, moduleId } = req.body;

    if (!courseId) {
      return res.status(400).json({
        error: 'Missing courseId parameter'
      });
    }

    const client = new CanvasClient(token, domain);

    if (moduleId) {
      const module = await client.getModule(courseId, moduleId);
      res.json(module);
    } else {
      const modules = await client.listModules(courseId);
      res.json(modules);
    }
  } catch (error) {
    console.error('Canvas modules error:', error);
    res.status(500).json({
      error: 'Failed to get Canvas modules',
      message: error.message
    });
  }
});

// List discussions
router.post('/discussions', validateCanvasCredentials, async (req, res) => {
  try {
    const { token, domain } = req.canvasCredentials;
    const { courseId, topicId } = req.body;

    if (!courseId) {
      return res.status(400).json({
        error: 'Missing courseId parameter'
      });
    }

    const client = new CanvasClient(token, domain);

    if (topicId) {
      const discussion = await client.getDiscussion(courseId, topicId);
      res.json(discussion);
    } else {
      const discussions = await client.listDiscussions(courseId);
      res.json(discussions);
    }
  } catch (error) {
    console.error('Canvas discussions error:', error);
    res.status(500).json({
      error: 'Failed to get Canvas discussions',
      message: error.message
    });
  }
});

// List announcements
router.post('/announcements', validateCanvasCredentials, async (req, res) => {
  try {
    const { token, domain } = req.canvasCredentials;
    const { courseId } = req.body;

    if (!courseId) {
      return res.status(400).json({
        error: 'Missing courseId parameter'
      });
    }

    const client = new CanvasClient(token, domain);
    const announcements = await client.listAnnouncements(courseId);

    res.json(announcements);
  } catch (error) {
    console.error('Canvas announcements error:', error);
    res.status(500).json({
      error: 'Failed to get Canvas announcements',
      message: error.message
    });
  }
});

// Get upcoming assignments
router.post('/upcoming', validateCanvasCredentials, async (req, res) => {
  try {
    const { token, domain } = req.canvasCredentials;
    const { limit = 10 } = req.body;

    const client = new CanvasClient(token, domain);
    const assignments = await client.getUpcomingAssignments(limit);

    res.json(assignments);
  } catch (error) {
    console.error('Canvas upcoming assignments error:', error);
    res.status(500).json({
      error: 'Failed to get upcoming assignments',
      message: error.message
    });
  }
});

// Get calendar events
router.post('/calendar', validateCanvasCredentials, async (req, res) => {
  try {
    const { token, domain } = req.canvasCredentials;
    const { startDate, endDate } = req.body;

    const client = new CanvasClient(token, domain);
    const events = await client.listCalendarEvents(startDate, endDate);

    res.json(events);
  } catch (error) {
    console.error('Canvas calendar error:', error);
    res.status(500).json({
      error: 'Failed to get calendar events',
      message: error.message
    });
  }
});

// Get dashboard
router.post('/dashboard', validateCanvasCredentials, async (req, res) => {
  try {
    const { token, domain } = req.canvasCredentials;

    const client = new CanvasClient(token, domain);
    const dashboard = await client.getDashboard();

    res.json(dashboard);
  } catch (error) {
    console.error('Canvas dashboard error:', error);
    res.status(500).json({
      error: 'Failed to get dashboard',
      message: error.message
    });
  }
});

export { router };