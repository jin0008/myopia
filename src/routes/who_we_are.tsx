import { useQuery } from "@tanstack/react-query";
import styled from "styled-components";
import { getHospitalList } from "../api/hospital";
import theme from "../theme";
import type { HospitalSummary } from "../types/hospital";
import { MOBILE_MEDIA } from "../lib/constants";
import { LocationOn } from "@mui/icons-material";
import { useLanguage } from "../lib/language_context";

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
  const { language } = useLanguage();
  const ko = language === "ko";
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
      <PageTitle>{ko ? "참여병원" : "Partner Hospitals"}</PageTitle>
      <TotalBadge>
        {ko ? "총 등록환자수" : "Total registered patients"}{" "}
        <strong>{totalPatients.toLocaleString()}</strong>
      </TotalBadge>

      {hospitalQuery.isLoading && (
        <p>{ko ? "병원 데이터를 불러오는 중..." : "Loading hospital data..."}</p>
      )}
      {hospitalQuery.isError && (
        <p>
          {ko
            ? "지금은 병원 정보를 불러올 수 없습니다."
            : "Unable to load hospital information right now."}
        </p>
      )}

      {hospitalQuery.isSuccess && hospitals.length === 0 && (
        <p>{ko ? "아직 등록된 병원이 없습니다." : "No hospitals have been registered yet."}</p>
      )}

      {hospitalQuery.isSuccess && hospitals.length > 0 && (
        <HospitalGrid>
          {hospitals.map((hospital) => (
            <HospitalCard key={hospital.id}>
              <HospitalName>{hospital.name}</HospitalName>
              <HospitalLocation>
                <LocationOn style={{ fontSize: "16px" }} />
                {hospital.country?.name ?? (ko ? "국가 미상" : "Unknown country")}
                {hospital.country?.code ? `, ${hospital.country.code}` : ""}
              </HospitalLocation>
              <PatientCount>
                {ko ? "환자수" : "Patients"}{" "}
                <strong>{hospital.patientCount.toLocaleString()}</strong>
              </PatientCount>
            </HospitalCard>
          ))}
        </HospitalGrid>
      )}

      <TextSection>
        {ko ? (
          <>
            <p>
              귀하는 측정된 안축장(axial length)을 모니터링하고, 이를 에라스무스
              대학교(네덜란드 로테르담)에서 수집한 데이터셋(The Generation R Study,
              부모 및 자녀 종단적 연구[Avon Longitudinal Study of Parents and
              Children], 로테르담 연구 III[The Rotterdam Study III] 포함) [1]과 중국
              상하이 아동들의 데이터셋 [2]을 참고하여 표준 성장 곡선과 비교해 볼 수
              있습니다. 이러한 그래프는 부모가 자녀가 직면할 수 있는 근시 위험을 더
              잘 이해하는 데 도움이 됩니다.
            </p>
            <p>
              백인(Caucasian) 대상의 참조 데이터는 원저작물을 적절히 인용하는 경우
              어떤 매체에서든 사용, 배포 및 복제를 허용하는 크리에이티브 커먼즈
              저작자표시(CC BY) 라이선스 조건에 따라 사용되었습니다.
              동아시아인(East Asian) 대상의 참조 데이터는 원저작물을 적절히
              인용하고, 적절한 크레딧을 부여하며, 변경 사항이 있는 경우 이를
              표시하고, 비영리 목적으로 사용하는 경우에 한해 타인이 이 저작물을
              배포, 리믹스, 적응 및 비영리적으로 기반 확장을 할 수 있도록 허용하는
              크리에이티브 커먼즈 저작자표시-비영리(CC BY-NC 4.0) 라이선스에 따라
              사용되었습니다.
            </p>
          </>
        ) : (
          <>
            <p>
              You can monitor the measured axial length and compare it with
              normative growth curves by referencing datasets collected by
              Erasmus University (Rotterdam, NL), including The Generation R
              Study, the Avon Longitudinal Study of Parents and Children, and
              The Rotterdam Study III [1], as well as datasets from children in
              Shanghai, China [2]. These graphs help parents better understand
              the risk of myopia their children may face.
            </p>
            <p>
              The reference data for Caucasian is used under the terms of the
              Creative Commons Attribution License, which permits use,
              distribution and reproduction in any medium, provided the
              original work is properly cited. The reference data for East Asian
              is used under the Creative Commons Attribution Non Commercial (CC
              BY-NC 4.0) license, which permits others to distribute, remix,
              adapt, build upon this work non-commercially, and license their
              derivative works on different terms, provided the original work is
              properly cited, appropriate credit is given, any changes made
              indicated, and the use is non-commercial.
            </p>
          </>
        )}
        <p>
          <strong>{ko ? "참고문헌" : "References"}</strong>
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
