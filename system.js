import fs from 'fs'
import { checkIfFileIsAlreadyInCorrectFoler, classifyFile, generateNewFilePathIncludingParentFolders } from './lib';
import pino from 'pino'
import path from 'path';

const logger = pino({
    level: process.env.NODE_ENV === "development" ? 'debug' : "info"
});

/**
 * 
 * @param {string} dir 
 */
export const moveAllFilesToCorrectFolders = async (dir) => {

    const files = fs.readdirSync(dir);

    for(const file of files) {
        try {

            // Check whether the file is actually an episode
            const classification = await classifyFile(file);
            if(classification !== 'Episode') {
                logger.info(`Skipping: ${file} (Not an episode)`);
                continue;
            }

            // Check if the file is already in the correct folder
            const alreadyInCorrectFolder = await checkIfFileIsAlreadyInCorrectFoler(file);
            if(alreadyInCorrectFolder) {
                logger.info(`Skipping: ${file} (Already in correct folder)`);
                continue;
            }

            const fullPath = path.join(dir, file);
            const newPath = await generateNewFilePathIncludingParentFolders(fullPath);
            const oldPath = path.join(dir, file);

            // ensure the parent folders exist
            fs.mkdirSync(path.dirname(newPath), { recursive: true });

            fs.renameSync(oldPath, newPath);

            logger.info(`Moved: ${oldPath} -> ${newPath}`);
        } catch(e) {
            logger.error(`Failed to move ${file}: ${e.message}`);
        }
    }
    
};