import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Button, Tag, Descriptions, Divider, message, Spin } from 'antd';
import { ArrowLeftOutlined, FileTextOutlined, EyeOutlined } from '@ant-design/icons';
import { documentAPI } from '../../services/api';

const DocumentDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [document, setDocument] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDocument();
  }, [id]);

  const fetchDocument = async () => {
    setLoading(true);
    try {
      const response = await documentAPI.getById(id);
      setDocument(response.data);
    } catch (error) {
      message.error('获取文档详情失败');
    } finally {
      setLoading(false);
    }
  };

  const getThreatLevelColor = (level) => {
    const colors = {
      low: 'green',
      medium: 'yellow',
      high: 'orange',
      critical: 'red',
    };
    return colors[level] || 'default';
  };

  const getThreatLevelText = (level) => {
    const texts = {
      low: '低危',
      medium: '中危',
      high: '高危',
      critical: '严重',
    };
    return texts[level] || '未知';
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spin size="large" />
      </div>
    );
  }

  if (!document) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">文档不存在</p>
        <Button onClick={() => navigate('/documents')} className="mt-4">
          返回文档列表
        </Button>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/documents')}>
          返回
        </Button>
        <h1 className="text-2xl font-bold">文档详情</h1>
      </div>

      <Card>
        <Descriptions bordered column={2}>
          <Descriptions.Item label="标题" span={2}>
            {document.title}
          </Descriptions.Item>
          <Descriptions.Item label="威胁等级">
            <Tag color={getThreatLevelColor(document.threatLevel)}>
              {getThreatLevelText(document.threatLevel)}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="热度">
            <span className="flex items-center gap-1">
              <EyeOutlined /> {document.heat || 0}
            </span>
          </Descriptions.Item>
          <Descriptions.Item label="作者">
            {document.User?.username || '未知'}
          </Descriptions.Item>
          <Descriptions.Item label="发布时间">
            {new Date(document.createdAt).toLocaleString()}
          </Descriptions.Item>
          <Descriptions.Item label="文件类型" span={2}>
            {document.fileType || '文本'}
          </Descriptions.Item>
        </Descriptions>

        <Divider orientation="left">
          <FileTextOutlined /> 内容
        </Divider>
        <div className="bg-gray-50 p-4 rounded-lg min-h-[200px]">
          <pre className="whitespace-pre-wrap text-gray-700">
            {document.content || '暂无内容'}
          </pre>
        </div>

        {document.aiAnalysis && (
          <>
            <Divider orientation="left">AI分析结果</Divider>
            <div className="bg-blue-50 p-4 rounded-lg">
              <pre className="whitespace-pre-wrap text-blue-800">
                {JSON.stringify(document.aiAnalysis, null, 2)}
              </pre>
            </div>
          </>
        )}
      </Card>
    </div>
  );
};

export default DocumentDetail;
