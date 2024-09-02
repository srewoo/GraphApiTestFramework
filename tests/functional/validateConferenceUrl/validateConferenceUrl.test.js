// tests/functional/api1/api1-tests.js
import axios from 'axios';
import login from '../../../config/authConfig.js';
import Ajv from 'ajv';
import schema from './validateConferenceUrl-schema.json' assert { type: 'json' };
import { expect } from 'chai';
import Constants from '../../../Constants.json' assert { type: 'json' };


const ajv = new Ajv();
const validate = ajv.compile(schema);

describe('API Tests: validateConferenceUrl:', () => {
  let sessionId;

  before(async () => {
    // Authenticate and get token
    sessionId = await login();
    expect(sessionId).to.exist;
  });

  it('Validate valid URL test', async () => {
    const response = await axios.post(
      `${Constants.API_URL}/callai/apollo-server/graphapi`, {
      query: `query validateConferenceUrl($url: String!) {
                    validateConferenceUrl(url: $url) {
                        errorCode
                        success
                    }
                }`,
      variables: {
        url: Constants.validURL,
      },
    },
      {
        headers: {
          'x-token': sessionId,
        },
      }
    );

    // Validate response status and structure
    expect(response.status).to.equal(200);
    expect(response.data).to.have.property('data');
    expect(response.data.data).to.have.property('validateConferenceUrl');

    // Check schema validation
    const isValid = validate(response.data);
    expect(isValid).to.be.true;
    if (!isValid) {
      console.error('Schema validation errors:', validate.errors);
    }
  });

  it('Validate invalid URL test', async () => {
    const response = await axios.post(
      `${Constants.API_URL}/callai/apollo-server/graphapi`,
      {
        query: `query validateConferenceUrl($url: String!) {
                    validateConferenceUrl(url: $url) {
                        errorCode
                        success
                    }
                }`,
        variables: {
          url: Constants.inValidURL,
        },
      },
      {
        headers: {
          'x-token': sessionId,
        },
      }
    );

    // Validate response status and structure
    expect(response.status).to.equal(200);
    expect(response.data.data.validateConferenceUrl.errorCode).to.eq('INVALID_URL')
    expect(response.data.data.validateConferenceUrl.success).to.be.false


  });

});
