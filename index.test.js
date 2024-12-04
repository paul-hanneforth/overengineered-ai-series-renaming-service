import { checkIfEpisodeMatchesFormatInBatch, checkIfFileIsAlreadyInCorrectFoler, classifyFile, generateNewFilePathIncludingParentFolders, getDetails, getEpisodeNumber, getNewFilePathsIncludingParentFolders, getSeasonNumber, getSeriesName } from "./lib";
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

    it("Should return the series name without the formats", async () => {

        const showName = await getSeriesName("Movies/series/KAOS, 2160p NF WEB-DL DD+ 5.1 Atmos H.265-NTb/Season 01/KAOS S01E01.mkv")
        expect(showName).toBe("KAOS");

    })

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

        const episodeName = "Test/The Last of Us S01E01.mkv"

        const newEpisodeName = await generateNewFilePathIncludingParentFolders(episodeName);

        expect(newEpisodeName).toBe("Test/The Last of Us/Season 01/The Last of Us S01E01.mkv");

    });
    it("Should return the correct parent folders for an episode without any additions", async () => {

        const episodeName = "Test/Star Wars The Clone Wars S02E20.mkv"

        const newEpisodeName = await generateNewFilePathIncludingParentFolders(episodeName);

        expect(newEpisodeName).toBe("Test/Star Wars The Clone Wars/Season 02/Star Wars The Clone Wars S02E20.mkv");

    });
    it("Should return the correct parent folders for an episode without any shortenings", async () => {

        const episodeName = "Test/Star Wars The Clone Wars S03E20.mkv"

        const newEpisodeName = await generateNewFilePathIncludingParentFolders(episodeName);

        expect(newEpisodeName).toBe("Test/Star Wars The Clone Wars/Season 03/Star Wars The Clone Wars S03E20.mkv");

    });

})

describe("Check if episode is already in correct folder", () => {

    it("Should return true if episode is already in correct folder", async () => {
            
        const episodeName = "The Last of Us/Season 01/The Last of Us S01E01.mkv"

        const correctFolder = await checkIfFileIsAlreadyInCorrectFoler(episodeName);

        expect(correctFolder).toBe(true);
    
    })
    it("Should return false if episode is not in correct folder", async () => {

        const episodeName = "The Last of Us S01E01.mkv"

        const correctFolder = await checkIfFileIsAlreadyInCorrectFoler(episodeName);

        expect(correctFolder).toBe(false);

    })

})

describe("Move all files to correct folders", () => {

    it("Should move all episodes from the same seasons to correct folders", async () => {

        const filePaths = [
            "The Last of Us S01E01.mkv",
            "The Last of Us S01E02.mkv",
            "The Last of Us S01E03.mkv",
            "The Last of Us S01E04.mkv",
        ]

        const result = await getNewFilePathsIncludingParentFolders(filePaths);

        expect(result).toStrictEqual([
            "The Last of Us/Season 01/The Last of Us S01E01.mkv",
            "The Last of Us/Season 01/The Last of Us S01E02.mkv",
            "The Last of Us/Season 01/The Last of Us S01E03.mkv",
            "The Last of Us/Season 01/The Last of Us S01E04.mkv",
        ])

    });
    it("Should move all episodes from different seasons to correct folders", async () => {

        const filePaths = [
            "The Last of Us S01E01.mkv",
            "The Last of Us S02E02.mkv",
            "The Last of Us S03E03.mkv",
            "The Last of Us S04E04.mkv",
        ]

        const result = await getNewFilePathsIncludingParentFolders(filePaths);

        expect(result).toStrictEqual([
            "The Last of Us/Season 01/The Last of Us S01E01.mkv",
            "The Last of Us/Season 02/The Last of Us S02E02.mkv",
            "The Last of Us/Season 03/The Last of Us S03E03.mkv",
            "The Last of Us/Season 04/The Last of Us S04E04.mkv",
        ])

    });
    it("Should move all episodes from different series to correct folders", async () => {

        const filePaths = [
            "The Last of Us S01E01.mkv",
            "The Mandalorian S02E02.mkv",
            "The Witcher S01E03.mkv",
        ]

        const result = await getNewFilePathsIncludingParentFolders(filePaths);

        expect(result).toStrictEqual([
            "The Last of Us/Season 01/The Last of Us S01E01.mkv",
            "The Mandalorian/Season 02/The Mandalorian S02E02.mkv",
            "The Witcher/Season 01/The Witcher S01E03.mkv",
        ])

    });
    it.skip("Should reuse existing parent folders (when season is correct)", async () => {

        const filePaths = [
            "Random_Folder/Season 01/The Last of Us S01E01.mkv",
            "The Last of Us S02E02.mkv",
            "The Mandalorian S02E02.mkv",
            "The Witcher S01E03.mkv",
        ]

        const result = await getNewFilePathsIncludingParentFolders(filePaths);

        expect(result).toStrictEqual([
            "Random_Folder/The Last of Us/Season 01/The Last of Us S01E01.mkv",
            "The Last of Us/Season 02/The Last of Us S02E02.mkv",
            "The Mandalorian/Season 02/The Mandalorian S02E02.mkv",
            "The Witcher/Season 01/The Witcher S01E03.mkv",
        ])

    });
    it.skip("Should reuse existing parent folders (when series is correct)", async () => {

        const filePaths = [
            "The Last of Us S01E01.mkv",
            "The Last of Us S02E02.mkv",
            "The Mandalorian/The Mandalorian S02E02.mkv",
            "Test/The Witcher/The Witcher S01E03.mkv",
        ]

        const result = await getNewFilePathsIncludingParentFolders(filePaths);

        expect(result).toStrictEqual([
            "The Last of Us/Season 01/The Last of Us S01E01.mkv",
            "The Last of Us/Season 02/The Last of Us S02E02.mkv",
            "The Mandalorian/Season 02/The Mandalorian S02E02.mkv",
            "Test/The Witcher/Season 01/The Witcher S01E03.mkv",
        ])

    });
    it.skip("Should skip already correct episodes", async () => {

        const filePaths = [
            "The Last of Us/Season 01/The Last of Us S01E01.mkv",
            "The Last of Us/Season 01/The Last of Us S01E02.mkv",
            "The Mandalorian/Season 02/The Mandalorian S02E02.mkv",
            "The Witcher/Season 01/The Witcher S01E03.mkv",
        ]

        const result = await getNewFilePathsIncludingParentFolders(filePaths);

        expect(result).toStrictEqual([
            "The Last of Us/Season 01/The Last of Us S01E01.mkv",
            "The Last of Us/Season 01/The Last of Us S01E02.mkv",
            "The Mandalorian/Season 02/The Mandalorian S02E02.mkv",
            "The Witcher/Season 01/The Witcher S01E03.mkv",
        ])

    });

});