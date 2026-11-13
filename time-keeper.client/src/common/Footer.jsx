import { version } from '../../package.json';

import './styling/Footer.css';

function Footer() {
    return (
        <footer>
            <p>Time Keeper v{version} · By Callum Morgan</p>
        </footer>
    );
}

export default Footer;