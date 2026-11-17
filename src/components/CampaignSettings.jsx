import { useState } from "react";
import { apiRequest } from "../services/rpgApi.js";

function CampaignSettings({ campaign, session, onRefresh, onDelete }) {
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  async function handleSave(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const body = {
      name: form.get("name"),
      description: form.get("description"),
    };
    const password = form.get("password");
    if (password) {
      body.password = password;
    }

    setError("");
    setNotice("");
    setIsSaving(true);
    try {
      await apiRequest(`/campaigns/${campaign.id}`, { session, method: "PATCH", body });
      setNotice("Informações da campanha atualizadas.");
      await onRefresh();
    } catch (saveError) {
      setError(saveError.message);
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <section className="manager-section">
      <div className="manager-heading">
        <div>
          <h2>Informações da campanha</h2>
          <p className="description">Edite o nome, a descrição ou a senha de acesso.</p>
        </div>
      </div>
      <form className="surface-card form-card form-grid" onSubmit={handleSave}>
        <label>
          Nome
          <input defaultValue={campaign.name} maxLength={255} name="name" required />
        </label>
        <label>
          Descrição
          <textarea defaultValue={campaign.description} maxLength={10000} name="description" rows={4} />
        </label>
        <label>
          Nova senha de acesso
          <input
            autoComplete="new-password"
            minLength={8}
            name="password"
            placeholder="Deixe vazio para manter a senha atual"
            type="password"
          />
        </label>
        {error && <p className="feedback feedback--error" role="alert">{error}</p>}
        {notice && <p className="feedback feedback--success" role="status">{notice}</p>}
        <div className="button-row">
          <button className="primary-button" disabled={isSaving} type="submit">
            {isSaving ? "Salvando..." : "Salvar alterações"}
          </button>
          <button className="danger-button" onClick={onDelete} type="button">
            Excluir campanha
          </button>
        </div>
      </form>
    </section>
  );
}

export default CampaignSettings;
