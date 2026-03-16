import React, { useState, useEffect } from 'react';
import { Card, Upload, Button, Input, Form, message, Spin, Typography, Alert, Tag, Collapse } from 'antd';
import { UploadOutlined, RobotOutlined, FileTextOutlined, CopyOutlined, EyeOutlined } from '@ant-design/icons';
import { aiAnalysisAPI } from '../../services/api';

const { TextArea } = Input;
const { Title, Paragraph } = Typography;
const { Panel } = Collapse;

const AIAnalysis = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [analysisResult, setAnalysisResult] = useState('');
  const [fileList, setFileList] = useState([]);
  const [config, setConfig] = useState(null);
  const [fileContent, setFileContent] = useState('');
  const [fileName, setFileName] = useState('');

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      const response = await aiAnalysisAPI.getConfig();
      setConfig(response.data);
    } catch (error) {
      console.error('获取配置失败:', error);
    }
  };

  // 读取文件内容
  const readFileContent = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        resolve(e.target.result);
      };
      reader.onerror = (e) => {
        reject(e);
      };
      reader.readAsText(file);
    });
  };

  const handleFileChange = async (info) => {
    const file = info.file;
    if (!file) return;

    const isMarkdown = file.name.endsWith('.md') || file.name.endsWith('.markdown');
    const isText = file.type === 'text/plain' || file.name.endsWith('.txt');
    
    if (!isMarkdown && !isText) {
      message.error('只支持上传 Markdown 或文本文件');
      return;
    }

    try {
      const content = await readFileContent(file);
      setFileContent(content);
      setFileName(file.name);
      setFileList([{ originFileObj: file, name: file.name }]);
      message.success('文件读取成功');
    } catch (error) {
      message.error('文件读取失败');
      console.error('读取文件错误:', error);
    }
  };

  const handleAnalyzeFile = async (values) => {
    if (!fileContent) {
      message.error('请先上传文件');
      return;
    }

    setLoading(true);
    try {
      // 以纯文字方式发送文件内容
      const response = await aiAnalysisAPI.analyzeText(fileContent, values.customPrompt);
      setAnalysisResult(response.data.analysis);
      message.success('分析完成');
    } catch (error) {
      console.error('分析失败:', error);
      message.error('分析失败: ' + (error.response?.data?.message || '未知错误'));
    } finally {
      setLoading(false);
    }
  };

  const handleAnalyzeText = async (values) => {
    if (!values.content) {
      message.error('请输入要分析的内容');
      return;
    }

    setLoading(true);
    try {
      const response = await aiAnalysisAPI.analyzeText(values.content, values.customPrompt);
      setAnalysisResult(response.data.analysis);
      message.success('分析完成');
    } catch (error) {
      console.error('分析失败:', error);
      message.error('分析失败: ' + (error.response?.data?.message || '未知错误'));
    } finally {
      setLoading(false);
    }
  };

  const handleCopyResult = () => {
    navigator.clipboard.writeText(analysisResult);
    message.success('已复制到剪贴板');
  };

  const uploadProps = {
    onRemove: () => {
      setFileList([]);
      setFileContent('');
      setFileName('');
    },
    beforeUpload: () => false, // 阻止自动上传
    onChange: handleFileChange,
    fileList,
    maxCount: 1,
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <Title level={2}>
          <RobotOutlined className="mr-2" />
          智能分析
        </Title>
        <Paragraph className="text-gray-500">
          使用 AI 分析 CVE 漏洞文件，获取专业的安全建议
        </Paragraph>
      </div>

      {config && (
        <Alert
          message="AI 配置信息"
          description={
            <div>
              <Tag color="blue">模型: {config.model}</Tag>
              <Tag color="green">状态: 已连接</Tag>
            </div>
          }
          type="info"
          showIcon
          className="mb-6"
        />
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 文件分析 */}
        <Card title="上传文件分析" className="shadow-md">
          <Form
            form={form}
            layout="vertical"
            onFinish={handleAnalyzeFile}
          >
            <Form.Item
              label="上传 CVE 文件"
              extra="支持 Markdown (.md) 或文本 (.txt) 格式"
            >
              <Upload {...uploadProps}>
                <Button icon={<UploadOutlined />}>选择文件</Button>
              </Upload>
            </Form.Item>

            {/* 文件内容预览 */}
            {fileContent && (
              <Form.Item label="文件内容预览">
                <Collapse 
                  defaultActiveKey={['1']}
                  className="mb-4"
                >
                  <Panel 
                    header={<span><EyeOutlined className="mr-2"/>{fileName}</span>} 
                    key="1"
                  >
                    <div 
                      className="whitespace-pre-wrap font-mono text-sm leading-relaxed overflow-auto"
                      style={{ 
                        backgroundColor: '#f5f5f5', 
                        padding: '12px', 
                        borderRadius: '4px',
                        maxHeight: '300px',
                        border: '1px solid #e8e8e8'
                      }}
                    >
                      {fileContent}
                    </div>
                  </Panel>
                </Collapse>
              </Form.Item>
            )}

            <Form.Item
              name="customPrompt"
              label="自定义提示词（可选）"
            >
              <TextArea
                rows={3}
                placeholder="输入自定义提示词，覆盖默认设置..."
              />
            </Form.Item>

            <Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                loading={loading}
                icon={<RobotOutlined />}
                block
                disabled={!fileContent}
              >
                开始分析
              </Button>
            </Form.Item>
          </Form>
        </Card>

        {/* 文本分析 */}
        <Card title="直接输入分析" className="shadow-md">
          <Form
            layout="vertical"
            onFinish={handleAnalyzeText}
          >
            <Form.Item
              name="content"
              label="CVE 内容"
              rules={[{ required: true, message: '请输入要分析的内容' }]}
            >
              <TextArea
                rows={10}
                placeholder="在此粘贴 CVE 漏洞内容..."
              />
            </Form.Item>

            <Form.Item
              name="customPrompt"
              label="自定义提示词（可选）"
            >
              <TextArea
                rows={3}
                placeholder="输入自定义提示词，覆盖默认设置..."
              />
            </Form.Item>

            <Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                loading={loading}
                icon={<RobotOutlined />}
                block
              >
                开始分析
              </Button>
            </Form.Item>
          </Form>
        </Card>
      </div>

      {/* 分析结果 */}
      {analysisResult && (
        <Card
          title="分析结果"
          className="mt-6 shadow-md"
          extra={
            <Button
              icon={<CopyOutlined />}
              onClick={handleCopyResult}
              size="small"
            >
              复制结果
            </Button>
          }
        >
          <Spin spinning={loading}>
            <div 
              className="prose max-w-none whitespace-pre-wrap font-mono text-sm leading-relaxed"
              style={{ 
                backgroundColor: '#f8f9fa', 
                padding: '16px', 
                borderRadius: '8px',
                minHeight: '200px'
              }}
            >
              {analysisResult}
            </div>
          </Spin>
        </Card>
      )}
    </div>
  );
};

export default AIAnalysis;
