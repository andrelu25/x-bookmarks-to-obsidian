(function () {
  "use strict";

  var bookmarks = [];
  var resultsByTweetId = new Map();

  var collectButton = document.getElementById("collectButton");
  var saveButton = document.getElementById("saveButton");
  var statusNode = document.getElementById("status");
  var listNode = document.getElementById("list");
  var openOptionsButton = document.getElementById("openOptions");
  var settingsSummary = document.getElementById("settingsSummary");

  function setStatus(message) {
    statusNode.textContent = message;
  }

  function getCheckedBookmarks() {
    var checked = Array.from(listNode.querySelectorAll("input[type='checkbox']:checked"))
      .map(function (input) {
        return input.value;
      });

    return bookmarks.filter(function (bookmark) {
      return checked.includes(bookmark.tweetId);
    });
  }

  function renderList() {
    listNode.textContent = "";

    bookmarks.forEach(function (bookmark) {
      var label = document.createElement("label");
      label.className = "item";

      var checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.value = bookmark.tweetId;
      checkbox.checked = true;
      checkbox.addEventListener("change", function () {
        saveButton.disabled = getCheckedBookmarks().length === 0;
      });

      var content = document.createElement("div");
      var title = document.createElement("strong");
      title.textContent = (bookmark.authorName || "Unknown") +
        (bookmark.handle ? " (@" + bookmark.handle + ")" : "");

      var text = document.createElement("p");
      text.textContent = bookmark.text || "[No text captured]";

      content.appendChild(title);
      content.appendChild(text);

      var result = resultsByTweetId.get(bookmark.tweetId);
      if (result) {
        var resultNode = document.createElement("div");
        resultNode.className = "result " + result.status;
        resultNode.textContent = result.message;
        content.appendChild(resultNode);
      }

      label.appendChild(checkbox);
      label.appendChild(content);
      listNode.appendChild(label);
    });

    saveButton.disabled = getCheckedBookmarks().length === 0;
  }

  function withCurrentTab(callback) {
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      callback(tabs[0]);
    });
  }

  function collectBookmarks() {
    setStatus("正在抓取当前页面已加载的帖子...");
    resultsByTweetId.clear();

    withCurrentTab(function (tab) {
      if (!tab || !tab.id || !/^https:\/\/(x|twitter)\.com\//.test(tab.url || "")) {
        setStatus("请先打开 X 书签页：https://x.com/i/bookmarks");
        return;
      }

      chrome.tabs.sendMessage(tab.id, { type: "COLLECT_VISIBLE_BOOKMARKS" }, function (response) {
        if (chrome.runtime.lastError) {
          setStatus("无法读取页面，请刷新 X 书签页后重试");
          return;
        }

        bookmarks = response && response.bookmarks ? response.bookmarks : [];
        renderList();

        var warnings = response && response.warnings ? response.warnings : [];
        if (warnings.length > 0) {
          setStatus(warnings.join("；"));
          return;
        }

        if (response && response.expandedCount > 0) {
          setStatus("已抓取 " + bookmarks.length + " 条，并展开 " + response.expandedCount + " 处长帖内容。");
          return;
        }

        setStatus("已抓取 " + bookmarks.length + " 条，取消勾选不想保存的帖子。");
      });
    });
  }

  function saveSelected() {
    var selected = getCheckedBookmarks();
    if (selected.length === 0) {
      setStatus("请至少选择一条帖子");
      return;
    }

    saveButton.disabled = true;
    setStatus("正在保存 " + selected.length + " 条到 Obsidian...");

    chrome.runtime.sendMessage({ type: "SAVE_BOOKMARKS", bookmarks: selected }, function (response) {
      if (chrome.runtime.lastError) {
        setStatus("保存失败：" + chrome.runtime.lastError.message);
        saveButton.disabled = false;
        return;
      }

      if (response && response.error) {
        setStatus("保存失败：" + response.error);
        saveButton.disabled = false;
        return;
      }

      var results = response && response.results ? response.results : [];
      results.forEach(function (result) {
        resultsByTweetId.set(result.tweetId, result);
      });
      renderList();

      var saved = results.filter(function (result) { return result.status === "saved"; }).length;
      var exists = results.filter(function (result) { return result.status === "exists"; }).length;
      var failed = results.filter(function (result) { return result.status === "failed"; }).length;
      setStatus("完成：保存 " + saved + "，已存在 " + exists + "，失败 " + failed + "。");
    });
  }

  function loadSettingsSummary() {
    chrome.storage.local.get(
      { apiBaseUrl: "http://127.0.0.1:27123", folder: "X Bookmarks", apiKey: "" },
      function (settings) {
        settingsSummary.textContent = settings.apiKey
          ? settings.folder + " · " + settings.apiBaseUrl
          : "请先填写 Obsidian API key";
      }
    );
  }

  collectButton.addEventListener("click", collectBookmarks);
  saveButton.addEventListener("click", saveSelected);
  openOptionsButton.addEventListener("click", function () {
    chrome.runtime.openOptionsPage();
  });

  loadSettingsSummary();
})();
