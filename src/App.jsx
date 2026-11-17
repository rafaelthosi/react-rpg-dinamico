import { useState } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import HomePage from "./pages/HomePage.jsx";
import LoginPage from "./pages/LoginPage.jsx";
import CampaignPage from "./pages/CampaignPage.jsx";

function App() {
  const [session, setSession] = useState(null);
  const isAuthenticated = Boolean(session?.token);

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
            ? <HomePage session={session} onLogout={() => setSession(null)} />
            : <Navigate to="/login" replace />
        }
      />
      <Route
        path="/campaigns/:campaignId"
        element={
          isAuthenticated
            ? <CampaignPage session={session} onLogout={() => setSession(null)} />
            : <Navigate to="/login" replace />
        }
      />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

export default App;
