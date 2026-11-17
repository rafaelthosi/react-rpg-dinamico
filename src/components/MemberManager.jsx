import { useState } from "react";
import { registerPlayer } from "../services/authService.js";
import { apiRequest } from "../services/rpgApi.js";

function MemberManager({ campaignId, members, session, onRefresh }) {
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  async function handleCreate(event) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    setError("");
    setNotice("");
    setIsSaving(true);
    let createdUser;
    try {
      createdUser = await registerPlayer({
        username: form.get("username"),
        password: form.get("password"),
      });
      await apiRequest(`/campaigns/${campaignId}/members`, {
        session,
        method: "POST",
        body: { userId: createdUser.user.id, status: "ACTIVE" },
      });
      formElement.reset();
      setNotice(`Conta ${createdUser.user.username} criada e vinculada à campanha.`);
      await onRefresh();
    } catch (saveError) {
      setError(createdUser
        ? `A conta ${createdUser.user.username} foi criada, mas não foi possível vinculá-la: ${saveError.message}`
        : saveError.message);
    } finally {
      setIsSaving(false);
    }
  }

  async function updateStatus(member, status) {
    setError("");
    try {
      await apiRequest(`/campaigns/${campaignId}/members/${member.userId}`, {
        session,
        method: "PATCH",
        body: { status },
      });
      await onRefresh();
    } catch (updateError) {
      setError(updateError.message);
    }
  }

  async function removeMember(member) {
    const username = member.user?.username ?? "este jogador";
    if (!window.confirm(`Remover ${username} desta campanha?`)) {
      return;
    }
    setError("");
    try {
      await apiRequest(`/campaigns/${campaignId}/members/${member.userId}`, {
        session,
        method: "DELETE",
      });
      await onRefresh();
    } catch (removeError) {
      setError(removeError.message);
    }
  }

  return (
    <section className="manager-section">
      <div className="manager-heading">
        <div>
          <h2>Jogadores</h2>
          <p className="description">Crie uma conta de jogador e vincule-a a esta campanha.</p>
        </div>
      </div>

      <form className="surface-card form-card form-grid" onSubmit={handleCreate}>
        <h3>Criar acesso de jogador</h3>
        <div className="form-grid form-grid--two">
          <label>
            Nome de usuário
            <input autoComplete="off" maxLength={50} minLength={3} name="username" required />
          </label>
          <label>
            Senha inicial
            <input
              autoComplete="new-password"
              maxLength={200}
              minLength={12}
              name="password"
              required
              type="password"
            />
          </label>
        </div>
        <p className="description">O jogador poderá usar essas credenciais para entrar na campanha.</p>
        <button className="primary-button" disabled={isSaving} type="submit">
          {isSaving ? "Criando conta..." : "Criar conta e vincular"}
        </button>
      </form>

      {error && <p className="feedback feedback--error" role="alert">{error}</p>}
      {notice && <p className="feedback feedback--success" role="status">{notice}</p>}

      <div className="member-list">
        {members.map((member) => (
          <article className="surface-card member-row" key={member.id}>
            <div>
              <strong>{member.user?.username ?? member.userId}</strong>
              <span className="muted-text">{member.user?.role ?? "PLAYER"}</span>
            </div>
            <label className="member-status">
              <span>Status</span>
              <select
                onChange={(event) => updateStatus(member, event.target.value)}
                value={member.status}
              >
                <option value="PENDING">Pendente</option>
                <option value="ACTIVE">Ativo</option>
                <option value="INACTIVE">Inativo</option>
              </select>
            </label>
            <button className="danger-button" onClick={() => removeMember(member)} type="button">
              Remover
            </button>
          </article>
        ))}
        {!members.length && <p className="description">Nenhum jogador vinculado ainda.</p>}
      </div>
    </section>
  );
}

export default MemberManager;
