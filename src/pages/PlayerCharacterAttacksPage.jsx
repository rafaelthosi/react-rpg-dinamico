import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import AttackManager from "../components/AttackManager.jsx";
import Header from "../components/Header.jsx";
import { apiRequest } from "../services/rpgApi.js";

function PlayerCharacterAttacksPage({ session, onLogout }) {
  const { characterId } = useParams();
  const [character, setCharacter] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isCurrent = true;

    async function loadCharacter() {
      setError("");
      try {
        const characters = await apiRequest(
          `/campaigns/${session.campaignId}/characters`,
          { session },
        );
        const found = characters.find((item) => item.id === characterId);
        if (!found) {
          throw new Error("Personagem não encontrado.");
        }
        if (isCurrent) {
          setCharacter(found);
        }
      } catch (loadError) {
        if (isCurrent) {
          setError(loadError.message);
        }
      } finally {
        if (isCurrent) {
          setIsLoading(false);
        }
      }
    }

    loadCharacter();
    return () => {
      isCurrent = false;
    };
  }, [characterId, session.token, session.campaignId]);

  return (
    <>
      <Header onLogout={onLogout} />
      <main className="app-content">
        <Link className="back-link" to="/home">
          ← Meus personagens
        </Link>
        {error && <p className="feedback feedback--error" role="alert">{error}</p>}
        {isLoading ? (
          <p className="description">Carregando personagem...</p>
        ) : character ? (
          <>
            <section className="page-heading">
              <div>
                <h1 className="page-title">Ataques de {character.name}</h1>
              </div>
            </section>
            <AttackManager characterId={characterId} session={session} showHeading={false} />
          </>
        ) : null}
      </main>
    </>
  );
}

export default PlayerCharacterAttacksPage;
