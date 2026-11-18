import { useEffect, useMemo, useState } from "react";

function columnName(index) {
  let value = index + 1;
  let label = "";
  while (value > 0) {
    value -= 1;
    label = String.fromCharCode(65 + (value % 26)) + label;
    value = Math.floor(value / 26);
  }
  return label;
}

function initials(name) {
  return name.trim().slice(0, 2).toLocaleUpperCase();
}

function CombatGrid({ rows, columns, combatants, asPlayer = false }) {
  const [zoom, setZoom] = useState(1);
  const [viewportWidth, setViewportWidth] = useState(() => window.innerWidth);
  const piecesByPosition = useMemo(() => {
    const pieces = new Map();
    for (const combatant of combatants) {
      if (!combatant.position) {
        continue;
      }
      const position = combatant.position.toLowerCase();
      pieces.set(position, [...(pieces.get(position) ?? []), combatant]);
    }
    return pieces;
  }, [combatants]);
  const cellSize = Math.max(28, Math.min(56, ((viewportWidth - 160) / columns) * zoom));

  useEffect(() => {
    const updateWidth = () => setViewportWidth(window.innerWidth);
    window.addEventListener("resize", updateWidth);
    return () => window.removeEventListener("resize", updateWidth);
  }, []);

  const gridTemplateColumns = `${cellSize}px repeat(${columns}, ${cellSize}px)`;

  return (
    <article className="surface-card combat-panel combat-grid-panel">
      <header className="combat-grid-heading">
        <div>
          <h2>Grid de combate</h2>
          <p className="description">{rows} linhas × {columns} colunas · Posições por letra e número</p>
        </div>
        <div className="button-row" aria-label="Zoom do grid">
          <button
            aria-label="Diminuir zoom do grid"
            className="secondary-button secondary-button--small"
            disabled={zoom <= 0.6}
            onClick={() => setZoom((current) => Math.max(0.6, Number((current - 0.2).toFixed(1))))}
            type="button"
          >
            −
          </button>
          <button
            aria-label="Aumentar zoom do grid"
            className="secondary-button secondary-button--small"
            disabled={zoom >= 1.8}
            onClick={() => setZoom((current) => Math.min(1.8, Number((current + 0.2).toFixed(1))))}
            type="button"
          >
            +
          </button>
        </div>
      </header>
      <p className="muted-text">Letras no topo indicam colunas; números à esquerda indicam linhas (ex.: b12).</p>
      <p className="combat-grid-legend">
        <span><i className="combat-grid-token--player-character" /> Personagens</span>
        {asPlayer && <span><i className="combat-grid-token--own-character" /> Seu personagem</span>}
        <span><i className="combat-grid-token--ally" /> NPC aliado</span>
        <span><i className="combat-grid-token--enemy" /> Inimigo</span>
      </p>
      <div className="combat-grid-scroll">
        <div
          aria-label="Tabuleiro do combate"
          className="combat-grid-board"
          role="grid"
          style={{ gridTemplateColumns }}
        >
          <span aria-hidden="true" className="combat-grid-axis-corner" />
          {Array.from({ length: columns }, (_, column) => (
            <span className="combat-grid-axis-label" key={`column-${column}`}>
              {columnName(column)}
            </span>
          ))}
          {Array.from({ length: rows }, (_, row) => (
            <GridRow
              asPlayer={asPlayer}
              key={`row-${row}`}
              piecesByPosition={piecesByPosition}
              row={row}
              columns={columns}
              cellSize={cellSize}
            />
          ))}
        </div>
      </div>
    </article>
  );
}

function GridRow({ asPlayer, piecesByPosition, row, columns, cellSize }) {
  return (
    <>
      <span className="combat-grid-axis-label">{row + 1}</span>
      {Array.from({ length: columns }, (_, column) => {
        const position = `${columnName(column)}${row + 1}`.toLowerCase();
        const pieces = piecesByPosition.get(position) ?? [];
        return (
          <div
            aria-label={`${position}${pieces.length ? `: ${pieces.map(({ name }) => name).join(", ")}` : ""}`}
            className="combat-grid-cell"
            key={position}
            role="gridcell"
            style={{ height: cellSize }}
          >
            {pieces.map((combatant) => {
              const isPlayerCharacter = Boolean(combatant.characterId);
              const tokenType = isPlayerCharacter
                ? (asPlayer && combatant.isMine ? "own-character" : "player-character")
                : (combatant.isEnemy ? "enemy" : "ally");
              return (
                <span
                  aria-label={combatant.name}
                  className={`combat-grid-token combat-grid-token--${tokenType}`}
                  key={combatant.id}
                  title={`${combatant.name} (${position})`}
                >
                  {initials(combatant.name)}
                </span>
              );
            })}
          </div>
        );
      })}
    </>
  );
}

export default CombatGrid;
