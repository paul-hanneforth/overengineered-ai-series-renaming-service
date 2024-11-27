import { request } from "./api";

test('Ollama API request', async () => {

    const response = await request('You should exactly return the JSON Object { "test": true }', 'Only return the JSON Object { "test": true }');
    expect(response).toBeDefined();

}, 1000 * 30);