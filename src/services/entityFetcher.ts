import { supabase } from '../lib/supabase';
import { EntityNode } from './types';

/**
 * Handles fetching entity data from the database
 */
export class EntityFetcher {
  /**
   * Fetches all entities from feature_entities table in batches
   */
  static async fetchAllEntities(): Promise<EntityNode[]> {
    console.log('📦 Fetching entities in batches of 1000…');
    
    const batchSize = 1000;
    let offset = 0;
    let allEntities: EntityNode[] = [];
    let hasMore = true;

    while (hasMore) {
      console.log(`  • fetching rows ${offset}–${offset + batchSize - 1}`);
      
      const { data, error } = await supabase
        .from('feature_entities')
        .select('entity_name, entity_type, feature_id')
        .range(offset, offset + batchSize - 1)
        .order('id');

      if (error) {
        console.error('Error fetching entities:', error);
        throw error;
      }

      if (!data || data.length === 0) {
        hasMore = false;
      } else {
        allEntities = allEntities.concat(data);
        offset += batchSize;
        
        if (data.length < batchSize) {
          hasMore = false;
        }
      }
    }

    console.log(`✅ Fetched a total of ${allEntities.length} entity mentions.`);
    return allEntities;
  }
}