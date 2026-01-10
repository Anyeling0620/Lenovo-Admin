/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from 'react';
import {
  Card, Row, Col, Button, Upload, Image, Typography, Space, Popconfirm,
  Tooltip, Modal, Form, InputNumber, Tabs, Spin, message, Tag
} from 'antd';
import {
  ArrowLeftOutlined, PictureOutlined, UploadOutlined, EyeOutlined,
  DeleteOutlined, EditOutlined, LoadingOutlined
} from '@ant-design/icons';
import { Link, useParams } from 'react-router-dom';
import { getImageUrl } from '../../../utils/imageUrl';
import { globalMessage } from '../../../utils/globalMessage';
import { globalErrorHandler } from '../../../utils/globalAxiosErrorHandler';
// 导入模拟数据
import { findMockProductDetail } from '../../../services/cyf-mockData';
import { getProductDetail } from '../../../services/api';

const { Text } = Typography;
const { TabPane } = Tabs;

const ProductGalleryPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [productDetail, setProductDetail] = useState<any>(null);
  const [bannerUploading, setBannerUploading] = useState<Record<string, boolean>>({});
  const [appearanceUploading, setAppearanceUploading] = useState<Record<string, boolean>>({});
  const [bannerEditVisible, setBannerEditVisible] = useState(false);
  const [editingBanner, setEditingBanner] = useState<any>(null);
  const [bannerForm] = Form.useForm();

  // 使用模拟数据标志
  const useMockData = true;
  const fromPath = (location.state as any)?.from || '/goods/manage/list';
  // 加载商品详情
  useEffect(() => {
    if (id) {
      loadProductDetail();
    }
  }, [id]);

  const loadProductDetail = async () => {
    try {
      if (useMockData) {
        // 使用模拟数据
        const detail = findMockProductDetail(id!);
        setProductDetail(detail);
      } else {
        // 实际API调用
        const detail = await getProductDetail(id!);
        setProductDetail(detail);
      }
    } catch (error) {
      globalErrorHandler.handle(error, globalMessage.error);
    }
  };

  // 图片上传处理
  const handleImageUpload = async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const isImage = file.type.startsWith('image/');
      if (!isImage) {
        message.error('只能上传图片文件');
        reject(new Error('只能上传图片文件'));
        return;
      }
      
      const isLt5M = file.size / 1024 / 1024 < 5;
      if (!isLt5M) {
        message.error('图片大小不能超过5MB');
        reject(new Error('图片大小不能超过5MB'));
        return;
      }
      
      setTimeout(() => {
        const reader = new FileReader();
        reader.onload = (e) => {
          const result = e.target?.result as string;
          message.success('图片上传成功');
          resolve(result);
        };
        reader.onerror = () => {
          message.error('图片读取失败');
          reject(new Error('图片读取失败'));
        };
        reader.readAsDataURL(file);
      }, 800);
    });
  };

  // Banner上传
  const handleBannerUpload = async (file: File) => {
    const bannerId = `upload-${Date.now()}`;
    setBannerUploading(prev => ({ ...prev, [bannerId]: true }));
    
    try {
      const imageUrl = await handleImageUpload(file);
      if (imageUrl && id) {
        // 模拟添加Banner
        if (productDetail) {
          const newBanner = {
            product_banner_id: `bn-${Date.now()}`,
            image: imageUrl,
            sort: productDetail.banners ? productDetail.banners.length + 1 : 1
          };
          
          setProductDetail({
            ...productDetail,
            banners: [...(productDetail.banners || []), newBanner]
          });
          
          globalMessage.success('Banner添加成功');
        }
      }
      return imageUrl;
    } catch (error) {
      console.error('Banner上传失败:', error);
      return '';
    } finally {
      setBannerUploading(prev => ({ ...prev, [bannerId]: false }));
    }
  };

  // 外观图上传
  const handleAppearanceUpload = async (file: File) => {
    const appearanceId = `upload-${Date.now()}`;
    setAppearanceUploading(prev => ({ ...prev, [appearanceId]: true }));
    
    try {
      const imageUrl = await handleImageUpload(file);
      if (imageUrl && id) {
        // 模拟添加外观图
        if (productDetail) {
          const newAppearance = {
            product_appearance_id: `app-${Date.now()}`,
            image: imageUrl
          };
          
          setProductDetail({
            ...productDetail,
            appearances: [...(productDetail.appearances || []), newAppearance]
          });
          
          globalMessage.success('外观图添加成功');
        }
      }
      return imageUrl;
    } catch (error) {
      console.error('外观图上传失败:', error);
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
      if (editingBanner && productDetail) {
        // 模拟更新Banner排序
        const updatedBanners = productDetail.banners.map((banner: any) => {
          if (banner.product_banner_id === editingBanner.product_banner_id) {
            return { ...banner, sort: values.sort };
          }
          return banner;
        });
        
        setProductDetail({
          ...productDetail,
          banners: updatedBanners
        });
        
        globalMessage.success('排序更新成功');
        setBannerEditVisible(false);
      }
    } catch (error) {
      console.error('保存Banner排序失败:', error);
    }
  };

  const handleDeleteBanner = async (bannerId: string) => {
    try {
      if (productDetail) {
        // 模拟删除Banner
        const updatedBanners = productDetail.banners.filter((banner: any) => 
          banner.product_banner_id !== bannerId
        );
        
        setProductDetail({
          ...productDetail,
          banners: updatedBanners
        });
        
        globalMessage.success('图片已删除');
      }
    } catch (error) {
      console.error('删除Banner失败:', error);
    }
  };

  const handleDeleteAppearance = async (appId: string) => {
    try {
      if (productDetail) {
        // 模拟删除外观图
        const updatedAppearances = productDetail.appearances.filter((app: any) => 
          app.product_appearance_id !== appId
        );
        
        setProductDetail({
          ...productDetail,
          appearances: updatedAppearances
        });
        
        globalMessage.success('图片已删除');
      }
    } catch (error) {
      console.error('删除外观图失败:', error);
    }
  };

  if (!productDetail) {
    return <Spin style={{ display: 'flex', justifyContent: 'center', marginTop: 100 }} />;
  }

  return (
    <div style={{ padding: 12 }}>
      <Card size="small" bordered={false} title={
        <Space>
          <Button 
            size="small" 
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate(fromPath)} // 使用来源页面
          />
          商品多媒体库
        </Space>
      }>
        <div style={{ marginBottom: 12, padding: '8px 12px', background: '#fafafa', borderRadius: 4 }}>
          <Text type="secondary">正在管理: </Text>
          <Text strong>{productDetail.name}</Text>
          <Text type="secondary" style={{ marginLeft: 16 }}>商品ID: </Text>
          <Text copyable>{productDetail.product_id}</Text>
        </div>
        
        <Tabs defaultActiveKey="banners">
          <TabPane tab="宣传轮播图" key="banners">
            <Card size="small" title="上传宣传图 (支持多选)" style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                <Upload 
                  multiple 
                  accept="image/*" 
                  showUploadList={false}
                  beforeUpload={async (file) => { 
                    await handleBannerUpload(file);
                    return false; 
                  }}
                >
                  <Button icon={<UploadOutlined />}>批量选择图片</Button>
                </Upload>
                <div style={{ fontSize: 12, color: '#999', lineHeight: '32px' }}>
                  支持 JPG/PNG，单张不超过 5MB，建议尺寸 800x400px
                </div>
              </div>
            </Card>
            
            {(!productDetail.banners || productDetail.banners.length === 0) ? (
              <div style={{ 
                textAlign: 'center', 
                padding: '40px 20px', 
                backgroundColor: '#fafafa',
                borderRadius: 4
              }}>
                <PictureOutlined style={{ fontSize: 48, color: '#d9d9d9', marginBottom: 16 }} />
                <div style={{ color: '#999', marginBottom: 8 }}>暂无宣传轮播图</div>
                <div style={{ fontSize: 12, color: '#bfbfbf' }}>请点击上方按钮上传宣传图片</div>
              </div>
            ) : (
              <Row gutter={[12, 12]}>
                {productDetail.banners?.map((banner: any, index: number) => (
                  <Col xs={24} sm={12} md={8} lg={6} key={banner.product_banner_id || index}>
                    <Card 
                      size="small" 
                      cover={
                        bannerUploading[`upload-${index}`] ? (
                          <div style={{ 
                            height: 120, 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center',
                            backgroundColor: '#fafafa'
                          }}>
                            <Spin indicator={<LoadingOutlined style={{ fontSize: 24 }} spin />} />
                          </div>
                        ) : banner.image ? (
                            <Image 
                                src={banner.image.startsWith('data:image') ? banner.image : getImageUrl(banner.image)} 
                                style={{ height: 120, objectFit: 'cover' }}
                                preview={{
                                mask: <EyeOutlined />,
                                src: banner.image.startsWith('data:image') ? banner.image : getImageUrl(banner.image)
                                }}
                            />
                        ) : (
                          <div style={{ 
                            height: 120, 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center',
                            backgroundColor: '#fafafa',
                            color: '#999'
                          }}>
                            <PictureOutlined /> 暂无图片
                          </div>
                        )
                      }
                      actions={[
                        <Tooltip title="编辑排序">
                          <EditOutlined key="edit" onClick={() => handleEditBanner(banner)} />
                        </Tooltip>,
                        <Tooltip title="大图预览">
                          <EyeOutlined key="preview" onClick={() => 
                            Modal.info({ 
                              title: '图片预览', 
                              content: (
                                <div style={{ textAlign: 'center' }}>
                                  <Image 
                                    src={banner.image.startsWith('data:image') ? banner.image : getImageUrl(banner.image)} 
                                    style={{ maxWidth: '100%', maxHeight: '500px' }}
                                  />
                                </div>
                              ), 
                              width: 800, 
                              icon: null, 
                              maskClosable: true 
                            })
                          } />
                        </Tooltip>,
                        <Popconfirm 
                          title="确认删除？" 
                          onConfirm={() => handleDeleteBanner(banner.product_banner_id)}
                        >
                          <DeleteOutlined key="delete" />
                        </Popconfirm>
                      ]}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Text style={{ fontSize: 12 }}>排序: {banner.sort}</Text>
                        <Tag color="blue">轮播图</Tag>
                      </div>
                    </Card>
                  </Col>
                ))}
              </Row>
            )}
          </TabPane>
          
          <TabPane tab="外观详情图" key="appearance">
            <Card size="small" title="上传外观图" style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
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
                <div style={{ fontSize: 12, color: '#999', lineHeight: '32px' }}>
                  支持 JPG/PNG，单张不超过 5MB，建议尺寸 1000x800px
                </div>
              </div>
            </Card>
            
            {(!productDetail.appearances || productDetail.appearances.length === 0) ? (
              <div style={{ 
                textAlign: 'center', 
                padding: '40px 20px', 
                backgroundColor: '#fafafa',
                borderRadius: 4
              }}>
                <PictureOutlined style={{ fontSize: 48, color: '#d9d9d9', marginBottom: 16 }} />
                <div style={{ color: '#999', marginBottom: 8 }}>暂无外观详情图</div>
                <div style={{ fontSize: 12, color: '#bfbfbf' }}>请点击上方按钮上传外观图片</div>
              </div>
            ) : (
              <Row gutter={[12, 12]}>
                {productDetail.appearances?.map((app: any, index: number) => (
                  <Col xs={24} sm={12} md={8} lg={6} key={app.product_appearance_id || index}>
                    <Card 
                      size="small" 
                      cover={
                        appearanceUploading[`upload-${index}`] ? (
                          <div style={{ 
                            height: 150, 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center',
                            backgroundColor: '#fafafa'
                          }}>
                            <Spin indicator={<LoadingOutlined style={{ fontSize: 24 }} spin />} />
                          </div>
                        ) : app.image ? (
                            <Image 
                                src={app.image.startsWith('data:image') ? app.image : getImageUrl(app.image)} 
                                style={{ height: 120, objectFit: 'cover' }}
                                preview={{
                                mask: <EyeOutlined />,
                                src: app.image.startsWith('data:image') ? app.image : getImageUrl(app.image)
                                }}
                            />
                        ) : (
                          <div style={{ 
                            height: 150, 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center',
                            backgroundColor: '#fafafa',
                            color: '#999'
                          }}>
                            <PictureOutlined /> 暂无图片
                          </div>
                        )
                      }
                      actions={[
                        <Tooltip title="大图预览">
                          <EyeOutlined key="preview" onClick={() => 
                            Modal.info({ 
                              title: '图片预览', 
                              content: (
                                <div style={{ textAlign: 'center' }}>
                                  <Image 
                                    src={app.image.startsWith('data:image') ? app.image : getImageUrl(app.image)} 
                                    style={{ maxWidth: '100%', maxHeight: '500px' }}
                                  />
                                </div>
                              ), 
                              width: 800, 
                              icon: null, 
                              maskClosable: true 
                            })
                          } />
                        </Tooltip>,
                        <Popconfirm 
                          title="确认删除？" 
                          onConfirm={() => handleDeleteAppearance(app.product_appearance_id)}
                        >
                          <DeleteOutlined key="delete" />
                        </Popconfirm>
                      ]}
                    >
                      <div style={{ textAlign: 'center' }}>
                        <Text style={{ fontSize: 12 }}>外观图 {index + 1}</Text>
                        <div style={{ fontSize: 11, color: '#999', marginTop: 4 }}>
                          {index === 0 && '正面图'}
                          {index === 1 && '侧面图'}
                          {index === 2 && '背面图'}
                          {index === 3 && '细节图'}
                          {index >= 4 && '展示图'}
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