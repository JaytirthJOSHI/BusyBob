import Canvas from '@kth/canvas-api';
import express from 'express';
import { supabase } from '../src/lib/supabase.js';

const router = express.Router();

async function getCanvasCredentials(userId) {
    const { data, error } = await supabase
        .from('canvas_credentials')
        .select('canvas_url, access_token')
        .eq('user_id', userId)
        .single();

    if (error) {
        console.error('Error fetching Canvas credentials:', error);
        throw new Error('Could not retrieve Canvas credentials.');
    }

    if (!data) {
        throw new Error('No Canvas credentials found for this user.');
    }
    
    // Ensure the URL is clean and doesn't end with a slash
    let canvasUrl = data.canvas_url;
    if (canvasUrl.endsWith('/')) {
        canvasUrl = canvasUrl.slice(0, -1);
    }

    return { canvasUrl, accessToken: data.access_token };
}

async function handleRequest(req) {
    const { action, courseId, assignmentId, ...params } = req.body;
    
    // Get user from authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return { statusCode: 401, body: JSON.stringify({ error: 'Authorization header required' }) };
    }
    
    const token = authHeader.split(' ')[1];
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
        return { statusCode: 401, body: JSON.stringify({ error: 'User not authenticated' }) };
    }

    try {
        const { canvasUrl, accessToken } = await getCanvasCredentials(user.id);
        const canvas = new Canvas(canvasUrl, accessToken);

        let data;
        switch (action) {
            case 'getCourses':
                console.log('Fetching courses from Canvas...');
                const courses = [];
                for await (const course of canvas.listItems('courses')) {
                    courses.push({
                        id: course.id,
                        name: course.name,
                        course_code: course.course_code,
                        start_at: course.start_at,
                        end_at: course.end_at,
                        workflow_state: course.workflow_state,
                        enrollment_state: course.enrollment_state,
                        total_students: course.total_students,
                        calendar: course.calendar,
                        default_view: course.default_view,
                        syllabus_body: course.syllabus_body,
                        needs_grading_count: course.needs_grading_count,
                        term: course.term,
                        apply_assignment_group_weights: course.apply_assignment_group_weights,
                        permissions: course.permissions
                    });
                }
                data = { courses };
                break;

            case 'getCourse':
                if (!courseId) {
                    return { statusCode: 400, body: JSON.stringify({ error: 'Course ID required' }) };
                }
                console.log(`Fetching course ${courseId}...`);
                const { body: course } = await canvas.get(`courses/${courseId}`);
                data = course;
                break;

            case 'getAssignments':
                if (!courseId) {
                    return { statusCode: 400, body: JSON.stringify({ error: 'Course ID required' }) };
                }
                console.log(`Fetching assignments for course ${courseId}...`);
                const assignments = [];
                for await (const assignment of canvas.listItems(`courses/${courseId}/assignments`)) {
                    assignments.push({
                        id: assignment.id,
                        name: assignment.name,
                        description: assignment.description,
                        due_at: assignment.due_at,
                        points_possible: assignment.points_possible,
                        assignment_group_id: assignment.assignment_group_id,
                        grading_type: assignment.grading_type,
                        submission_types: assignment.submission_types,
                        allowed_attempts: assignment.allowed_attempts,
                        published: assignment.published,
                        unlock_at: assignment.unlock_at,
                        lock_at: assignment.lock_at,
                        needs_grading_count: assignment.needs_grading_count,
                        html_url: assignment.html_url
                    });
                }
                data = { assignments };
                break;

            case 'getAssignment':
                if (!courseId || !assignmentId) {
                    return { statusCode: 400, body: JSON.stringify({ error: 'Course ID and Assignment ID required' }) };
                }
                console.log(`Fetching assignment ${assignmentId} from course ${courseId}...`);
                const { body: assignment } = await canvas.get(`courses/${courseId}/assignments/${assignmentId}`);
                data = assignment;
                break;

            case 'getSubmissions':
                if (!courseId) {
                    return { statusCode: 400, body: JSON.stringify({ error: 'Course ID required' }) };
                }
                console.log(`Fetching submissions for course ${courseId}...`);
                const submissions = [];
                for await (const submission of canvas.listItems(`courses/${courseId}/students/submissions`, { 'student_ids[]': 'self' })) {
                    submissions.push({
                        id: submission.id,
                        assignment_id: submission.assignment_id,
                        user_id: submission.user_id,
                        score: submission.score,
                        grade: submission.grade,
                        submitted_at: submission.submitted_at,
                        late: submission.late,
                        missing: submission.missing,
                        workflow_state: submission.workflow_state,
                        attempt: submission.attempt,
                        body: submission.body,
                        url: submission.url,
                        submission_type: submission.submission_type,
                        grade_matches_current_submission: submission.grade_matches_current_submission,
                        graded_at: submission.graded_at,
                        grader_id: submission.grader_id,
                        comments: submission.submission_comments
                    });
                }
                data = { submissions };
                break;

            case 'getGrades':
                if (!courseId) {
                    return { statusCode: 400, body: JSON.stringify({ error: 'Course ID required' }) };
                }
                console.log(`Fetching grades for course ${courseId}...`);
                const { body: grades } = await canvas.get(`courses/${courseId}/enrollments`, { 'user_id': 'self' });
                data = grades;
                break;

            case 'getGradebook':
                console.log('Fetching comprehensive gradebook from Canvas...');
                const gradebook = { courses: [] };
                
                for await (const course of canvas.listItems('courses')) {
                    if (!course.end_at || new Date(course.end_at) > new Date()) { // Only include active courses
                        console.log(`Processing course: ${course.name} (${course.id})`);
                        
                        // Get assignments and submissions for this course
                        const assignments = [];
                        const submissions = [];
                        
                        for await (const assignment of canvas.listItems(`courses/${course.id}/assignments`)) {
                            assignments.push(assignment);
                        }
                        
                        for await (const submission of canvas.listItems(`courses/${course.id}/students/submissions`, { 'student_ids[]': 'self' })) {
                            submissions.push(submission);
                        }
                        
                        // Calculate course grade
                        let totalScore = 0;
                        let totalPossible = 0;
                        const courseAssignments = [];
                        
                        for (const assignment of assignments) {
                            const submission = submissions.find(s => s.assignment_id === assignment.id);
                            
                            if (assignment.points_possible > 0 && submission && submission.submitted_at) {
                                totalScore += submission.score || 0;
                                totalPossible += assignment.points_possible || 0;
                            }
                            
                            courseAssignments.push({
                                id: assignment.id,
                                name: assignment.name,
                                score: submission ? submission.score : null,
                                points_possible: assignment.points_possible,
                                due_at: assignment.due_at,
                                submitted_at: submission ? submission.submitted_at : null,
                                grade: submission ? submission.grade : null,
                                late: submission ? submission.late : false,
                                missing: submission ? submission.missing : false,
                                workflow_state: submission ? submission.workflow_state : null
                            });
                        }
                        
                        const finalScore = totalPossible > 0 ? (totalScore / totalPossible) * 100 : 100;

                        gradebook.courses.push({
                            id: course.id,
                            name: course.name,
                            course_code: course.course_code,
                            grade: `${finalScore.toFixed(2)}%`,
                            total_score: totalScore,
                            total_possible: totalPossible,
                            assignments: courseAssignments,
                            enrollment_state: course.enrollment_state,
                            workflow_state: course.workflow_state
                        });
                    }
                }
                data = gradebook;
                break;

            case 'getDiscussions':
                if (!courseId) {
                    return { statusCode: 400, body: JSON.stringify({ error: 'Course ID required' }) };
                }
                console.log(`Fetching discussions for course ${courseId}...`);
                const discussions = [];
                for await (const discussion of canvas.listItems(`courses/${courseId}/discussion_topics`)) {
                    discussions.push({
                        id: discussion.id,
                        title: discussion.title,
                        message: discussion.message,
                        author: discussion.author,
                        created_at: discussion.created_at,
                        updated_at: discussion.updated_at,
                        discussion_subentry_count: discussion.discussion_subentry_count,
                        read_state: discussion.read_state,
                        unread_count: discussion.unread_count,
                        subscribed: discussion.subscribed,
                        assignment_id: discussion.assignment_id,
                        delayed_post_at: discussion.delayed_post_at,
                        published: discussion.published,
                        lock_at: discussion.lock_at,
                        html_url: discussion.html_url
                    });
                }
                data = { discussions };
                break;

            case 'getAnnouncements':
                if (!courseId) {
                    return { statusCode: 400, body: JSON.stringify({ error: 'Course ID required' }) };
                }
                console.log(`Fetching announcements for course ${courseId}...`);
                const announcements = [];
                for await (const announcement of canvas.listItems(`courses/${courseId}/discussion_topics`, { 'only_announcements': true })) {
                    announcements.push({
                        id: announcement.id,
                        title: announcement.title,
                        message: announcement.message,
                        author: announcement.author,
                        created_at: announcement.created_at,
                        updated_at: announcement.updated_at,
                        read_state: announcement.read_state,
                        unread_count: announcement.unread_count,
                        subscribed: announcement.subscribed,
                        delayed_post_at: announcement.delayed_post_at,
                        published: announcement.published,
                        lock_at: announcement.lock_at,
                        html_url: announcement.html_url
                    });
                }
                data = { announcements };
                break;

            case 'getCalendarEvents':
                console.log('Fetching calendar events...');
                const events = [];
                for await (const event of canvas.listItems('calendar_events')) {
                    events.push({
                        id: event.id,
                        title: event.title,
                        description: event.description,
                        start_at: event.start_at,
                        end_at: event.end_at,
                        location_name: event.location_name,
                        location_address: event.location_address,
                        context_code: event.context_code,
                        effective_context_code: event.effective_context_code,
                        all_context_codes: event.all_context_codes,
                        workflow_state: event.workflow_state,
                        hidden: event.hidden,
                        parent_event_id: event.parent_event_id,
                        child_events_count: event.child_events_count,
                        child_events: event.child_events,
                        url: event.url,
                        html_url: event.html_url,
                        all_day_date: event.all_day_date,
                        all_day: event.all_day,
                        created_at: event.created_at,
                        updated_at: event.updated_at
                    });
                }
                data = { events };
                break;

            case 'getUpcomingAssignments':
                console.log('Fetching upcoming assignments...');
                const upcoming = [];
                const now = new Date();
                const twoWeeksFromNow = new Date(now.getTime() + (14 * 24 * 60 * 60 * 1000));
                
                for await (const course of canvas.listItems('courses')) {
                    if (!course.end_at || new Date(course.end_at) > now) {
                        for await (const assignment of canvas.listItems(`courses/${course.id}/assignments`)) {
                            if (assignment.due_at) {
                                const dueDate = new Date(assignment.due_at);
                                if (dueDate >= now && dueDate <= twoWeeksFromNow) {
                                    upcoming.push({
                                        id: assignment.id,
                                        name: assignment.name,
                                        course_id: course.id,
                                        course_name: course.name,
                                        due_at: assignment.due_at,
                                        points_possible: assignment.points_possible,
                                        submission_types: assignment.submission_types,
                                        html_url: assignment.html_url
                                    });
                                }
                            }
                        }
                    }
                }
                
                // Sort by due date
                upcoming.sort((a, b) => new Date(a.due_at) - new Date(b.due_at));
                data = { upcoming_assignments: upcoming };
                break;

            case 'getDashboard':
                console.log('Fetching dashboard information...');
                const dashboard = {
                    courses: [],
                    upcoming_assignments: [],
                    recent_activity: []
                };
                
                // Get active courses
                for await (const course of canvas.listItems('courses')) {
                    if (!course.end_at || new Date(course.end_at) > new Date()) {
                        dashboard.courses.push({
                            id: course.id,
                            name: course.name,
                            course_code: course.course_code,
                            enrollment_state: course.enrollment_state,
                            needs_grading_count: course.needs_grading_count
                        });
                    }
                }
                
                // Get upcoming assignments (next 7 days)
                const today = new Date();
                const nextWeek = new Date(today.getTime() + (7 * 24 * 60 * 60 * 1000));
                
                for await (const course of canvas.listItems('courses')) {
                    if (!course.end_at || new Date(course.end_at) > today) {
                        for await (const assignment of canvas.listItems(`courses/${course.id}/assignments`)) {
                            if (assignment.due_at) {
                                const dueDate = new Date(assignment.due_at);
                                if (dueDate >= today && dueDate <= nextWeek) {
                                    dashboard.upcoming_assignments.push({
                                        id: assignment.id,
                                        name: assignment.name,
                                        course_id: course.id,
                                        course_name: course.name,
                                        due_at: assignment.due_at,
                                        points_possible: assignment.points_possible
                                    });
                                }
                            }
                        }
                    }
                }
                
                dashboard.upcoming_assignments.sort((a, b) => new Date(a.due_at) - new Date(b.due_at));
                data = dashboard;
                break;

            default:
                return { statusCode: 400, body: JSON.stringify({ error: 'Invalid action specified.' }) };
        }
        
        return { statusCode: 200, body: JSON.stringify(data) };

    } catch (error) {
        console.error('Canvas API error:', error);
        return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
    }
}

router.post('/', async (req, res) => {
    try {
        const result = await handleRequest(req);
        res.status(result.statusCode).json(JSON.parse(result.body));
    } catch (error) {
        console.error('Express router error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

export { router }; 