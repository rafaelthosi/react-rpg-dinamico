import { useState } from "react";
import { apiRequest } from "../services/rpgApi.js";

function NpcFieldInput({ field, value = "" }) {
  const name = `field-${field.id}`;
  if (field.type === "SELECT" || field.type === "BOOLEAN") {
    return (
      <label key={field.id}>
        {field.label}{field.required ? " *" : ""}
        <select defaultValue={value} name={name} required={field.required}>
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
        <input defaultChecked={value === "true"} name={name} type="checkbox" />
        {field.label}
      </label>
    );
  }
  if (field.type === "TEXTAREA") {
    return (
      <label key={field.id}>
        {field.label}{field.required ? " *" : ""}
        <textarea defaultValue={value} maxLength={10000} name={name} required={field.required} />
      </label>
    );
  }
  const type = field.type === "NUMBER" || field.type === "DATE" ? field.type.toLowerCase() : "text";
  return (
    <label key={field.id}>
      {field.label}{field.required ? " *" : ""}
      <input
        defaultValue={value}
        maxLength={type === "text" ? 10000 : undefined}
        name={name}
        required={field.required}
        type={type}
      />
    </label>
  );
}

function getFieldValues(form, fields) {
  const data = new FormData(form);
  return fields.map((field) => ({
    fieldId: field.id,
    value: field.type === "CHECKBOX"
      ? String(data.has(`field-${field.id}`))
      : String(data.get(`field-${field.id}`) ?? ""),
  }));
}

function NpcManager({ campaignId, npcs, sections, session, onRefresh }) {
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const npcSections = sections.map((section) => ({
    ...section,
    fields: section.fields.filter((field) => field.shareWithNpcs),
  })).filter((section) => section.fields.length > 0);
  const sharedFields = npcSections.flatMap((section) => section.fields);

  function renderNpcSections(values = {}) {
    return npcSections.map((section) => (
      <section className="npc-field-section form-grid__full" key={section.id}>
        <h4>{section.name}</h4>
        <div className="form-grid form-grid--two npc-field-section__fields">
          {section.fields.map((field) => (
            <NpcFieldInput field={field} key={field.id} value={values[field.id] ?? ""} />
          ))}
        </div>
      </section>
    ));
  }

  async function saveNpc(event, npc = null) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    setError("");
    setIsSaving(true);
    try {
      await apiRequest(npc ? `/npcs/${npc.id}` : `/campaigns/${campaignId}/npcs`, {
        session,
        method: npc ? "PATCH" : "POST",
        body: {
          name: data.get("name"),
          isEnemy: data.get("isEnemy") === "on",
          fieldValues: getFieldValues(form, sharedFields),
        },
      });
      if (!npc) {
        form.reset();
      }
      await onRefresh();
    } catch (saveError) {
      setError(saveError.message);
    } finally {
      setIsSaving(false);
    }
  }

  async function deleteNpc(npc) {
    if (!window.confirm(`Remover o NPC "${npc.name}"?`)) {
      return;
    }
    setError("");
    try {
      await apiRequest(`/npcs/${npc.id}`, { session, method: "DELETE" });
      await onRefresh();
    } catch (deleteError) {
      setError(deleteError.message);
    }
  }

  return (
    <section className="manager-section">
      <div className="manager-heading">
        <div>
          <h2>NPCs</h2>
          <p className="description">Cadastre aliados e inimigos para reutilizá-los nos combates.</p>
        </div>
      </div>

      <form className="surface-card form-card form-grid form-grid--two" onSubmit={saveNpc}>
        <h3 className="form-grid__full">Novo NPC</h3>
        <label>
          Nome
          <input autoComplete="off" maxLength={255} name="name" required />
        </label>
        <label className="checkbox-label">
          <input defaultChecked name="isEnemy" type="checkbox" />
          Inimigo
        </label>
        {renderNpcSections()}
        <button className="primary-button form-grid__full" disabled={isSaving} type="submit">
          {isSaving ? "Criando..." : "Criar NPC"}
        </button>
      </form>

      {error && <p className="feedback feedback--error" role="alert">{error}</p>}
      <div className="character-list">
        {npcs.map((npc) => {
          const values = Object.fromEntries(npc.fieldValues.map((item) => [item.fieldId, item.value]));
          return (
            <article className="surface-card character-tile" key={npc.id}>
              <header className="character-tile__header">
                <div>
                  <p className="eyebrow">{npc.isEnemy ? "Inimigo" : "Aliado"}</p>
                  <h3>{npc.name}</h3>
                </div>
                <button className="danger-button" onClick={() => deleteNpc(npc)} type="button">
                  Remover
                </button>
              </header>
              <form className="form-grid form-grid--two" onSubmit={(event) => saveNpc(event, npc)}>
                <label>
                  Nome
                  <input defaultValue={npc.name} maxLength={255} name="name" required />
                </label>
                <label className="checkbox-label">
                  <input defaultChecked={npc.isEnemy} name="isEnemy" type="checkbox" />
                  Inimigo
                </label>
                {renderNpcSections(values)}
                <button className="secondary-button form-grid__full" disabled={isSaving} type="submit">
                  Salvar alterações
                </button>
              </form>
            </article>
          );
        })}
        {!npcs.length && <p className="description">Nenhum NPC cadastrado nesta campanha.</p>}
      </div>
    </section>
  );
}

export default NpcManager;
