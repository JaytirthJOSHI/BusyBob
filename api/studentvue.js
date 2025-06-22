import StudentVue from 'studentvue';
import express from 'express';

const router = express.Router();

async function handleRequest(body) {
    console.log('StudentVue API request body:', body);
    const { districtUrl, username, password, action } = body;

    if (!districtUrl || !username || !password || !action) {
        console.error('Missing required parameters:', { districtUrl, username, password, action });
        return {
            statusCode: 400,
            body: JSON.stringify({ error: 'Missing required parameters.' }),
        };
    }

    // Validate district URL format
    if (!districtUrl.startsWith('http://') && !districtUrl.startsWith('https://')) {
        return {
            statusCode: 400,
            body: JSON.stringify({ error: 'Invalid district URL format. Must start with http:// or https://' }),
        };
    }

    let client;
    try {
        console.log('Attempting to login to StudentVue...');
        client = await StudentVue.login(districtUrl, { username, password });
        console.log('Successfully logged in to StudentVue');
    } catch (error) {
        console.error('StudentVue login failed:', { message: error.message, stack: error.stack });
        
        // Provide more specific error messages
        let errorMessage = error.message;
        if (error.message.includes('55816')) {
            errorMessage = 'Invalid username or password. Please check your credentials.';
        } else if (error.message.includes('network')) {
            errorMessage = 'Network error. Please check your internet connection.';
        } else if (error.message.includes('timeout')) {
            errorMessage = 'Connection timeout. Please try again.';
        }
        
        return {
            statusCode: 401, // Unauthorized
            body: JSON.stringify({ error: `StudentVue login failed: ${errorMessage}` }),
        };
    }
        
    let data;
    console.log(`Fetching data for action: ${action}`);

    try {
        switch (action) {
            case 'getGradebook':
                data = await client.getGradebook();
                break;
            case 'getSchedule':
                data = await client.getSchedule();
                break;
            case 'getAttendance':
                data = await client.getAttendance();
                break;
            case 'getSchoolInfo':
                data = await client.getSchoolInfo();
                break;
            case 'getCalendar':
                data = await client.getCalendar();
                break;
            default:
                console.error('Invalid action specified:', action);
                return {
                    statusCode: 400,
                    body: JSON.stringify({ error: 'Invalid action specified.' }),
                };
        }
        
        console.log(`Successfully fetched data for ${action}:`, data ? 'Data received' : 'No data');
        return {
            statusCode: 200,
            body: JSON.stringify(data),
        };

    } catch (error) {
        console.error(`Error during StudentVue API action "${action}":`, {
            message: error.message,
            stack: error.stack,
            name: error.name
        });
        return {
            statusCode: 500,
            body: JSON.stringify({ error: `Failed to fetch ${action} from StudentVue: ${error.message}` }),
        };
    }
}

// Express router for handling StudentVue API requests
router.post('/', async (req, res) => {
    try {
        const result = await handleRequest(req.body);
        res.status(result.statusCode).json(JSON.parse(result.body));
    } catch (error) {
        console.error('Express router error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Export the router for Express
export { router }; 