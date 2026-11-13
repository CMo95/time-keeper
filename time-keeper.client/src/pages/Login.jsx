import { useState } from 'react';
import PropTypes from 'prop-types';
import './styling/Login.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faClock } from '@fortawesome/free-regular-svg-icons';

function Login({ setToken }) {


    // Set defaults and setFunctions to be called to update said variables
    const [username, setUserName] = useState();
    const [password, setPassword] = useState();
    const [error, setError] = useState(null);
    const [loadingReg, setLoadingReg] = useState(false);
    const [loadingLog, setLoadingLog] = useState(false);


    // Handles the submitted form
    const handleSubmit = async e => {


        // If submitted via login buton attempt to login by calling the loginUser function below
        if (e.submitter.name == "login") {
            e.preventDefault();
            setError(null);
            setLoadingLog(true);
            try {
                const token = await loginUser({
                    username,
                    password
                });


                // Set the token recieved back from the loginUser function
                setToken(token);
            } catch (err) {
                setError(err.message || 'An error occured during login');
            } finally {
                setLoadingLog(false);
            }


        // If submitted via register buton attempt to register by calling the registerUser
        // function below
        } else if (e.submitter.name == "register") {
            e.preventDefault();
            setError(null);
            setLoadingReg(true);
            try {
                await registerUser({
                    username,
                    password
                });
            } catch (err) {
                setError(err.message || 'An error occured during registration');
            } finally {
                setLoadingReg(false);
            }
        }
    };

    return (
        <div className="loginPage_container">
            <form onSubmit={handleSubmit}>
                <div className="loginPage_icon">
                    <FontAwesomeIcon icon={faClock} />
                </div>
                <h2>
                    Welcome to Time Keeper
                </h2>
                <p>
                    Log in, or register to create an account.
                </p>
                <div>
                    <label htmlFor="uname">Username</label>
                    <input id="uname" type="text" placeholder="Enter Username" onChange={(e) => { setUserName(e.target.value); }} required disabled={loadingLog || loadingReg} />
                    <label htmlFor="pword">Password</label>
                    <input id="pword" type="password" placeholder="Enter Password" onChange={(e) => { setPassword(e.target.value); }} required disabled={loadingLog || loadingReg} />
                    {error && <div className="error-message">{error}</div>}
                    <button className="loginPage_register" type="submit" disabled={loadingReg} name="register">
                        {loadingReg ? 'Registering new user...' : 'Register'}
                    </button>
                    <button className="loginPage_login" type="submit" disabled={loadingLog} name="login">
                        {loadingLog ? 'Logging in...' : 'Login'}
                    </button>
                </div>
            </form>
        </div>
    );
}


// Contains the login API call to check username and password against the server returns the result
// data as token.
// Otherwise sets the error message accordingly.
async function loginUser(credentials) {
    const response = await fetch('/api/auth/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(credentials)
    });

    if (!response.ok) {
        if (response.status == 400) {
            throw new Error(`Login failed: ` + await readProblem(response));
        }
        else if (response.status == 401)
        {
            throw new Error("Login failed... Please try again");
        }
        else
        {
            throw new Error(`Login failed`);
        }
    }

    const data = await response.json();
    return data;
}


// Contains the register API call to check username and password against the server returns the
// result data as token.
// Otherwise sets the error message accordingly.
async function registerUser(credentials) {
    const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(credentials)
    });

    if (!response.ok) {
        if (response.status == 400) {
            throw new Error(`Registration failed: ` + await readProblem(response));
        }
        else {
            throw new Error(`Registration failed`);
        }
    }

    const data = await response.json();
    return data;
}

async function readProblem(response) {
    const text = await response.text();
    try {

        // Process JSON errors within response and return them as a string
        const problem = JSON.parse(text);
        if (problem.errors) {
            return Object.values(problem.errors).flat().join('\n');
        }
    } catch {
        // No processing needed if already a string or not JSON
    }
    return text;
}

// Checks that setToken exists within Login and is of the type "func"(function)
// Will create a warning in the log if either are not true
Login.propTypes = {
    setToken: PropTypes.func.isRequired
};

export default Login;