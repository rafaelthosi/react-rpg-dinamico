import { useState } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import HomePage from "./pages/HomePage.jsx";
import LoginPage from "./pages/LoginPage.jsx";
import CharacterPage from "./pages/CharacterPage.jsx";

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route
        path="/login"
        element={
          isAuthenticated
            ? ( <Navigate to="/home" replace /> )
            : ( <LoginPage onLogin={() => setIsAuthenticated(true)} /> )
        }
      />
      <Route
        path="/home"
        element={
          isAuthenticated
            ? <HomePage />
            : <Navigate to="/login" replace />
        }
      />
      <Route
        path="/character"
        element={
          isAuthenticated
            ? <CharacterPage />
            : <Navigate to="/login" replace />
        }
      />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

export default App;
