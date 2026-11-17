import { useEffect, useState } from "react";

function FieldValueEditor({ field, initialValue = "", canEdit, onSave }) {
  const [value, setValue] = useState(initialValue);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setValue(initialValue);
  }, [initialValue]);

  async function handleSave(event) {
    event.preventDefault();
    setError("");
    setSaved(false);
    setIsSaving(true);
    try {
      const savedValue = await onSave(value);
      setValue(savedValue);
      setSaved(true);
    } catch (saveError) {
      setError(saveError.message);
    } finally {
      setIsSaving(false);
    }
  }

  const label = (
    <span className="field-control__label">
      {field.label}{field.required && <span aria-label="obrigatório"> *</span>}
    </span>
  );

  if (!canEdit) {
    return (
      <div className="field-control">
        {label}
        <p className="field-control__readonly">{formatValue(field, value)}</p>
      </div>
    );
  }

  let control;
  if (field.type === "SELECT") {
    control = (
      <select
        onChange={(event) => setValue(event.target.value)}
        required={field.required}
        value={value}
      >
        <option value="">Selecione</option>
        {field.options.map((option) => (
          <option key={option.id} value={option.value}>{option.label}</option>
        ))}
      </select>
    );
  } else if (field.type === "TEXTAREA") {
    control = (
      <textarea
        onChange={(event) => setValue(event.target.value)}
        required={field.required}
        rows={3}
        value={value}
      />
    );
  } else if (field.type === "CHECKBOX") {
    control = (
      <input
        checked={value === "true"}
        onChange={(event) => setValue(String(event.target.checked))}
        type="checkbox"
      />
    );
  } else if (field.type === "BOOLEAN") {
    control = (
      <select
        onChange={(event) => setValue(event.target.value)}
        required={field.required}
        value={value}
      >
        <option value="">Selecione</option>
        <option value="true">Sim</option>
        <option value="false">Não</option>
      </select>
    );
  } else {
    const type = field.type === "NUMBER" ? "number" : field.type === "DATE" ? "date" : "text";
    control = (
      <input
        onChange={(event) => setValue(event.target.value)}
        required={field.required}
        type={type}
        value={value}
      />
    );
  }

  return (
    <form className="field-control" onSubmit={handleSave}>
      <label>
        {label}
        {control}
      </label>
      <div className="field-control__actions">
        <button className="secondary-button secondary-button--small" disabled={isSaving} type="submit">
          {isSaving ? "Salvando..." : "Salvar"}
        </button>
        {saved && <span className="feedback--success">Salvo</span>}
      </div>
      {error && <p className="feedback feedback--error" role="alert">{error}</p>}
    </form>
  );
}

function formatValue(field, value) {
  if (value === "") {
    return "Não preenchido";
  }
  if (["BOOLEAN", "CHECKBOX"].includes(field.type)) {
    return value === "true" ? "Sim" : "Não";
  }
  if (field.type === "SELECT") {
    return field.options.find((option) => option.value === value)?.label ?? value;
  }
  return value;
}

export default FieldValueEditor;
