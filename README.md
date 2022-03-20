# usb-backup

[![Join the chat at https://gitter.im/usb-backup/community](https://badges.gitter.im/usb-backup/community.svg)](https://gitter.im/usb-backup/community?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)

# Description
Provides a solution to backup media content that changes infrequently (images/video/audio) from NAS devices to multiple cheap and affordable usb drives
where backups are stored in a format that can be restored with without the use of tools or software.

USB storage is optimised by only backing upone copy of a file with certain contents (deduplication).

File hashes are captured on source device, backup device, and app db so we can determine bit rott occuring in one of the 3 locations.

I used it to backup my multi terrabyte NAS to multiple usb storage devices.

This is a port of a .net solution i developed back in the .net 2.0 days that no longer runs on modern hardware.

## Known issues
- unix allows characters that are not allowed in windows
- Ive seen drift in file modified timestamps. not sure if its an issue anymore
- path delimiter is different between win and linux
- How to handle updates to files even though its not supported. Ie if we copy structure onto backup device and file contents change the original structure on the backup device can only hold one file
- max file path lengths on windows uuuggghhh

## Limitations
- Multiple files with the same hash will only be stored onec on backup devices. Which file is indeterminate
- Two files with different hashes with the same path on different devices will force the second file to have a unique suffix added to ensure
  we backup both files


## TODO
- reattach existing device on create importing meta file.
- add github star
- copy readme to root folder
