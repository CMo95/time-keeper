import './styling/Header.css'

function Header({ token, removeToken }) {

  return (
      <header>
          <h1> Time Keeper</h1>
          {token && <button onClick={removeToken}>Logout</button>}
      </header>
  );
}

export default Header;