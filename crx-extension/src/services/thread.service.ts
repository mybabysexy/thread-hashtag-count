import { InitOptions, PostData } from "./types.ts";

export function dataToCSV(data: PostData[]): string {
    const header: (keyof PostData)[] = [
        "time",
        "link",
        "content",
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

export async function evaluateTab<T>(tabId: number, callback: () => T): Promise<T | null> {
    const res = await chrome.scripting.executeScript({
        target: { tabId },
        func: callback,
    });
    if (res && res.length > 0) {
        return res[0].result as T;
    }
    return null;
}

export async function getPosts(tabId: number, options: InitOptions): Promise<PostData[]> {
    const {
        tagId,
        includeTag = true,
    } = options;

    const res = await chrome.scripting.executeScript({
        target: { tabId },
        func: async (tagId: string, includeTag: boolean) => {
            const wrapper = document
              .querySelectorAll(
                "#barcelona-page-layout .x78zum5.xdt5ytf.x1iyjqo2.x1n2onr6"
              )
              .item(3);

            if (!wrapper) {
                return [];
            }

            const elements = Array.from(wrapper.querySelectorAll(":scope > .x78zum5.xdt5ytf"));

            const items = elements.map((el) => {
                const timeBlock = el.querySelector("time");
                if (!timeBlock) {
                    return null;
                }
                const timeParent = timeBlock.parentElement; // post link
                const time = timeBlock.getAttribute("datetime") || "";
                const link = timeParent!.getAttribute("href") || "";
                const id = link!.split("/post/").pop() || "";

                if (tagId && includeTag) {
                    const tagLinks = el.querySelectorAll("a.x1i10hfl");
                    const hasTag = Array.from(tagLinks).some((tag) =>
                      (tag.getAttribute("href") || "").includes(`tag_id=${tagId}`)
                    );
                    if (!hasTag) {
                        return null;
                    }
                }

                let content = el.querySelector('.x1a6qonq')?.textContent || "";
                content = content.replace(/[\r\n]+/g, " ");
                // remove nbsp
                content = content.replace(/&nbsp;/g, " ");
                // remove extra spaces
                content = content.replace(/\s+/g, " ");
                // quote double quotes
                content = content.replace(/"/g, '""');

                // escape content for csv
                content = `"${content}"`;

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
                    content,
                    likes,
                    comments,
                    reposts,
                };
            }).filter((i) => i !== null) as PostData[];

            if (!items.length) {
                return [];
            }

            return items;
        },
        args: [ tagId, includeTag ]
    });

    if (res && res.length > 0) {
        return res[0].result as PostData[];
    }
    return [];
}

export const readableDate = (from: Date, to: Date, title = '') => {
    const diff = Math.abs(from.getTime() - to.getTime()) / 1000;

    if (diff < 0) return '0 giây';

    const p = {
        'year': 'năm',
        'month': 'tháng',
        'week': 'tuần',
        'day': 'ngày',
        'hour': 'giờ',
        'minute': 'phút',
        'second': 'giây'
    };
    const d: { key: keyof typeof p, value: number }[] = [];

    d.push({ key: 'year', value: Math.floor(diff / 31536000) });
    d.push({ key: 'month', value: Math.floor(diff / 2592000) });
    d.push({ key: 'week', value: Math.floor(diff / 604800) });
    d.push({ key: 'day', value: Math.floor(diff / 86400) });
    d.push({ key: 'hour', value: Math.floor(diff / 3600) });
    d.push({ key: 'minute', value: Math.floor(diff / 60) });
    d.push({ key: 'second', value: Math.round(diff) });

    const found = d.filter(item => item.value > 0)[0];

    if (found) {
        return [found.value, p[found.key], title]
            .filter(item => item != '')
            .join(' ');
    }

    return '-';
}
