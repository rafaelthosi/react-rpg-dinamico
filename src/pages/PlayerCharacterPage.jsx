import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import CharacterSheet from "../components/CharacterSheet.jsx";
import Header from "../components/Header.jsx";
import { apiRequest, getCampaignStructure } from "../services/rpgApi.js";

function PlayerCharacterPage({ session, onLogout }) {
  const { characterId } = useParams();
  const [character, setCharacter] = useState(null);
  const [sections, setSections] = useState([]);
  const [attacks, setAttacks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [editingAttack, setEditingAttack] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  async function loadPage() {
    setError("");
    try {
      const [characters, structure, attackList] = await Promise.all([
        apiRequest(`/campaigns/${session.campaignId}/characters`, { session }),
        getCampaignStructure(session, session.campaignId),
        apiRequest(`/characters/${characterId}/attacks`, { session }),
      ]);
      const found = characters.find((item) => item.id === characterId);
      if (!found) {
        throw new Error("Personagem não encontrado.");
      }
      setCharacter(found);
      setSections(structure);
      setAttacks(attackList);
    } catch (loadError) {
      setError(loadError.message);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadPage();
  }, [characterId, session.token, session.campaignId]);

  async function saveAttack(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    setIsSaving(true);
    setError("");
    const body = {
      name: data.get("name"),
      description: data.get("description"),
      damage: data.get("damage"),
      effects: data.get("effects"),
      observation: data.get("observation"),
      actionsConsumed: Number(data.get("actionsConsumed")),
    };
    try {
      const saved = editingAttack
        ? await apiRequest(`/attacks/${editingAttack.id}`, { session, method: "PATCH", body })
        : await apiRequest(`/characters/${characterId}/attacks`, { session, method: "POST", body });
      setAttacks((current) => editingAttack
        ? current.map((attack) => attack.id === saved.id ? saved : attack)
        : [...current, saved]);
      setEditingAttack(null);
      form.reset();
    } catch (saveError) {
      setError(saveError.message);
    } finally {
      setIsSaving(false);
    }
  }

  async function deleteAttack(attack) {
    if (!window.confirm(`Remover o ataque "${attack.name}"?`)) {
      return;
    }
    try {
      await apiRequest(`/attacks/${attack.id}`, { session, method: "DELETE" });
      setAttacks((current) => current.filter((item) => item.id !== attack.id));
    } catch (deleteError) {
      setError(deleteError.message);
    }
  }

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
            <CharacterSheet
              actorRole="PLAYER"
              character={character}
              sections={sections}
              session={session}
            />
            <section className="manager-section attacks-section">
              <div className="manager-heading">
                <div>
                  <h2>Ataques</h2>
                  <p className="description">Ataques disponíveis para este personagem.</p>
                </div>
              </div>
              <div className="attack-list">
                {attacks.map((attack) => (
                  <article className="surface-card attack-card" key={attack.id}>
                    <div className="structure-card__header">
                      <div>
                        <h3>{attack.name}</h3>
                        <p className="muted-text">Dano: {attack.damage} · Ações: {attack.actionsConsumed}</p>
                        {attack.description && <p>{attack.description}</p>}
                        {attack.effects && <p><strong>Efeitos:</strong> {attack.effects}</p>}
                        {attack.observation && <p><strong>Observação:</strong> {attack.observation}</p>}
                      </div>
                      <div className="button-row">
                        <button className="secondary-button secondary-button--small" onClick={() => setEditingAttack(attack)} type="button">
                          Editar
                        </button>
                        <button className="danger-button" onClick={() => deleteAttack(attack)} type="button">
                          Remover
                        </button>
                      </div>
                    </div>
                  </article>
                ))}
                {!attacks.length && <p className="description">Nenhum ataque cadastrado.</p>}
              </div>
              <form
                className="surface-card form-card form-grid form-grid--two"
                key={editingAttack?.id ?? "new-attack"}
                onSubmit={saveAttack}
              >
                <h3 className="form-grid__full">{editingAttack ? "Editar ataque" : "Cadastrar ataque"}</h3>
                <label>Nome<input defaultValue={editingAttack?.name ?? ""} maxLength={255} name="name" required /></label>
                <label>Dano<input defaultValue={editingAttack?.damage ?? ""} maxLength={255} name="damage" placeholder="1d4 ou 4" required /></label>
                <label>Descrição<textarea defaultValue={editingAttack?.description ?? ""} maxLength={10000} name="description" rows={2} /></label>
                <label>Efeitos<textarea defaultValue={editingAttack?.effects ?? ""} maxLength={10000} name="effects" rows={2} /></label>
                <label>Observação<textarea defaultValue={editingAttack?.observation ?? ""} maxLength={10000} name="observation" rows={2} /></label>
                <label>Ações consumidas<input defaultValue={editingAttack?.actionsConsumed ?? 1} min={1} name="actionsConsumed" type="number" required /></label>
                <div className="button-row form-grid__full">
                  <button className="primary-button" disabled={isSaving} type="submit">{isSaving ? "Salvando..." : "Salvar ataque"}</button>
                  {editingAttack && (
                    <button className="secondary-button" onClick={() => setEditingAttack(null)} type="button">Cancelar</button>
                  )}
                </div>
              </form>
            </section>
          </>
        ) : null}
      </main>
    </>
  );
}

export default PlayerCharacterPage;
