import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header.jsx";
import { apiRequest } from "../services/rpgApi.js";

function CampaignListPage({ session, onLogout }) {
  const navigate = useNavigate();
  const [campaigns, setCampaigns] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  async function loadCampaigns() {
    setError("");
    try {
      setCampaigns(await apiRequest("/campaigns", { session }));
    } catch (loadError) {
      setError(loadError.message);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadCampaigns();
  }, [session.token]);

  async function handleCreate(event) {
    event.preventDefault();
    setIsSaving(true);
    setError("");
    const form = new FormData(event.currentTarget);
    try {
      const campaign = await apiRequest("/campaigns", {
        session,
        method: "POST",
        body: {
          name: form.get("name"),
          description: form.get("description"),
          password: form.get("password"),
        },
      });
      setCampaigns((current) => [...current, campaign]);
      setShowForm(false);
      navigate(`/campaigns/${campaign.id}`);
    } catch (saveError) {
      setError(saveError.message);
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <>
      <Header onLogout={onLogout} />
      <main className="app-content">
        <section className="page-heading">
          <div>
            <p className="eyebrow">Área do GM</p>
            <h1 className="page-title">Suas campanhas</h1>
            <p className="description">Crie uma aventura ou continue administrando suas campanhas.</p>
          </div>
          <button
            aria-expanded={showForm}
            className="primary-button"
            onClick={() => setShowForm((value) => !value)}
            type="button"
          >
            {showForm ? "Cancelar" : "+ Nova campanha"}
          </button>
        </section>

        {error && <p className="feedback feedback--error" role="alert">{error}</p>}

        {showForm && (
          <form className="surface-card form-card form-grid" onSubmit={handleCreate}>
            <h2>Nova campanha</h2>
            <label>
              Nome
              <input autoComplete="off" maxLength={255} name="name" required />
            </label>
            <label>
              Descrição
              <textarea maxLength={10000} name="description" rows={3} />
            </label>
            <label>
              Senha de acesso
              <input autoComplete="new-password" minLength={8} name="password" required type="password" />
            </label>
            <button className="primary-button" disabled={isSaving} type="submit">
              {isSaving ? "Criando..." : "Criar campanha"}
            </button>
          </form>
        )}

        {isLoading ? (
          <p className="description">Carregando campanhas...</p>
        ) : campaigns.length ? (
          <div className="campaign-grid">
            {campaigns.map((campaign) => (
              <button
                className="surface-card campaign-tile"
                key={campaign.id}
                onClick={() => navigate(`/campaigns/${campaign.id}`)}
                type="button"
              >
                <span className="campaign-tile__eyebrow">Campanha</span>
                <span className="campaign-tile__title">{campaign.name}</span>
                <span className="campaign-tile__description">
                  {campaign.description || "Sem descrição."}
                </span>
                <span className="campaign-tile__action">Abrir campanha →</span>
              </button>
            ))}
          </div>
        ) : (
          <section className="surface-card empty-state">
            <h2>Nenhuma campanha ainda</h2>
            <p className="description">Use “Nova campanha” para começar a montar sua aventura.</p>
          </section>
        )}
      </main>
    </>
  );
}

export default CampaignListPage;
