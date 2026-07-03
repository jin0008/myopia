import styled from "styled-components";
import theme from "../../theme";
import { MOBILE_MEDIA } from "../../lib/constants";
import { ReactiveFlex } from "../../components/reactive";

export const HeaderTextDiv = styled.div`
  background-color: ${theme.primary};
  width: 320px;
  min-width: 0;
  color: white;
  padding: 8px 0;
  text-align: center;
  border-radius: 24px;
  font-size: 14px;
  font-weight: 500;
  @media ${MOBILE_MEDIA} {
    width: 100%;
    max-width: 100%;
  }
`;

export const HeaderDiv = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  margin: 32px 64px 0;
  gap: 8px;
  @media ${MOBILE_MEDIA} {
    flex-direction: column;
    margin: 16px 16px 0;
    gap: 8px;
  }
`;

export const ContentDiv = styled.div`
  margin: 0 96px;
  margin-bottom: 32px;
  @media ${MOBILE_MEDIA} {
    margin: 0 16px;
    margin-bottom: 16px;
  }
`;

export const ChartTitleDiv = styled.div`
  font-size: large;
  margin-top: 32px;
  padding-bottom: 16px;
  border-bottom: 2px solid #eee;
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 12px;
  @media ${MOBILE_MEDIA} {
    margin-top: 16px;
    padding-bottom: 12px;
  }
`;

export const ChartTitleMain = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
`;

export const ReferenceRow = styled.div`
  display: flex;
  margin-top: 4px;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;

  @media ${MOBILE_MEDIA} {
    gap: 8px;
  }
`;

export const ChartAndListWrapper = styled.div`
  display: flex;
  flex-direction: row;
  margin-top: 16px;
  gap: 16px;
  min-height: 0;
  @media ${MOBILE_MEDIA} {
    flex-direction: column;
    margin-top: 12px;
  }
`;

export const ChartWrapper = styled.div`
  flex: 1;
  width: 0;
  @media ${MOBILE_MEDIA} {
    width: 100%;
  }
`;

export const ChartContainer = styled.div`
  position: relative;
  min-height: 560px;
  width: 100%;
  @media ${MOBILE_MEDIA} {
    min-height: 480px;
  }
`;

export const MeasurementListWrapper = styled.div`
  min-width: 0;
  @media ${MOBILE_MEDIA} {
    margin: 0;
  }
`;

export const ChartPageRoot = styled.div`
  min-width: 0;
  overflow-x: hidden;
`;

export const KInputGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px;
  text-align: center;
  @media ${MOBILE_MEDIA} {
    gap: 12px;
  }
`;

export const TextButton = styled.button<{ $active: boolean }>`
  text-align: center;
  color: ${({ $active }) => ($active ? "white" : "#555")};
  background-color: ${({ $active }) => ($active ? theme.primary : "white")};
  border: ${({ $active }) => ($active ? "none" : "1px solid #e0e0e0")};
  border-radius: 24px;
  padding: 10px 20px;
  font-weight: 500;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    border-color: ${theme.primary};
  }

  @media ${MOBILE_MEDIA} {
    padding: 8px 16px;
    font-size: 13px;
  }
`;

export const SmallTextButton = styled(TextButton)`
  padding: 6px 12px;
  font-size: 12px;
`;

export const GridDiv = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 108px) 1fr;
  gap: 16px;
  @media ${MOBILE_MEDIA} {
    grid-template-columns: repeat(3, minmax(0, 1fr)) auto;
    gap: 8px;
  }
`;

export const GridItemDiv = styled.div`
  text-align: center;
  background-color: white;
  border: 1px solid #e0e0e0;
  border-radius: 24px;
  padding: 8px 0;
  font-size: 14px;
  @media ${MOBILE_MEDIA} {
    padding: 6px 4px;
    border-radius: 16px;
    font-size: 13px;
  }
`;

export const GridItemDiv2 = styled(GridItemDiv)`
  background-color: ${theme.primary};
  color: white;
  border: none;
`;

export const TreatmentListHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  margin-bottom: 16px;
  flex-wrap: wrap;
  gap: 8px;
`;

export const TreatmentCardDiv = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  background-color: white;
  border: 1px solid #e0e0e0;
  border-radius: 16px;
  padding: 12px 20px;
  margin: 8px 0;
  flex-wrap: wrap;
  gap: 8px;
  transition: box-shadow 0.2s;

  &:hover {
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  }

  @media ${MOBILE_MEDIA} {
    padding: 10px 12px;
    border-radius: 12px;
  }
`;

export const PatientDataSection = styled.div`
  padding: 20px;
  border: 1px solid #eee;
  border-radius: 16px;
  background: white;
  @media ${MOBILE_MEDIA} {
    margin-top: 16px;
    padding: 16px;
  }
`;

export const PatientDataHeader = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 16px;
  @media ${MOBILE_MEDIA} {
    margin-bottom: 12px;
  }
`;

export const RadioGroup = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 8px;
  @media ${MOBILE_MEDIA} {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 6px;
  }
`;

export const RadioField = styled.label`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border-radius: 10px;
  cursor: pointer;
  font-size: 0.875rem;
  transition: background-color 0.15s;
  input[type="radio"] {
    accent-color: ${theme.primary};
  }
  &:has(input:checked) {
    background-color: ${theme.primary10};
    font-weight: 500;
  }
  @media ${MOBILE_MEDIA} {
    padding: 6px 10px;
    font-size: 0.8125rem;
  }
`;

export const PatientDataGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 20px 32px;
  @media ${MOBILE_MEDIA} {
    grid-template-columns: 1fr;
    gap: 16px;
  }
`;

export const PatientDataField = styled.div`
  min-width: 0;
`;

export const PatientDataFieldLabel = styled.div`
  font-size: 0.875rem;
  font-weight: 500;
  margin-bottom: 8px;
  color: ${theme.textPrimary};
  @media ${MOBILE_MEDIA} {
    margin-bottom: 6px;
    font-size: 0.8125rem;
  }
`;

export const MeasurementGroup = styled(ReactiveFlex)`
  gap: 8px;
  & > label {
    flex-grow: 1;
  }
`;
