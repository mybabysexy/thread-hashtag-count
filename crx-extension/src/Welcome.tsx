import { useEffect, useRef, useState } from 'react';
import { useAppContext } from './context/AppContext.tsx';
import { dataToCSV, evaluateTab, getPosts, readableDate } from './services/thread.service.ts';
import { PostData } from './services/types.ts';
import Hi from '/hi.png';

const Welcome = () => {
    const { initApp, search, tagId, tabId, setTabId } = useAppContext();
    const [ keywords, setKeywords ] = useState<string>('');
    const [ limit, setLimit ] = useState<string>('1000');
    const [ includeTag, setIncludeTag ] = useState<boolean>(true);

    const [ running, setRunning ] = useState<boolean>(false);
    const [ aborting, setAborting ] = useState<boolean>(false);
    const [ posts, setPosts ] = useState<PostData[]>([]);
    const [ formattedTime, setFormattedTime ] = useState<string>('');

    const controllerRef = useRef<AbortController | null>(null);

    const checkHasMore = async (tabId: number, targetHeight: number, signal: AbortSignal) => {
        const startTime = Date.now();
        const maxWaitTime = 60000; // 30 seconds

        while (!signal.aborted) {
            const hasLoadingSpinner = await evaluateTab(tabId, () => {
                const element = document.querySelector('[aria-label="Loading..."]');
                return !!element;
            }) as boolean;
            if (!hasLoadingSpinner) {
                return false;
            }

            const currentHeight = await evaluateTab(tabId, () => document.body.scrollHeight) as number;
            if (currentHeight > targetHeight) {
                return true;
            }
            if (Date.now() - startTime > maxWaitTime) {
                return false;
            }
            await sleep(1000);
        }

        return false;
    };

    const sleep = async (ms: number): Promise<void> => {
        return new Promise((resolve) => setTimeout(resolve, ms));
    };

    const handleCollectPosts = async () => {
        const keywordsArray = keywords.split(',').map((keyword) => keyword.trim()).filter((keyword) => keyword.length > 0).map((keyword) => keyword.toLowerCase());
        const totalItemsLimit = limit ? parseInt(limit) : 1000;

        // get items on the page
        const items = await chrome.tabs.query({ active: true, currentWindow: true });
        const page = items[0]?.id;
        if (page) {
            setTabId(page);

            controllerRef.current = new AbortController();
            setRunning(true);
            setPosts([]);

            let data: PostData[] = [];

            const start = new Date();
            const startTime = Date.now();

            let lastHeight = 0;
            let tries = 0;
            const maxTries = 5;

            do {
                const hasMore = await checkHasMore(page, lastHeight, controllerRef.current.signal);
                console.log('hasMore', hasMore);

                const items = await getPosts(page, {
                    signal: controllerRef.current.signal,
                    tagId: tagId as string,
                    includeTag,
                });
                console.log('raw items', items.length);

                if (!items.length) {
                    console.log('retrying...');
                    if (tries >= maxTries) {
                        break;
                    }
                    tries++;
                    await sleep(5000);
                    continue;
                } else {
                    tries = 0;
                }

                data = [
                    ...data,
                    ...items,
                ].filter(
                  (v, i, a) => a.findIndex((t: PostData) => t.id === v.id) === i
                ) as PostData[];
                if (keywordsArray.length > 0) {
                    console.log('filtering by keywords', keywordsArray);
                    data = data.filter((item) => {
                        console.log('item', item);
                        return keywordsArray.some((keyword) =>
                          item.content.toLowerCase().includes(keyword)
                        );
                    });
                }
                console.log('total unique items', data.length);

                if (!hasMore) {
                    break;
                }

                lastHeight = await evaluateTab(page, () => {
                    const height = document.body.scrollHeight;
                    window.scrollTo(0, height);
                    return height;
                }) as number;

                await sleep(3000);
            }
            while (
              data.length <= totalItemsLimit &&
              Date.now() - startTime < 1800000 &&
              !controllerRef.current.signal.aborted
              );

            setRunning(false);
            setAborting(false);

            setFormattedTime(readableDate(start, new Date()));

            return data;
        }

        return [];
    };

    const handleStart = async () => {
        const initSuccess = await initApp();

        if (initSuccess) {
            if (limit && parseInt(limit) > 0) {
                const limitNumber = parseInt(limit);
                if (limitNumber > 10000) {
                    alert('Giới hạn tối đa là 10000');
                    return;
                }
            }

            const data = await handleCollectPosts();
            setPosts(data);
        }
    };

    const handleAbort = () => {
        if (controllerRef.current) {
            setAborting(true);
            controllerRef.current.abort();
        }
    };

    const handleDownload = () => {
        if (posts.length > 0) {
            const csv = dataToCSV(posts);
            const blob = new Blob([ csv ], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `threads_posts_${search}.csv`;
            a.click();
            URL.revokeObjectURL(url);
        }
    };

    useEffect(() => {
        if (tabId !== undefined) {
            chrome.scripting.executeScript({
                target: { tabId },
                func: (running) => {
                    const element = document.getElementById('counter-loading-spinner');
                    if (!element) {
                        return;
                    }

                    if (running) {
                        element.style.display = 'flex';
                    } else {
                        element.style.display = 'none';
                    }
                },
                args: [ running ],
            });
        }
    }, [ running, tabId ]);

    return (
      <div className={'w-full flex flex-col items-center gap-6'}>
          <img src={Hi} alt="hi" />
          <div className={'w-full flex flex-col items-center gap-3 max-w-96'}>
              <div>
                  Hashtag: <span className={'text-cyan-500 font-bold'}>{search}</span>
              </div>
              <div className={'flex flex-col gap-2 w-full'}>
                  <label htmlFor="keyword">Lọc theo từ khóa (không phân biệt hoa thường):</label>
                  <input
                    type="text"
                    id="keyword"
                    className={'w-full border border-cyan-500 rounded px-2 py-1 outline-none focus:border-cyan-700'}
                    placeholder={'Nhập các từ khóa cách nhau bằng dấu phẩy'}
                    value={keywords}
                    onChange={(e) => setKeywords(e.target?.value || '')}
                    disabled={running}
                  />
              </div>
              <div className={'flex flex-col gap-2 w-full'}>
                  <label htmlFor="limit">Giới hạn post:</label>
                  <input
                    type="number"
                    id="limit"
                    className={'w-full border border-cyan-500 rounded px-2 py-1 outline-none focus:border-cyan-700'}
                    placeholder={'1000'}
                    value={limit}
                    onChange={(e) => setLimit(e.target?.value || '')}
                    disabled={running}
                  />
              </div>
              <div className="flex items-center gap-2 w-full">
                  <button
                    type="button"
                    role="switch"
                    aria-checked={includeTag}
                    id="includeTag"
                    onClick={() => !running && setIncludeTag(!includeTag)}
                    disabled={running}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-700 ${
                      includeTag ? "bg-cyan-500" : "bg-gray-700"
                    } ${running ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
                  >
                    <span
                      className={`pointer-events-none block h-5 w-5 rounded-full bg-white shadow-lg ring-0 transition-transform ${
                        includeTag ? "translate-x-5" : "translate-x-0"
                      }`}
                    />
                  </button>
                  <label
                    htmlFor="includeTag"
                    className="cursor-pointer select-none"
                    onClick={() => !running && setIncludeTag(!includeTag)}
                  >
                      Content có tag
                  </label>
              </div>
              {
                  running
                    ? <button
                      className={'cursor-pointer rounded-full bg-red-500 transition-colors hover:bg-red-700 text-white px-4 py-2 disabled:opacity-50'}
                      disabled={aborting}
                      onClick={handleAbort}>
                        {aborting ? 'Đang dừng...' : 'Dừng'}
                    </button>
                    : <button
                      className={'cursor-pointer rounded-full bg-cyan-500 transition-colors hover:bg-cyan-700 text-white px-4 py-2'}
                      onClick={handleStart}>
                        Bắt đầu
                    </button>
              }
          </div>
          {
            running && (
              <div className={'w-full bg-red-600 text-white p-4 rounded-2xl'}>
                  Vui lòng không tắt tab này hay chuyển tab trong khi đang chạy!
              </div>
            )
          }
          {
            posts.length > 0 && (
              <div
                className={'w-full rounded-2xl border border-cyan-500 border-dashed p-4 flex items-center justify-between gap-4'}>
                  <div>
                      Đã lấy được <span className={'font-bold'}>{posts.length}</span> post trong <span
                    className={'font-bold'}>{formattedTime}</span>
                  </div>
                  <button
                    className={'cursor-pointer rounded-full bg-green-500 transition-colors hover:bg-green-700 text-white px-4 py-2'}
                    onClick={handleDownload}>
                      Tải xuống
                  </button>
              </div>
            )
          }
      </div>
    );
};

export default Welcome;
