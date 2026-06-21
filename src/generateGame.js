// generateGame.mjs
// Appelé côté front au moment du "Start New Game"
// Paramètres : yearStart, yearEnd
// Retourne : { characters, grid_colors } prêts à insérer dans codenames_games

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
      characters(role: MAIN, sort: FAVOURITES_DESC, perPage: 3) {
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

export async function generateGame(yearStart, yearEnd) {
  const start = yearStart * 10000 + 101;   // ex: 19800101
  const end   = yearEnd   * 10000 + 1231;  // ex: 19871231

  // 1. Première requête pour connaître le nombre de pages
  const first = await fetchPage(1, start, end);
  const lastPage = first.pageInfo.lastPage;

  // 2. Tirer 3 pages aléatoires (ou moins si peu de pages)
  const allPages = shuffle([...Array(lastPage).keys()].map((i) => i + 1));
  const pagesToFetch = allPages.slice(0, Math.min(3, lastPage));

  // 3. Collecter les persos
  const characters = [];
  const seen = new Set();

  // Inclure les résultats de la page 1 déjà fetchée
  for (const media of first.media) {
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

  for (const page of pagesToFetch.filter((p) => p !== 1)) {
    await sleep(400);
    const data = await fetchPage(page, start, end);
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

  if (characters.length < 25) {
    throw new Error(`Not enough characters from that period of time (${characters.length} found, 25 needed)`);
  }

  // 4. Shuffle et prendre 25
  const selected = shuffle(characters).slice(0, 25);

  // 5. Générer les couleurs : 9 bleu, 8 rouge, 7 blanc, 1 noir
  const colors = shuffle([
    ...Array(9).fill("blue"),
    ...Array(8).fill("red"),
    ...Array(7).fill("white"),
    "black",
  ]);

  return {
    year_start:  yearStart,
    year_end:    yearEnd,
    characters:  selected,
    grid_colors: colors,
  };
}
