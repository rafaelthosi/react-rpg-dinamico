import { Link } from "react-router-dom";

function Header({ onLogout }) {
  return (
    <header className="site-header">
      <Link className="brand" to="/home">
        <span className="brand-mark">R</span>
        <span>Crônicas</span>
      </Link>
      <button className="text-button" onClick={onLogout} type="button">
        Sair
      </button>
    </header>
  );
}

export default Header;
