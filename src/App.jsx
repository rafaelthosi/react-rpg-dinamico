import { useEffect, useState } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import HomePage from "./pages/HomePage.jsx";
import LoginPage from "./pages/LoginPage.jsx";
import CampaignPage from "./pages/CampaignPage.jsx";
import PlayerCharacterPage from "./pages/PlayerCharacterPage.jsx";
import PlayerCombatsPage from "./pages/PlayerCombatsPage.jsx";
import CombatPage from "./pages/CombatPage.jsx";

function App() {
  const [session, setSession] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("controlrpg-session")) ?? null;
    } catch {
      return null;
    }
  });
  const isAuthenticated = Boolean(session?.token);

  useEffect(() => {
    if (session?.token) {
      localStorage.setItem("controlrpg-session", JSON.stringify(session));
    } else {
      localStorage.removeItem("controlrpg-session");
    }
  }, [session]);

  useEffect(() => {
    const expireSession = () => setSession(null);
    window.addEventListener("controlrpg:session-expired", expireSession);
    return () => window.removeEventListener("controlrpg:session-expired", expireSession);
  }, []);

  function logout() {
    setSession(null);
  }

  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route
        path="/login"
        element={
          isAuthenticated
            ? ( <Navigate to="/home" replace /> )
            : ( <LoginPage onLogin={setSession} /> )
        }
      />
      <Route
        path="/home"
        element={
          isAuthenticated
            ? <HomePage session={session} onLogout={logout} />
            : <Navigate to="/login" replace />
        }
      />
      <Route
        path="/campaigns/:campaignId"
        element={
          isAuthenticated
            ? <CampaignPage session={session} onLogout={logout} />
            : <Navigate to="/login" replace />
        }
      />
      <Route
        path="/characters/:characterId"
        element={
          isAuthenticated && String(session.user.role).toLowerCase() === "player"
            ? <PlayerCharacterPage session={session} onLogout={logout} />
            : <Navigate to={isAuthenticated ? "/home" : "/login"} replace />
        }
      />
      <Route
        path="/combats"
        element={
          isAuthenticated && String(session.user.role).toLowerCase() === "player"
            ? <PlayerCombatsPage session={session} onLogout={logout} />
            : <Navigate to={isAuthenticated ? "/home" : "/login"} replace />
        }
      />
      <Route
        path="/combats/:combatId"
        element={
          isAuthenticated
            ? <CombatPage session={session} onLogout={logout} />
            : <Navigate to="/login" replace />
        }
      />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

export default App;
