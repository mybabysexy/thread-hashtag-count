# Count Thread Posts by Hashtag

This project is designed to count the number of posts that contains a specific hashtag. It is useful for analyzing social media posts, comments, or any other text data where hashtags are used.

## Installation

To install the necessary dependencies, run:

```bash
npm install
```

## Usage

Save your Thread cookies and save it to `www.threads.net.cookies.json`. You can use [this extension](https://chromewebstore.google.com/detail/export-cookie-json-file-f/nmckokihipjgplolmcmjakknndddifde) to make things easier.

Import the module and call the function with the correct Thread hashtag url:

```javascript
const thread = new ThreadService();
const page = await thread.init({
  url: "https://www.threads.net/search?q=TangPhucxAVIFW2024&serp_type=tags&tag_id=18429295165076180&filter=recent",
  totalItemsLimit: 5000,
});
await thread.addCookies();
const data = await thread.getPosts(page);
console.log(data);
```

Response

```json
[
  {
    "id": "DCUFu27zN3j",
    "time": "2024-11-13T13:52:23.000Z",
    "link": "/@mejimeji95/post/DCUFu27zN3j",
    "likes": "1.6K",
    "comments": "57",
    "reposts": "370"
  },
]
```
