import { createContext, useState } from "react";
import { BrowserRouter, Routes, Route } from "react-router";
import Home from "./routes/home";
import HeaderRoute from "./routes/header";
import Login from "./routes/login";
import Signup from "./routes/signup";
import ProfileChoice from "./routes/choose_profile";
import ProfessionalProfile from "./routes/axial_length_growth/healthcare_professional";
import { useQuery } from "@tanstack/react-query";
import { getCurrentUser } from "./api/auth";
import ChartRoute from "./routes/chart";
import RegularProfile from "./routes/axial_length_growth/regular_user";
import Profile from "./routes/profile";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { GOOGLE_CLIENT_ID } from "./lib/google_client_id";
import Admin from "./routes/admin";

export const UserContext = createContext<{
  user: any | null;
  role: UserRole;
  setRole: (value: UserRole) => void;
}>(null as any);

type UserRole = "regular_user" | "healthcare_professional";

const App = () => {
  const userQuery = useQuery({
    queryKey: ["currentUser"],
    queryFn: getCurrentUser,
  });
  const [userRole, setUserRole] = useState<UserRole>(
    (localStorage.getItem("role") ?? "regular_user") as UserRole
  );

  return (
    <BrowserRouter>
      <UserContext.Provider
        value={{
          user: userQuery.data,
          role: userRole,
          setRole: (value: UserRole) => {
            localStorage.setItem("role", value);
            setUserRole(value);
          },
        }}
      >
        <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
          <Routes>
            <Route element={<HeaderRoute></HeaderRoute>}>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/choose_profile" element={<ProfileChoice />} />
              <Route path="/axial_length_growth">
                <Route
                  path="healthcare_professional"
                  element={<ProfessionalProfile />}
                />
                <Route path="regular_user" element={<RegularProfile />} />
              </Route>
              <Route path="/chart/:patientId" element={<ChartRoute />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/admin" element={<Admin />} />
            </Route>
          </Routes>
        </GoogleOAuthProvider>
      </UserContext.Provider>
    </BrowserRouter>
  );
};

export default App;
