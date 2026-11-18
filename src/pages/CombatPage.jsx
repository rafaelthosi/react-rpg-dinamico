import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import Header from "../components/Header.jsx";
import { apiRequest, getCampaignStructure } from "../services/rpgApi.js";

function CombatPage({ session, onLogout }) {
  const { combatId } = useParams();
  const isGM = String(session.user.role).toLowerCase() === "gm";
  const [combat, setCombat] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [selectedTargets, setSelectedTargets] = useState([]);
  const [characters, setCharacters] = useState([]);
  const [sections, setSections] = useState([]);
  const [showParticipantForm, setShowParticipantForm] = useState(false);
  const [participantKind, setParticipantKind] = useState("character");
  const [participantCharacterId, setParticipantCharacterId] = useState("");
  const [npcName, setNpcName] = useState("");
  const [npcIsEnemy, setNpcIsEnemy] = useState(true);
  const [npcFieldValues, setNpcFieldValues] = useState({});
  const orderedCombatants = useMemo(
    () => [...(combat?.combatants ?? [])].sort((a, b) => b.initiative - a.initiative),
    [combat?.combatants],
  );
  const sharedFields = useMemo(
    () => sections.flatMap((section) => section.fields).filter((field) => field.shareWithNpcs),
    [sections],
  );
  const currentCombatant = orderedCombatants[combat?.currentTurnIndex ?? 0];

  async function loadCombat() {
    try {
      const loadedCombat = await apiRequest(`/combats/${combatId}`, { session });
      setCombat(loadedCombat);
      if (isGM) {
        const [charactersResult, sectionsResult] = await Promise.all([
          apiRequest(`/campaigns/${loadedCombat.campaignId}/characters`, { session }),
          getCampaignStructure(session, loadedCombat.campaignId),
        ]);
        setCharacters(charactersResult);
        setSections(sectionsResult);
      }
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
          damage: data.get("damage"),
          targets: selectedTargets,
        },
      });
      setCombat(updated);
      setSelectedTargets([]);
      form.reset();
    } catch (saveError) {
      setError(saveError.message);
    } finally {
      setIsSaving(false);
    }
  }

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

  async function addParticipant(event) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    setIsSaving(true);
    setError("");
    try {
      const participant = participantKind === "character"
        ? { characterId: participantCharacterId }
        : {
          name: npcName,
          isEnemy: npcIsEnemy,
          fieldValues: sharedFields.map((field) => ({
            fieldId: field.id,
            value: npcFieldValues[field.id] ?? "",
          })),
        };
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
      setNpcName("");
      setNpcFieldValues({});
      event.currentTarget.reset();
    } catch (saveError) {
      setError(saveError.message);
    } finally {
      setIsSaving(false);
    }
  }

  const actionsUsed = combat?.actions.filter((action) => (
    action.round === combat.currentRound && action.combatantId === currentCombatant?.id
  )).length ?? 0;
  const actionAvailable = combat?.active && currentCombatant && actionsUsed < currentCombatant.actionsPerTurn;
  const returnPath = isGM && combat ? `/campaigns/${combat.campaignId}` : "/combats";

  return (
    <>
      <Header onLogout={onLogout} />
      <main className="app-content">
        <Link className="back-link" to={returnPath}>← Voltar</Link>
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
              <section className="manager-section">
                {!showParticipantForm ? (
                  <button className="secondary-button" onClick={() => setShowParticipantForm(true)} type="button">
                    Adicionar personagem ou NPC
                  </button>
                ) : (
                  <form className="surface-card form-card form-grid" onSubmit={addParticipant}>
                    <h2 className="form-grid__full">Adicionar participante</h2>
                    <label>
                      Tipo
                      <select
                        onChange={(event) => setParticipantKind(event.target.value)}
                        value={participantKind}
                      >
                        <option value="character">Personagem</option>
                        <option value="npc">NPC/criatura</option>
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
                      <>
                        <label>
                          Nome do NPC/criatura
                          <input
                            maxLength={255}
                            onChange={(event) => setNpcName(event.target.value)}
                            required
                            value={npcName}
                          />
                        </label>
                        <label className="checkbox-label">
                          <input
                            checked={npcIsEnemy}
                            onChange={(event) => setNpcIsEnemy(event.target.checked)}
                            type="checkbox"
                          />
                          Inimigo
                        </label>
                        {sharedFields.map((field) => {
                          const value = npcFieldValues[field.id] ?? "";
                          const setValue = (nextValue) => setNpcFieldValues((current) => ({
                            ...current,
                            [field.id]: nextValue,
                          }));
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
                      Iniciativa
                      <input min={0} name="initiative" required type="number" defaultValue={0} />
                    </label>
                    <label>
                      Ações por turno
                      <input min={1} name="actionsPerTurn" required type="number" defaultValue={1} />
                    </label>
                    <div className="button-row form-grid__full">
                      <button className="primary-button" disabled={isSaving} type="submit">
                        {isSaving ? "Adicionando..." : "Adicionar"}
                      </button>
                      <button className="secondary-button" onClick={() => setShowParticipantForm(false)} type="button">
                        Cancelar
                      </button>
                    </div>
                  </form>
                )}
              </section>
            )}

            <section className="combat-layout">
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

              {actionAvailable && (isGM || currentCombatant.isMine) && (
                <form className="surface-card form-card form-grid combat-panel" onSubmit={submitAction}>
                  <h2 className="form-grid__full">Ação de {currentCombatant.name}</h2>
                  <p className="description form-grid__full">
                    Ações restantes nesta vez: {currentCombatant.actionsPerTurn - actionsUsed}
                  </p>
                  <label>Descrição<textarea maxLength={10000} name="description" required rows={3} /></label>
                  <label>Dano (opcional)<input maxLength={255} name="damage" placeholder="1d4 ou 4" /></label>
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
                </form>
              )}
            </section>

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
                      {targets.length > 0 && <p className="muted-text">Alvos: {targets.join(", ")}</p>}
                      {action.damage && <p><strong>Dano:</strong> {action.damage}</p>}
                    </article>
                  );
                })}
                {!combat.actions.length && <p className="description">Nenhuma ação registrada ainda.</p>}
              </div>
            </section>
          </>
        ) : null}
      </main>
    </>
  );
}

export default CombatPage;
