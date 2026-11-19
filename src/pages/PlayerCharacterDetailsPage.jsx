import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import CharacterSheet from "../components/CharacterSheet.jsx";
import Header from "../components/Header.jsx";
import { apiRequest, getCampaignStructure } from "../services/rpgApi.js";

function PlayerCharacterDetailsPage({ session, onLogout }) {
  const { characterId } = useParams();
  const [character, setCharacter] = useState(null);
  const [sections, setSections] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadPage() {
    setError("");
    try {
      const [characters, structure] = await Promise.all([
        apiRequest(`/campaigns/${session.campaignId}/characters`, { session }),
        getCampaignStructure(session, session.campaignId),
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
  }, [characterId, session.token, session.campaignId]);

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
                <p className="eyebrow">Detalhes da ficha</p>
                <h1 className="page-title">{character.name}</h1>
              </div>
            </section>
            <CharacterSheet
              actorRole="PLAYER"
              character={character}
              sections={sections}
              session={session}
            />
          </>
        ) : null}
      </main>
    </>
  );
}

export default PlayerCharacterDetailsPage;
