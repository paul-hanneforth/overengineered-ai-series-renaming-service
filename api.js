import { Ollama } from 'ollama'
import pino from 'pino'

const logger = pino({
    level: process.env.NODE_ENV === "development" ? 'debug' : "info"
});

// Setting up the Ollama API
const ollama = new Ollama({
    host: process.env.OLLAMA_HOST || 'http://localhost:11434'
})

/**
 * @typedef {object} Example
 * @property {string} input
 * @property {string} output
 */
/**
 * Request the Ollama API and ensures that only JSON is returned 
 * @param {string} system 
 * @param {string} input
 * @param {Example[]} examples
 * @returns {Promise<object>} - A JSON object response from the Ollama API.
 */
const request = async (system, input, examples = []) => {
    try {
        
        // Sending the prompt to Ollama API and getting a response
        const modifiedPrompt = input + '```json';

        const messages = examples.map(example => [ {
            role: 'user',
            content: example.input
        }, {
            role: 'assistant',
            content: example.output
        } ])
        const destructured = messages.reduce((acc, val) => acc.concat(val), []);

        const response = await ollama.chat({
            model: 'llama3.2',
            messages: [
                { role: 'system', content: system },
                ...destructured,
                { role: 'user', content: modifiedPrompt },
            ],
            options: { stop: ["```"] }
        });

        logger.debug(`Ollama API response: ${response.message.content}`);

        // Returning the response message content as JSON
        try {
            return JSON.parse(response.message.content);
        } catch(e) {
            logger.warn(`Failed to parse JSON response from Ollama API: ${response.message.content}`);
            throw e;
        }
    } catch (error) {
        // Handling any errors and returning a JSON error message
        throw new Error(error);
    }
}

/**
 * Request the Ollama API and ensures that only JSON is returned. If the request fails, the function will try again.
 * @param {string} system 
 * @param {string} input
 * @param {Object[]} [ examples ]
 * @param {string} examples[].input
 * @param {string} examples[].output
 * @returns {Promise<object>} - A JSON object response from the Ollama API.
 */
const requestRetryWrapper = async (system, input, examples) => {
    let tries = 0;

    while (tries < 15) {
        try {

            const response = await request(system, input, examples);

            return response;

        } catch (error) {
            logger.warn(`Failed to get a valid JSON response from Ollama API: ${error.message}. Trying again ...`);
            tries++;
        }
    }
}

class RequestMap extends Map {
    /**
     * @param {Request} request 
     * @returns {object}
     */
    get(request) {
        return super.get(JSON.stringify(request));
    }
    /**
     * @param {Request} request 
     * @param {object} response 
     */
    set(request, response) {
        return super.set(JSON.stringify(request), response);
    }
    /**
     * @param {Request} request
     * @returns {boolean}
     */
    has(request) {
        return super.has(JSON.stringify(request));
    }
}

/**
 * @typedef {object} Request
 * @property {string} system
 * @property {string} input
 * @property {Example[]} [ examples ]
 */
let requestCache = new RequestMap();

/**
 * Request the Ollama API and ensures that only JSON is returned. If the request fails, the function will try again. It will also cache the request and response.
 * @param {string} system 
 * @param {string} input
 * @param {Object[]} [ examples ]
 * @param {string} examples[].input
 * @param {string} examples[].output
 * @returns {Promise<object>} - A JSON object response from the Ollama API.
 */
const requestWrapper = async (system, input, examples) => {

    // Check if the request has been cached
    const request = { system, input, examples };
    if (requestCache.has(request)) {
        logger.debug(`Using cache: ${JSON.stringify(request)}`);
        return requestCache.get(request);
    }

    // Request the Ollama API and cache the response
    const response = await requestRetryWrapper(system, input, examples);
    requestCache.set(request, response);

    return response;

}



export { requestWrapper as request }