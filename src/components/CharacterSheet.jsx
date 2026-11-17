import { useEffect, useState } from "react";
import FieldValueEditor from "./FieldValueEditor.jsx";
import { apiRequest } from "../services/rpgApi.js";

function CharacterSheet({ character, sections, session, actorRole }) {
  const [activeSectionId, setActiveSectionId] = useState(sections[0]?.id ?? "");
  const [values, setValues] = useState({});
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setIsLoading(true);
    apiRequest(`/characters/${character.id}/values`, { session })
      .then((items) => {
        if (active) {
          setValues(Object.fromEntries(items.map((item) => [item.fieldId, item.value])));
          setError("");
        }
      })
      .catch((loadError) => {
        if (active) {
          setError(loadError.message);
        }
      })
      .finally(() => {
        if (active) {
          setIsLoading(false);
        }
      });
    return () => {
      active = false;
    };
  }, [character.id, session.token]);

  const activeSection = sections.find((section) => section.id === activeSectionId);
  const role = String(actorRole).toUpperCase();
  const visibleFields = activeSection?.fields.filter((field) => (
    field.visibleTo === "BOTH" || field.visibleTo === role
  )) ?? [];

  async function saveValue(field, value) {
    const saved = await apiRequest(`/characters/${character.id}/values/${field.id}`, {
      session,
      method: "PUT",
      body: { value },
    });
    setValues((current) => ({ ...current, [field.id]: saved.value }));
    return saved.value;
  }

  return (
    <section className="sheet-panel">
      <div className="sheet-tabs" role="tablist" aria-label={`Seções da ficha de ${character.name}`}>
        {sections.map((section) => (
          <button
            aria-selected={activeSectionId === section.id}
            className={`sheet-tab${activeSectionId === section.id ? " sheet-tab--active" : ""}`}
            key={section.id}
            onClick={() => setActiveSectionId(section.id)}
            role="tab"
            type="button"
          >
            {section.name}
          </button>
        ))}
      </div>

      {error && <p className="feedback feedback--error" role="alert">{error}</p>}
      {isLoading ? (
        <p className="description">Carregando valores...</p>
      ) : activeSection ? (
        <div className="field-grid" role="tabpanel">
          {visibleFields.map((field) => {
            const canEdit = field.editableBy === "BOTH" || field.editableBy === role;
            return (
              <FieldValueEditor
                canEdit={canEdit}
                field={field}
                initialValue={values[field.id] ?? ""}
                key={field.id}
                onSave={(value) => saveValue(field, value)}
              />
            );
          })}
          {!visibleFields.length && (
            <p className="description">Esta seção ainda não possui campos.</p>
          )}
        </div>
      ) : (
        <p className="description">A campanha ainda não possui seções.</p>
      )}
    </section>
  );
}

export default CharacterSheet;
