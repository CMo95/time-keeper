import { useState, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';
export default function useToken() {


    // getToken: Function as a constant(anonymous function cannot be called)...
    //           Takes the token within the localStorage and extracts expiration
    //           time, accessToken & refreshToken.
    //           Checks expiration time against current time logging out if invalid
    //           .
    const getToken = () => {


        // Check token exists in local storage
        const tokenString = localStorage.getItem('noATa-timKee-token');
        if (!tokenString) {
            return null;
        }

        try {


            // Try to parse the token as JSON
            const userToken = JSON.parse(tokenString);


            // Try to decode the accessToken to get the expiration time
            const decodedExp = jwtDecode(userToken.accessToken).exp;


            // Obtain the token
            const token = userToken;


            // If for any reason the token is not populated at this point fail
            if (!token) {
                return null;
            }


            // If token is expired, remove it and return null
            if (decodedExp < (Date.now() / 1000)) {
                fetch('/api/auth/revoke', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ "refreshToken": token.refreshToken })
                });
                localStorage.removeItem('noATa-timKee-token');
                return null;
            }

            return token;
        } catch {

            // If decoding fails, token is invalid
            return null;
        }
    };

    const [token, setToken] = useState(getToken);


    // Check against server token is valid
    // useEffect runs whenever a render occurs or token is updated
    useEffect(() => {
        if (!token) return;

        fetch('/api/auth/protected', {
            method: 'GET',
            headers: {
                'Authorization': 'Bearer ' + token.accessToken
            }
        }).then(response => {
            if (!response.ok) {
                fetch('/api/auth/revoke', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ "refreshToken": token.refreshToken })
                });
                localStorage.removeItem('noATa-timKee-token');
                setToken(null);
                return;
            }
        }).catch(() => {
            fetch('/api/auth/revoke', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ "refreshToken": token.refreshToken })
            });
            localStorage.removeItem('noATa-timKee-token');
            setToken(null);
            return;
        });
    }, [token]);

    const saveToken = userToken => {
        localStorage.setItem('noATa-timKee-token', JSON.stringify(userToken)); // Save All Tokens


        // store the raw access token in state for easy checks
        // support different possible response shapes defensively
        const rawToken = userToken;
        setToken(rawToken);
    };

    const removeToken = () => {
        fetch('/api/auth/revoke', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({"refreshToken":token.refreshToken})
        });
        localStorage.removeItem('noATa-timKee-token');
        setToken(null);
    };

    // Returns the functions to saveToken(as setToken) and removeToken as well as the token itself
    return {
        setToken: saveToken,
        token,
        removeToken
    };

}