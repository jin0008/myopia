import { useEffect, useRef, useState } from "react";
import styled, { keyframes } from "styled-components";
import theme from "../theme";
import { MOBILE_MEDIA } from "../lib/constants";

const PageWrapper = styled.div`
  max-width: 980px;
  margin: 0 auto;
  padding: 60px 24px 80px;

  @media ${MOBILE_MEDIA} {
    padding: 32px 16px 60px;
  }
`;

const HeroSection = styled.div`
  text-align: center;
  margin-bottom: 48px;
`;

const fadeInUp = keyframes`
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

const HeroTitle = styled.h1`
  font-size: 3rem;
  font-weight: 700;
  color: ${theme.textPrimary};
  margin-bottom: 16px;
  animation: ${fadeInUp} 0.8s ease-out;

  @media ${MOBILE_MEDIA} {
    font-size: 2rem;
  }
`;

const HeroSubtitle = styled.p`
  font-size: 1.15rem;
  color: ${theme.textSecondary};
  line-height: 1.6;
  max-width: 600px;
  margin: 0 auto;
  animation: ${fadeInUp} 0.8s ease-out 0.2s both;

  @media ${MOBILE_MEDIA} {
    font-size: 1rem;
  }
`;

const GraphCard = styled.div`
  background: white;
  border-radius: 20px;
  padding: 40px 36px 32px;
  box-shadow: 0 2px 16px rgba(0, 0, 0, 0.06);
  animation: ${fadeInUp} 0.8s ease-out 0.4s both;

  @media ${MOBILE_MEDIA} {
    padding: 24px 16px 20px;
    border-radius: 16px;
  }
`;

const GraphTitle = styled.h2`
  font-size: 1.1rem;
  font-weight: 600;
  color: ${theme.textPrimary};
  margin-bottom: 8px;
`;

const GraphDescription = styled.p`
  font-size: 0.9rem;
  color: ${theme.textSecondary};
  margin-bottom: 28px;
`;

const SVGContainer = styled.div`
  width: 100%;
  overflow: hidden;
`;

// Realistic axial length data (mm) by age
// Normal eye growth plateaus around 23.5mm
// Myopic eye continues growing
const normalData = [
  { age: 3, al: 22.0 },
  { age: 4, al: 22.3 },
  { age: 5, al: 22.5 },
  { age: 6, al: 22.7 },
  { age: 7, al: 22.85 },
  { age: 8, al: 22.95 },
  { age: 9, al: 23.05 },
  { age: 10, al: 23.12 },
  { age: 11, al: 23.18 },
  { age: 12, al: 23.22 },
  { age: 13, al: 23.26 },
  { age: 14, al: 23.3 },
  { age: 15, al: 23.33 },
  { age: 16, al: 23.35 },
  { age: 17, al: 23.37 },
  { age: 18, al: 23.38 },
];

const myopicData = [
  { age: 3, al: 22.0 },
  { age: 4, al: 22.35 },
  { age: 5, al: 22.65 },
  { age: 6, al: 22.95 },
  { age: 7, al: 23.3 },
  { age: 8, al: 23.65 },
  { age: 9, al: 24.0 },
  { age: 10, al: 24.35 },
  { age: 11, al: 24.65 },
  { age: 12, al: 24.95 },
  { age: 13, al: 25.2 },
  { age: 14, al: 25.42 },
  { age: 15, al: 25.6 },
  { age: 16, al: 25.75 },
  { age: 17, al: 25.87 },
  { age: 18, al: 25.95 },
];

const managedData = [
  { age: 3, al: 22.0 },
  { age: 4, al: 22.35 },
  { age: 5, al: 22.65 },
  { age: 6, al: 22.95 },
  { age: 7, al: 23.25 },
  { age: 8, al: 23.5 },
  { age: 9, al: 23.7 },
  { age: 10, al: 23.88 },
  { age: 11, al: 24.02 },
  { age: 12, al: 24.14 },
  { age: 13, al: 24.24 },
  { age: 14, al: 24.32 },
  { age: 15, al: 24.38 },
  { age: 16, al: 24.43 },
  { age: 17, al: 24.47 },
  { age: 18, al: 24.5 },
];

// Chart dimensions
const CHART = {
  width: 800,
  height: 400,
  paddingLeft: 64,
  paddingRight: 32,
  paddingTop: 24,
  paddingBottom: 48,
};

const plotWidth = CHART.width - CHART.paddingLeft - CHART.paddingRight;
const plotHeight = CHART.height - CHART.paddingTop - CHART.paddingBottom;

const ageMin = 3;
const ageMax = 18;
const alMin = 21.5;
const alMax = 26.5;

function scaleX(age: number): number {
  return CHART.paddingLeft + ((age - ageMin) / (ageMax - ageMin)) * plotWidth;
}

function scaleY(al: number): number {
  return CHART.paddingTop + ((alMax - al) / (alMax - alMin)) * plotHeight;
}

function buildPath(data: { age: number; al: number }[]): string {
  return data
    .map((d, i) => `${i === 0 ? "M" : "L"} ${scaleX(d.age)} ${scaleY(d.al)}`)
    .join(" ");
}

function calculatePathLength(data: { age: number; al: number }[]): number {
  let length = 0;
  for (let i = 1; i < data.length; i++) {
    const dx = scaleX(data[i].age) - scaleX(data[i - 1].age);
    const dy = scaleY(data[i].al) - scaleY(data[i - 1].al);
    length += Math.sqrt(dx * dx + dy * dy);
  }
  return length;
}

const LegendWrapper = styled.div`
  display: flex;
  justify-content: center;
  gap: 32px;
  margin-top: 20px;
  flex-wrap: wrap;

  @media ${MOBILE_MEDIA} {
    gap: 16px;
  }
`;

const LegendItem = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: ${theme.textSecondary};
`;

const LegendDot = styled.span<{ color: string; dashed?: boolean }>`
  display: inline-block;
  width: 24px;
  height: 3px;
  background: ${(p) => (p.dashed ? "transparent" : p.color)};
  border-radius: 2px;
  position: relative;

  ${(p) =>
    p.dashed &&
    `
    background: repeating-linear-gradient(
      to right,
      ${p.color} 0px,
      ${p.color} 4px,
      transparent 4px,
      transparent 8px
    );
  `}
`;

export default function Home() {
  const [isVisible, setIsVisible] = useState(false);
  const graphRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.2 }
    );

    if (graphRef.current) {
      observer.observe(graphRef.current);
    }

    // Also trigger after a small delay for above-the-fold
    const timer = setTimeout(() => setIsVisible(true), 600);

    return () => {
      observer.disconnect();
      clearTimeout(timer);
    };
  }, []);

  const normalPath = buildPath(normalData);
  const myopicPath = buildPath(myopicData);
  const managedPath = buildPath(managedData);

  const normalLength = calculatePathLength(normalData);
  const myopicLength = calculatePathLength(myopicData);
  const managedLength = calculatePathLength(managedData);

  // Y-axis ticks
  const yTicks = [22, 23, 24, 25, 26];
  // X-axis ticks
  const xTicks = [3, 6, 9, 12, 15, 18];

  return (
    <PageWrapper>
      <HeroSection>
        <HeroTitle>Myopia Management</HeroTitle>
        <HeroSubtitle>
          Track axial length growth, manage treatments, and monitor myopia
          progression with precision and care.
        </HeroSubtitle>
      </HeroSection>

      <GraphCard ref={graphRef}>
        <GraphTitle>Axial Length Growth Over Age</GraphTitle>
        <GraphDescription>
          Comparison of normal eye growth, unmanaged myopia, and managed myopia
          progression
        </GraphDescription>

        <SVGContainer>
          <svg
            viewBox={`0 0 ${CHART.width} ${CHART.height}`}
            width="100%"
            style={{ display: "block" }}
          >
            {/* Grid lines */}
            {yTicks.map((tick) => (
              <line
                key={`grid-y-${tick}`}
                x1={CHART.paddingLeft}
                y1={scaleY(tick)}
                x2={CHART.width - CHART.paddingRight}
                y2={scaleY(tick)}
                stroke="#f0f0f0"
                strokeWidth="1"
              />
            ))}

            {/* Y-axis labels */}
            {yTicks.map((tick) => (
              <text
                key={`label-y-${tick}`}
                x={CHART.paddingLeft - 12}
                y={scaleY(tick)}
                textAnchor="end"
                dominantBaseline="middle"
                fill="#999"
                fontSize="12"
                fontFamily="Inter, system-ui, sans-serif"
              >
                {tick.toFixed(0)} mm
              </text>
            ))}

            {/* X-axis labels */}
            {xTicks.map((tick) => (
              <text
                key={`label-x-${tick}`}
                x={scaleX(tick)}
                y={CHART.height - CHART.paddingBottom + 28}
                textAnchor="middle"
                fill="#999"
                fontSize="12"
                fontFamily="Inter, system-ui, sans-serif"
              >
                {tick}
              </text>
            ))}

            {/* Axis labels */}
            <text
              x={CHART.width / 2}
              y={CHART.height - 2}
              textAnchor="middle"
              fill="#999"
              fontSize="13"
              fontFamily="Inter, system-ui, sans-serif"
            >
              Age (years)
            </text>
            <text
              x={14}
              y={CHART.height / 2}
              textAnchor="middle"
              fill="#999"
              fontSize="13"
              fontFamily="Inter, system-ui, sans-serif"
              transform={`rotate(-90, 14, ${CHART.height / 2})`}
            >
              Axial Length (mm)
            </text>

            {/* Axes */}
            <line
              x1={CHART.paddingLeft}
              y1={CHART.paddingTop}
              x2={CHART.paddingLeft}
              y2={CHART.height - CHART.paddingBottom}
              stroke="#ddd"
              strokeWidth="1"
            />
            <line
              x1={CHART.paddingLeft}
              y1={CHART.height - CHART.paddingBottom}
              x2={CHART.width - CHART.paddingRight}
              y2={CHART.height - CHART.paddingBottom}
              stroke="#ddd"
              strokeWidth="1"
            />

            {/* Myopic line (red, drawn first so it's behind) */}
            <path
              d={myopicPath}
              fill="none"
              stroke={theme.danger}
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeDasharray={myopicLength}
              strokeDashoffset={isVisible ? 0 : myopicLength}
              style={{
                transition: "stroke-dashoffset 2.5s ease-out 0.3s",
              }}
            />

            {/* Managed myopia line (green dashed) */}
            <path
              d={managedPath}
              fill="none"
              stroke={theme.primary}
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeDasharray={isVisible ? "8 6" : `${managedLength}`}
              strokeDashoffset={isVisible ? 0 : managedLength}
              style={{
                transition: isVisible
                  ? "stroke-dashoffset 2.5s ease-out 0.6s, stroke-dasharray 0.01s linear 3.1s"
                  : "none",
              }}
            />

            {/* Normal line (gray) */}
            <path
              d={normalPath}
              fill="none"
              stroke="#bbb"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeDasharray={normalLength}
              strokeDashoffset={isVisible ? 0 : normalLength}
              style={{
                transition: "stroke-dashoffset 2s ease-out",
              }}
            />

            {/* Endpoint dots */}
            {isVisible && (
              <>
                <circle
                  cx={scaleX(18)}
                  cy={scaleY(23.38)}
                  r="4"
                  fill="#bbb"
                  opacity={isVisible ? 1 : 0}
                  style={{ transition: "opacity 0.4s ease-out 2s" }}
                />
                <circle
                  cx={scaleX(18)}
                  cy={scaleY(25.95)}
                  r="4"
                  fill={theme.danger}
                  opacity={isVisible ? 1 : 0}
                  style={{ transition: "opacity 0.4s ease-out 2.8s" }}
                />
                <circle
                  cx={scaleX(18)}
                  cy={scaleY(24.5)}
                  r="4"
                  fill={theme.primary}
                  opacity={isVisible ? 1 : 0}
                  style={{ transition: "opacity 0.4s ease-out 3.2s" }}
                />

                {/* Endpoint labels */}
                <text
                  x={scaleX(18) + 8}
                  y={scaleY(23.38)}
                  dominantBaseline="middle"
                  fill="#bbb"
                  fontSize="11"
                  fontFamily="Inter, system-ui, sans-serif"
                  fontWeight="500"
                  opacity={isVisible ? 1 : 0}
                  style={{ transition: "opacity 0.4s ease-out 2s" }}
                >
                  23.4
                </text>
                <text
                  x={scaleX(18) + 8}
                  y={scaleY(25.95)}
                  dominantBaseline="middle"
                  fill={theme.danger}
                  fontSize="11"
                  fontFamily="Inter, system-ui, sans-serif"
                  fontWeight="500"
                  opacity={isVisible ? 1 : 0}
                  style={{ transition: "opacity 0.4s ease-out 2.8s" }}
                >
                  26.0
                </text>
                <text
                  x={scaleX(18) + 8}
                  y={scaleY(24.5)}
                  dominantBaseline="middle"
                  fill={theme.primary}
                  fontSize="11"
                  fontFamily="Inter, system-ui, sans-serif"
                  fontWeight="500"
                  opacity={isVisible ? 1 : 0}
                  style={{ transition: "opacity 0.4s ease-out 3.2s" }}
                >
                  24.5
                </text>
              </>
            )}
          </svg>
        </SVGContainer>

        <LegendWrapper>
          <LegendItem>
            <LegendDot color="#bbb" />
            Normal Growth
          </LegendItem>
          <LegendItem>
            <LegendDot color={theme.danger} />
            Unmanaged Myopia
          </LegendItem>
          <LegendItem>
            <LegendDot color={theme.primary} dashed />
            Managed Myopia
          </LegendItem>
        </LegendWrapper>
      </GraphCard>
    </PageWrapper>
  );
}
