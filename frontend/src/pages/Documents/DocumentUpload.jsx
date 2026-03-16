import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Upload, Button, Input, Form, message, Alert } from 'antd';
import { UploadOutlined, FileTextOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import { documentAPI } from '../../services/api';

const { TextArea } = Input;

const DocumentUpload = () => {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [fileList, setFileList] = useState([]);

  const handleUpload = async (values) => {
    if (fileList.length === 0 && !values.content) {
      message.error('请上传文件或输入内容');
      return;
    }

    setLoading(true);
    try {
      let response;
      
      if (fileList.length > 0) {
        // 文件上传
        const formData = new FormData();
        formData.append('file', fileList[0].originFileObj);
        formData.append('title', values.title);
        response = await documentAPI.upload(formData);
      } else {
        // 文本内容上传
        response = await documentAPI.create({
          title: values.title,
          content: values.content,
        });
      }

      message.success('文档上传成功');
      navigate('/documents');
    } catch (error) {
      message.error('上传失败: ' + (error.response?.data?.message || '未知错误'));
    } finally {
      setLoading(false);
    }
  };

  const uploadProps = {
    onRemove: () => {
      setFileList([]);
    },
    beforeUpload: (file) => {
      setFileList([{ originFileObj: file, name: file.name }]);
      return false;
    },
    fileList,
  };

  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/documents')}>
          返回
        </Button>
        <h1 className="text-2xl font-bold">上传文档</h1>
      </div>

      <Card className="max-w-2xl">
        <Alert
          message="提示"
          description="您可以上传文件或直接输入文本内容。支持 PDF、Word、TXT 等格式。"
          type="info"
          showIcon
          className="mb-6"
        />

        <Form
          form={form}
          layout="vertical"
          onFinish={handleUpload}
          initialValues={{ title: '' }}
        >
          <Form.Item
            name="title"
            label="文档标题"
            rules={[{ required: true, message: '请输入文档标题' }]}
          >
            <Input placeholder="请输入文档标题" prefix={<FileTextOutlined />} />
          </Form.Item>

          <Form.Item label="上传文件">
            <Upload {...uploadProps} maxCount={1}>
              <Button icon={<UploadOutlined />}>选择文件</Button>
            </Upload>
            <p className="text-gray-400 text-sm mt-2">
              支持 PDF、DOC、DOCX、TXT 格式，最大 10MB
            </p>
          </Form.Item>

          <Form.Item
            name="content"
            label="或输入文本内容"
          >
            <TextArea
              rows={10}
              placeholder="在此输入文档内容..."
              disabled={fileList.length > 0}
            />
          </Form.Item>

          <Form.Item>
            <div className="flex gap-4">
              <Button type="primary" htmlType="submit" loading={loading}>
                上传文档
              </Button>
              <Button onClick={() => navigate('/documents')}>
                取消
              </Button>
            </div>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default DocumentUpload;
