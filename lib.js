import fs from 'fs'
import path from 'path'
import { request } from './api.js'
import pino from 'pino'

const logger = pino({
    level: process.env.NODE_ENV === "development" ? 'debug' : "info"
});

/**
 * @typedef {Object} Directory
 * @property {string} path - The full path of the current directory.
 * @property {Directory[]} subfolders - An array of objects, each representing a subdirectory.
 * @property {string[]} files - An array of file paths within the current directory.
 */
/**
 * Recursively traverses directories and structures the response.
 * @param {string} dir - The directory to start traversing from.
 * @returns {Directory} - A structured representation of the directory and its contents.
 * 
 * The returned object has the following structure:
 * {
 *   path: {string},          // The full path of the current directory.
 *   subfolders: {Array},     // An array of objects, each representing a subdirectory.
 *   files: {Array<string>}   // An array of file paths within the current directory.
 * }
 * 
 * Example:
 * For a directory structure like this:
 * /example
 *   /subdir
 *     file2.txt
 *   file1.txt
 * 
 * Calling traverseDirectory('./example') returns:
 * {
 *   path: "./example",
 *   subfolders: [
 *     {
 *       path: "./example/subdir",
 *       subfolders: [],
 *       files: [
 *         "./example/subdir/file2.txt"
 *       ]
 *     }
 *   ],
 *   files: [
 *     "./example/file1.txt"
 *   ]
 * }
 */
function traverseDirectory(dir) {
    /**
     * @type {object} result
     * @property {string} path - The full path of the current directory.
     * @property {Array<object>} subfolders - An array of objects, each representing a subdirectory.
     * @property {Array<string>} files - An array of file paths within the current directory.
     */
    const result = {
        path: dir,
        subfolders: [],
        files: []
    };

    const entries = fs.readdirSync(dir); // Get all entries in the directory

    entries.forEach((entry) => {
        const entryPath = path.join(dir, entry); // Full path of the entry
        const stats = fs.statSync(entryPath); // Get stats of the entry

        if (stats.isDirectory()) {
            // If it's a directory, recurse and add its structure
            result.subfolders.push(traverseDirectory(entryPath));
        } else {
            // If it's a file, add to the files array
            result.files.push(entryPath);
        }
    });

    return result;
}

/**
 * @typedef {Object} Details
 * @property {string} series - The name of the series.
 * @property {number} season - The season number.
 * @property {number} episode - The episode number.
 */
/**
 * The file path actually needs to represent an episode.
 * @param {string} filePath 
 * @returns {Promise<Details>} details
 */
export async function getDetails(filePath) {

    const episodeNumber = await getEpisodeNumber(filePath);
    const seriesName = await getSeriesName(filePath);
    const seasonNumber = await getSeasonNumber(filePath);

    return {
        series: seriesName,
        season: seasonNumber,
        episode: episodeNumber
    };

}

/**
 * The file path actually needs to represent an episode.
 * @param {String} filePath 
 * @returns {Promise<number>} episodeNumber
 */
export async function getEpisodeNumber(filePath) {
    // Prepare prompt for Ollama
    const system = "It is your job to extract the episode number from file paths I give you. You will be given a file path and you must extract the episode number from the file path or name. Please remember that sometimes the episode numbers can be in weird formats Respond with a JSON object: { 'episode': EpisodeNumber }. Make sure that the field is a number";
    const examples = [
        {
            input: '/Volumes/Movies/series/Family Guy/Season 03/Family Guy - S03E05 - And The Wiener Is.mkv',
            output: JSON.stringify({ 'episode': 5 })
        },
        {
            input: 'general/piracy-vbox-shared/rename/[Anime Time] Attack On Titan (Complete Series) (S01-S04+OVA) [Dual Audio][BD][1080p][HEVC 10bit x265][AAC][Eng Sub]/[Anime Time] Attack on titan (Season 02)/[Anime Time] Attack On Titan - 26.mkv',
            output: JSON.stringify({ 'episode': 26 })
        },
    ]

    try {
        // Call Ollama API
        const jsonResponse = await request(system, filePath, examples);

        // check if the response contains the episode number
        if (!jsonResponse.episode) {
            throw new Error('Episode number not found in the response');
        }

        // check if the episode number is typeof number
        if (isNaN(parseInt(jsonResponse.episode))) {
            throw new Error('Episode number is not a number');
        }

        const episodeNumber = parseInt(jsonResponse.episode);
        return episodeNumber;
    } catch (error) {
        throw new Error(`Failed to get episode number of the file from Ollama API: ${error.message}`);
    }
}

/**
 * The file path actually needs to represent an episode.
 * @param {String} filePath 
 * @returns {Promise<string>} seriesName
 */
export async function getSeriesName(filePath) {

    // Prepare prompt for Ollama
    const system = "It is your job to extract the full series name from file paths I give you. You will be given a file path and you must extract the complete series name from the file path or name. Return exactly the Series Name, without the year or any other additions/removals.Respond with a JSON object: { 'series': 'Series Name' }.";

    const examples = [
        {
            input: '/Volumes/Movies/series/Family Guy/Season 03/Family Guy - S03E05 - And The Wiener Is.mkv',
            output: JSON.stringify({ 'series': "Family Guy" })
        },
        {
            input: '[Anime Time] Attack On Titan (Complete Series) (S01-S04+OVA) [Dual Audio][BD][1080p][HEVC 10bit x265][AAC][Eng Sub]',
            output: JSON.stringify({ 'series': "Attack On Titan" })
        },
        {
            input: 'general/piracy-vbox-shared/rename/[Anime Time] Attack On Titan (Complete Series) (S01-S04+OVA) [Dual Audio][BD][1080p][HEVC 10bit x265][AAC][Eng Sub]/[Anime Time] Attack on titan (Season 02)/[Anime Time] Attack On Titan - 26.mkv',
            output: JSON.stringify({ 'series': "Attack On Titan" })
        },
        {
            input: '/rename/Movies/series/Star Wars The Clone Wars/Season S02/Star Wars The Clone Wars S02E20.mkv',
            output: JSON.stringify({ 'series': "Star Wars The Clone Wars" })
        },
        {
            input: '/rename/Movies/series/Rome (2005) - 1080p Bluray AV1 OPUS 5.1 -jenkins/Season 01/Rome (2005) S01E01.mkv',
            output: JSON.stringify({ 'series': "Rome" })
        },
        {
            input: '/rename/Movies/series/Star Wars The Clone Wars/Season S04/Star Wars The Clone Wars S04E20.mkv',
            output: JSON.stringify({ 'series': "Star Wars The Clone Wars" })
        },
        {
            input: '/Volumes/Movies/encoded-series/move/3 Body Problem S01E02.mkv',
            output: JSON.stringify({ 'series': "3 Body Problem" })
        }
    ]

    try {
        // Call Ollama API
        const jsonResponse = await request(system, filePath, examples);

        // check if the response contains the series name
        if (!jsonResponse.series) {
            throw new Error('Series name not found in the response');
        }

        return jsonResponse.series;
    } catch (error) {
        throw new Error(`Failed to get series name of the file from Ollama API: ${error.message}`);
    }
}

/**
 * The file path actually needs to represent an episode.
 * @param {string} filePath 
 * @returns {Promise<number>} seasonNumber
 */
export async function getSeasonNumber(filePath) {

    // Prepare prompt for Ollama
    const system = "It is your job to extract the season number from file paths I give you. You will be given a file path and you must extract the season number from the file path or name. Please remember that sometimes the season numbers can be in weird formats Respond with a JSON object: { 'season': 'Season Number' }";

    try {
        const examples = [
            {
                input: 'general/piracy-vbox-shared/rename/[Anime Time] Attack On Titan (Complete Series) (S01-S04+OVA) [Dual Audio][BD][1080p][HEVC 10bit x265][AAC][Eng Sub]/[Anime Time] Attack on titan (Season 02)/[Anime Time] Attack On Titan - 26.mkv',
                output: JSON.stringify({ 'season': 2 })
            },
        ];

        // Call Ollama API
        const jsonResponse = await request(system, filePath, examples);
        
        // check if the response contains the season number
        if (!jsonResponse.season) {
            throw new Error('Season number not found in the response');
        }

        const seasonNumber = parseInt(jsonResponse.season);
        return seasonNumber;
    } catch (error) {
        throw new Error(`Failed to get season number of the file from Ollama API: ${error.message}`);
    }
}

/**
 * Goes through all the files and checks if they match the format 'Series Name - SXXEYY' If even one file does not match the format, return false. If all files match the format, return true.
 * To accomplish this, the function uses the Ollama API.
 * @param {string[]} filePaths 
 * @returns {Promise<boolean>} returns true if all episodes match the format, false otherwise
 */
export async function checkIfEpisodeMatchesFormatInBatchAI(filePaths) {

    const system = `It is your job to check whether the files, which represent episodes of a series, all match the following series format: 'Series Name SXXEYY'. Return a JSON object: { "matches": true | false }.
If even one file does not match the format, return false. If all files match the format, return true. Be aware that all files need to follow the series format exactly without even one character difference. If you are unsure, return false. Return a JSON object: { "matches": true | false }.`;

    const examples = [
        {
            input: JSON.stringify(['/Volumes/Movies/series/Family Guy/Season 03/Family Guy - S03E05 - And The Wiener Is.mkv', '/Volumes/Movies/series/Family Guy/Season 03/Family Guy - S03E06 - Death Lives.mkv']),
            output: JSON.stringify({ "matches": false })
        },
        {
            input: JSON.stringify(['/Volumes/Movies/series/Family Guy/Season 03/Family Guy S03E05', '/Volumes/Movies/series/Family Guy/Season 03/Family Guy S03E06']),
            output: JSON.stringify({ "matches": true })
        },
        {
            input: JSON.stringify([
                '/Volumes/Shared/todo/Temptation Island/Season 01/Temptation.Island.S01E01.1080p.PCOK.WEB-DL.DDP5.1.x264-WhiteHat.mkv',
                '/Volumes/Shared/todo/Temptation Island/Season 01/Temptation.Island.S01E02.1080p.PCOK.WEB-DL.DDP5.1.x264-WhiteHat.mkv',
                '/Volumes/Shared/todo/Temptation Island/Season 01/Temptation.Island.S01E03.1080p.PCOK.WEB-DL.DDP5.1.x264-WhiteHat.mkv',
                '/Volumes/Shared/todo/Temptation Island/Season 01/Temptation.Island.S01E04.1080p.PCOK.WEB-DL.DDP5.1.x264-WhiteHat.mkv',
                '/Volumes/Shared/todo/Temptation Island/Season 01/Temptation.Island.S01E05.1080p.PCOK.WEB-DL.DDP5.1.x264-WhiteHat.mkv',
                '/Volumes/Shared/todo/Temptation Island/Season 01/Temptation.Island.S01E06.1080p.PCOK.WEB-DL.DDP5.1.x264-WhiteHat.mkv',
                '/Volumes/Shared/todo/Temptation Island/Season 01/Temptation.Island.S01E07.1080p.PCOK.WEB-DL.DDP5.1.x264-WhiteHat.mkv',
                '/Volumes/Shared/todo/Temptation Island/Season 01/Temptation.Island.S01E08.1080p.PCOK.WEB-DL.DDP5.1.x264-WhiteHat.mkv',
                '/Volumes/Shared/todo/Temptation Island/Season 01/Temptation.Island.S01E09.1080p.PCOK.WEB-DL.DDP5.1.x264-WhiteHat.mkv',
                '/Volumes/Shared/todo/Temptation Island/Season 01/Temptation.Island.S01E10.1080p.PCOK.WEB-DL.DDP5.1.x264-WhiteHat.mkv',
                '/Volumes/Shared/todo/Temptation Island/Season 01/Temptation.Island.S01E11.1080p.PCOK.WEB-DL.DDP5.1.x264-WhiteHat.mkv'
            ]),
            output: JSON.stringify({ "matches": false })
        },
        {
            input: JSON.stringify([
                '/Volumes/Movies/series/Family Guy/Season 01/Family Guy S01E01.mkv',
                '/Volumes/Movies/series/Family Guy/Season 01/Family Guy S01E02.mkv',
                '/Volumes/Movies/series/Family Guy/Season 01/Family Guy S01E03.mkv',
                '/Volumes/Movies/series/Family Guy/Season 01/Family Guy S01E04.mkv',
                '/Volumes/Movies/series/Family Guy/Season 01/Family Guy S01E05.mkv',
                '/Volumes/Movies/series/Family Guy/Season 01/Family Guy S01E06.mkv',
                '/Volumes/Movies/series/Family Guy/Season 01/Family Guy S01E07.mkv'
            ]),
            output: JSON.stringify({ "matches": true })
        },
        {
            input: JSON.stringify([
                '/Volumes/Movies/series/Family Guy/Season 01/Family Guy S01E01.mkv',
                '/Volumes/Movies/series/Family Guy/Season 01/Family Guy S01E02.mkv',
                '/Volumes/Movies/series/Family Guy/Season 01/Family Guy S01E03 - The Sheep in the bag.mkv',
                '/Volumes/Movies/series/Family Guy/Season 01/Family Guy S01E04.mkv',
                '/Volumes/Movies/series/Family Guy/Season 01/Family Guy S01E05.mkv',
                '/Volumes/Movies/series/Family Guy/Season 01/Family Guy S01E06.mkv',
                '/Volumes/Movies/series/Family Guy/Season 01/Family Guy S01E07.mkv'
            ]),
            output: JSON.stringify({ "matches": false })
        },
        {
            input: JSON.stringify([
                '/Volumes/Movies/series/Invincible/Season 02/Invincible S02E01.mkv',
                '/Volumes/Movies/series/Invincible/Season 02/Invincible S02E02.mkv',
                '/Volumes/Movies/series/Invincible/Season 02/Invincible S02E03.mkv',
                '/Volumes/Movies/series/Invincible/Season 02/Invincible S02E04.mkv',
                '/Volumes/Movies/series/Invincible/Season 02/Invincible S02E05.mkv',
                '/Volumes/Movies/series/Invincible/Season 02/Invincible S02E06.mkv',
                '/Volumes/Movies/series/Invincible/Season 02/Invincible S02E08.mkv',
                '/Volumes/Movies/series/Invincible/Season 02/Invincible S02E7.mkv'
            ]),
            output: JSON.stringify({ "matches": false }) 
        },
        {
            input: JSON.stringify([
                '/Volumes/Movies/series/.DS_Store',
                '/Volumes/Movies/series/output.txt',
                '/Volumes/Movies/series/rename.py'
            ]),
            output: JSON.stringify({ "matches": false }) 
        }
    ]

    try {
        // Call Ollama API
        const jsonResponse = await request(system, JSON.stringify(filePaths), examples);

        // check if the response contains the matches field
        if (jsonResponse.matches == null || jsonResponse.matches == undefined || typeof jsonResponse.matches !== 'boolean') {
            throw new Error('Matches field not found in the response');
        }

        return jsonResponse.matches;
    } catch (error) {
        throw new Error(`Failed to check if episodes match format in batch from Ollama API: ${error.message}`);
    }

}

/**
 * Goes through all the files and checks if they match the format 'Series Name - SXXEYY' If even one file does not match the format, return false. If all files match the format, return true.
 * Returns true if the given list is empty.
 * @param {string[]} filePaths 
 * @returns {Promise<boolean>} returns true if all episodes match the format, false otherwise
 */
export async function checkIfEpisodeMatchesFormatInBatch(filePaths) {
    try {

        if(filePaths.length === 0) {
            return true;
        }
    
        const classification = await classifyFile(filePaths[0]);
        if(classification !== 'Episode') {
            logger.debug("Couldn't check if episode matches format in batch because the first file is not an episode. First file: ", filePaths[0]);
            return false;
        }
        
        const seriesName = await getSeriesName(filePaths[0]);
        const seasonNumber = await getSeasonNumber(filePaths[0]);
    
        const paddedSeasonNumber = seasonNumber.toString().padStart(2, '0');
    
        const matches = filePaths.every(filePath => {
            // remove the directory path and file extension, keep only the file name
            const fileName = path.basename(filePath);
            const fileNameWithoutExtension = path.parse(fileName).name;
    
            const exp = `^${seriesName} S${paddedSeasonNumber}E\\d{2}$`;
            const regex = new RegExp(exp);
            const match = regex.test(fileNameWithoutExtension);
    
            if(!match) {
                logger.debug(`File "${fileNameWithoutExtension}" did not match the format ("${seriesName} S${paddedSeasonNumber}EXX").`);
            }
    
            return match;
        });
    
        return matches;

    } catch(e) {
        logger.error(`Failed to check if episodes match the correct format!`);
        logger.trace(e);
        return false;
    }
}

/**
 * 
 * @param {string} seriesName 
 * @param {number} seasonNumber 
 * @param {number} episodeNumber 
 * @param {string} filePath 
 * @returns {Promise<string>} newFileName
 */
async function getNewFileName(seriesName, seasonNumber, episodeNumber, filePath) {
    
    return `${seriesName} S${seasonNumber.toString().padStart(2, '0')}E${episodeNumber.toString().padStart(2, '0')}${path.extname(filePath)}`;

}

/**
 * 
 * @param {string} dir the directory to rename files in 
 */
export async function renameFilesInDirectory(dir) {
    const result = await traverseDirectory(dir);

    // check whether the files are in the correct format already
    const matchesFormat = await checkIfEpisodeMatchesFormatInBatch(result.files);
    if(matchesFormat) {

        logger.info(`All files in ${dir} are already in the correct format.`);

    } else {

        for (const file of result.files) {
            try {

                // Check whether the file is actually a episode
                const classification = await classifyFile(file);
                if(classification !== 'Episode') {
                    logger.info(`Skipping: ${file} (Not an episode)`);
                    continue;
                }

                // Get details from the file
                const details = await getDetails(file);

                const newFileName = await getNewFileName(details.series, details.season, details.episode, file);
                const newFilePath = path.join(path.dirname(file), newFileName);

                // Rename the file
                fs.renameSync(file, newFilePath);

                // Print the renaming action
                logger.info(`Renamed: ${file} -> ${newFilePath}`);
            } catch (error) {
                console.error(`Failed to rename ${file}: ${error.message}`);
            }
        }

    }

    // Also rename files in subdirectories
    for (const subfolder of result.subfolders) {
        await renameFilesInDirectory(subfolder.path);
    }
}

/**
 * Classify a given file path using the Ollama API to determine if it's a 'Movie', 'Episode', or 'Unrelated'.
 * @param {string} filePath - The full path to the file.
 * @returns {Promise<string>} - The classification result: 'Movie', 'Episode', or 'Unrelated'.
 */
export const classifyFile = async (filePath) => {
    try {
        // Prepare the prompt for the Ollama API
        const system = `It is your job to classify file paths I give you. 
You will be given a file path and you must classify it as a { "classification": "Movie" }, an { "classification": "Episode" }, or { "classification": "Unrelated" }. 
If the file ending is the file ending of a video file it is most likely a movie or episode. If it doesn't contain a season and episode number, it is most likely a movie. If the file name contains the word "Movie" it is most likely a movie.
If you are unsure or the file is unrelated, classify it as 'Unrelated'. 
Respond with a JSON object: { "classification": "Movie" | "Episode" | "Unrelated" }`;

        const examples = [
            {
                input: '/Volumes/Movies/series/Family Guy/The Movie - Stewie Griffin The Untold Story (Uncensored)/Family Guy - Stewie Griffin The Untold Story (Uncensored).mkv',
                output: JSON.stringify({ classification: 'Movie' })
            },
            {
                input: 'general/piracy-vbox-shared/rename/[Anime Time] Attack On Titan (Complete Series) (S01-S04+OVA) [Dual Audio][BD][1080p][HEVC 10bit x265][AAC][Eng Sub]/[Anime Time] Attack on titan (Season 03)/NC/NCED 01.mkv',
                output: JSON.stringify({ classification: 'Unrelated' })
            },
            {
                input: '/Volumes/Movies/series/Family Guy/Season 03/Family Guy - S03E05 - And The Wiener Is.mkv',
                output: JSON.stringify({ classification: 'Episode' })
            },
            {
                input: '/Volumes/Movies/other/Some Random File.mkv',
                output: JSON.stringify({ classification: "Unrelated" })
            },
            {
                input: '/Volumes/Movies/series/KAOS, 2160p NF WEB-DL DD+ 5.1 Atmos H.265-NTb/Season 01/KAOS, 2160p NF WEB-DL DD+ 5.1 Atmos H.265-NTb S01E01.mkv',
                output: JSON.stringify({ classification: "Episode" })
            },
            {
                input: '/Volumes/Movies/series/output.txt',
                output: JSON.stringify({ classification: "Unrelated" })
            },
            {
                input: 'The Mandalorian/Season 02/info.txt',
                output: JSON.stringify({ classification: "Unrelated" })
            },
            {
                input: 'The Witcher/The Movie.mp4',
                output: JSON.stringify({ classification: "Movie" })
            },
            {
                input: '/Volumes/general/piracy-vbox-shared/rename/Attack On Titan (2013) - 1080p Blu-Ray AAC 2.0 x265-AnimeTime/Season 03/[Anime Time] Attack On Titan - 59.mkv',
                output: JSON.stringify({ classification: "Episode" })
            },
            {
                input: '/Volumes/general/piracy-vbox-shared/piracy-vbox-credentials.kdbx',
                output: JSON.stringify({ classification: "Unrelated" })
            },
            {
                input: '/Volumes/general/piracy-vbox-shared/rename/Berserk/Season 01/[SWORDS] Berserk (1997) - 24 [E15C75DD].mkv',
                output: JSON.stringify({ classification: "Episode" })
            },
            {
                input: '/Movies/downloaded/raw/Game.of.Thrones.S04.1080p.BluRay.AV1.Opus.5.1-onlyfaffs/Game.of.Thrones.S04E01.Two.Swords.1080p.BluRay.AV1.Opus.5.1-onlyfaffs.mkv',
                output: JSON.stringify({ classification: "Episode" })
            }
        ]

        // Request the classification from Ollama API
        const response = await request(system, filePath, examples);

        // Check if the response contains a valid classification
        if (response && response.classification) {
            return response.classification;
        } else {
            // Handle the case where the response is not as expected
            throw new Error('Invalid response from Ollama API');
        }
    } catch (error) {
        // Handle any errors and return a fallback classification
        console.error('Error during file classification:', error);
        return 'Unrelated';  // Return 'Unrelated' as fallback in case of an error
    }
};

/**
 * 
 * @param {string} dir 
 */
export const printFoldersWithWrongFormat = async (dir) => {
    const result = await traverseDirectory(dir);

    const matchesFormat = await checkIfEpisodeMatchesFormatInBatch(result.files);

    if(matchesFormat) {

        // logger.info(`All files in ${dir} are already in the correct format.`);

    } else {

        logger.warn(`Files in ${dir} are not in the correct format:`);

    }

    // Also check files in subdirectories
    for (const subfolder of result.subfolders) {
        await printFoldersWithWrongFormat(subfolder.path);
    }
}

/**
 * 
 * @param {string} filePath - file name with extension with. The file name needs to actually represent an episode.
 * @returns {Promise<string>} - file path with correct parent folders. Be aware that it tries to reuse existing parent folders.  
 */
export const generateNewFilePathIncludingParentFolders = async (filePath) => {
   
    const fileName = path.basename(filePath);
    const fileNameWithoutExtension = path.parse(fileName).name;

    const details = await getDetails(fileNameWithoutExtension);

    const newPath = path.join(details.series, `Season ${details.season.toString().padStart(2, "0")}`, fileName);
    const completePath = path.join(path.dirname(filePath), newPath);

    return completePath;

}

/**
 * 
 * @param {string[]} filePaths - An array of file paths. Each file path actually needs to represent an episode and be the full path.
 * @returns {Promise<string[]>} - An array of file paths with correct parent folders.
 */
export const getNewFilePathsIncludingParentFolders = async (filePaths) => {

    let newFilePaths = [];

    for(const fullFilePath of filePaths) {
        
        // const fileName = path.basename(fullFilePath);
        const newPath = await generateNewFilePathIncludingParentFolders(fullFilePath);

        newFilePaths.push(path.join(path.dirname(fullFilePath), newPath));
        
    }

    return newFilePaths;

}

/**
 * 
 * @param {string[]} filePaths - An array of file paths. Each file path must be the full path.
 * @returns {Promise<string[]>} - An array of file paths that represent episodes.
 */
export const filterFilePathsByEpisode = async (filePaths) => {

    let episodes = [];

    for(const filePath of filePaths) {
        const classification = await classifyFile(filePath);
        if(classification === 'Episode') {
            episodes.push(filePath);
        }
    }

    return episodes;

}

/**
 * 
 * @param {string} filePath - The full path to the file. The file path actually needs to represent an episode.
 * @returns {Promise<boolean>} - Whether the file is already in the correct folder or not.
 */
export const checkIfFileIsAlreadyInCorrectFoler = async (filePath) => {

    const fileName = path.basename(filePath);

    const newPath = await generateNewFilePathIncludingParentFolders(fileName);

    return filePath.endsWith(newPath);

}