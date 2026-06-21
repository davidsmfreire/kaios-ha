export interface EntityState {
  entity_id: string;
  state: string;
  attributes: Record<string, unknown>;
  last_changed?: string;
  last_updated?: string;
}

export interface ServiceCall {
  domain: string;
  service: string;
  data: Record<string, unknown>;
}
