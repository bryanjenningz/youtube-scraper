const fs = require("fs");

const entries = fs
  .readFileSync("./frequency-list-no-duplicates.txt")
  .toString()
  .split("\n");

const byVideoId = require("./subs-14.json");

const buildDict = () => {
  const dict = {};
  for (let i = 0; i < entries.length; i++) {
    try {
      const [, trad, simp, pinyin, meaning] = entries[i].match(/([^ ]+), ([^ ]+) \(([^)]+)\) - ([^\n]+)/);
      const locations = {};
      for (const videoId in byVideoId) {
        const subs = byVideoId[videoId];
        for (let i = 0; i < subs.length; i++) {
          const { text } = subs[i];
          if (text.includes(trad) || text.includes(simp)) {
            locations[videoId] = locations[videoId] || [];
            locations[videoId].push(i);
          }
        }
      }
      const dictEntry = { trad, simp, pinyin, meaning, locations };
      dict[trad] = dictEntry;
      // dict[simp] = dictEntry;
    } catch (err) {
      console.log(err);
      console.log(`Error for entry ${i}: ${entries[i]}`);
    }
  }
  return dict;
};

/*
  dict's type:
    { 
      [trad: string]: {
        trad: string,
        simp: string,
        pinyin: string,
        meaning: string,
        locations: { [videoId: string]: indexes: number[] }
      }
    }
*/

const dict = buildDict();
fs.writeFileSync("./sub-trad-dictionary.json", JSON.stringify(dict));
