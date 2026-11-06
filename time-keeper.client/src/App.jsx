import { StrictMode } from 'react'
import { BrowserRouter as Router, Routes, Route } from "react-router-dom"


// Import all required code, common and pages
import ProtectedRoute from './code/ProtectedRoute.jsx';
import UseToken from './code/UseToken.jsx';
import Footer from './common/Footer.jsx'
import Header from './common/Header.jsx'
import Login from './pages/Login.jsx'
import Weather from './pages/Weather.jsx'

function App() {


    // Obtains the value of token, setToken & removeToken from the custom hook UseToken()
    // token: the current token value if there is one
    // setToken: a function that can be called from login by passing it throug as a constant
    // removeToken: a function that can be called from the header by passing it throug as a constant
    const { token, setToken, removeToken } = UseToken();


    // if there is no token show the login content only
    if (!token) {
        return (<StrictMode>
                  <Header removeToken={removeToken} />
                  <Login setToken={setToken} />
                  <Footer />
                </StrictMode>
        );
    }

    // if there is a token show the apropriate page after authenticating via protected route
    // protected route checks for a token if there is not one forces back to login
    return (
        <StrictMode>
            <Header removeToken={removeToken} />
            <Router>
                <Routes>
                  <Route exact path="/" element={<ProtectedRoute token={token}>
                                                   <Weather token={token} />
                                                 </ProtectedRoute>
                                                 } />
                    <Route exact path="/Login" element={<Login setToken={setToken} />} />
                    <Route exact path="/weather" element={<ProtectedRoute token={token}>
                                                            <Weather token={token}/>
                                                          </ProtectedRoute>
                                                         } />
                </Routes>
            </Router>
            <Footer />
        </StrictMode>
    );
}

export default App;