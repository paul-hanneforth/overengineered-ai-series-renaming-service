import { checkIfEpisodeMatchesFormatInBatch, getDetails, getEpisodeNumber, getSeasonNumber, getSeriesName } from "./lib";
import { request } from "./api";

const defaultTimeout = 1000 * 60 * 5;

test('Ollama API request', async () => {

    const response = await request('You should exactly return the JSON Object { "test": true }', 'Only return the JSON Object { "test": true }');
    expect(response).toBeDefined();

}, defaultTimeout);

test("Get episode number from filename", async () => {

    const episodeNumber = await getEpisodeNumber("Movies/series/Temptation Island/Season 04/Temptation.Island.2019.S04E03.1080p.PCOK.WEB-DL.DDP5.1.x264-");

    expect(episodeNumber).toBe(3);

}, defaultTimeout);

test("Get season number from filename", async () => {

    const seasonNumber = await getSeasonNumber("Movies/series/Temptation Island/Season 04/Temptation.Island.2019.S04E03.1080p.PCOK.WEB-DL.DDP5.1.x264-");

    expect(seasonNumber).toBe(4);

}, defaultTimeout);

test("Get series name from filename", async () => {

    const showName = await getSeriesName("Movies/series/Temptation Island/Season 04/Temptation.Island.2019.S04E03.1080p.PCOK.WEB-DL.DDP5.1.x264-");

    expect(showName).toBe("Temptation Island");

}, defaultTimeout);

test("Get details from filename", async () => {

    const details = await getDetails("Movies/series/Temptation Island/Season 04/Temptation.Island.2019.S04E03.1080p.PCOK.WEB-DL.DDP5.1.x264-");
    
    expect(details.series).toBe("Temptation Island");
    expect(details.season).toBe(4);
    expect(details.episode).toBe(3);

}, defaultTimeout)

test("Check if episodes match format in batch", async () => {

    const episodesInWrongFormat = [
        "Movies/series/Temptation Island/Season 04/Temptation.Island.2019.S04E03.1080p.PCOK.WEB-DL.DDP5.1.x264-",
        "Movies/series/Temptation Island/Season 04/Temptation.Island.2019.S04E04.1080p.PCOK.WEB-DL.DDP5.1.x264-",
        "Movies/series/Temptation Island/Season 04/Temptation.Island.2019.S04E05.1080p.PCOK.WEB-DL.DDP5.1.x264-",
    ];

    const match1 = await checkIfEpisodeMatchesFormatInBatch(episodesInWrongFormat);
    expect(match1).toBe(false);

    const episodesInRightFormat = [
        "Movies/series/Temptation Island/Season 04/Temptation Island S04E03",
        "Movies/series/Temptation Island/Season 04/Temptation Island S04E04",
        "Movies/series/Temptation Island/Season 04/Temptation Island S04E05",
    ]

    const match2 = await checkIfEpisodeMatchesFormatInBatch(episodesInRightFormat);
    expect(match2).toBe(true);

}, defaultTimeout)