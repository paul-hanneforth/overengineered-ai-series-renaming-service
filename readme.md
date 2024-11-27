# TV Show Renamer

## Problem
Managing TV show files with inconsistent naming conventions can be challenging, especially when using media server applications like Jellyfin. For example, files such as:  
`Temptation.Island.S01E01.1080p.PCOK.WEB-DL.DDP5.1.x264-WhiteHat`  
are difficult to read and organize effectively.

## Solution
This tool renames TV show files to follow the Jellyfin naming convention, ensuring compatibility and improved readability. For instance, the above file would be renamed to:  
`Temptation Island S01E01`

## How to Use

### Prerequisites
- Ensure you have Docker installed.

## How to Use

### Steps

1. Clone this repository to your local machine:
   ```bash
   git clone <repository-url>
   cd <repository-directory>

2. Open the `docker-compose.yml` file and update the following:
   - **Root Directory Mapping**: Replace `/Volumes` with the root directory where your TV shows are stored.  
   - **Folder Environment Variable**: Set the `FOLDER` environment variable to the path of the folder containing your TV show, excluding the root directory you specified above.  

   **Example**:  
   Suppose you store your TV shows on an external hard drive, and the full path to a TV show's season folder is:  
   `/Volumes/Movies/series/Family Guy/Season 11`  

   - Map `/Volumes` to `/rename` in `docker-compose.yml`.  
   - Set the `FOLDER` variable to:  
     ```plaintext
     Movies/series/Family Guy/Season 11
     ```

3. Run the program:
   ```bash
   docker-compose up --abort-on-container-exit

### Notes
- The renaming process may take a significant amount of time, particularly on the first run.
