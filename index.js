import path from 'path';
import { renameFilesInDirectory } from "./lib.js";

// get environment variable 'FOLDER' and join with '/rename'
const filePath = path.join('/rename', process.env.FOLDER || '');

renameFilesInDirectory(filePath)