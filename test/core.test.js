const test = require("node:test");
const assert = require("node:assert/strict");

const core = require("../src/core");
const obsidian = require("../src/obsidianClient");

test("normalizes tweet urls from x.com and twitter.com", () => {
  assert.equal(
    core.normalizeTweetUrl("https://twitter.com/example/status/123456789?s=20", ""),
    "https://x.com/example/status/123456789"
  );
  assert.equal(
    core.normalizeTweetUrl("https://x.com/example/status/987/photo/1", "@other"),
    "https://x.com/other/status/987"
  );
});

test("renders frontmatter values as quoted yaml-safe strings", () => {
  const markdown = core.renderMarkdown(
    {
      tweetId: "123",
      url: "https://x.com/a/status/123",
      authorName: 'A: "quoted"',
      handle: "@a",
      text: "hello"
    },
    "2026-06-28T00:00:00.000Z"
  );

  assert.match(markdown, /author: "A: \\"quoted\\""/);
  assert.match(markdown, /tweet_id: "123"/);
  assert.match(markdown, /captured_at: "2026-06-28T00:00:00.000Z"/);
});

test("builds vault path from folder and tweet id only", () => {
  assert.equal(core.buildVaultPath("X Bookmarks", "123456"), "X Bookmarks/123456.md");
  assert.equal(core.buildVaultPath(" Inbox / X ", "456"), "Inbox/X/456.md");
});

test("save flow skips existing files and writes missing files", async () => {
  const calls = [];
  const fetchImpl = async (url, options) => {
    calls.push({ url, options });
    if (options.method === "GET" && url.endsWith("/111.md")) {
      return { status: 200, ok: true };
    }
    if (options.method === "GET") {
      return { status: 404, ok: false };
    }
    return { status: 204, ok: true };
  };

  const results = await obsidian.saveBookmarks(
    [
      {
        tweetId: "111",
        url: "https://x.com/a/status/111",
        authorName: "A",
        handle: "a",
        text: "first"
      },
      {
        tweetId: "222",
        url: "https://x.com/b/status/222",
        authorName: "B",
        handle: "b",
        text: "second"
      }
    ],
    {
      apiBaseUrl: "http://127.0.0.1:27123",
      apiKey: "test-key",
      folder: "X Bookmarks"
    },
    fetchImpl
  );

  assert.deepEqual(results.map((result) => result.status), ["exists", "saved"]);
  assert.equal(calls.filter((call) => call.options.method === "PUT").length, 1);
  assert.match(calls[0].url, /X%20Bookmarks\/111\.md$/);
  assert.match(calls[2].options.body, /tweet_id: "222"/);
});

test("save flow accepts api keys pasted with bearer prefix", async () => {
  const calls = [];
  const fetchImpl = async (url, options) => {
    calls.push({ url, options });
    if (options.method === "GET") {
      return { status: 404, ok: false };
    }
    return { status: 204, ok: true };
  };

  await obsidian.saveBookmarks(
    [
      {
        tweetId: "333",
        url: "https://x.com/a/status/333",
        authorName: "A",
        handle: "a",
        text: "third"
      }
    ],
    {
      apiBaseUrl: "http://127.0.0.1:27123",
      apiKey: "Bearer test-key",
      folder: "X Bookmarks"
    },
    fetchImpl
  );

  assert.equal(calls[0].options.headers.Authorization, "Bearer test-key");
  assert.equal(calls[1].options.headers.Authorization, "Bearer test-key");
});

test("save flow fails early without api key", async () => {
  const results = await obsidian.saveBookmarks(
    [{ tweetId: "111", url: "https://x.com/a/status/111", authorName: "A", handle: "a", text: "first" }],
    { apiBaseUrl: "http://127.0.0.1:27123", folder: "X Bookmarks", apiKey: "" },
    async () => {
      throw new Error("should not fetch");
    }
  );

  assert.equal(results[0].status, "failed");
  assert.match(results[0].message, /API key/);
});
