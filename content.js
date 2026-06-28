(function () {
  "use strict";

  function getTweetIdFromUrl(url) {
    var match = String(url || "").match(/\/status\/(\d+)/);
    return match ? match[1] : "";
  }

  function normalizeHandle(handle) {
    return String(handle || "").trim().replace(/^@+/, "");
  }

  function extractHandleFromUrl(url) {
    try {
      var parsed = new URL(url);
      var parts = parsed.pathname.split("/").filter(Boolean);
      return normalizeHandle(parts[0] || "");
    } catch (error) {
      return "";
    }
  }

  function normalizeTweetUrl(url, handle) {
    var tweetId = getTweetIdFromUrl(url);
    var cleanHandle = normalizeHandle(handle) || extractHandleFromUrl(url);
    return cleanHandle
      ? "https://x.com/" + cleanHandle + "/status/" + tweetId
      : "https://x.com/i/status/" + tweetId;
  }

  function textFrom(node) {
    return node ? node.innerText.trim().replace(/\n{3,}/g, "\n\n") : "";
  }

  function wait(milliseconds) {
    return new Promise(function (resolve) {
      window.setTimeout(resolve, milliseconds);
    });
  }

  function isShowMoreText(value) {
    var text = String(value || "").trim().toLowerCase();
    return text === "显示更多" ||
      text === "show more" ||
      text === "show more replies" ||
      text === "show this thread";
  }

  function findInlineShowMoreControls(article) {
    return Array.from(article.querySelectorAll('button, [role="button"]'))
      .filter(function (control) {
        if (control.closest("a")) {
          return false;
        }
        return isShowMoreText(control.textContent) || isShowMoreText(control.getAttribute("aria-label"));
      });
  }

  async function expandInlineLongPosts(articles) {
    var expandedCount = 0;

    for (var index = 0; index < articles.length; index += 1) {
      var controls = findInlineShowMoreControls(articles[index]);
      for (var controlIndex = 0; controlIndex < controls.length; controlIndex += 1) {
        try {
          controls[controlIndex].click();
          expandedCount += 1;
          await wait(250);
        } catch (error) {
          // Ignore controls that X removes while the page is updating.
        }
      }
    }

    if (expandedCount > 0) {
      await wait(500);
    }

    return expandedCount;
  }

  function extractAuthorName(article, handle) {
    var userNameLink = article.querySelector('a[href="/' + CSS.escape(handle) + '"]');
    if (userNameLink) {
      var spans = Array.from(userNameLink.querySelectorAll("span"))
        .map(function (span) {
          return span.textContent.trim();
        })
        .filter(Boolean)
        .filter(function (value) {
          return value !== "@" + handle;
        });
      if (spans.length > 0) {
        return spans[0];
      }
    }

    var userName = article.querySelector('[data-testid="User-Name"]');
    if (!userName) {
      return "";
    }

    var lines = textFrom(userName).split("\n").filter(Boolean);
    return lines.find(function (line) {
      return line !== "@" + handle && !line.startsWith("@");
    }) || "";
  }

  function extractBookmarkFromArticle(article) {
    var statusLink = Array.from(article.querySelectorAll('a[href*="/status/"]'))
      .map(function (link) {
        return link.href;
      })
      .find(function (href) {
        return getTweetIdFromUrl(href);
      });

    var tweetId = getTweetIdFromUrl(statusLink);
    if (!tweetId) {
      return null;
    }

    var handle = extractHandleFromUrl(statusLink);
    var tweetText = article.querySelector('[data-testid="tweetText"]');
    var text = textFrom(tweetText);

    if (!text) {
      text = textFrom(article)
        .split("\n")
        .filter(function (line) {
          return line && line !== "Ad" && !line.startsWith("@");
        })
        .slice(0, 8)
        .join("\n");
    }

    return {
      tweetId: tweetId,
      url: normalizeTweetUrl(statusLink, handle),
      authorName: extractAuthorName(article, handle),
      handle: handle,
      text: text
    };
  }

  async function collectVisibleBookmarks() {
    var warnings = [];
    var path = window.location.pathname;
    if (path !== "/i/bookmarks") {
      warnings.push("请先打开 X 书签页：https://x.com/i/bookmarks");
    }

    var articles = Array.from(document.querySelectorAll('article[data-testid="tweet"]'));
    var expandedCount = await expandInlineLongPosts(articles);
    articles = Array.from(document.querySelectorAll('article[data-testid="tweet"]'));
    var seen = new Set();
    var bookmarks = [];

    articles.forEach(function (article) {
      var bookmark = extractBookmarkFromArticle(article);
      if (!bookmark || seen.has(bookmark.tweetId)) {
        return;
      }
      seen.add(bookmark.tweetId);
      bookmarks.push(bookmark);
    });

    if (bookmarks.length === 0) {
      warnings.push("当前页面没有识别到已加载的书签帖子，请确认页面加载完成或向下滚动后重试");
    }

    return { bookmarks: bookmarks, warnings: warnings, expandedCount: expandedCount };
  }

  chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
    if (!message || message.type !== "COLLECT_VISIBLE_BOOKMARKS") {
      return false;
    }

    collectVisibleBookmarks()
      .then(sendResponse)
      .catch(function () {
        sendResponse({
          bookmarks: [],
          warnings: ["抓取失败，请刷新 X 书签页后重试"],
          expandedCount: 0
        });
      });
    return true;
  });
})();
