import { TopDiv } from "../components/div";
import styled from "styled-components";
import { useLanguage } from "../lib/language_context";

const GuideContainer = styled.div`
  width: 90%;
  max-width: 900px;
  padding: 40px 20px;
  margin: 0 auto;
`;

const Header = styled.div`
  margin-bottom: 40px;
`;

const Title = styled.h1`
  font-size: 36px;
  font-weight: 700;
  color: #333;
  margin-bottom: 12px;
`;

const Subtitle = styled.p`
  font-size: 16px;
  color: #666;
  margin-bottom: 24px;
`;

const LanguageToggle = styled.div`
  display: flex;
  gap: 12px;
  margin-bottom: 32px;
`;

const LanguageButton = styled.button<{ $active: boolean }>`
  padding: 8px 20px;
  border: 2px solid ${props => props.$active ? '#5c7c4f' : '#ddd'};
  background: ${props => props.$active ? '#5c7c4f' : 'white'};
  color: ${props => props.$active ? 'white' : '#666'};
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    border-color: #5c7c4f;
    ${props => !props.$active && 'background: #f5f5f5;'}
  }
`;

const TOC = styled.div`
  background: #f8f9fa;
  padding: 24px;
  border-radius: 12px;
  margin-bottom: 40px;
`;

const TOCTitle = styled.h3`
  font-size: 18px;
  font-weight: 700;
  margin-bottom: 16px;
  color: #333;
`;

const TOCList = styled.ol`
  margin-left: 20px;
  line-height: 2;
  color: #555;
`;

const Section = styled.section`
  margin-bottom: 48px;
`;

const SectionTitle = styled.h2`
  font-size: 28px;
  font-weight: 700;
  color: #444;
  margin-bottom: 24px;
  padding-bottom: 12px;
  border-bottom: 3px solid #5c7c4f;
`;

const Step = styled.div`
  margin-bottom: 32px;
`;

const StepTitle = styled.h3`
  font-size: 20px;
  font-weight: 600;
  color: #555;
  margin-bottom: 16px;
`;

const StepContent = styled.div`
  line-height: 1.8;
  color: #666;
  margin-bottom: 16px;
`;

const BulletList = styled.ul`
  margin-left: 24px;
  line-height: 1.8;
  color: #666;

  li {
    margin-bottom: 8px;
  }

  strong {
    color: #444;
  }
`;

const StepImage = styled.img`
  max-width: 100%;
  height: auto;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  margin-top: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
`;

export default function UserGuide() {
    const { language, setLanguage } = useLanguage();
    const isKorean = language === "ko";

    return (
        <TopDiv>
            <GuideContainer>
                <Header>
                    <Title>{isKorean ? "Myopiamanage 사용방법" : "Myopiamanage User Guide"}</Title>
                    <Subtitle>
                        {isKorean
                            ? "Ver 1.2 (updated in Jan 18th 2026)"
                            : "Ver 1.2 (updated in Jan 18th 2026)"}
                    </Subtitle>

                    <LanguageToggle>
                        <LanguageButton $active={isKorean} onClick={() => setLanguage("ko")}>
                            한국어 (Korean)
                        </LanguageButton>
                        <LanguageButton $active={!isKorean} onClick={() => setLanguage("en")}>
                            English
                        </LanguageButton>
                    </LanguageToggle>
                </Header>

                <TOC>
                    <TOCTitle>{isKorean ? "목차" : "Table of Contents"}</TOCTitle>
                    <TOCList>
                        <li>{isKorean ? "가입방법" : "Registration"}</li>
                        <li>{isKorean ? "사용방법" : "Usage Instructions"}</li>
                    </TOCList>
                </TOC>

                {/* Section 1: Registration */}
                <Section>
                    <SectionTitle>1. {isKorean ? "가입방법" : "Registration"}</SectionTitle>

                    <Step>
                        <StepTitle>
                            {isKorean
                                ? "1) myopiamanage.org에 접속하면 아래와 같은 페이지가 열립니다."
                                : "1) When you access myopiamanage.org, the following page will open."}
                        </StepTitle>
                        <StepImage src="/images/manual/step1_main.png" alt="Main page" />
                    </Step>

                    <Step>
                        <StepTitle>
                            {isKorean
                                ? "2) 우상단의 login을 클릭합니다."
                                : "2) Click the 'Login' button in the upper right corner."}
                        </StepTitle>
                        <StepImage src="/images/manual/step2_login.png" alt="Login button" />
                    </Step>

                    <Step>
                        <StepTitle>
                            {isKorean
                                ? "3) Sign up을 클릭합니다. 구글 계정으로 가입하거나, username을 이용하여 가입합니다."
                                : "3) Click 'Sign up'. You can register using your Google account or create an account with a username."}
                        </StepTitle>
                        <StepImage src="/images/manual/step3_signup_form.png" alt="Sign up form" />
                    </Step>

                    <Step>
                        <StepTitle>
                            {isKorean
                                ? "4) 1차 등록이 되었으므로 username과 password를 입력하여 접속하면 아래와 같은 창이 뜨고 Choose user type 에서 우측의 Healthcare professional 을 선택합니다."
                                : "4) After initial registration, enter your username and password to log in. The following window will appear, and you should select 'Healthcare professional' on the right side in 'Choose user type'."}
                        </StepTitle>
                        <StepImage src="/images/manual/step4_user_type.png" alt="User type selection" />
                    </Step>

                    <Step>
                        <StepTitle>
                            {isKorean
                                ? "5) 다음으로 상단 메뉴바에서 Growth Chart를 클릭하고 중앙의 Register를 클릭하여 등록절차로 넘어갑니다."
                                : "5) Next, click 'Growth Chart' in the top menu bar, then click 'Register' in the center to proceed with the registration process."}
                        </StepTitle>
                        <StepImage src="/images/manual/step5_register.png" alt="Registration page" />
                    </Step>

                    <Step>
                        <StepTitle>
                            {isKorean
                                ? "6) 아래의 입력창을 순서대로 입력합니다."
                                : "6) Fill in the following input fields in order."}
                        </StepTitle>
                        <StepContent>
                            <BulletList>
                                <li>
                                    <strong>{isKorean ? "Name" : "Name"}:</strong>{" "}
                                    {isKorean
                                        ? "이름입력 (예명, 별명 등의 사용자가 식별할 수 있는 이름을 입력하셔도 좋습니다.)"
                                        : "Enter your name (you may use a nickname or alias that can identify you)."}
                                </li>
                                <li>
                                    <strong>{isKorean ? "Country" : "Country"}:</strong>{" "}
                                    {isKorean
                                        ? "사용할 국가 입력 (예, Korea, Republic of, Japan, China, …)"
                                        : "Enter the country to use (e.g., Korea, Republic of, Japan, China, etc.)."}
                                </li>
                                <li>
                                    <strong>{isKorean ? "Join existing hospital" : "Join existing hospital"}:</strong>{" "}
                                    {isKorean
                                        ? "한 기관에서 데이터를 공유할 경우 아래의 Hospital code를 입력하여 환자를 공유할 수 있습니다. 이 경우는 처음 등록한 사용자가 인증을 해주어야 합니다. 기관을 처음 등록한 사용자가 사용자의 profile에 들어가면 Approval 할 수 있습니다. 관리자 변경도 가능합니다."
                                        : "If sharing data within an organization, you can share patients by entering the Hospital code below. In this case, the initial registrant must approve. The first user who registered the institution can approve by going to the user's profile. Administrator changes are also possible."}
                                </li>
                            </BulletList>
                        </StepContent>
                        <StepImage src="/images/manual/step6_hospital_setting.png" alt="Hospital settings" />
                        <StepImage src="/images/manual/step7_hospital_admin.png" alt="Hospital admin" />

                        <StepContent style={{ marginTop: '16px' }}>
                            <BulletList>
                                <li>
                                    <strong>{isKorean ? "Register new hospital" : "Register new hospital"}:</strong>{" "}
                                    {isKorean
                                        ? "처음으로 기관을 등록하는 경우 hospital code를 임의로 입력하면 됩니다. (다른 사용자와 환자 데이터의 공유할 경우 필요하므로 기억해두시면 좋지만 hospital code를 몰라도 다른 사용자가 healthcare professional로 등록할 때 기존에 등록된 hospital 목록에서 선택을 할 수 있습니다.)"
                                        : "If you are registering an institution for the first time, you can enter any hospital code. (It's good to remember it as it's needed when sharing patient data with other users, but even if you don't know the hospital code, other users can select from the list of already registered hospitals when registering as a healthcare professional.)"}
                                </li>
                                <li>
                                    <strong>{isKorean ? "Role" : "Role"}:</strong>{" "}
                                    {isKorean
                                        ? "사용자에 맞게 설정합니다. (예, Medical Doctor, Nurse or Nurse Practitioner, …)"
                                        : "Set according to the user. (e.g., Medical Doctor, Nurse or Nurse Practitioner, etc.)"}
                                </li>
                                <li>
                                    <strong>{isKorean ? "Ethnicity" : "Ethnicity"}:</strong>{" "}
                                    {isKorean
                                        ? "환자의 인종을 입력합니다. (예, East Asian, Admixed American, non-Finnish European, …)"
                                        : "Enter the patient's ethnicity. (e.g., East Asian, Admixed American, non-Finnish European, etc.)"}
                                </li>
                                <li>
                                    <strong>{isKorean ? "Default instrument (optional)" : "Default instrument (optional)"}:</strong>{" "}
                                    {isKorean
                                        ? "병원에서 사용중인 기기를 입력합니다. 기기의 종류가 여러가지인 경우에는 환자 데이터 입력시에 변경할 수 있습니다. (예, IOL-Master 700, MYAH 등 …)"
                                        : "Enter the instrument being used at the hospital. If there are multiple types of instruments, you can change them when entering patient data. (e.g., IOL-Master 700, MYAH, etc.)"}
                                </li>
                            </BulletList>
                        </StepContent>
                        <StepImage src="/images/manual/step8_register_hospital.png" alt="Hospital registration form" />
                    </Step>
                </Section>

                {/* Section 2: Usage Instructions */}
                <Section>
                    <SectionTitle>2. {isKorean ? "사용방법" : "Usage Instructions"}</SectionTitle>

                    <Step>
                        <StepTitle>
                            {isKorean
                                ? "1) 로그인 하여 위 상단의 growth Chart를 클릭합니다. 환자 데이터 입력을 위해 new patient를 클릭합니다."
                                : "1) Log in and click 'Growth Chart' at the top. Click 'New patient' to enter patient data."}
                        </StepTitle>
                        <StepImage src="/images/manual/step9_patient_add_1.png" alt="Add new patient" />
                    </Step>

                    <Step>
                        <StepTitle>
                            {isKorean
                                ? "2) 환자의 데이터를 입력합니다."
                                : "2) Enter the patient's data."}
                        </StepTitle>
                        <StepImage src="/images/manual/step9_patient_add_2.png" alt="Patient data form" />
                    </Step>

                    <Step>
                        <StepTitle>
                            {isKorean
                                ? "3) 환자 등록번호가 적힌 카드를 클릭합니다. (예 test1)"
                                : "3) Click the card with the patient registration number. (e.g., test1)"}
                        </StepTitle>
                        <StepImage src="/images/manual/step10_patient_navigate.png" alt="Patient card navigation" />
                    </Step>

                    <Step>
                        <StepTitle>
                            {isKorean
                                ? "4) 기본 디스플레이가 나오며 안축장을 입력할 수 있습니다. 안축장의 입력은 초록색 + 박스를 클릭하면 됩니다. 입력은 안축장길이가 측정된 날짜, 측정기기, 오른눈 왼눈 안축장을 입력하고 confirm을 누릅니다."
                                : "4) The basic display will appear, and you can enter axial length measurements. To enter axial length, click the green + box. Enter the date when the axial length was measured, the measuring instrument, right eye and left eye axial length, then click confirm."}
                        </StepTitle>
                        <StepImage src="/images/manual/step11_measure_add_1.png" alt="Measurement entry 1" />
                        <StepImage src="/images/manual/step11_measure_add_2.png" alt="Measurement entry 2" />
                        <StepContent style={{ marginTop: '16px' }}>
                            {isKorean
                                ? "추가로 입력하려면 + 버튼을 클릭하여 추가할 수 있습니다. 수정이 필요한 경우 현재는 데이터를 삭제하고 다시 입력해야 합니다."
                                : "To add more entries, click the + button. If modifications are needed, currently you must delete the data and re-enter it."}
                        </StepContent>
                    </Step>

                    <Step>
                        <StepTitle>
                            {isKorean
                                ? "5) 치료한 내용을 입력하려면 녹색 Register를 클릭하여 입력합니다."
                                : "5) To enter treatment information, click the green 'Register' button."}
                        </StepTitle>
                        <StepImage src="/images/manual/step12_treatment_add.png" alt="Treatment entry" />
                    </Step>

                    <Step>
                        <StepTitle>
                            {isKorean
                                ? "6) Default 입력창에서는 안축장 길이가 최근 다섯개만 보이며 모든 데이터를 보고자 하면 우 상단의 list view를 클릭하면 전체데이터를 볼 수 있습니다."
                                : "6) The default input screen shows only the most recent five axial length measurements. To view all data, click 'list view' in the upper right corner."}
                        </StepTitle>
                        <StepImage src="/images/manual/step13_view.png" alt="List view" />
                    </Step>
                </Section>
            </GuideContainer>
        </TopDiv>
    );
}
