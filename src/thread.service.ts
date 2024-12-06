import puppeteer, { LaunchOptions, Browser, Page } from "puppeteer";
import fs from "fs";
import { BrowserlessEndpoint, InitOptions, PostData } from "./types";

class ThreadService {
  protected browser: Browser | null;
  protected endpoint: BrowserlessEndpoint;
  protected execTimeLimit: number = 1800000;
  protected totalItemsLimit: number = 100;
  protected url: string = "";

  constructor() {
    this.browser = null;
    this.endpoint = {
      url: process.env.BROWSERLESS_URL || "ws://localhost:3000",
      token: process.env.BROWSERLESS_TOKEN || "6R0W53R135510",
    };
    this.execTimeLimit = 1800000;
  }

  async init(options: InitOptions): Promise<Page> {
    this.url = options.url;

    if (options.execTimeLimit) {
      this.execTimeLimit = options.execTimeLimit;
    }

    if (options.totalItemsLimit) {
      this.totalItemsLimit = options.totalItemsLimit;
    }

    const launchArgs: LaunchOptions = {
      args: [`--window-size=1920,1080`, `--user-data-dir=/tmp/chrome/data-dir`],
      headless: false,
      timeout: this.execTimeLimit + 5000, // add 5s
    };

    if (!process.env.BROWSERLESS_URL && !process.env.BROWSERLESS_TOKEN) {
      this.browser = await puppeteer.launch(launchArgs);
    } else {
      const queryParams = new URLSearchParams({
        token: this.endpoint.token,
        launch: JSON.stringify(launchArgs),
      }).toString();
      this.browser = await puppeteer.connect({
        browserWSEndpoint: `${this.endpoint.url}?${queryParams}`,
      });
    }

    const page = await this.browser.newPage();
    return page;
  }

  async addCookies(): Promise<void> {
    if (!this.browser) {
      return;
    }

    const file = "thread-cookies.json";
    const cookies = JSON.parse(fs.readFileSync(file, "utf-8"));
    await this.browser.setCookie(...cookies);
  }

  async getPosts(page: Page): Promise<PostData[]> {
    if (!this.browser) {
      return [];
    }

    const tagId = this.url.match(/tag_id=(\d+)/)?.[1];

    await page.goto(this.url);
    await page.waitForSelector(".x78zum5.xdt5ytf");

    const LIMIT = 100;
    const startTime = Date.now();

    let lastHeight = 0;

    let data: PostData[] = [];

    console.time("totalFetch");

    try {
      do {
        await page.waitForFunction(
          "document.body.scrollHeight > " + lastHeight,
          { timeout: 60000 }
        );

        const items: PostData[] = await page.evaluate((tagId) => {
          const wrapper = document
            .querySelectorAll(
              "#barcelona-page-layout .x78zum5.xdt5ytf.x1iyjqo2.x1n2onr6"
            )
            .item(3);

          const elements = [
            ...wrapper.querySelectorAll("& > .x78zum5.xdt5ytf"),
          ];
          const results = elements.map((el) => {
            const timeBlock = el.querySelector("time");
            if (!timeBlock) {
              return null;
            }
            const timeParent = timeBlock.parentElement; // post link
            const time = timeBlock.getAttribute("datetime") || "";
            const link = timeParent!.getAttribute("href") || "";
            const id = link!.split("/post/").pop() || "";

            if (tagId) {
              const tagLinks = el.querySelectorAll("a.x1w4el19");
              const hasTag = Array.from(tagLinks).some((tag) =>
                (tag.getAttribute("href") || "").includes(`tag_id=${tagId}`)
              );
              if (!hasTag) {
                return null;
              }
            }

            const interactions = el.querySelectorAll(
              ".x17qophe.x10l6tqk.x13vifvy"
            );
            const likes = interactions[0]?.textContent || "0";
            const comments = interactions[1]?.textContent || "0";
            const reposts = interactions[2]?.textContent || "0";

            return {
              id,
              time,
              link,
              likes,
              comments,
              reposts,
            };
          });
          return results.filter((i) => i !== null) as PostData[];
        }, tagId);

        if (!items.length) {
          console.log("no more items");
          break;
        }

        data.push(...items);
        data = data.filter(
          (v, i, a) => a.findIndex((t) => t.id === v.id) === i
        );

        console.log("total raw", data.length);

        // scroll to load more
        lastHeight = await page.evaluate(() => {
          const height = document.body.scrollHeight;
          window.scrollTo(0, height);
          return height;
        });
      } while (
        data.length <= LIMIT &&
        Date.now() - startTime < this.execTimeLimit
      );
    } catch (e: Error | unknown) {
      const errorMessage = (e as Error).message;
      console.log("error", errorMessage);
    }

    console.timeEnd("totalFetch");

    return data;
  }

  async close() {
    if (this.browser) {
      await this.browser.close();
    }
  }

  dataToCSV(data: PostData[]): string {
    const header: (keyof PostData)[] = [
      "time",
      "link",
      "likes",
      "comments",
      "reposts",
    ];
    const csv = data.map((row) => {
      return header.map((fieldName) => row[fieldName] || "").join(",");
    });
    csv.unshift(header.join(","));
    return csv.join("\n");
  }
}

export default ThreadService;
