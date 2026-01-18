import { useQuery } from "@tanstack/react-query";
import styled from "styled-components";
import { getHospitalList } from "../api/hospital";
import { TopDiv } from "../components/div";
import theme from "../theme";

type HospitalSummary = {
  id: string;
  name: string;
  code: string;
  country?: {
    id?: string;
    name: string;
    code: string;
  };
  patientCount: number;
};

const ContentWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 48px;
  width: 100%;
  padding: 10% 0;
`;

const TextSection = styled.div`
  width: 100%;
  max-width: 960px;
  line-height: 1.6;
`;

const StatsSection = styled.div`
  width: 100%;
  max-width: 720px;
  background-color: white;
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin: 0 auto;
`;

const HospitalList = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const HospitalItem = styled.li`
  display: flex;
  flex-direction: column;
  gap: 4px;
  border-left: 4px solid ${theme.primary};
  padding-left: 12px;
`;

const HospitalName = styled.span`
  font-weight: 600;
`;

const HospitalMeta = styled.span`
  font-size: 0.85rem;
  color: #666;
`;

const TotalPatientsBadge = styled.div`
  margin-top: 8px;
  padding: 16px;
  border-radius: 12px;
  background-color: ${theme.primary50};
  color: ${theme.primary};
  font-size: 1.25rem;
  font-weight: 600;
  text-align: center;
`;

export default function WhoWeAre() {
  const hospitalQuery = useQuery<HospitalSummary[]>({
    queryKey: ["hospital", "public"],
    queryFn: () => getHospitalList() as Promise<HospitalSummary[]>,
    staleTime: 5 * 60 * 1000,
    refetchInterval: 60 * 1000,
  });

  const hospitals = hospitalQuery.data ?? [];
  const totalPatients = hospitals.reduce(
    (sum, hospital) => sum + (hospital.patientCount ?? 0),
    0
  );

  return (
    <TopDiv>
      <ContentWrapper>
        <StatsSection>
          <h2>Partner hospitals</h2>
          {hospitalQuery.isLoading && <p>Loading hospital data…</p>}
          {hospitalQuery.isError && (
            <p>Unable to load hospital information right now.</p>
          )}
          {hospitalQuery.isSuccess && hospitals.length === 0 && (
            <p>No hospitals have been registered yet.</p>
          )}
          {hospitalQuery.isSuccess && hospitals.length > 0 && (
            <>
              <HospitalList>
                {hospitals.map((hospital) => (
                  <HospitalItem key={hospital.id}>
                    <HospitalName>{hospital.name}</HospitalName>
                    <HospitalMeta>
                      {hospital.country?.name ?? "Unknown country"}
                      {hospital.country?.code
                        ? ` · ${hospital.country.code}`
                        : ""}
                    </HospitalMeta>
                    <HospitalMeta>
                      Patients: {hospital.patientCount.toLocaleString()}
                    </HospitalMeta>
                  </HospitalItem>
                ))}
              </HospitalList>
              <TotalPatientsBadge>
                Total registered patients: {totalPatients.toLocaleString()}
              </TotalPatientsBadge>
            </>
          )}
        </StatsSection>
        <TextSection>
          <p>
            You can monitor the measured axial length and compare it with
            normative growth curves by referencing datasets collected by Erasmus
            University (Rotterdam, NL), including The Generation R Study, the
            Avon Longitudinal Study of Parents and Children, and The Rotterdam
            Study III [1], as well as datasets from children in Shanghai, China
            [2]. These graphs help parents better understand the risk of myopia
            their children may face.
          </p>
          <p>
            The reference data for Caucasian is used under the terms of the
            Creative Commons Attribution License, which permits use,
            distribution and reproduction in any medium, provided the original
            work is properly cited. The reference data for East Asian is used
            under the Creative Commons Attribution Non Commercial (CC BY-NC 4.0)
            license, which permits others to distribute, remix, adapt, build
            upon this work non-commercially, and license their derivative works
            on different terms, provided the original work is properly cited,
            appropriate credit is given, any changes made indicated, and the use
            is non-commercial.
          </p>
          <p>
            <strong>Reference</strong>
            <br />
            1. Tideman JWL, Polling JR, Vingerling JR, et al. Axial length growth
            and the risk of developing myopia in European children. Acta
            Ophthalmol. 2018;96(3):301-309.
            <br />
            2. He X, Sankaridurg P, Naduvilath T, et al. Normative data and
            percentile curves for axial length and axial length/corneal
            curvature in Chinese children and adolescents aged 4-18 years. Br J
            Ophthalmol. 2023;107(2):167-175.
          </p>
        </TextSection>
      </ContentWrapper>
    </TopDiv>
  );
}
