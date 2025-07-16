import { supabase } from '../lib/supabase';

export interface EntityConnection {
  entityName: string;
  entityType: string;
  coOccurrenceCount: number;
}

export interface ConnectionsByType {
  people: EntityConnection[];
  locations: EntityConnection[];
  organizations: EntityConnection[];
}

/**
 * Service for fetching entity connections and co-occurrences
 */
export class EntityConnectionService {
  /**
   * Get the top 3 most frequently co-occurring entities for a given entity
   */
  static async getTopConnections(entityName: string): Promise<ConnectionsByType> {
    console.log(`🔍 CONNECTIONS: Finding top connections for "${entityName}"`);
    
    try {
      // Step 1: Get all feature_ids where this entity appears
      const { data: entityFeatures, error: entityError } = await supabase
        .from('feature_entities')
        .select('feature_id')
        .eq('entity_name', entityName);

      if (entityError) {
        console.error('Error fetching entity features:', entityError);
        return { people: [], locations: [], organizations: [] };
      }

      if (!entityFeatures || entityFeatures.length === 0) {
        console.log(`📊 No features found for entity: ${entityName}`);
        return { people: [], locations: [], organizations: [] };
      }

      const featureIds = entityFeatures.map(f => f.feature_id);
      console.log(`📊 Found ${featureIds.length} features for "${entityName}"`);

      // Step 2: Get all other entities that appear in the same features
      const { data: coOccurringEntities, error: coOccurringError } = await supabase
        .from('feature_entities')
        .select('entity_name, entity_type')
        .in('feature_id', featureIds)
        .neq('entity_name', entityName); // Exclude the entity itself

      if (coOccurringError) {
        console.error('Error fetching co-occurring entities:', coOccurringError);
        return { people: [], locations: [], organizations: [] };
      }

      if (!coOccurringEntities || coOccurringEntities.length === 0) {
        console.log(`📊 No co-occurring entities found for "${entityName}"`);
        return { people: [], locations: [], organizations: [] };
      }

      console.log(`📊 Found ${coOccurringEntities.length} co-occurring entity mentions`);

      // Step 3: Count co-occurrences for each unique entity
      const entityCounts = new Map<string, { entityType: string; count: number }>();
      
      coOccurringEntities.forEach(entity => {
        const key = entity.entity_name;
        if (entityCounts.has(key)) {
          entityCounts.get(key)!.count++;
        } else {
          entityCounts.set(key, {
            entityType: entity.entity_type,
            count: 1
          });
        }
      });

      console.log(`📊 Found ${entityCounts.size} unique co-occurring entities`);

      // Step 4: Convert to array and sort by count
      const sortedConnections: EntityConnection[] = Array.from(entityCounts.entries())
        .map(([entityName, data]) => ({
          entityName,
          entityType: this.normalizeEntityType(data.entityType),
          coOccurrenceCount: data.count
        }))
        .sort((a, b) => b.coOccurrenceCount - a.coOccurrenceCount);

      console.log(`📊 Top 10 connections:`, 
        sortedConnections.slice(0, 10).map(c => ({ 
          name: c.entityName, 
          type: c.entityType, 
          count: c.coOccurrenceCount 
        }))
      );

      // Step 5: Group by normalized entity type and take top 3 of each
      const result: ConnectionsByType = {
        people: sortedConnections.filter(c => c.entityType === 'PERSON'),
        locations: sortedConnections.filter(c => c.entityType === 'LOCATION'),
        organizations: sortedConnections.filter(c => c.entityType === 'ORGANIZATION')
      };

      console.log(`📊 FINAL RESULT:`, {
        people: result.people.length,
        locations: result.locations.length,
        organizations: result.organizations.length
      });

      return result;

    } catch (error) {
      console.error('Error in getTopConnections:', error);
      return { people: [], locations: [], organizations: [] };
    }
  }

  /**
   * Normalize entity type to standard format
   */
  private static normalizeEntityType(entityType: string): 'PERSON' | 'LOCATION' | 'ORGANIZATION' {
    if (!entityType) return 'ORGANIZATION';
    
    const type = entityType.toUpperCase().trim();
    
    // Handle your database's actual entity types
    if (type === 'PEOPLE') return 'PERSON';
    if (type === 'LOCATIONS') return 'LOCATION';
    if (type === 'ORGANIZATIONS') return 'ORGANIZATION';
    
    // Handle common variations
    if (type.includes('PERSON') || type.includes('PER') || type === 'PEOPLE') {
      return 'PERSON';
    }
    
    if (type.includes('LOCATION') || type.includes('LOC') || type.includes('PLACE') || type === 'LOCATIONS') {
      return 'LOCATION';
    }
    
    if (type.includes('ORG') || type.includes('COMPANY') || type.includes('INSTITUTION') || type === 'ORGANIZATIONS') {
      return 'ORGANIZATION';
    }
    
    // Default fallback
    return 'ORGANIZATION';
  }
}