import "./Card.css";

export default function Card({ character, color, revealed, isSpymaster, onClick }) {
  return (
    <div
      className={`card-wrapper ${revealed ? "revealed" : ""}`}
      onClick={!revealed ? onClick : undefined}
    >
      <div className={`card-inner ${revealed ? `flipped color-${color}` : ""}`}>
        {/* Face avant — personnage */}
        <div className="card-front">
          <div className="card-img-wrap">
            <img
              src={character.image_url}
              alt={character.name}
              loading="lazy"
              onError={(e) => { e.target.style.opacity = 0.3; }}
            />
            {isSpymaster && <div className={`color-tint tint-${color}`} />}
          </div>
          <div className="card-info">
            <span className="card-name">{character.name}</span>
            <span className="card-anime">{character.anime_title}</span>
          </div>
        </div>

        {/* Face arrière — couleur révélée */}
        <div className={`card-back color-${color}`}>
          <div className="card-img-wrap">
            <img
              src={character.image_url}
              alt={character.name}
              loading="lazy"
            />
            <div className={`color-tint tint-${color}`} />
            {isSpymaster && <span className="card-revealed-tag">Revealed</span>}
          </div>
          <div className="card-info">
            <span className="card-name">{character.name}</span>
            <span className="card-anime">{character.anime_title}</span>
          </div>
        </div>
      </div>
    </div>
  );
}


