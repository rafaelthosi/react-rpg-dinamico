import { useEffect, useState } from "react";
import Header from "../components/Header.jsx";
import { Link } from "react-router-dom";
import { apiRequest } from "../services/rpgApi.js";

function PlayerPage({ session, onLogout }) {
  const [campaign, setCampaign] = useState(null);
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
      const [campaignResult, characterResult] = await Promise.all([
        apiRequest(`/campaigns/${session.campaignId}`, { session }),
        apiRequest(`/campaigns/${session.campaignId}/characters`, { session }),
      ]);
      setCampaign(campaignResult);
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
                </header>
                <div className="button-row character-card__actions">
                  <Link className="primary-button" to={`/characters/${character.id}`}>
                    Ver mais detalhes
                  </Link>
                  <Link className="secondary-button" to="/combats">
                    Combates
                  </Link>
                  <Link className="secondary-button" to={`/characters/${character.id}/attacks`}>
                    Ataques
                  </Link>
                </div>
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
