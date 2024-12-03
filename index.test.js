import { checkIfEpisodeMatchesFormatInBatch, classifyFile, generateNewFilePathIncludingParentFolders, getDetails, getEpisodeNumber, getSeasonNumber, getSeriesName } from "./lib";
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

describe("Get series name from filename", () => {

    it("Should return the series name", async () => {

        const showName = await getSeriesName("Movies/series/Temptation Island/Season 04/Temptation.Island.2019.S04E03.1080p.PCOK.WEB-DL.DDP5.1.x264-");
        expect(showName).toBe("Temptation Island");

    });

    it("Should return the series name without the year", async () => {

        const showName = await getSeriesName("/rename/Movies/series/Rome (2005) - 1080p Bluray AV1 OPUS 5.1 -jenkins/Season 01/Rome S01E01.mkv");
        expect(showName).toBe("Rome");

    });

    it("Should return the series name without any additions", async () => {
        
        const showName = await getSeriesName("/rename/Movies/series/Star Wars The Clone Wars/Season S02/Star Wars The Clone Wars S02E20.mkv");
        expect(showName).toBe("Star Wars The Clone Wars");
    
    });

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

describe("Generate correct parent folders", () => {

    it("Should return the correct parent folders for an episode", async () => {

        const episodeName = "The Last of Us S01E01.mkv"

        const newEpisodeName = await generateNewFilePathIncludingParentFolders(episodeName);

        expect(newEpisodeName).toBe("The Last of Us/Season 01/The Last of Us S01E01.mkv");

    });
    it("Should return the correct parent folders for an episode without any additions", async () => {

        const episodeName = "Star Wars The Clone Wars S02E20.mkv"

        const newEpisodeName = await generateNewFilePathIncludingParentFolders(episodeName);

        expect(newEpisodeName).toBe("Star Wars The Clone Wars/Season 02/Star Wars The Clone Wars S02E20.mkv");

    });
    it("Should return the correct parent folders for an episode without any shortenings", async () => {

        const episodeName = "Star Wars The Clone Wars S03E20.mkv"

        const newEpisodeName = await generateNewFilePathIncludingParentFolders(episodeName);

        expect(newEpisodeName).toBe("Star Wars The Clone Wars/Season 03/Star Wars The Clone Wars S03E20.mkv");

    });

})