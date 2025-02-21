export async function jsonFetch(
  url: RequestInfo | URL,
  options: RequestInit = {}
) {
  const res = await fetch(
    url,
    Object.assign(
      {
        headers: {
          "Content-Type": "application/json",
        },
      },
      options
    )
  );
  return await res.json();
}
