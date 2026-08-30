// myopia/src/App.tsx

import { createContext, lazy, Suspense, useState } from "react";
import { BrowserRouter, Routes, Route } from "react-router";
import { LanguageProvider } from "./lib/language_context";
import { useQuery } from "@tanstack/react-query";
import { GoogleOAuthProvider } from "@react-oauth/google";

import { getCurrentUser } from "./api/auth";
import { GOOGLE_CLIENT_ID } from "./lib/google_client_id";
import type { UserRole } from "./types/user";
import ConsentGate from "./components/consent_gate";
import ScrollToTop from "./components/scroll_to_top";

const Home = lazy(() => import("./routes/home"));
const HeaderRoute = lazy(() => import("./routes/header_footer"));
const Login = lazy(() => import("./routes/login"));
const Signup = lazy(() => import("./routes/signup"));
const ProfileChoice = lazy(() => import("./routes/choose_profile"));
const ProfessionalProfile = lazy(
  () => import("./routes/axial_length_growth/healthcare_professional"),
);
const ChartRoute = lazy(() => import("./routes/chart/index"));
const StudyVisit = lazy(() => import("./routes/study_visit/index"));
const RegularProfile = lazy(
  () => import("./routes/axial_length_growth/regular_user"),
);
const Profile = lazy(() => import("./routes/profile"));
const Admin = lazy(() => import("./routes/admin"));
const AdminMyopia = lazy(() => import("./routes/admin_myopia"));
const AdminMyodoc = lazy(() => import("./routes/admin_myodoc"));
const AdminColumns = lazy(() => import("./routes/admin_columns"));
const AdminBanners = lazy(() => import("./routes/admin_banners"));
const AdminHospitalProfiles = lazy(() => import("./routes/admin_hospital_profiles"));
const AdminHospitalReviews = lazy(() => import("./routes/admin_hospital_reviews"));
const AdminReports = lazy(() => import("./routes/admin_reports"));
const AdminPartnerAccounts = lazy(() => import("./routes/admin_partner_accounts"));
const PartnerLogin = lazy(() => import("./routes/partner/PartnerLogin"));
const PartnerSignup = lazy(() => import("./routes/partner/PartnerSignup"));
const PartnerProfile = lazy(() => import("./routes/partner/PartnerProfile"));
const WhoWeAre = lazy(() => import("./routes/who_we_are"));
const Treatments = lazy(() => import("./routes/Treatments"));
const TreatmentDetail = lazy(() => import("./routes/TreatmentDetail"));
const News = lazy(() => import("./routes/News"));
const UserGuide = lazy(() => import("./routes/user_guide"));
const PatientDeleteRequest = lazy(
  () => import("./routes/patient_delete_request"),
);

const TOS = lazy(() => import("./routes/tos"));
const MyodocPrivacy = lazy(() => import("./routes/myodoc/privacy"));

export const UserContext = createContext<{
  user: any | null;
  role: UserRole;
  setRole: (value: UserRole) => void;
}>(null as any);

const App = () => {
  const userQuery = useQuery({
    queryKey: ["currentUser"],
    queryFn: getCurrentUser,
  });
  const [userRole, setUserRole] = useState<UserRole>(
    (localStorage.getItem("role") ?? "regular_user") as UserRole,
  );

  return (
    <BrowserRouter>
      <ScrollToTop />
      <LanguageProvider>
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
            <ConsentGate />
            <Suspense fallback={<div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>Loading…</div>}>
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
                <Route
                  path="/patient_delete_request"
                  element={<PatientDeleteRequest />}
                />
                <Route path="/chart/:patientId" element={<ChartRoute />} />
                <Route
                  path="/study-visit/:enrollmentId"
                  element={<StudyVisit />}
                />
                <Route path="/profile" element={<Profile />} />
                <Route path="/admin" element={<Admin />} />
                <Route path="/admin/myopia" element={<AdminMyopia />} />
                <Route path="/admin/myodoc" element={<AdminMyodoc />} />
                <Route path="/admin/columns" element={<AdminColumns />} />
                <Route path="/admin/banners" element={<AdminBanners />} />
                <Route path="/admin/hospital-profiles" element={<AdminHospitalProfiles />} />
                <Route path="/admin/hospital-profiles/:placeId/reviews" element={<AdminHospitalReviews />} />
                <Route path="/admin/partner-accounts" element={<AdminPartnerAccounts />} />
                <Route path="/admin/reports" element={<AdminReports />} />
                <Route path="/who_we_are" element={<WhoWeAre />} />
                <Route path="/treatments" element={<Treatments />} />
                <Route path="/treatments/:id" element={<TreatmentDetail />} />
                <Route path="/news" element={<News />} />
                <Route path="/user-guide" element={<UserGuide />} />
                <Route path="/tos" element={<TOS />} />
              </Route>
              {/* Partner portal — its own login/layout, separate from the
                  doctor/admin app (no shared header). */}
              <Route path="/partner/login" element={<PartnerLogin />} />
              <Route path="/partner/signup" element={<PartnerSignup />} />
              <Route path="/partner/profile" element={<PartnerProfile />} />
              {/* 마이오닥(앱) 법적 고지. 스토어 심사 제출용 공개 URL이자 앱에서
                  띄우는 화면이라, 의료진 플랫폼 헤더 밖에 독립으로 둔다. */}
              <Route path="/myodoc/privacy" element={<MyodocPrivacy />} />
            </Routes>
            </Suspense>
          </GoogleOAuthProvider>
        </UserContext.Provider>
      </LanguageProvider>
    </BrowserRouter>
  );
};

export default App;
