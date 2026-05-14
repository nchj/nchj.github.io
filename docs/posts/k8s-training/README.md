# K8S 培训 - 从零到面试通关

## 📋 培训大纲

| 章节 | 主题 | 核心知识点 |
|------|------|-----------|
| [第1章](./01-k8s-architecture.md) | K8S 核心概念与架构 | Master/Worker 组件、资源对象、声明式API |
| [第2章](./02-pod-and-workloads.md) | Pod 与工作负载管理 | Pod生命周期、探针、Deployment/StatefulSet/DaemonSet |
| [第3章](./03-service-networking.md) | Service 与网络 | 4种Service类型、DNS服务发现、Ingress |
| [第4章](./04-config-storage.md) | ConfigMap、Secret 与存储 | 配置管理、PV/PVC、StorageClass |
| [第5章](./05-helm.md) | Helm 包管理 | Chart、Release、values模板化 |
| [第6章](./practice/README.md) | 综合部署实战 | Helm Chart + 一键部署脚本 |
| [第7章](./07-scheduling-autoscaling.md) | 调度与弹性伸缩 | nodeAffinity、podAffinity/AntiAffinity、Taint/Toleration、HPA/VPA |
| [第8章](./08-security.md) | 安全与权限 | RBAC、NetworkPolicy、SecurityContext、ResourceQuota |
| [第9章](./09-operations.md) | 运维与故障排查 | kubectl 高级用法、Events、日志体系、排障流程 |
| [第10章](./10-interview-questions.md) | 面试高频题 | 27道必考题 + 答案模板 + 模拟面试流程 |

## 🎯 学习路径

```
第1天：第1章 + 第2章（架构 + Pod）         → 理解 K8S 是什么
第2天：第3章 + 第4章（网络 + 存储）         → 掌握核心资源
第3天：第5章 + 第6章实战（Helm + 实操部署） → 学会工具化部署
第4天：第7章 + 第8章（调度 + 安全）         → 掌握进阶能力
第5天：第9章 + 第10章（运维 + 面试题）     → 冲刺面试
```

## 📌 章节关系图

```
基础篇（第1-4章）              工具篇（第5-6章）           进阶篇（第7-10章）
┌──────────────────┐      ┌──────────────────┐      ┌──────────────────┐
│ 1. 架构          │      │ 5. Helm 包管理    │      │ 7. 调度与弹性伸缩  │
│ 2. Pod/工作负载   │ ───→ │ 6. 综合实战部署    │ ───→ │ 8. 安全与权限      │
│ 3. Service/网络   │      │                  │      │ 9. 运维与故障排查   │
│ 4. 配置/存储      │      │                  │      │ 10. 面试高频题     │
└──────────────────┘      └──────────────────┘      └──────────────────┘
```

## 🔧 环境准备

```bash
# 设置集群连接
export KUBECONFIG=~/.kube/config.yaml

# 创建训练 namespace
kubectl create namespace k8s-training

# 练习完清理
kubectl delete namespace k8s-training
```

## ⚠️ 重要提醒

**Sealos 是付费集群！** 所有实操练习完成后务必清理资源。

- 每章练习完后执行 `kubectl delete namespace k8s-training`
- 实战项目完成后执行 `./practice/cleanup.sh`

## 📚 面试能力自测

学习完成后，检查以下问题是否都能回答：

### 基础必会（JD：能使用 K8S 进行部署）

- [ ] 能画出 K8S 架构图（Master + Worker）
- [ ] 能说出 Pod 创建的完整流程
- [ ] 能手写 Deployment YAML（含探针和资源限制）
- [ ] 能解释 4 种 Service 类型的区别和使用场景
- [ ] 能说出 ConfigMap 和 Secret 的区别
- [ ] 能说出 requests 和 limits 的区别
- [ ] 能说出 liveness/readiness/startup 探针的区别
- [ ] 能解释 RollingUpdate 策略
- [ ] 能使用 Helm 部署和回滚应用
- [ ] 能排查 Pod 常见异常（Pending/CrashLoopBackOff）

### 进阶加分（面试脱颖而出）

- [ ] 能解释 nodeAffinity 和 podAffinity 的区别和使用场景
- [ ] 能解释 Taint/Toleration 的工作机制和三种 effect
- [ ] 能配置 HPA 实现自动扩缩
- [ ] 能说出 RBAC 的四个核心对象
- [ ] 能解释 NetworkPolicy 的白名单安全策略
- [ ] 能说出 Pod 安全最佳实践（SecurityContext）
- [ ] 能说出三级自动伸缩体系（HPA/VPA/CA）
- [ ] 能描述完整的故障排查流程
