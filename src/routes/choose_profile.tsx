import styled from "styled-components";
import theme from "../theme";
import { useNavigate } from "react-router";
import { useContext } from "react";
import { MOBILE_MEDIA } from "../lib/constants";
import { UserContext } from "../App";
import { useLanguage } from "../lib/language_context";
import ArrowForward from "@mui/icons-material/ArrowForward";
import ReceiptLong from "@mui/icons-material/ReceiptLong";
import childImage from "../assets/child-placeholder.webp";
import doctorImage from "../assets/doctor-placeholder.webp";

const PageWrapper = styled.div`
  max-width: 980px;
  margin: 0 auto;
  padding: 60px 24px 80px;

  @media ${MOBILE_MEDIA} {
    padding: 32px 16px 60px;
  }
`;

const PageTitle = styled.h1`
  font-size: 2.5rem;
  font-weight: 700;
  color: ${theme.textPrimary};
  margin-bottom: 40px;

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
    margin-bottom: 24px;
  }
`;

export const ContainerDiv = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 32px;

  @media ${MOBILE_MEDIA} {
    grid-template-columns: 1fr;
    gap: 24px;
  }
`;

/** 처방전 카드가 붙으면 세 칸. 모바일은 그대로 한 칸. */
const Grid = styled(ContainerDiv)<{ $three: boolean }>`
  @media not ${MOBILE_MEDIA} {
    ${(p) => (p.$three ? "grid-template-columns: repeat(3, 1fr);" : "")}
  }
`;

const CardDiv = styled.div`
  background-color: white;
  border-radius: 20px;
  overflow: hidden;
  box-shadow: 0 2px 16px rgba(0, 0, 0, 0.06);
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  }
`;

const CardImage = styled.div`
  width: 100%;
  height: 260px;
  background: linear-gradient(135deg, #f0f7f4 0%, #e8f5e9 50%, #d4edda 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  position: relative;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  @media ${MOBILE_MEDIA} {
    height: 220px;
  }
`;

const CardContent = styled.div`
  padding: 28px;

  @media ${MOBILE_MEDIA} {
    padding: 20px;
  }
`;

const CardTitle = styled.h2`
  font-size: 1.4rem;
  font-weight: 700;
  color: ${theme.textPrimary};
  margin-bottom: 8px;
`;

const CardDescription = styled.p`
  font-size: 15px;
  color: ${theme.textSecondary};
  line-height: 1.5;
  margin-bottom: 20px;
`;

const ChooseButton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background-color: ${theme.primary};
  color: white;
  border: none;
  border-radius: 24px;
  padding: 10px 24px;
  font-size: 15px;
  font-weight: 500;
  cursor: pointer;
  transition: opacity 0.2s;

  &:hover {
    opacity: 0.9;
  }
`;

export default function ProfileChoice() {
  const navigate = useNavigate();
  const { user, setRole } = useContext(UserContext);
  // 안축장 없이 처방전만 쓰는 의료인이 많아 따로 들어가게 한다. 지금은 파일럿 대상만(RX_PILOT_EMAILS).
  const showRx = !!user?.rx_pilot;
  const { language } = useLanguage();
  const isKorean = language === "ko";
  return (
    <PageWrapper>
      <PageTitle>{isKorean ? "사용자 유형 선택" : "Choose User Type"}</PageTitle>
      <Grid $three={showRx}>
        <CardDiv
          onClick={() => {
            setRole("regular_user");
            navigate("/");
          }}
        >
          <CardImage>
            <img src={childImage} alt="Child playing" />
          </CardImage>
          <CardContent>
            <CardTitle style={{ fontStyle: "italic" }}>
              {isKorean ? "일반사용자 (Regular User)" : "Regular User"}
            </CardTitle>
            <CardDescription>
              {isKorean
                ? "사용자의 아이를 등록하고, 안축장 길이의 성장 과정과 치료의 효과를 판별할 수 있습니다."
                : "Register your children and track their axial length growth and treatment."}
            </CardDescription>
            <ChooseButton>
              {isKorean ? "선택" : "Choose"} <ArrowForward style={{ fontSize: "18px" }} />
            </ChooseButton>
          </CardContent>
        </CardDiv>
        <CardDiv
          onClick={() => {
            setRole("healthcare_professional");
            navigate("/");
          }}
        >
          <CardImage>
            <img src={doctorImage} alt="Healthcare Professional" />
          </CardImage>
          <CardContent>
            <CardTitle style={{ fontStyle: "italic" }}>
              {isKorean ? "의료인 (Healthcare Professional)" : "Healthcare Professional"}
            </CardTitle>
            <CardDescription>
              {isKorean
                ? "병원에 등록된 환자의 안축장 길이, 치료 데이터를 입력하세요. 안축장 성장과 치료의 효과를 모니터링할 수 있습니다."
                : "Manage your patients. Register their axial length growth and treatment data."}
            </CardDescription>
            <ChooseButton>
              {isKorean ? "선택" : "Choose"} <ArrowForward style={{ fontSize: "18px" }} />
            </ChooseButton>
          </CardContent>
        </CardDiv>
        {showRx && (
          <CardDiv
            onClick={() => {
              setRole("healthcare_professional");
              navigate("/prescription");
            }}
          >
            <CardImage style={{ background: "linear-gradient(135deg, #eef4fa 0%, #dde9f5 50%, #c9dcef 100%)" }}>
              <ReceiptLong style={{ fontSize: 120, color: "#1f5f8b", opacity: 0.85 }} />
            </CardImage>
            <CardContent>
              <CardTitle style={{ fontStyle: "italic" }}>
                {isKorean ? "안경처방전 (Glasses Rx)" : "Glasses Prescription"}
              </CardTitle>
              <CardDescription>
                {isKorean
                  ? "안축장 기록 없이 바로 안경처방전을 발행하고 A4·엽서·명함 크기로 인쇄합니다. 마이오닥 연동 QR 이 함께 찍힙니다."
                  : "Issue a glasses prescription and print it as A4, postcard or business card, with a Myodoc link QR."}
              </CardDescription>
              <ChooseButton>
                {isKorean ? "선택" : "Choose"} <ArrowForward style={{ fontSize: "18px" }} />
              </ChooseButton>
            </CardContent>
          </CardDiv>
        )}
      </Grid>
    </PageWrapper>
  );
}
