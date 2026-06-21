// generateGame.js
// Called front-side when starting a new game.
// Params: yearStart, yearEnd, difficulty ("casual" | "normal" | "hardcore")
// Returns: { characters, grid_colors, difficulty } ready to insert into codenames_games

const ANILIST_URL = "https://graphql.anilist.co";

const QUERY = `
query ($page: Int, $start: FuzzyDateInt, $end: FuzzyDateInt) {
  Page(page: $page, perPage: 50) {
    pageInfo { lastPage }
    media(
      type: ANIME
      format_in: [TV, MOVIE]
      startDate_greater: $start
      startDate_lesser: $end
      sort: POPULARITY_DESC
    ) {
      title { romaji }
      startDate { year }
      characters(role: MAIN, sort: FAVOURITES_DESC, perPage: 5) {
        nodes {
          id
          name { full }
          image { large }
        }
      }
    }
  }
}
`;

// Each difficulty defines maxPageFraction: caps the eligible popularity-rank
// pool as a fraction of lastPage (e.g. 0.2 = only the most popular 20% of
// anime in that period are eligible to be sampled from at all).
// Since lastPage itself already grows with the size of the selected year
// range, this fraction alone keeps "well-known density" roughly constant
// regardless of period length — no separate per-year scaling needed.
const DIFFICULTY_SETTINGS = {
  casual:   { maxPageFraction: 0.05 },
  normal:   { maxPageFraction: 0.15 },
  hardcore: { maxPageFraction: 1.00 },
};

const MAX_PAGES_TO_FETCH = 12; // safety cap so we never hammer the API too hard

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

async function fetchPage(page, start, end) {
  const res = await fetch(ANILIST_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      query: QUERY,
      variables: { page, start, end },
    }),
  });
  const json = await res.json();
  if (json.errors) throw new Error(json.errors[0].message);
  return json.data.Page;
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

export async function generateGame(yearStart, yearEnd, difficulty = "normal") {
  const settings = DIFFICULTY_SETTINGS[difficulty] ?? DIFFICULTY_SETTINGS.normal;
  const start = yearStart * 10000 + 101;   // ex: 19800101
  const end   = yearEnd   * 10000 + 1231;  // ex: 19871231

  // 1. First request to find out how many pages exist for this period
  const first = await fetchPage(1, start, end);
  const lastPage = first.pageInfo.lastPage;

  // 2. Cap the eligible popularity-rank pool based on difficulty.
  //    This already scales with year span since lastPage does too.
  const eligiblePages = Math.max(1, Math.round(lastPage * settings.maxPageFraction));

  // 3. Sample from the whole eligible pool, capped only for API safety
  const pagesWanted = Math.min(MAX_PAGES_TO_FETCH, eligiblePages);

  // 4. Draw pages randomly from the eligible (capped) pool only
  const eligiblePageNumbers = [...Array(eligiblePages).keys()].map((i) => i + 1);
  const allPages = shuffle(eligiblePageNumbers);
  const pagesToFetch = allPages.slice(0, pagesWanted);

  // 5. Collect characters
  const characters = [];
  const seen = new Set();

  function addFromPage(data) {
    for (const media of data.media) {
      for (const char of media.characters.nodes) {
        if (!char.image?.large || char.image.large.includes("default")) continue;
        if (seen.has(char.id)) continue;
        seen.add(char.id);
        characters.push({
          anilist_id: char.id,
          name: char.name.full,
          image_url: char.image.large,
          anime_title: media.title.romaji,
          anime_year: media.startDate.year,
        });
      }
    }
  }

  // Reuse page 1 results if it's among the pages we want (saves a request)
  if (pagesToFetch.includes(1)) {
    addFromPage(first);
  }

  for (const page of pagesToFetch.filter((p) => p !== 1)) {
    await sleep(400);
    const data = await fetchPage(page, start, end);
    addFromPage(data);
  }

  if (characters.length < 25) {
    throw new Error(`Not enough characters from that period of time (${characters.length} found, 25 needed). Try a wider year range or a higher difficulty.`);
  }

  // 6. Shuffle and take 25
  const selected = shuffle(characters).slice(0, 25);

  // 7. Generate colors: 9 blue, 8 red, 7 white, 1 black
  const colors = shuffle([
    ...Array(9).fill("blue"),
    ...Array(8).fill("red"),
    ...Array(7).fill("white"),
    "black",
  ]);

  return {
    year_start:  yearStart,
    year_end:    yearEnd,
    difficulty,
    characters:  selected,
    grid_colors: colors,
  };
}

