import './styling/Header.css'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faClock } from '@fortawesome/free-regular-svg-icons';
import { jwtDecode } from 'jwt-decode';

function Header({ token, removeToken }) {

    return (
        <header>
            <div>
                <div className="header_icon">
                    <FontAwesomeIcon icon={faClock} />
                </div>
                <h2>
                    Time Keeper
                </h2>
            </div>
            <div>
                {token && <p>{jwtDecode(token.accessToken).name}</p>}
                {token && <button className="button_backRed" onClick={removeToken}>Logout</button>}
            </div>
        </header>
    );
}

export default Header;