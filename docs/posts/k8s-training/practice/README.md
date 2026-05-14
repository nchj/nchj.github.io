# K8S培训综合实战项目

## 项目概述

这是一个覆盖 K8S 所有核心知识点的完整部署系统，使用 Helm Chart 打包，一条命令部署。

## 涉及的知识点清单

| 知识点 | 对应文件 | 说明 |
|--------|---------|------|
| Namespace | deploy.sh | 多租户资源隔离 |
| Deployment | templates/deployment.yaml | Pod 管理、副本数、资源限制 |
| Liveness Probe | templates/deployment.yaml | 容器存活检测 |
| Readiness Probe | templates/deployment.yaml | 流量就绪检测 |
| RollingUpdate | templates/deployment.yaml | 零停机更新策略 |
| Service (ClusterIP) | templates/service.yaml | 内部负载均衡 |
| Endpoints | 自动生成 | Service 与 Pod 的关联 |
| ConfigMap | templates/configmap.yaml | 非敏感配置管理 |
| Secret | templates/secret.yaml | 敏感信息管理（base64） |
| Ingress | templates/ingress.yaml | HTTP 路由（可选） |
| PVC | templates/pvc.yaml | 持久化存储（可选） |
| Helm Chart | Chart.yaml + values.yaml | 包管理、模板化 |
| Helm Install/Upgrade/Rollback | deploy.sh | 生命周期管理 |
| DNS 服务发现 | deploy.sh 验证步骤 | CoreDNS 自动解析 |
| 资源限制 (requests/limits) | values.yaml | Pod 调度和运行时资源控制 |

## 使用方法

### 1. 部署

```bash
cd k8s-training/practice
chmod +x deploy.sh cleanup.sh
./deploy.sh
```

### 2. 手动操作练习

```bash
export KUBECONFIG=~/.kube/sealos.yaml
NS=k8s-training

# 查看 Pod
kubectl get pods -n $NS

# 查看日志
kubectl logs -f deployment/training-app -n $NS

# 端口转发测试
kubectl port-forward svc/training-app 8080:80 -n $NS
# 另一个终端访问：curl http://localhost:8080

# 扩缩容
kubectl scale deployment training-app --replicas=5 -n $NS

# 进入 Pod
kubectl exec -it deployment/training-app -- sh -n $NS

# 查看 ConfigMap
kubectl get configmap training-app-config -o yaml -n $NS

# 查看 Secret（解码）
kubectl get secret training-app-secret -o jsonpath='{.data.DB_PASSWORD}' -n $NS | base64 -d
```

### 3. Helm 操作练习

```bash
# 查看渲染后的 YAML
helm template training-app ./helm-chart -n $NS

# 升级（修改值）
helm upgrade training-app ./helm-chart -n $NS --set replicaCount=5

# 查看历史
helm history training-app -n $NS

# 回滚
helm rollback training-app 1 -n $NS

# 查看 Release 状态
helm status training-app -n $NS
```

### 4. 清理（⚠️ 必做！付费集群！）

```bash
./cleanup.sh
```

## 目录结构

```
practice/
├── helm-chart/
│   ├── Chart.yaml           # Chart 元数据
│   ├── values.yaml          # 默认配置（副本数、镜像、资源限制等）
│   └── templates/
│       ├── _helpers.tpl     # 模板辅助函数
│       ├── deployment.yaml  # Deployment + 探针 + 资源限制
│       ├── service.yaml     # ClusterIP Service
│       ├── configmap.yaml   # ConfigMap
│       ├── secret.yaml      # Secret
│       ├── ingress.yaml     # Ingress（可选）
│       ├── pvc.yaml         # PVC（可选）
│       └── NOTES.txt        # 安装后提示
├── deploy.sh                # 一键部署 & 验证脚本
├── cleanup.sh               # 清理脚本
└── README.md                # 本文件
```
