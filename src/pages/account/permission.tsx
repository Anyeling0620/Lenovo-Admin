import React, { useState, useEffect } from 'react';
import { Card, Tree, Tag, Spin, Empty } from 'antd';
import { ApiOutlined, MenuOutlined, FolderOutlined } from '@ant-design/icons';
import { getAccountPermissions } from '../../services/api';
import type { AdminPermissionResponse, PermissionInfo } from '../../services/api-type';
import { globalMessage } from '../../utils/globalMessage';
import { globalErrorHandler } from '../../utils/globalAxiosErrorHandler';
import { mockAdminPermissions } from './mockData';
import type { DataNode } from 'antd/es/tree';

const AccountPermission: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [permissionData, setPermissionData] = useState<AdminPermissionResponse | null>(null);

  const loadPermissions = async () => {
    setLoading(true);
    try {
      const data = await getAccountPermissions();
      setPermissionData(data);
    } catch (error) {
      globalErrorHandler.handle(error, globalMessage.error);
      // API拉取失败时使用模拟数据
      setPermissionData(mockAdminPermissions);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPermissions();
  }, []);

  // 构建权限树
  const buildPermissionTree = (permissions: PermissionInfo[]): DataNode[] => {
    // 如果已经有children字段，说明后端已经构建好树结构
    if (permissions.length > 0 && permissions[0].children !== undefined) {
      return permissions.map((perm) => buildTreeNode(perm));
    }

    // 否则需要自己构建树结构
    const permissionMap = new Map<string, PermissionInfo & { children: PermissionInfo[] }>();
    
    // 先创建所有节点
    permissions.forEach((perm) => {
      permissionMap.set(perm.id, { ...perm, children: [] });
    });

    // 构建父子关系
    permissions.forEach((perm) => {
      if (perm.parentId !== null) {
        const parent = permissionMap.get(perm.parentId);
        if (parent) {
          parent.children.push(permissionMap.get(perm.id)!);
        }
      }
    });

    // 找出根节点
    const rootNodes: DataNode[] = [];
    permissions.forEach((perm) => {
      if (perm.parentId === null) {
        const node = permissionMap.get(perm.id)!;
        rootNodes.push(buildTreeNode(node));
      }
    });

    return rootNodes;
  };

  const buildTreeNode = (perm: PermissionInfo & { children?: PermissionInfo[] }): DataNode => {
    const children = perm.children && perm.children.length > 0 
      ? perm.children.map((child) => buildTreeNode(child))
      : undefined;
    
    return {
      title: (
        <span>
          {getPermissionIcon(perm.type)}
          <span style={{ marginLeft: '4px' }}>{perm.name}</span>
          <Tag color="blue" style={{ marginLeft: '8px' }}>{perm.module}</Tag>
        </span>
      ),
      key: perm.id,
      children,
    };
  };

  const getPermissionIcon = (type: string) => {
    switch (type) {
      case 'menu':
        return <MenuOutlined style={{ color: '#1890ff' }} />;
      case 'api':
        return <ApiOutlined style={{ color: '#52c41a' }} />;
      default:
        return <FolderOutlined style={{ color: '#faad14' }} />;
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!permissionData) {
    return <Empty description="暂无权限数据" />;
  }

  const permissionTree = permissionData.permissionsTree
    ? buildPermissionTree(permissionData.permissionsTree)
    : permissionData.permissions
    ? buildPermissionTree(permissionData.permissions)
    : [];

  return (
    <div style={{ padding: '8px' }}>
      <Card title="权限详情" style={{ marginBottom: '8px' }}>
        <div style={{ marginBottom: '16px' }}>
          <h4 style={{ margin: '0 0 8px 0', fontSize: '14px' }}>权限树结构</h4>
          {permissionTree.length > 0 ? (
            <Tree
              showLine
              defaultExpandAll
              treeData={permissionTree}
              style={{ fontSize: '14px' }}
            />
          ) : (
            <Empty description="暂无权限" />
          )}
        </div>
      </Card>

      <Card title="身份列表" style={{ marginBottom: '8px' }}>
        {permissionData.identities && permissionData.identities.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {permissionData.identities.map((identity) => (
              <div
                key={identity.id}
                style={{
                  padding: '8px',
                  border: '1px solid #e8e8e8',
                  borderRadius: '4px',
                  backgroundColor: '#fafafa',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <Tag color="blue">{identity.name}</Tag>
                  <span style={{ fontSize: '12px', color: '#666' }}>{identity.code}</span>
                  {identity.isSystem && <Tag color="green">系统预设</Tag>}
                </div>
                {identity.description && (
                  <div style={{ fontSize: '12px', color: '#999', marginTop: '4px' }}>
                    {identity.description}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <Empty description="暂无身份信息" />
        )}
      </Card>

      <Card title="专区权限" style={{ marginBottom: '8px' }}>
        {permissionData.categories && permissionData.categories.length > 0 ? (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {permissionData.categories.map((category) => (
              <Tag key={category.id} color="green" style={{ fontSize: '14px', padding: '4px 8px' }}>
                {category.name}
              </Tag>
            ))}
          </div>
        ) : (
          <Empty description="暂无专区权限" />
        )}
      </Card>

      <Card title="权限列表（扁平）">
        {permissionData.permissions && permissionData.permissions.length > 0 ? (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {permissionData.permissions.map((permission) => (
              <Tag
                key={permission.id}
                color="purple"
                style={{ fontSize: '14px', padding: '4px 8px' }}
              >
                {getPermissionIcon(permission.type)}
                <span style={{ marginLeft: '4px' }}>{permission.name}</span>
                <Tag color="blue" style={{ marginLeft: '8px' }}>{permission.module}</Tag>
              </Tag>
            ))}
          </div>
        ) : (
          <Empty description="暂无权限" />
        )}
      </Card>
    </div>
  );
};

export default AccountPermission;

