import { useEffect, useState } from "react";
import Header from "../components/Header.jsx";
import CharacterSheet from "../components/CharacterSheet.jsx";
import { apiRequest, getCampaignStructure } from "../services/rpgApi.js";

function PlayerPage({ session, onLogout }) {
  const [campaign, setCampaign] = useState(null);
  const [sections, setSections] = useState([]);
  const [characters, setCharacters] = useState([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  async function loadPage() {
    if (!session.campaignId) {
      setError("Nenhuma campanha foi selecionada. Saia e entre novamente para escolher uma campanha.");
      setIsLoading(false);
      return;
    }

    setError("");
    try {
      const [campaignResult, structureResult, characterResult] = await Promise.all([
        apiRequest(`/campaigns/${session.campaignId}`, { session }),
        getCampaignStructure(session, session.campaignId),
        apiRequest(`/campaigns/${session.campaignId}/characters`, { session }),
      ]);
      setCampaign(campaignResult);
      setSections(structureResult);
      setCharacters(characterResult);
    } catch (loadError) {
      setError(loadError.message);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadPage();
  }, [session.token, session.campaignId]);

  async function createCharacter(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setIsSaving(true);
    setError("");
    try {
      const character = await apiRequest(`/campaigns/${session.campaignId}/characters`, {
        session,
        method: "POST",
        body: { name: form.get("name") },
      });
      setCharacters((current) => [...current, character]);
      setShowCreateForm(false);
    } catch (createError) {
      setError(createError.message);
    } finally {
      setIsSaving(false);
    }
  }

  async function renameCharacter(character) {
    const name = window.prompt("Novo nome do personagem", character.name);
    if (!name || name.trim() === character.name) {
      return;
    }
    try {
      const updated = await apiRequest(`/characters/${character.id}`, {
        session,
        method: "PATCH",
        body: { name },
      });
      setCharacters((current) => current.map((item) => item.id === updated.id ? updated : item));
    } catch (updateError) {
      setError(updateError.message);
    }
  }

  async function deleteCharacter(character) {
    if (!window.confirm(`Remover o personagem "${character.name}" e seus valores?`)) {
      return;
    }
    try {
      await apiRequest(`/characters/${character.id}`, { session, method: "DELETE" });
      setCharacters((current) => current.filter((item) => item.id !== character.id));
    } catch (deleteError) {
      setError(deleteError.message);
    }
  }

  return (
    <>
      <Header onLogout={onLogout} />
      <main className="app-content">
        <section className="page-heading">
          <div>
            <p className="eyebrow">Área do jogador{campaign ? ` · ${campaign.name}` : ""}</p>
            <h1 className="page-title">Meus personagens</h1>
            <p className="description">
              Suas fichas são montadas dinamicamente com as seções e campos da campanha.
            </p>
          </div>
          <button
            className="primary-button"
            onClick={() => setShowCreateForm((value) => !value)}
            type="button"
          >
            {showCreateForm ? "Cancelar" : "+ Novo personagem"}
          </button>
        </section>

        {error && <p className="feedback feedback--error" role="alert">{error}</p>}
        {showCreateForm && (
          <form className="surface-card form-card inline-form" onSubmit={createCharacter}>
            <label>
              Nome do personagem
              <input autoComplete="off" maxLength={255} name="name" required />
            </label>
            <button className="primary-button" disabled={isSaving} type="submit">
              {isSaving ? "Criando..." : "Criar personagem"}
            </button>
          </form>
        )}

        {isLoading ? (
          <p className="description">Carregando campanha e fichas...</p>
        ) : !error && characters.length ? (
          <div className="character-list">
            {characters.map((character) => (
              <article className="surface-card character-tile" key={character.id}>
                <header className="character-tile__header">
                  <div>
                    <p className="eyebrow">Personagem</p>
                    <h2>{character.name}</h2>
                  </div>
                  <div className="button-row">
                    <button
                      className="secondary-button secondary-button--small"
                      onClick={() => renameCharacter(character)}
                      type="button"
                    >
                      Renomear
                    </button>
                    <button
                      className="danger-button"
                      onClick={() => deleteCharacter(character)}
                      type="button"
                    >
                      Remover
                    </button>
                  </div>
                </header>
                <CharacterSheet
                  actorRole="PLAYER"
                  character={character}
                  sections={sections}
                  session={session}
                />
              </article>
            ))}
          </div>
        ) : !error ? (
          <section className="surface-card empty-state">
            <h2>Crie seu primeiro personagem</h2>
            <p className="description">
              Os campos da ficha aparecerão aqui assim que você criar um personagem.
            </p>
          </section>
        ) : null}
      </main>
    </>
  );
}

export default PlayerPage;
