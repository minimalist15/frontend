import React, { useEffect, useRef, useState } from 'react';
import * as echarts from 'echarts';
import { supabase } from '../lib/supabase';

interface EntityPieChartProps {
  entityName: string;
  hideTitle?: boolean;
}

interface PublisherCountryData {
  publisher: string;
  country: string;
  count: number;
}

interface NestedPieData {
  name: string;
  value: number;
  children?: Array<{
    name: string;
    value: number;
  }>;
}

const EntityPieChart: React.FC<EntityPieChartProps> = ({ entityName, hideTitle }) => {
  if (!entityName || entityName.trim() === '') {
    console.warn('EntityPieChart: entityName is empty or undefined!');
  }
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstance = useRef<echarts.ECharts | null>(null);
  const [data, setData] = useState<NestedPieData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPublisherCountryData();
  }, [entityName]);

  const fetchPublisherCountryData = async () => {
    try {
      setLoading(true);
      console.log('EntityPieChart: Fetching data for entity:', entityName);
      
      // Get all feature_ids for this entity
      const { data: entityFeatures, error: entityError } = await supabase
        .from('feature_entities')
        .select('feature_id')
        .eq('entity_name', entityName);

      if (entityError) {
        console.error('Error fetching entity features:', entityError);
        setData([]);
        return;
      }

      if (!entityFeatures || entityFeatures.length === 0) {
        console.log('No features found for entity:', entityName);
        setData([]);
        return;
      }

      const featureIds = entityFeatures.map(f => f.feature_id);
      console.log('Found feature IDs:', featureIds.length);
      
      // Get feature engineering data to get news_id and subnews_id
      const { data: featureData, error: featureError } = await supabase
        .from('feature_engineering')
        .select('news_id, subnews_id')
        .in('id', featureIds);

      if (featureError || !featureData) {
        console.error('Error fetching feature data:', featureError);
        setData([]);
        return;
      }

      console.log('Found feature data:', featureData.length);

      // Get unique news_ids and subnews_ids
      const newsIds = [...new Set(featureData.filter(f => f.news_id).map(f => f.news_id))];
      const subnewsIds = [...new Set(featureData.filter(f => f.subnews_id).map(f => f.subnews_id))];

      console.log('News IDs:', newsIds.length, 'Subnews IDs:', subnewsIds.length);

      // Fetch news and subnews articles
      const [newsData, subnewsData] = await Promise.all([
        newsIds.length > 0 ? supabase
          .from('news')
          .select('id, publisher, country')
          .in('id', newsIds) : Promise.resolve({ data: [] }),
        subnewsIds.length > 0 ? supabase
          .from('subnews')
          .select(`
            id, 
            publisher,
            news_id,
            news!inner(country)
          `)
          .in('id', subnewsIds) : Promise.resolve({ data: [] })
      ]);

      console.log('News data:', newsData.data?.length || 0);
      console.log('Subnews data:', subnewsData.data?.length || 0);

      // Combine and process data
      const publisherCountryMap = new Map<string, Map<string, number>>();
      
      // Process news data
      (newsData.data || []).forEach(article => {
        const publisher = article.publisher || 'Unknown Publisher';
        const country = article.country || 'Unknown Country';
        
        if (!publisherCountryMap.has(publisher)) {
          publisherCountryMap.set(publisher, new Map());
        }
        
        const countryMap = publisherCountryMap.get(publisher)!;
        countryMap.set(country, (countryMap.get(country) || 0) + 1);
      });

      // Process subnews data (get country from parent news)
      (subnewsData.data || []).forEach(article => {
        const publisher = article.publisher || 'Unknown Publisher';
        // Get country from the joined news table
        const country = (article as any).news?.country || 'Unknown Country';
        
        if (!publisherCountryMap.has(publisher)) {
          publisherCountryMap.set(publisher, new Map());
        }
        
        const countryMap = publisherCountryMap.get(publisher)!;
        countryMap.set(country, (countryMap.get(country) || 0) + 1);
      });

      console.log('Publisher country map:', publisherCountryMap);

      // Convert to nested pie chart data format
      const nestedData: NestedPieData[] = [];
      
      publisherCountryMap.forEach((countryMap, publisher) => {
        const children: Array<{ name: string; value: number }> = [];
        let totalCount = 0;
        
        countryMap.forEach((count, country) => {
          children.push({ name: country, value: count });
          totalCount += count;
        });
        
        nestedData.push({
          name: publisher,
          value: totalCount,
          children: children
        });
      });

      // Sort by total count (descending) and take top 10 publishers
      nestedData.sort((a, b) => b.value - a.value);
      const topPublishers = nestedData.slice(0, 10);
      
      console.log('Final nested data:', topPublishers);
      setData(topPublishers);
    } catch (error) {
      console.error('Error fetching publisher-country data:', error);
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!chartRef.current || data.length === 0) {
      console.log('EntityPieChart: No chart ref or no data, skipping chart initialization');
      return;
    }

    console.log('EntityPieChart: Initializing chart with data:', data);

    // Initialize chart
    if (!chartInstance.current) {
      chartInstance.current = echarts.init(chartRef.current);
      console.log('EntityPieChart: Chart instance created');
    }

    const option = {
      backgroundColor: 'transparent',
      // Only show chart title if hideTitle is not true
      ...(hideTitle ? {} : {
        title: {
          text: 'Publisher & Country Distribution',
          left: 'center',
          textStyle: {
            color: '#f9fafb',
            fontSize: 16
          }
        },
      }),
      tooltip: {
        trigger: 'item',
        backgroundColor: '#1f2937',
        borderColor: '#374151',
        textStyle: {
          color: '#f9fafb'
        },
        formatter: function(params: any) {
          if (params.data.children) {
            // Publisher level
            return `${params.name}<br/>Total Citations: ${params.value}`;
          } else {
            // Country level
            return `${params.name}<br/>Citations: ${params.value}`;
          }
        }
      },
      legend: {
        type: 'scroll',
        orient: 'horizontal',
        bottom: 0,
        left: 'center',
        textStyle: {
          color: '#9ca3af',
          fontSize: 12,
        },
        itemWidth: 16,
        itemHeight: 10,
        pageIconColor: '#3b82f6',
        pageTextStyle: { color: '#9ca3af' },
        // Optionally, limit the number of items per page
        // pageButtonItemGap: 10,
      },
      grid: {
        top: 60,
        left: 0,
        right: 0,
        bottom: 40, // leave space for legend
        containLabel: true,
      },
      series: [
        {
          name: 'Publisher',
          type: 'pie',
          radius: ['20%', '55%'],
          center: ['50%', '50%'],
          roseType: 'radius',
          itemStyle: {
            borderRadius: 8,
            borderColor: '#374151',
            borderWidth: 2
          },
          label: {
            show: false
          },
          emphasis: {
            label: {
              show: true,
              fontSize: '14',
              fontWeight: 'bold',
              color: '#f9fafb'
            }
          },
          data: data.map(item => ({
            name: item.name,
            value: item.value,
            itemStyle: {
              color: getPublisherColor(item.name)
            }
          }))
        },
        {
          name: 'Country',
          type: 'pie',
          radius: ['0%', '17%'],
          center: ['50%', '50%'],
          itemStyle: {
            borderRadius: 4,
            borderColor: '#374151',
            borderWidth: 1
          },
          label: {
            show: false
          },
          emphasis: {
            label: {
              show: true,
              fontSize: '12',
              color: '#f9fafb'
            }
          },
          data: data.flatMap(publisher => 
            publisher.children?.map(country => ({
              name: `${publisher.name} - ${country.name}`,
              value: country.value,
              itemStyle: {
                color: getCountryColor(country.name)
              }
            })) || []
          )
        }
      ]
    };

    console.log('EntityPieChart: Setting chart option:', option);
    chartInstance.current.setOption(option);
    console.log('EntityPieChart: Chart option set successfully');

    // Handle resize
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
  }, [data]);

  // Color functions for publishers and countries
  const getPublisherColor = (publisher: string) => {
    const colors = [
      '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6',
      '#06b6d4', '#84cc16', '#f97316', '#ec4899', '#6366f1'
    ];
    const index = publisher.charCodeAt(0) % colors.length;
    return colors[index];
  };

  const getCountryColor = (country: string) => {
    const colors = [
      '#60a5fa', '#34d399', '#fbbf24', '#f87171', '#a78bfa',
      '#22d3ee', '#a3e635', '#fb923c', '#f472b6', '#818cf8'
    ];
    const index = country.charCodeAt(0) % colors.length;
    return colors[index];
  };

  if (loading) {
    return (
      <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
        {!hideTitle && <h3 className="text-lg font-semibold text-white mb-4">Publisher & Country Distribution</h3>}
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400"></div>
        </div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
        {!hideTitle && <h3 className="text-lg font-semibold text-white mb-4">Publisher & Country Distribution</h3>}
        <div className="flex items-center justify-center h-64 text-gray-400 text-center">
          <div>
            No publisher data found for this entity.<br />
            <span className="text-xs">Try selecting a different entity or check your data source.</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
      {!hideTitle && <h3 className="text-lg font-semibold text-white mb-4">Publisher & Country Distribution</h3>}
      <div ref={chartRef} style={{ width: '100%', height: '500px' }} />
      <div className="mt-4 text-xs text-gray-400 text-center">
        <p>Outer ring: Publishers (by citation count)</p>
        <p>Inner ring: Countries for each publisher</p>
      </div>
    </div>
  );
};

export default EntityPieChart;