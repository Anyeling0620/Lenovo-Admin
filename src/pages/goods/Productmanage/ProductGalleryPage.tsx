/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect, useCallback } from 'react';
import {
  Card, Row, Col, Button, Upload, Image, Typography, Space, 
  Tooltip, Modal, Form, InputNumber, Tabs, Spin, message, Tag
} from 'antd';
import type { UploadFile } from 'antd';
import {
  ArrowLeftOutlined, PictureOutlined, UploadOutlined, EyeOutlined,
  EditOutlined, LoadingOutlined, PlusOutlined
} from '@ant-design/icons';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { getImageUrl } from '../../../utils/imageUrl';
import { globalMessage } from '../../../utils/globalMessage';
import { globalErrorHandler } from '../../../utils/globalAxiosErrorHandler';
import { 
  getProductDetail, 
  addProductBanner, 
  updateProductBanner, 
  addProductAppearance, 
  updateProductAppearance,
  getProductConfigs
} from '../../../services/api';

const { Text } = Typography;
const { TabPane } = Tabs;

const ProductGalleryPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const [productDetail, setProductDetail] = useState<any>(null);
  const [bannerUploading, setBannerUploading] = useState<Record<string, boolean>>({});
  const [appearanceUploading, setAppearanceUploading] = useState<Record<string, boolean>>({});
  const [bannerEditVisible, setBannerEditVisible] = useState(false);
  const [bannerUploadModalVisible, setBannerUploadModalVisible] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState<UploadFile[]>([]);
  const [defaultSort, setDefaultSort] = useState<number>(0);
  const [editingBanner, setEditingBanner] = useState<any>(null);
  const [bannerForm] = Form.useForm();
  
  // 从URL参数获取返回路径
  const searchParams = new URLSearchParams(location.search);
  const fromPath = searchParams.get('return') || '/goods/manage/list';

  // 加载商品详情
  const loadProductDetail = useCallback(async () => {
    if (!id) return;
    
    try {
      const detail = await getProductDetail(id);
      setProductDetail(detail);
    } catch (error) {
      globalErrorHandler.handle(error, globalMessage.error);
    }
  }, [id]);

  // 加载商品配置（获取SKU图片）
  const loadProductConfigs = useCallback(async () => {
    if (!id) return;
    
    try {
      const configs = await getProductConfigs(id);
      // 如果productDetail中已经有appearances，则合并，否则用configs作为appearances
      if (configs && Array.isArray(configs)) {
        const skuImages = configs
          .filter(config => config.image)
          .map(config => ({
            product_appearance_id: `config-${config.product_config_id}`,
            image: config.image,
            is_sku: true
          }));
        
        setProductDetail((prev: any) => ({
          ...prev,
          appearances: [...(prev?.appearances || []), ...skuImages]
        }));
      }
    } catch (error) {
      console.error('加载商品配置失败:', error);
    }
  }, [id]);

  useEffect(() => {
    loadProductDetail();
    loadProductConfigs();
  }, [loadProductDetail, loadProductConfigs]);

  // 图片上传验证
  const validateImage = (file: File): boolean => {
    const isImage = file.type.startsWith('image/');
    if (!isImage) {
      message.error('只能上传图片文件');
      return false;
    }
    
    const isLt5M = file.size / 1024 / 1024 < 5;
    if (!isLt5M) {
      message.error('图片大小不能超过5MB');
      return false;
    }
    
    return true;
  };

  // 打开批量上传模态框
  const handleOpenBatchUpload = () => {
    setBannerUploadModalVisible(true);
  };

  // 批量上传Banner
  const handleBatchBannerUpload = async () => {
    if (!id || uploadingFiles.length === 0) {
      message.warning('请选择要上传的图片');
      return;
    }

    try {
      setBannerUploading({ ...bannerUploading, 'batch': true });
      
      // 按顺序上传每张图片，使用递增的排序值
      const uploadPromises = uploadingFiles.map(async (uploadFile, index) => {
        const sortValue = defaultSort + index;
        if (uploadFile.originFileObj) {
          await addProductBanner(id, { 
            imageFile: uploadFile.originFileObj, 
            sort: sortValue 
          });
        }
      });

      await Promise.all(uploadPromises);
      
      globalMessage.success(`成功上传 ${uploadingFiles.length} 张图片`);
      
      // 重置状态
      setUploadingFiles([]);
      setBannerUploadModalVisible(false);
      setDefaultSort(0);
      
      // 重新加载商品详情
      await loadProductDetail();
    } catch (error) {
      console.error('批量上传失败:', error);
      globalErrorHandler.handle(error, globalMessage.error);
    } finally {
      setBannerUploading({ ...bannerUploading, 'batch': false });
    }
  };

  // 外观图上传
  const handleAppearanceUpload = async (file: File) => {
    if (!id || !validateImage(file)) return '';
    
    const appearanceId = `upload-${Date.now()}`;
    setAppearanceUploading(prev => ({ ...prev, [appearanceId]: true }));
    
    try {
      await addProductAppearance(id, file);
      globalMessage.success('外观图添加成功');
      
      // 重新加载商品详情
      await loadProductDetail();
      return '';
    } catch (error) {
      console.error('外观图上传失败:', error);
      globalErrorHandler.handle(error, globalMessage.error);
      return '';
    } finally {
      setAppearanceUploading(prev => ({ ...prev, [appearanceId]: false }));
    }
  };

  // Banner操作
  const handleEditBanner = (banner: any) => {
    setEditingBanner(banner);
    bannerForm.setFieldsValue({ sort: banner.sort });
    setBannerEditVisible(true);
  };

  const handleSaveBanner = async () => {
    try {
      const values = await bannerForm.validateFields();
      if (editingBanner) {
        await updateProductBanner(editingBanner.product_banner_id, {
          sort: values.sort
        });
        
        globalMessage.success('排序更新成功');
        setBannerEditVisible(false);
        await loadProductDetail();
      }
    } catch (error) {
      console.error('保存Banner排序失败:', error);
      globalErrorHandler.handle(error, globalMessage.error);
    }
  };

  const handleUpdateBannerImage = async (bannerId: string, file: File) => {
    if (!validateImage(file)) return;
    
    try {
      await updateProductBanner(bannerId, { imageFile: file });
      globalMessage.success('图片更新成功');
      await loadProductDetail();
    } catch (error) {
      console.error('更新Banner图片失败:', error);
      globalErrorHandler.handle(error, globalMessage.error);
    }
  };

  const handleUpdateAppearanceImage = async (appearanceId: string, file: File) => {
    if (!validateImage(file)) return;
    
    try {
      await updateProductAppearance(appearanceId, file);
      globalMessage.success('图片更新成功');
      await loadProductDetail();
    } catch (error) {
      console.error('更新外观图失败:', error);
      globalErrorHandler.handle(error, globalMessage.error);
    }
  };

  if (!productDetail) {
    return <Spin style={{ display: 'flex', justifyContent: 'center', marginTop: 100 }} />;
  }

  // 获取Banner和外观图数据
  const banners = productDetail.banners || [];
  const appearances = productDetail.appearances || [];

  return (
    <div style={{ padding: 12 }}>
      <Card 
        size="small" 
        bordered={false} 
        title={
          <Space>
            <Button 
              size="small" 
              icon={<ArrowLeftOutlined />}
              onClick={() => navigate(fromPath)}
            />
            商品多媒体库
          </Space>
        }
      >
        <div 
          style={{ 
            marginBottom: 12, 
            padding: '8px 12px', 
            background: '#fafafa', 
            borderRadius: 4 
          }}
        >
          <Text type="secondary">正在管理: </Text>
          <Text strong>{productDetail.name}</Text>
          <Text type="secondary" style={{ marginLeft: 16 }}>商品ID: </Text>
          <Text copyable>{productDetail.product_id}</Text>
        </div>
        
        <Tabs defaultActiveKey="banners">
          <TabPane tab="宣传轮播图" key="banners">
            <Card 
              size="small" 
              title="上传宣传图" 
              style={{ marginBottom: 16 }}
              extra={
                <Button 
                  type="primary" 
                  size="small" 
                  icon={<PlusOutlined />}
                  onClick={handleOpenBatchUpload}
                >
                  批量上传
                </Button>
              }
            >
              <div 
                style={{ 
                  fontSize: 12, 
                  color: '#999', 
                  lineHeight: '32px',
                  marginBottom: 8 
                }}
              >
                支持 JPG/PNG，单张不超过 5MB，建议尺寸 800x400px
              </div>
              <div style={{ fontSize: 12, color: '#666' }}>
                当前轮播图数量: {banners.length} 张
              </div>
            </Card>
            
            {banners.length === 0 ? (
              <div 
                style={{ 
                  textAlign: 'center', 
                  padding: '40px 20px', 
                  backgroundColor: '#fafafa',
                  borderRadius: 4
                }}
              >
                <PictureOutlined 
                  style={{ 
                    fontSize: 48, 
                    color: '#d9d9d9', 
                    marginBottom: 16 
                  }} 
                />
                <div style={{ color: '#999', marginBottom: 8 }}>
                  暂无宣传轮播图
                </div>
                <div style={{ fontSize: 12, color: '#bfbfbf' }}>
                  请点击上方按钮上传宣传图片
                </div>
              </div>
            ) : (
              <Row gutter={[12, 12]}>
                {banners.map((banner: any, index: number) => (
                  <Col 
                    xs={24} 
                    sm={12} 
                    md={8} 
                    lg={6} 
                    key={banner.product_banner_id || index}
                  >
                    <Card 
                      size="small" 
                      cover={
                        bannerUploading[`upload-${index}`] ? (
                          <div 
                            style={{ 
                              height: 120, 
                              display: 'flex', 
                              alignItems: 'center', 
                              justifyContent: 'center',
                              backgroundColor: '#fafafa'
                            }}
                          >
                            <Spin 
                              indicator={
                                <LoadingOutlined 
                                  style={{ fontSize: 24 }} 
                                  spin 
                                />
                              } 
                            />
                          </div>
                        ) : banner.image ? (
                          <Image 
                            src={getImageUrl(banner.image)} 
                            style={{ height: 120, objectFit: 'cover' }}
                            preview={{
                              mask: <EyeOutlined />,
                              src: getImageUrl(banner.image)
                            }}
                          />
                        ) : (
                          <div 
                            style={{ 
                              height: 120, 
                              display: 'flex', 
                              alignItems: 'center', 
                              justifyContent: 'center',
                              backgroundColor: '#fafafa',
                              color: '#999'
                            }}
                          >
                            <PictureOutlined /> 暂无图片
                          </div>
                        )
                      }
                      actions={[
                        // <Tooltip title="编辑排序" key="edit">
                        //   <EditOutlined 
                        //     onClick={() => handleEditBanner(banner)} 
                        //   />
                        // </Tooltip>,
                        <Tooltip title="替换图片" key="replace">
                          <Upload
                            showUploadList={false}
                            beforeUpload={async (file) => {
                              await handleUpdateBannerImage(banner.product_banner_id, file);
                              return false;
                            }}
                          >
                            <UploadOutlined />
                          </Upload>
                        </Tooltip>,
                        <Tooltip title="大图预览" key="preview">
                          <EyeOutlined 
                            onClick={() => 
                              Modal.info({ 
                                title: '图片预览', 
                                content: (
                                  <div style={{ textAlign: 'center' }}>
                                    <Image 
                                      src={getImageUrl(banner.image)} 
                                      style={{ maxWidth: '100%', maxHeight: '500px' }}
                                    />
                                  </div>
                                ), 
                                width: 800, 
                                icon: null, 
                                maskClosable: true 
                              })
                            } 
                          />
                        </Tooltip>
                      ]}
                    >
                      <div 
                        style={{ 
                          display: 'flex', 
                          justifyContent: 'space-between', 
                          alignItems: 'center' 
                        }}
                      >
                        <Text style={{ fontSize: 12 }}>排序: {banner.sort || 0}</Text>
                        <Tag color="blue">轮播图</Tag>
                      </div>
                    </Card>
                  </Col>
                ))}
              </Row>
            )}
          </TabPane>
          
          <TabPane tab="外观详情图" key="appearance">
            <Card 
              size="small" 
              title="上传外观图" 
              style={{ marginBottom: 16 }}
            >
              <div 
                style={{ 
                  display: 'flex', 
                  gap: 16, 
                  alignItems: 'center' 
                }}
              >
                <Upload 
                  multiple 
                  accept="image/*" 
                  showUploadList={false}
                  beforeUpload={async (file) => { 
                    await handleAppearanceUpload(file);
                    return false; 
                  }}
                >
                  <Button icon={<UploadOutlined />}>批量选择图片</Button>
                </Upload>
                <div 
                  style={{ 
                    fontSize: 12, 
                    color: '#999', 
                    lineHeight: '32px' 
                  }}
                >
                  支持 JPG/PNG，单张不超过 5MB，建议尺寸 1000x800px
                </div>
              </div>
            </Card>
            
            {appearances.length === 0 ? (
              <div 
                style={{ 
                  textAlign: 'center', 
                  padding: '40px 20px', 
                  backgroundColor: '#fafafa',
                  borderRadius: 4
                }}
              >
                <PictureOutlined 
                  style={{ 
                    fontSize: 48, 
                    color: '#d9d9d9', 
                    marginBottom: 16 
                  }} 
                />
                <div style={{ color: '#999', marginBottom: 8 }}>
                  暂无外观详情图
                </div>
                <div style={{ fontSize: 12, color: '#bfbfbf' }}>
                  请点击上方按钮上传外观图片
                </div>
              </div>
            ) : (
              <Row gutter={[12, 12]}>
                {appearances.map((app: any, index: number) => (
                  <Col 
                    xs={24} 
                    sm={12} 
                    md={8} 
                    lg={6} 
                    key={app.product_appearance_id || index}
                  >
                    <Card 
                      size="small" 
                      cover={
                        appearanceUploading[`upload-${index}`] ? (
                          <div 
                            style={{ 
                              height: 150, 
                              display: 'flex', 
                              alignItems: 'center', 
                              justifyContent: 'center',
                              backgroundColor: '#fafafa'
                            }}
                          >
                            <Spin 
                              indicator={
                                <LoadingOutlined 
                                  style={{ fontSize: 24 }} 
                                  spin 
                                />
                              } 
                            />
                          </div>
                        ) : app.image ? (
                          <Image 
                            src={getImageUrl(app.image)} 
                            style={{ height: 120, objectFit: 'cover' }}
                            preview={{
                              mask: <EyeOutlined />,
                              src: getImageUrl(app.image)
                            }}
                          />
                        ) : (
                          <div 
                            style={{ 
                              height: 150, 
                              display: 'flex', 
                              alignItems: 'center', 
                              justifyContent: 'center',
                              backgroundColor: '#fafafa',
                              color: '#999'
                            }}
                          >
                            <PictureOutlined /> 暂无图片
                          </div>
                        )
                      }
                      actions={[
                        <Tooltip title="替换图片" key="replace">
                          <Upload
                            showUploadList={false}
                            beforeUpload={async (file) => {
                              await handleUpdateAppearanceImage(app.product_appearance_id, file);
                              return false;
                            }}
                          >
                            <UploadOutlined />
                          </Upload>
                        </Tooltip>,
                        <Tooltip title="大图预览" key="preview">
                          <EyeOutlined 
                            onClick={() => 
                              Modal.info({ 
                                title: '图片预览', 
                                content: (
                                  <div style={{ textAlign: 'center' }}>
                                    <Image 
                                      src={getImageUrl(app.image)} 
                                      style={{ maxWidth: '100%', maxHeight: '500px' }}
                                    />
                                  </div>
                                ), 
                                width: 800, 
                                icon: null, 
                                maskClosable: true 
                              })
                            } 
                          />
                        </Tooltip>
                      ]}
                    >
                      <div style={{ textAlign: 'center' }}>
                        <Text style={{ fontSize: 12 }}>外观图 {index + 1}</Text>
                        <div 
                          style={{ 
                            fontSize: 11, 
                            color: '#999', 
                            marginTop: 4 
                          }}
                        >
                          {app.is_sku && <Tag color="green">SKU图片</Tag>}
                          {!app.is_sku && index === 0 && '正面图'}
                          {!app.is_sku && index === 1 && '侧面图'}
                          {!app.is_sku && index === 2 && '背面图'}
                          {!app.is_sku && index === 3 && '细节图'}
                          {!app.is_sku && index >= 4 && '展示图'}
                        </div>
                      </div>
                    </Card>
                  </Col>
                ))}
              </Row>
            )}
          </TabPane>
        </Tabs>
      </Card>
      
      {/* 批量上传Banner模态框 */}
      <Modal 
        title="批量上传轮播图" 
        open={bannerUploadModalVisible} 
        onCancel={() => {
          setBannerUploadModalVisible(false);
          setUploadingFiles([]);
          setDefaultSort(0);
        }} 
        onOk={handleBatchBannerUpload} 
        width={500}
        okText="开始上传"
        cancelText="取消"
        okButtonProps={{
          disabled: uploadingFiles.length === 0,
          loading: bannerUploading['batch']
        }}
        destroyOnClose
      >
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 12, color: '#999', marginBottom: 8 }}>
            支持 JPG/PNG，单张不超过 5MB，建议尺寸 800x400px
          </div>
          <Upload
            multiple
            accept="image/*"
            fileList={uploadingFiles}
            beforeUpload={(file) => {
              if (validateImage(file)) {
                const uploadFile: UploadFile = {
                  uid: `${Date.now()}-${Math.random()}`,
                  name: file.name,
                  status: 'done',
                  originFileObj: file,
                };
                setUploadingFiles(prev => [...prev, uploadFile]);
              }
              return false;
            }}
            onRemove={(file) => {
              setUploadingFiles(prev => prev.filter(f => f.uid !== file.uid));
            }}
          >
            <Button icon={<UploadOutlined />}>选择图片</Button>
          </Upload>
          
          {uploadingFiles.length > 0 && (
            <div style={{ marginTop: 12 }}>
              <div style={{ fontSize: 12, color: '#666', marginBottom: 4 }}>
                已选择 {uploadingFiles.length} 张图片:
              </div>
              <div style={{ 
                maxHeight: 150, 
                overflowY: 'auto',
                border: '1px solid #d9d9d9',
                borderRadius: 4,
                padding: 8
              }}>
                {uploadingFiles.map((file, index) => (
                  <div 
                    key={file.uid} 
                    style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '4px 0',
                      borderBottom: index < uploadingFiles.length - 1 ? '1px solid #f0f0f0' : 'none'
                    }}
                  >
                    <Text style={{ fontSize: 12 }} ellipsis>
                      {file.name}
                    </Text>
                    <Text type="secondary" style={{ fontSize: 11 }}>
                      {file.originFileObj && `${(file.originFileObj.size / 1024 / 1024).toFixed(2)} MB`}
                    </Text>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        
        <Form layout="vertical">
          <Form.Item label="起始排序值" extra="排序值越小，在轮播图中显示越靠前">
            <InputNumber 
              value={defaultSort}
              onChange={(value) => setDefaultSort(value || 0)}
              min={0}
              max={100}
              style={{ width: '100%' }}
            />
          </Form.Item>
          <div style={{ fontSize: 12, color: '#666' }}>
            图片将按顺序分配排序值: {defaultSort}, {defaultSort + 1}, {defaultSort + 2}...
          </div>
        </Form>
      </Modal>
      
      {/* Banner 排序编辑弹窗 */}
      <Modal 
        title="编辑轮播图排序" 
        open={bannerEditVisible} 
        onCancel={() => setBannerEditVisible(false)} 
        onOk={handleSaveBanner} 
        width={300} 
        destroyOnClose
      >
        <Form form={bannerForm} layout="vertical">
          <Form.Item 
            name="sort" 
            label="排序值 (越小越靠前)" 
            rules={[{required: true, message: '请输入排序值'}]}
          >
            <InputNumber min={0} max={100} style={{ width: '100%' }} />
          </Form.Item>
          <div style={{ fontSize: 12, color: '#999' }}>
            提示：排序值越小，在轮播图中显示越靠前
          </div>
        </Form>
      </Modal>
    </div>
  );
};

export default ProductGalleryPage;