import { useQuery } from "@tanstack/react-query";
import styled from "styled-components";
import { getHospitalList } from "../api/hospital";
import theme from "../theme";
import type { HospitalSummary } from "../types/hospital";
import { MOBILE_MEDIA } from "../lib/constants";
import { LocationOn } from "@mui/icons-material";

const PageContainer = styled.div`
  max-width: 1100px;
  margin: 0 auto;
  padding: 60px 24px 100px;

  @media ${MOBILE_MEDIA} {
    padding: 32px 16px 60px;
  }
`;

const PageTitle = styled.h1`
  font-size: 2.5rem;
  font-weight: 700;
  color: ${theme.textPrimary};
  margin-bottom: 8px;

  &::after {
    content: "";
    display: inline-block;
    width: 10px;
    height: 10px;
    background-color: ${theme.primary};
    border-radius: 50%;
    margin-left: 4px;
    vertical-align: super;
    font-size: 0.5em;
  }

  @media ${MOBILE_MEDIA} {
    font-size: 2rem;
  }
`;

const TotalBadge = styled.span`
  font-size: 1.1rem;
  color: ${theme.textSecondary};
  margin-bottom: 40px;
  display: block;

  strong {
    color: ${theme.primary};
    font-weight: 700;
  }
`;

const HospitalGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
  margin-bottom: 60px;

  @media (max-width: 900px) {
    grid-template-columns: repeat(2, 1fr);
  }

  @media ${MOBILE_MEDIA} {
    grid-template-columns: 1fr;
    gap: 12px;
  }
`;

const HospitalCard = styled.div`
  background: white;
  border-radius: 16px;
  padding: 20px;
  border: 1px solid #eee;
  transition: box-shadow 0.2s;

  &:hover {
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.06);
  }
`;

const HospitalName = styled.h3`
  font-size: 15px;
  font-weight: 600;
  color: ${theme.textPrimary};
  margin-bottom: 8px;
  line-height: 1.3;
`;

const HospitalLocation = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 13px;
  color: ${theme.textSecondary};
  margin-bottom: 12px;
`;

const PatientCount = styled.div`
  font-size: 14px;
  color: ${theme.textSecondary};

  strong {
    color: ${theme.primary};
    font-weight: 600;
  }
`;

const TextSection = styled.div`
  max-width: 800px;
  margin: 0 auto;
  line-height: 1.7;
  font-size: 14px;
  color: ${theme.textSecondary};
  padding-top: 40px;
  border-top: 1px solid #eee;

  p {
    margin-bottom: 16px;
  }

  strong {
    color: ${theme.textPrimary};
  }
`;

export default function WhoWeAre() {
  const hospitalQuery = useQuery<HospitalSummary[]>({
    queryKey: ["hospital", "public"],
    queryFn: () => getHospitalList(),
    staleTime: 5 * 60 * 1000,
    refetchInterval: 60 * 1000,
  });

  const hospitals = hospitalQuery.data ?? [];
  const totalPatients = hospitals.reduce(
    (sum, hospital) => sum + (hospital.patientCount ?? 0),
    0,
  );

  return (
    <PageContainer>
      <PageTitle>Partner Hospitals</PageTitle>
      <TotalBadge>
        Total registered patients <strong>{totalPatients.toLocaleString()}</strong>
      </TotalBadge>

      {hospitalQuery.isLoading && <p>Loading hospital data...</p>}
      {hospitalQuery.isError && <p>Unable to load hospital information right now.</p>}

      {hospitalQuery.isSuccess && hospitals.length === 0 && (
        <p>No hospitals have been registered yet.</p>
      )}

      {hospitalQuery.isSuccess && hospitals.length > 0 && (
        <HospitalGrid>
          {hospitals.map((hospital) => (
            <HospitalCard key={hospital.id}>
              <HospitalName>{hospital.name}</HospitalName>
              <HospitalLocation>
                <LocationOn style={{ fontSize: "16px" }} />
                {hospital.country?.name ?? "Unknown country"}
                {hospital.country?.code ? `, ${hospital.country.code}` : ""}
              </HospitalLocation>
              <PatientCount>
                Patients <strong>{hospital.patientCount.toLocaleString()}</strong>
              </PatientCount>
            </HospitalCard>
          ))}
        </HospitalGrid>
      )}

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
          <strong>References</strong>
          <br />
          1. Tideman JWL, Polling JR, Vingerling JR, et al. Axial length
          growth and the risk of developing myopia in European children. Acta
          Ophthalmol. 2018;96(3):301-309.
          <br />
          2. He X, Sankaridurg P, Naduvilath T, et al. Normative data and
          percentile curves for axial length and axial length/corneal
          curvature in Chinese children and adolescents aged 4-18 years. Br J
          Ophthalmol. 2023;107(2):167-175.
        </p>
      </TextSection>
    </PageContainer>
  );
}
