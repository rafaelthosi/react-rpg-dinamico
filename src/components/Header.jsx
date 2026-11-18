import { Link } from "react-router-dom";

function Header({ onLogout }) {
  return (
    <header className="site-header">
      <Link className="brand" to="/home">
        <span className="brand-mark">C</span>
        <span>ControlRPG</span>
      </Link>
      <button className="text-button" onClick={onLogout} type="button">
        Sair
      </button>
    </header>
  );
}

export default Header;
