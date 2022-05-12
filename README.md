# Streaid

This app is aiding your streaming. (`Strea(m) + aid`)

## Functions

* [x] Get the chatter info
    * Alert notification when the first chat during the stream
* [x] Get the raider info
    * Alert notification when someone raided to your stream
* [x] Get the host info
    * Alert notification when someone hosted to your stream
* [x] Update and Save Template of Channnel info
* [x] Save your memo for the users
* [x] Prepare custom commands

## Memo

M1 mac cannot install sqlite3 package directly, so need to install by the following command.

```bash
npm install sqlite3  --build-from-source --runtime=electron --target=18.2.2 --dist-url=https://electronjs.org/headers --target_arch=arm64
```
