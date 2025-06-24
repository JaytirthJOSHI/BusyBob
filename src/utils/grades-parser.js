export function getGradeColor(percentage) {
    if (percentage >= 90) return 'green';
    if (percentage >= 80) return 'blue';
    if (percentage >= 70) return 'yellow';
    if (percentage >= 60) return 'orange';
    return 'red';
}

export function calculateGPA(grades) {
    if (!grades || grades.length === 0) return 'N/A';

    const totalPoints = grades.reduce((sum, course) => {
        const percentage = course.percentage;
        if (percentage >= 90) return sum + 4.0;
        if (percentage >= 80) return sum + 3.0;
        if (percentage >= 70) return sum + 2.0;
        if (percentage >= 60) return sum + 1.0;
        return sum + 0.0;
    }, 0);

    return (totalPoints / grades.length).toFixed(2);
}

export function parseGradebook(gradebook) {
    const grades = [];
    try {
        if (!gradebook || !gradebook.Gradebook || !gradebook.Gradebook.Courses || !gradebook.Gradebook.Courses.Course) {
            console.warn('Gradebook data is not in the expected format.', gradebook);
            return [];
        }

        const courses = Array.isArray(gradebook.Gradebook.Courses.Course)
            ? gradebook.Gradebook.Courses.Course
            : [gradebook.Gradebook.Courses.Course];

        courses.forEach(course => {
            let marks = course.Marks?.Mark;
            if (marks && !Array.isArray(marks)) marks = [marks];
            const mark = marks && marks.length > 0 ? marks[0] : null;

            let assignments = [];
            if (mark && mark.Assignments && mark.Assignments.Assignment) {
                assignments = Array.isArray(mark.Assignments.Assignment)
                    ? mark.Assignments.Assignment
                    : [mark.Assignments.Assignment];
            }

            grades.push({
                name: course.Title || course.CourseName || 'Unknown Course',
                teacher: course.Staff || course.Teacher || 'Unknown Teacher',
                period: course.Period || '',
                grade: mark?.CalculatedScoreString || 'N/A',
                percentage: parseFloat(mark?.CalculatedScoreRaw) || 0,
                assignments: assignments.map(assignment => ({
                    name: assignment.Measure || assignment.Name || 'Unknown Assignment',
                    score: assignment.ScoreCalValue || assignment.DisplayScore || assignment.Point || 'N/A',
                    maxScore: assignment.ScoreMaxValue || assignment.PointPossible || 'N/A',
                    dueDate: assignment.DueDate || assignment.Date || '',
                    category: assignment.Type || assignment.Category || 'General',
                    notes: assignment.Notes || '',
                }))
            });
        });
    } catch (error) {
        console.error('Error parsing gradebook:', error);
        // In a utility function, it's better to re-throw or return an error indicator
        // rather than trying to show a UI message directly.
        throw new Error('There was an error parsing your gradebook data.');
    }
    return grades;
}

export function parseAssignments(calendar) {
    const assignments = [];
    try {
        if (calendar?.CalendarListing?.EventLists?.EventList) {
            const eventLists = Array.isArray(calendar.CalendarListing.EventLists.EventList)
                ? calendar.CalendarListing.EventLists.EventList
                : [calendar.CalendarListing.EventLists.EventList];
            
            eventLists.forEach(eventList => {
                if (eventList && Array.isArray(eventList)) {
                    eventList.forEach(event => {
                        if (event && (event.DayType === 'Assignment' || event.DayType === 'Homework' || event.Title?.includes('Assignment'))) {
                            assignments.push({
                                name: event.Title || 'Unknown Assignment',
                                dueDate: event.Date || '',
                                course: event.Course || 'Unknown Course',
                                description: event.Description || '',
                                type: event.DayType || 'Assignment'
                            });
                        }
                    });
                }
            });
            return assignments;
        }

        if (calendar?.StudentCalendar?.Events?.Event) {
            const events = Array.isArray(calendar.StudentCalendar.Events.Event)
                ? calendar.StudentCalendar.Events.Event
                : [calendar.StudentCalendar.Events.Event];
            
            events.forEach(event => {
                if (event && (event.Type === 'Assignment' || event.Type === 'Homework')) {
                    assignments.push({
                        name: event.Title || 'Unknown Assignment',
                        dueDate: event.StartDate || '',
                        course: event.Course || 'Unknown Course',
                        description: event.Description || '',
                        type: event.Type || 'Assignment'
                    });
                }
            });
            return assignments;
        }
        
        console.warn('Calendar data is not in the expected format.', calendar);
        return [];
    } catch (error) {
        console.error('Error parsing assignments:', error);
        throw new Error('There was an error parsing your assignments data.');
    }
}

export function parseAttendance(attendanceData) {
    if (!attendanceData || !attendanceData.Attendance) {
        console.warn('Attendance data not in any expected format.', attendanceData);
        return null;
    }
    return attendanceData.Attendance;
}

export function parseSchedule(scheduleData) {
    try {
        const schedule = scheduleData?.StudentClassSchedule;
        if (!schedule) {
            console.warn('Schedule data is missing the "StudentClassSchedule" property.', scheduleData);
            return null;
        }

        const classLists = schedule.ClassLists;
        if (!classLists) {
            console.warn('Schedule data is missing the "ClassLists" property.', schedule);
            return null;
        }

        let classes = [];
        if (classLists.ClassListing) {
            classes = Array.isArray(classLists.ClassListing) ? classLists.ClassListing : [classLists.ClassListing];
        } else if (classLists.Class) {
            classes = Array.isArray(classLists.Class) ? classLists.Class : [classLists.Class];
        } else if (Array.isArray(classLists)) {
            classes = classLists;
        } else {
            console.warn('Could not find a class list in "ClassLists".', classLists);
            return null;
        }
        
        return {
            type: 'StudentClassSchedule',
            classes: classes.map(cls => ({
                period: cls['@Period'] || 'N/A',
                name: cls['@CourseTitle'] || 'Unknown Course',
                teacher: cls['@Teacher'] || 'Unknown Teacher',
                room: cls['@RoomName'] || 'N/A',
                email: cls['@TeacherEmail'] || '',
            })),
            schoolName: schedule['@SchoolName'] || 'Unknown School',
        };
    } catch (error) {
        console.error('Error parsing schedule:', error);
        throw new Error('There was an error parsing your schedule data.');
    }
}



