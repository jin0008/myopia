import { useState } from "react";
import styled from "styled-components";
import theme from "../theme";
import ConfirmDialog from "./dialog";
import {
  TERMS_OF_SERVICE,
  PRIVACY_CONSENT,
  MARKETING_CONSENT,
} from "../consent";

export interface ConsentValue {
  terms: boolean;
  privacy: boolean;
  marketing: boolean;
}

const ConsentBox = styled.div`
  border: 1px solid #e0e0e0;
  border-radius: 12px;
  padding: 12px 14px;
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

const ConsentAllRow = styled.label`
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 15px;
  font-weight: 600;
  color: ${theme.textPrimary};
  cursor: pointer;
  padding-bottom: 8px;
  border-bottom: 1px solid #eee;
`;

const ConsentRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 14px;
`;

const ConsentLeft = styled.label`
  display: flex;
  align-items: center;
  gap: 8px;
  color: ${theme.textSecondary};
  cursor: pointer;
`;

const RequiredTag = styled.span`
  color: ${theme.primary};
  font-weight: 600;
`;

const OptionalTag = styled.span`
  color: #aaa;
`;

const ViewLink = styled.button`
  background: none;
  border: none;
  color: ${theme.textSecondary};
  font-size: 13px;
  text-decoration: underline;
  cursor: pointer;
  padding: 0;

  &:hover {
    color: ${theme.primary};
  }
`;

const ConsentText = styled.div`
  white-space: pre-wrap;
  font-size: 13px;
  line-height: 1.6;
  color: ${theme.textPrimary};
  max-width: 520px;
`;

type DocKey = "terms" | "privacy" | "marketing" | null;

const DOCS = {
  terms: { title: "이용약관", body: TERMS_OF_SERVICE },
  privacy: { title: "개인정보 수집·이용 동의", body: PRIVACY_CONSENT },
  marketing: { title: "마케팅 정보 수신 동의", body: MARKETING_CONSENT },
};

export function isRequiredAgreed(v: ConsentValue) {
  return v.terms && v.privacy;
}

interface Props {
  value: ConsentValue;
  onChange: (value: ConsentValue) => void;
}

export default function ConsentChecklist({ value, onChange }: Props) {
  const [openDoc, setOpenDoc] = useState<DocKey>(null);
  const allAgreed = value.terms && value.privacy && value.marketing;

  return (
    <>
      <ConsentBox>
        <ConsentAllRow>
          <input
            type="checkbox"
            checked={allAgreed}
            onChange={(e) =>
              onChange({
                terms: e.target.checked,
                privacy: e.target.checked,
                marketing: e.target.checked,
              })
            }
          />
          전체 동의 (선택 항목 포함)
        </ConsentAllRow>

        <ConsentRow>
          <ConsentLeft>
            <input
              type="checkbox"
              checked={value.terms}
              onChange={(e) => onChange({ ...value, terms: e.target.checked })}
            />
            <span>
              <RequiredTag>[필수]</RequiredTag> 이용약관 동의
            </span>
          </ConsentLeft>
          <ViewLink type="button" onClick={() => setOpenDoc("terms")}>
            보기
          </ViewLink>
        </ConsentRow>

        <ConsentRow>
          <ConsentLeft>
            <input
              type="checkbox"
              checked={value.privacy}
              onChange={(e) =>
                onChange({ ...value, privacy: e.target.checked })
              }
            />
            <span>
              <RequiredTag>[필수]</RequiredTag> 개인정보 수집·이용 동의
            </span>
          </ConsentLeft>
          <ViewLink type="button" onClick={() => setOpenDoc("privacy")}>
            보기
          </ViewLink>
        </ConsentRow>

        <ConsentRow>
          <ConsentLeft>
            <input
              type="checkbox"
              checked={value.marketing}
              onChange={(e) =>
                onChange({ ...value, marketing: e.target.checked })
              }
            />
            <span>
              <OptionalTag>[선택]</OptionalTag> 마케팅 정보 수신 동의
            </span>
          </ConsentLeft>
          <ViewLink type="button" onClick={() => setOpenDoc("marketing")}>
            보기
          </ViewLink>
        </ConsentRow>
      </ConsentBox>

      <ConfirmDialog
        open={openDoc !== null}
        title={openDoc ? DOCS[openDoc].title : ""}
        content={
          <ConsentText>{openDoc ? DOCS[openDoc].body : ""}</ConsentText>
        }
        onClose={() => setOpenDoc(null)}
        onConfirm={() => setOpenDoc(null)}
      />
    </>
  );
}
