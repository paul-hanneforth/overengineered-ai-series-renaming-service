import { checkIfEpisodeMatchesFormatInBatch, classifyFile, getDetails, getEpisodeNumber, getSeasonNumber, getSeriesName } from "./lib";
import { request } from "./api";
import { jest } from '@jest/globals'

const defaultTimeout = 1000 * 60 * 5;

jest.setTimeout(defaultTimeout);

test('Ollama API request', async () => {

    const response = await request('You should exactly return the JSON Object { "test": true }', 'Only return the JSON Object { "test": true }');
    expect(response).toBeDefined();

});

test("Get episode number from filename", async () => {

    const episodeNumber = await getEpisodeNumber("Movies/series/Temptation Island/Season 04/Temptation.Island.2019.S04E03.1080p.PCOK.WEB-DL.DDP5.1.x264-");

    expect(episodeNumber).toBe(3);

});

test("Get season number from filename", async () => {

    const seasonNumber = await getSeasonNumber("Movies/series/Temptation Island/Season 04/Temptation.Island.2019.S04E03.1080p.PCOK.WEB-DL.DDP5.1.x264-");

    expect(seasonNumber).toBe(4);

});

test("Get series name from filename", async () => {

    const showName = await getSeriesName("Movies/series/Temptation Island/Season 04/Temptation.Island.2019.S04E03.1080p.PCOK.WEB-DL.DDP5.1.x264-");

    expect(showName).toBe("Temptation Island");

});

describe("Classify file", () => {
    
    it("Should return 'Episode' if file is a series", async () => {
        const type = await classifyFile("Movies/series/Temptation Island/Season 04/Temptation.Island.2019.S04E03.1080p.PCOK.WEB-DL.DDP5.1.x264-");
        expect(type).toBe("Episode");
    });

    it("Should return 'Movie' if file is a movie", async () => {
        const type = await classifyFile("Movies/series/Temptation Island/Temptation Island - The Movie");
        expect(type).toBe("Movie");
    });

    it("Should return 'Unrelated' if file is neither a movie nor a series", async () => {
        const type = await classifyFile("Movies/series/Temptation Island/Season 04/.DS_Store");
        expect(type).toBe("Unrelated");
    });

});

describe("Get details from filename", () => {

    let details;

    beforeAll(async () => {
        details = await getDetails("Movies/series/Temptation Island/Season 04/Temptation.Island.2019.S04E03.1080p.PCOK.WEB-DL.DDP5.1.x264-");
    })

    it("Should return series name", () => {
        expect(details.series).toBe("Temptation Island");
    })
    it("Should return season number", () => {
        expect(details.season).toBe(4);
    })
    it("Should return episode number", () => {
        expect(details.episode).toBe(3);
    })

})

describe("Check if episode matches format", () => {

    it("Should return true if no episodes are provided", async () => {

        const match1 = await checkIfEpisodeMatchesFormatInBatch([]);
        expect(match1).toBe(true);

    })
    it("Should return true if episode matches format", async () => {

        const episodesInRightFormat = [
            "Movies/series/Temptation Island/Season 04/Temptation Island S04E03",
            "Movies/series/Temptation Island/Season 04/Temptation Island S04E04",
            "Movies/series/Temptation Island/Season 04/Temptation Island S04E05",
        ]
    
        const match1 = await checkIfEpisodeMatchesFormatInBatch(episodesInRightFormat);
        expect(match1).toBe(true);

        const episodesInRightFormat2 = [
            "Movies/series/Family Guy/Season 01/Family Guy S01E03",
            "Movies/series/Family Guy/Season 01/Family Guy S01E04",
            "Movies/series/Family Guy/Season 01/Family Guy S01E05",
        ]
    
        const match2 = await checkIfEpisodeMatchesFormatInBatch(episodesInRightFormat2);
        expect(match2).toBe(true);

        const episodesInRightFormat3 = [
            "/Volumes/Movies/series/3 Body Problem/Season 01/3 Body Problem S01E01.mkv",
            "/Volumes/Movies/series/3 Body Problem/Season 01/3 Body Problem S01E02.mkv",
            "/Volumes/Movies/series/3 Body Problem/Season 01/3 Body Problem S01E03.mkv",
        ]

        const match3 = await checkIfEpisodeMatchesFormatInBatch(episodesInRightFormat3);
        expect(match3).toBe(true);

    });

    it("Should return false if episode does not match format", async () => {
        
        const episodesInWrongFormat = [
            "Movies/series/Temptation Island/Season 04/Temptation.Island.2019.S04E03.1080p.PCOK.WEB-DL.DDP5.1.x264-",
            "Movies/series/Temptation Island/Season 04/Temptation.Island.2019.S04E04.1080p.PCOK.WEB-DL.DDP5.1.x264-",
            "Movies/series/Temptation Island/Season 04/Temptation.Island.2019.S04E05.1080p.PCOK.WEB-DL.DDP5.1.x264-",
        ];
    
        const match1 = await checkIfEpisodeMatchesFormatInBatch(episodesInWrongFormat);
        expect(match1).toBe(false);

    });

});