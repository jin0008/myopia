import { createContext } from "react";
import { BrowserRouter, Routes, Route } from "react-router";
import Home from "./routes/home";
import HeaderRoute from "./routes/header";
import Login from "./routes/login";
import Signup from "./routes/signup";
import ProfileChoice from "./routes/choose_profile";
import ProfessionalProfile from "./routes/profile/healthcare_professional";
import { useQuery } from "@tanstack/react-query";
import { getCurrentUser } from "./api/auth";
import ChartRoute from "./routes/chart";

export const UserContext = createContext<any>(null);

const App = () => {
  const userQuery = useQuery({
    queryKey: ["currentUser"],
    queryFn: getCurrentUser,
  });
  return (
    <BrowserRouter>
      <UserContext.Provider value={{ user: userQuery.data }}>
        <Routes>
          <Route element={<HeaderRoute></HeaderRoute>}>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/profile_choice" element={<ProfileChoice />} />
            <Route path="/profile">
              <Route
                path="healthcare_professional"
                element={<ProfessionalProfile />}
              />
              <Route path="regular_user" element={<Home />} />
            </Route>
            <Route path="/chart/:patientId" element={<ChartRoute />} />
          </Route>
        </Routes>
      </UserContext.Provider>
    </BrowserRouter>
  );
};

export default App;
