import './styling/Header.css'
import { BrowserRouter as Router, Route } from "react-router-dom"
import Login from '../pages/Login.jsx'
function Header({ removeToken }) {

  const handleLogout = () => {
      removeToken();
      <Router>
        <Route exact path="/Login" element={<Login />} />
      </Router>
  };

  return (
      <header>
          <h1> Time Keeper</h1>
          <button onClick={handleLogout}>Logout</button>
      </header>
  );
}

export default Header;