import { getEpisodeNumber } from "./lib";
import { request } from "./api";

const defaultTimeout = 1000 * 30;

test('Ollama API request', async () => {

    const response = await request('You should exactly return the JSON Object { "test": true }', 'Only return the JSON Object { "test": true }');
    expect(response).toBeDefined();

}, defaultTimeout);

test("Get episode number from filename", async () => {

    const episodeNumber = await getEpisodeNumber("Movies/series/Temptation Island/Season 04/Temptation.Island.2019.S04E03.1080p.PCOK.WEB-DL.DDP5.1.x264-");

    expect(episodeNumber).toBe(3);

}, defaultTimeout);