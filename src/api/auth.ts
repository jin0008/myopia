import {
  AuthorizationError,
  jsonFetch,
  jsonFetchWithSession,
} from "../lib/fetch";
import { API_ROOT } from "./root";

export function login(username: string, password: string) {
  return jsonFetch(
    API_ROOT + "/auth/passwordLogin",
    {
      method: "POST",
    },
    {
      username,
      password,
    }
  ).then((res) => {
    localStorage.setItem("session_key", res.session_key);
    return res;
  });
}

export function signup(username: string, password: string) {
  return jsonFetch(
    API_ROOT + "/auth/user/passwordAuth",
    {
      method: "POST",
    },
    {
      username,
      password,
    },
    false
  );
}

export function logout() {
  return jsonFetchWithSession(
    API_ROOT + "/auth/logout",
    {
      method: "GET",
    },
    undefined,
    false
  ).then(() => {
    localStorage.removeItem("session_key");
  });
}

export function getCurrentUser() {
  return jsonFetchWithSession(API_ROOT + "/auth/user").catch((err) => {
    if (err instanceof AuthorizationError) return null;
  });
}
