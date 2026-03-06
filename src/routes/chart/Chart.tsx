import { useEffect, useMemo, useRef, useState } from "react";
import autocolors from "chartjs-plugin-autocolors";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Scatter } from "react-chartjs-2";
import ordinal from "ordinal";
import { getGrowthData } from "../../api/growth_data";
import { useQuery } from "@tanstack/react-query";
import { useIsMobile } from "../../hooks/is_mobile";
import { Measurement } from "../../types/measurement";
import { Treatment } from "../../types/treatment";
import { getTreatmentList } from "../../api/static";
import theme from "../../theme";
import { ChartContainer } from "./styles";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  autocolors,
);

interface ChartProps {
  displayAxialLength: boolean;
  refractiveErrorType: "sph" | "se" | null;
  sortedAxialLengthMeasurement: Measurement[];
  sortedRefractiveErrorMeasurement: Measurement[];
  sortedTreatment: Treatment[];
  patientBirthday: Date;
  patientSex: "male" | "female";
  referenceEthnicity: string;
  onCanvasChange: (canvas: HTMLCanvasElement) => void;
}

export function Chart({
  sortedAxialLengthMeasurement = [],
  sortedRefractiveErrorMeasurement = [],
  sortedTreatment = [],
  displayAxialLength,
  refractiveErrorType,
  patientBirthday,
  patientSex,
  referenceEthnicity,
  onCanvasChange,
}: ChartProps) {
  const isMobile = useIsMobile();

  const chartRef = useRef<ChartJS<"scatter">>(null);

  useEffect(() => {
    if (!chartRef.current) return;
    onCanvasChange(chartRef.current.canvas);
  }, [chartRef.current]);

  const growthData = useQuery<
    Array<{ percentile: number; age: number; value: number }>
  >({
    queryKey: [
      "growthData",
      { sex: patientSex, ethnicity: referenceEthnicity },
    ],
    queryFn: () => getGrowthData(patientSex, referenceEthnicity),
    staleTime: Infinity,
    gcTime: Infinity,
  });

  const treatmentQuery = useQuery({
    queryKey: ["treatment"],
    queryFn: getTreatmentList,
    staleTime: Infinity,
    gcTime: Infinity,
  });

  const referenceDataset = useMemo(() => {
    if (!growthData.data) return [];

    const grouped: Map<
      number,
      Array<{ percentile: number; age: number; value: number }>
    > = new Map();
    growthData.data.forEach((e) => {
      if (!grouped.has(e.percentile)) grouped.set(e.percentile, []);
      grouped.get(e.percentile)!.push(e);
    });
    return Array.from(grouped.entries()).map(([key, value]) => ({
      label: `${ordinal(key)} Percentile`,
      data: value
        .sort((a, b) => a.age - b.age)
        .map((e) => ({ x: e.age, y: e.value })),
      yAxisID: "y",
    }));
  }, [growthData.data]);

  function toData(measurement: Measurement[], side: "od" | "os") {
    const birthdayTimestamp = patientBirthday.getTime();
    return measurement
      .map((m) => {
        const measurementTimestamp = new Date(m.date).getTime();
        const value = m[side];
        return value != null
          ? {
              x:
                (measurementTimestamp - birthdayTimestamp) /
                (1000 * 60 * 60 * 24 * 365.25),
              y: value,
            }
          : null;
      })
      .filter((e): e is { x: number; y: number } => e != null);
  }

  const userDataset = useMemo(() => {
    if (displayAxialLength && refractiveErrorType) {
      const dataSets: any[] = [];

      // Add AL data
      ["od", "os"].forEach((side, index) => {
        dataSets.push({
          label: side + "AL",
          data: toData(sortedAxialLengthMeasurement, side as "od" | "os"),
          elements: {
            point: {
              radius: 3,
            },
          },
          backgroundColor: index ? "red" : "blue",
          borderColor: index ? "red" : "blue",
          yAxisID: "y",
        });
      });

      // Add RE data
      ["od", "os"].forEach((side, index) => {
        dataSets.push({
          label: side + "RE",
          data: toData(sortedRefractiveErrorMeasurement, side as "od" | "os"),
          elements: {
            point: {
              radius: 3,
            },
          },
          backgroundColor: index ? "red" : "blue",
          borderColor: index ? "red" : "blue",
          borderDash: [5, 5],
          yAxisID: "y2",
        });
      });
      return dataSets;
    }

    const measurement = displayAxialLength
      ? sortedAxialLengthMeasurement
      : sortedRefractiveErrorMeasurement;

    return ["od", "os"].map((side, index) => ({
      label: side,
      data: toData(measurement, side as "od" | "os"),
      elements: {
        point: {
          radius: 3,
        },
      },
      backgroundColor: index ? "red" : "blue",
      borderColor: index ? "red" : "blue",
      yAxisID: "y",
    }));
  }, [
    displayAxialLength,
    refractiveErrorType,
    sortedAxialLengthMeasurement,
    sortedRefractiveErrorMeasurement,
  ]);

  const { minX, maxX } = useMemo(() => {
    const measurement =
      displayAxialLength && refractiveErrorType
        ? sortedAxialLengthMeasurement.concat(sortedRefractiveErrorMeasurement)
        : displayAxialLength
          ? sortedAxialLengthMeasurement
          : sortedRefractiveErrorMeasurement;
    const ages = measurement.map((m) => {
      const measurementTimestamp = new Date(m.date).getTime();
      const birthdayTimestamp = patientBirthday.getTime();
      return (
        (measurementTimestamp - birthdayTimestamp) /
        (1000 * 60 * 60 * 24 * 365.25)
      );
    });
    const minX = Math.min(4, ...ages);
    const maxX = Math.max(18, ...ages);

    return { minX, maxX };
  }, [
    displayAxialLength,
    refractiveErrorType,
    sortedAxialLengthMeasurement,
    sortedRefractiveErrorMeasurement,
    patientBirthday,
  ]);

  const { minY, maxY } = useMemo(() => {
    const measurement = displayAxialLength
      ? sortedAxialLengthMeasurement
      : sortedRefractiveErrorMeasurement;

    const data = [
      ...measurement.map((m) => m.od).filter((y): y is number => y != null),
      ...measurement.map((m) => m.os).filter((y): y is number => y != null),
    ];

    if (displayAxialLength)
      data.push(...(growthData.data ?? []).map((g) => g.value));

    let minY = Math.min(...data);
    let maxY = Math.max(...data);

    const range = maxY - minY;
    if (range < 1) {
      minY = Math.floor(minY - 0.5);
      maxY = Math.ceil(maxY + 0.5);
    } else {
      const padding = range * 0.1;
      minY = Math.floor(minY - padding);
      maxY = Math.ceil(maxY + padding);
    }

    return { minY, maxY };
  }, [
    displayAxialLength,
    sortedAxialLengthMeasurement,
    sortedRefractiveErrorMeasurement,
    growthData.data,
  ]);

  const { maxY2, minY2 } = useMemo(() => {
    const data = sortedRefractiveErrorMeasurement
      .flatMap((m) => [m.od, m.os])
      .filter((y): y is number => y != null);
    let minY2 = Math.min(...data);
    let maxY2 = Math.max(...data);

    const range = maxY2 - minY2;
    if (range < 1) {
      minY2 = Math.floor(minY2 - 0.5);
      maxY2 = Math.ceil(maxY2 + 0.5);
    } else {
      const padding = range * 0.1;
      minY2 = Math.floor(minY2 - padding);
      maxY2 = Math.ceil(maxY2 + padding);
    }

    return { minY2, maxY2 };
  }, [sortedRefractiveErrorMeasurement]);

  const treatmentDisplayData = useMemo(() => {
    const birthdayMs = patientBirthday.getTime();
    const msPerYear = 1000 * 60 * 60 * 24 * 365.25;
    return [...sortedTreatment].reverse().map((treatment) => {
      const startAge =
        (new Date(treatment.start_date).getTime() - birthdayMs) / msPerYear;
      const endAge = treatment.end_date
        ? (new Date(treatment.end_date).getTime() - birthdayMs) / msPerYear
        : (Date.now() - birthdayMs) / msPerYear;
      const treatmentName =
        treatmentQuery.data?.find((t: any) => t.id === treatment.treatment_id)
          ?.name ?? "???";
      return { name: treatmentName, startAge, endAge };
    });
  }, [sortedTreatment, treatmentQuery.data, patientBirthday]);

  const [xScale, setXScale] = useState<{ left: number; width: number }>({
    left: 0,
    width: 0,
  });
  const xScalePrevRef = useRef<{ left: number; width: number }>({
    left: 0,
    width: 0,
  });

  const options = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      devicePixelRatio: window.devicePixelRatio * 2,
      plugins: {
        autocolors: {
          mode: "dataset" as const,
          offset: 0,
        },
        legend: {
          position: isMobile ? ("top" as const) : ("left" as const),
        },
        title: {
          display: true,
          text:
            displayAxialLength && refractiveErrorType
              ? `Axial Length and Refractive Error(${refractiveErrorType === "sph" ? "Sph" : "SE"})`
              : displayAxialLength
                ? "Axial Length Percentiles"
                : `Refractive Error(${refractiveErrorType === "sph" ? "Sph" : "SE"})`,
          color: "#333333",
          font: {
            size: 24,
          },
        },
      },
      elements: {
        point: {
          radius: 0,
        },
      },
      showLine: true,
      scales: {
        x: {
          grid: {
            tickColor: "black",
          },
          border: {
            color: "black",
          },
          title: {
            display: true,
            text: "Age (years)",
            font: {
              size: 12,
            },
          },
          min: minX,
          max: maxX,
          afterSetDimensions: (scale: any) => {
            const next = {
              width:
                scale.getPixelForValue(maxX) - scale.getPixelForValue(minX),
              left: scale.getPixelForValue(minX),
            };
            if (
              xScalePrevRef.current.left !== next.left ||
              xScalePrevRef.current.width !== next.width
            ) {
              xScalePrevRef.current = next;
              setXScale(next);
            }
          },
        },
        y: {
          grid: {
            tickColor: "black",
          },
          border: {
            color: "black",
          },
          title: {
            display: true,
            text:
              !displayAxialLength && refractiveErrorType
                ? "Refractive Error"
                : "Axial Length (mm)",
            font: {
              size: 16,
            },
          },
          min: minY,
          max: maxY,
        },
        ...(displayAxialLength && refractiveErrorType
          ? {
              y2: {
                grid: {
                  display: false,
                },
                border: {
                  color: "black",
                },
                position: "right" as const,
                title: {
                  display: true,
                  text: `Refractive Error(${refractiveErrorType === "sph" ? "Sph" : "SE"})`,
                  font: {
                    size: 16,
                  },
                },
                min: minY2,
                max: maxY2,
              },
            }
          : {}),
      },
    }),
    [
      isMobile,
      displayAxialLength,
      refractiveErrorType,
      minX,
      maxX,
      minY,
      maxY,
      minY2,
      maxY2,
    ],
  );

  if (!referenceDataset.length) return null;

  let dataset =
    !displayAxialLength && refractiveErrorType
      ? userDataset
      : referenceDataset.concat(userDataset);

  const xRange = maxX - minX;

  return (
    <div style={{ position: "relative", height: "100%", width: "100%" }}>
      <ChartContainer>
        <Scatter
          ref={chartRef}
          options={options}
          data={{
            datasets: dataset,
          }}
        />
      </ChartContainer>
      {treatmentDisplayData.length > 0 && (
        <div
          style={{
            marginLeft: xScale.left,
            position: "relative",
          }}
        >
          {treatmentDisplayData.map((t, index) => {
            const left = ((t.startAge - minX) / xRange) * xScale.width;
            const width = Math.max(
              1,
              ((t.endAge - t.startAge) / xRange) * xScale.width,
            );
            return (
              <div
                key={index}
                style={{
                  position: "relative",
                  width: "100%",
                  height: 6,
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    left: left,
                    width: width,
                    top: 0,
                    height: 2,
                    backgroundColor: theme.primary,
                  }}
                />
                <span
                  style={{
                    position: "absolute",
                    left: left,
                    top: 2,
                    fontSize: 12,
                  }}
                >
                  {t.name}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
