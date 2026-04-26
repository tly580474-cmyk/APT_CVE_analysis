import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Card, Upload, Button, Input, Form, message, Spin, Typography, Alert, Tag, Collapse, Switch } from 'antd';
import { UploadOutlined, RobotOutlined, FileTextOutlined, CopyOutlined, EyeOutlined, ThunderboltOutlined } from '@ant-design/icons';
import { aiAnalysisAPI } from '../../services/api';
import markdownIt from 'markdown-it';
import hljs from 'highlight.js';

import 'highlight.js/styles/github-dark.css';

const md = markdownIt({
  html: true,
  linkify: true,
  typographer: true,
  highlight: function (str, lang) {
    if (lang && hljs.getLanguage(lang)) {
      try {
        return '<pre class="hljs"><code>' +
          hljs.highlight(str, { language: lang, ignoreIllegals: true }).value +
          '</code></pre>';
      } catch (__) {}
    }
    return '<pre class="hljs"><code>' + md.utils.escapeHtml(str) + '</code></pre>';
  }
});

md.renderer.rules.table_open = function () {
  return '<div class="table-wrapper"><table>';
};
md.renderer.rules.table_close = function () {
  return '</table></div>';
};

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
  const [streamMode, setStreamMode] = useState(true);
  const [isStreaming, setIsStreaming] = useState(false);
  const resultRef = useRef(null);

  const renderedContent = useMemo(() => {
    if (!analysisResult) return '';
    return md.render(analysisResult);
  }, [analysisResult]);

  useEffect(() => {
    fetchConfig();
  }, []);

  useEffect(() => {
    if (resultRef.current) {
      resultRef.current.scrollTop = resultRef.current.scrollHeight;
    }
  }, [analysisResult]);

  const fetchConfig = async () => {
    try {
      const response = await aiAnalysisAPI.getConfig();
      setConfig(response.data);
    } catch (error) {
      console.error('获取配置失败:', error);
    }
  };

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

  const handleStreamAnalyze = async (content, customPrompt) => {
    setIsStreaming(true);
    setAnalysisResult('');
    setLoading(true);

    try {
      const response = await aiAnalysisAPI.analyzeTextStream(content, customPrompt);
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') {
              break;
            }
            try {
              const parsed = JSON.parse(data);
              if (parsed.content) {
                setAnalysisResult(prev => prev + parsed.content);
              }
              if (parsed.error) {
                message.error('流式分析错误: ' + parsed.error);
              }
            } catch (e) {
              // 忽略解析错误
            }
          }
        }
      }
      message.success('分析完成');
    } catch (error) {
      console.error('流式分析失败:', error);
      message.error('分析失败: ' + (error.message || '未知错误'));
    } finally {
      setIsStreaming(false);
      setLoading(false);
    }
  };

  const handleAnalyzeFile = async (values) => {
    if (!fileContent) {
      message.error('请先上传文件');
      return;
    }

    if (streamMode) {
      await handleStreamAnalyze(fileContent, values.customPrompt);
    } else {
      setLoading(true);
      try {
        const response = await aiAnalysisAPI.analyzeText(fileContent, values.customPrompt);
        setAnalysisResult(response.data.analysis);
        message.success('分析完成');
      } catch (error) {
        console.error('分析失败:', error);
        message.error('分析失败: ' + (error.response?.data?.message || '未知错误'));
      } finally {
        setLoading(false);
      }
    }
  };

  const handleAnalyzeText = async (values) => {
    if (!values.content) {
      message.error('请输入要分析的内容');
      return;
    }

    if (streamMode) {
      await handleStreamAnalyze(values.content, values.customPrompt);
    } else {
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
    }
  };

  const handleCopyResult = () => {
    navigator.clipboard.writeText(analysisResult);
    message.success('已复制到剪贴板');
  };

  const handleStopStream = () => {
    setIsStreaming(false);
    setLoading(false);
  };

  const uploadProps = {
    onRemove: () => {
      setFileList([]);
      setFileContent('');
      setFileName('');
    },
    beforeUpload: () => false,
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

      <div className="flex items-center gap-4 mb-4">
        <Tag color="blue">模式: {streamMode ? '流式输出' : '普通输出'}</Tag>
        <div className="flex items-center gap-2">
          <span>流式输出</span>
          <Switch checked={streamMode} onChange={setStreamMode} />
        </div>
      </div>

      {config && (
        <Alert
          message="AI 配置信息"
          description={
            <div>
              <Tag color="blue">模型: {config.model}</Tag>
              <Tag color="green">状态: 已连接</Tag>
              {streamMode && <Tag color="orange">流式: 开启</Tag>}
            </div>
          }
          type="info"
          showIcon
          className="mb-6"
        />
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
              {isStreaming ? (
                <Button
                  danger
                  onClick={handleStopStream}
                  block
                >
                  停止生成
                </Button>
              ) : (
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={loading}
                  icon={streamMode ? <ThunderboltOutlined /> : <RobotOutlined />}
                  block
                  disabled={!fileContent}
                >
                  {streamMode ? '开始流式分析' : '开始分析'}
                </Button>
              )}
            </Form.Item>
          </Form>
        </Card>

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
              {isStreaming ? (
                <Button
                  danger
                  onClick={handleStopStream}
                  block
                >
                  停止生成
                </Button>
              ) : (
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={loading}
                  icon={streamMode ? <ThunderboltOutlined /> : <RobotOutlined />}
                  block
                >
                  {streamMode ? '开始流式分析' : '开始分析'}
                </Button>
              )}
            </Form.Item>
          </Form>
        </Card>
      </div>

      {analysisResult && (
        <Card
          title={isStreaming ? "分析结果 (生成中...)" : "分析结果"}
          className="mt-6 shadow-md"
          extra={
            <div className="flex gap-2">
              {isStreaming && <Tag color="red">生成中...</Tag>}
              <Button
                icon={<CopyOutlined />}
                onClick={handleCopyResult}
                size="small"
              >
                复制结果
              </Button>
            </div>
          }
        >
          <Spin spinning={loading && !isStreaming}>
            <div
              ref={resultRef}
              className="prose max-w-none"
              style={{
                backgroundColor: '#fafafa',
                padding: '16px',
                borderRadius: '8px',
                minHeight: '200px',
                maxHeight: '600px',
                overflow: 'auto'
              }}
            >
              <div
                className="markdown-body"
                dangerouslySetInnerHTML={{ __html: renderedContent }}
              />
              {isStreaming && <span className="animate-pulse">▊</span>}
            </div>
          </Spin>
        </Card>
      )}

      <style>{`
        .markdown-body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif;
          font-size: 14px;
          line-height: 1.6;
          word-wrap: break-word;
        }
        .markdown-body h1,
        .markdown-body h2,
        .markdown-body h3,
        .markdown-body h4,
        .markdown-body h5,
        .markdown-body h6 {
          margin-top: 24px;
          margin-bottom: 16px;
          font-weight: 600;
          line-height: 1.25;
        }
        .markdown-body h1 { font-size: 2em; border-bottom: 1px solid #eaecef; padding-bottom: 0.3em; }
        .markdown-body h2 { font-size: 1.5em; border-bottom: 1px solid #eaecef; padding-bottom: 0.3em; }
        .markdown-body h3 { font-size: 1.25em; }
        .markdown-body p {
          margin-top: 0;
          margin-bottom: 16px;
        }
        .markdown-body ul,
        .markdown-body ol {
          padding-left: 2em;
          margin-top: 0;
          margin-bottom: 16px;
        }
        .markdown-body li {
          margin-top: 0.25em;
        }
        .markdown-body blockquote {
          padding: 0 1em;
          color: #6a737d;
          border-left: 0.25em solid #dfe2e5;
          margin: 0 0 16px 0;
        }
        .markdown-body code {
          padding: 0.2em 0.4em;
          margin: 0;
          font-size: 85%;
          background-color: rgba(27, 31, 35, 0.05);
          border-radius: 3px;
          font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
        }
        .markdown-body pre {
          margin: 0 0 16px 0;
          padding: 16px;
          overflow: auto;
          font-size: 85%;
          line-height: 1.45;
          background-color: #1e1e1e;
          border-radius: 6px;
        }
        .markdown-body pre code {
          padding: 0;
          margin: 0;
          background-color: transparent;
          border: 0;
          font-size: 100%;
        }
        .markdown-body table {
          border-collapse: collapse;
          margin: 0 0 16px 0;
          width: 100%;
        }
        .markdown-body table th,
        .markdown-body table td {
          padding: 6px 13px;
          border: 1px solid #dfe2e5;
        }
        .markdown-body table th {
          font-weight: 600;
          background-color: #f6f8fa;
        }
        .markdown-body table tr:nth-child(2n) {
          background-color: #f6f8fa;
        }
        .markdown-body .table-wrapper {
          overflow-x: auto;
          margin: 0 0 16px 0;
        }
        .markdown-body hr {
          height: 0.25em;
          padding: 0;
          margin: 24px 0;
          background-color: #e1e4e8;
          border: 0;
        }
        .markdown-body a {
          color: #0366d6;
          text-decoration: none;
        }
        .markdown-body a:hover {
          text-decoration: underline;
        }
        .markdown-body img {
          max-width: 100%;
          box-sizing: content-box;
        }
      `}</style>
    </div>
  );
};

export default AIAnalysis;