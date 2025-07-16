import { NetworkLink } from '../types/database';
import { RelationshipCalculator } from './relationshipCalculator';

/**
 * Builds network links from relationship data
 */
export class NetworkLinkBuilder {
  /**
   * Creates network links from entity relationships
   */
  static async createNetworkLinks(): Promise<NetworkLink[]> {
    console.log('=== NETWORK LINKS CREATION ===');
    
    const relationships = await RelationshipCalculator.calculateEntityRelationships();
    
    const networkLinks: NetworkLink[] = relationships.map(rel => ({
      source: rel.entity1,
      target: rel.entity2,
      strength: rel.co_occurrence_count,
      shared_feature_ids: rel.shared_feature_ids
    }));
    
    console.log(`🔗 Network links created: ${networkLinks.length}`);
    console.log('📊 Link strength distribution:', 
      networkLinks.reduce((acc, link) => {
        if (link.strength === 1) acc['Strength 1']++;
        else if (link.strength <= 5) acc['Strength 2-5']++;
        else acc['Strength 6+']++;
        return acc;
      }, { 'Strength 1': 0, 'Strength 2-5': 0, 'Strength 6+': 0 })
    );
    
    console.log('🏆 Top 10 strongest links:', 
      networkLinks
        .sort((a, b) => b.strength - a.strength)
        .slice(0, 10)
        .map(l => ({ source: l.source, target: l.target, strength: l.strength }))
    );
    
    console.log('=== END NETWORK LINKS CREATION ===');
    return networkLinks;
  }
}