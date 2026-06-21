import Card from "./Card";
import "./Grid.css";

export default function Grid({ characters, colors, revealed, isSpymaster, onReveal }) {
  return (
    <div className="grid">
      {characters.map((char, i) => (
        <Card
          key={char.anilist_id}
          character={char}
          color={colors[i]}
          revealed={revealed[i]}
          isSpymaster={isSpymaster}
          onClick={() => onReveal(i)}
        />
      ))}
    </div>
  );
}
