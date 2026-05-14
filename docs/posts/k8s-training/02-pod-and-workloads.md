# 第2章：Pod 与工作负载管理

## 🎯 学习目标
- 理解 Pod 的生命周期和核心字段
- 掌握 Deployment、StatefulSet、DaemonSet、Job/CronJob 的使用场景
- 能手写 YAML 并部署应用
- 理解滚动更新和回滚机制

---

## 📖 学习要点

### 2.1 Pod 是什么（最底层的运行单元）

**一句话理解**：Pod 是 K8S 中**真正运行的实体**。不管你写的是 Deployment、StatefulSet 还是 DaemonSet，最终跑在节点上的都是 Pod。

```
┌─────────────────────────────────────┐
│              Pod (IP: 10.244.1.5)    │
│                                     │
│  ┌─────────────┐ ┌──────────────┐  │
│  │   Container  │ │  Container   │  │
│  │    (App)     │ │ (Sidecar)    │  │
│  │             │ │              │  │
│  │ Port: 8080  │ │ Port: 9090  │  │
│  └─────────────┘ └──────────────┘  │
│                                     │
│  ┌──────────────────────────────┐  │
│  │  Pause Container (共享网络)    │  │
│  └──────────────────────────────┘  │
│                                     │
│  共享: Network Namespace            │
│  共享: Volume (挂载点)              │
└─────────────────────────────────────┘
```

**为什么 K8S 不直接管理容器而要加一层 Pod？**
- 有些应用天然需要多个进程协作（如日志收集 sidecar）
- Pod 内容器共享 IP 和端口空间，可以通过 localhost 通信
- Pod 是调度的原子单位——同 Pod 的容器一定在同一节点

### 2.2 Pod 的两种使用方式（⭐ 核心！先搞懂这个再往下看）

Pod 有两种创建方式，**理解这个就理解了 Deployment 里"隐含的 Pod"是怎么回事**：

```
方式一：直接创建 Pod（独立 Pod）
┌────────────┐
│ 你写 Pod   │  →  kubectl apply -f pod.yaml  →  K8S 直接创建 Pod
│   YAML     │     你要自己管一切：
│            │     Pod 挂了就没了，没人帮你重启
└────────────┘     没有自动扩缩，没有滚动更新

方式二：通过 Deployment 管理 Pod（托管 Pod）⭐ 绝大多数场景
┌──────────────┐
│ 你写 Deploy  │  →  kubectl apply -f deploy.yaml
│   YAML       │     Deployment 根据 template 自动帮你创建 Pod
│              │     Pod 挂了自动重启
│              │     想多副本？改 replicas 就行
│              │     想更新？改 image 就自动滚动更新
└──────────────┘
```

**关键结论**：
> **Pod 永远是 K8S 的运行单位，但你不一定需要直接写 Pod YAML。**
> 写 Deployment YAML 时，Pod 被"嵌在" Deployment 的 `template` 字段里——这就是所谓的"隐含"。

---

### 2.3 Deployment 与 Pod 的关系（⭐⭐⭐ 面试必问，必须彻底理解）

#### 先看本质：Deployment = Pod 的管理者

```
┌─────────────────────────────────────────────────┐
│              Deployment（管理者）                  │
│                                                 │
│  我想要 3 个 Pod，标签都是 app=nginx，用 nginx:1.25│
│                                                 │
│  selector:           ← 用标签来"认领" Pod       │
│    app: nginx                                  │
│  replicas: 3         ← 要维护 3 个副本          │
│  template:           ← Pod 的"模子"（模板）     │
│    metadata:                                 │
│      labels:                                 │
│        app: nginx       ← 新创建的 Pod 打上这个标签│
│    spec:                                     │
│      containers: ...   ← 容器怎么定义          │
└─────────────────────────────────────────────────┘
           │
           │  Deployment Controller 看着这个模板
           │  发现"实际只有 1 个 Pod，我想要 3 个"
           │  → 自动创建 2 个新 Pod
           ▼
┌──────────┐  ┌──────────┐  ┌──────────┐
│  Pod-1   │  │  Pod-2   │  │  Pod-3   │
│ app=nginx│  │ app=nginx│  │ app=nginx│  ← 自动创建，标签匹配
│ 1.25     │  │ 1.25     │  │ 1.25     │
└──────────┘  └──────────┘  └──────────┘
```

#### Deployment YAML 中的"三套标签"（最容易混淆的地方）

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: nginx-deployment
  labels:
    app: nginx                    # ① Deployment 自己的标签
spec:
  selector:
    matchLabels:
      app: nginx                  # ② 选择器：Deployment 用来找 Pod 的条件
  template:
    metadata:
      labels:
        app: nginx                # ③ Pod 模板的标签：新 Pod 会被打上这个标签
    spec:
      containers:
      - name: nginx
        image: nginx:1.25
```

**② 和 ③ 必须匹配！这是铁律。** 为什么？

```
Deployment Controller 的工作循环：

while true:
    实际Pod数 = 根据选择器②(selector) 找标签=app:nginx 的 Pod
    if 实际Pod数 < replicas:
        用模板③(template) 创建新 Pod
    if 实际Pod数 > replicas:
        删除多余的 Pod
    sleep(一会儿)

如果 ② 和 ③ 不匹配会怎样？
  → Deployment 用 app:nginx 去找 Pod
  → 但新创建的 Pod 标签是 app:web（不匹配）
  → Deployment 找不到自己创建的 Pod！
  → 会无限创建 Pod，永远觉得"不够"
  → 所以 K8S 直接拒绝这种配置（API Server 校验）
```

#### selector 是怎么工作的？（标签选择器机制）

标签（Label） = 附加在资源上的键值对，用于分组和筛选。

```yaml
# Pod 上的标签
metadata:
  labels:
    app: nginx          # key: app, value: nginx
    tier: frontend
    env: production

# Deployment 用 selector 找这些 Pod
spec:
  selector:
    matchLabels:         # 精确匹配：标签必须完全一致
      app: nginx
    # matchExpressions:  # 表达式匹配（高级用法）
    #   - key: tier
    #     operator: In
    #     values: ["frontend", "backend"]
```

**selector 的工作过程**：
```
集群中所有 Pod:
  Pod-A  labels: {app: nginx, tier: frontend}      ✅ 匹配 app=nginx
  Pod-B  labels: {app: redis, tier: cache}          ❌ 不匹配
  Pod-C  labels: {app: nginx, env: production}      ✅ 匹配 app=nginx
  Pod-D  labels: {app: nginx, tier: backend}       ✅ 匹配 app=nginx

selector: matchLabels: {app: nginx}
→ 匹配到 Pod-A, Pod-C, Pod-D → 这些就是"我的 Pod"
```

> **类比**：selector 是"招聘条件"（要 app=nginx），labels 是"简历标签"。Deployment 根据招聘条件筛所有 Pod 的简历，匹配的就是自己管的。

#### Pod 什么时候"独立"，什么时候"被隐含"？

| 场景 | Pod 的存在形式 | 你需要写什么 | 谁管 Pod 的生命周期 |
|------|--------------|------------|-----------------|
| **临时调试** | 独立 Pod | `kind: Pod` YAML | **没人管**，挂了就没了 |
| **部署 Web 服务** | 被 Deployment 管理 | `kind: Deployment` YAML（内含 template） | **Deployment 管**，自动重启/扩缩/更新 |
| **部署 MySQL** | 被 StatefulSet 管理 | `kind: StatefulSet` YAML | **StatefulSet 管** |
| **部署日志 Agent** | 被 DaemonSet 管理 | `kind: DaemonSet` YAML | **DaemonSet 管** |
| **运行一次性任务** | 被 Job 管理 | `kind: Job` YAML | **Job 管** |

**面试回答模板**：
> "Pod 是 K8S 的最小运行单元。绝大多数情况下我们不会直接创建 Pod，而是通过 Deployment 等工作负载来间接管理。Deployment 的 `template` 字段就是 Pod 的定义模板，Deployment Controller 会根据这个模板自动创建和管理 Pod。Deployment 通过 `selector` 标签选择器来识别哪些 Pod 是自己管理的。"

#### 独立 Pod vs Deployment 管理 Pod 的完整对比

```yaml
# ====== 方式一：独立 Pod（你手动管理一切） ======
apiVersion: v1
kind: Pod
metadata:
  name: my-nginx              # 直接给 Pod 起名
  labels:
    app: nginx
spec:
  containers:
  - name: nginx
    image: nginx:1.25
    ports:
    - containerPort: 80
# 问题：
#   ❌ Pod 挂了没人重启
#   ❌ 只能运行 1 个实例
#   ❌ 没有滚动更新
#   ❌ 手动扩缩（不可能）

# ====== 方式二：Deployment（K8S 帮你管一切） ======
apiVersion: apps/v1
kind: Deployment
metadata:
  name: nginx-deployment      # Deployment 的名字（不是 Pod 的）
spec:
  replicas: 3                  # 要 3 个 Pod（不是 1 个！）
  selector:                    # 用标签找"我的 Pod"
    matchLabels:
      app: nginx
  template:                    # ⭐ Pod 模板（和上面的 Pod YAML 的 spec 基本一样）
    metadata:
      labels:
        app: nginx             # Pod 的标签（必须匹配 selector）
    spec:
      containers:
      - name: nginx
        image: nginx:1.25
        ports:
        - containerPort: 80
# 优势：
#   ✅ Pod 挂了自动重建
#   ✅ 自动维护 3 个副本
#   ✅ 滚动更新 nginx:1.25 → nginx:1.26
#   ✅ kubectl scale 一条命令扩缩
```

#### Deployment 创建 Pod 的完整过程

```
你执行 kubectl apply -f deployment.yaml
         │
         ▼
┌──────────────────────────────────────────────────────────────┐
│ 1. API Server 保存 Deployment 对象到 etcd                     │
│                                                               │
│ 2. Deployment Controller (Master 上的控制循环) 发现:            │
│    "有人创建了一个 replicas=3 的 Deployment"                   │
│    "selector 要求 app=nginx 的 Pod"                            │
│    "当前 0 个 Pod 匹配"                                       │
│    "差 3 个，我来创建！"                                       │
│                                                               │
│ 3. Deployment Controller 自动创建一个 ReplicaSet               │
│    (ReplicaSet 是 Deployment 的中间层，通常不直接操作)           │
│                                                               │
│ 4. ReplicaSet Controller 根据 template 创建 3 个 Pod           │
│    → Pod 名自动生成: nginx-deployment-abc1234-5xyz             │
│    → Pod 自动打上 template.metadata.labels                      │
│                                                               │
│ 5. Scheduler 调度 Pod 到具体的 Node                           │
│                                                               │
│ 6. kubelet 在 Node 上拉取镜像、启动容器                         │
│                                                               │
│ 7. 你执行 kubectl get pods 看到的是这 3 个 Pod，               │
│    不是 Deployment 本身                                        │
└──────────────────────────────────────────────────────────────┘

实际层级关系：
Deployment
  └── ReplicaSet (自动创建，通常不直接操作)
       └── Pod (实际运行的)
       └── Pod
       └── Pod
```

#### 一句话总结 Deployment 和 Pod 的关系

> **Deployment 是"图纸+管理者"，Pod 是"产品"。Deployment 的 `template` 是生产 Pod 的模具，`selector` 是质检标准（通过标签检查产品是否合格），`replicas` 是产量要求。K8S 的 Controller 就是工厂，不断检查实际产量是否达标。**

### 2.4 Pod YAML 核心字段（必背）

下面是独立 Pod 的完整 YAML，注意：**Deployment 的 `template` 部分（`template.metadata` + `template.spec`）和这个 Pod YAML 的结构几乎完全一样**。

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: my-app
  labels:                    # 标签：用于选择器匹配
    app: my-app
    env: production
  annotations:               # 注解：存储元数据，不可用于选择
    description: "Main application pod"
spec:                        # ← 这部分和 Deployment 的 template.spec 完全一样
  containers:
  - name: app
    image: nginx:1.25         # 镜像
    imagePullPolicy: IfNotPresent  # Always/Never/IfNotPresent
    ports:
    - containerPort: 80
    env:                      # 环境变量
    - name: DB_HOST
      value: "mysql-service"
    resources:                # 资源限制（⭐面试高频）
      requests:               # 调度依据（保证最少给这么多）
        cpu: "100m"           # 100 millicore = 0.1 核
        memory: "128Mi"
      limits:                 # 硬限制（超过会 OOM Kill / CPU 限流）
        cpu: "500m"
        memory: "256Mi"
    livenessProbe:            # 存活探针：挂了就重启容器
      httpGet:
        path: /healthz
        port: 80
      initialDelaySeconds: 10 # 首次探测延迟
      periodSeconds: 5        # 探测间隔
    readinessProbe:           # 就绪探针：没准备好就不接入流量
      httpGet:
        path: /ready
        port: 80
      initialDelaySeconds: 5
      periodSeconds: 3
  restartPolicy: Always       # Always/OnFailure/Never
```

### 2.5 探针类型（面试必考）

| 探针 | 作用 | 失败后果 |
|------|------|---------|
| **livenessProbe** | 容器是否存活 | 重启容器 |
| **readinessProbe** | 是否可以接收流量 | 从 Service Endpoints 中移除 |
| **startupProbe** | 容器是否启动完成 | 未通过则 liveness/readiness 不生效 |

三种探测方式：
```yaml
# 1. HTTP 探测
livenessProbe:
  httpGet:
    path: /healthz
    port: 8080

# 2. TCP 探测
livenessProbe:
  tcpSocket:
    port: 3306

# 3. 命令探测
livenessProbe:
  exec:
    command:
    - cat
    - /tmp/healthy
```

### 2.6 工作负载类型对比

| 类型 | 使用场景 | 特点 | restartPolicy |
|------|---------|------|---------------|
| **Deployment** | 无状态应用（Web服务、API） | 滚动更新、回滚、扩缩容 | Always |
| **StatefulSet** | 有状态应用（数据库、MQ） | 稳定网络标识、有序部署/删除、持久存储 | Always |
| **DaemonSet** | 每个节点运行一个（日志收集、监控） | 新节点自动加入，节点删除自动清理 | Always |
| **Job** | 一次性任务（数据处理、ML训练、迁移脚本） | 运行到完成即退出，支持并行/重试/超时 | Never / OnFailure |
| **CronJob** | 定时任务（备份、报表、清理） | Cron 表达式调度，管理 Job 的生命周期 | Never / OnFailure |

> **⭐ 关键区别**：Deployment 的 Pod 退出后会被重建（维持副本数），Job 的 Pod 完成后不会重建。这就是 `restartPolicy` 必须设为 `Never` 或 `OnFailure` 的原因——告诉 kubelet 任务完成就不再重启。

**ECS → K8S 迁移参考：**
| AWS ECS | K8S 对应 | 补充工具 |
|---------|---------|---------|
| ECS Service | Deployment | — |
| ECS Task（一次性） | Job | — |
| ECS Task + SQS Trigger | Job + KEDA ScaledJob | KEDA（见 2.9 节） |
| ECS Scheduled Task | CronJob | — |

### 2.7 Deployment YAML 详解（最重要的资源）

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: nginx-deployment
  labels:
    app: nginx
spec:
  replicas: 3                    # 副本数
  selector:                      # ⭐ 必须！选择器匹配 Pod
    matchLabels:
      app: nginx
  strategy:                      # 更新策略
    type: RollingUpdate           # RollingUpdate / Recreate
    rollingUpdate:
      maxSurge: 1                 # 滚动更新时最多多出几个 Pod
      maxUnavailable: 0           # 滚动更新时最多不可用几个 Pod
  template:                      # Pod 模板（和 Pod YAML 的 spec 部分一样）
    metadata:
      labels:
        app: nginx               # ⭐ 必须和 selector.matchLabels 匹配！
    spec:
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
```

**面试考点：RollingUpdate 策略**
```
旧版本: [Pod1] [Pod2] [Pod3]
                  ↓
新版本: [Pod1] [Pod2] [Pod3-new]  ← maxSurge=1, maxUnavailable=0
                  ↓
        [Pod1] [Pod2-new] [Pod3-new]
                  ↓
        [Pod1-new] [Pod2-new] [Pod3-new]  ← 完成
```

### 2.8 Job 与 CronJob 深度讲解（批处理任务）

> **类比 AWS ECS**：如果你在 AWS 上用 ECS Task 运行一次性的 heavy 任务，K8S 的 `Job` 就是对等概念。每个 Job 会起一个独立容器，运行完自动退出并可以自动清理。

#### Job 核心概念

Job 负责管理"运行到完成"的任务，与 Deployment 的核心区别：

| 对比项 | Deployment | Job |
|--------|-----------|-----|
| 目的 | 持续运行的服务 | 运行到完成的任务 |
| Pod 退出后 | 自动重建（保持副本数） | 不重建（任务完成） |
| `restartPolicy` | Always | Never 或 OnFailure |
| 使用场景 | Web 服务、API | 数据处理、ML 训练、迁移脚本 |

#### Job YAML 完整示例

```yaml
apiVersion: batch/v1
kind: Job
metadata:
  name: data-process-job
  namespace: default
spec:
  # ===== 核心控制字段 =====
  completions: 1          # 需要成功完成的 Pod 数量（默认 1）
  parallelism: 1          # 同时运行的 Pod 数量（默认 1）
  backoffLimit: 3         # 失败重试次数（超过后 Job 标记为失败）
  activeDeadlineSeconds: 600  # 整个 Job 的超时时间（秒）
  ttlSecondsAfterFinished: 300  # 完成后 5 分钟自动清理（包括 Pod 日志）

  # ===== Pod 模板 =====
  template:
    metadata:
      labels:
        app: data-processor
        job-type: batch
    spec:
      restartPolicy: Never  # ⭐ Job 中必须设为 Never 或 OnFailure
      containers:
      - name: worker
        image: python:3.11
        command: ["python", "/app/process.py"]
        env:
        - name: TASK_ID
          value: "job-20260401-001"
        - name: INPUT_BUCKET
          value: "s3://my-bucket/input/"
        resources:
          requests:
            cpu: "2"         # 重型任务申请足够资源
            memory: "4Gi"
          limits:
            cpu: "4"
            memory: "8Gi"
        volumeMounts:
        - name: workdir
          mountPath: /tmp/work
      volumes:
      - name: workdir
        emptyDir: {}
```

#### restartPolicy 的选择

```
restartPolicy: Never
  - Pod 失败 → 启动新的 Pod（不复用）
  - 直到 backoffLimit 次失败后，Job 标记为 Failed
  - 适合：幂等任务、需要干净环境的任务

restartPolicy: OnFailure
  - Pod 失败 → 在同一个 Pod 内重启容器
  - 适合：轻量级任务、希望复用环境的任务
```

#### 并行 Job 模式（处理大量任务）

**模式一：固定完成数（completions > parallelism）**
```yaml
spec:
  completions: 10   # 总共要完成 10 个任务
  parallelism: 3    # 每次并行 3 个 Pod
  # K8S 自动调度：先起 3 个，某个完成后立刻补一个，直到完成 10 个
```

**模式二：WorkQueue 模式（消费队列）**
```yaml
spec:
  completions: 10
  parallelism: 5
  completionMode: Indexed  # ⭐ 每个 Pod 有唯一的 JOB_COMPLETION_INDEX 环境变量
  # Pod 0 → 处理任务 0
  # Pod 1 → 处理任务 1
  # ...
```
Pod 内通过 `$JOB_COMPLETION_INDEX` 知道自己该处理哪个分片：
```python
import os
shard_id = int(os.environ["JOB_COMPLETION_INDEX"])
# 从队列或存储中取第 shard_id 个任务
```

#### 动态创建 Job（程序化触发）

这是与 ECS `RunTask` 最接近的模式：你的调度服务通过 K8S API 动态创建 Job：

```python
# Python 示例（使用 kubernetes client-go 的 Python 版）
from kubernetes import client, config

config.load_incluster_config()  # 在 K8S 内部运行时
# config.load_kube_config()    # 本地调试时

batch_v1 = client.BatchV1Api()

def create_task_job(task_id: str, input_data: str):
    job = client.V1Job(
        api_version="batch/v1",
        kind="Job",
        metadata=client.V1ObjectMeta(
            name=f"task-{task_id}",
            labels={"task-id": task_id}
        ),
        spec=client.V1JobSpec(
            ttl_seconds_after_finished=300,
            backoff_limit=3,
            template=client.V1PodTemplateSpec(
                spec=client.V1PodSpec(
                    restart_policy="Never",
                    containers=[client.V1Container(
                        name="worker",
                        image="your-worker:latest",
                        env=[client.V1EnvVar(name="TASK_ID", value=task_id),
                             client.V1EnvVar(name="INPUT", value=input_data)]
                    )]
                )
            )
        )
    )
    batch_v1.create_namespaced_job(namespace="default", body=job)
```

#### CronJob（定时任务）

```yaml
apiVersion: batch/v1
kind: CronJob
metadata:
  name: daily-report
spec:
  schedule: "0 2 * * *"          # 每天凌晨 2 点（Cron 表达式）
  concurrencyPolicy: Forbid       # Forbid(禁止并发) / Allow / Replace
  successfulJobsHistoryLimit: 3   # 保留最近 3 个成功的 Job 记录
  failedJobsHistoryLimit: 1       # 保留最近 1 个失败的 Job 记录
  startingDeadlineSeconds: 60     # 错过触发时间后 60 秒内还允许补跑
  jobTemplate:
    spec:
      template:
        spec:
          restartPolicy: OnFailure
          containers:
          - name: reporter
            image: your-reporter:latest
            command: ["python", "generate_report.py"]
```

**Cron 表达式速查：**
```
┌───────────── 分钟 (0-59)
│ ┌───────────── 小时 (0-23)
│ │ ┌───────────── 日 (1-31)
│ │ │ ┌───────────── 月 (1-12)
│ │ │ │ ┌───────────── 星期几 (0-6, 0=周日)
│ │ │ │ │
* * * * *

0 2 * * *      每天凌晨 2 点
*/15 * * * *   每 15 分钟
0 9 * * 1      每周一上午 9 点
0 0 1 * *      每月 1 号零点
```

---

### 2.9 任务调度架构：一任务一容器的正确姿势

> **核心问题**：业务系统发起一个重型任务，需要为它独立起一个容器运行。CPU/内存 Auto Scaling（HPA）解决不了这个问题，业务系统也不应该直接调 K8S API。那正确的架构是什么？

#### 为什么 HPA 解决不了这个问题

这是一个常见的认知误区，必须澄清：

| 维度 | HPA（水平 Pod 自动伸缩） | 任务级伸缩 |
|------|----------------------|----------|
| **伸缩对象** | 扩/缩 Deployment 的**副本数** | 为每个任务**独立创建**一个 Pod |
| **触发条件** | CPU/内存使用率超过阈值 | 有新任务进队列 |
| **Pod 生命周期** | Pod 持续运行，处理多个请求 | Pod 处理完一个任务后退出 |
| **任务隔离** | 多个任务共享同一批 Pod | 每个任务有自己独占的 Pod |
| **适用场景** | Web 服务、无状态 API | ML 训练、视频转码、数据处理 |

**HPA 的本质**：你有 3 个 Worker Pod，CPU 高了变成 6 个——但这 6 个 Pod 仍然是竞争同一个队列，没有"任务和容器 1:1 绑定"的概念。

**一任务一容器的本质**：不是扩副本，而是**动态创建 Job**——每个 Job 有自己独立的环境、资源、生命周期，完成后自动销毁。

---

#### 架构分层原则：业务系统不应直接调 K8S API

```
❌ 错误做法（强耦合）：
业务系统 ──直接调用──▶ K8S API ──▶ 创建 Job

✅ 正确做法（解耦）：
业务系统 ──写入──▶ 消息队列 / 数据库 ──▶ 调度层 ──▶ K8S API ──▶ 创建 Job
```

**为什么业务系统不能直接调 K8S API？**
1. **职责混乱**：业务系统需要知道 K8S 集群地址、ServiceAccount 权限、Job YAML 结构——把基础设施细节泄漏到业务层
2. **强依赖**：K8S 集群迁移、升级，业务系统跟着改
3. **权限风险**：给业务系统 K8S API 权限，意味着一旦业务系统被攻破，集群暴露
4. **可观测性差**：任务状态分散在 K8S Event 里，业务侧看不到

---

#### 三种架构模式

根据业务系统的交互方式，有三种成熟方案：

---

##### 模式 A：消息队列 + KEDA ScaledJob（推荐，消息队列场景）

```
业务系统 ──写消息──▶ SQS/Kafka/Redis ──▶ KEDA 监听 ──▶ 自动创建 Job ──▶ 任务 Pod
                                           ↑
                               （K8S 集群内的 KEDA 组件，
                                业务系统完全无感 K8S）
```

**KEDA 是 CNCF 项目，本质是 K8S 集群内的一个 Controller**，它盯着外部队列的深度，自动帮你创建/销毁 Job。业务系统只写队列，和 K8S 零耦合。

**安装 KEDA：**
```bash
helm repo add kedacore https://kedacore.github.io/charts
helm install keda kedacore/keda --namespace keda --create-namespace
```

**ScaledJob 配置（SQS 示例）：**
```yaml
apiVersion: keda.sh/v1alpha1
kind: ScaledJob
metadata:
  name: heavy-task-scaledjob
  namespace: default
spec:
  # ===== Job 模板 =====
  jobTargetRef:
    template:
      spec:
        restartPolicy: Never
        containers:
        - name: worker
          image: your-heavy-worker:latest
          env:
          - name: AWS_REGION
            value: "ap-east-1"
          resources:
            requests:
              cpu: "4"
              memory: "8Gi"
            limits:
              cpu: "8"
              memory: "16Gi"

  # ===== 扩缩策略 =====
  pollingInterval: 5          # 每 5 秒检查队列
  maxReplicaCount: 20         # 最大并发 Job 数
  scalingStrategy:
    strategy: "accurate"      # 队列 N 条消息 → 起 N 个 Job

  # ===== 触发器（SQS）=====
  triggers:
  - type: aws-sqs-queue
    metadata:
      queueURL: https://sqs.ap-east-1.amazonaws.com/123/task-queue
      queueLength: "1"        # 1 条消息 = 1 个 Job
      awsRegion: "ap-east-1"
    authenticationRef:
      name: keda-aws-creds
---
# AWS 认证
apiVersion: keda.sh/v1alpha1
kind: TriggerAuthentication
metadata:
  name: keda-aws-creds
spec:
  secretTargetRef:
  - parameter: awsAccessKeyID
    name: aws-secret
    key: AWS_ACCESS_KEY_ID
  - parameter: awsSecretAccessKey
    name: aws-secret
    key: AWS_SECRET_ACCESS_KEY
```

**其他常用触发源：**
```yaml
# Kafka（按 consumer lag 触发）
- type: kafka
  metadata:
    bootstrapServers: kafka:9092
    consumerGroup: heavy-task-group
    topic: heavy-tasks
    lagThreshold: "1"         # lag 每增加 1 → 起 1 个 Job

# Redis List
- type: redis
  metadata:
    address: redis:6379
    listName: task-queue
    listLength: "1"

# RabbitMQ
- type: rabbitmq
  metadata:
    host: amqp://user:pass@rabbitmq:5672/
    queueName: heavy-tasks
    queueLength: "1"
```

---

##### 模式 B：Dispatcher 服务（推荐，数据库记录场景）

业务系统只写一行数据库记录（如 `status=pending`），由一个专职的 **Dispatcher 微服务**轮询 DB，发现新任务后调用 K8S API 创建 Job，并负责维护任务状态回写。

```
业务系统 ──INSERT──▶ tasks 表 (status=pending)
                          ↓
                   Dispatcher 服务（K8S 内的一个 Deployment）
                   ├── 轮询 DB，发现 pending 任务
                   ├── 调用 K8S API 创建 Job
                   ├── 更新 tasks 表 status=running
                   └── 监听 Job 完成事件，回写 status=done/failed
                          ↓
                       Job Pod（处理任务）
                          ↓
                   任务完成，向 DB 写入结果
```

**Dispatcher 实现思路（Python 伪代码）：**
```python
# dispatcher.py —— 作为 K8S Deployment 运行，有 K8S API 权限
import time
from kubernetes import client, config
from db import get_pending_tasks, update_task_status

config.load_incluster_config()   # 在 K8S 内自动加载 ServiceAccount 权限
batch_v1 = client.BatchV1Api()

def dispatch_loop():
    while True:
        tasks = get_pending_tasks(limit=10)   # 每次取最多 10 个待处理任务
        for task in tasks:
            # 防止重复调度：先更新状态，再创建 Job（乐观锁）
            updated = update_task_status(task.id, 
                                         old_status="pending", 
                                         new_status="dispatching")
            if not updated:
                continue  # 已被其他 Dispatcher 实例抢走，跳过

            job = build_job(task)
            try:
                batch_v1.create_namespaced_job("default", job)
                update_task_status(task.id, "dispatching", "running",
                                   job_name=f"task-{task.id}")
            except Exception as e:
                update_task_status(task.id, "dispatching", "pending")  # 回滚

        time.sleep(3)   # 轮询间隔 3 秒

def build_job(task):
    return client.V1Job(
        metadata=client.V1ObjectMeta(name=f"task-{task.id}"),
        spec=client.V1JobSpec(
            ttl_seconds_after_finished=300,
            backoff_limit=2,
            template=client.V1PodTemplateSpec(
                spec=client.V1PodSpec(
                    restart_policy="Never",
                    containers=[client.V1Container(
                        name="worker",
                        image="your-worker:latest",
                        env=[
                            client.V1EnvVar("TASK_ID", task.id),
                            client.V1EnvVar("DB_URL", task.db_url),
                        ],
                        resources=client.V1ResourceRequirements(
                            requests={"cpu": "2", "memory": "4Gi"},
                            limits={"cpu": "4", "memory": "8Gi"},
                        )
                    )]
                )
            )
        )
    )
```

**Dispatcher 的 ServiceAccount 配置（最小权限原则）：**
```yaml
apiVersion: v1
kind: ServiceAccount
metadata:
  name: task-dispatcher
  namespace: default
---
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  name: job-creator
  namespace: default
rules:
- apiGroups: ["batch"]
  resources: ["jobs"]
  verbs: ["create", "get", "list", "watch", "delete"]
---
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  name: dispatcher-job-creator
  namespace: default
subjects:
- kind: ServiceAccount
  name: task-dispatcher
roleRef:
  kind: Role
  name: job-creator
  apiGroup: rbac.authorization.k8s.io
---
# Dispatcher Deployment
apiVersion: apps/v1
kind: Deployment
metadata:
  name: task-dispatcher
spec:
  replicas: 1           # 通常单副本避免重复调度（或用选主机制）
  selector:
    matchLabels:
      app: task-dispatcher
  template:
    metadata:
      labels:
        app: task-dispatcher
    spec:
      serviceAccountName: task-dispatcher    # ⭐ 绑定最小权限 SA
      containers:
      - name: dispatcher
        image: your-dispatcher:latest
        resources:
          requests:
            cpu: "100m"
            memory: "128Mi"
```

> **注意**：Dispatcher 通常只跑一个副本。如果需要高可用多副本，任务状态更新必须使用**乐观锁**（如上方的 `old_status=pending` 条件更新）或**分布式锁**，防止同一任务被多个 Dispatcher 重复调度。

---

##### 模式 C：Argo Workflows（复杂 DAG 工作流场景）

当任务有依赖关系（步骤 A 完成后才能执行步骤 B/C，或者需要分支、并行、重试逻辑），推荐 **Argo Workflows**。

```
业务系统 ──提交 Workflow 定义──▶ Argo Server（K8S 内）──▶ 按 DAG 顺序创建 Pod
```

```yaml
# 示例：视频处理 Workflow（下载 → 转码 → 上传，可并行多路转码）
apiVersion: argoproj.io/v1alpha1
kind: Workflow
metadata:
  generateName: video-process-
spec:
  entrypoint: video-pipeline
  templates:
  - name: video-pipeline
    dag:
      tasks:
      - name: download
        template: download-step
      - name: transcode-hd
        dependencies: [download]   # 依赖 download 完成
        template: transcode-step
        arguments:
          parameters: [{name: quality, value: "1080p"}]
      - name: transcode-sd
        dependencies: [download]   # 和 transcode-hd 并行
        template: transcode-step
        arguments:
          parameters: [{name: quality, value: "480p"}]
      - name: upload
        dependencies: [transcode-hd, transcode-sd]  # 等两路都完成
        template: upload-step

  - name: download-step
    container:
      image: downloader:latest
      resources:
        requests: {cpu: "1", memory: "2Gi"}

  - name: transcode-step
    inputs:
      parameters: [{name: quality}]
    container:
      image: ffmpeg:latest
      command: ["ffmpeg", "-i", "input.mp4", "-q:v", "{{inputs.parameters.quality}}", "output.mp4"]
      resources:
        requests: {cpu: "4", memory: "8Gi"}

  - name: upload-step
    container:
      image: uploader:latest
```

---

#### 方案选择指南

| 业务系统的动作 | 推荐方案 | 核心优势 |
|---|---|---|
| 往 **SQS/Kafka/RabbitMQ/Redis** 写一条消息 | **KEDA ScaledJob** | 零代码调度，K8S 原生，业务完全解耦 |
| 往 **数据库** 写一行记录（status=pending） | **Dispatcher 服务** | 灵活、可定制，状态双向同步 |
| 触发**多步骤有依赖**的任务链 | **Argo Workflows** | DAG 编排，可视化，内置重试/超时 |
| **定时触发**（不需要外部触发） | **CronJob** | K8S 原生，无需额外组件 |

> **架构原则总结**：业务系统只负责**表达意图**（写队列 / 写 DB），调度层负责**如何实现**（什么时候起 Pod、起几个、用多少资源）。这两层的职责必须清晰分离。

---

### 2.10 常用 kubectl 命令速查

```bash
# 查看资源
kubectl get pods -n k8s-training
kubectl get deployment -n k8s-training
kubectl get all -n k8s-training

# 查看详情
kubectl describe pod <pod-name> -n k8s-training
kubectl logs <pod-name> -n k8s-training
kubectl logs -f <pod-name> -n k8s-training    # 实时日志

# 部署
kubectl apply -f deployment.yaml
kubectl delete -f deployment.yaml

# 扩缩
kubectl scale deployment nginx --replicas=5 -n k8s-training

# 滚动更新
kubectl set image deployment/nginx nginx=nginx:1.26 -n k8s-training

# 回滚
kubectl rollout status deployment/nginx -n k8s-training   # 查看更新状态
kubectl rollout history deployment/nginx -n k8s-training   # 查看历史
kubectl rollout undo deployment/nginx -n k8s-training      # 回滚到上一版本

# 进入容器
kubectl exec -it <pod-name> -- /bin/bash -n k8s-training

# 端口转发（调试用）
kubectl port-forward svc/nginx 8080:80 -n k8s-training
```

---

## 📝 习题

### 选择题

**Q1.** Pod 中多个容器共享什么？
- A) CPU 和内存
- B) 网络命名空间和存储卷
- C) 环境变量
- D) 以上全部

**Q2.** livenessProbe 和 readinessProbe 的区别是？
- A) 没有区别
- B) livenessProbe 失败重启容器，readinessProbe 失败移除流量
- C) readinessProbe 失败重启容器，livenessProbe 失败移除流量
- D) 只能用 HTTP 探测方式

**Q3.** 以下哪个适合使用 StatefulSet 部署？
- A) Nginx Web 服务
- B) Spring Boot API
- C) MySQL 主从集群
- D) 日志收集 Agent

**Q4.** Deployment 的 `maxSurge: 1, maxUnavailable: 0` 含义是？
- A) 最多多出1个 Pod，最多0个不可用
- B) 最多多出1个不可用的 Pod
- C) 每次只更新1个 Pod
- D) 更新时不允许任何 Pod 停止

**Q5.** 资源限制中 `requests` 和 `limits` 的区别？
- A) 没有区别
- B) requests 是调度依据，limits 是运行时硬限制
- C) requests 是硬限制，limits 是调度依据
- D) requests 用于 CPU，limits 用于内存

### 简答题

**Q6.** Deployment YAML 中的 `selector.matchLabels` 和 `template.metadata.labels` 是什么关系？如果不匹配会怎样？

**Q7.** 如果你在集群中手动创建了一个标签为 `app: nginx` 的独立 Pod，它会不会被某个 Deployment 管理？为什么？

**Q8.** 请解释 DaemonSet 的使用场景，并举例说明。

**Q9.** 请描述 `kubectl rollout undo` 回滚的过程。

**Q10.** 直接创建 Pod（`kind: Pod`）和通过 Deployment 创建 Pod 有什么区别？分别适用于什么场景？

**Q11（⭐ 高频）** Job 中 `restartPolicy` 为什么必须设为 `Never` 或 `OnFailure`？`backoffLimit` 和 `activeDeadlineSeconds` 分别控制什么？

**Q12（⭐⭐ 架构题）** 业务系统有一个 heavy 任务，每个任务需要独立容器运行，CPU/内存很高。有人说"用 HPA 扩容就行了"，这个说法对吗？为什么？正确的做法是什么？

**Q13（⭐ 架构题）** 业务系统发起任务时，应该直接调用 K8S API 创建 Job 吗？如果不应该，中间应该有什么层？分别适用于什么场景（消息队列场景 vs 数据库记录场景）？

### 动手题

**Q11.** 请编写一个 Deployment YAML，要求：
- 3 副本
- 镜像：`nginx:1.25`
- 资源限制：CPU 100m~500m，内存 64Mi~256Mi
- HTTP 存活探针：路径 `/`，端口 80
- 标签：`app=nginx, tier=frontend`

---

## ✅ 参考答案

### A1. B) 网络命名空间和存储卷
同一 Pod 内的容器共享网络命名空间（相同 IP，通过 localhost 通信）和挂载的存储卷。CPU/内存是各自配置的。

### A2. B) livenessProbe 失败重启容器，readinessProbe 失败移除流量
- **livenessProbe**：容器"死了" → K8S 重启它
- **readinessProbe**：容器"还没准备好" → 从 Service 负载均衡中暂时移除，流量不会打到它

### A3. C) MySQL 主从集群
StatefulSet 提供稳定的网络标识（Pod 名称不变）和稳定的持久存储，适合有状态应用。Nginx/Spring Boot 用 Deployment，日志 Agent 用 DaemonSet。

### A4. A) 最多多出1个 Pod，最多0个不可用
`maxSurge: 1` = 更新过程中最多比期望多1个 Pod；`maxUnavailable: 0` = 更新过程中不允许任何 Pod 不可用。这是最保守的更新策略，保证零停机。

### A5. B) requests 是调度依据，limits 是运行时硬限制
- **requests**：Scheduler 调度 Pod 时参考，确保 Node 有足够剩余资源
- **limits**：运行时硬限制，CPU 超限会限流（throttle），内存超限会 OOM Kill

### A6. selector.matchLabels 和 template.metadata.labels 的关系

**必须匹配！** 这是 Deployment 工作机制的核心：

```
Deployment Controller 的工作循环：
1. 用 selector.matchLabels 去 K8S 里找所有匹配的 Pod
2. 数一下找到了几个
3. 如果少于 replicas → 用 template 创建新的 Pod（新 Pod 会自动打上 template.metadata.labels）
4. 如果多于 replicas → 删除多余的 Pod
5. 重复

如果 selector 和 template.labels 不匹配：
  → selector 说"我要找 app=nginx 的 Pod"
  → template 创建出来的 Pod 标签却是 app=web
  → Controller 找不到自己创建的 Pod（标签不匹配）
  → Controller 觉得"0 个 Pod，我想要 3 个"→ 再创建 3 个
  → 新的 3 个也不匹配 → 再创建 → 无限循环！
  → 所以 K8S API Server 直接在校验阶段拒绝这种配置
```

**简单记：selector 是"找人的条件"，template.labels 是"新人身上的标签"。条件和新人的标签必须一致，否则 Deployment 认不出自己创建的 Pod。**

### A7. 手动创建的 Pod 会不会被 Deployment 管理？

**会被！** 但不推荐这样做。

```
Deployment: selector = {app: nginx}, replicas = 3
你手动: kubectl apply -f pod.yaml  (labels: {app: nginx})

结果：
  Deployment Controller 发现集群中有 4 个 app=nginx 的 Pod
  但 replicas 只要求 3 个
  → Deployment 会删除"多余的"那个（可能是你手动创建的）
  → 你手动创建的 Pod 随时可能被 Deployment 清理掉！
```

**结论**：不要在 Deployment 管理的范围内手动创建标签匹配的 Pod，它会被当作"多余的副本"删掉。

### A8. DaemonSet 使用场景
DaemonSet 确保**每个（或特定的）Node 上都运行一个 Pod 副本**。常见场景：
- **日志收集**：Fluentd/Filebeat，每个节点收集日志
- **监控**：Prometheus Node Exporter，每个节点采集指标
- **网络插件**：Calico/Flannel 的 Agent
- **存储守护进程**：每个节点上的存储守护进程

新节点加入集群时，DaemonSet 自动在新节点上创建 Pod。

### A9. kubectl rollout undo 回滚过程
```
1. K8S 维护 Deployment 的 ControllerRevision（历史版本记录）
2. kubectl rollout undo 时，Controller 将旧版本的 Pod 模板恢复
3. 创建新的 ReplicaSet 使用旧版本模板
4. 滚动更新机制将当前 Pod 逐步替换为旧版本
5. 回滚过程和更新过程一样是渐进的

# 回滚到指定版本
kubectl rollout undo deployment/nginx --to-revision=2
```

### A10. 独立 Pod vs Deployment 管理 Pod

| 对比项 | 独立 Pod (`kind: Pod`) | Deployment 管理 Pod |
|--------|----------------------|-------------------|
| Pod 挂了 | 没人管，永久丢失 | 自动重建新 Pod |
| 副本数 | 永远只有 1 个 | replicas 控制，随意扩缩 |
| 更新 | 删了重建，有停机时间 | 滚动更新，零停机 |
| 你需要写 | 完整的 Pod YAML | Deployment YAML（内含 template） |
| 生命周期 | **你自己管** | **K8S 管你** |
| 适用场景 | 临时调试、一次性任务、CI 测试 | 生产部署的所有无状态应用 |

### A11. Job 的 restartPolicy 和控制字段

**为什么必须设 `Never` 或 `OnFailure`**：
Deployment 的默认 `restartPolicy: Always` 意味着"容器退出就重启"，这对长期服务是对的。但 Job 的容器正常退出（exit code 0）代表任务完成，不应该被重启。如果用 `Always`，任务完成后会被反复重启，变成死循环。

- `restartPolicy: Never`：失败时起新 Pod（日志保留在失败 Pod 上，便于排查）
- `restartPolicy: OnFailure`：失败时在原 Pod 重启容器（节省资源）

**`backoffLimit` vs `activeDeadlineSeconds`**：
| 字段 | 含义 | 区别 |
|------|------|------|
| `backoffLimit: 3` | 最多失败重试 3 次，超过则 Job 标为 Failed | 按**次数**限制 |
| `activeDeadlineSeconds: 600` | Job 整体超时 600 秒，超时则强制终止 | 按**时间**限制 |

两者可以同时设置，任意一个触发都会终止 Job。

### A12. HPA 能解决"一任务一容器"问题吗？

**不能，这是两个完全不同的维度。**

HPA 的本质是"扩 Deployment 的副本数"。假设你有 3 个 Worker Pod，CPU 高了 HPA 扩到 6 个——这 6 个 Pod 仍然是一个 Worker Pool，竞争同一个队列，没有任何任务隔离。

| | HPA | 任务级伸缩（Job per task）|
|--|-----|---|
| 扩容结果 | 更多 Worker Pod | 更多独立 Job |
| 任务隔离 | 无（多任务共享 Pod） | 完全隔离（1任务1Pod）|
| 触发条件 | CPU/内存使用率 | 队列消息数 / DB pending 记录数 |
| Pod 退出 | 异常（会被重建） | 正常（任务完成标志）|

**正确方案**：用 `Job`（而非 Deployment）承载任务，每个任务创建一个独立的 Job。

### A13. 业务系统应该直接调 K8S API 吗？

**不应该。** 原因：
1. 职责混乱：业务代码需要知道 K8S 集群地址、Job YAML 格式、ServiceAccount 权限
2. 强依赖：集群迁移时业务系统一起改
3. 权限风险：业务系统被攻破则集群暴露

**正确做法**：在业务系统和 K8S 之间加一个**调度层**，业务系统只表达意图。

| 业务系统的动作 | 调度层方案 |
|---|---|
| 往 **MQ（SQS/Kafka）** 写消息 | **KEDA ScaledJob**：监听队列，自动为每条消息创建 Job，业务完全无感知 K8S |
| 往 **数据库** 写 pending 记录 | **Dispatcher 服务**：专职微服务轮询 DB，发现 pending 任务后调 K8S API 创建 Job，并负责状态回写 |
| 复杂多步骤工作流 | **Argo Workflows**：业务提交 Workflow 定义，引擎负责按 DAG 调度 Pod |

架构原则：**业务系统表达意图（写队列/写DB），调度层决定如何实现（何时起Pod、起几个、资源多少）。**

### A14. Deployment YAML（原 A11）

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: nginx-deployment
  namespace: k8s-training
  labels:                     # ① Deployment 自身的标签（不影响 Pod 选择）
    app: nginx
    tier: frontend
spec:
  replicas: 3                 # 要维护 3 个 Pod 副本
  selector:                   # ② 选择器：用标签找"我管的 Pod"
    matchLabels:
      app: nginx               #    找标签包含 app=nginx 的 Pod
      tier: frontend
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1
      maxUnavailable: 0
  template:                   # ③⭐ Pod 模板：这就是"隐含的 Pod 定义"
    metadata:
      labels:                 # ④ 新 Pod 的标签（必须和 ② selector 匹配！）
        app: nginx
        tier: frontend        #    Deployment 用这个标签来认领自己创建的 Pod
    spec:                     # ⑤ 下面就是 Pod 的 spec，和独立 Pod YAML 的 spec 一模一样
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
        livenessProbe:
          httpGet:
            path: /
            port: 80
          initialDelaySeconds: 10
          periodSeconds: 5
# 部署后，kubectl get pods 会看到 3 个自动创建的 Pod：
#   nginx-deployment-abc1234-5xyz1
#   nginx-deployment-abc1234-5xyz2
#   nginx-deployment-abc1234-5xyz3
# 每个都自动带有 labels: {app: nginx, tier: frontend}
```

---

## 🔧 实操练习

```bash
export KUBECONFIG=~/.kube/sealos.yaml
kubectl create namespace k8s-training

# 部署 Nginx Deployment
kubectl apply -f - <<EOF
apiVersion: apps/v1
kind: Deployment
metadata:
  name: nginx-demo
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
      containers:
      - name: nginx
        image: nginx:1.25
        ports:
        - containerPort: 80
        resources:
          requests:
            cpu: "50m"
            memory: "32Mi"
          limits:
            cpu: "200m"
            memory: "128Mi"
EOF

# 观察 Pod 状态
kubectl get pods -n k8s-training -w

# 查看详情
kubectl describe deployment nginx-demo -n k8s-training

# 滚动更新（改版本）
kubectl set image deployment/nginx-demo nginx=nginx:1.26 -n k8s-training
kubectl rollout status deployment/nginx-demo -n k8s-training

# 回滚
kubectl rollout undo deployment/nginx-demo -n k8s-training

# 扩缩到 5 副本
kubectl scale deployment nginx-demo --replicas=5 -n k8s-training

# 查看日志
kubectl logs -l app=nginx -n k8s-training --tail=10

# ⚠️ 练习完清理！
kubectl delete namespace k8s-training
```

---

**上一章**：[第1章：K8S 核心概念与架构](./01-k8s-architecture.md) | **下一章**：[第3章：Service 与网络](./03-service-networking.md)
