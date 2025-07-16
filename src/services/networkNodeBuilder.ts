import { NetworkNode } from '../types/database';
import { EntityFetcher } from './entityFetcher';
import { RelationshipCalculator } from './relationshipCalculator';
import { EntityNormalizer } from './entityNormalizer';

/**
 * Builds network nodes from entity data
 */
export class NetworkNodeBuilder {
  /**
   * Creates network nodes from feature_entities data
   */
  static async createNetworkNodes(): Promise<NetworkNode[]> {
    console.log('=== NETWORK NODES CREATION ===');
    console.log('Creating network nodes from feature_entities...');
    
    const allEntities = await EntityFetcher.fetchAllEntities();
    
    console.log(`📊 Raw entity mentions from database (no pre-filtering): ${allEntities.length}`);
    
    console.log('🔄 Creating unique entity map by entity_name...');
    const uniqueEntities = new Map<string, {
      name: string;
      type: string;
      feature_ids: string[];
    }>();
    
    // Group by entity name and collect all feature_ids
    allEntities.forEach(entity => {
      const name = entity.entity_name;
      if (!uniqueEntities.has(name)) {
        uniqueEntities.set(name, {
          name,
          type: entity.entity_type,
          feature_ids: []
        });
      }
      uniqueEntities.get(name)!.feature_ids.push(entity.feature_id.toString());
    });
    
    console.log(`🔄 Unique entities created: ${uniqueEntities.size}`);
    console.log('📊 Unique entity type distribution:', 
      Array.from(uniqueEntities.values()).reduce((acc, entity) => {
        const normalizedType = EntityNormalizer.normalizeEntityType(entity.type);
        const displayType = normalizedType === 'PERSON' ? 'People' : 
                           normalizedType === 'LOCATION' ? 'Locations' : 'Organizations';
        acc[displayType] = (acc[displayType] || 0) + 1;
        return acc;
      }, {} as Record<string, number>)
    );
    
    console.log('⚡ Calculating relationships for connection counts...');
    const relationships = await RelationshipCalculator.calculateEntityRelationships();
    
    console.log(`⚡ Relationships calculated: ${relationships.length}`);
    
    console.log('🔗 Counting connections for each entity...');
    const connectionCounts = new Map<string, number>();
    
    // Initialize all entities with 0 connections
    uniqueEntities.forEach((_, entityName) => {
      connectionCounts.set(entityName, 0);
    });
    
    // Count connections from relationships
    relationships.forEach(rel => {
      connectionCounts.set(rel.entity1, (connectionCounts.get(rel.entity1) || 0) + 1);
      connectionCounts.set(rel.entity2, (connectionCounts.get(rel.entity2) || 0) + 1);
    });
    
    console.log('🔗 Connection counts calculated');
    console.log('📊 Connection distribution:', 
      Array.from(connectionCounts.values()).reduce((acc, count) => {
        if (count === 0) acc['No connections']++;
        else if (count <= 5) acc['1-5 connections']++;
        else if (count <= 10) acc['6-10 connections']++;
        else acc['11+ connections']++;
        return acc;
      }, { 'No connections': 0, '1-5 connections': 0, '6-10 connections': 0, '11+ connections': 0 })
    );
    
    console.log('🎯 Creating final network nodes...');
    const networkNodes: NetworkNode[] = Array.from(uniqueEntities.values()).map(entity => {
      const normalizedType = EntityNormalizer.normalizeEntityType(entity.type);
      const connections = connectionCounts.get(entity.name) || 0;
      
      return {
        id: entity.name,
        name: entity.name,
        type: normalizedType as 'PERSON' | 'LOCATION' | 'ORGANIZATION',
        size: Math.max(10, Math.min(50, 10 + connections * 2)),
        color: normalizedType === 'PERSON' ? '#60a5fa' : 
               normalizedType === 'LOCATION' ? '#34d399' : '#f59e0b',
        connections,
        feature_ids: entity.feature_ids
      };
    });
    
    console.log(`🎯 Final network nodes created: ${networkNodes.length}`);
    console.log('📊 Final node statistics:');
    console.log(`  - Nodes with connections > 0: ${networkNodes.filter(n => n.connections > 0).length}`);
    console.log(`  - Nodes with 0 connections: ${networkNodes.filter(n => n.connections === 0).length}`);
    console.log('  - Final entity type distribution:', 
      networkNodes.reduce((acc, node) => {
        acc[node.type] = (acc[node.type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>)
    );
    
    console.log('🏆 Top 10 entities by connections:', 
      networkNodes
        .sort((a, b) => b.connections - a.connections)
        .slice(0, 10)
        .map(n => ({ name: n.name, type: n.type, connections: n.connections }))
    );
    
    console.log('=== END NETWORK NODES CREATION ===');
    return networkNodes;
  }
}