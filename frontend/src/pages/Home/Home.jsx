import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Statistic, List, Tag, message } from 'antd';
import { FileTextOutlined, BugOutlined, MessageOutlined, TeamOutlined } from '@ant-design/icons';
import { cveAPI, documentAPI, forumAPI, authAPI } from '../../services/api';

const Home = () => {
  const [hotCVEs, setHotCVEs] = useState([]);
  const [recentDocuments, setRecentDocuments] = useState([]);
  const [stats, setStats] = useState([
    { title: '文档数量', value: 0, icon: <FileTextOutlined />, color: '#059669' },
    { title: 'CVE漏洞', value: 0, icon: <BugOutlined />, color: '#ef4444' },
    { title: '论坛帖子', value: 0, icon: <MessageOutlined />, color: '#f59e0b' },
    { title: '活跃用户', value: 0, icon: <TeamOutlined />, color: '#8b5cf6' },
  ]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const cveResponse = await cveAPI.getHot();
        setHotCVEs(cveResponse.data);

        const docResponse = await documentAPI.getAll();
        const sortedDocs = docResponse.data
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
          .slice(0, 4);
        setRecentDocuments(sortedDocs);

        const documentCount = docResponse.data.length;

        let cveCount = 0;
        try {
          const cveAllResponse = await cveAPI.getAll(1, 1);
          cveCount = cveAllResponse.data.total || 0;
        } catch (e) {
          console.error('获取CVE数量失败:', e);
        }

        let postCount = 0;
        try {
          const postsResponse = await forumAPI.getPosts();
          postCount = postsResponse.data.total || 0;
        } catch (e) {
          console.error('获取帖子数量失败:', e);
        }

        let userCount = 0;
        try {
          const usersResponse = await authAPI.getAllUsers();
          userCount = usersResponse.data.length || 0;
        } catch (e) {
          console.error('获取用户数量失败:', e);
        }

        setStats([
          { title: '文档数量', value: documentCount, icon: <FileTextOutlined />, color: '#059669' },
          { title: 'CVE漏洞', value: cveCount, icon: <BugOutlined />, color: '#ef4444' },
          { title: '论坛帖子', value: postCount, icon: <MessageOutlined />, color: '#f59e0b' },
          { title: '活跃用户', value: userCount, icon: <TeamOutlined />, color: '#8b5cf6' },
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
      <h1 className="text-2xl font-bold mb-6 dark:text-white">平台概览</h1>

      <Row gutter={16} className="mb-6">
        {stats.map((stat, index) => (
          <Col xs={24} sm={12} lg={6} key={index}>
            <Card className="dark:bg-slate-800 dark:border-slate-700">
              <Statistic
                title={<span className="dark:text-slate-400">{stat.title}</span>}
                value={stat.value}
                prefix={React.cloneElement(stat.icon, { style: { color: stat.color } })}
                valueStyle={{ fontFamily: "'JetBrains Mono', monospace" }}
              />
            </Card>
          </Col>
        ))}
      </Row>

      <Row gutter={16}>
        <Col xs={24} lg={12}>
          <Card
            title={<span className="dark:text-white">最新文档</span>}
            extra={<a href="/documents" className="text-primary-600 dark:text-primary-400">查看更多</a>}
            className="dark:bg-slate-800 dark:border-slate-700"
          >
            <List
              dataSource={recentDocuments}
              renderItem={(item) => (
                <List.Item>
                  <List.Item.Meta
                    title={<span className="dark:text-white">{item.title}</span>}
                    description={<span className="dark:text-slate-400">{new Date(item.createdAt).toLocaleDateString()}</span>}
                  />
                  <Tag color={getThreatColor(item.threatLevel || '中危')}>{item.threatLevel || '中危'}</Tag>
                </List.Item>
              )}
            />
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card
            title={<span className="dark:text-white">热门CVE</span>}
            extra={<a href="/cve" className="text-primary-600 dark:text-primary-400">查看更多</a>}
            className="dark:bg-slate-800 dark:border-slate-700"
          >
            <List
              loading={loading}
              dataSource={hotCVEs}
              renderItem={(item) => (
                <List.Item>
                  <List.Item.Meta
                    title={<span className="font-mono dark:text-white">{item.id}</span>}
                    description={<span className="dark:text-slate-400">{item.description || item.title}</span>}
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
