# 第1章：Kubernetes 核心概念与架构

## 🎯 学习目标
- 理解 K8S 是什么、为什么需要它
- 掌握 K8S 集群架构（Master + Worker）
- 理解核心组件的职责和协作关系
- 能回答面试中"K8S 架构"相关问题

---

## 📖 学习要点

### 1.1 什么是 Kubernetes

**定义**：Kubernetes（简称 K8S）是一个开源的**容器编排平台**，用于自动部署、扩缩和管理容器化应用。

**核心能力**：
| 能力 | 说明 | 一句话理解 |
|------|------|-----------|
| 服务发现与负载均衡 | 自动分配流量到健康的 Pod | 不用手动配 Nginx upstream |
| 自动部署与回滚 | 声明式地管理应用状态 | git 一样管理基础设施 |
| 自动装箱 | 根据资源需求调度 Pod 到节点 | 自动找合适的服务器放容器 |
| 自我修复 | 自动重启失败的容器，替换不健康的 Pod | 容器挂了自动拉起来 |
| 水平扩缩 | 根据负载自动增减 Pod 数量 | 流量大了自动加机器 |
| Secret 和配置管理 | 管理敏感信息和应用配置 | 配置和代码分离 |

**K8S vs Docker Compose 的区别**（面试高频）：

```
Docker Compose：
- 单机编排
- 适合开发环境
- docker-compose up 即可
- 没有自愈能力

Kubernetes：
- 集群编排（多节点）
- 适合生产环境
- 需要学习成本
- 自愈、自动扩缩、滚动更新
```

### 1.2 集群架构

```
┌─────────────────────────────────────────────────────────┐
│                    K8S Cluster                          │
│                                                         │
│  ┌───────────── Master Node(s) ─────────────┐          │
│  │                                          │          │
│  │  ┌──────────┐  ┌──────────┐  ┌────────┐ │          │
│  │  │ API      │  │Scheduler │  │ etcd   │ │          │
│  │  │ Server   │  │          │  │        │ │          │
│  │  └──────────┘  └──────────┘  └────────┘ │          │
│  │  ┌──────────┐  ┌──────────┐             │          │
│  │  │Controller│  │  Cloud   │             │          │
│  │  │ Manager  │  │ Controller│             │          │
│  │  └──────────┘  └──────────┘             │          │
│  └──────────────────────────────────────────┘          │
│                        ▲                               │
│                        │ REST API                      │
│          ┌─────────────┼──────────────┐               │
│          ▼             ▼              ▼               │
│  ┌───────────┐  ┌───────────┐  ┌───────────┐          │
│  │ Worker 1  │  │ Worker 2  │  │ Worker N  │          │
│  │           │  │           │  │           │          │
│  │ ┌───────┐ │  │ ┌───────┐ │  │ ┌───────┐ │          │
│  │ │kubelet│ │  │ │kubelet│ │  │ │kubelet│ │          │
│  │ └───────┘ │  │ └───────┘ │  │ └───────┘ │          │
│  │ ┌───────┐ │  │ ┌───────┐ │  │ ┌───────┐ │          │
│  │ │kube-  │ │  │ │kube-  │ │  │ │kube-  │ │          │
│  │ │proxy  │ │  │ │proxy  │ │  │ │proxy  │ │          │
│  │ └───────┘ │  │ └───────┘ │  │ └───────┘ │          │
│  │ ┌───────┐ │  │ ┌───────┐ │  │ ┌───────┐ │          │
│  │ │Pod Pod│ │  │ │Pod Pod│ │  │ │Pod Pod│ │          │
│  │ └───────┘ │  │ └───────┘ │  │ └───────┘ │          │
│  └───────────┘  └───────────┘  └───────────┘          │
└─────────────────────────────────────────────────────────┘
```

### 1.3 核心组件详解

#### Master 节点组件（控制面）

**① API Server（apiserver）**
- K8S 的"前台"，所有组件和用户都通过它通信
- 唯一入口，提供 REST API
- 认证、授权、准入控制
- **面试考点**：为什么所有组件都通过 API Server 通信而不是直接访问 etcd？
  > 解耦、安全（etcd 不暴露）、审计、统一鉴权

**② etcd**
- 分布式键值存储，保存集群所有数据
- K8S 的"数据库"
- 状态：集群状态、配置、Secret 数据都存在这里
- **面试考点**：etcd 挂了会怎样？
  > Master 功能失效，不能创建新资源，但已有 Pod 继续运行

**③ Scheduler（调度器）**
- 决定 Pod 运行在哪个 Node 上
- 调度决策因素：资源请求、亲和性、污点容忍、数据本地性等
- **工作流程**：Pod 创建 → Scheduler 观察 → 选择最优 Node → 绑定

**④ Controller Manager（控制器管理器）**
- 运行多个控制器的进程
- 核心："控制循环"（Reconcile Loop）：不断观察期望状态 vs 实际状态，驱动实际状态趋近期望状态
- 常见控制器：
  - **Deployment Controller**：管理 ReplicaSet，保证 Pod 副本数
  - **Node Controller**：监控节点健康
  - **ReplicaSet Controller**：保证 Pod 数量
  - **Service Account Controller**：管理默认 SA

#### Worker 节点组件

**⑤ kubelet**
- 每个 Node 上的"代理人"
- 接收 PodSpec（来自 API Server），确保容器按 Spec 运行
- 健康检查、向 Master 汇报节点状态
- **面试考点**：kubelet 挂了会怎样？
  > 该 Node 上的 Pod 不受管理，Master 会将其标记为 NotReady

**⑥ kube-proxy**
- 维护节点上的网络规则
- 实现 Service 的负载均衡（iptables/IPVS 模式）
- 让 Service 能将流量路由到正确的 Pod

### 1.4 核心资源对象（K8S 词汇表）

```
Namespace          → 集群内虚拟分区（多租户隔离）
Pod                → 最小部署单元，一个或多个容器
Deployment         → 管理 Pod 的声明式更新（无状态应用）
ReplicaSet         → 保证 Pod 副本数（通常不直接使用）
Service            → Pod 的稳定网络入口 + 负载均衡
ConfigMap          → 存非敏感配置
Secret             → 存敏感信息（密码、证书）
Ingress            → HTTP/HTTPS 路由（7层负载均衡）
PersistentVolume   → 持久化存储
PersistentVolumeClaim → 存储申请
```

### 1.5 声明式 vs 命令式（面试必考）

```
命令式（Imperative）：
  kubectl run nginx --image=nginx
  kubectl create deployment ...
  → 告诉 K8S "做什么操作"

声明式（Declarative）：
  kubectl apply -f deployment.yaml
  → 告诉 K8S "我要什么状态"，K8S 自己搞定

  优势：
  ✅ Git 友好（版本控制）
  ✅ 可审计（谁改了什么）
  ✅ 幂等（多次执行结果一致）
  ✅ 可回滚
```

---

## 📝 习题

### 选择题

**Q1.** Kubernetes 中负责存储集群所有状态数据的组件是？
- A) API Server
- B) Scheduler
- C) etcd
- D) kubelet

**Q2.** 以下哪个不是 Master 节点的组件？
- A) Controller Manager
- B) kubelet
- C) API Server
- D) Scheduler

**Q3.** K8S 中最小的调度和部署单元是？
- A) Container
- B) Pod
- C) Deployment
- D) Service

**Q4.** kube-proxy 的主要职责是？
- A) 调度 Pod 到合适的节点
- B) 管理集群状态数据
- C) 维护网络规则，实现 Service 负载均衡
- D) 监控 Pod 健康状态

**Q5.** 声明式 API 的优势不包括以下哪个？
- A) 幂等性
- B) Git 友好
- C) 执行速度更快
- D) 可审计

### 简答题

**Q6.** 请简述一个 Pod 从 `kubectl apply -f pod.yaml` 到实际运行经历的完整流程。

**Q7.** 如果 etcd 集群不可用，K8S 集群会发生什么？已有 Pod 还能继续工作吗？

**Q8.** 请解释 K8S 中"控制循环"（Control Loop / Reconcile Loop）的概念。

---

## ✅ 参考答案

### A1. C) etcd
etcd 是 K8S 的唯一状态存储，所有集群数据（节点信息、Pod 状态、配置等）都存在 etcd 中。

### A2. B) kubelet
kubelet 运行在每个 Worker 节点上，负责管理该节点上的容器。它不是 Master 组件。

### A3. B) Pod
Pod 是 K8S 的最小调度和部署单元。一个 Pod 可以包含一个或多个容器，它们共享网络和存储命名空间。

### A4. C) 维护网络规则，实现 Service 负载均衡
kube-proxy 运行在每个节点上，通过 iptables 或 IPVS 规则，将访问 Service 的流量转发到后端的 Pod。

### A5. C) 执行速度更快
声明式 API 并不比命令式执行更快，有时因为 diff 计算反而更慢。其核心优势是幂等、Git 友好、可审计。

### A6. Pod 创建完整流程
```
1. 用户执行 kubectl apply -f pod.yaml
2. kubectl 将请求发送给 API Server（认证+授权+准入控制）
3. API Server 将 Pod 配置写入 etcd
4. Scheduler 感知到有未绑定的 Pod，执行调度算法
5. Scheduler 选出最优 Node，将绑定信息写入 etcd
6. 目标 Node 上的 kubelet 监听到分配给自己的 Pod
7. kubelet 调用容器运行时（CRI）拉取镜像、创建容器
8. kubelet 执行健康检查，向 API Server 汇报 Pod 状态
9. Pod 变为 Running 状态
```

### A7. etcd 不可用的影响
- **Master 功能完全失效**：无法创建/更新/删除任何资源
- **已有 Pod 继续运行**：kubelet 是直接管理容器的，不依赖 etcd
- **新 Pod 无法调度**：Scheduler 无法读取/写入状态
- **自愈失效**：Controller Manager 无法感知状态变化
- **结论**：集群变成"只读"状态，已有工作负载不受影响但不能管理

### A8. 控制循环（Reconcile Loop）
控制循环是 K8S 控制器模式的核心：
1. 控制器观察（Watch）API Server 中的资源状态
2. 对比**期望状态**（YAML 中定义的）和**实际状态**（集群中真实的）
3. 如果不一致，执行动作使实际状态趋近期望状态
4. 循环重复

```
while true:
    实际状态 = getCurrentState()
    if 实际状态 != 期望状态:
        执行动作使实际状态 → 期望状态
    sleep(一段时间)
```

**类比**：恒温器 —— 你设定 25°C（期望状态），恒温器不断检测室温（实际状态），低于 25°C 就开暖气。

---

## 🔧 实操练习

```bash
# 设置集群连接
export KUBECONFIG=~/.kube/sealos.yaml

# 创建自己的 namespace（所有练习在这个 namespace 下操作）
kubectl create namespace k8s-training

# 查看集群信息
kubectl get ns
kubectl cluster-info

# 练习后清理
kubectl delete namespace k8s-training
```

> ⚠️ **提醒**：所有实操练习都在 `k8s-training` namespace 下进行，练习完务必删除资源，Sealos 是付费的！

---

**下一章**：[第2章：Pod 与工作负载管理](./02-pod-and-workloads.md)
