import { useState } from "react";
import CharacterSheet from "./CharacterSheet.jsx";
import { apiRequest } from "../services/rpgApi.js";

function CharacterManager({ campaignId, characters, members, sections, session, onRefresh }) {
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const activeMembers = members.filter((member) => member.status === "ACTIVE");
  const membersById = new Map(members.map((member) => [member.userId, member]));

  async function createCharacter(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    setError("");
    setIsSaving(true);
    try {
      await apiRequest(`/campaigns/${campaignId}/characters`, {
        session,
        method: "POST",
        body: { name: data.get("name"), userId: data.get("userId") },
      });
      form.reset();
      await onRefresh();
    } catch (createError) {
      setError(createError.message);
    } finally {
      setIsSaving(false);
    }
  }

  async function renameCharacter(character) {
    const name = window.prompt("Nome do personagem", character.name);
    if (!name || name.trim() === character.name) {
      return;
    }
    setError("");
    try {
      await apiRequest(`/characters/${character.id}`, {
        session, method: "PATCH", body: { name },
      });
      await onRefresh();
    } catch (updateError) {
      setError(updateError.message);
    }
  }

  async function deleteCharacter(character) {
    if (!window.confirm(`Remover "${character.name}" e todos os valores da ficha?`)) {
      return;
    }
    setError("");
    try {
      await apiRequest(`/characters/${character.id}`, { session, method: "DELETE" });
      await onRefresh();
    } catch (deleteError) {
      setError(deleteError.message);
    }
  }

  return (
    <section className="manager-section">
      <div className="manager-heading">
        <div>
          <h2>Personagens</h2>
          <p className="description">Crie personagens para jogadores ativos e gerencie suas fichas.</p>
        </div>
      </div>

      <form className="surface-card form-card inline-form" onSubmit={createCharacter}>
        <label>
          Nome do personagem
          <input autoComplete="off" maxLength={255} name="name" required />
        </label>
        <label>
          Jogador
          <select defaultValue="" name="userId" required>
            <option value="">Selecione</option>
            {activeMembers.map((member) => (
              <option key={member.userId} value={member.userId}>
                {member.user?.username ?? member.userId}
              </option>
            ))}
          </select>
        </label>
        <button className="primary-button" disabled={isSaving || !activeMembers.length} type="submit">
          {isSaving ? "Criando..." : "Criar personagem"}
        </button>
      </form>
      {!activeMembers.length && (
        <p className="description">Vincule um jogador ativo antes de criar personagens para ele.</p>
      )}
      {error && <p className="feedback feedback--error" role="alert">{error}</p>}

      <div className="character-list">
        {characters.map((character) => {
          const owner = membersById.get(character.userId)?.user;
          return (
            <article className="surface-card character-tile" key={character.id}>
              <header className="character-tile__header">
                <div>
                  <p className="eyebrow">{owner ? `Jogador: ${owner.username}` : "Personagem"}</p>
                  <h3>{character.name}</h3>
                </div>
                <div className="button-row">
                  <button
                    className="secondary-button secondary-button--small"
                    onClick={() => renameCharacter(character)}
                    type="button"
                  >
                    Renomear
                  </button>
                  <button className="danger-button" onClick={() => deleteCharacter(character)} type="button">
                    Remover
                  </button>
                </div>
              </header>
              <CharacterSheet
                actorRole="GM"
                character={character}
                sections={sections}
                session={session}
              />
            </article>
          );
        })}
        {!characters.length && <p className="description">Nenhum personagem criado nesta campanha.</p>}
      </div>
    </section>
  );
}

export default CharacterManager;
