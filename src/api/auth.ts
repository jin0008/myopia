import {
  AuthorizationError,
  jsonFetch,
  jsonFetchWithSession,
} from "../lib/fetch";
import { API_ROOT } from "./root";

export function passwordLogin(username: string, password: string) {
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

export function googleLogin(idToken: string) {
  return jsonFetch(
    API_ROOT + "/auth/googleLogin",
    {
      method: "POST",
    },
    {
      token: idToken,
    }
  ).then((res) => {
    localStorage.setItem("session_key", res.session_key);
    return res;
  });
}

export function signupWithPasswordAuth(username: string, password: string) {
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

export function signupWithGoogleAuth(idToken: string) {
  return jsonFetch(
    API_ROOT + "/auth/user/googleAuth",
    {
      method: "POST",
    },
    {
      token: idToken,
    },
    false
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
    false
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
    false
  );
}

export function removePasswordAuth() {
  return jsonFetchWithSession(
    API_ROOT + "/auth/passwordAuth",
    {
      method: "DELETE",
    },
    undefined,
    false
  );
}

export function removeGoogleAuth() {
  return jsonFetchWithSession(
    API_ROOT + "/auth/googleAuth",
    {
      method: "DELETE",
    },
    undefined,
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
    false
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
    false
  ).then(() => {
    localStorage.removeItem("session_key");
    localStorage.removeItem("role");
  });
}
