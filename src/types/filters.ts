export interface FilterOptions {
  countries: string[];
  entities: EntityOption[];
  topics: TopicOption[];
  dateRange: DateRange;
}

export interface EntityOption {
  name: string;
  type: string;
  count: number;
}

export interface TopicOption {
  metaGroup: string;
  subGroup: string;
  topic: string;
  count: number;
}

export interface DateRange {
  start: Date | null;
  end: Date | null;
}

export interface ActiveFilters {
  countries: string[];
  entities: EntityOption[];
  topics: TopicOption[];
  dateRange: DateRange;
}

export interface NewsFilters {
  countries?: string[];
  entityNames?: string[];
  entityTypes?: string[];
  metaGroups?: string[];
  subGroups?: string[];
  topics?: string[];
  startDate?: string;
  endDate?: string;
} 