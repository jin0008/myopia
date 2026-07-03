import type { TreatmentData } from "../types/treatment";

export const treatments: TreatmentData[] = [
  {
    id: "atropine",
    title: "Low Dose Atropine",
    shortDescription:
      "Eye drops that slow eye growth by affecting retinal and scleral signaling.",
    longDescription:
      "Low Dose Atropine is a pharmacological treatment used to control myopia progression. Unlike the high concentrations used for dilation (1%), low doses (0.01%, 0.05%) minimize side effects while maintaining efficacy. It is often the first line of defense for progressive myopia in children.",
    mechanism:
      "The exact mechanism is complex, but it is believed that atropine acts as a non-selective muscarinic antagonist. It does not control myopia by stopping accommodation (focusing) as previously thought. instead, it influences signaling pathways in the retina and choroid (the vascular layer of the eye). This signaling cascade ultimately instructs the sclera (the white outer coting) to reduce its remodeling and stretching, thereby slowing down the axial elongation of the eyeball.",
    efficacy:
      "Clinical trials like the LAMP (Low-concentration Atropine for Myopia Progression) study have shown profound results. 0.05% atropine has been shown to reduce myopia progression by approximately 67% compared to placebo over two years. Even 0.01% concentrations offer significant benefits, reducing progression by about 27-50% in various studies. It is particularly effective when started early.",
    imageUrl: "/atropine.png",
  },
  {
    id: "dims",
    title: "DIMS Spectacles (MiYOSMART)",
    shortDescription:
      "Specialized eyeglass lenses with hundreds of honeycomb segments to reduce eye growth.",
    longDescription:
      "Defocus Incorporated Multiple Segments (DIMS) technology is a breakthrough in spectacle lens design. These lenses look like regular glasses but contain a central clear zone for sharp vision and a peripheral treatment zone with a honeycomb pattern of tiny lenslets.",
    mechanism:
      "DIMS lenses work on the principle of 'Peripheral Myopic Defocus'. In standard glasses, peripheral light often focuses behind the retina (hyperopic defocus), which stimulates the eye to grow longer to 'catch up' to the image. DIMS lenses project light in the mid-periphery in front of the retina (myopic defocus). This acts as a powerful 'stop signal' to the eye, inhibiting axial elongation while allowing the child to see clearly through the central optical zone.",
    efficacy:
      "Randomized controlled trials have demonstrated exceptional efficacy. Studies indicate that DIMS lenses can slow myopia progression by 52% and reduce axial length elongation by 62% on average compared to single-vision lenses. The effect is sustained over multiple years of wear, making it a highly effective non-invasive option.",
    imageUrl: "/dims.png",
  },
  {
    id: "orthok",
    title: "Orthokeratology (Ortho-K)",
    shortDescription:
      "Rigid contact lenses worn overnight to reshape the cornea and correct vision.",
    longDescription:
      "Orthokeratology, or Ortho-K, involves wearing custom-designed rigid gas permeable contact lenses while sleeping. These lenses gently reshape the front surface of the eye (cornea) overnight, allowing the user to be glass-free during the day.",
    mechanism:
      "Ortho-K corrects myopia by flattening the central cornea, providing clear daytime vision. For myopia control, the key is the mid-peripheral fluid reservoir created by the lens shape. This steepens the mid-peripheral cornea, which, similar to DIMS, focuses peripheral light in front of the retina (peripheral myopic defocus). This optical signal suppresses the stimulus for eye growth.",
    efficacy:
      "Ortho-K is one of the most established methods for myopia control. It consistently demonstrates a slowing of axial elongation by approximately 45-50% compared to spectacles. It is particularly beneficial for active children who want to be free of glasses during sports and daily activities.",
    imageUrl: "/orthok.png",
  },
  {
    id: "halt",
    title: "HALT Technology (Stellest)",
    shortDescription:
      "Lenses with concentric rings of aspherical lenslets to create a volume of myopic defocus.",
    longDescription:
      "Highly Aspherical Lenslet Target (HALT) technology represents the newest generation of myopia control spectacle lenses. It uses a constellation of aspherical lenslets arranged in concentric rings.",
    mechanism:
      "Unlike DIMS which uses distinct focal points, HALT technology creates a 'Volume of Myopic Defocus'. The aspherical lenslets create a continuous signal of light in front of the retina that follows the curvature of the eye. This 3D volume of signal is hypothesized to be a stronger stop signal for eye growth than a single plane of defocus. It keeps the myopia control signal on the retina regardless of eye movement.",
    efficacy:
      "Clinical results for HALT lenses are impressive. A two-year clinical trial showed that when worn for at least 12 hours a day, HALT lenses slowed myopia progression by 67% and axial elongation by 60% compared to single-vision lenses. It is highly comparable to high-dose atropine in efficacy but without the side effects.",
    imageUrl: "/halt.png",
  },
];

// 한국어 콘텐츠. 용어 규칙: Low Dose Atropine = 저농도아트로핀,
// DIMS는 영문 유지(DIMS spectacles = DIMS안경), Orthokeratology(Ortho-K) = 드림렌즈,
// HALT Technology(Stellest) = 에실로 스텔리스트 렌즈.
export const treatmentsKo: TreatmentData[] = [
  {
    id: "atropine",
    title: "저농도아트로핀",
    shortDescription:
      "망막과 공막의 신호전달에 작용하여 안구 성장을 늦추는 점안약입니다.",
    longDescription:
      "저농도아트로핀은 근시 진행을 조절하기 위해 사용되는 약물 치료입니다. 산동에 쓰이는 고농도(1%)와 달리, 저농도(0.01%, 0.05%)는 효과를 유지하면서 부작용을 최소화합니다. 소아의 진행성 근시에서 흔히 1차 치료로 사용됩니다.",
    mechanism:
      "정확한 기전은 복잡하지만, 아트로핀은 비선택적 무스카린 길항제로 작용하는 것으로 알려져 있습니다. 과거의 생각과 달리 조절(초점 맞추기)을 멈춰서 근시를 조절하는 것이 아니라, 망막과 맥락막(눈의 혈관층)의 신호전달 경로에 영향을 줍니다. 이 신호 전달이 결국 공막(눈의 흰 외막)의 재형성과 늘어남을 줄이도록 하여 안구의 축성 성장(안축장 증가)을 늦춥니다.",
    efficacy:
      "LAMP(저농도 아트로핀 근시 진행 억제) 연구와 같은 임상시험에서 뚜렷한 결과가 확인되었습니다. 0.05% 아트로핀은 2년간 위약 대비 근시 진행을 약 67% 줄이는 것으로 나타났습니다. 0.01% 농도도 여러 연구에서 진행을 약 27~50% 줄이는 유의한 효과를 보였습니다. 특히 조기에 시작할수록 효과적입니다.",
    imageUrl: "/atropine.png",
  },
  {
    id: "dims",
    title: "DIMS안경 (MiYOSMART)",
    shortDescription:
      "수백 개의 벌집 모양 미세 렌즈 조각으로 안구 성장을 줄이는 특수 안경 렌즈입니다.",
    longDescription:
      "DIMS(Defocus Incorporated Multiple Segments) 기술은 안경 렌즈 설계의 획기적인 발전입니다. 겉보기에는 일반 안경과 같지만, 선명한 시력을 위한 중심부 투명 구역과 벌집 패턴의 미세 렌즈들이 배열된 주변부 치료 구역으로 구성됩니다.",
    mechanism:
      "DIMS 렌즈는 '주변부 근시성 흐림(Peripheral Myopic Defocus)' 원리로 작동합니다. 일반 안경에서는 주변부 빛이 망막 뒤에 초점을 맺는 경우가 많아(원시성 흐림) 눈이 상을 '따라잡기' 위해 더 길게 자라도록 자극받습니다. DIMS 렌즈는 중간 주변부의 빛을 망막 앞에 맺히게 하여(근시성 흐림) 안구 성장에 강력한 '정지 신호'를 보내고, 동시에 중심 광학부를 통해 선명하게 볼 수 있게 합니다.",
    efficacy:
      "무작위 대조 시험에서 우수한 효과가 입증되었습니다. 연구에 따르면 DIMS 렌즈는 단초점 렌즈 대비 근시 진행을 평균 52%, 안축장 증가를 62% 늦출 수 있습니다. 이 효과는 수년간 착용해도 유지되어, 매우 효과적인 비침습 치료 옵션입니다.",
    imageUrl: "/dims.png",
  },
  {
    id: "orthok",
    title: "드림렌즈",
    shortDescription:
      "밤에 착용하여 각막 형태를 교정해 시력을 회복시키는 하드 콘택트렌즈입니다.",
    longDescription:
      "드림렌즈(각막굴절교정렌즈, Ortho-K)는 수면 중에 맞춤 설계된 산소투과성 하드렌즈를 착용하는 치료입니다. 렌즈가 밤사이 눈의 앞면(각막)을 부드럽게 재형성하여 낮 동안 안경 없이 생활할 수 있게 합니다.",
    mechanism:
      "드림렌즈는 중심부 각막을 평평하게 만들어 낮 동안 선명한 시력을 제공합니다. 근시 억제의 핵심은 렌즈 형태가 만들어내는 중간 주변부의 눈물층입니다. 이로 인해 중간 주변부 각막이 가팔라지고, DIMS와 유사하게 주변부 빛을 망막 앞에 맺히게 하여(주변부 근시성 흐림) 안구 성장 자극을 억제합니다.",
    efficacy:
      "드림렌즈는 근시 억제에서 가장 오래 검증된 방법 중 하나입니다. 안경 대비 안축장 증가를 일관되게 약 45~50% 늦추는 것으로 보고됩니다. 특히 운동이나 일상생활에서 안경 없이 지내고 싶어 하는 활동적인 아이들에게 유용합니다.",
    imageUrl: "/orthok.png",
  },
  {
    id: "halt",
    title: "에실로 스텔리스트 렌즈",
    shortDescription:
      "비구면 미세 렌즈들을 동심원 고리로 배열하여 근시성 흐림의 입체 볼륨을 만드는 렌즈입니다.",
    longDescription:
      "HALT(Highly Aspherical Lenslet Target) 기술은 최신 세대의 근시 억제 안경 렌즈입니다. 동심원 고리 형태로 배열된 비구면 미세 렌즈들의 배열을 사용합니다.",
    mechanism:
      "뚜렷한 초점들을 사용하는 DIMS와 달리, HALT 기술은 '근시성 흐림의 입체 볼륨(Volume of Myopic Defocus)'을 만듭니다. 비구면 미세 렌즈들이 안구 곡률을 따라 망막 앞에 연속적인 빛 신호를 형성합니다. 이 3차원 신호 볼륨은 단일 평면의 흐림보다 더 강한 성장 정지 신호로 작용하는 것으로 추정되며, 눈이 움직여도 근시 억제 신호가 망막 위에 유지됩니다.",
    efficacy:
      "임상 결과는 인상적입니다. 2년 임상시험에서 하루 12시간 이상 착용 시 단초점 렌즈 대비 근시 진행을 67%, 안축장 증가를 60% 늦추는 것으로 나타났습니다. 효과 면에서 고농도 아트로핀에 필적하면서도 그 부작용이 없습니다.",
    imageUrl: "/halt.png",
  },
];

/** 현재 언어에 맞는 치료 데이터 반환 ("ko" → 한국어, 그 외 → 영어). */
export function getTreatments(language: string): TreatmentData[] {
  return language === "ko" ? treatmentsKo : treatments;
}
