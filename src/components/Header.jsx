import { Link } from "react-router-dom";

function Header() {
  return (
    <header className="site-header">
      <Link className="brand" to="/home">
        <span className="brand-mark">R</span>
        <span>Meu projeto</span>
      </Link>
      <span className="header-note">React + Vite</span>
    </header>
  );
}

export default Header;
