import { styled } from "styled-components";
import { TopDiv } from "../components/div";
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
  border: 2px solid ${(props) => (props.$active ? "#5c7c4f" : "#ddd")};
  background: ${(props) => (props.$active ? "#5c7c4f" : "white")};
  color: ${(props) => (props.$active ? "white" : "#666")};
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    border-color: #5c7c4f;
    ${(props) => !props.$active && "background: #f5f5f5;"}
  }
`;

const OrderedList = styled.ol`
  & > li::marker {
    font-weight: 700;
  }
  & > li {
    margin-bottom: 16px;
  }
`;

const UnorderedList = styled.ul`
  & > li::marker {
    content: "• ";
    font-weight: 700;
  }
`;

const Indentation = styled.div`
  margin-left: 48px;
`;

export default function TOS() {
  const { language, setLanguage } = useLanguage();
  const isKorean = language === "ko";

  return (
    <TopDiv>
      <GuideContainer>
        <Header>
          <Title>Terms of Service for myopiamanage.org</Title>
          <Subtitle>updated in Mar 7th 2026</Subtitle>

          <LanguageToggle>
            <LanguageButton
              $active={isKorean}
              onClick={() => setLanguage("ko")}
            >
              한국어 (Korean)
            </LanguageButton>
            <LanguageButton
              $active={!isKorean}
              onClick={() => setLanguage("en")}
            >
              English
            </LanguageButton>
          </LanguageToggle>
        </Header>

        <OrderedList>
          {isKorean ? (
            <>
              <li>
                <strong>목적 및 동의 (Acceptance of Terms)</strong> 본 약관은
                myopiamanage.org(이하 &quot;사이트&quot;)가 제공하는 근시 관리
                및 데이터 모니터링 서비스의 이용 조건과 절차를 규정합니다.
                사용자가 본 사이트에 접속하거나 데이터를 입력하는 것은 본 약관
                및 개인정보 처리방침에 동의함을 의미합니다.
              </li>
              <li>
                <strong>
                  민감 정보 취급 및 사용자의 책임 (Handling of Sensitive Data)
                </strong>{" "}
                본 사이트는 근시 진행 관리를 위해 환자 등록번호 및 생년월일을
                수집하고 저장합니다.
                <Indentation>
                  <UnorderedList>
                    <li>
                      <strong>
                        데이터 익명화 권고 (Recommended De-identification):
                      </strong>{" "}
                      본 사이트는 개인정보 보호를 위해 환자의 실제 등록번호(차트
                      번호 등)를 직접 입력하는 대신, 해당 환자를 식별할 수 있는
                      별도의 연구용 번호(Research ID)를 생성하여 등록할 것을
                      강력히 권고합니다. 이는 개인정보 유출 리스크를 최소화하기
                      위한 조치입니다.
                    </li>
                    <li>
                      <strong>데이터의 정확성:</strong> 사용자는 입력하는 모든
                      데이터가 정확하며, 해당 데이터를 입력하기 위해 필요한 환자
                      또는 보호자의 법적 동의를 얻었음을 보증합니다.
                    </li>
                    <li>
                      <strong>식별 방지:</strong> 사용자는 가능한 한 직접적인
                      개인 식별이 불가능한 수준으로 데이터를 관리해야 하며,
                      허가되지 않은 제3자에게 데이터를 노출해서는 안 됩니다.
                    </li>
                    <li>
                      <strong>법규 준수:</strong> 사용자는 본 서비스를 이용함에
                      있어 의료법, 개인정보보호법 등 관련 법률을 준수할 책임이
                      있습니다.
                    </li>
                  </UnorderedList>
                </Indentation>
              </li>
              <li>
                <strong>계정 보안 (Account Security)</strong>
                <Indentation>
                  <UnorderedList>
                    <li>
                      <strong>개인 계정 사용:</strong> 계정은 반드시 1인 1계정을
                      원칙으로 합니다. 공유 계정 사용은 엄격히 금지됩니다.
                    </li>
                    <li>
                      <strong>비밀번호 관리:</strong> 사용자는 자신의 인증
                      정보(ID/PW)를 비밀로 유지해야 하며, 계정 유출로 발생한
                      사고에 대한 책임은 사용자에게 있습니다. 보안 사고가 의심될
                      경우 즉시 운영자에게 통보해야 합니다.
                    </li>
                    <li>
                      <strong>암호화 통신 요구사항:</strong> 사용자는 웹
                      브라우저가 Secure Socket Layer (SSL) 3.0 이상 및 Transport
                      Layer Security (TLS) 1.2 이상을 지원하고 사용하도록
                      보장해야 합니다. 모든 SSL 및 TLS 연결은 최소 256비트
                      이상의 암호화를 사용해야 합니다.
                    </li>
                  </UnorderedList>
                </Indentation>
              </li>
              <li>
                <strong>
                  데이터 보호 및 인프라 보안 (Data Protection &amp;
                  Infrastructure Security)
                </strong>
                <Indentation>
                  <UnorderedList>
                    <li>
                      <strong>인프라 암호화 및 관리:</strong> 본 서비스는 Google
                      Cloud Platform(GCP)의 Compute Engine 인프라를 기반으로
                      운영됩니다. 모든 사용자 데이터는 저장 시(At-rest) 구글의
                      암호화 표준에 따라 보호되며, 시스템 인프라 수준의 보안
                      유지를 위해 Google Cloud Key Management Service(KMS)가
                      적용되어 있습니다.
                    </li>
                    <li>
                      <strong>데이터베이스 보안 및 관리 체계:</strong> 본
                      사이트는 데이터의 제어권과 유연성을 위해 관리형
                      데이터베이스(Cloud SQL 등) 대신, Compute Engine 내의
                      Debian Linux 서버 환경에서 독립된 PostgreSQL
                      데이터베이스를 직접 운영합니다. 서버는 방화벽을 통한 접근
                      제어 및 필수 보안 패치를 통해 외부의 무단 접근으로부터
                      보호됩니다.
                    </li>
                    <li>
                      <strong>
                        공동 책임 모델의 인지 (Shared Responsibility):
                      </strong>{" "}
                      사용자는 본 서비스가 구글의 물리적 네트워크 보안 인프라를
                      활용하되, 가상 서버 내부의 운영체제 및 데이터베이스
                      애플리케이션 보안은 본 사이트 운영자의 환경 설정 하에
                      관리됨을 인지하고 이해합니다.
                    </li>
                  </UnorderedList>
                </Indentation>
              </li>
              <li>
                <strong>금지 사항 (Prohibited Conduct)</strong> 사용자는 다음
                행위를 해서는 안됩니다:
                <Indentation>
                  <UnorderedList>
                    <li>타인의 정보를 도용하거나 허위 정보를 입력하는 행위.</li>
                    <li>
                      사이트의 보안을 해치거나 시스템에 과도한 부하를 주는 행위.
                    </li>
                    <li>
                      사이트를 통해 얻은 정보를 상업적 광고나 스팸 발송 등에
                      이용하는 행위.
                    </li>
                    <li>
                      저작권 등 타인의 지식재산권을 침해하는 내용을 게시하는
                      행위.
                    </li>
                  </UnorderedList>
                </Indentation>
              </li>
              <li>
                <strong>의료적 면책 조항 (Medical Disclaimer)</strong>{" "}
                myopiamanage.org는 데이터 모니터링 보조 도구일 뿐이며, 의학적
                진단이나 치료법을 확정하는 의료 기기 또는 전문적 의료 상담을
                대체하지 않습니다. 본 사이트의 계산 결과나 그래프는 참고용이며,
                최종적인 의료적 결정은 반드시 의사의 판단에 따라야 합니다.
              </li>
              <li>
                <strong>책임의 제한 (Limitation of Liability)</strong>
                <Indentation>
                  <UnorderedList>
                    <li>
                      <strong>무보증:</strong> 서비스는 &quot;있는 그대로
                      (as-Is)&quot; 제공됩니다. 운영자는 서비스의 중단, 데이터
                      누락, 시스템 오류에 대해 어떠한 형태의 보증도 하지
                      않습니다.
                    </li>
                    <li>
                      <strong>손해배상:</strong> 운영자는 서비스 이용 중 발생한
                      데이터 손실, 컴퓨터 오작동, 또는 서비스 결과에 의존하여
                      발생한 어떠한 직접적/간접적 손해에 대해서도 책임을 지지
                      않습니다.
                    </li>
                  </UnorderedList>
                </Indentation>
              </li>
              <li>
                <strong>
                  서비스 수정 및 종료 (Modification &amp; Termination)
                </strong>{" "}
                운영자는 사전 고지 없이 이용 약관을 수정할 수 있으며, 수정된
                약관은 게시 즉시 효력이 발생합니다. 또한 운영자의 판단에 따라
                사용자의 액세스를 제한하거나 서비스를 중단할 수 있습니다.
              </li>
            </>
          ) : (
            <>
              <li>
                <strong>Acceptance of Terms</strong> These Terms of Service
                govern the conditions and procedures for using the myopia
                management and data monitoring services provided by
                myopiamanage.org (hereinafter referred to as the "Site"). By
                accessing this website or entering data into it, you agree to be
                bound by these Terms of Service and our Privacy Policy.
              </li>
              <li>
                <strong>
                  Handling of Sensitive Data and User Responsibilities
                </strong>{" "}
                To manage myopia progression, this site collects and stores
                patient registration numbers and dates of birth.
                <Indentation>
                  <UnorderedList>
                    <li>
                      <strong>Recommended De-identification:</strong> To protect
                      personal privacy, the Site strongly recommends that users
                      generate and register a separate research ID that can
                      identify the patient, rather than directly entering the
                      patient's actual registration number (e.g., chart number).
                      This is a proactive measure to minimize the risk of
                      personal information breaches.
                    </li>
                    <li>
                      <strong>Data Accuracy:</strong> You warrant that all data
                      you enter is accurate and that you have obtained all
                      legally required consents from the patients or their legal
                      guardians to enter such data.
                    </li>
                    <li>
                      <strong>Prevention of Identification:</strong> You must
                      manage the data to ensure that direct personal
                      identification is impossible to the greatest extent
                      possible, and you must not expose the data to any
                      unauthorized third parties.
                    </li>
                    <li>
                      <strong>Compliance with Laws:</strong> You are responsible
                      for complying with all applicable laws and regulations,
                      including medical laws and personal data protection laws,
                      when using this service.
                    </li>
                  </UnorderedList>
                </Indentation>
              </li>
              <li>
                <strong>Account Security</strong>
                <Indentation>
                  <UnorderedList>
                    <li>
                      <strong>Individual Account Use:</strong> Accounts are
                      strictly limited to one per individual. The use of shared
                      or group accounts is strictly prohibited.
                    </li>
                    <li>
                      <strong>Password Management:</strong> You must maintain
                      the confidentiality of your authentication credentials
                      (ID/Password). You are solely responsible for any
                      incidents arising from the leakage of your account
                      credentials. If you suspect any security breach, you must
                      notify the administrator immediately.
                    </li>
                    <li>
                      <strong>Encrypted Communication Requirements:</strong> You
                      must ensure that your web browsers support and use Secure
                      Socket Layer (SSL) version 3.0 (or higher) and Transport
                      Layer Security (TLS) 1.2 (or higher). All SSL and TLS
                      connections must use a minimum of 256-bit encryption.
                    </li>
                  </UnorderedList>
                </Indentation>
              </li>
              <li>
                <strong>Data Protection &amp; Infrastructure Security</strong>
                <Indentation>
                  <UnorderedList>
                    <li>
                      <strong>Infrastructure Encryption and Management:</strong>{" "}
                      This web service operates on the Google Cloud Platform
                      (GCP) Compute Engine infrastructure. All user data is
                      protected at-rest according to Google&apos;s encryption
                      standards, and Google Cloud Key Management Service (KMS)
                      is applied to maintain security at the system
                      infrastructure level.
                    </li>
                    <li>
                      <strong>Database Security and Management System:</strong>{" "}
                      To ensure data control and flexibility, the Site operates
                      an independent PostgreSQL database directly within a
                      Debian Linux server environment on Compute Engine, rather
                      than using a managed database service (such as Cloud SQL).
                      The server is protected against unauthorized external
                      access through firewall access controls and essential
                      security patches.
                    </li>
                    <li>
                      <strong>Acknowledgment of Shared Responsibility:</strong>{" "}
                      Users acknowledge and understand that while this service
                      utilizes Google&apos;s physical network security
                      infrastructure, the security of the operating system and
                      database application within the virtual server is managed
                      under the configuration settings of the site
                      administrator.
                    </li>
                  </UnorderedList>
                </Indentation>
              </li>
              <li>
                <strong>Prohibited Conduct</strong> By accessing and using the
                website, you agree that you must NOT:
                <Indentation>
                  <UnorderedList>
                    <li>
                      Steal or misappropriate others&apos; information or enter
                      false information.
                    </li>
                    <li>
                      Compromise the Site&apos;s security or place an excessive
                      burden on the system.
                    </li>
                    <li>
                      Use information obtained through the Site for commercial
                      advertising, spamming, or other solicitations.
                    </li>
                    <li>
                      Post any material that infringes upon the intellectual
                      property rights or copyrights of others.
                    </li>
                  </UnorderedList>
                </Indentation>
              </li>
              <li>
                <strong>Medical Disclaimer</strong> myopiamanage.org is solely
                an auxiliary tool for data monitoring and does not replace
                professional medical consultation, nor is it a medical device
                used to confirm medical diagnoses or treatments. The calculation
                results and graphs provided by this website (myopiamanage.org)
                are for reference purposes only. Any final medical decisions
                must be made strictly according to the judgment of a medical
                professional.
              </li>
              <li>
                <strong>Limitation of Liability</strong>
                <Indentation>
                  <UnorderedList>
                    <li>
                      <strong>No Warranty:</strong> The service is provided on
                      an &quot;as-is&quot; basis. The administrator makes no
                      warranties of any kind regarding service interruptions,
                      data omissions, or system errors.
                    </li>
                    <li>
                      <strong>Damages:</strong> In no event will the
                      administrator be liable for any direct or indirect
                      damages, including data loss, computer malfunction, or any
                      damages arising out of your reliance on the Service
                      results or your use of the Service.
                    </li>
                  </UnorderedList>
                </Indentation>
              </li>
              <li>
                <strong>Modification &amp; Termination</strong> The
                administrator maintains the right to modify these Terms of
                Service at any time without prior notice, and such modifications
                become effective immediately upon posting. We may also, at our
                sole discretion, suspend or terminate your access to the service
                or restrict your account at any time.
              </li>
            </>
          )}
        </OrderedList>
      </GuideContainer>
    </TopDiv>
  );
}
