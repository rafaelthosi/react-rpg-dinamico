import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
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
  const orderedCombatants = useMemo(
    () => [...(combat?.combatants ?? [])].sort((a, b) => b.initiative - a.initiative),
    [combat?.combatants],
  );
  const currentCombatant = orderedCombatants[combat?.currentTurnIndex ?? 0];

  async function loadCombat() {
    try {
      setCombat(await apiRequest(`/combats/${combatId}`, { session }));
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
