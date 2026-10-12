import {
  AuthorizationError,
  jsonFetch,
  jsonFetchWithSession,
} from "../lib/fetch";
import { API_ROOT } from "./root";

/**
 * 로그인은 두 단계다. 아이디·비밀번호(또는 Google)가 맞으면 세션 대신
 * 다음 단계와 10분짜리 티켓이 온다. 세션은 2단계 코드까지 맞은 뒤에만 온다.
 */
export type LoginStep = {
  next: "change_password" | "setup_2fa" | "verify_2fa";
  ticket: string;
};
/** "이 브라우저 기억하기"로 2단계를 건너뛰면 바로 세션이 온다. */
export type LoginResult = LoginStep | { next: "signed_in"; session_key: string };

/* 기억해 둔 브라우저 토큰. 한 PC 를 여러 사람이 쓸 수 있어 몇 개를 둔다.
 * 로그인할 때 모두 보내고, 서버가 그 사람 것만 받아들인다. */
const DEVICE_KEY = "trusted_devices";
function deviceTokens(): string[] {
  try {
    const v = JSON.parse(localStorage.getItem(DEVICE_KEY) ?? "[]");
    return Array.isArray(v) ? v.filter((x) => typeof x === "string") : [];
  } catch {
    return [];
  }
}
function rememberDeviceToken(token: string | null | undefined) {
  if (!token) return;
  localStorage.setItem(DEVICE_KEY, JSON.stringify([token, ...deviceTokens()].slice(0, 5)));
}

const post = <T,>(path: string, body: unknown) =>
  jsonFetch<T>(API_ROOT + path, { method: "POST" }, body) as Promise<T>;

function keepSession<T extends { session_key: string }>(res: T): T {
  localStorage.setItem("session_key", res.session_key);
  return res;
}

function signedInOrStep(res: LoginResult): LoginResult {
  if (res.next === "signed_in") keepSession(res);
  return res;
}

export function passwordLogin(username: string, password: string) {
  return post<LoginResult>("/auth/passwordLogin", {
    username,
    password,
    deviceTokens: deviceTokens(),
  }).then(signedInOrStep);
}

export function googleLogin(idToken: string) {
  return post<LoginResult>("/auth/googleLogin", {
    token: idToken,
    deviceTokens: deviceTokens(),
  }).then(signedInOrStep);
}

/** 지금 비밀번호가 새 규칙에 안 맞을 때, 로그인 중에 바꾼다. */
export function changePasswordAtLogin(ticket: string, newPassword: string) {
  return post<LoginStep>("/auth/login/password", { ticket, newPassword });
}

export function startTwoFactorSetup(ticket: string) {
  return post<{ secret: string; otpauthUrl: string }>("/auth/2fa/setup", { ticket });
}

export function confirmTwoFactorSetup(ticket: string, code: string, rememberDevice: boolean) {
  return post<{ session_key: string; backupCodes: string[]; deviceToken: string | null }>(
    "/auth/2fa/setup/confirm",
    { ticket, code, rememberDevice },
  ).then((r) => {
    rememberDeviceToken(r.deviceToken);
    return keepSession(r);
  });
}

/** code: 인증 앱의 6자리 또는 백업 코드. */
export function verifyTwoFactor(ticket: string, code: string, rememberDevice: boolean) {
  return post<{ session_key: string; backupCodesLeft: number | null; deviceToken: string | null }>(
    "/auth/2fa/verify",
    { ticket, code, rememberDevice },
  ).then((r) => {
    rememberDeviceToken(r.deviceToken);
    return keepSession(r);
  });
}

export function sendPasswordResetCode(email: string) {
  return post("/auth/password/send-code", { email });
}

export function verifyPasswordResetCode(email: string, code: string) {
  // 아이디도 같이 온다. 메일 주인임을 증명했으니 아이디 찾기를 겸한다.
  return post<{ ticket: string; username: string | null }>("/auth/password/verify-code", {
    email,
    code,
  });
}

export function resetPassword(email: string, ticket: string, password: string) {
  return post("/auth/password/reset", { email, ticket, password });
}

/** 사이트 관리자: 폰과 백업 코드를 모두 잃은 사람의 2단계 인증을 지운다. */
export function adminResetTwoFactor(userId: string) {
  return jsonFetchWithSession(
    API_ROOT + `/auth/admin/users/${userId}/2fa/reset`,
    { method: "POST" },
    {},
    false,
  );
}

/** 서버 규칙과 같은 문장. 입력 칸 아래에 미리 보여 준다. */
export const PASSWORD_RULE =
  "At least 8 characters with an uppercase letter, a lowercase letter, a number and a special character.";

export interface SignupConsents {
  agree_terms: true;
  agree_privacy: true;
  agree_marketing: boolean;
}

export function signupWithPasswordAuth(
  username: string,
  password: string,
  email: string,
  consents: SignupConsents,
) {
  return jsonFetch(
    API_ROOT + "/auth/user/passwordAuth",
    {
      method: "POST",
    },
    {
      username,
      password,
      email,
      receive_email_updates: consents.agree_marketing,
      ...consents,
    },
    false,
  );
}

export function signupWithGoogleAuth(idToken: string, consents: SignupConsents) {
  return jsonFetch(
    API_ROOT + "/auth/user/googleAuth",
    {
      method: "POST",
    },
    {
      token: idToken,
      receive_email_updates: consents.agree_marketing,
      ...consents,
    },
    false,
  );
}

// Records consent for an already-logged-in user (existing-user re-consent).
export function submitConsent(consents: SignupConsents) {
  return jsonFetchWithSession(
    API_ROOT + "/auth/consent",
    {
      method: "POST",
    },
    consents,
    false,
  );
}

export function addPasswordAuth(username: string, password: string) {
  return jsonFetchWithSession(
    API_ROOT + "/auth/passwordAuth",
    {
      method: "POST",
    },
    {
      username,
      password,
    },
    false,
  );
}

export function addGoogleAuth(idToken: string) {
  return jsonFetchWithSession(
    API_ROOT + "/auth/googleAuth",
    {
      method: "POST",
    },
    {
      token: idToken,
    },
    false,
  );
}

export function removePasswordAuth() {
  return jsonFetchWithSession(
    API_ROOT + "/auth/passwordAuth",
    {
      method: "DELETE",
    },
    undefined,
    false,
  );
}

export function removeGoogleAuth() {
  return jsonFetchWithSession(
    API_ROOT + "/auth/googleAuth",
    {
      method: "DELETE",
    },
    undefined,
    false,
  );
}

export function editSelf(email?: string, receive_email_updates?: boolean) {
  return jsonFetchWithSession(
    API_ROOT + "/auth/user",
    {
      method: "PATCH",
    },
    { email, receive_email_updates },
    false,
  );
}

export function logout() {
  return jsonFetchWithSession(
    API_ROOT + "/auth/logout",
    {
      method: "GET",
    },
    undefined,
    false,
  ).then(() => {
    localStorage.removeItem("session_key");
    localStorage.removeItem("role");
  });
}

export function changePassword(newPassword: string) {
  return jsonFetchWithSession(
    API_ROOT + "/auth/user/passwordAuth",
    {
      method: "PATCH",
    },
    {
      newPassword,
    },
    false,
  );
}

export function getCurrentUser() {
  return jsonFetchWithSession(API_ROOT + "/auth/user").catch((err) => {
    if (err instanceof AuthorizationError) return null;
  });
}

export function deleteAccount() {
  return jsonFetchWithSession(
    API_ROOT + "/auth/user",
    {
      method: "DELETE",
    },
    undefined,
    false,
  ).then(() => {
    localStorage.removeItem("session_key");
    localStorage.removeItem("role");
  });
}
