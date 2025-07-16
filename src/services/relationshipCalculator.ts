import { EntityNode, EntityRelationship } from './types';
import { EntityFetcher } from './entityFetcher';

/**
 * Calculates relationships between entities based on shared feature_ids
 */
export class RelationshipCalculator {
  /**
   * Calculates entity relationships based on shared feature_ids
   */
  static async calculateEntityRelationships(): Promise<EntityRelationship[]> {
    console.log('=== ENTITY RELATIONSHIP CALCULATION ===');
    console.log('🔗 Calculating entity relationships based on shared feature_ids (no pre-filtering)...');
    
    const allEntities = await EntityFetcher.fetchAllEntities();
    
    console.log(`📊 Processing ${allEntities.length} entity mentions for relationships (no pre-filtering)`);
    
    console.log('📊 Grouping entities by feature_id...');
    const entitiesByFeature = new Map<number, EntityNode[]>();
    
    allEntities.forEach(entity => {
      if (!entitiesByFeature.has(entity.feature_id)) {
        entitiesByFeature.set(entity.feature_id, []);
      }
      entitiesByFeature.get(entity.feature_id)!.push(entity);
    });
    
    console.log('📊 Grouping result:');
    console.log(`  - Feature IDs with entities: ${entitiesByFeature.size}`);
    console.log('  - Sample feature IDs with entity counts:', 
      Array.from(entitiesByFeature.entries()).slice(0, 5).map(([featureId, entities]) => ({
        featureId,
        entityCount: entities.length,
        sampleEntities: entities.slice(0, 2).map(e => e.entity_name)
      }))
    );
    
    console.log('🔗 Calculating co-occurrences based on shared feature_ids...');
    const coOccurrences = new Map<string, {
      entity1: string;
      entity2: string;
      count: number;
      shared_feature_ids: Set<number>;
    }>();
    
    // For each feature_id, find all pairs of entities
    entitiesByFeature.forEach((entities, featureId) => {
      if (entities.length < 2) return;
      
      // Create pairs of entities within this feature
      for (let i = 0; i < entities.length; i++) {
        for (let j = i + 1; j < entities.length; j++) {
          const entity1 = entities[i].entity_name;
          const entity2 = entities[j].entity_name;
          
          if (entity1 === entity2) continue;
          
          // Create a consistent key (alphabetical order)
          const key = entity1 < entity2 ? `${entity1}|${entity2}` : `${entity2}|${entity1}`;
          const [sortedEntity1, sortedEntity2] = entity1 < entity2 ? [entity1, entity2] : [entity2, entity1];
          
          if (!coOccurrences.has(key)) {
            coOccurrences.set(key, {
              entity1: sortedEntity1,
              entity2: sortedEntity2,
              count: 0,
              shared_feature_ids: new Set()
            });
          }
          
          const occurrence = coOccurrences.get(key)!;
          occurrence.count++;
          occurrence.shared_feature_ids.add(featureId);
        }
      }
    });
    
    console.log(`🔗 Relationships calculated: ${coOccurrences.size}`);
    
    console.log('🎯 Finalizing relationships...');
    const relationships: EntityRelationship[] = Array.from(coOccurrences.values()).map(occ => ({
      entity1: occ.entity1,
      entity2: occ.entity2,
      co_occurrence_count: occ.count,
      shared_feature_ids: Array.from(occ.shared_feature_ids).map(id => id.toString())
    }));
    
    console.log(`🎯 Final relationships: ${relationships.length}`);
    console.log('📊 Co-occurrence distribution:');
    console.log(`  - 1 shared feature_id: ${relationships.filter(r => r.co_occurrence_count === 1).length}`);
    console.log(`  - 2-5 shared feature_ids: ${relationships.filter(r => r.co_occurrence_count >= 2 && r.co_occurrence_count <= 5).length}`);
    console.log(`  - 6+ shared feature_ids: ${relationships.filter(r => r.co_occurrence_count >= 6).length}`);
    
    console.log('🏆 Top 10 relationships by co-occurrence count:', 
      relationships
        .sort((a, b) => b.co_occurrence_count - a.co_occurrence_count)
        .slice(0, 10)
        .map(r => ({ entity1: r.entity1, entity2: r.entity2, count: r.co_occurrence_count }))
    );
    
    console.log('=== END RELATIONSHIP CALCULATION ===');
    return relationships;
  }
}