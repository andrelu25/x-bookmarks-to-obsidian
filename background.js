importScripts("src/core.js", "src/obsidianClient.js");

chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
  if (!message || message.type !== "SAVE_BOOKMARKS") {
    return false;
  }

  chrome.storage.local.get(XBookmarkCore.DEFAULT_SETTINGS, function (settings) {
    XBookmarkObsidian.saveBookmarks(message.bookmarks || [], settings, fetch)
      .then(function (results) {
        sendResponse({ results: results });
      })
      .catch(function (error) {
        sendResponse({
          results: [],
          error: error && error.message ? error.message : "保存失败"
        });
      });
  });

  return true;
});
