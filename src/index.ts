import ThreadService from "./thread.service";
import fs from "fs";

const thread = new ThreadService();
try {
  const page = await thread.init({
    url: "https://www.threads.net/search?q=TangPhucxAVIFW2024&serp_type=tags&tag_id=18429295165076180&filter=recent",
    totalItemsLimit: 5000,
  });
  await thread.addCookies();
  const data = await thread.getPosts(page);

  // filter unique id
  const uniqueData = data.filter(
    (v, i, a) => a.findIndex((t) => t.id === v.id) === i
  );

  console.log("Total posts:", uniqueData.length);

  const newFile = "thread-posts.csv";
  const csvData = thread.dataToCSV(uniqueData);
  fs.writeFileSync(newFile, csvData, "utf-8");
} finally {
  console.log("close");
  await thread.close();
}
