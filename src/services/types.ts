export interface EntityNode {
  entity_name: string;
  entity_type: string;
  feature_id: number;
}

export interface EntityLink {
  entity1: string;
  entity2: string;
  co_occurrence_count: number;
  shared_feature_ids: string[];
}

export interface NetworkData {
  nodes: EntityNode[];
  links: EntityLink[];
}

export interface EntityRelationship {
  entity1: string;
  entity2: string;
  co_occurrence_count: number;
  shared_feature_ids: string[];
}