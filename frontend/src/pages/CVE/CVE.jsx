import React, { useState, useEffect } from 'react';
import { Card, Table, Input, Button, Tag, Row, Col, Statistic, message, Modal, Descriptions, Divider } from 'antd';
import { SearchOutlined, BugOutlined, SafetyOutlined, WarningOutlined, EyeOutlined } from '@ant-design/icons';
import { cveAPI } from '../../services/api';

const CVE = () => {
  const [searchText, setSearchText] = useState('');
  const [cveData, setCveData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedCVE, setSelectedCVE] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 15,
    total: 0,
    showSizeChanger: false,
    showQuickJumper: true,
  });
  const [stats, setStats] = useState({
    total: 0,
    critical: 0,
    high: 0,
    medium: 0,
  });

  const fetchCVEs = async (page = 1, pageSize = 15, search = searchText) => {
    setLoading(true);
    try {
      const response = await cveAPI.getAll(page, pageSize, search);
      const { cves, total } = response.data;
      setCveData(cves);
      setPagination({
        ...pagination,
        current: page,
        total: total,
      });
    } catch (error) {
      console.error('获取CVE列表失败:', error);
      message.error('获取CVE列表失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCVEs(pagination.current, pagination.pageSize);
    
    // 获取统计数据
    const fetchStats = async () => {
      try {
        const response = await cveAPI.getStats();
        const { total, bySeverity } = response.data;
        setStats({
          total: total,
          critical: bySeverity.Critical || 0,
          high: bySeverity.High || 0,
          medium: bySeverity.Medium || 0,
        });
      } catch (error) {
        console.error('获取统计数据失败:', error);
      }
    };
    fetchStats();
  }, []);

  const handleTableChange = (newPagination) => {
    fetchCVEs(newPagination.current, newPagination.pageSize, searchText);
  };

  const handleViewDetail = (record) => {
    setSelectedCVE(record);
    setDetailModalVisible(true);
    // 这里可以调用API获取更详细的CVE信息
    fetchCVEDetail(record.id);
  };

  const fetchCVEDetail = async (cveId) => {
    setDetailLoading(true);
    try {
      const response = await cveAPI.getById(cveId);
      setSelectedCVE(response.data);
    } catch (error) {
      console.error('获取CVE详情失败:', error);
      // 如果API调用失败，保持列表中的基本数据
    } finally {
      setDetailLoading(false);
    }
  };

  const handleCloseModal = () => {
    setDetailModalVisible(false);
    setSelectedCVE(null);
  };

  const columns = [
    { title: 'CVE ID', dataIndex: 'id', key: 'id', width: 150 },
    { title: '标题', dataIndex: 'title', key: 'title' },
    {
      title: '严重程度',
      dataIndex: 'severity',
      key: 'severity',
      width: 120,
      render: (severity) => {
        const colors = { 'Critical': 'red', 'High': 'orange', 'Medium': 'yellow', 'Low': 'green', 'Unknown': 'default' };
        const labels = { 'Critical': '严重', 'High': '高危', 'Medium': '中危', 'Low': '低危', 'Unknown': '未知' };
        return <Tag color={colors[severity] || 'default'}>{labels[severity] || severity}</Tag>;
      },
    },
    { title: '发布年份', dataIndex: 'date', key: 'date', width: 120 },
    {
      title: '操作',
      key: 'action',
      width: 120,
      render: (_, record) => (
        <Button 
          type="link" 
          size="small" 
          icon={<EyeOutlined />}
          onClick={() => handleViewDetail(record)}
        >
          查看详情
        </Button>
      ),
    },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">CVE漏洞信息</h1>

      <Row gutter={16} className="mb-6">
        <Col span={6}>
          <Card>
            <Statistic
              title="总漏洞数"
              value={stats.total}
              prefix={<BugOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="严重漏洞"
              value={stats.critical}
              prefix={<WarningOutlined />}
              valueStyle={{ color: '#ff4d4f' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="高危漏洞"
              value={stats.high}
              prefix={<WarningOutlined />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="中危漏洞"
              value={stats.medium}
              prefix={<SafetyOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
      </Row>

      <Card className="mb-6">
        <Input.Search
          placeholder="搜索CVE ID或标题"
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          onSearch={() => {
            fetchCVEs(1, pagination.pageSize);
          }}
          prefix={<SearchOutlined />}
          style={{ width: 300 }}
        />
      </Card>

      <Card>
        <Table
          columns={columns}
          dataSource={cveData}
          rowKey="id"
          pagination={pagination}
          loading={loading}
          onChange={handleTableChange}
        />
      </Card>

      {/* CVE详情弹窗 */}
      <Modal
        title={
          <div className="flex items-center gap-2">
            <BugOutlined className="text-blue-500" />
            <span>CVE详情</span>
          </div>
        }
        open={detailModalVisible}
        onCancel={handleCloseModal}
        footer={[
          <Button key="close" onClick={handleCloseModal}>
            关闭
          </Button>,
        ]}
        width={700}
        loading={detailLoading}
      >
        {selectedCVE && (
          <div>
            <Descriptions bordered column={1} className="mb-4">
              <Descriptions.Item label="CVE ID">
                <span className="font-mono text-lg font-bold text-blue-600">
                  {selectedCVE.id}
                </span>
              </Descriptions.Item>
              <Descriptions.Item label="严重程度">
                <Tag 
                  color={
                    selectedCVE.severity === 'Critical' ? 'red' :
                    selectedCVE.severity === 'High' ? 'orange' :
                    selectedCVE.severity === 'Medium' ? 'yellow' :
                    selectedCVE.severity === 'Low' ? 'green' : 'default'
                  }
                >
                  {selectedCVE.severity === 'Critical' ? '严重' :
                   selectedCVE.severity === 'High' ? '高危' :
                   selectedCVE.severity === 'Medium' ? '中危' :
                   selectedCVE.severity === 'Low' ? '低危' : '未知'}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="发布年份">
                {selectedCVE.date}
              </Descriptions.Item>
            </Descriptions>

            <Divider orientation="left">描述信息</Divider>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-gray-700 leading-relaxed">
                {selectedCVE.description || '暂无描述信息'}
              </p>
            </div>

            {selectedCVE.title && selectedCVE.title !== selectedCVE.id && (
              <>
                <Divider orientation="left">标题</Divider>
                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="text-blue-800">{selectedCVE.title}</p>
                </div>
              </>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default CVE;
