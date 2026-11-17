import { useState } from "react";
import { useNavigate } from "react-router-dom";
import ProfileSelector from "../components/ProfileSelector.jsx";
import { joinCampaign, login, registerGM } from "../services/authService.js";
import { apiRequest } from "../services/rpgApi.js";

function LoginPage({ onLogin }) {
  const navigate = useNavigate();
  const [profile, setProfile] = useState("player");
  const [step, setStep] = useState("credentials");
  const [session, setSession] = useState(null);
  const [campaigns, setCampaigns] = useState([]);
  const [campaignId, setCampaignId] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [campaignPassword, setCampaignPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleRegistration(event) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const authenticated = await registerGM({ username, password });
      onLogin(authenticated);
      navigate("/home");
    } catch (registrationError) {
      setError(registrationError.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleCredentials(event) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const authenticated = await login({ username, password });
      if (String(authenticated.user.role).toLowerCase() !== profile) {
        throw new Error("O perfil selecionado não corresponde a esta conta.");
      }

      if (profile === "gm") {
        onLogin(authenticated);
        navigate("/home");
        return;
      }

      const availableCampaigns = await apiRequest("/campaigns", { session: authenticated });
      setSession(authenticated);
      setCampaigns(availableCampaigns);
      setStep("campaign");
      if (!availableCampaigns.length) {
        setError("Esta conta ainda não está vinculada a uma campanha ativa. Peça ao GM para adicioná-la.");
      }
    } catch (loginError) {
      setError(loginError.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleCampaign(event) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      await joinCampaign(session, campaignId, campaignPassword);
      onLogin({ ...session, campaignId });
      navigate("/home");
    } catch (joinError) {
      setError(joinError.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="login-content">
      <section className="surface-card login-card">
        <p className="eyebrow">RPG de mesa</p>
        <h1 className="page-title">
          {step === "credentials"
            ? "Entrar"
            : step === "registration"
              ? "Criar conta GM"
              : "Acessar campanha"}
        </h1>
        <p className="description">
          {step === "credentials"
            ? "Entre com sua conta para acessar suas campanhas."
            : step === "registration"
              ? "Crie sua conta para começar a mestrar suas campanhas."
              : "Escolha uma campanha vinculada à sua conta e informe a senha de acesso."}
        </p>

        {step === "credentials" ? (
          <form className="login-form" onSubmit={handleCredentials}>
            <label htmlFor="username">Nome de usuário</label>
            <input
              autoComplete="username"
              id="username"
              maxLength={50}
              onChange={(event) => setUsername(event.target.value)}
              placeholder="Seu nome de usuário"
              required
              value={username}
            />

            <label htmlFor="password">Senha</label>
            <input
              autoComplete="current-password"
              id="password"
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Sua senha"
              required
              type="password"
              value={password}
            />

            <ProfileSelector onChange={setProfile} value={profile} required />
            {error && <p className="login-error" role="alert">{error}</p>}
            <button className="primary-button" disabled={isSubmitting} type="submit">
              {isSubmitting ? "Validando..." : "Continuar"}
            </button>
            <button
              className="secondary-button"
              disabled={isSubmitting}
              onClick={() => {
                setStep("registration");
                setError("");
              }}
              type="button"
            >
              Criar conta
            </button>
          </form>
        ) : step === "registration" ? (
          <form className="login-form" onSubmit={handleRegistration}>
            <aside className="login-role-note">
              <strong>Esta conta será criada com o perfil GM (Mestre).</strong>
              <p>Com esse perfil, você poderá criar e gerenciar campanhas.</p>
            </aside>

            <label htmlFor="username">Nome de usuário</label>
            <input
              autoComplete="username"
              id="username"
              maxLength={50}
              minLength={3}
              onChange={(event) => setUsername(event.target.value)}
              placeholder="Seu nome de usuário"
              required
              value={username}
            />

            <label htmlFor="password">Senha (mínimo de 12 caracteres)</label>
            <input
              autoComplete="new-password"
              id="password"
              maxLength={200}
              minLength={12}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Crie uma senha"
              required
              type="password"
              value={password}
            />

            {error && <p className="login-error" role="alert">{error}</p>}
            <button className="primary-button" disabled={isSubmitting} type="submit">
              {isSubmitting ? "Criando conta..." : "Cadastrar como GM"}
            </button>
            <button
              className="secondary-button"
              disabled={isSubmitting}
              onClick={() => {
                setStep("credentials");
                setError("");
              }}
              type="button"
            >
              Já tenho uma conta
            </button>
          </form>
        ) : (
          <form className="login-form" onSubmit={handleCampaign}>
            <label htmlFor="campaign">Campanha</label>
            <select
              id="campaign"
              onChange={(event) => setCampaignId(event.target.value)}
              required
              value={campaignId}
            >
              <option value="">Selecione uma campanha</option>
              {campaigns.map((campaign) => (
                <option key={campaign.id} value={campaign.id}>{campaign.name}</option>
              ))}
            </select>

            <label htmlFor="campaignPassword">Senha da campanha</label>
            <input
              autoComplete="off"
              id="campaignPassword"
              onChange={(event) => setCampaignPassword(event.target.value)}
              required
              type="password"
              value={campaignPassword}
            />

            {error && <p className="login-error" role="alert">{error}</p>}
            <button
              className="primary-button"
              disabled={isSubmitting || !campaigns.length}
              type="submit"
            >
              {isSubmitting ? "Entrando..." : "Entrar na campanha"}
            </button>
            <button
              className="secondary-button"
              disabled={isSubmitting}
              onClick={() => {
                setStep("credentials");
                setError("");
              }}
              type="button"
            >
              Voltar
            </button>
          </form>
        )}
      </section>
    </main>
  );
}

export default LoginPage;
