(function () {
  "use strict";

  var defaults = {
    apiBaseUrl: "http://127.0.0.1:27123",
    apiKey: "",
    folder: "X Bookmarks"
  };

  var apiBaseUrl = document.getElementById("apiBaseUrl");
  var apiKey = document.getElementById("apiKey");
  var folder = document.getElementById("folder");
  var saveSettings = document.getElementById("saveSettings");
  var testConnection = document.getElementById("testConnection");
  var statusNode = document.getElementById("status");

  function setStatus(message) {
    statusNode.textContent = message;
  }

  function normalizeApiKey(value) {
    return String(value || "")
      .trim()
      .replace(/^authorization:\s*/i, "")
      .replace(/^bearer\s+/i, "")
      .trim();
  }

  function readForm() {
    return {
      apiBaseUrl: apiBaseUrl.value.trim() || defaults.apiBaseUrl,
      apiKey: normalizeApiKey(apiKey.value),
      folder: folder.value.trim() || defaults.folder
    };
  }

  function save() {
    var settings = readForm();
    apiKey.value = settings.apiKey;
    chrome.storage.local.set(settings, function () {
      setStatus("设置已保存");
    });
  }

  function load() {
    chrome.storage.local.get(defaults, function (settings) {
      apiBaseUrl.value = settings.apiBaseUrl;
      apiKey.value = settings.apiKey;
      folder.value = settings.folder;
    });
  }

  async function test() {
    var settings = readForm();
    if (!settings.apiKey) {
      setStatus("请先填写 API key");
      return;
    }

    setStatus("正在测试连接...");

    try {
      var response = await fetch(settings.apiBaseUrl.replace(/\/+$/, "") + "/", {
        method: "GET",
        headers: {
          Authorization: "Bearer " + settings.apiKey
        }
      });

      if (response.ok) {
        setStatus("连接成功");
        return;
      }

      if (response.status === 401 || response.status === 403) {
        setStatus("连接失败：API key 无效或没有权限");
        return;
      }

      setStatus("连接失败：HTTP " + response.status);
    } catch (error) {
      setStatus("连接失败：请确认 Obsidian 已启动，并已启用 Local REST API 的 HTTP server");
    }
  }

  saveSettings.addEventListener("click", save);
  testConnection.addEventListener("click", test);
  load();
})();
