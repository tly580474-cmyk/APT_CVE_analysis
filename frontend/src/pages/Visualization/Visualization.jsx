import React, { useEffect, useRef, useState } from 'react';
import { Card, Row, Col, Select, message } from 'antd';
import * as echarts from 'echarts';
import { statsAPI } from '../../services/api';
import { useDarkMode } from '../../contexts/DarkModeContext';

const Visualization = () => {
  const yearChartRef = useRef(null);
  const vulnChartRef = useRef(null);
  const productChartRef = useRef(null);
  const [charts, setCharts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [rawData, setRawData] = useState(null);
  const { isDark } = useDarkMode();

  const colors = [
    '#5470c6', '#91cc75', '#fac858', '#ee6666',
    '#73c0de', '#3ba272', '#fc8452', '#9a60b4',
    '#ea7ccc', '#48b8d0', '#f5a623', '#7c5295'
  ];

  const getTooltipStyle = () => ({
    backgroundColor: isDark ? '#17181A' : 'rgba(255, 255, 255, 0.9)',
    borderRadius: 8,
    padding: 12,
    textStyle: { color: isDark ? '#e2e8f0' : '#1e293b' },
    extraCssText: `box-shadow: 0 4px 12px rgba(0,0,0,${isDark ? '0.3' : '0.1'}); border: none;`
  });

  const commonChartOptions = {
    textStyle: {
      fontFamily: 'JetBrains Mono, system-ui, sans-serif',
    },
    grid: {
      top: 40,
      right: 20,
      bottom: 40,
      left: 50,
      containLabel: true
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await statsAPI.getCVEAnalysis();
        const data = response.data.data;
        setRawData(data);
      } catch (error) {
        console.error('Error loading data:', error);
        message.error('获取数据失败');
        setRawData({
          yearData: { '2020': 10680, '2021': 11116, '2022': 13188, '2023': 16453, '2024': 24057, '2025': 16741, '2026': 561 },
          vulnerabilityTypes: {
            '其他': 28240, 'XSS': 5426, 'CSRF': 2888, 'Missing Authorization': 2222, 'Injection': 2213,
          },
          products: {
            '其他': 24242, 'Linux': 2919, 'Chrome': 855, 'Android': 740,
          },
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    return () => {
      charts.forEach(chart => chart?.dispose());
    };
  }, []);

  useEffect(() => {
    if (rawData) {
      charts.forEach(chart => chart?.dispose());
      initCharts(rawData);
    }
  }, [isDark, rawData]);

  const initCharts = (data) => {
    const instances = [];

    // 1. Year Trend Chart
    const yearChart = echarts.init(yearChartRef.current);
    const yearValues = Object.values(data.yearData);
    const years = Object.keys(data.yearData);
    const seriesData = yearValues.map((value, index) => ({
      value,
      itemStyle: { color: value < 5000 ? '#10b981' : value < 10000 ? '#f59e0b' : value < 20000 ? '#ef4444' : '#7c5295' }
    }));
    yearChart.setOption({
      ...commonChartOptions,
      tooltip: { trigger: 'axis', ...getTooltipStyle() },
      xAxis: {
        type: 'category',
        data: years,
        axisLine: { lineStyle: { color: isDark ? '#334155' : '#e2e8f0' } },
        axisLabel: { color: isDark ? '#94a3b8' : '#64748b', margin: 15 }
      },
      yAxis: {
        type: 'value',
        splitLine: { lineStyle: { type: 'dashed', color: isDark ? '#1e293b' : '#f1f5f9' } },
        axisLabel: { color: isDark ? '#94a3b8' : '#64748b' }
      },
      series: [{
        data: seriesData,
        type: 'line',
        smooth: true,
        symbol: 'circle',
        symbolSize: 10,
        lineStyle: { width: 4, color: '#10b981', shadowColor: 'rgba(16, 185, 129, 0.4)', shadowBlur: 10, shadowOffsetY: 4 },
        itemStyle: {
          borderWidth: 2,
          borderColor: '#fff',
          shadowColor: 'rgba(0, 0, 0, 0.15)',
          shadowBlur: 6,
          shadowOffsetY: 2
        },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(16, 185, 129, 0.35)' },
            { offset: 0.5, color: 'rgba(16, 185, 129, 0.15)' },
            { offset: 1, color: 'rgba(16, 185, 129, 0)' }
          ])
        },
        emphasis: {
          focus: 'series',
          itemStyle: {
            shadowBlur: 12,
            shadowColor: 'rgba(16, 185, 129, 0.6)'
          }
        }
      }]
    });
    instances.push(yearChart);

    // 2. Vulnerability Types (Donut Chart)
    const vulnChart = echarts.init(vulnChartRef.current);
    vulnChart.setOption({
      ...commonChartOptions,
      tooltip: { trigger: 'item', ...getTooltipStyle() },
      legend: {
        orient: 'vertical',
        right: '2%',
        top: 'middle',
        icon: 'circle',
        itemGap: 10,
        itemWidth: 10,
        itemHeight: 10,
        textStyle: { color: isDark ? '#94a3b8' : '#64748b', fontSize: 11 }
      },
      series: [{
        type: 'pie',
        radius: ['38%', '62%'],
        center: ['32%', '50%'],
        avoidLabelOverlap: true,
        itemStyle: {
          borderRadius: 8,
          borderColor: isDark ? '#1e293b' : '#fff',
          borderWidth: 2
        },
        label: {
          show: true,
          position: 'outside',
          formatter: '{b}: {d}%',
          color: isDark ? '#94a3b8' : '#64748b',
          fontSize: 11
        },
        labelLine: { show: true, length: 12, length2: 8 },
        emphasis: {
          label: { show: true, fontSize: 16, fontWeight: 'bold' }
        },
        data: Object.entries(data.vulnerabilityTypes)
          .map(([name, value], index) => ({
            name, value,
            itemStyle: { color: colors[index % colors.length] }
          }))
      }]
    });
    instances.push(vulnChart);

    // 3. Product Distribution (Horizontal Bar)
    const productChart = echarts.init(productChartRef.current);
    const productData = Object.entries(data.products)
      .filter(([name]) => name !== '其他')
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => a.value - b.value)
      .slice(-20);
    const maxProductValue = Math.max(...productData.map(item => item.value));
    const minProductValue = Math.min(...productData.map(item => item.value));

    productChart.setOption({
      ...commonChartOptions,
      grid: { ...commonChartOptions.grid, left: 100 },
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        ...getTooltipStyle()
      },
      xAxis: {
        type: 'value',
        splitLine: { lineStyle: { type: 'dashed', color: isDark ? '#1e293b' : '#f1f5f9' } },
        axisLabel: { color: isDark ? '#94a3b8' : '#64748b' }
      },
      yAxis: {
        type: 'category',
        data: productData.map(item => item.name),
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: { color: isDark ? '#e2e8f0' : '#1e293b', fontWeight: 500 }
      },
      series: [{
        data: productData.map(item => ({
          value: item.value,
          itemStyle: {
            borderRadius: [0, 4, 4, 0],
            color: new echarts.graphic.LinearGradient(1, 0, 0, 0, [
              { offset: 0, color: item.value < (maxProductValue * 0.33) ? '#10b981' :
                             item.value < (maxProductValue * 0.66) ? '#f59e0b' : '#ef4444' },
              { offset: 1, color: item.value < (maxProductValue * 0.33) ? '#34d399' :
                             item.value < (maxProductValue * 0.66) ? '#fbbf24' : '#fca5a5' }
            ])
          }
        })),
        type: 'bar',
        barWidth: '60%'
      }]
    });
    instances.push(productChart);

    setCharts(instances);

    const handleResize = () => {
      instances.forEach(instance => instance.resize());
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  };

  return (
    <div className="min-h-screen">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-surface-900 dark:text-white tracking-tight">
          威胁情报可视化
        </h1>
        <p className="mt-2 text-surface-500 dark:text-slate-400 text-lg">
          实时分析全球 CVE 漏洞趋势与分布特征
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="lg:col-span-2 bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-soft border border-surface-100 dark:border-slate-700">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-surface-800 dark:text-white">CVE 数量年度趋势</h2>
            <div className="px-3 py-1 bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 rounded-full text-sm font-medium">
              1999 - 2026
            </div>
          </div>
          <div ref={yearChartRef} className="w-full h-[400px]" />
        </div>

        <div className="lg:col-span-2 bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-soft border border-surface-100 dark:border-slate-700">
          <h2 className="text-xl font-bold text-surface-800 dark:text-white mb-6">漏洞类型分布</h2>
          <div ref={vulnChartRef} className="w-full h-[500px]" />
        </div>

        <div className="lg:col-span-2 bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-soft border border-surface-100 dark:border-slate-700">
          <h2 className="text-xl font-bold text-surface-800 dark:text-white mb-6">Top 20 受影响产品分布</h2>
          <div ref={productChartRef} className="w-full h-[800px]" />
        </div>
      </div>
    </div>
  );
};

export default Visualization;
