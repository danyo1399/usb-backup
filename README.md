# usb-backup
Provides a solution to backup files that change infrequently such
as (images/video/audio) from PC's and NAS devices to cheap and affordable usb drives for offline local or remote storage.

This is a port of a .net project i developed and have been using since 2010 that no longer runs on modern hardware.

[![npm version](https://badge.fury.io/js/usb-backup.svg)](https://badge.fury.io/js/usb-backup)
[![Join the chat at https://gitter.im/usb-backup/community](https://badges.gitter.im/usb-backup/community.svg)](https://gitter.im/usb-backup/community?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)

## Getting started
Make sure you have node js installed. You get get it from here

https://nodejs.org/en/

There are two methods of running the application.

### Latest Bundled Package (Simple method)
- Create an empty directory for where to run and store your backup database
  eg (c:\usb-backup)

- From that directory run `npx usb-backup`

Your database will be setup in a data sub folder and scripts will be created so
you can run the application at any time from a shortcut.

###  Run from source (For the technically inclined)
- Clone the repository from https://github.com/danyo1399/usb-backup.git
- run npm install
- run npm start

The application will create the a data directory where the database will be stored.

## Features
- Backups are stored as plain copies of files that can be restored without the need of tools or software

- USB storage is optimised by backing up only one copy of a files content (deduplication)

- File hashes and metadata are stored in three locations source device, backup device, and application DB for redundancy

- Backup files are hashed during copy instead of relying on the file hash on source or re hashing on backup device to ensure the we record an accurate file hash on the backup device


## Known Limitations
- Supporting unix allowed characters in file names that are not valid on windows when backing up linux filesystems on to windows formmated usb drives

- Max file path lengths that exist in windows that dont on unix storage devices

- Multiple files with the same hash will only be stored onec on backup devices. Which file path is stored on the usb drive is indeterminate

- Two files with different hashes with the same path on different devices will force the second file to have a unique suffix added to ensure we backup both files

## Troubleshooting


`Error: listen EADDRINUSE: address already in use`

This means you either have the application already running or something else is listening on the same port. Either shutdown the other instance of the running application or running the application on another port by providing a different port number eg `npx usb-backup 6000`
