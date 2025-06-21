const StudentVue = require('studentvue.js');

async function handleRequest(body) {
    const { districtUrl, username, password, action } = body;

    if (!districtUrl || !username || !password || !action) {
        return {
            statusCode: 400,
            body: JSON.stringify({ error: 'Missing required parameters.' }),
        };
    }

    try {
        const client = await StudentVue.login(districtUrl, username, password);
        let data;

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
                return {
                    statusCode: 400,
                    body: JSON.stringify({ error: 'Invalid action specified.' }),
                };
        }
        
        return {
            statusCode: 200,
            body: JSON.stringify(data),
        };

    } catch (error) {
        console.error(`StudentVue API error for action "${action}":`, error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: `Failed to fetch data from StudentVue. ${error.message}` }),
        };
    }
}

// This is the standard entry point for Vercel Serverless Functions
module.exports = async (req, res) => {
    if (req.method !== 'POST') {
        res.status(405).send('Method Not Allowed');
        return;
    }

    const result = await handleRequest(req.body);
    res.status(result.statusCode).json(JSON.parse(result.body));
}; 