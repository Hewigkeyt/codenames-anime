# Codenames Anime

A browser-based, anime-themed twist on Codenames. Instead of word cards, players guess characters pulled live from [AniList](https://anilist.co), based on a chosen year range. One team plays Blue, one plays Red, and a Spymaster from either side can see which characters belong to which team.

🔗 **Play it here:** https://hewigkeyt.github.io/codenames-anime

## How it works

- Starting a new game lets you pick a year range (e.g. 1990–1999). The app queries AniList for anime released in that window and builds a 5×5 grid of 25 characters.
- Colors are assigned randomly: 9 Blue, 8 Red, 7 Neutral, 1 Assassin (Black).
- Share the game ID with friends so everyone sees the same board, synced live via Supabase.
- One player per team should join as **Spymaster** — they see the hidden color of every character and help their team guess.
- Clicking on a card reveals its color and the state is synced in real time for everyone viewing the game.

## Tech stack

- **React + Vite** — front end
- **Supabase** — stores game state (grid, characters, revealed cells) and syncs reveals in real time via Postgres changes
- **AniList GraphQL API** — source of anime/character data
- **GitHub Pages** — hosting

## Local setup

```bash
npm install
```

Create a `.env` file in the project root:

```
VITE_PUBLIC_SUPABASE_URL=your-supabase-url
VITE_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

Then run:

```bash
npm run dev
```

## Deploying

```bash
npm run deploy
```

This builds the app and pushes the `dist/` folder to the `gh-pages` branch.

## Known limitations

- Difficulty can vary a lot depending on the year range — some periods surface fairly obscure characters alongside well-known ones.
- No win/lose or player turn detection. The game tracks revealed cards but assume players are following the rules IRL.
