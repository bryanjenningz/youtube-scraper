// A simple program that collects subtitles from YouTube videos.
// The program starts by collecting the video ids of the videos that show up
// from searching, starting from the startUrl. After going through 10 pages,
// the program proceeds to collect the subtitles for each video.

const startUrl = "https://www.youtube.com/results?sp=EgIoAQ%253D%253D&search_query=%E5%BA%B7%E7%86%99%E6%9D%A5%E4%BA%86";

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

const waitUntil = async condition => {
  while (!await condition()) {
    await sleep(1000);
  }
};

const collectVideoIds = () => {
  const anchorTagSelector = `#${getItemSectionId()} > li > div > div > div.yt-lockup-content > h3 > a`;
  const videoIds = Array.from(document.querySelectorAll(anchorTagSelector)).map(element => (
    element.href.match(/v=([^&?]+)/)[1]
  ));
  return videoIds;
};

// The element id that YouTube generates is "item-section-XXXXXX" where the 
// X's are random numbers. So we have to figure out what those numbers are.
const getItemSectionId = () => (
  Array.from(document.querySelectorAll("*")).filter(element => (
    element.id.startsWith("item-section-")
  ))[0].id
);

const goToNextPage = () => {
  Array.from(document.querySelectorAll("a[href]")).filter(element => (
    element.href.includes("results") && element.textContent.toLowerCase().includes("next")
  ))[0].click();
};

const collectSubs = async () => {
  await sleep(5000); // sleep 5 seconds to not send too many requests to YouTube
  await waitUntil(() => document.querySelector("#action-panel-overflow-button"));
  document.querySelector("#action-panel-overflow-button").click();
  await waitUntil(() => document.querySelector("#action-panel-overflow-menu > li:nth-child(2) > button"));
  document.querySelector("#action-panel-overflow-menu > li:nth-child(2) > button").click();
  await waitUntil(() => document.querySelectorAll(".caption-line").length > 0);
  return Array.from(document.querySelectorAll(".caption-line")).map(element => {
    return {
      time: Number(Number(element.getAttribute("data-time")).toFixed(1)),
      text: element.querySelector(".caption-line-text").textContent
    };
  });
};

(async () => {
  if (!localStorage.videoIds) {
    if (location.href !== startUrl) {
      location.href = startUrl;
    }
    const videoIds = [];
    let previousVideoIds = [];
    for (let page = 1; page <= 10; page++) {
      await waitUntil(() => JSON.stringify(previousVideoIds) !== JSON.stringify(collectVideoIds()));
      previousVideoIds = collectVideoIds();
      videoIds.push(...previousVideoIds);
      goToNextPage();
    }
    localStorage.videoIds = JSON.stringify(Array.from(new Set(videoIds)));
  }
  if (location.href.includes("v=")) {
    const subsById = JSON.parse(localStorage.subsById || "{}");
    subsById[location.href.match(/v=([^&?]+)/)[1]] = await collectSubs();
    localStorage.subsById = JSON.stringify(subsById);
  }
  const videoIds = JSON.parse(localStorage.videoIds);
  if (videoIds.length > 0) {
    const videoId = videoIds.pop();
    localStorage.videoIds = JSON.stringify(videoIds);
    location.href = `https://www.youtube.com/watch?v=${videoId}`;
  } else {
    console.clear();
    console.log(localStorage.subsById);
    console.log("cleaning up localStorage...");
    delete localStorage.videoIds;
    delete localStorage.subsById;
  }
})();
