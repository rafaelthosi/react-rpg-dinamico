import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import CampaignSettings from "../components/CampaignSettings.jsx";
import CharacterManager from "../components/CharacterManager.jsx";
import CombatManager from "../components/CombatManager.jsx";
import Header from "../components/Header.jsx";
import MemberManager from "../components/MemberManager.jsx";
import StructureManager from "../components/StructureManager.jsx";
import { apiRequest, getCampaignStructure } from "../services/rpgApi.js";

const TABS = [
  { id: "overview", label: "Campanha" },
  { id: "members", label: "Jogadores" },
  { id: "characters", label: "Personagens" },
  { id: "structure", label: "Seções e campos" },
  { id: "combats", label: "Combates" },
];

function CampaignPage({ session, onLogout }) {
  const { campaignId } = useParams();
  const navigate = useNavigate();
  const [campaign, setCampaign] = useState(null);
  const [members, setMembers] = useState([]);
  const [characters, setCharacters] = useState([]);
  const [sections, setSections] = useState([]);
  const [activeTab, setActiveTab] = useState("overview");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadCampaign() {
    setError("");
    try {
      const [campaignResult, membersResult, charactersResult, sectionsResult] = await Promise.all([
        apiRequest(`/campaigns/${campaignId}`, { session }),
        apiRequest(`/campaigns/${campaignId}/members`, { session }),
        apiRequest(`/campaigns/${campaignId}/characters`, { session }),
        getCampaignStructure(session, campaignId),
      ]);
      setCampaign(campaignResult);
      setMembers(membersResult);
      setCharacters(charactersResult);
      setSections(sectionsResult);
    } catch (loadError) {
      setError(loadError.message);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadCampaign();
  }, [campaignId, session.token]);

  async function deleteCampaign() {
    if (!window.confirm(`Excluir a campanha "${campaign?.name}" e todos os seus dados?`)) {
      return;
    }
    try {
      await apiRequest(`/campaigns/${campaignId}`, { session, method: "DELETE" });
      navigate("/home");
    } catch (deleteError) {
      setError(deleteError.message);
    }
  }

  return (
    <>
      <Header onLogout={onLogout} />
      <main className="app-content">
        <button className="back-link" onClick={() => navigate("/home")} type="button">
          ← Todas as campanhas
        </button>
        {isLoading ? (
          <p className="description">Carregando campanha...</p>
        ) : error && !campaign ? (
          <p className="feedback feedback--error" role="alert">{error}</p>
        ) : campaign ? (
          <>
            <section className="page-heading">
              <div>
                <p className="eyebrow">Administração da campanha</p>
                <h1 className="page-title">{campaign.name}</h1>
                <p className="description">{campaign.description || "Sem descrição."}</p>
              </div>
            </section>

            {error && <p className="feedback feedback--error" role="alert">{error}</p>}

            <nav className="page-tabs" aria-label="Gerenciamento da campanha">
              {TABS.map((tab) => (
                <button
                  aria-current={activeTab === tab.id ? "page" : undefined}
                  className={`page-tab${activeTab === tab.id ? " page-tab--active" : ""}`}
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  type="button"
                >
                  {tab.label}
                </button>
              ))}
            </nav>

            {activeTab === "overview" && (
              <CampaignSettings
                campaign={campaign}
                onDelete={deleteCampaign}
                onRefresh={loadCampaign}
                session={session}
              />
            )}
            {activeTab === "members" && (
              <MemberManager
                campaignId={campaignId}
                members={members}
                onRefresh={loadCampaign}
                session={session}
              />
            )}
            {activeTab === "characters" && (
              <CharacterManager
                campaignId={campaignId}
                characters={characters}
                members={members}
                onRefresh={loadCampaign}
                sections={sections}
                session={session}
              />
            )}
            {activeTab === "structure" && (
              <StructureManager
                campaignId={campaignId}
                onRefresh={loadCampaign}
                sections={sections}
                session={session}
              />
            )}
            {activeTab === "combats" && (
              <CombatManager
                campaignId={campaignId}
                characters={characters}
                sections={sections}
                session={session}
              />
            )}
          </>
        ) : null}
      </main>
    </>
  );
}

export default CampaignPage;
