import { version } from '../../package.json';

import './styling/Footer.css';

function Footer() {
    return (
        <footer>
            <p>Version {version}</p>
            <p>By Callum Morgan</p>
        </footer>
    );
}

export default Footer;