(function (root) {
  "use strict";

  var core = root.XBookmarkCore;
  if (!core && typeof require === "function") {
    core = require("./core");
  }

  function encodeVaultPath(path) {
    return String(path)
      .split("/")
      .map(function (part) {
        return encodeURIComponent(part);
      })
      .join("/");
  }

  function buildApiUrl(apiBaseUrl, vaultPath) {
    return String(apiBaseUrl || core.DEFAULT_SETTINGS.apiBaseUrl).replace(/\/+$/, "") +
      "/vault/" +
      encodeVaultPath(vaultPath);
  }

  function normalizeApiKey(apiKey) {
    return String(apiKey || "")
      .trim()
      .replace(/^authorization:\s*/i, "")
      .replace(/^bearer\s+/i, "")
      .trim();
  }

  function buildHeaders(apiKey, contentType) {
    var headers = {};
    var normalizedApiKey = normalizeApiKey(apiKey);
    if (normalizedApiKey) {
      headers.Authorization = "Bearer " + normalizedApiKey;
    }
    if (contentType) {
      headers["Content-Type"] = contentType;
    }
    return headers;
  }

  function statusMessage(status) {
    if (status === 401 || status === 403) {
      return "API key 无效或没有权限，请重新从 Obsidian Local REST API 设置复制 API key";
    }
    if (status === 404) {
      return "未找到";
    }
    return "Obsidian API 返回 HTTP " + status;
  }

  async function saveOneBookmark(bookmark, settings, fetchImpl) {
    var folder = settings.folder || core.DEFAULT_SETTINGS.folder;
    var apiBaseUrl = settings.apiBaseUrl || core.DEFAULT_SETTINGS.apiBaseUrl;
    var apiKey = normalizeApiKey(settings.apiKey);
    var vaultPath = core.buildVaultPath(folder, bookmark.tweetId);
    var url = buildApiUrl(apiBaseUrl, vaultPath);

    try {
      var existing = await fetchImpl(url, {
        method: "GET",
        headers: buildHeaders(apiKey)
      });

      if (existing.status === 200) {
        return {
          tweetId: bookmark.tweetId,
          status: "exists",
          message: "已存在，跳过"
        };
      }

      if (existing.status !== 404) {
        return {
          tweetId: bookmark.tweetId,
          status: "failed",
          message: statusMessage(existing.status)
        };
      }

      var capturedAt = new Date().toISOString();
      var markdown = core.renderMarkdown(bookmark, capturedAt);
      var created = await fetchImpl(url, {
        method: "PUT",
        headers: buildHeaders(apiKey, "text/markdown; charset=utf-8"),
        body: markdown
      });

      if (created.ok) {
        return {
          tweetId: bookmark.tweetId,
          status: "saved",
          message: "已保存"
        };
      }

      return {
        tweetId: bookmark.tweetId,
        status: "failed",
        message: statusMessage(created.status)
      };
    } catch (error) {
      return {
        tweetId: bookmark.tweetId,
        status: "failed",
        message: "无法连接 Obsidian Local REST API，请确认 Obsidian 已启动且插件已启用"
      };
    }
  }

  async function saveBookmarks(bookmarks, settings, fetchImpl) {
    var fetcher = fetchImpl || root.fetch;
    var results = [];

    if (!settings || !normalizeApiKey(settings.apiKey)) {
      return bookmarks.map(function (bookmark) {
        return {
          tweetId: bookmark.tweetId,
          status: "failed",
          message: "请先在设置中填写 Obsidian Local REST API key"
        };
      });
    }

    for (var index = 0; index < bookmarks.length; index += 1) {
      results.push(await saveOneBookmark(bookmarks[index], settings, fetcher));
    }

    return results;
  }

  var api = {
    buildApiUrl: buildApiUrl,
    encodeVaultPath: encodeVaultPath,
    normalizeApiKey: normalizeApiKey,
    saveBookmarks: saveBookmarks
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  } else {
    root.XBookmarkObsidian = api;
  }
})(typeof globalThis !== "undefined" ? globalThis : this);
