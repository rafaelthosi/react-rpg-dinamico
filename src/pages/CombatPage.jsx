import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import CombatGrid from "../components/CombatGrid.jsx";
import Header from "../components/Header.jsx";
import { apiRequest } from "../services/rpgApi.js";

function CombatPage({ session, onLogout }) {
  const { combatId } = useParams();
  const isGM = String(session.user.role).toLowerCase() === "gm";
  const [combat, setCombat] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [selectedTargets, setSelectedTargets] = useState([]);
  const [characters, setCharacters] = useState([]);
  const [npcs, setNpcs] = useState([]);
  const [showParticipantForm, setShowParticipantForm] = useState(false);
  const [participantKind, setParticipantKind] = useState("character");
  const [participantCharacterId, setParticipantCharacterId] = useState("");
  const [participantPosition, setParticipantPosition] = useState("");
  const [participantNpcId, setParticipantNpcId] = useState("");
  const [attacksByCharacter, setAttacksByCharacter] = useState({});
  const [actionType, setActionType] = useState("FREE");
  const [actionPosition, setActionPosition] = useState("");
  const [isEditingGrid, setIsEditingGrid] = useState(false);
  const [gmTab, setGmTab] = useState("grid");
  const orderedCombatants = useMemo(
    () => [...(combat?.combatants ?? [])].sort((a, b) => b.initiative - a.initiative),
    [combat?.combatants],
  );
  const currentCombatant = orderedCombatants[combat?.currentTurnIndex ?? 0];
  const availableAttacks = attacksByCharacter[currentCombatant?.characterId] ?? [];
  const actionsUsed = combat?.actions.reduce((total, action) => (
    action.round === combat.currentRound && action.combatantId === currentCombatant?.id
      ? total + (action.actionsCount ?? 1)
      : total
  ), 0) ?? 0;
  const actionsRemaining = currentCombatant
    ? Math.max(0, currentCombatant.actionsPerTurn - actionsUsed)
    : 0;
  const actionAvailable = Boolean(combat?.active && currentCombatant && actionsRemaining > 0);
  const canAct = Boolean(actionAvailable && (isGM || currentCombatant?.isMine));
  const canSeeAction = Boolean(isGM || combat?.combatants.some((item) => item.isMine));

  async function loadCombat() {
    try {
      const loadedCombat = await apiRequest(`/combats/${combatId}`, { session });
      setCombat(loadedCombat);
      if (isGM) {
        const [charactersResult, npcsResult] = await Promise.all([
          apiRequest(`/campaigns/${loadedCombat.campaignId}/characters`, { session }),
          apiRequest(`/campaigns/${loadedCombat.campaignId}/npcs`, { session }),
        ]);
        setCharacters(charactersResult);
        setNpcs(npcsResult);
      }
      const attackLists = await Promise.all(loadedCombat.combatants
        .filter((item) => item.characterId && (isGM || item.isMine))
        .map(async (item) => [
          item.characterId,
          await apiRequest(`/characters/${item.characterId}/attacks`, { session }),
        ]));
      setAttacksByCharacter(Object.fromEntries(attackLists));
      setError("");
    } catch (loadError) {
      setError(loadError.message);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadCombat();
  }, [combatId, session.token]);

  useEffect(() => {
    if (!isGM) {
      return;
    }
    if (window.location.hash === "#participants") {
      setGmTab("grid");
      setShowParticipantForm(true);
    } else if (window.location.hash === "#combat") {
      setGmTab("combat");
    } else if (window.location.hash === "#grid") {
      setGmTab("grid");
    }
  }, [combatId, isGM]);

  useEffect(() => {
    if (!isLoading && ["#grid", "#participants", "#combat"].includes(window.location.hash)) {
      document.getElementById(window.location.hash.slice(1))?.scrollIntoView();
    }
  }, [isLoading, gmTab, showParticipantForm]);

  useEffect(() => {
    setActionPosition(currentCombatant?.position ?? "");
    setActionType("FREE");
    setSelectedTargets([]);
  }, [currentCombatant?.id, currentCombatant?.position]);

  async function advanceTurn() {
    setError("");
    try {
      setCombat(await apiRequest(`/combats/${combatId}/advance`, { session, method: "POST" }));
    } catch (advanceError) {
      setError(advanceError.message);
    }
  }

  async function toggleActive() {
    setError("");
    try {
      setCombat(await apiRequest(`/combats/${combatId}`, {
        session,
        method: "PATCH",
        body: { active: !combat.active },
      }));
    } catch (updateError) {
      setError(updateError.message);
    }
  }

  async function updateGrid(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setError("");
    setIsSaving(true);
    try {
      const updated = await apiRequest(`/combats/${combatId}/grid`, {
        session,
        method: "PATCH",
        body: {
          gridRows: Number(form.get("gridRows")),
          gridColumns: Number(form.get("gridColumns")),
        },
      });
      setCombat(updated);
      setIsEditingGrid(false);
    } catch (updateError) {
      setError(updateError.message);
    } finally {
      setIsSaving(false);
    }
  }

  async function addParticipant(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    setIsSaving(true);
    setError("");
    try {
      const participant = participantKind === "character"
        ? { characterId: participantCharacterId, position: participantPosition }
        : (() => {
          const npc = npcs.find((item) => item.id === participantNpcId);
          return {
            name: npc.name,
            isEnemy: npc.isEnemy,
            position: participantPosition,
            fieldValues: npc.fieldValues.map(({ fieldId, value }) => ({ fieldId, value })),
          };
        })();
      const updated = await apiRequest(`/combats/${combatId}/participants`, {
        session,
        method: "POST",
        body: {
          ...participant,
          initiative: Number(data.get("initiative")),
          actionsPerTurn: Number(data.get("actionsPerTurn")),
        },
      });
      setCombat(updated);
      setShowParticipantForm(false);
      setParticipantCharacterId("");
      setParticipantPosition("");
      setParticipantNpcId("");
      form.reset();
      await loadCombat();
    } catch (saveError) {
      setError(saveError.message);
    } finally {
      setIsSaving(false);
    }
  }

  async function submitAction(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    setIsSaving(true);
    setError("");
    try {
      const updated = await apiRequest(`/combats/${combatId}/actions`, {
        session,
        method: "POST",
        body: {
          combatantId: currentCombatant.id,
          description: data.get("description"),
          actionType,
          ...(actionType === "ATTACK"
            ? { attackId: data.get("attackId") }
            : { actionsCount: Number(data.get("actionsCount")) }),
          damage: data.get("damage") ?? "",
          position: data.get("position"),
          targets: selectedTargets,
        },
      });
      setCombat(updated);
      setSelectedTargets([]);
      setActionType("FREE");
      form.reset();
    } catch (saveError) {
      setError(saveError.message);
    } finally {
      setIsSaving(false);
    }
  }

  const returnPath = isGM && combat ? `/campaigns/${combat.campaignId}` : "/combats";

  return (
    <>
      <Header onLogout={onLogout} />
      <main className="app-content">
        <Link className="back-link" to={returnPath}>
          ← {isGM ? "Campanha" : "Combates"}
        </Link>
        {error && <p className="feedback feedback--error" role="alert">{error}</p>}
        {isLoading ? (
          <p className="description">Carregando combate...</p>
        ) : combat ? (
          <>
            <section className="page-heading">
              <div>
                <p className="eyebrow">{combat.active ? "Combate em andamento" : "Combate encerrado"}</p>
                <h1 className="page-title">{combat.name}</h1>
                <p className="description">Rodada {combat.currentRound}</p>
              </div>
              {isGM && (
                <div className="button-row">
                  <button className="secondary-button" disabled={!combat.active} onClick={advanceTurn} type="button">
                    Próxima iniciativa
                  </button>
                  <button className={combat.active ? "danger-button" : "primary-button"} onClick={toggleActive} type="button">
                    {combat.active ? "Encerrar combate" : "Reabrir combate"}
                  </button>
                </div>
              )}
            </section>

            {isGM && (
              <nav className="page-tabs" aria-label="Abas do combate" role="tablist">
                <button
                  aria-selected={gmTab === "grid"}
                  className={`page-tab${gmTab === "grid" ? " page-tab--active" : ""}`}
                  onClick={() => setGmTab("grid")}
                  role="tab"
                  type="button"
                >
                  Grid e participantes
                </button>
                <button
                  aria-selected={gmTab === "combat"}
                  className={`page-tab${gmTab === "combat" ? " page-tab--active" : ""}`}
                  onClick={() => setGmTab("combat")}
                  role="tab"
                  type="button"
                >
                  Iniciativa e ações
                </button>
              </nav>
            )}

            {isGM && gmTab === "grid" && (
              <section className="manager-section" id="grid">
                <CombatGrid
                  combatants={combat.combatants}
                  columns={combat.gridColumns}
                  rows={combat.gridRows}
                />
                {!isEditingGrid ? (
                  <div className="button-row">
                    <button
                      className="secondary-button"
                      disabled={!combat.active}
                      onClick={() => setIsEditingGrid(true)}
                      type="button"
                    >
                      Editar tamanho do grid
                    </button>
                    {!combat.active && <p className="muted-text">O grid só pode ser editado durante um combate em andamento.</p>}
                  </div>
                ) : (
                  <form className="surface-card form-card inline-form" onSubmit={updateGrid}>
                    <label>
                      Linhas
                      <input defaultValue={combat.gridRows} max={100} min={1} name="gridRows" required type="number" />
                    </label>
                    <label>
                      Colunas
                      <input defaultValue={combat.gridColumns} max={100} min={1} name="gridColumns" required type="number" />
                    </label>
                    <button className="primary-button" disabled={isSaving} type="submit">
                      {isSaving ? "Salvando..." : "Salvar grid"}
                    </button>
                    <button className="secondary-button" onClick={() => setIsEditingGrid(false)} type="button">
                      Cancelar
                    </button>
                  </form>
                )}
                <section className="manager-section" id="participants">
                  <div className="manager-heading">
                    <div>
                      <h2>Participantes do combate</h2>
                      <p className="description">
                        Adicione personagens que ainda não estão neste combate ou inclua NPCs.
                      </p>
                    </div>
                    {!showParticipantForm && (
                      <button className="primary-button" onClick={() => setShowParticipantForm(true)} type="button">
                        + Adicionar personagem ou NPC
                      </button>
                    )}
                  </div>
                  {showParticipantForm && (
                    <form className="surface-card form-card form-grid" onSubmit={addParticipant}>
                    <h2 className="form-grid__full">Adicionar participante</h2>
                    <label>
                      Tipo
                      <select
                        onChange={(event) => setParticipantKind(event.target.value)}
                        value={participantKind}
                      >
                        <option value="character">Personagem</option>
                        <option value="npc">NPC</option>
                      </select>
                    </label>
                    {participantKind === "character" ? (
                      <label>
                        Personagem
                        <select
                          onChange={(event) => setParticipantCharacterId(event.target.value)}
                          required
                          value={participantCharacterId}
                        >
                          <option value="">Selecione</option>
                          {characters
                            .filter((character) => !combat.combatants.some((item) => item.characterId === character.id))
                            .map((character) => (
                              <option key={character.id} value={character.id}>{character.name}</option>
                            ))}
                        </select>
                      </label>
                    ) : (
                      <label>
                        NPC
                        <select
                          onChange={(event) => setParticipantNpcId(event.target.value)}
                          required
                          value={participantNpcId}
                        >
                          <option value="">Selecione</option>
                          {npcs.map((npc) => (
                            <option key={npc.id} value={npc.id}>
                              {npc.name} · {npc.isEnemy ? "Inimigo" : "Aliado"}
                            </option>
                          ))}
                        </select>
                      </label>
                    )}
                    {participantKind === "npc" && !npcs.length && (
                      <p className="description form-grid__full">
                        Cadastre NPCs na aba “NPCs” da campanha antes de adicioná-los.
                      </p>
                    )}
                    <label>
                      Posição no grid (ex.: b12)
                      <input
                        maxLength={5}
                        onChange={(event) => setParticipantPosition(event.target.value)}
                        pattern="[a-zA-Z]+[1-9][0-9]*"
                        placeholder="a1"
                        required
                        value={participantPosition}
                      />
                    </label>
                    <label>
                      Iniciativa
                      <input min={0} name="initiative" required type="number" defaultValue={0} />
                    </label>
                    <label>
                      Ações por turno
                      <input min={1} name="actionsPerTurn" required type="number" defaultValue={1} />
                    </label>
                    <div className="button-row form-grid__full">
                      <button
                        className="primary-button"
                        disabled={isSaving || (participantKind === "npc" && !npcs.length)}
                        type="submit"
                      >
                        {isSaving ? "Adicionando..." : "Adicionar"}
                      </button>
                      <button className="secondary-button" onClick={() => setShowParticipantForm(false)} type="button">
                        Cancelar
                      </button>
                    </div>
                    </form>
                  )}
                </section>
              </section>
            )}

            {(!isGM || gmTab === "combat") && (
              <section className="combat-layout" id="combat">
              <article className="surface-card combat-panel">
                <h2>Iniciativa</h2>
                <ol className="initiative-list">
                  {orderedCombatants.map((combatant, index) => (
                    <li
                      className={`initiative-item${index === combat.currentTurnIndex ? " initiative-item--active" : ""}`}
                      key={combatant.id}
                    >
                      <span className="initiative-item__score">{combatant.initiative}</span>
                      <span>
                        <strong>{combatant.name}</strong>
                        <span className="muted-text">
                          {combatant.characterId ? "Personagem" : (combatant.isEnemy ? "Inimigo" : "Aliado")}
                          {" · "}{combatant.actionsPerTurn} ação(ões) por turno
                        </span>
                        {combatant.sharedFields?.map((field) => (
                          <span className="muted-text" key={field.fieldId}>
                            {field.label}: {field.value || "—"}
                          </span>
                        ))}
                      </span>
                      {index === combat.currentTurnIndex && <span className="eyebrow">Na vez</span>}
                    </li>
                  ))}
                </ol>
              </article>

              {!isGM && (
                <CombatGrid
                  asPlayer
                  combatants={combat.combatants}
                  columns={combat.gridColumns}
                  rows={combat.gridRows}
                />
              )}

              {currentCombatant && canSeeAction && (
                <form className="surface-card form-card form-grid combat-panel" onSubmit={submitAction}>
                  <h2 className="form-grid__full">Ação de {currentCombatant.name}</h2>
                  <p className="description form-grid__full">
                    {canAct
                      ? `Ações restantes nesta vez: ${actionsRemaining}`
                      : "Os campos serão habilitados quando for a vez do seu personagem."}
                  </p>
                  <fieldset className="form-grid__full action-fields" disabled={!canAct || isSaving}>
                    <label>
                      Descrição
                      <textarea maxLength={10000} name="description" required rows={3} />
                    </label>
                    <label>
                      Tipo de ação
                      <select onChange={(event) => setActionType(event.target.value)} value={actionType}>
                        <option value="FREE">Livre</option>
                        {availableAttacks.length > 0 && <option value="ATTACK">Ataque</option>}
                      </select>
                    </label>
                    {actionType === "ATTACK" ? (
                      <label>
                        Ataque
                        <select defaultValue="" name="attackId" required>
                          <option value="">Selecione</option>
                          {availableAttacks.map((attack) => (
                            <option
                              disabled={attack.actionsConsumed > actionsRemaining}
                              key={attack.id}
                              value={attack.id}
                            >
                              {attack.name} · {attack.actionsConsumed} ação(ões)
                            </option>
                          ))}
                        </select>
                      </label>
                    ) : (
                      <label>
                        Quantidade de ações
                        <input
                          defaultValue={1}
                          max={Math.max(1, actionsRemaining)}
                          min={1}
                          name="actionsCount"
                          required
                          type="number"
                        />
                      </label>
                    )}
                    <label>
                      Posição no grid
                      <input
                        maxLength={5}
                        name="position"
                        onChange={(event) => setActionPosition(event.target.value)}
                        pattern="[a-zA-Z]+[1-9][0-9]*"
                        required
                        value={actionPosition}
                      />
                    </label>
                    <label>
                      Quantidade de dano causado (opcional)
                      <input min={0} name="damage" step="any" type="number" />
                    </label>
                    <fieldset className="form-grid__full target-picker">
                      <legend>Alvos (opcional)</legend>
                      {combat.combatants.filter((item) => item.id !== currentCombatant.id).map((target) => (
                        <label className="checkbox-label" key={target.id}>
                          <input
                            checked={selectedTargets.includes(target.id)}
                            onChange={(event) => setSelectedTargets((current) => (
                              event.target.checked
                                ? [...current, target.id]
                                : current.filter((id) => id !== target.id)
                            ))}
                            type="checkbox"
                          />
                          {target.name}
                        </label>
                      ))}
                      {!combat.combatants.some((item) => item.id !== currentCombatant.id) && (
                        <p className="description">Não há outros participantes para selecionar.</p>
                      )}
                    </fieldset>
                    <button className="primary-button form-grid__full" disabled={isSaving} type="submit">
                      {isSaving ? "Registrando..." : "Registrar ação"}
                    </button>
                  </fieldset>
                </form>
              )}
              </section>
            )}

            {(!isGM || gmTab === "combat") && (
              <section className="manager-section">
              <h2>Histórico de ações</h2>
              <div className="action-history">
                {[...combat.actions].reverse().map((action) => {
                  const actor = combat.combatants.find((item) => item.id === action.combatantId);
                  const targets = action.targets.map((target) => (
                    combat.combatants.find((item) => item.id === target.combatantId)?.name
                  )).filter(Boolean);
                  return (
                    <article className="surface-card action-card" key={action.id}>
                      <p className="eyebrow">Rodada {action.round} · {actor?.name ?? "Personagem removido"}</p>
                      <p>{action.description}</p>
                      <p className="muted-text">
                        {action.actionType === "ATTACK"
                          ? `Ataque: ${action.attackName ?? "Ataque removido"}`
                          : `Ação livre · ${action.actionsCount ?? 1} ação(ões)`}
                        {" · Posição: "}{action.position}
                      </p>
                      {targets.length > 0 && <p className="muted-text">Alvos: {targets.join(", ")}</p>}
                      {action.damage && <p><strong>Quantidade de dano causado:</strong> {action.damage}</p>}
                    </article>
                  );
                })}
                {!combat.actions.length && <p className="description">Nenhuma ação registrada ainda.</p>}
              </div>
              </section>
            )}
          </>
        ) : null}
      </main>
    </>
  );
}

export default CombatPage;
