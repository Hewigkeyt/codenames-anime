import { useState } from "react";
import "./NewGameModal.css";

const CURRENT_YEAR = new Date().getFullYear();

export default function NewGameModal({ onConfirm, onClose }) {
  const [yearStart, setYearStart] = useState(1990);
  const [yearEnd, setYearEnd] = useState(2005);
  const [difficulty, setDifficulty] = useState("normal");
  const [error, setError] = useState(null);

  function handleConfirm() {
    if (yearStart >= yearEnd) {
      setError("Start year must be before end year");
      return;
    }
    if (yearEnd - yearStart < 5) {
      setError("Choose at least a 5 years period");
      return;
    }
    onConfirm({ yearStart, yearEnd, difficulty });
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2>New game</h2>
        <p className="modal-sub">Choose the period you want anime characters from.</p>

        <div className="year-inputs">
          <label>
            <span>From</span>
            <input
              type="number"
              min="1960"
              max={CURRENT_YEAR}
              value={yearStart}
              onChange={(e) => setYearStart(parseInt(e.target.value))}
            />
          </label>
          <span className="year-sep">→</span>
          <label>
            <span>To</span>
            <input
              type="number"
              min="1960"
              max={CURRENT_YEAR}
              value={yearEnd}
              onChange={(e) => setYearEnd(parseInt(e.target.value))}
            />
          </label>
        </div>

        <div className="presets">
          <span className="presets-label">Presets</span>
          {[
            ["80s", 1980, 1989],
            ["90s", 1990, 1999],
            ["2000s", 2000, 2009],
            ["2010s", 2010, 2019],
            ["Recent", 2020, CURRENT_YEAR],
          ].map(([label, s, e]) => (
            <button
              key={label}
              className="preset-btn"
              onClick={() => { setYearStart(s); setYearEnd(e); setError(null); }}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="difficulty-select">
          <span className="presets-label">Difficulty</span>
          <div className="difficulty-options">
            {[
              ["casual", "Casual", "Only popular anime"],
              ["normal", "Normal", "Moderately popular included"],
              ["hardcore", "Hardcore", "No filter, anything goes"],
              ["dbz", "Dragon Ball Z", "Nothing else"],
            ].map(([value, label, hint]) => (
              <button
                key={value}
                type="button"
                className={`difficulty-btn ${difficulty === value ? "active" : ""}`}
                onClick={() => setDifficulty(value)}
              >
                <span className="difficulty-label">{label}</span>
                <span className="difficulty-hint">{hint}</span>
              </button>
            ))}
          </div>
        </div>

        {error && <p className="modal-error">{error}</p>}

        <div className="modal-actions">
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={handleConfirm}>
            Generate grid
          </button>
        </div>
       <p className="modal-note">When the grid is generated, share the <span className="gold">game ID</span> to other player so that they can join.</p>

      </div>
    </div>
  );
}
