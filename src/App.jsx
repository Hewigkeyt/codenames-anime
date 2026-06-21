import { useState, useEffect, useCallback } from "react";
import { createClient } from "@supabase/supabase-js";
import { generateGame } from "./generateGame";
import Grid from "./components/Grid";
import NewGameModal from "./components/NewGameModal";
import "./App.css";

const supabase = createClient(
  import.meta.env.VITE_PUBLIC_SUPABASE_URL,
  import.meta.env.VITE_PUBLIC_SUPABASE_ANON_KEY
);

export default function App() {
  const [game, setGame] = useState(null);
  const [isSpymaster, setIsSpymaster] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [joinMode, setJoinMode] = useState(null); // 'player' | 'blue' | 'red' | null
  const [joinGameId, setJoinGameId] = useState("");

  // Charger une partie depuis l'URL (?game=4f67&spy=1)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const gameId = params.get("game");
    const spy = params.get("spy");

    if (gameId) {
      loadGame(gameId);
      if (spy === "1") {
        setIsSpymaster(true);
      }
    }
  }, []);

  // Realtime : sync des cases révélées
  useEffect(() => {
    if (!game) return;

    const channel = supabase
      .channel(`game:${game.id}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "codenames_games",
          filter: `id=eq.${game.id}`,
        },
        (payload) => {
          setGame((prev) => ({ ...prev, revealed: payload.new.revealed }));
        }
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [game?.id]);

  async function loadGame(id) {
    setLoading(true);
    setError(null);
    const { data, error } = await supabase
      .from("codenames_games")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !data) {
      setError("Game could not be found.");
    } else {
      setGame(data);
    }
    setLoading(false);
  }

  async function handleJoinSubmit() {
    if (!joinGameId.trim()) return;

    const isSpy = joinMode === "spymaster";

    await loadGame(joinGameId.trim());

    setIsSpymaster(isSpy);

    const url = new URL(window.location);
    url.searchParams.set("game", joinGameId.trim());
    if (isSpy) {
      url.searchParams.set("spy", "1");
    } else {
      url.searchParams.delete("spy");
    }
    window.history.pushState({}, "", url);

    setJoinMode(null);
    setJoinGameId("");
  }

  async function handleNewGame({ yearStart, yearEnd, difficulty }) {
    setLoading(true);
    setError(null);
    setShowModal(false);

    try {
      const gameData = await generateGame(yearStart, yearEnd, difficulty);
      const { data, error } = await supabase
        .from("codenames_games")
        .insert(gameData)
        .select("*")
        .single();

      if (error) throw new Error(error.message);

      setGame(data);
      setIsSpymaster(false);

      // Mettre à jour l'URL
      const url = new URL(window.location);
      url.searchParams.set("game", data.id);
      url.searchParams.delete("spy");
      window.history.pushState({}, "", url);
    } catch (e) {
      setError(e.message);
    }
    setLoading(false);
  }

  async function handleReveal(index) {
    if (!game || game.revealed[index]) return;

    const newRevealed = [...game.revealed];
    newRevealed[index] = true;

    const { error } = await supabase
      .from("codenames_games")
      .update({ revealed: newRevealed })
      .eq("id", game.id);

    if (!error) {
      setGame((prev) => ({ ...prev, revealed: newRevealed }));
    }
  }

  function joinAsSpymaster() {
    if (!game) return;
    setIsSpymaster(true);

    const url = new URL(window.location);
    url.searchParams.set("spy", "1");
    window.history.pushState({}, "", url);
  }

  function copySpymasterLink() {
    const url = new URL(window.location);
    url.searchParams.set("game", game.id);
    url.searchParams.set("spy", "1");
    navigator.clipboard.writeText(url.toString());
  }

  function goHome() {
    setGame(null);
    setIsSpymaster(false);
    setError(null);
    setJoinMode(null);
    setJoinGameId("");
 
    const url = new URL(window.location);
    url.searchParams.delete("game");
    url.searchParams.delete("spy");
    window.history.pushState({}, "", url);
  }

  const redCount = game
    ? game.grid_colors.filter((c, i) => c === "red" && !game.revealed[i]).length
    : 9;
  const blueCount = game
    ? game.grid_colors.filter((c, i) => c === "blue" && !game.revealed[i]).length
    : 8;

  return (
    <div className="app">
      <header className="header">
        <div className="header-left">
          <h1 className="logo" onClick={goHome} style={{ cursor: "pointer" }}>
            <span className="logo-jp">Anime</span>
            <span className="logo-en">Codenames</span>
          </h1>
          {game && (
            <div className="game-id">
              Game ID <strong>{game.id}</strong>
              <span className="year-range">
                {game.year_start}–{game.year_end}
              </span>
              {game.difficulty && (
                <span className="year-range">{game.difficulty}</span>
              )}
            </div>
          )}
        </div>

        <div className="header-right">
          {game && (
            <>
              <div className="score-pills">
                Remaining: 
                <span className="pill pill-blue">🔵 {blueCount}</span>
                <span className="pill pill-red">🔴 {redCount}</span>
              </div>
              {!isSpymaster && (
                <button className="btn btn-ghost" onClick={() => joinAsSpymaster()}>
                  Change to Spymaster 🔍
                </button>
              )}
              {isSpymaster && (
                <div className="spy-buttons">
                  <button
                    className="btn btn-ghost"
                    onClick={() => copySpymasterLink()}
                  >
                    📋 Copy Spymaster link
                  </button>
                  <span className="spy-badge spy-badge-blue">
                    Spymaster 🔍
                  </span>
                </div>
              )}
            </>
          )}
          <button
            className="btn btn-primary"
            onClick={() => setShowModal(true)}
            disabled={loading}
          >
            {loading ? "Loading…" : "New game"}
          </button>
        </div>
      </header>

      <main className="main">
        {error && <div className="error">{error}</div>}

        {!game && !loading && !joinMode && (
          <div className="empty-state">
            <div className="empty-title"><span className="gold">Anime</span> Codenames</div>
            <button className="btn btn-primary btn-lg" onClick={() => setShowModal(true)}>
              Create new game
            </button>
            <div className="spy-buttons">
              <button className="btn btn-ghost" onClick={() => setJoinMode("player")}>
                Join game
              </button>
              <button className="btn btn-ghost" onClick={() => setJoinMode("spymaster")}>
                Join game as Spymaster
              </button>
            </div>
          </div>
        )}

        {!game && !loading && joinMode && (
          <div className="empty-state">
            <div className="empty-title"><span className="gold">Anime</span> Codenames</div>
            <p>
              {joinMode === "player" && (<>Input the game ID to join.<br/>You will guess characters based on spymaster's hints.</>)}
              {joinMode === "spymaster" && (<>Input the game ID to join as spymaster.<br/>You will see the card colors and make other players guess.</>)}
            </p>
            <input
              type="text"
              className="join-input"
              placeholder="ex: 4f67"
              value={joinGameId}
              onChange={(e) => setJoinGameId(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleJoinSubmit()}
              autoFocus
            />
            <div className="spy-buttons">
              <button className="btn btn-ghost" onClick={() => { setJoinMode(null); setJoinGameId(""); }}>
                Back
              </button>
              <button className="btn btn-primary" onClick={handleJoinSubmit}>
                OK
              </button>
            </div>
          </div>
        )}

        {loading && (
          <div className="empty-state">
            <div className="empty-kanji spin">⏳</div>
            <p>We are loading the grid…</p>
          </div>
        )}

        {game && !loading && (
          <Grid
            characters={game.characters}
            colors={game.grid_colors}
            revealed={game.revealed}
            isSpymaster={isSpymaster}
            onReveal={handleReveal}
          />
        )}
      </main>

      {showModal && (
        <NewGameModal
          onConfirm={handleNewGame}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  );
}
