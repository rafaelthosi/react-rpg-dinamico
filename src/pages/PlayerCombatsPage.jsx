import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Header from "../components/Header.jsx";
import { apiRequest } from "../services/rpgApi.js";

function PlayerCombatsPage({ session, onLogout }) {
  const [combats, setCombats] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    apiRequest(`/campaigns/${session.campaignId}/combats`, { session })
      .then((items) => setCombats(items.sort((a, b) => Number(b.active) - Number(a.active))))
      .catch((loadError) => setError(loadError.message))
      .finally(() => setIsLoading(false));
  }, [session.token, session.campaignId]);

  return (
    <>
      <Header onLogout={onLogout} />
      <main className="app-content">
        <Link className="back-link" to="/home">← Meus personagens</Link>
        <section className="page-heading">
          <div>
            <p className="eyebrow">Área do jogador</p>
            <h1 className="page-title">Combates</h1>
            <p className="description">Combates dos quais seus personagens participam.</p>
          </div>
        </section>
        {error && <p className="feedback feedback--error" role="alert">{error}</p>}
        {isLoading ? (
          <p className="description">Carregando combates...</p>
        ) : combats.length ? (
          <div className="campaign-grid">
            {combats.map((combat) => (
              <article className="surface-card combat-tile" key={combat.id}>
                <p className="eyebrow">{combat.active ? "Em andamento" : "Encerrado"}</p>
                <h2>{combat.name}</h2>
                <p className="description">Rodada {combat.currentRound} · {combat.combatants.length} participantes</p>
                <Link className={combat.active ? "primary-button" : "secondary-button"} to={`/combats/${combat.id}`}>
                  {combat.active ? "Entrar no combate" : "Ver combate"}
                </Link>
              </article>
            ))}
          </div>
        ) : (
          <section className="surface-card empty-state">
            <h2>Nenhum combate encontrado</h2>
            <p className="description">Quando o GM criar um combate com seu personagem, ele aparecerá aqui.</p>
          </section>
        )}
      </main>
    </>
  );
}

export default PlayerCombatsPage;
