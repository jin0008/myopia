import { jsonFetchWithSession } from "../lib/fetch";
import { API_ROOT } from "./root";

export interface ExpertColumn {
  id: string;
  slug: string;
  title: string;
  body: string;
  category: string;
  author: string;
  author_role: string;
  thumbnail_emoji: string;
  published: boolean;
  published_at: string;
  created_at: string;
  updated_at: string;
}

export interface ColumnInput {
  title: string;
  body: string;
  category: string;
  author?: string;
  author_role?: string;
  thumbnail_emoji?: string;
  published?: boolean;
}

export function listColumns(): Promise<ExpertColumn[]> {
  return jsonFetchWithSession(API_ROOT + "/column");
}

export function getColumn(id: string): Promise<ExpertColumn> {
  return jsonFetchWithSession(API_ROOT + "/column/" + id);
}

export function createColumn(data: ColumnInput): Promise<ExpertColumn> {
  return jsonFetchWithSession(API_ROOT + "/column", { method: "POST" }, data);
}

export function updateColumn(
  id: string,
  data: Partial<ColumnInput>,
): Promise<ExpertColumn> {
  return jsonFetchWithSession(API_ROOT + "/column/" + id, { method: "PATCH" }, data);
}

export function deleteColumn(id: string): Promise<void> {
  return jsonFetchWithSession(
    API_ROOT + "/column/" + id,
    { method: "DELETE" },
    undefined,
    false,
  );
}
