import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom"


// Import all required code, common and pages
import ProtectedRoute from './code/ProtectedRoute.jsx';
import UseToken from './code/UseToken.jsx';
import Footer from './common/Footer.jsx'
import Header from './common/Header.jsx'
import Login from './pages/Login.jsx'
import Weather from './pages/Weather.jsx'
import Timesheet from './pages/Timesheet.jsx'

function App() {


    // Obtains the value of token, setToken & removeToken from the custom hook UseToken()
    // token: the current token value if there is one
    // setToken: a function that can be called from login by passing it throug as a constant
    // removeToken: a function that can be called from the header by passing it throug as a constant
    const { token, setToken, removeToken } = UseToken();


    // if there is a token show the apropriate page after authenticating via protected route
    // protected route checks for a token if there is not one forces back to login
    return (
        <>
            <Header token={token} removeToken={removeToken} />
            <Router>
                <Routes>
                    <Route path="/Login" element={token ? <Navigate to="/" replace /> : <Login setToken={setToken} />} />
                    <Route path="/" element={<ProtectedRoute token={token}>
                                                 <Timesheet token={token} />
                                             </ProtectedRoute>
                                            } />
                    <Route path="/weather" element={<ProtectedRoute token={token}>
                                                        <Weather token={token}/>
                                                    </ProtectedRoute>
                                                   } />
                    <Route path="/timesheet" element={<ProtectedRoute token={token}>
                                                          <Timesheet token={token} />
                                                      </ProtectedRoute>
                                                   } />
                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            </Router>
            <Footer />
        </>
    );
}

export default App;