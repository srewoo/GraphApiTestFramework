import axios from 'axios';
import dotenv from 'dotenv';
import constants from '../Constants.json' assert { type: 'json' };




// Load environment variables from .env file
dotenv.config();
const { API_USERNAME, API_PASSWORD } = process.env;


export default async function login() {
    try {
        // First API call to login and retrieve cookies
        const loginResponse = await axios.post(
            `${constants.API_URL}/login`,
            {
                username: API_USERNAME,
                password: API_PASSWORD,
                persistMe: null
            },
            {
                headers: {
                    'Accept': '*/*',
                    'content-type': 'application/json'
                },
                withCredentials: true // Ensures cookies are stored
            }
        );

        // Check response status
        if (loginResponse.status !== 200) {
            console.error('Login failed with status:', loginResponse.status);
            console.error('Response data:', loginResponse.data);
            throw new Error('Failed to authenticate: Check login credentials or endpoint');
        }

        // Extract cookies from the response
        const cookies = loginResponse.headers['set-cookie'] || [];
        const csrfCookie = cookies.find(cookie => cookie.startsWith('_csrf-integration'));
        const mtsApSouth1 = cookies.find(cookie => cookie.startsWith('mts-ap-south-1'));

        if (!csrfCookie || !mtsApSouth1) {
            throw new Error('Authentication failed. Required cookies not found in response.');
        }

        // Second API call to authenticate using the obtained cookies
        const authResponse = await axios.post(
            `${constants.API_URL}/wapi/auth`,
            {},
            {
                headers: {
                    'Accept': '*/*',
                    'content-type': 'application/json',
                    'Cookie': `${csrfCookie}; ${mtsApSouth1}`
                }
            }
        );

        // Extract the session ID or any other required information
        const sessionId = authResponse.data.sessionId;

        if (!sessionId) {
            console.error('Auth Response:', authResponse.data);
            throw new Error('Session ID is undefined. Authentication failed.');
        }

        // Return the session ID for use in subsequent API requests
        return sessionId;
    } catch (error) {
        console.error('Error during authentication:', error.response ? error.response.data : error.message);
        throw error;
    }
}

/* Run the login function if this script is executed directly
if (import.meta.url === new URL(import.meta.url).href) {
    login().then(sessionId => console.log('Logged in successfully, Session ID:', sessionId))
           .catch(error => console.error('Login failed:', error));
}*/
