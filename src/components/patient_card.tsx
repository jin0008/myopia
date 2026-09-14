import styled from "styled-components";
import theme from "../theme";
import {
  Description,
  Edit,
  DeleteOutline,
  Link as LinkIcon,
  LinkOff,
} from "@mui/icons-material";

const CardDiv = styled.div`
  background-color: white;
  border: 1px solid #eee;
  border-radius: 16px;
  padding: 20px;
  cursor: pointer;
  transition: box-shadow 0.2s, transform 0.15s;

  &:hover {
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
    transform: translateY(-1px);
  }
`;

const CardHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
`;

const NameSection = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
`;

const RegistrationName = styled.h3`
  font-size: 16px;
  font-weight: 600;
  color: ${theme.textPrimary};
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const IconGroup = styled.div`
  display: flex;
  gap: 4px;
  flex-shrink: 0;
`;

const IconButton = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  color: #bbb;
  padding: 4px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  transition: color 0.2s, background-color 0.2s;

  &:hover {
    color: #666;
    background-color: #f5f5f5;
  }
`;

/** 연동된 환자는 초록으로 켠다. 회색은 아직 아무도 연결되지 않은 것이다.
 *  삭제를 막는 것이 이 연동이라, 목록에서 바로 보여야 왜 안 지워지는지
 *  카드를 열어 보기 전에 안다. */
const LinkButton = styled(IconButton)<{ $linked: boolean }>`
  color: ${(props) => (props.$linked ? "#0f9d58" : "#bbb")};

  &:hover {
    color: ${(props) => (props.$linked ? "#0b7c45" : "#666")};
    background-color: ${(props) => (props.$linked ? "#e9f7ef" : "#f5f5f5")};
  }
`;

const BadgeRow = styled.div`
  display: flex;
  gap: 8px;
  align-items: center;
`;

const DateBadge = styled.span`
  font-size: 13px;
  color: ${theme.textSecondary};
  padding: 4px 10px;
  background-color: #f5f5f7;
  border-radius: 8px;
`;

const SexBadge = styled.span<{ $sex: string }>`
  font-size: 13px;
  font-weight: 500;
  padding: 4px 10px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  gap: 4px;
  background-color: ${(props) =>
    props.$sex === "M" ? theme.maleBadge : theme.femaleBadge};
  color: ${(props) =>
    props.$sex === "M" ? theme.maleText : theme.femaleText};
`;

export function PatientCard({
  registration,
  dateOfBirth,
  sex,
  onClick,
  onEdit,
  onDelete,
  onInvite,
  linked = false,
}: {
  registration: string;
  dateOfBirth: string;
  sex: string;
  onClick: () => void;
  onEdit?: () => void;
  onDelete: () => void;
  /** 보호자 앱 연동 창 열기 — 연동 현황·해제와 링크 만들기가 함께 있다. */
  onInvite?: () => void;
  /** 보호자 앱과 이어져 있는지. */
  linked?: boolean;
}) {
  return (
    <CardDiv onClick={onClick}>
      <CardHeader>
        <NameSection>
          <Description style={{ fontSize: "18px", color: "#bbb" }} />
          <RegistrationName>{registration}</RegistrationName>
        </NameSection>
        <IconGroup>
          {onInvite && (
            <LinkButton
              $linked={linked}
              title={
                linked
                  ? "보호자 앱과 연동됨 — 눌러서 현황 보기·해제"
                  : "보호자 앱 연동 링크 만들기"
              }
              onClick={(e) => {
                e.stopPropagation();
                onInvite();
              }}
            >
              {linked ? (
                <LinkIcon style={{ fontSize: "18px" }} />
              ) : (
                <LinkOff style={{ fontSize: "18px" }} />
              )}
            </LinkButton>
          )}
          {onEdit && (
            <IconButton
              onClick={(e) => {
                e.stopPropagation();
                onEdit();
              }}
            >
              <Edit style={{ fontSize: "18px" }} />
            </IconButton>
          )}
          <IconButton
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
          >
            <DeleteOutline style={{ fontSize: "18px" }} />
          </IconButton>
        </IconGroup>
      </CardHeader>
      <BadgeRow>
        <DateBadge>{dateOfBirth}</DateBadge>
        <SexBadge $sex={sex}>
          {sex === "M" ? "♂" : "♀"} {sex === "M" ? "Male" : "Female"}
        </SexBadge>
      </BadgeRow>
    </CardDiv>
  );
}
