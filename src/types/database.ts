export interface NetworkNode {
  id: string;
  name: string;
  type: 'PERSON' | 'LOCATION' | 'ORGANIZATION';
  size: number;
  color: string;
  connections: number;
  feature_ids: string[];
  // Optional position properties for graph state caching
  x?: number;
  y?: number;
  fx?: number; // Fixed x position
  fy?: number; // Fixed y position
}

export interface NetworkLink {
  source: string;
  target: string;
  strength: number;
  shared_feature_ids: string[];
}

export interface TopicNode {
  id: string;
  name: string;
  type: 'CLASS' | 'TOPIC';
  parent_id?: string;
  size: number;
  color: string;
  feature_ids: string[];
  entity_names: string[];
  connections: number;
}

export interface TopicLink {
  source: string;
  target: string;
  strength: number;
  type: 'HIERARCHY' | 'CO_OCCURRENCE';
  shared_entities?: string[];
}