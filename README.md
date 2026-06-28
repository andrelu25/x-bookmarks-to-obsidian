# X Bookmarks to Obsidian

Chrome MV3 extension for selecting visible X bookmarks and saving them as individual Obsidian notes.

## Requirements

- Google Chrome or another Chromium-based browser that supports unpacked MV3 extensions.
- Obsidian desktop app.
- The free Obsidian community plugin `Local REST API with MCP`.
- The Local REST API HTTP server enabled in Obsidian.
- Your own Local REST API key from your own Obsidian vault.

This extension is not published on the Chrome Web Store yet. Install it from GitHub as an unpacked extension.

## Install from GitHub

1. Download this repository as a ZIP file from GitHub.
2. Unzip it.
3. Open `chrome://extensions/` in Chrome.
4. Enable `Developer mode`.
5. Click `Load unpacked`.
6. Select the unzipped project folder.

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

## Notes and limitations

- Each user must configure their own Obsidian Local REST API key. Do not share your API key.
- The default API URL is `http://127.0.0.1:27123`; change it only if your Obsidian plugin uses a different port or HTTPS endpoint.
- The extension only reads X posts currently loaded in the browser page. Scroll the bookmarks page first if you want more posts to appear.
- The extension tries to expand inline `Show more` / `显示更多` content before saving. If X requires opening the tweet detail page to see the full text, only the text visible in the bookmarks page can be saved.
- Existing notes are skipped and never overwritten. Delete the old note or change the target folder if you want to save the same tweet again.
- This project does not call any paid API and does not use the X API.

## Development

Run tests:

```sh
npm test
```
