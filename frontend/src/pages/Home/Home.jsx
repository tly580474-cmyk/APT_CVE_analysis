import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Statistic, List, Tag, message } from 'antd';
import { FileTextOutlined, BugOutlined, MessageOutlined, TeamOutlined } from '@ant-design/icons';
import { cveAPI, documentAPI } from '../../services/api';

const Home = () => {
  const [hotCVEs, setHotCVEs] = useState([]);
  const [recentDocuments, setRecentDocuments] = useState([]);
  const [stats, setStats] = useState([
    { title: '文档数量', value: 0, icon: <FileTextOutlined />, color: '#1890ff' },
    { title: 'CVE漏洞', value: 0, icon: <BugOutlined />, color: '#ff4d4f' },
    { title: '论坛帖子', value: 0, icon: <MessageOutlined />, color: '#52c41a' },
    { title: '活跃用户', value: 0, icon: <TeamOutlined />, color: '#722ed1' },
  ]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // 获取热门CVE
        const cveResponse = await cveAPI.getHot();
        setHotCVEs(cveResponse.data);

        // 获取最新文档
        const docResponse = await documentAPI.getAll();
        // 按创建时间排序，取最新的4个
        const sortedDocs = docResponse.data
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
          .slice(0, 4);
        setRecentDocuments(sortedDocs);

        // 获取统计数据
        // 文档数量
        const documentCount = docResponse.data.length;

        // CVE漏洞数量 (从本地cve.md文件数量获取)
        let cveCount = 0;
        try {
          const cveAllResponse = await cveAPI.getAll(1, 1);
          cveCount = cveAllResponse.data.total || 0;
        } catch (e) {
          console.error('获取CVE数量失败:', e);
        }

        // 论坛帖子数量 (需要后端提供API)
        let postCount = 0;
        try {
          const forumAPI = require('../../services/api').forumAPI;
          const postsResponse = await forumAPI.getPosts();
          postCount = postsResponse.data.length;
        } catch (e) {
          console.error('获取帖子数量失败:', e);
        }

        // 活跃用户数量 (注册的用户数)
        let userCount = 0;
        try {
          const authAPI = require('../../services/api').authAPI;
          const usersResponse = await authAPI.getAllUsers();
          userCount = usersResponse.data.length;
        } catch (e) {
          console.error('获取用户数量失败:', e);
          // 如果没有管理员权限，设置为0
        }

        // 更新统计数据
        setStats([
          { title: '文档数量', value: documentCount, icon: <FileTextOutlined />, color: '#1890ff' },
          { title: 'CVE漏洞', value: cveCount, icon: <BugOutlined />, color: '#ff4d4f' },
          { title: '论坛帖子', value: postCount, icon: <MessageOutlined />, color: '#52c41a' },
          { title: '活跃用户', value: userCount, icon: <TeamOutlined />, color: '#722ed1' },
        ]);
      } catch (error) {
        console.error('获取数据失败:', error);
        message.error('获取数据失败');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const getThreatColor = (threat) => {
    const colors = { 
      'critical': 'red', '严重': 'red',
      'high': 'orange', '高危': 'orange',
      'medium': 'yellow', '中危': 'yellow',
      'low': 'green', '低危': 'green'
    };
    return colors[threat] || 'blue';
  };

  const getSeverityColor = (severity) => {
    const colors = { 'Critical': 'red', 'High': 'orange', 'Medium': 'yellow', 'Low': 'green' };
    return colors[severity] || 'blue';
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">平台概览</h1>
      
      <Row gutter={16} className="mb-6">
        {stats.map((stat, index) => (
          <Col span={6} key={index}>
            <Card>
              <Statistic
                title={stat.title}
                value={stat.value}
                prefix={React.cloneElement(stat.icon, { style: { color: stat.color } })}
              />
            </Card>
          </Col>
        ))}
      </Row>

      <Row gutter={16}>
        <Col span={12}>
          <Card title="最新文档" extra={<a href="/documents">查看更多</a>}>
            <List
              dataSource={recentDocuments}
              renderItem={(item) => (
                <List.Item>
                  <List.Item.Meta
                    title={item.title}
                    description={new Date(item.createdAt).toLocaleDateString()}
                  />
                  <Tag color={getThreatColor(item.threatLevel || '中危')}>{item.threatLevel || '中危'}</Tag>
                </List.Item>
              )}
            />
          </Card>
        </Col>
        <Col span={12}>
          <Card title="热门CVE" extra={<a href="/cve">查看更多</a>}>
            <List
              loading={loading}
              dataSource={hotCVEs}
              renderItem={(item) => (
                <List.Item>
                  <List.Item.Meta
                    title={item.id}
                    description={item.description || item.title}
                  />
                  <Tag color={getSeverityColor(item.severity)}>{item.severity}</Tag>
                </List.Item>
              )}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Home;
