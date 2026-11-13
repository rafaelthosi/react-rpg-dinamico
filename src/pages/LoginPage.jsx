import { useState } from "react";
import { useNavigate } from "react-router-dom";
import ProfileSelector from "../components/ProfileSelector.jsx";

function LoginPage({ onLogin }) {
  const navigate = useNavigate();
  const [perfil, setPerfil] = useState("");

  function handleSubmit(event) {
    event.preventDefault();
    onLogin();
    navigate("/home");
  }

  return (
    <main className="login-content">
      <section className="surface-card login-card">
        <p className="eyebrow">Bem-vindo de volta</p>
        <h1 className="page-title">Entrar</h1>
        <p className="description">
          Preencha seus dados para continuar para a página inicial.
        </p>

        <form className="login-form" onSubmit={handleSubmit}>
          <label htmlFor="username">Nome de usuário</label>
          <input
            autoComplete="username"
            id="username"
            name="username"
            maxLength={15}
            placeholder="Até 15 caracteres"
            required
            type="text"
          />

          <label htmlFor="password">Senha</label>
          <input
            autoComplete="current-password"
            id="password"
            minLength={8}
            name="password"
            placeholder="Pelo menos 8 caracteres"
            required
            type="password"
          />

          <ProfileSelector value={perfil} onChange={setPerfil} required />

          <button className="primary-button" type="submit">
            Entrar
          </button>
        </form>

        <p className="login-note">
          Este formulário verifica apenas os campos no navegador. A
          autenticação real ainda precisa ser conectada a um backend.
        </p>
      </section>
    </main>
  );
}

export default LoginPage;
