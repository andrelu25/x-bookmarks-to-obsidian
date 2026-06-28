# X Bookmarks to Obsidian

Chrome MV3 extension for selecting visible X bookmarks and saving them as individual Obsidian notes.

## Setup

1. Install and enable the free Obsidian community plugin: Local REST API.
2. In that plugin's settings, enable the HTTP server.
3. Copy the API key.
4. Open Chrome Extensions, enable Developer mode, and load this folder as an unpacked extension.
5. Open the extension options and set:
   - API Base URL: `http://127.0.0.1:27123`
   - API Key: your Local REST API key
   - Folder: `X Bookmarks`

## Usage

1. Open `https://x.com/i/bookmarks`.
2. Scroll until the bookmarks you want are loaded.
3. Open the extension popup and click `抓取当前页`.
4. Uncheck posts you do not want.
5. Click `保存选中`.

Each saved post is written to `X Bookmarks/{tweetId}.md`. Existing notes are skipped and never overwritten.

## Development

Run tests:

```sh
npm test
```
