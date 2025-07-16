import { supabase } from './supabase';

export const debugDatabase = async () => {
  console.log('=== DATABASE DEBUG START ===');
  
  try {
    // Test 1: Check if we can connect to news table
    console.log('1. Testing news table connection...');
    const { data: newsData, error: newsError } = await supabase
      .from('news')
      .select('id, title_en, country')
      .limit(5);
    
    if (newsError) {
      console.error('❌ News table error:', newsError);
    } else {
      console.log('✅ News table accessible, found', newsData?.length || 0, 'articles');
      console.log('Sample news:', newsData?.slice(0, 2));
    }

    // Test 2: Check feature_engineering table
    console.log('2. Testing feature_engineering table...');
    const { data: featureData, error: featureError } = await supabase
      .from('feature_engineering')
      .select('id, topic, news_id')
      .limit(5);
    
    if (featureError) {
      console.error('❌ Feature engineering table error:', featureError);
    } else {
      console.log('✅ Feature engineering accessible, found', featureData?.length || 0, 'features');
      console.log('Sample features:', featureData?.slice(0, 2));
    }

    // Test 3: Check feature_entities table
    console.log('3. Testing feature_entities table...');
    const { data: entityData, error: entityError } = await supabase
      .from('feature_entities')
      .select('entity_name, entity_type, feature_id')
      .limit(5);
    
    if (entityError) {
      console.error('❌ Feature entities table error:', entityError);
    } else {
      console.log('✅ Feature entities accessible, found', entityData?.length || 0, 'entities');
      console.log('Sample entities:', entityData?.slice(0, 2));
    }

    // Test 4: Check topic_hierarchy_view
    console.log('4. Testing topic_hierarchy_view...');
    const { data: topicData, error: topicError } = await supabase
      .from('topic_hierarchy_view')
      .select('meta_group_label, sub_group_label, topic, feature_id')
      .limit(5);
    
    if (topicError) {
      console.error('❌ Topic hierarchy view error:', topicError);
    } else {
      console.log('✅ Topic hierarchy view accessible, found', topicData?.length || 0, 'topic entries');
      console.log('Sample topics:', topicData?.slice(0, 2));
    }

    // Test 5: Check frequent_entities_materialized
    console.log('5. Testing frequent_entities_materialized...');
    const { data: freqEntityData, error: freqEntityError } = await supabase
      .from('frequent_entities_materialized')
      .select('entity_name, entity_type, news_count')
      .limit(5);
    
    if (freqEntityError) {
      console.error('❌ Frequent entities materialized view error:', freqEntityError);
    } else {
      console.log('✅ Frequent entities materialized view accessible, found', freqEntityData?.length || 0, 'entities');
      console.log('Sample frequent entities:', freqEntityData?.slice(0, 2));
    }

    // Test 6: Check if there are any topics in feature_engineering
    console.log('6. Checking topics in feature_engineering...');
    const { data: topicsInFeatures, error: topicsError } = await supabase
      .from('feature_engineering')
      .select('topic')
      .not('topic', 'is', null)
      .limit(10);
    
    if (topicsError) {
      console.error('❌ Topics in feature_engineering error:', topicsError);
    } else {
      console.log('✅ Found', topicsInFeatures?.length || 0, 'topics in feature_engineering');
      const uniqueTopics = [...new Set(topicsInFeatures?.map(t => t.topic) || [])];
      console.log('Unique topics:', uniqueTopics.slice(0, 5));
    }

  } catch (error) {
    console.error('❌ General database error:', error);
  }
  
  console.log('=== DATABASE DEBUG END ===');
}; 