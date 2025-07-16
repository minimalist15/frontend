import React, { useEffect, useRef, useState } from 'react';
import * as echarts from 'echarts';
import * as d3 from 'd3';
import { TopicHierarchyService } from '../services/topicHierarchyService';

// Convert flat data to ECharts treemap format
function buildTreemapData(flatData: any[]): any[] {
  // Group: meta_group_label -> sub_group_label -> topic
  const macroMap: Record<string, any> = {};
  for (const row of flatData) {
    const macro = row.meta_group_label || 'Unknown Macro Group';
    const sub = row.sub_group_label || 'Unknown Sub Group';
    const topic = row.topic || 'Unknown Topic';
    if (!macroMap[macro]) macroMap[macro] = {};
    if (!macroMap[macro][sub]) macroMap[macro][sub] = new Set();
    macroMap[macro][sub].add(topic);
  }
  // For color variety
  const macroNames = Object.keys(macroMap);
  const subNames = Array.from(new Set(flatData.map(row => row.sub_group_label || 'Unknown Sub Group')));
  const macroColor = d3.scaleSequential(d3.interpolateRainbow).domain([0, Math.max(1, macroNames.length-1)]);
  const subColor = d3.scaleSequential(d3.interpolateCool).domain([0, Math.max(1, subNames.length-1)]);
  // Build tree
  return macroNames.map((macro, i) => ({
    name: macro,
    itemStyle: { color: macroColor(i) },
    children: Object.entries(macroMap[macro]).map(([sub, topics], j) => ({
      name: sub,
      itemStyle: { color: subColor(subNames.indexOf(sub)) },
      children: Array.from(topics as Set<string>).map(topic => ({
        name: topic,
        value: 1
      }))
    }))
  }));
}

const TopicHierarchyTreemap: React.FC<{ className?: string }> = ({ className = '' }) => {
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstance = useRef<echarts.ECharts | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    TopicHierarchyService.getTopicHierarchyData().then((flatData: any[]) => {
      const treemapData = buildTreemapData(flatData);
      initTreemapChart(treemapData);
      setLoading(false);
    });
    // eslint-disable-next-line
  }, []);

  function initTreemapChart(treemapData: any[]) {
    if (!chartRef.current) return;
    if (chartInstance.current) chartInstance.current.dispose();
    chartInstance.current = echarts.init(chartRef.current);
    function getLevelOption() {
      return [
        {
          itemStyle: {
            borderColor: '#777',
            borderWidth: 0,
            gapWidth: 1
          },
          upperLabel: {
            show: false
          }
        },
        {
          itemStyle: {
            borderColor: '#555',
            borderWidth: 5,
            gapWidth: 1
          },
          emphasis: {
            itemStyle: {
              borderColor: '#ddd'
            }
          }
        },
        {
          colorSaturation: [0.35, 0.5],
          itemStyle: {
            borderWidth: 5,
            gapWidth: 1,
            borderColorSaturation: 0.6
          }
        }
      ];
    }
    const option = {
      title: {
        text: 'Topic Hierarchy',
        left: 'center'
      },
      tooltip: {
        trigger: 'item',
        backgroundColor: 'rgba(30, 30, 40, 0.95)',
        borderColor: '#888',
        borderWidth: 1,
        padding: 12,
        extraCssText: 'box-shadow: 0 2px 12px rgba(0,0,0,0.3); min-width: 120px; max-width: 260px; text-align: center;',
        formatter: function (info: any) {
          var value = info.value;
          var treePathInfo = info.treePathInfo;
          var treePath = [];
          for (var i = 1; i < treePathInfo.length; i++) {
            treePath.push(treePathInfo[i].name);
          }
          return [
            '<div style="font-weight:600; font-size:15px; color:#fff; text-align:center; line-height:1.5;">',
            treePath.map(p => `<div>${echarts.format.encodeHTML(p)}</div>`).join(''),
            '</div>',
            '<div style="margin-top:8px; font-size:13px; color:#b3b3b3; text-align:center;">',
            'Count: <b style="color:#fff">' + echarts.format.addCommas(value) + '</b>',
            '</div>'
          ].join('');
        }
      },
      series: [
        {
          name: 'Topics',
          type: 'treemap',
          visibleMin: 1,
          label: {
            show: true,
            formatter: '{b}'
          },
          upperLabel: {
            show: true,
            height: 30
          },
          itemStyle: {
            borderColor: '#fff'
          },
          levels: getLevelOption(),
          data: treemapData
        }
      ]
    };
    chartInstance.current.setOption(option);
  }

  if (loading) {
    return <div className="h-96 flex items-center justify-center">Loading...</div>;
  }
  return (
    <div className={className}>
      <div ref={chartRef} style={{ width: '100%', height: 500, background: '#222', borderRadius: 8 }} />
    </div>
  );
};

export default TopicHierarchyTreemap; 