import fs from 'fs'
import path from 'path'
import { request } from './api.js'

/**
 * Recursively traverses directories and structures the response.
 * @param {string} dir - The directory to start traversing from.
 * @returns {object} - A structured representation of the directory and its contents.
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
 * 
 * @param {string} filePath 
 * @returns {Promise<Details>} details
 */
async function getDetails(filePath) {
    // Check if the file exists
    if (!fs.existsSync(filePath)) {
        throw new Error(`File not found: ${filePath}`);
    }

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
 * The file actually needs to be an episode.
 * @param {String} filePath 
 * @returns {Promise<number>} episodeNumber
 */
async function getEpisodeNumber(filePath) {
    // Check if the file exists
    if (!fs.existsSync(filePath)) {
        throw new Error(`File not found: ${filePath}`);
    }

    // Prepare prompt for Ollama
    const system = "It is your job to extract the episode number from file paths I give you. You will be given a file path and you must extract the episode number from the file path or name. Please remember that sometimes the episode numbers can be in weird formats Respond with a JSON object: { 'episode': EpisodeNumber }. Make sure that the field is a number";
    const examples = [
        {
            input: '/Volumes/Movies/series/Family Guy/Season 03/Family Guy - S03E05 - And The Wiener Is.mkv',
            output: JSON.stringify({ 'episode': 5 })
        }
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
 * The file actually needs to be an episode.
 * @param {String} filePath 
 * @returns {Promise<string>} seriesName
 */
async function getSeriesName(filePath) {
    // Check if the file exists
    if (!fs.existsSync(filePath)) {
        throw new Error(`File not found: ${filePath}`);
    }

    // Prepare prompt for Ollama
    const system = "It is your job to extract the series name from file paths I give you. You will be given a file path and you must extract the series name from the file path or name. Please remember that sometimes the series names can be in weird formats Respond with a JSON object: { 'series': 'Series Name' }.";

    const examples = [
        {
            input: '/Volumes/Movies/series/Family Guy/Season 03/Family Guy - S03E05 - And The Wiener Is.mkv',
            output: JSON.stringify({ 'series': "Family Guy" })
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
 * The file actually needs to be an episode.
 * @param {string} filePath 
 * @returns {Promise<number>} seasonNumber
 */
async function getSeasonNumber(filePath) {
    // Check if the file exists
    if (!fs.existsSync(filePath)) {
        throw new Error(`File not found: ${filePath}`);
    }

    // Prepare prompt for Ollama
    const system = "It is your job to extract the season number from file paths I give you. You will be given a file path and you must extract the season number from the file path or name. Please remember that sometimes the season numbers can be in weird formats Respond with a JSON object: { 'season': 'Season Number' }";

    try {
        // Call Ollama API
        const jsonResponse = await request(system, filePath);
        
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

async function renameFilesInDirectory(dir) {
    const result = await traverseDirectory(dir);

    for (const file of result.files) {
        try {

            // Check whether the file is actually a episode
            const classification = await classifyFile(file);
            if(classification !== 'Episode') {
                console.log(`Skipping: ${file} (Not an episode)`);
                continue;
            }

            // Get details from the file
            const details = await getDetails(file);

            const newFileName = await getNewFileName(details.series, details.season, details.episode, file);
            const newFilePath = path.join(path.dirname(file), newFileName);

            // Rename the file
            fs.renameSync(file, newFilePath);

            // Print the renaming action
            console.log(`Renamed: ${file} -> ${newFilePath}`);
        } catch (error) {
            console.error(`Failed to rename ${file}: ${error.message}`);
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
const classifyFile = async (filePath) => {
    try {
        // Prepare the prompt for the Ollama API
        const system = `It is your job to classify file paths I give you. 
You have to give me your response in the JSON Format. 
You will be given a file path and you must classify it as a { "classification": "Movie" }, an { "classification": "Episode" }, or { "classification": "Unrelated" }. 
If the file ending is the file ending of a video file it is most likely a movie or episode. If it doesn't contain a season and episode number, it is most likely a movie.
If you are unsure or the file is unrelated, classify it as 'Unrelated'. 
Respond with a JSON object: { "classification": "Movie" | "Episode" | "Unrelated" }`;

        const examples = [
            {
                input: '/Volumes/Movies/series/Family Guy/The Movie - Stewie Griffin The Untold Story (Uncensored)/Family Guy - Stewie Griffin The Untold Story (Uncensored).mkv',
                output: JSON.stringify({ classification: 'Movie' })
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

// get environment variable 'FOLDER' and join with '/rename'
const filePath = path.join('/rename', process.env.FOLDER || '');

renameFilesInDirectory(filePath)