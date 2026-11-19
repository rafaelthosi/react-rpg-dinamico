import { useEffect, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import AttackManager from "../components/AttackManager.jsx";
import CharacterSheet from "../components/CharacterSheet.jsx";
import Header from "../components/Header.jsx";
import { apiRequest, getCampaignStructure } from "../services/rpgApi.js";

function PlayerCharacterPage({ session, onLogout }) {
  const { characterId } = useParams();
  const location = useLocation();
  const isAttacksTab = location.pathname.endsWith("/attacks");
  const [character, setCharacter] = useState(null);
  const [sections, setSections] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadPage() {
    setError("");
    try {
      const [characters, structure] = await Promise.all([
        apiRequest(`/campaigns/${session.campaignId}/characters`, { session }),
        isAttacksTab ? Promise.resolve([]) : getCampaignStructure(session, session.campaignId),
      ]);
      const found = characters.find((item) => item.id === characterId);
      if (!found) {
        throw new Error("Personagem não encontrado.");
      }
      setCharacter(found);
      setSections(structure);
    } catch (loadError) {
      setError(loadError.message);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadPage();
  }, [characterId, isAttacksTab, session.token, session.campaignId]);

  return (
    <>
      <Header onLogout={onLogout} />
      <main className="app-content">
        <Link className="back-link" to="/home">← Meus personagens</Link>
        {error && <p className="feedback feedback--error" role="alert">{error}</p>}
        {isLoading ? (
          <p className="description">Carregando personagem...</p>
        ) : character ? (
          <>
            <section className="page-heading">
              <div>
                <p className="eyebrow">Ficha do personagem</p>
                <h1 className="page-title">{character.name}</h1>
              </div>
            </section>
            <nav className="page-tabs" aria-label="Ficha do personagem">
              <Link
                aria-current={!isAttacksTab ? "page" : undefined}
                className={`page-tab${!isAttacksTab ? " page-tab--active" : ""}`}
                to={`/characters/${characterId}`}
              >
                Detalhes
              </Link>
              <Link
                aria-current={isAttacksTab ? "page" : undefined}
                className={`page-tab${isAttacksTab ? " page-tab--active" : ""}`}
                to={`/characters/${characterId}/attacks`}
              >
                Ataques
              </Link>
            </nav>
            {isAttacksTab ? (
              <AttackManager characterId={characterId} session={session} />
            ) : (
              <CharacterSheet
                actorRole="PLAYER"
                character={character}
                sections={sections}
                session={session}
              />
            )}
          </>
        ) : null}
      </main>
    </>
  );
}

export default PlayerCharacterPage;
