import { useState } from "react";
import { apiRequest } from "../services/rpgApi.js";

function StructureManager({ campaignId, sections, session, onRefresh }) {
  const [error, setError] = useState("");

  async function run(action) {
    setError("");
    try {
      await action();
      await onRefresh();
    } catch (actionError) {
      setError(actionError.message);
    }
  }

  async function createSection(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    await run(async () => {
      await apiRequest(`/campaigns/${campaignId}/sections`, {
        session,
        method: "POST",
        body: {
          name: data.get("name"),
          description: data.get("description"),
          position: Number(data.get("position")),
        },
      });
      form.reset();
    });
  }

  async function editSection(event, section) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    await run(async () => {
      await apiRequest(`/sections/${section.id}`, {
        session,
        method: "PATCH",
        body: {
          name: data.get("name"),
          description: data.get("description"),
          position: Number(data.get("position")),
        },
      });
      form.closest("details").open = false;
    });
  }

  async function deleteSection(section) {
    if (!window.confirm(`Remover a seção "${section.name}", seus campos e valores?`)) {
      return;
    }
    await run(() => apiRequest(`/sections/${section.id}`, { session, method: "DELETE" }));
  }

  async function createField(event, section) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    await run(async () => {
      await apiRequest(`/sections/${section.id}/fields`, {
        session,
        method: "POST",
        body: {
          label: data.get("label"),
          type: data.get("type"),
          required: data.get("required") === "on",
          editableBy: data.get("editableBy"),
          visibleTo: data.get("visibleTo"),
          shareWithNpcs: data.get("shareWithNpcs") === "on",
          position: Number(data.get("position")),
        },
      });
      form.reset();
    });
  }

  async function updateField(event, field) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    await run(async () => {
      await apiRequest(`/fields/${field.id}`, {
        session,
        method: "PATCH",
        body: {
          label: data.get("label"),
          type: data.get("type"),
          required: data.get("required") === "on",
          editableBy: data.get("editableBy"),
          visibleTo: data.get("visibleTo"),
          position: Number(data.get("position")),
          shareWithNpcs: data.get("shareWithNpcs") === "on",
        },
      });
      form.closest("details").open = false;
    });
  }

  async function deleteField(field) {
    if (!window.confirm(`Remover o campo "${field.label}" e seus valores?`)) {
      return;
    }
    await run(() => apiRequest(`/fields/${field.id}`, { session, method: "DELETE" }));
  }

  async function createOption(event, field) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    await run(async () => {
      await apiRequest(`/fields/${field.id}/options`, {
        session,
        method: "POST",
        body: {
          label: data.get("label"),
          value: data.get("value"),
          position: field.options.length,
        },
      });
      form.reset();
    });
  }

  async function editOption(option) {
    const label = window.prompt("Rótulo da opção", option.label);
    if (!label || label.trim() === option.label) {
      return;
    }
    await run(() => apiRequest(`/field-options/${option.id}`, {
      session, method: "PATCH", body: { label },
    }));
  }

  async function deleteOption(option) {
    if (!window.confirm(`Remover a opção "${option.label}"?`)) {
      return;
    }
    await run(() => apiRequest(`/field-options/${option.id}`, { session, method: "DELETE" }));
  }

  return (
    <section className="manager-section">
      <div className="manager-heading">
        <div>
          <h2>Seções e campos dinâmicos</h2>
          <p className="description">
            As definições criadas aqui montam as fichas dos personagens da campanha.
          </p>
        </div>
      </div>

      <form className="surface-card form-card form-grid form-grid--two" onSubmit={createSection}>
        <h3 className="form-grid__full">Criar seção</h3>
        <label>
          Nome
          <input maxLength={255} name="name" required />
        </label>
        <label>
          Descrição
          <input maxLength={10000} name="description" />
        </label>
        <label>
          Ordem
          <input defaultValue={sections.length} min={0} name="position" type="number" required />
        </label>
        <button className="primary-button form-grid__full" type="submit">Adicionar seção</button>
      </form>

      {error && <p className="feedback feedback--error" role="alert">{error}</p>}

      <div className="structure-list">
        {sections.map((section) => (
          <article className="surface-card structure-card" key={section.id}>
            <header className="structure-card__header">
              <div>
                <p className="eyebrow">Seção</p>
                <h3>{section.name}</h3>
                {section.description && <p className="description">{section.description}</p>}
              </div>
              <div className="button-row">
                <details className="field-edit">
                  <summary>Editar seção</summary>
                  <form
                    className="form-grid form-grid--two"
                    onSubmit={(event) => editSection(event, section)}
                  >
                    <label>
                      Nome
                      <input defaultValue={section.name} maxLength={255} name="name" required />
                    </label>
                    <label>
                      Descrição
                      <input
                        defaultValue={section.description ?? ""}
                        maxLength={10000}
                        name="description"
                      />
                    </label>
                    <label>
                      Ordem
                      <input
                        defaultValue={section.position}
                        min={0}
                        name="position"
                        required
                        type="number"
                      />
                    </label>
                    <button className="primary-button form-grid__full" type="submit">Salvar seção</button>
                  </form>
                </details>
                <button className="danger-button" onClick={() => deleteSection(section)} type="button">
                  Remover
                </button>
              </div>
            </header>

            <div className="field-definition-list">
              {section.fields.map((field) => (
                <div className="field-definition" key={field.id}>
                  <div className="field-definition__header">
                    <div>
                      <strong>{field.label}</strong>
                      <span className="muted-text">{field.type} · edição: {field.editableBy} · ordem: {field.position}</span>
                    </div>
                    <div className="button-row">
                      <details className="field-edit">
                        <summary>Configurar</summary>
                        <form className="form-grid form-grid--two" onSubmit={(event) => updateField(event, field)}>
                          <label>
                            Rótulo
                            <input defaultValue={field.label} maxLength={255} name="label" required />
                          </label>
                          <label>
                            Tipo
                            <select defaultValue={field.type} name="type">
                              {["TEXT", "NUMBER", "TEXTAREA", "SELECT", "CHECKBOX", "BOOLEAN", "DATE"].map((type) => (
                                <option key={type} value={type}>{type}</option>
                              ))}
                            </select>
                          </label>
                          <label>
                            Editável por
                            <select defaultValue={field.editableBy} name="editableBy">
                              <option value="GM">GM</option>
                              <option value="PLAYER">Jogador</option>
                              <option value="BOTH">Ambos</option>
                            </select>
                          </label>
                          <label>
                            Visível para
                            <select defaultValue={field.visibleTo} name="visibleTo">
                              <option value="GM">GM</option>
                              <option value="PLAYER">Jogador</option>
                              <option value="BOTH">Ambos</option>
                            </select>
                          </label>
                          <label className="checkbox-label">
                            <input defaultChecked={field.required} name="required" type="checkbox" />
                            Obrigatório
                          </label>
                          <label>
                            Ordem
                            <input defaultValue={field.position} min={0} name="position" type="number" required />
                          </label>
                          <label className="checkbox-label">
                            <input defaultChecked={field.shareWithNpcs} name="shareWithNpcs" type="checkbox" />
                            Compartilhar com NPCs/criaturas
                          </label>
                          <button className="primary-button form-grid__full" type="submit">Salvar configuração</button>
                        </form>
                      </details>
                      <button className="danger-button" onClick={() => deleteField(field)} type="button">
                        Remover
                      </button>
                    </div>
                  </div>

                  {field.type === "SELECT" && (
                    <div className="option-list">
                      {field.options.map((option) => (
                        <div className="option-row" key={option.id}>
                          <span>{option.label} <span className="muted-text">({option.value})</span></span>
                          <div className="button-row">
                            <button className="secondary-button secondary-button--small" onClick={() => editOption(option)} type="button">
                              Editar
                            </button>
                            <button className="danger-button" onClick={() => deleteOption(option)} type="button">
                              Remover
                            </button>
                          </div>
                        </div>
                      ))}
                      <form className="inline-form inline-form--compact" onSubmit={(event) => createOption(event, field)}>
                        <label>
                          Rótulo
                          <input maxLength={255} name="label" required />
                        </label>
                        <label>
                          Ordem
                          <input defaultValue={section.fields.length} min={0} name="position" type="number" required />
                        </label>
                        <label>
                          Valor armazenado
                          <input maxLength={255} name="value" required />
                        </label>
                        <button className="secondary-button" type="submit">Adicionar opção</button>
                      </form>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <details className="create-field">
              <summary>Adicionar campo</summary>
              <form className="form-grid form-grid--two" onSubmit={(event) => createField(event, section)}>
                <label>
                  Rótulo
                  <input maxLength={255} name="label" required />
                </label>
                <label>
                  Tipo
                  <select defaultValue="TEXT" name="type">
                    {["TEXT", "NUMBER", "TEXTAREA", "SELECT", "CHECKBOX", "BOOLEAN", "DATE"].map((type) => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </label>
                <label>
                  Editável por
                  <select defaultValue="PLAYER" name="editableBy">
                    <option value="GM">GM</option>
                    <option value="PLAYER">Jogador</option>
                    <option value="BOTH">Ambos</option>
                  </select>
                </label>
                <label>
                  Visível para
                  <select defaultValue="BOTH" name="visibleTo">
                    <option value="GM">GM</option>
                    <option value="PLAYER">Jogador</option>
                    <option value="BOTH">Ambos</option>
                  </select>
                </label>
                <label className="checkbox-label">
                  <input name="required" type="checkbox" />
                  Obrigatório
                </label>
                <label>
                  Ordem
                  <input defaultValue={section.fields.length} min={0} name="position" required type="number" />
                </label>
                <label className="checkbox-label">
                  <input name="shareWithNpcs" type="checkbox" />
                  Compartilhar com NPCs/criaturas
                </label>
                <button className="primary-button form-grid__full" type="submit">Criar campo</button>
              </form>
            </details>
          </article>
        ))}
        {!sections.length && <p className="description">Crie uma seção para começar a definir a ficha.</p>}
      </div>
    </section>
  );
}

export default StructureManager;
