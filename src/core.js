(function (root) {
  "use strict";

  var DEFAULT_SETTINGS = {
    apiBaseUrl: "http://127.0.0.1:27123",
    folder: "X Bookmarks",
    apiKey: ""
  };

  function normalizeHandle(handle) {
    if (!handle) {
      return "";
    }
    return String(handle).trim().replace(/^@+/, "");
  }

  function getTweetIdFromUrl(url) {
    if (!url) {
      return "";
    }

    var match = String(url).match(/\/status\/(\d+)/);
    return match ? match[1] : "";
  }

  function normalizeTweetUrl(url, handle) {
    var tweetId = getTweetIdFromUrl(url);
    if (!tweetId) {
      return "";
    }

    var normalizedHandle = normalizeHandle(handle);
    if (!normalizedHandle) {
      try {
        var parsed = new URL(url);
        var parts = parsed.pathname.split("/").filter(Boolean);
        normalizedHandle = parts[0] || "";
      } catch (error) {
        normalizedHandle = "";
      }
    }

    return normalizedHandle
      ? "https://x.com/" + normalizedHandle + "/status/" + tweetId
      : "https://x.com/i/status/" + tweetId;
  }

  function buildVaultPath(folder, tweetId) {
    var cleanFolder = String(folder || DEFAULT_SETTINGS.folder)
      .split("/")
      .map(function (part) {
        return part.trim();
      })
      .filter(Boolean)
      .join("/");

    return cleanFolder + "/" + tweetId + ".md";
  }

  function escapeYamlString(value) {
    return JSON.stringify(String(value || ""));
  }

  function renderMarkdown(bookmark, capturedAt) {
    var authorName = bookmark.authorName || "";
    var handle = normalizeHandle(bookmark.handle);
    var text = String(bookmark.text || "").trim();
    var url = normalizeTweetUrl(bookmark.url, handle);
    var savedAt = capturedAt || new Date().toISOString();

    return [
      "---",
      "source: x-bookmark",
      "tweet_id: " + escapeYamlString(bookmark.tweetId),
      "url: " + escapeYamlString(url),
      "author: " + escapeYamlString(authorName),
      "handle: " + escapeYamlString(handle ? "@" + handle : ""),
      "captured_at: " + escapeYamlString(savedAt),
      "tags: [x, bookmark]",
      "---",
      "",
      "# X Bookmark",
      "",
      "- Author: " + (authorName || "Unknown") + (handle ? " (@" + handle + ")" : ""),
      "- Original: " + url,
      "- Saved: " + savedAt,
      "",
      "## Post",
      "",
      text || "[No text captured]",
      ""
    ].join("\n");
  }

  var api = {
    DEFAULT_SETTINGS: DEFAULT_SETTINGS,
    normalizeHandle: normalizeHandle,
    getTweetIdFromUrl: getTweetIdFromUrl,
    normalizeTweetUrl: normalizeTweetUrl,
    buildVaultPath: buildVaultPath,
    escapeYamlString: escapeYamlString,
    renderMarkdown: renderMarkdown
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  } else {
    root.XBookmarkCore = api;
  }
})(typeof globalThis !== "undefined" ? globalThis : this);
