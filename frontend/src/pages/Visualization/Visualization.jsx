import React, { useEffect, useRef, useState } from 'react';
import { Card, Row, Col, Select, message } from 'antd';
import * as echarts from 'echarts';
import { statsAPI } from '../../services/api';

const Visualization = () => {
  const yearChartRef = useRef(null);
  const vulnChartRef = useRef(null);
  const productChartRef = useRef(null);
  const [charts, setCharts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modern color palette based on Google/Meta design specs
  const colors = [
    '#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', 
    '#f59e0b', '#10b981', '#06b6d4', '#3b82f6'
  ];

  const commonChartOptions = {
    textStyle: {
      fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
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
        initCharts(data);
      } catch (error) {
        console.error('Error loading data:', error);
        message.error('获取数据失败');
        initCharts({
          yearData: { '2020': 10680, '2021': 11116, '2022': 13188, '2023': 16453, '2024': 24057, '2025': 16741, '2026': 561 },
          vulnerabilityTypes: {
            '其他': 28240,
            'XSS': 5426,
            'CSRF': 2888,
            'Missing Authorization': 2222,
            'Injection': 2213,
          },
          products: {
            '其他': 24242,
            'Linux': 2919,
            'Chrome': 855,
            'Android': 740,
          },
          pocAvailable: 92796,
          pocUnavailable: 0,
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

  const initCharts = (data) => {
    const instances = [];

    // 1. Year Trend Chart (Line + Area)
    const yearChart = echarts.init(yearChartRef.current);
    yearChart.setOption({
      ...commonChartOptions,
      tooltip: {
        trigger: 'axis',
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        borderRadius: 8,
        padding: 12,
        textStyle: { color: '#1e293b' },
        extraCssText: 'box-shadow: 0 4px 12px rgba(0,0,0,0.1); border: none;'
      },
      xAxis: {
        type: 'category',
        data: Object.keys(data.yearData),
        axisLine: { lineStyle: { color: '#e2e8f0' } },
        axisLabel: { color: '#64748b', margin: 15 }
      },
      yAxis: {
        type: 'value',
        splitLine: { lineStyle: { type: 'dashed', color: '#f1f5f9' } },
        axisLabel: { color: '#64748b' }
      },
      series: [{
        data: Object.values(data.yearData),
        type: 'line',
        smooth: true,
        symbol: 'circle',
        symbolSize: 8,
        itemStyle: { color: '#6366f1' },
        lineStyle: { width: 4 },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(99, 102, 241, 0.2)' },
            { offset: 1, color: 'rgba(99, 102, 241, 0)' }
          ])
        }
      }]
    });
    instances.push(yearChart);

    // 2. Vulnerability Types (Donut Chart)
    const vulnChart = echarts.init(vulnChartRef.current);
    vulnChart.setOption({
      ...commonChartOptions,
      tooltip: {
        trigger: 'item',
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        borderRadius: 8,
        padding: 12,
        textStyle: { color: '#1e293b' },
        extraCssText: 'box-shadow: 0 4px 12px rgba(0,0,0,0.1); border: none;'
      },
      legend: {
        orient: 'vertical',
        right: '5%',
        top: 'center',
        icon: 'circle',
        itemGap: 15,
        textStyle: { color: '#64748b', fontSize: 12 }
      },
      series: [{
        type: 'pie',
        radius: ['40%', '70%'],
        center: ['35%', '50%'],
        avoidLabelOverlap: true,
        itemStyle: {
          borderRadius: 10,
          borderColor: '#fff',
          borderWidth: 2
        },
        label: {
          show: true,
          position: 'outside',
          formatter: '{b}: {d}%',
          color: '#64748b',
          fontSize: 12
        },
        labelLine: {
          show: true,
          length: 15,
          length2: 10
        },
        emphasis: {
          label: {
            show: true,
            fontSize: 18,
            fontWeight: 'bold'
          }
        },
        data: Object.entries(data.vulnerabilityTypes)
          .map(([name, value], index) => ({ 
            name, 
            value,
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

    productChart.setOption({
      ...commonChartOptions,
      grid: { ...commonChartOptions.grid, left: 100 },
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        borderRadius: 8,
        padding: 12,
        textStyle: { color: '#1e293b' },
        extraCssText: 'box-shadow: 0 4px 12px rgba(0,0,0,0.1); border: none;'
      },
      xAxis: {
        type: 'value',
        splitLine: { lineStyle: { type: 'dashed', color: '#f1f5f9' } },
        axisLabel: { color: '#64748b' }
      },
      yAxis: {
        type: 'category',
        data: productData.map(item => item.name),
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: { color: '#1e293b', fontWeight: 500 }
      },
      series: [{
        data: productData.map(item => item.value),
        type: 'bar',
        barWidth: '60%',
        itemStyle: {
          borderRadius: [0, 4, 4, 0],
          color: new echarts.graphic.LinearGradient(1, 0, 0, 0, [
            { offset: 0, color: '#8b5cf6' },
            { offset: 1, color: '#c084fc' }
          ])
        }
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
    <div className="p-6 bg-surface-50 min-height-screen">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-surface-900 tracking-tight">
          威胁情报可视化
        </h1>
        <p className="mt-2 text-surface-500 text-lg">
          实时分析全球 CVE 漏洞趋势与分布特征
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* 1. Year Trend - Full Width */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-soft border border-surface-100">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-surface-800">CVE 数量年度趋势</h2>
            <div className="px-3 py-1 bg-primary-50 text-primary-600 rounded-full text-sm font-medium">
              2020 - 2026
            </div>
          </div>
          <div ref={yearChartRef} className="w-full h-[400px]" />
        </div>

        {/* 2. Vulnerability Types - Full Width (Larger Canvas) */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-soft border border-surface-100">
          <h2 className="text-xl font-bold text-surface-800 mb-6">漏洞类型分布</h2>
          <div ref={vulnChartRef} className="w-full h-[500px]" />
        </div>

        {/* 3. Product Distribution - Full Width */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-soft border border-surface-100">
          <h2 className="text-xl font-bold text-surface-800 mb-6">Top 20 受影响产品分布</h2>
          <div ref={productChartRef} className="w-full h-[800px]" />
        </div>
      </div>
    </div>
  );
};

export default Visualization;
