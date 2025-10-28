import { createContext, lazy, useState, Suspense } from "react";
import { BrowserRouter, Routes, Route } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { GoogleOAuthProvider } from "@react-oauth/google";
import VisitorStats from "./components/VisitorStats";

import { getCurrentUser } from "./api/auth";
import { GOOGLE_CLIENT_ID } from "./lib/google_client_id";

const Home = lazy(() => import("./routes/home"));
const HeaderRoute = lazy(() => import("./routes/header"));
const Login = lazy(() => import("./routes/login"));
const Signup = lazy(() => import("./routes/signup"));
const ProfileChoice = lazy(() => import("./routes/choose_profile"));
const ProfessionalProfile = lazy(
  () => import("./routes/axial_length_growth/healthcare_professional")
);
const ChartRoute = lazy(() => import("./routes/chart"));
const RegularProfile = lazy(
  () => import("./routes/axial_length_growth/regular_user")
);
const Profile = lazy(() => import("./routes/profile"));
const Admin = lazy(() => import("./routes/admin"));
const WhoWeAre = lazy(() => import("./routes/who_we_are"));

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
              <Route path="/who_we_are" element={<WhoWeAre />} />
            </Route>
          </Routes>
        </GoogleOAuthProvider>
      </UserContext.Provider>
    </BrowserRouter>
  );
};

export default App;
