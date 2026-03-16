import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Modal, Form, Input, message, Tag, Space, Select } from 'antd';
import { EyeOutlined, DeleteOutlined, PlusOutlined, EditOutlined } from '@ant-design/icons';
import { Editor, Toolbar } from '@wangeditor/editor-for-react';
import { documentAPI, uploadAPI } from '../../services/api';
import '@wangeditor/editor/dist/css/style.css';

const Documents = () => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [currentDoc, setCurrentDoc] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();
  
  // Editor state
  const [editor, setEditor] = useState(null);
  const [html, setHtml] = useState('');

  const threatMap = {
    'low': { label: '低危', color: 'green' },
    'medium': { label: '中危', color: 'yellow' },
    'high': { label: '高危', color: 'orange' },
    'critical': { label: '严重', color: 'red' }
  };

  const fetchDocuments = async () => {
    setLoading(true);
    try {
      const response = await documentAPI.getAll();
      setDocuments(response.data);
    } catch (error) {
      console.error('获取文档列表失败:', error);
      message.error('获取文档列表失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  // Editor configuration
  const toolbarConfig = {
    excludeKeys: ['video', 'insertVideo'] // 移除视频功能
  };

  const editorConfig = {
    placeholder: '请输入内容...',
    MENU_CONF: {
      uploadImage: {
        async customUpload(file, insertFn) {
          const formData = new FormData();
          formData.append('file', file);
          try {
            const response = await uploadAPI.uploadImage(formData);
            const url = response.data.url;
            insertFn(url, file.name, url);
          } catch (error) {
            message.error('图片上传失败');
          }
        },
      }
    }
  };

  useEffect(() => {
    return () => {
      if (editor == null) return;
      editor.destroy();
      setEditor(null);
    };
  }, [editor]);

  const columns = [
    { title: 'ID', dataIndex: 'id', key: 'id', width: 80 },
    { title: '标题', dataIndex: 'title', key: 'title' },
    { 
      title: '作者', 
      dataIndex: ['User', 'username'], 
      key: 'author', 
      width: 120,
      render: (text) => text || '未知'
    },
    { 
      title: '日期', 
      dataIndex: 'createdAt', 
      key: 'date', 
      width: 180,
      render: (date) => new Date(date).toLocaleString()
    },
    {
      title: '威胁等级',
      dataIndex: 'threatLevel',
      key: 'threatLevel',
      width: 100,
      render: (level) => {
        const config = threatMap[level] || { label: level, color: 'blue' };
        return <Tag color={config.color}>{config.label}</Tag>;
      },
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status) => {
        const statusMap = {
          'pending': { label: '待分析', color: 'orange' },
          'analyzing': { label: '分析中', color: 'blue' },
          'completed': { label: '已完成', color: 'green' }
        };
        const config = statusMap[status] || { label: status, color: 'default' };
        return <Tag color={config.color}>{config.label}</Tag>;
      },
    },
    {
      title: '操作',
      key: 'action',
      width: 200,
      render: (_, record) => (
        <Space>
          <Button type="link" icon={<EyeOutlined />} onClick={() => handleView(record)}>查看</Button>
          {JSON.parse(localStorage.getItem('user'))?.role === 'admin' && (
            <Button type="link" icon={<EditOutlined />} onClick={() => handleEdit(record)}>编辑</Button>
          )}
          {JSON.parse(localStorage.getItem('user'))?.role === 'admin' && (
            <Button type="link" danger icon={<DeleteOutlined />} onClick={() => handleDelete(record.id)}>删除</Button>
          )}
        </Space>
      ),
    },
  ];

  const handleView = (doc) => {
    setCurrentDoc(doc);
    setIsModalVisible(true);
  };

  const handleEdit = (doc) => {
    setCurrentDoc(doc);
    setHtml(doc.content || '');
    form.setFieldsValue({
      title: doc.title,
      threatLevel: doc.threatLevel || 'medium'
    });
    setIsEditModalVisible(true);
  };

  const handleCreate = () => {
    setCurrentDoc(null);
    setHtml('');
    form.resetFields();
    setIsEditModalVisible(true);
  };

  const handleDelete = (id) => {
    Modal.confirm({
      title: '确认删除',
      content: '确定要删除这个文档吗？',
      onOk: async () => {
        try {
          await documentAPI.delete(id);
          message.success('删除成功');
          fetchDocuments();
        } catch (error) {
          message.error('删除失败');
        }
      },
    });
  };

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      const data = { ...values, content: html };
      
      if (currentDoc) {
        await documentAPI.update(currentDoc.id, data);
        message.success('更新成功');
      } else {
        await documentAPI.create(data);
        message.success('创建成功');
      }
      setIsEditModalVisible(false);
      fetchDocuments();
    } catch (error) {
      console.error('保存失败:', error);
      message.error('保存失败');
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">文档管理</h1>
        {JSON.parse(localStorage.getItem('user'))?.role === 'admin' && (
          <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>新建文档</Button>
        )}
      </div>

      <Card>
        <Table
          columns={columns}
          dataSource={documents}
          rowKey="id"
          loading={loading}
        />
      </Card>

      {/* View Modal */}
      <Modal
        title="文档详情"
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setIsModalVisible(false)}>关闭</Button>,
        ]}
        width={1000}
      >
        {currentDoc && (
          <div>
            <h2 className="text-2xl font-bold mb-4">{currentDoc.title}</h2>
            <div className="mb-4 flex gap-4">
              <span><strong>作者：</strong>{currentDoc.User?.username || '未知'}</span>
              <span><strong>日期：</strong>{new Date(currentDoc.createdAt).toLocaleString()}</span>
              <span><strong>威胁等级：</strong>
                <Tag color={threatMap[currentDoc.threatLevel]?.color}>
                  {threatMap[currentDoc.threatLevel]?.label || currentDoc.threatLevel}
                </Tag>
              </span>
            </div>
            <div 
              className="border p-6 rounded bg-white min-h-[400px] overflow-auto"
              dangerouslySetInnerHTML={{ __html: currentDoc.content }}
            />
          </div>
        )}
      </Modal>

      {/* Edit/Create Modal */}
      <Modal
        title={currentDoc ? "编辑文档" : "新建文档"}
        open={isEditModalVisible}
        onCancel={() => setIsEditModalVisible(false)}
        onOk={handleSave}
        width={1200}
        style={{ top: 20 }}
        destroyOnClose
      >
        <Form form={form} layout="vertical">
          <div className="flex gap-4">
            <Form.Item name="title" label="文档标题" rules={[{ required: true, message: '请输入标题' }]} className="flex-1">
              <Input placeholder="请输入文档标题" />
            </Form.Item>
            <Form.Item name="threatLevel" label="威胁等级" initialValue="medium" className="w-40">
              <Select>
                <Select.Option value="low">低危</Select.Option>
                <Select.Option value="medium">中危</Select.Option>
                <Select.Option value="high">高危</Select.Option>
                <Select.Option value="critical">严重</Select.Option>
              </Select>
            </Form.Item>
          </div>
          
          <div className="border border-gray-300 rounded overflow-hidden">
            <Toolbar editor={editor} defaultConfig={toolbarConfig} mode="default" style={{ borderBottom: '1px solid #ccc' }} />
            <Editor
              defaultConfig={editorConfig}
              value={html}
              onCreated={setEditor}
              onChange={editor => setHtml(editor.getHtml())}
              mode="default"
              style={{ height: '500px', overflowY: 'hidden' }}
            />
          </div>
        </Form>
      </Modal>
    </div>
  );
};

export default Documents;
