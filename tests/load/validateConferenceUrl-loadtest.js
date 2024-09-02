import http from 'k6/http';
import { check, group, sleep } from 'k6';
//import { API_URL, validURL, inValidURL } from '../../Constants.json';  // Import constants

// Global variable to store session ID
let sessionId;

// Setup function to authenticate and get session ID
export function setup() {
    const loginUrl = `${API_URL}/login`;
    const loginResponse = http.post(loginUrl, JSON.stringify({
        username: __ENV.API_USERNAME,
        password: __ENV.API_PASSWORD,
        persistMe: null,
    }), {
        headers: {
            'Accept': '*/*',
            'content-type': 'application/json',
        },
    });

    if (loginResponse.status !== 200) {
        throw new Error('Login failed');
    }

    // Extract session ID from the response cookies or response data
    const cookies = loginResponse.headers['Set-Cookie'] || [];
    const csrfCookie = cookies.find(cookie => cookie.startsWith('_csrf-integration'));
    const mtsApSouth1 = cookies.find(cookie => cookie.startsWith('mts-ap-south-1'));

    if (!csrfCookie || !mtsApSouth1) {
        throw new Error('Required cookies not found');
    }

    const authResponse = http.post(`${API_URL}/wapi/auth`, {}, {
        headers: {
            'Accept': '*/*',
            'content-type': 'application/json',
            'Cookie': `${csrfCookie}; ${mtsApSouth1}`,
        },
    });

    if (authResponse.status !== 200) {
        throw new Error('Auth request failed');
    }

    sessionId = authResponse.json().sessionId;
    return { sessionId };
}

export default function (data) {
    group('Validate valid URL', function () {
        const response = http.post(`${API_URL}/callai/apollo-server/graphapi`, JSON.stringify({
            query: `query validateConferenceUrl($url: String!) {
                validateConferenceUrl(url: $url) {
                    errorCode
                    success
                }
            }`,
            variables: {
                url: validURL,
            },
        }), {
            headers: {
                'x-token': data.sessionId,
                'Content-Type': 'application/json',
            },
        });

        check(response, {
            'status is 200': (r) => r.status === 200,
            'response has data': (r) => r.json().data && r.json().data.validateConferenceUrl,
            'success is true': (r) => r.json().data.validateConferenceUrl.success === true,
        });

        sleep(1);
    });

    group('Validate invalid URL', function () {
        const response = http.post(`${API_URL}/callai/apollo-server/graphapi`, JSON.stringify({
            query: `query validateConferenceUrl($url: String!) {
                validateConferenceUrl(url: $url) {
                    errorCode
                    success
                }
            }`,
            variables: {
                url: inValidURL,
            },
        }), {
            headers: {
                'x-token': data.sessionId,
                'Content-Type': 'application/json',
            },
        });

        check(response, {
            'status is 200': (r) => r.status === 200,
            'errorCode is INVALID_URL': (r) => r.json().data.validateConferenceUrl.errorCode === 'INVALID_URL',
            'success is false': (r) => r.json().data.validateConferenceUrl.success === false,
        });

        sleep(1);
    });
}