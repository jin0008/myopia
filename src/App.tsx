import { createContext, useEffect, useState } from "react";
import { BrowserRouter, Routes, Route } from "react-router";
import Home from "./routes/home";
import HeaderRoute from "./routes/header";
import Login from "./routes/login";
import Signup from "./routes/signup";
import { getUser } from "./api/auth";
import ProfileChoice from "./routes/choose_profile";

export const UserContext = createContext<any>(null);

const App = () => {
  const [user, setUser] = useState(null);
  useEffect(() => {
    getUser()
      .then(setUser)
      .catch(() => setUser(null));
  }, []);

  return (
    <BrowserRouter>
      <UserContext.Provider value={{ user: user, setUser: setUser }}>
        <Routes>
          <Route element={<HeaderRoute></HeaderRoute>}>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/profile_choice" element={<ProfileChoice />} />
            <Route path="/profile">
              <Route path="healthcare_professional" element={<Home />} />
              <Route path="regular_user" element={<Home />} />
            </Route>
          </Route>
        </Routes>
      </UserContext.Provider>
    </BrowserRouter>
  );
};

export default App;
