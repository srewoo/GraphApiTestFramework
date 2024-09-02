import axios from 'axios';
import login from '../../../config/authConfig.js';
import Ajv from 'ajv';
import schema from './scheduleCall-schema.json' assert { type: 'json' };
import { expect } from 'chai';
import Constants from '../../../Constants.json' assert { type: 'json' };

const ajv = new Ajv();
const validate = ajv.compile(schema);

describe('API Tests: scheduleCall Mutation', function () {
    let sessionId;

    before(async () => {
        // Authenticate and get the session ID
        sessionId = await login();
        expect(sessionId).to.exist;
        console.log('sessionID is this ' + sessionId);
    });

    it('should schedule a call and include response in the report', async function () {
        // Make the API request
        const response = await axios.post(
            'https://hubspotcallai.integration.mindtickle.com/callai/apollo-server/graphapi',
            {
                query: `
                mutation scheduleCall($title: String!, $url: String!, $participants: [String!]) {
                    scheduleCall(title: $title, url: $url, participants: $participants) {
                        success
                    }
                }`,
                variables: {
                    title: "Impromptu Meeting Call",
                    url: Constants.validURL,
                    participants: ["sharaj.rewoo@mindtickle.com"]
                }
            },
            {
                headers: {
                    'x-token': sessionId,
                    'cache-control': 'no-cache',
                    'content-type': 'application/json',
                    'dnt': '1',
                    'pragma': 'no-cache',
                    'sec-ch-ua-mobile': '?0',
                    'sec-fetch-dest': 'empty',
                    'sec-fetch-mode': 'cors',
                    'sec-fetch-site': 'same-origin',
                    'x-origin': 'admin.integration.mindtickle.com'
                }
            }
        );

        // Log the response for the report
        console.log('API Response:', JSON.stringify(response.data, null, 2));

        // Assertions
        expect(response.status).to.equal(200);
        expect(response.data).to.be.an('object');
        expect(response.data.data).to.have.property('scheduleCall');
        expect(response.data.data.scheduleCall).to.have.property('success').that.is.true;

        // Validate the response against the schema
        const valid = validate(response.data);
        expect(valid, `Schema validation failed: ${JSON.stringify(validate.errors, null, 2)}`).to.be.true;
    });
});