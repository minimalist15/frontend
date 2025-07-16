import { supabase } from '../lib/supabase';
import { TopicNode, TopicLink } from '../types/database';

export interface TopicNetworkData {
  nodes: TopicNode[];
  links: TopicLink[];
}

/**
 * Service for fetching and processing topic network data
 */
export class TopicService {
  /**
   * Get the complete topic network data including classes and individual topics
   */
  static async getTopicNetworkData(): Promise<TopicNetworkData> {
    console.log('=== TOPIC NETWORK DATA CREATION ===');
    
    try {
      // Step 1: Fetch topic groups (classes)
      const { data: topicGroups, error: groupsError } = await supabase
        .from('meta_topic_groups')
        .select('id, label, description, created_at');

      if (groupsError) {
        console.error('Error fetching topic groups:', groupsError);
        throw groupsError;
      }

      console.log(`📊 Found ${topicGroups?.length || 0} topic groups`);

      // Step 2: Fetch topic group members with their topics
      const { data: groupMembers, error: membersError } = await supabase
        .from('meta_topic_group_members')
        .select('id, group_id, feature_id, topic, news_id, subnews_id, justification, created_at');

      if (membersError) {
        console.error('Error fetching group members:', membersError);
        throw membersError;
      }

      console.log(`📊 Found ${groupMembers?.length || 0} topic assignments`);

      // Step 3: Get entities for each feature_id
      const featureIds = [...new Set(groupMembers?.map(m => m.feature_id) || [])];
      console.log(`📊 Fetching entities for ${featureIds.length} unique features`);

      const { data: featureEntities, error: entitiesError } = await supabase
        .from('feature_entities')
        .select('feature_id, entity_name, entity_type')
        .in('feature_id', featureIds);

      if (entitiesError) {
        console.error('Error fetching feature entities:', entitiesError);
        throw entitiesError;
      }

      console.log(`📊 Found ${featureEntities?.length || 0} entity associations`);

      // Step 4: Process the data
      const nodes: TopicNode[] = [];
      const links: TopicLink[] = [];

      // Create topic class nodes
      const topicClassNodes = new Map<number, TopicNode>();
      (topicGroups || []).forEach(group => {
        const classNode: TopicNode = {
          id: `class_${group.id}`,
          name: group.label,
          type: 'CLASS',
          size: 40,
          color: '#8b5cf6', // Purple for classes
          feature_ids: [],
          entity_names: [],
          connections: 0
        };
        topicClassNodes.set(group.id, classNode);
        nodes.push(classNode);
      });

      // Create individual topic nodes and collect entity data
      const topicNodes = new Map<string, TopicNode>();
      const topicToEntities = new Map<string, Set<string>>();
      const topicToClass = new Map<string, number>();

      (groupMembers || []).forEach(member => {
        const topicKey = `${member.group_id}_${member.topic}`;
        
        if (!topicNodes.has(topicKey)) {
          const topicNode: TopicNode = {
            id: `topic_${topicKey}`,
            name: member.topic,
            type: 'TOPIC',
            parent_id: `class_${member.group_id}`,
            size: 20,
            color: '#06b6d4', // Cyan for individual topics
            feature_ids: [],
            entity_names: [],
            connections: 0
          };
          topicNodes.set(topicKey, topicNode);
          topicToEntities.set(topicKey, new Set());
          topicToClass.set(topicKey, member.group_id);
          nodes.push(topicNode);

          // Create hierarchy link
          links.push({
            source: `class_${member.group_id}`,
            target: `topic_${topicKey}`,
            strength: 1,
            type: 'HIERARCHY'
          });
        }

        // Add feature_id to the topic
        const topicNode = topicNodes.get(topicKey)!;
        topicNode.feature_ids.push(member.feature_id.toString());
      });

      // Add entities to topics
      (featureEntities || []).forEach(entity => {
        // Find which topics this feature belongs to
        const relevantMembers = (groupMembers || []).filter(m => m.feature_id === entity.feature_id);
        
        relevantMembers.forEach(member => {
          const topicKey = `${member.group_id}_${member.topic}`;
          const entitySet = topicToEntities.get(topicKey);
          if (entitySet) {
            entitySet.add(entity.entity_name);
          }
        });
      });

      // Update topic nodes with entity data
      topicToEntities.forEach((entitySet, topicKey) => {
        const topicNode = topicNodes.get(topicKey);
        if (topicNode) {
          topicNode.entity_names = Array.from(entitySet);
          // Adjust size based on number of entities
          topicNode.size = Math.max(15, Math.min(35, 15 + entitySet.size * 2));
        }
      });

      // Step 5: Calculate co-occurrence links between topics
      console.log('🔗 Calculating topic co-occurrences based on shared entities...');
      
      const topicKeys = Array.from(topicNodes.keys());
      for (let i = 0; i < topicKeys.length; i++) {
        for (let j = i + 1; j < topicKeys.length; j++) {
          const topic1Key = topicKeys[i];
          const topic2Key = topicKeys[j];
          
          const entities1 = topicToEntities.get(topic1Key) || new Set();
          const entities2 = topicToEntities.get(topic2Key) || new Set();
          
          // Calculate shared entities
          const sharedEntities = Array.from(entities1).filter(entity => entities2.has(entity));
          
          if (sharedEntities.length > 0) {
            const topic1Node = topicNodes.get(topic1Key)!;
            const topic2Node = topicNodes.get(topic2Key)!;
            
            // Only create links between topics in different classes or with significant overlap
            const differentClasses = topicToClass.get(topic1Key) !== topicToClass.get(topic2Key);
            const significantOverlap = sharedEntities.length >= 2;
            
            if (differentClasses || significantOverlap) {
              links.push({
                source: topic1Node.id,
                target: topic2Node.id,
                strength: sharedEntities.length,
                type: 'CO_OCCURRENCE',
                shared_entities: sharedEntities
              });
              
              // Update connection counts
              topic1Node.connections++;
              topic2Node.connections++;
            }
          }
        }
      }

      // Step 6: Update class node sizes based on number of topics
      topicClassNodes.forEach((classNode, groupId) => {
        const topicsInClass = Array.from(topicNodes.values()).filter(t => t.parent_id === classNode.id);
        classNode.size = Math.max(30, Math.min(60, 30 + topicsInClass.length * 3));
        
        // Collect all entities from topics in this class
        const allEntities = new Set<string>();
        topicsInClass.forEach(topic => {
          topic.entity_names.forEach(entity => allEntities.add(entity));
        });
        classNode.entity_names = Array.from(allEntities);
        classNode.feature_ids = topicsInClass.flatMap(t => t.feature_ids);
      });

      console.log(`🎯 Created ${nodes.length} nodes (${topicClassNodes.size} classes, ${topicNodes.size} topics)`);
      console.log(`🔗 Created ${links.length} links`);
      
      const hierarchyLinks = links.filter(l => l.type === 'HIERARCHY').length;
      const coOccurrenceLinks = links.filter(l => l.type === 'CO_OCCURRENCE').length;
      console.log(`  - ${hierarchyLinks} hierarchy links`);
      console.log(`  - ${coOccurrenceLinks} co-occurrence links`);

      console.log('=== END TOPIC NETWORK DATA CREATION ===');

      return { nodes, links };

    } catch (error) {
      console.error('Error in getTopicNetworkData:', error);
      throw error;
    }
  }
}