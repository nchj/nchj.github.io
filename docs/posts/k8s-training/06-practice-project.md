# 第6章：综合部署实战

> 实战项目使用 Helm Chart 打包一个完整的应用部署系统，覆盖前面 5 章的所有核心知识点。

→ **请前往 [实战项目目录](./practice/README.md) 开始练习**

## 本实战覆盖的知识点

| 知识点 | 说明 |
|--------|------|
| Namespace | 多租户资源隔离 |
| Deployment | Pod 管理、副本数、资源限制 |
| Liveness/Readiness Probe | 容器健康检测 |
| RollingUpdate | 零停机更新策略 |
| Service (ClusterIP) | 内部负载均衡 |
| ConfigMap / Secret | 配置与敏感信息管理 |
| Ingress / PVC | HTTP 路由与持久化存储（可选） |
| Helm Chart | 包管理、模板化配置 |
| DNS 服务发现 | CoreDNS 自动解析 |

---

**上一章**：[第5章：Helm 包管理](./05-helm.md) | **下一章**：[第7章：调度与弹性伸缩](./07-scheduling-autoscaling.md) | **实战**：[practice/README.md](./practice/README.md)
