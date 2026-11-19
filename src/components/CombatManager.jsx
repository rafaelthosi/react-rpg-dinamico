import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { apiRequest } from "../services/rpgApi.js";

function CombatManager({ campaignId, characters, npcs, session }) {
  const [combats, setCombats] = useState([]);
  const [participants, setParticipants] = useState([]);
  const [gridRows, setGridRows] = useState(10);
  const [gridColumns, setGridColumns] = useState(10);
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

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
      kind: "npc", npcId: "", initiative: 0, actionsPerTurn: 1, position: "",
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
    const data = new FormData(form);
    const name = data.get("combatName");
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
          participants: participants.map((participant) => {
            const npc = participant.kind === "npc"
              ? npcs.find((item) => item.id === participant.npcId)
              : null;
            return {
              ...(participant.kind === "character"
                ? { characterId: participant.characterId }
                : {
                  name: npc.name,
                  isEnemy: npc.isEnemy,
                  fieldValues: npc.fieldValues.map(({ fieldId, value }) => ({ fieldId, value })),
                }),
              initiative: Number(participant.initiative),
              actionsPerTurn: Number(participant.actionsPerTurn),
              position: participant.position,
            };
          }),
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
          <p className="description">Monte a iniciativa selecionando personagens e NPCs já cadastrados.</p>
        </div>
      </div>

      <form className="surface-card form-card form-grid" onSubmit={createCombat}>
        <h3>Novo combate</h3>
        <label>Nome do combate<input maxLength={255} name="combatName" required /></label>
        <label>Tamanho do grid (linhas)<input max={100} min={1} onChange={(event) => setGridRows(event.target.value)} required type="number" value={gridRows} /></label>
        <label>Tamanho do grid (colunas)<input max={100} min={1} onChange={(event) => setGridColumns(event.target.value)} required type="number" value={gridColumns} /></label>
        <div className="button-row">
          <button className="secondary-button" onClick={addPlayer} type="button">Adicionar personagem</button>
          <button className="secondary-button" disabled={!npcs.length} onClick={addNpc} type="button">Adicionar NPC</button>
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
                      .filter((character) => !participants.some(
                        (item, itemIndex) => itemIndex !== index && item.characterId === character.id,
                      ))
                      .map((character) => (
                      <option key={character.id} value={character.id}>{character.name}</option>
                      ))}
                  </select>
                </label>
              ) : (
                <label>
                  NPC
                  <select
                    onChange={(event) => updateParticipant(index, "npcId", event.target.value)}
                    required
                    value={participant.npcId}
                  >
                    <option value="">Selecione</option>
                    {npcs
                      .filter((npc) => !participants.some(
                        (item, itemIndex) => itemIndex !== index && item.npcId === npc.id,
                      ))
                      .map((npc) => (
                        <option key={npc.id} value={npc.id}>
                          {npc.name} · {npc.isEnemy ? "Inimigo" : "Aliado"}
                        </option>
                      ))}
                  </select>
                </label>
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
          {!npcs.length && (
            <p className="description">Cadastre NPCs na aba “NPCs” antes de adicioná-los a um combate.</p>
          )}
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
              <Link className="primary-button" to={`/combats/${combat.id}#grid`}>Abrir grid</Link>
              <Link className="secondary-button" to={`/combats/${combat.id}#participants`}>
                + Adicionar personagem
              </Link>
              <Link className="secondary-button" to={`/combats/${combat.id}#combat`}>Iniciativa e ações</Link>
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
