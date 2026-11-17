import CampaignListPage from "./CampaignListPage.jsx";
import PlayerPage from "./PlayerPage.jsx";

function HomePage({ session, onLogout }) {
  if (String(session.user.role).toLowerCase() === "gm") {
    return <CampaignListPage session={session} onLogout={onLogout} />;
  }
  return <PlayerPage session={session} onLogout={onLogout} />;
}

export default HomePage;
