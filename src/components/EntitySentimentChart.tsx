import React, { useState, useEffect, useRef } from 'react';
import * as echarts from 'echarts';
import { supabase } from '../lib/supabase';

interface EntitySentimentChartProps {
  entityName: string;
  entityType: string;
}

const EntitySentimentChart: React.FC<EntitySentimentChartProps> = ({ entityName, entityType }) => {
  const [loading, setLoading] = useState(true);
  const [hasData, setHasData] = useState(false);
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstance = useRef<echarts.ECharts | null>(null);

  // Data arrays for chart
  const [categories, setCategories] = useState<string[]>([]);
  const [dailyMentionsData, setDailyMentionsData] = useState<number[]>([]);
  const [cumulativeMentionsData, setCumulativeMentionsData] = useState<number[]>([]);
  const [dailySentimentData, setDailySentimentData] = useState<(number|null)[]>([]);

  useEffect(() => {
    fetchSentimentData();
    // eslint-disable-next-line
  }, [entityName, entityType]);

  const fetchSentimentData = async () => {
    setLoading(true);
    setHasData(false);
    try {
      console.log('🔍 EntitySentimentChart: Starting fetch for:', { entityName, entityType });
      
      // Debug: Check what entities exist in the table
      const { data: debugData, error: debugError } = await supabase
        .from('frequent_entities_materialized')
        .select('entity_name, entity_type')
        .limit(5);
      
      console.log('🔍 EntitySentimentChart: Sample entities in table:', { debugData, debugError });
      
      // Also check if our specific entity exists (case-insensitive)
      const { data: entityCheck, error: entityCheckError } = await supabase
        .from('frequent_entities_materialized')
        .select('entity_name, entity_type')
        .ilike('entity_name', `%${entityName}%`)
        .limit(3);
      
      console.log('🔍 EntitySentimentChart: Entities matching our search:', { entityCheck, entityCheckError });
      
      // Fetch from materialized table
      const { data: materializedData, error } = await supabase
        .from('frequent_entities_materialized')
        .select('publisher_mentions_history, avg_sentiment_rolling_1h')
        .eq('entity_name', entityName)
        .eq('entity_type', entityType)
        .limit(1);

      console.log('🔍 EntitySentimentChart: Main query result:', { 
        materializedData, 
        error, 
        queryParams: { entityName, entityType } 
      });

      let entityData = null;
      if (materializedData && materializedData.length > 0) {
        entityData = materializedData[0];
        console.log('✅ EntitySentimentChart: Found data in main query:', entityData);
      } else if (!error) {
        console.log('⚠️ EntitySentimentChart: No data in main query, trying fallback...');
        const { data: fallbackData } = await supabase
          .from('frequent_entities_materialized')
          .select('publisher_mentions_history, avg_sentiment_rolling_1h')
          .ilike('entity_name', entityName)
          .limit(1);
        
        console.log('🔍 EntitySentimentChart: Fallback query result:', { fallbackData });
        
        if (fallbackData && fallbackData.length > 0) {
          entityData = fallbackData[0];
          console.log('✅ EntitySentimentChart: Found data in fallback query:', entityData);
        } else {
          console.log('❌ EntitySentimentChart: No data found in either query');
          setLoading(false);
          setHasData(false);
        return;
      }
      } else {
        console.log('❌ EntitySentimentChart: Error in main query:', error);
        setLoading(false);
        setHasData(false);
        return;
      }

      // Debug the data structure
      console.log('🔍 EntitySentimentChart: Processing entityData:', {
        publisher_mentions_history: entityData.publisher_mentions_history,
        avg_sentiment_rolling_1h: entityData.avg_sentiment_rolling_1h
      });

      // Process publisher mentions history to get daily counts
      const dailyMentionsMap = new Map<string, number>();
      const hourlyMentionsMap = new Map<string, number>();
      
      if (entityData.publisher_mentions_history) {
        entityData.publisher_mentions_history.forEach((entry: any) => {
          const hour = entry.hour;
          const publisherMentions = entry.publisher_mentions;
          
          // Convert hour to date string (YYYY-MM-DD)
          const date = new Date(hour);
          const dateStr = date.toISOString().split('T')[0];
          
          // Count total mentions for this hour
          let hourlyCount = 0;
          if (publisherMentions && typeof publisherMentions === 'object') {
            Object.values(publisherMentions).forEach((count: any) => {
              hourlyCount += parseInt(count) || 0;
            });
          }
          
          // Add to daily total
          dailyMentionsMap.set(dateStr, (dailyMentionsMap.get(dateStr) || 0) + hourlyCount);
          hourlyMentionsMap.set(hour, hourlyCount);
        });
      }
      
      console.log('🔍 EntitySentimentChart: Daily mentions map:', dailyMentionsMap);
      console.log('🔍 EntitySentimentChart: Hourly mentions map:', hourlyMentionsMap);

      // Process sentiment data to get daily averages
      const dailySentimentMap = new Map<string, { sum: number; count: number }>();
      
      if (entityData.avg_sentiment_rolling_1h) {
        entityData.avg_sentiment_rolling_1h.forEach((entry: any) => {
          const hour = entry.hour;
          const sentiment = entry.avg_sentiment;
          
          if (typeof sentiment === 'number') {
            // Convert hour to date string (YYYY-MM-DD)
            const date = new Date(hour);
            const dateStr = date.toISOString().split('T')[0];
            
            if (!dailySentimentMap.has(dateStr)) {
              dailySentimentMap.set(dateStr, { sum: 0, count: 0 });
            }
            
            const dailyData = dailySentimentMap.get(dateStr)!;
            dailyData.sum += sentiment;
            dailyData.count += 1;
          }
        });
      }
      
      console.log('🔍 EntitySentimentChart: Daily sentiment map:', dailySentimentMap);

      // Combine all dates and sort them
      const allDates = new Set([
        ...dailyMentionsMap.keys(),
        ...dailySentimentMap.keys()
      ]);
      
      const sortedDates = Array.from(allDates).sort();
      console.log('🔍 EntitySentimentChart: Sorted dates:', sortedDates);
      
      // Build chart data arrays
      const categoriesArr: string[] = [];
      const dailyMentionsArr: number[] = [];
      const cumulativeMentionsArr: number[] = [];
      const dailySentimentArr: (number|null)[] = [];
      
      let cumulativeMentions = 0;
      
      sortedDates.forEach(dateStr => {
        // Format date for display (MM-DD)
        const date = new Date(dateStr);
        const displayDate = `${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;
        
        categoriesArr.push(displayDate);
        
        // Daily mentions (for bars)
        const dailyCount = dailyMentionsMap.get(dateStr) || 0;
        dailyMentionsArr.push(dailyCount);
        
        // Cumulative mentions (for line)
        cumulativeMentions += dailyCount;
        cumulativeMentionsArr.push(cumulativeMentions);
        
        // Daily average sentiment (for line)
        const sentimentData = dailySentimentMap.get(dateStr);
        if (sentimentData && sentimentData.count > 0) {
          dailySentimentArr.push(sentimentData.sum / sentimentData.count);
        } else {
          dailySentimentArr.push(null);
        }
      });
      
      console.log('🔍 EntitySentimentChart: Processed arrays:', {
        categories: categoriesArr.length,
        dailyMentions: dailyMentionsArr.length,
        cumulativeMentions: cumulativeMentionsArr.length,
        dailySentiment: dailySentimentArr.length
      });
      
      console.log('🔍 EntitySentimentChart: Final data:', {
        categories: categoriesArr,
        dailyMentions: dailyMentionsArr,
        cumulativeMentions: cumulativeMentionsArr,
        dailySentiment: dailySentimentArr
      });
      
      setCategories(categoriesArr);
      setDailyMentionsData(dailyMentionsArr);
      setCumulativeMentionsData(cumulativeMentionsArr);
      setDailySentimentData(dailySentimentArr);
      setHasData(categoriesArr.length > 0);
      
      console.log('✅ EntitySentimentChart: Data processing complete, hasData:', categoriesArr.length > 0);
    } catch (error) {
      console.error('❌ EntitySentimentChart: Error in fetchSentimentData:', error);
      setHasData(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!chartRef.current || !hasData) return;
    if (!chartInstance.current) {
      chartInstance.current = echarts.init(chartRef.current);
    }
    const option = {
      backgroundColor: '#111827',
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'cross' }
      },
      legend: {
        data: ['Daily Mentions', 'Cumulative Mentions', 'Daily Sentiment'],
        textStyle: { color: '#ccc' }
      },
      xAxis: {
        type: 'category',
        data: categories,
        axisLine: { lineStyle: { color: '#ccc' } }
      },
      yAxis: [
        {
          type: 'value',
          name: 'Mentions',
          position: 'left',
          axisLine: { lineStyle: { color: '#60a5fa' } },
          splitLine: { show: false }
        },
        {
          type: 'value',
          name: 'Sentiment',
          position: 'right',
          min: -5,
          max: 5,
          axisLine: { lineStyle: { color: '#f59e0b' } },
          splitLine: { show: false }
        }
      ],
      series: [
        {
          name: 'Daily Mentions',
          type: 'bar',
          yAxisIndex: 0,
          data: dailyMentionsData,
          barWidth: 10,
          itemStyle: {
            borderRadius: 5,
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: '#14c8d4' },
              { offset: 1, color: '#43eec6' }
            ])
          }
        },
        {
          name: 'Cumulative Mentions',
          type: 'line',
          yAxisIndex: 0,
          smooth: true,
          showAllSymbol: true,
          symbol: 'emptyCircle',
          symbolSize: 8,
          data: cumulativeMentionsData,
          lineStyle: { color: '#60a5fa', width: 2 }
        },
        {
          name: 'Daily Sentiment',
          type: 'line',
          yAxisIndex: 1,
          smooth: true,
          showAllSymbol: true,
          symbol: 'emptyCircle',
          symbolSize: 15,
          data: dailySentimentData,
          lineStyle: { color: '#f59e0b', width: 3 }
        }
      ]
    };
    chartInstance.current.setOption(option);
    const handleResize = () => {
      chartInstance.current?.resize();
    };
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      if (chartInstance.current) {
        chartInstance.current.dispose();
        chartInstance.current = null;
      }
    };
  }, [categories, dailyMentionsData, cumulativeMentionsData, dailySentimentData, hasData]);

  if (loading) {
    return (
      <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
        <h3 className="text-lg font-semibold text-white mb-4">Sentiment Analysis Over Time</h3>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400"></div>
        </div>
      </div>
    );
  }

  if (!hasData) {
    return (
      <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
        <h3 className="text-lg font-semibold text-white mb-4">Sentiment Analysis Over Time</h3>
        <div className="flex items-center justify-center h-64 text-gray-400">
          No sentiment data available for this entity
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
      <h3 className="text-lg font-semibold text-white mb-4">Sentiment Analysis Over Time</h3>
      <div ref={chartRef} style={{ width: '100%', height: '400px' }} />
    </div>
  );
};

export default EntitySentimentChart;