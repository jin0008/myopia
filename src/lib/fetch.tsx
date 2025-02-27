export class HttpError extends Error {
  code: number;
  constructor(code: number, message?: string) {
    super(message);
    this.name = "HttpError";
    this.code = code;
  }
}

export class AuthorizationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AuthorizationError";
  }
}

export async function jsonFetch<T = any>(
  url: RequestInfo | URL,
  options: RequestInit = {},
  body: any = undefined,
  getResponse: boolean = true
) {
  return new Promise<T | null>(async (resolve, reject) => {
    const result = await fetch(
      url,
      Object.assign(
        {
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify(body),
        },
        options
      )
    );
    if (!result.ok) {
      if (result.body) {
        const body = await result.json().catch(() => ({}));
        reject(new HttpError(result.status, body?.message));
      } else {
        reject(new HttpError(result.status));
      }
      return;
    }
    if (!getResponse) {
      resolve(null);
      return;
    }
    result.json().then(resolve).catch(reject);
  });
}

export async function jsonFetchWithSession<T = any>(
  url: RequestInfo | URL,
  options: RequestInit = {},
  body: any = undefined,
  getResponse: boolean = true
) {
  return new Promise<T | null>(async (resolve, reject) => {
    const session_key = localStorage.getItem("session_key");
    if (!session_key) {
      reject(new AuthorizationError("Authorization error"));
    }
    const result = await fetch(
      url,
      Object.assign(
        {
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            Authorization: `Bearer ${session_key}`,
          },
          body: JSON.stringify(body),
        },
        options
      )
    );
    if (result.status === 401) {
      reject(new AuthorizationError("Authorization error"));
      return;
    }
    if (result.status === 403) {
      reject(new AuthorizationError("Authorization error"));
      return;
    }
    if (!result.ok) {
      if (result.body) {
        const body = await result.json().catch(() => ({}));
        reject(new HttpError(result.status, body?.message));
      } else {
        reject(new HttpError(result.status));
      }
      return;
    }
    if (!getResponse) {
      resolve(null);
      return;
    }
    result.json().then(resolve).catch(reject);
  });
}
