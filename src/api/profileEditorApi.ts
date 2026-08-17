import {
  createOwnHospitalNotice,
  deleteOwnHospitalNotice,
  getOwnHospitalProfile,
  listOwnHospitalNotices,
  saveOwnHospitalProfile,
  searchOwnHospitalPlaces,
  updateOwnHospitalNotice,
  uploadOwnHospitalImage,
  uploadOwnHospitalImages,
  type HospitalNotice,
  type HospitalNoticeInput,
} from "./hospitalProfile";
import {
  createPartnerNotice,
  deletePartnerNotice,
  getPartnerProfile,
  listPartnerNotices,
  savePartnerProfile,
  searchPartnerPlaces,
  updatePartnerNotice,
  uploadPartnerImage,
  uploadPartnerImages,
  type PartnerProfileInput,
} from "./partner";
import type { PlaceResult } from "../components/PlacePicker";

/**
 * 병원 소개 편집 화면이 쓰는 API 묶음.
 *
 * 같은 화면을 두 부류가 쓴다. myopia를 쓰는 병원은 원래 계정으로, 그렇지 않은
 * 병원은 파트너 계정으로 들어온다. 화면을 둘로 나누면 앞으로 필드를 추가할
 * 때마다 두 곳을 고쳐야 하고, 한쪽만 고치는 실수가 반드시 나온다. 그래서
 * 화면은 하나로 두고 들어온 문에 따라 이 묶음만 갈아 끼운다.
 */
export interface ProfileEditorApi {
  /** 진입 경로. 화면 문구를 가르는 데만 쓴다. */
  mode: "partner" | "hospital";
  getProfile: () => Promise<any>;
  saveProfile: (data: PartnerProfileInput) => Promise<unknown>;
  searchPlaces: (q: string) => Promise<{ places: PlaceResult[] }>;
  uploadImages: (files: File[]) => Promise<{ urls: string[] }>;
  uploadImage: (file: File) => Promise<{ url: string }>;
  listNotices: () => Promise<{ notices: HospitalNotice[] }>;
  createNotice: (data: HospitalNoticeInput) => Promise<{ id: string }>;
  updateNotice: (id: string, data: Partial<HospitalNoticeInput>) => Promise<{ ok: boolean }>;
  deleteNotice: (id: string) => Promise<void>;
}

/** 파트너 계정 — myodoc에만 가입한 병원. */
export const partnerApi: ProfileEditorApi = {
  mode: "partner",
  getProfile: getPartnerProfile,
  saveProfile: savePartnerProfile,
  searchPlaces: searchPartnerPlaces,
  uploadImages: uploadPartnerImages,
  uploadImage: uploadPartnerImage,
  listNotices: listPartnerNotices,
  createNotice: createPartnerNotice,
  updateNotice: updatePartnerNotice,
  deleteNotice: deletePartnerNotice,
};

/** myopia 병원 관리자 — 진료 계정 그대로 쓴다. */
export const hospitalApi: ProfileEditorApi = {
  mode: "hospital",
  getProfile: getOwnHospitalProfile,
  saveProfile: saveOwnHospitalProfile,
  searchPlaces: searchOwnHospitalPlaces,
  uploadImages: uploadOwnHospitalImages,
  uploadImage: uploadOwnHospitalImage,
  listNotices: listOwnHospitalNotices,
  createNotice: createOwnHospitalNotice,
  updateNotice: updateOwnHospitalNotice,
  deleteNotice: deleteOwnHospitalNotice,
};
