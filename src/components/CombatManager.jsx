import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { apiRequest } from "../services/rpgApi.js";

function CombatManager({ campaignId, characters, sections, session }) {
  const [combats, setCombats] = useState([]);
  const [participants, setParticipants] = useState([]);
  const [gridRows, setGridRows] = useState(10);
  const [gridColumns, setGridColumns] = useState(10);
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const sharedFields = sections.flatMap((section) => section.fields)
    .filter((field) => field.shareWithNpcs);

  async function loadCombats() {
    try {
      setCombats(await apiRequest(`/campaigns/${campaignId}/combats`, { session }));
      setError("");
    } catch (loadError) {
      setError(loadError.message);
    }
  }

  useEffect(() => {
    loadCombats();
  }, [campaignId, session.token]);

  function addPlayer() {
    setParticipants((current) => [...current, {
      kind: "character", characterId: "", initiative: 0, actionsPerTurn: 1, position: "",
    }]);
  }

  function addNpc() {
    setParticipants((current) => [...current, {
      kind: "npc", name: "", isEnemy: true, initiative: 0, actionsPerTurn: 1, position: "",
      fieldValues: Object.fromEntries(sharedFields.map((field) => [
        field.id,
        field.type === "CHECKBOX" ? "false" : "",
      ])),
    }]);
  }

  function updateParticipant(index, key, value) {
    setParticipants((current) => current.map((item, itemIndex) => (
      itemIndex === index ? { ...item, [key]: value } : item
    )));
  }

  async function createCombat(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const name = new FormData(form).get("combatName");
    setIsSaving(true);
    setError("");
    try {
      await apiRequest(`/campaigns/${campaignId}/combats`, {
        session,
        method: "POST",
        body: {
          name,
          gridRows: Number(gridRows),
          gridColumns: Number(gridColumns),
          participants: participants.map((participant) => ({
            ...(participant.kind === "character"
              ? { characterId: participant.characterId }
              : {
                name: participant.name,
                isEnemy: participant.isEnemy,
                fieldValues: sharedFields.map((field) => ({
                  fieldId: field.id,
                  value: participant.fieldValues[field.id] ?? "",
                })),
              }),
            initiative: Number(participant.initiative),
            actionsPerTurn: Number(participant.actionsPerTurn),
            position: participant.position,
          })),
        },
      });
      form.reset();
      setParticipants([]);
      setGridRows(10);
      setGridColumns(10);
      await loadCombats();
    } catch (createError) {
      setError(createError.message);
    } finally {
      setIsSaving(false);
    }
  }

  async function deleteCombat(combat) {
    if (!window.confirm(`Excluir o combate "${combat.name}" e seu histórico?`)) {
      return;
    }
    try {
      await apiRequest(`/combats/${combat.id}`, { session, method: "DELETE" });
      await loadCombats();
    } catch (deleteError) {
      setError(deleteError.message);
    }
  }

  return (
    <section className="manager-section">
      <div className="manager-heading">
        <div>
          <h2>Combates</h2>
          <p className="description">Monte a iniciativa com personagens vinculados e NPCs ou criaturas.</p>
        </div>
      </div>

      <form className="surface-card form-card form-grid" onSubmit={createCombat}>
        <h3>Novo combate</h3>
        <label>Nome do combate<input maxLength={255} name="combatName" required /></label>
        <label>Tamanho do grid (linhas)<input max={100} min={1} onChange={(event) => setGridRows(event.target.value)} required type="number" value={gridRows} /></label>
        <label>Tamanho do grid (colunas)<input max={100} min={1} onChange={(event) => setGridColumns(event.target.value)} required type="number" value={gridColumns} /></label>
        <div className="button-row">
          <button className="secondary-button" onClick={addPlayer} type="button">Adicionar personagem</button>
          <button className="secondary-button" onClick={addNpc} type="button">Adicionar NPC/criatura</button>
        </div>
        <div className="combatant-editor-list">
          {participants.map((participant, index) => (
            <div className="combatant-editor" key={`${participant.kind}-${index}`}>
              {participant.kind === "character" ? (
                <label>
                  Personagem
                  <select
                    onChange={(event) => updateParticipant(index, "characterId", event.target.value)}
                    required
                    value={participant.characterId}
                  >
                    <option value="">Selecione</option>
                    {characters
                      .filter((character) => !participants.some((item) => item.characterId === character.id))
                      .map((character) => (
                      <option key={character.id} value={character.id}>{character.name}</option>
                      ))}
                  </select>
                </label>
              ) : (
                <>
                  <label>NPC/criatura<input maxLength={255} onChange={(event) => updateParticipant(index, "name", event.target.value)} required value={participant.name} /></label>
                  <label className="checkbox-label">
                    <input checked={participant.isEnemy} onChange={(event) => updateParticipant(index, "isEnemy", event.target.checked)} type="checkbox" />
                    Inimigo
                  </label>
                  {sharedFields.map((field) => {
                    const value = participant.fieldValues[field.id] ?? "";
                    const setValue = (nextValue) => updateParticipant(index, "fieldValues", {
                      ...participant.fieldValues,
                      [field.id]: nextValue,
                    });
                    if (field.type === "SELECT" || field.type === "BOOLEAN") {
                      return (
                        <label key={field.id}>
                          {field.label}{field.required ? " *" : ""}
                          <select onChange={(event) => setValue(event.target.value)} required={field.required} value={value}>
                            <option value="">Selecione</option>
                            {field.type === "SELECT" ? field.options.map((option) => (
                              <option key={option.id} value={option.value}>{option.label}</option>
                            )) : (
                              <>
                                <option value="true">Sim</option>
                                <option value="false">Não</option>
                              </>
                            )}
                          </select>
                        </label>
                      );
                    }
                    if (field.type === "CHECKBOX") {
                      return (
                        <label className="checkbox-label" key={field.id}>
                          <input checked={value === "true"} onChange={(event) => setValue(String(event.target.checked))} type="checkbox" />
                          {field.label}
                        </label>
                      );
                    }
                    if (field.type === "TEXTAREA") {
                      return (
                        <label key={field.id}>
                          {field.label}{field.required ? " *" : ""}
                          <textarea maxLength={10000} onChange={(event) => setValue(event.target.value)} required={field.required} value={value} />
                        </label>
                      );
                    }
                    const type = field.type === "NUMBER" || field.type === "DATE" ? field.type.toLowerCase() : "text";
                    return (
                      <label key={field.id}>
                        {field.label}{field.required ? " *" : ""}
                        <input maxLength={type === "text" ? 10000 : undefined} onChange={(event) => setValue(event.target.value)} required={field.required} type={type} value={value} />
                      </label>
                    );
                  })}
                </>
              )}
              <label>
                Posição no grid (ex.: b12)
                <input
                  maxLength={5}
                  onChange={(event) => updateParticipant(index, "position", event.target.value)}
                  pattern="[a-zA-Z]+[1-9][0-9]*"
                  placeholder="a1"
                  required
                  value={participant.position}
                />
              </label>
              <label>Iniciativa<input min={0} onChange={(event) => updateParticipant(index, "initiative", event.target.value)} required type="number" value={participant.initiative} /></label>
              <label>Ações por turno<input min={1} onChange={(event) => updateParticipant(index, "actionsPerTurn", event.target.value)} required type="number" value={participant.actionsPerTurn} /></label>
              <button
                aria-label="Remover participante"
                className="danger-button"
                onClick={() => setParticipants((current) => current.filter((_, itemIndex) => itemIndex !== index))}
                type="button"
              >
                Remover
              </button>
            </div>
          ))}
          {!participants.length && <p className="description">Adicione ao menos um participante.</p>}
        </div>
        <button className="primary-button" disabled={isSaving || !participants.length} type="submit">
          {isSaving ? "Criando..." : "Criar combate"}
        </button>
      </form>

      {error && <p className="feedback feedback--error" role="alert">{error}</p>}
      <div className="campaign-grid">
        {combats.map((combat) => (
          <article className="surface-card combat-tile" key={combat.id}>
            <p className="eyebrow">{combat.active ? "Em andamento" : "Encerrado"}</p>
            <h3>{combat.name}</h3>
            <p className="description">Rodada {combat.currentRound} · {combat.combatants.length} participantes</p>
            <div className="button-row">
              <Link className="primary-button" to={`/combats/${combat.id}`}>Abrir combate</Link>
              <button className="danger-button" onClick={() => deleteCombat(combat)} type="button">Excluir</button>
            </div>
          </article>
        ))}
        {!combats.length && <p className="description">Nenhum combate criado nesta campanha.</p>}
      </div>
    </section>
  );
}

export default CombatManager;
