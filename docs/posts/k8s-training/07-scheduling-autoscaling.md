# 第7章：调度与弹性伸缩

## 🎯 学习目标
- 理解 Scheduler 的调度决策机制
- 掌握 nodeSelector、nodeAffinity、podAffinity、podAntiAffinity 的使用场景和区别
- 掌握 Taint/Toleration（污点与容忍度）
- 掌握 HPA（水平自动扩缩）和 VPA（垂直自动扩缩）
- 能在面试中清晰回答调度和弹性伸缩相关问题

---

## 📖 学习要点

### 7.1 调度概述

回顾第1章，Scheduler 的职责是**决定 Pod 运行在哪个 Node 上**。调度是一个两步过程：

```
┌──────────────────────────────────────────────────────────┐
│                    调度流程                                │
│                                                          │
│  第一步：过滤（Filtering / Predicate）                    │
│  ─────────────────────────────────────────               │
│  排除不满足条件的 Node：                                   │
│    ❌ 资源不够（CPU/内存 requests 超出 Node 可分配）       │
│    ❌ nodeSelector 不匹配                                 │
│    ❌ nodeAffinity 不满足                                 │
│    ❌ Taint（污点）未被 Toleration 容忍                    │
│    ❌ PVC 存储不可用                                      │
│    ❌ Pod 反亲和性冲突                                     │
│                                                          │
│  → 剩下的叫"可调度节点"（Feasible Nodes）                 │
│                                                          │
│  第二步：打分（Scoring / Priority）                       │
│  ─────────────────────────────────────────               │
│  给每个可调度节点打分，选最高的：                           │
│    ✅ 资源均衡（选剩余资源最均衡的）                       │
│    ✅ podAffinity（靠近或远离某些 Pod）                   │
│    ✅ 数据本地性（PV 和 Pod 在同一 Node）                 │
│                                                          │
│  → 选得分最高的 Node → 绑定（Binding）                    │
└──────────────────────────────────────────────────────────┘
```

**面试回答模板**：
> "K8S 的调度分两步：先过滤排除不满足条件的 Node，再打分选最优的。过滤条件包括资源请求、节点选择器、亲和性、污点容忍等。打分考虑资源均衡、亲和性权重、数据本地性等因素。"

---

### 7.2 节点选择：nodeSelector → nodeAffinity

#### 7.2.1 nodeSelector（最简单）

通过标签精确匹配 Node：

```yaml
# 先给 Node 打标签
# kubectl label nodes node-1 disktype=ssd

apiVersion: v1
kind: Pod
metadata:
  name: nginx
spec:
  nodeSelector:
    disktype: ssd           # 只有标签包含 disktype=ssd 的 Node 才能调度
  containers:
  - name: nginx
    image: nginx:1.25
```

**局限**：只能精确匹配，不能表达"或"、"非"等逻辑。

#### 7.2.2 nodeAffinity（节点亲和性）⭐ 面试高频

比 nodeSelector 更强大，支持丰富的表达式：

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: app-deployment
spec:
  template:
    spec:
      affinity:
        nodeAffinity:
          # 硬性要求：必须满足，否则 Pod 无法调度（Pending）
          requiredDuringSchedulingIgnoredDuringExecution:
            nodeSelectorTerms:
            - matchExpressions:
              - key: kubernetes.io/arch
                operator: In          # 值在列表中
                values: ["amd64"]
              - key: disktype
                operator: NotIn       # 值不在列表中
                values: ["hdd"]

          # 软性偏好：尽量满足，不满足也能调度到其他 Node
          preferredDuringSchedulingIgnoredDuringExecution:
          - weight: 80               # 权重 1-100
            preference:
              matchExpressions:
              - key: node-type
                operator: In
                values: ["high-memory"]
          - weight: 20
            preference:
              matchExpressions:
              - key: zone
                operator: In
                values: ["cn-beijing-a"]
      containers:
      - name: app
        image: myapp:1.0
```

#### operator 支持的运算符

| operator | 含义 | 示例 |
|----------|------|------|
| `In` | 值在列表中 | `values: ["ssd", "nvme"]` |
| `NotIn` | 值不在列表中 | `values: ["hdd"]` |
| `Exists` | 标签存在（不关心值） | 不需要 values |
| `DoesNotExist` | 标签不存在 | 不需要 values |
| `Gt` | 值大于（数字） | `values: ["8"]` |
| `Lt` | 值小于（数字） | `values: ["4"]` |

#### 硬亲和 vs 软亲和（面试必问）

| 类型 | 关键词 | 不满足时 |
|------|--------|---------|
| **硬亲和**（必须） | `requiredDuringScheduling...` | Pod 永远 Pending |
| **软亲和**（偏好） | `preferredDuringScheduling...` | 仍然调度，只是不优先 |

> `IgnoredDuringExecution` 的含义：Pod 已经运行后，即使 Node 标签变了，**不会**驱逐 Pod。这是默认行为。

**面试回答模板**：
> "nodeAffinity 分为 required（硬）和 preferred（软）。required 不满足 Pod 会 Pending，preferred 只是偏好。operator 支持 In、NotIn、Exists、DoesNotExist、Gt、Lt 六种。后缀 IgnoredDuringExecution 表示 Pod 运行后 Node 标签变了不会驱逐。"

---

### 7.3 Pod 亲和与反亲和（⭐⭐⭐ 面试高频）

#### 7.3.1 podAffinity（Pod 亲和性）

**控制 Pod 和 Pod 之间的调度关系**——"让我的 Pod 靠近某些 Pod"。

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: frontend
spec:
  template:
    spec:
      affinity:
        podAffinity:
          requiredDuringSchedulingIgnoredDuringExecution:
          - labelSelector:
              matchLabels:
                app: cache         # 找标签为 app=cache 的 Pod
            topologyKey: kubernetes.io/hostname  # 在同一 Node 上
            # topologyKey: topology.kubernetes.io/zone  # 在同一可用区
          containers:
          - name: frontend
            image: myapp:1.0
```

**场景**：前端应用需要和缓存部署在同一 Node，减少网络延迟。

#### 7.3.2 podAntiAffinity（Pod 反亲和性）

**让 Pod 远离某些 Pod**——"不要把我的 Pod 和某些 Pod 放在一起"。

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: api-server
spec:
  replicas: 3
  template:
    spec:
      affinity:
        podAntiAffinity:
          # 硬反亲和：每个 Pod 必须在不同 Node
          requiredDuringSchedulingIgnoredDuringExecution:
          - labelSelector:
              matchLabels:
                app: api-server
            topologyKey: kubernetes.io/hostname

          # 软反亲和：尽量分布在不同可用区（权重分摊）
          preferredDuringSchedulingIgnoredDuringExecution:
          - weight: 100
            podAffinityTerm:
              labelSelector:
                matchLabels:
                  app: api-server
              topologyKey: topology.kubernetes.io/zone
      containers:
      - name: api
        image: myapp:1.0
```

#### topologyKey 是什么？

`topologyKey` 定义了"靠近"的范围（拓扑域）：

| topologyKey | 含义 | 效果 |
|-------------|------|------|
| `kubernetes.io/hostname` | 同一个 Node | Pod 必须在同一/不同 Node |
| `topology.kubernetes.io/zone` | 同一个可用区 | Pod 在同一/不同 AZ |
| `topology.kubernetes.io/region` | 同一个地域 | Pod 在同一/不同地域 |

#### nodeAffinity vs podAffinity 对比（面试必背）

| 对比项 | nodeAffinity | podAffinity |
|--------|-------------|-------------|
| 关注点 | Pod → Node 的关系 | Pod → Pod 的关系 |
| 基于什么选择 | Node 的标签 | 已有 Pod 的标签 |
| 典型场景 | Pod 必须在 SSD Node / GPU Node | 前端靠近缓存 / API 分散部署 |
| 是否需要 topologyKey | ❌ 不需要 | ✅ 必须指定 |

**面试回答模板**：
> "podAntiAffinity 常用来实现高可用——同一个 Deployment 的多个副本分散在不同 Node 或不同可用区，避免单节点故障导致服务不可用。硬反亲和保证分布，软反亲和只是偏好。topologyKey 定义拓扑域范围，hostname 是节点级别，zone 是可用区级别。"

---

### 7.4 污点与容忍度（Taint & Toleration）⭐ 面试高频

#### 7.4.1 概念

```
Taint（污点）：打在 Node 上的"排斥标记"，排斥不想被调度的 Pod
Toleration（容忍度）：Pod 声明"我能容忍某些污点"
```

**类比**：
- Node 污点 = 房间门上的"闲人免进"牌子
- Pod 容忍度 = "我有通行证，可以进"

```bash
# 给 Node 打污点
kubectl taint nodes node-1 dedicated=gpu:NoSchedule
# kubectl taint nodes <node> key=value:effect
```

#### 7.4.2 Taint 效果（effect）

| effect | 含义 | Pod 没有 Toleration 时 |
|--------|------|----------------------|
| **NoSchedule** | 新 Pod 不会被调度到此 Node | ✅ 不调度（已有的不受影响） |
| **PreferNoSchedule** | 尽量不调度到此 Node | ⚠️ 尽量不调度，实在没地方也能调度 |
| **NoExecute** | 新不调度 + 已有的 Pod 如果没 Toleration 会被驱逐 | 🚫 不调度 + 驱逐已有 Pod |

#### 7.4.3 YAML 示例

```yaml
# Pod 声明容忍度
apiVersion: v1
kind: Pod
metadata:
  name: gpu-task
spec:
  tolerations:
  # 精确匹配：容忍 dedicated=gpu:NoSchedule
  - key: "dedicated"
    operator: "Equal"
    value: "gpu"
    effect: "NoSchedule"

  # 存在即容忍：容忍所有 effect 为 NoSchedule 的 dedicated 污点
  - key: "dedicated"
    operator: "Exists"
    effect: "NoSchedule"

  # 容忍所有污点（危险！慎用）
  - operator: "Exists"
  containers:
  - name: cuda-app
    image: cuda-app:1.0
```

#### 7.4.4 常见使用场景

**场景1：Master 节点隔离**
```bash
# K8S 默认给 Master 节点打污点
kubectl taint nodes master-node node-role.kubernetes.io/control-plane:NoSchedule

# 只有声明了 Toleration 的系统 Pod（如 CoreDNS）才能运行在 Master 上
```

**场景2：GPU 专用节点**
```bash
# 给 GPU Node 打污点
kubectl taint nodes gpu-node-1 hardware=gpu:NoSchedule

# 只有 GPU 任务 Pod 声明容忍度才能调度上去
```

**场景3：节点故障自动驱逐（NoExecute）**
```bash
# Node 不健康时自动打 NoExecute 污点
# 没有容忍度的 Pod 会被驱逐到其他 Node
# 配合 tolerationSeconds 可以延迟驱逐：
  tolerations:
  - key: "node.kubernetes.io/not-ready"
    operator: "Exists"
    effect: "NoExecute"
    tolerationSeconds: 300    # 等待 300 秒再驱逐（给 Node 恢复时间）
```

#### 7.4.5 Taint vs nodeAffinity（面试对比）

| 对比项 | Taint（污点） | nodeAffinity（节点亲和性） |
|--------|-------------|--------------------------|
| 方向 | Node 排斥 Pod | Pod 选择 Node |
| 谁定义规则 | Node 上配置 | Pod 上配置 |
| 作用 | "我不欢迎你" | "我想去你那里" |
| 类比 | 房间挂牌子"闲人免进" | 人拿钥匙"我能进这个房间" |
| 典型场景 | Master 隔离、GPU 专用 | Pod 必须在 SSD Node |

> 两者可以**组合使用**：Node 打 Taint 限制谁能来，Pod 用 nodeAffinity 表达想去哪。

**面试回答模板**：
> "Taint 是 Node 上的排斥标记，Toleration 是 Pod 上的容忍声明。三个 effect：NoSchedule 不调度新 Pod，PreferNoSchedule 尽量不调度，NoExecute 还会驱逐已有 Pod。常见用途是 Master 节点隔离和专用节点。和 nodeAffinity 的区别是方向相反——Taint 是 Node 排斥 Pod，Affinity 是 Pod 选择 Node。"

---

### 7.5 水平自动扩缩 HPA（⭐⭐⭐ 面试必考）

#### 7.5.1 什么是 HPA？

HPA（Horizontal Pod Autoscaler）根据指标**自动调整 Pod 副本数**。

```
没有 HPA：
  手动 kubectl scale → 流量来了来不及 → 手动扩容有延迟

有 HPA：
  CPU 超过 80% → 自动扩到 5 个副本
  CPU 降到 30% → 自动缩回 2 个副本
  完全自动，无需人工干预！
```

```
┌──────────────────────────────────────────────────────┐
│                    HPA 工作流程                        │
│                                                      │
│  Metrics Server（采集 Pod 的 CPU/内存指标）            │
│       │                                              │
│       ▼                                              │
│  HPA Controller（每 15-30 秒检查一次）                │
│       │                                              │
│       │  期望副本数 = ceil(当前指标值 / 目标指标值)    │
│       │                                              │
│       │  例：目标 CPU = 50%，当前 4 Pod 共 240%      │
│       │  期望副本 = ceil(240/50) = 5                  │
│       │  不够 → 扩容到 5 个                           │
│       │                                              │
│       ▼                                              │
│  调整 Deployment 的 replicas                          │
└──────────────────────────────────────────────────────┘
```

#### 7.5.2 前提条件

```bash
# 1. 必须安装 Metrics Server（采集资源指标）
# 大多数云集群默认已安装，检查：
kubectl top pods                          # 能显示数据说明已安装

# 如果未安装（如 Sealos）：
kubectl apply -f https://github.com/kubernetes-sigs/metrics-server/releases/latest/download/components.yaml

# 2. Pod 必须配置 resources.requests（HPA 基于 requests 计算百分比）
# 没有 requests 的 Pod 其指标会被忽略
```

#### 7.5.3 HPA YAML 示例

```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: app-hpa
  namespace: k8s-training
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: app-deployment          # ⭐ 控制哪个 Deployment
  minReplicas: 2                   # 最少 2 个副本
  maxReplicas: 10                  # 最多 10 个副本
  metrics:
  # 指标1：CPU 利用率
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70    # 目标：平均 CPU 利用率 70%

  # 指标2：内存利用率
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80    # 目标：平均内存利用率 80%

  # 指标3：自定义指标（需要 Prometheus Adapter）
  # - type: Pods
  #   pods:
  #     metric:
  #       name: http_requests_per_second
  #     target:
  #       type: AverageValue
  #       averageValue: "1000"

  behavior:                        # 扩缩行为控制（可选，但推荐配置）
    scaleDown:
      stabilizationWindowSeconds: 300   # 缩容稳定窗口：5分钟内不重复缩容
      policies:
      - type: Percent
        value: 10                     # 每次最多缩容 10%
        periodSeconds: 60
    scaleUp:
      stabilizationWindowSeconds: 0    # 扩容不等待（立即响应）
      policies:
      - type: Percent
        value: 100                    # 每次最多扩容 100%（翻倍）
        periodSeconds: 15
      - type: Pods
        value: 4                      # 或每次最多增加 4 个
        periodSeconds: 15
      selectPolicy: Max               # 多个策略取最大值
```

#### 7.5.4 快速创建 HPA

```bash
# 命令行快速创建（基于 CPU）
kubectl autoscale deployment app-deployment \
  --cpu-percent=70 \
  --min=2 --max=10 \
  -n k8s-training

# 查看 HPA 状态
kubectl get hpa -n k8s-training
# NAME      REFERENCE                       TARGETS   MINPODS   MAXPODS   REPLICAS   AGE
# app-hpa   Deployment/app-deployment       45%/70%   2         10        3          5m

# 查看 HPA 事件（了解扩缩原因）
kubectl describe hpa app-hpa -n k8s-training
```

#### 7.5.5 HPA 扩缩公式

```
期望副本数 = ceil(当前所有 Pod 的指标总量 / 目标指标值)

示例：
  Deployment 有 3 个 Pod，CPU requests 都是 100m
  目标 CPU 利用率 = 70%
  当前 3 个 Pod 的 CPU 使用率：80%、60%、50%

  当前平均利用率 = (80 + 60 + 50) / 3 = 63.3%（低于 70%，不扩容）

  如果负载增加，3 个 Pod 的 CPU 使用率变为：90%、85%、80%：
  当前平均利用率 = (90 + 85 + 80) / 3 = 85%（高于 70%）
  期望副本数 = ceil(3 × 85 / 70) = ceil(3.64) = 4 → 扩容到 4 个
```

#### 7.5.6 HPA 注意事项（面试加分）

```
1. Pod 必须配置 resources.requests
   → HPA 基于 requests 计算百分比，没配 requests 的 Pod 不参与计算

2. 冷启动问题
   → 扩容需要等 Pod 启动并注册到 Service（readinessProbe 通过）
   → 配置 startupProbe 和合理的 readinessProbe 可以加速

3. 避免抖动
   → 配置 behavior.scaleDown.stabilizationWindowSeconds（默认 5 分钟）
   → 避免频繁扩缩

4. 多指标 HPA
   → 取所有指标计算出的最大副本数（最坏的指标决定扩多少）

5. HPA 与 PDB（PodDisruptionBudget）配合
   → PDB 限制最大不可用 Pod 数，HPA 缩容时不会违反 PDB
```

---

### 7.6 VPA 与 Cluster Autoscaler（了解即可）

#### 7.6.1 VPA（Vertical Pod Autoscaler）

HPA 是水平扩缩（加/减 Pod 数量），VPA 是**垂直扩缩**（调整单个 Pod 的 CPU/内存 requests）。

```
HPA: 2 个 Pod（1核2G）→ 4 个 Pod（1核2G）     ← 加副本
VPA: 2 个 Pod（1核2G）→ 2 个 Pod（2核4G）     ← 加资源
```

| 对比 | HPA | VPA |
|------|-----|-----|
| 扩缩方式 | 增减副本数 | 调整 requests/limits |
| 适用场景 | 无状态应用 | 资源需求波动大 |
| 注意 | 需要 Metrics Server | 需要 VPA Controller |
| **重要** | **可与 VPA 共存（某些模式）** | **默认会重启 Pod 生效** |

> 面试中了解 VPA 的概念即可，知道它和 HPA 的区别就行。大多数场景用 HPA。

#### 7.6.2 Cluster Autoscaler（CA）

HPA/VPA 调整 Pod 级别，CA 调整**节点级别**——自动增减 Node 数量。

```
┌─────────────────────────────────────────┐
│         三级自动伸缩体系                    │
│                                         │
│  Layer 1: HPA（Pod 级别）               │
│  → 流量增大，Pod 不够 → 增加副本        │
│                                         │
│  Layer 2: VPA（Pod 级别）               │
│  → Pod 资源不够 → 增加单 Pod 的资源     │
│                                         │
│  Layer 3: Cluster Autoscaler（Node 级别）│
│  → 所有 Node 的资源都被 Pod 占满了       │
│  → Pod 处于 Pending 状态                │
│  → CA 自动向云厂商申请新 Node 加入集群   │
│  → Pod 调度到新 Node                    │
│                                         │
│  反过来，Node 利用率低 → CA 缩减 Node    │
└─────────────────────────────────────────┘
```

> CA 是云厂商级别的能力（AWS/阿里云/GCP），在 Sealos 这种托管平台上不适用。面试中知道有这个东西就行。

---

### 7.7 调度场景综合案例

#### 场景：部署高可用 API 服务

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: api-server
  namespace: production
spec:
  replicas: 6
  selector:
    matchLabels:
      app: api-server
  template:
    metadata:
      labels:
        app: api-server
    spec:
      # 1. 容忍 Master 节点的污点（如果允许调度到 Master）
      # tolerations:
      # - key: "node-role.kubernetes.io/control-plane"
      #   operator: "Exists"
      #   effect: "NoSchedule"

      affinity:
        # 2. 硬反亲和：每个副本必须在不同 Node（高可用基础）
        podAntiAffinity:
          requiredDuringSchedulingIgnoredDuringExecution:
          - labelSelector:
              matchLabels:
                app: api-server
            topologyKey: kubernetes.io/hostname

        # 3. 软亲和：尽量分布在不同可用区（跨 AZ 容灾）
        podAntiAffinity:
          preferredDuringSchedulingIgnoredDuringExecution:
          - weight: 100
            podAffinityTerm:
              labelSelector:
                matchLabels:
                  app: api-server
              topologyKey: topology.kubernetes.io/zone

        # 4. 软亲和：靠近缓存 Pod（减少延迟）
        podAffinity:
          preferredDuringSchedulingIgnoredDuringExecution:
          - weight: 50
            podAffinityTerm:
              labelSelector:
                matchLabels:
                  app: redis-cache
              topologyKey: kubernetes.io/hostname

        # 5. 节点亲和：必须部署在 x86 架构上
        nodeAffinity:
          requiredDuringSchedulingIgnoredDuringExecution:
            nodeSelectorTerms:
            - matchExpressions:
              - key: kubernetes.io/arch
                operator: In
                values: ["amd64"]

      containers:
      - name: api
        image: myapp:2.0
        resources:
          requests:
            cpu: "200m"
            memory: "256Mi"
          limits:
            cpu: "1000m"
            memory: "1Gi"
        livenessProbe:
          httpGet:
            path: /healthz
            port: 8080
          initialDelaySeconds: 10
          periodSeconds: 5
        readinessProbe:
          httpGet:
            path: /ready
            port: 8080
          initialDelaySeconds: 5
          periodSeconds: 3
---
# 6. HPA：根据 CPU 自动扩缩
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: api-server-hpa
  namespace: production
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: api-server
  minReplicas: 6
  maxReplicas: 20
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
```

---

## 📝 习题

### 选择题

**Q1.** nodeAffinity 中 `requiredDuringSchedulingIgnoredDuringExecution` 的含义是？
- A) 调度时尽量满足，运行后标签变了会驱逐 Pod
- B) 调度时必须满足，运行后标签变了不驱逐 Pod
- C) 调度和运行时都必须满足
- D) 仅在运行时检查

**Q2.** 以下哪个不是 Taint 的 effect 类型？
- A) NoSchedule
- B) PreferNoSchedule
- C) NoExecute
- D) NoTolerate

**Q3.** podAntiAffinity 的 `topologyKey: kubernetes.io/hostname` 表示什么？
- A) 所有 Pod 必须在同一 Node
- B) 同一 Deployment 的 Pod 不能在同一 Node
- C) Pod 必须调度到特定主机名的 Node
- D) Node 的 hostname 必须匹配

**Q4.** HPA 根据什么指标自动扩缩？
- A) Node 的 CPU 利用率
- B) Deployment 所有 Pod 的平均 CPU 利用率
- C) 集群总 CPU 使用量
- D) Service 的 QPS

**Q5.** 以下哪种情况下 Pod 会被驱逐（Evicted）？
- A) Node 有 NoSchedule 污点，Pod 没有对应 Toleration
- B) Node 有 NoExecute 污点，Pod 没有对应 Toleration
- C) Node 有 PreferNoSchedule 污点，Pod 没有对应 Toleration
- D) Pod 没有配置 nodeAffinity

### 简答题

**Q6.** 请解释 nodeAffinity 和 podAffinity 的区别，分别适用什么场景？

**Q7.** Taint（污点）和 nodeAffinity（节点亲和性）有什么区别？

**Q8.** HPA 的工作原理是什么？扩容公式怎么计算？

**Q9.** 为什么 HPA 要求 Pod 必须配置 resources.requests？

### 动手题

**Q10.** 请编写一个 Deployment + HPA 的 YAML，要求：
- Deployment: 3 副本，Nginx 镜像，CPU requests=100m, limits=500m
- HPA: 目标 CPU 利用率 70%，最小 2 副本，最大 10 副本
- podAntiAffinity: 硬性要求，副本不能在同一 Node

---

## ✅ 参考答案

### A1. B) 调度时必须满足，运行后标签变了不驱逐 Pod
- `required` = 必须满足
- `DuringScheduling` = 调度时检查
- `IgnoredDuringExecution` = 运行后不检查（不驱逐）

### A2. D) NoTolerate
三种 effect：NoSchedule、PreferNoSchedule（也称 SoftNoSchedule）、NoExecute。没有 NoTolerate。

### A3. B) 同一 Deployment 的 Pod 不能在同一 Node
`podAntiAffinity` + `topologyKey: hostname` = 同标签的 Pod 不能在同一 hostname 的 Node 上。

### A4. B) Deployment 所有 Pod 的平均 CPU 利用率
HPA 监控 scaleTargetRef 指定的 Deployment 下所有 Pod 的平均指标值。

### A5. B) Node 有 NoExecute 污点，Pod 没有对应 Toleration
只有 NoExecute 会驱逐已有 Pod。NoSchedule 只阻止新 Pod 调度。

### A6. nodeAffinity vs podAffinity
```
nodeAffinity（节点亲和性）：
  - Pod 对 Node 的偏好
  - 基于 Node 的标签
  - 例：Pod 必须调度到 SSD Node
  - 不需要 topologyKey

podAffinity（Pod 亲和性）：
  - Pod 对其他 Pod 的偏好
  - 基于已有 Pod 的标签
  - 例：前端 Pod 靠近缓存 Pod
  - 必须指定 topologyKey
```

### A7. Taint vs nodeAffinity
```
Taint（污点）：Node 主动排斥 Pod
  - 配置在 Node 上
  - "我不欢迎你"
  - 没有容忍度的 Pod 不能调度

nodeAffinity（节点亲和性）：Pod 主动选择 Node
  - 配置在 Pod 上
  - "我想去你那里"
  - 没有匹配的 Node Pod 不会调度

类比：
  Taint = 房间门上贴"闲人免进"
  nodeAffinity = 人说"我想进标有SSD的房间"
```

### A8. HPA 工作原理
```
1. Metrics Server 采集每个 Pod 的 CPU/内存使用数据
2. HPA Controller 每 15-30 秒检查一次
3. 计算公式：期望副本数 = ceil(当前所有 Pod 指标总量 / 目标指标值)
4. 如果期望 > maxReplicas → 扩到 maxReplicas
5. 如果期望 < minReplicas → 保持 minReplicas
6. 如果期望 > 当前副本数 → 扩容
7. 如果期望 < 当前副本数 → 等待稳定窗口后缩容

扩缩行为可以通过 behavior 字段精细控制。
```

### A9. HPA 需要 requests 的原因
```
HPA 基于指标"百分比"计算：
  CPU 利用率 = 实际使用量 / requests

如果没配 requests：
  - 无法计算百分比（分母为零）
  - HPA 会忽略该 Pod 的指标
  - 导致扩缩不准确

例：requests.cpu = 100m，实际使用 70m → 利用率 70%
```

### A10. Deployment + HPA YAML

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: nginx-hpa-demo
  namespace: k8s-training
spec:
  replicas: 3
  selector:
    matchLabels:
      app: nginx
  template:
    metadata:
      labels:
        app: nginx
    spec:
      affinity:
        podAntiAffinity:
          requiredDuringSchedulingIgnoredDuringExecution:
          - labelSelector:
              matchLabels:
                app: nginx
            topologyKey: kubernetes.io/hostname
      containers:
      - name: nginx
        image: nginx:1.25
        ports:
        - containerPort: 80
        resources:
          requests:
            cpu: "100m"
            memory: "64Mi"
          limits:
            cpu: "500m"
            memory: "256Mi"
---
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: nginx-hpa
  namespace: k8s-training
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: nginx-hpa-demo
  minReplicas: 2
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  behavior:
    scaleDown:
      stabilizationWindowSeconds: 300
```

---

## 🔧 实操练习

```bash
export KUBECONFIG=~/.kube/sealos.yaml
kubectl create namespace k8s-training

# 1. 查看 Node 标签（了解 Node 信息）
kubectl get nodes --show-labels

# 2. 给 Node 打标签（模拟不同节点类型）
kubectl label nodes <your-node> disktype=ssd --overwrite

# 3. 部署带 nodeSelector 的 Pod
kubectl apply -f - <<EOF
apiVersion: v1
kind: Pod
metadata:
  name: ssd-test
  namespace: k8s-training
spec:
  nodeSelector:
    disktype: ssd
  containers:
  - name: nginx
    image: nginx:1.25
    resources:
      requests:
        cpu: "50m"
        memory: "32Mi"
      limits:
        cpu: "200m"
        memory: "128Mi"
EOF

# 4. 查看 Pod 调度到了哪个 Node
kubectl get pod ssd-test -n k8s-training -o wide

# 5. 查看 Node 污点（了解默认污点）
kubectl describe node <your-node> | grep -A5 Taints

# 6. 测试 podAntiAffinity（需要多 Node 环境）
kubectl apply -f - <<EOF
apiVersion: apps/v1
kind: Deployment
metadata:
  name: anti-affinity-demo
  namespace: k8s-training
spec:
  replicas: 3
  selector:
    matchLabels:
      app: demo
  template:
    metadata:
      labels:
        app: demo
    spec:
      affinity:
        podAntiAffinity:
          requiredDuringSchedulingIgnoredDuringExecution:
          - labelSelector:
              matchLabels:
                app: demo
            topologyKey: kubernetes.io/hostname
      containers:
      - name: nginx
        image: nginx:1.25
        resources:
          requests:
            cpu: "50m"
            memory: "32Mi"
          limits:
            cpu: "200m"
            memory: "128Mi"
EOF

kubectl get pods -n k8s-training -o wide
# 验证：每个 Pod 应该在不同 Node 上

# 7. 测试 HPA（如果 Metrics Server 已安装）
# kubectl top pods -n k8s-training  # 先确认能获取指标
# kubectl autoscale deployment anti-affinity-demo --cpu-percent=70 --min=2 --max=10 -n k8s-training
# kubectl get hpa -n k8s-training -w

# ⚠️ 清理！
kubectl delete namespace k8s-training
# 清理标签
kubectl label nodes <your-node> disktype-
```

---

**上一章**：[第6章：综合部署实战](./06-practice-project.md) | **下一章**：[第8章：安全与权限](./08-security.md)
