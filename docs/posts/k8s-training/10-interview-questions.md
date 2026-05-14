# 第10章：K8S 面试高频题 + 答案模板

## 🎯 使用说明
- ⭐ = 必考题（每场面试几乎必问）
- 面试时按"核心概念 → 深入细节 → 实际经验"的结构回答
- 每道题都有【一句话回答】和【展开回答】，根据时间选择

---

## 一、K8S 架构篇

### ⭐ Q1: 请简述 Kubernetes 的架构

**一句话回答**：K8S 采用 Master-Worker 架构，Master 节点负责管理和调度（API Server、Scheduler、Controller Manager、etcd），Worker 节点运行容器（kubelet、kube-proxy）。

**展开回答**：
```
Master 节点（控制面）：
├── API Server    → 唯一入口，认证/授权/准入控制，所有组件通过它通信
├── etcd          → 分布式KV存储，保存集群所有状态数据
├── Scheduler     → 调度器，决定Pod运行在哪个Node
└── Controller Manager → 控制器管理器，维护集群状态（Deployment/Node等控制器）

Worker 节点（数据面）：
├── kubelet       → 每个Node上的代理，管理容器生命周期
└── kube-proxy    → 维护网络规则，实现Service负载均衡
```

**加分点**：提到"所有组件通过 API Server 通信而非直接访问 etcd"体现了对安全和解耦的理解。

---

### ⭐ Q2: Pod 从创建到运行的完整流程

**一句话回答**：kubectl → API Server（认证+写入etcd）→ Scheduler（调度）→ kubelet（创建容器）→ Running。

**展开回答**：
```
1. kubectl 发送请求到 API Server
2. API Server 进行认证、授权、准入控制
3. 将 Pod 配置写入 etcd（此时状态为 Pending）
4. Scheduler 通过 Watch 机制感知未绑定的 Pod
5. Scheduler 执行调度算法，选择最优 Node
6. 将绑定信息（nodeName）写入 etcd
7. 目标 Node 的 kubelet 感知到分配给自己的 Pod
8. kubelet 调用 CRI（容器运行时接口）拉取镜像
9. 创建容器，配置网络和存储
10. 执行健康检查，向 API Server 汇报状态
11. Pod 变为 Running
```

---

### Q3: etcd 挂了会怎样？

**回答要点**：
- Master 功能完全失效（无法创建/更新/删除资源）
- 已有 Pod 继续运行（kubelet 直接管理容器）
- 自愈、调度、扩缩等所有控制功能停止
- **类比**：etcd 是大脑，大脑罢工但手脚还能动

---

## 二、Pod 与工作负载篇

### ⭐ Q4: 什么是 Pod？为什么 K8S 不直接管理容器？

**一句话回答**：Pod 是 K8S 最小调度单元，包含一个或多个共享网络和存储的容器。

**为什么需要 Pod**：
1. 有些应用天然需要多个进程协作（如主容器 + 日志收集 sidecar）
2. 同 Pod 容器共享 IP 和端口空间，通过 localhost 通信
3. Pod 是调度的原子单位——同 Pod 的容器一定在同一 Node
4. 同 Pod 的容器共享存储卷（Volume）

---

### ⭐ Q5: livenessProbe、readinessProbe、startupProbe 的区别

**一句话回答**：liveness 探测"死了就重启"，readiness 探测"没准备好就不接流量"，startup 给慢启动应用缓冲时间。

```
livenessProbe（存活探针）：
  失败 → 重启容器
  场景：应用死锁、无限循环
  类比：心跳监测

readinessProbe（就绪探针）：
  失败 → 从 Service Endpoints 中移除（不接收流量）
  场景：应用启动中加载缓存、预热中
  类比：门面检查

startupProbe（启动探针）：
  存在时，前几次 liveness/readiness 失败不会触发动作
  场景：Java/Spring Boot 等启动慢的应用
  作用：给应用足够的启动时间
```

---

### ⭐ Q6: requests 和 limits 的区别

**一句话回答**：requests 是调度依据（保证最少给多少），limits 是运行时硬限制（最多能用多少）。

```
requests（请求值）：
  - Scheduler 调度 Pod 时参考，确保 Node 有足够剩余资源
  - Node 的可分配资源 = 总资源 - 已分配的 requests
  - 不设置 requests = 默认等于 limits

limits（限制值）：
  - CPU 超过 limits → 限流（throttle），不会 OOM
  - 内存超过 limits → OOM Kill 容器
  - 不设置 limits = 可以使用 Node 的所有剩余资源（危险！）

最佳实践：
  ✅ requests 和 limits 都设置
  ✅ requests ≤ limits
  ✅ CPU: limits / requests ≈ 2~4（允许突发）
  ✅ 内存: requests ≈ limits（避免 OOM）
```

---

### ⭐ Q7: Deployment、StatefulSet、DaemonSet 的区别

**一句话回答**：Deployment 无状态，StatefulSet 有状态，DaemonSet 每个节点一个。

| 特性 | Deployment | StatefulSet | DaemonSet |
|------|-----------|-------------|-----------|
| 场景 | Web、API | DB、MQ | 日志、监控 |
| Pod 名称 | 随机（*-abc123） | 固定有序（mysql-0,1,2） | 固定 |
| 网络标识 | 不稳定 | 稳定 DNS | 不稳定 |
| 存储共享 | 不保证 PVC 绑定 | 每个Pod独立PVC | 不需要 |
| 扩缩 | 随机并行 | 有序（逆序删除） | 不扩缩 |
| Headless SVC | 不需要 | 需要 | 不需要 |

---

## 三、Service 与网络篇

### ⭐ Q8: Service 的类型有哪些？

**回答**：
```
1. ClusterIP（默认）
   - 仅集群内部可访问
   - 用于微服务间通信
   - 分配虚拟IP，通过 kube-proxy（iptables/IPVS）负载均衡

2. NodePort
   - 每个Node开放端口（30000-32767）
   - 外部通过 NodeIP:NodePort 访问
   - 适合开发测试

3. LoadBalancer
   - 云厂商创建外部LB（AWS ELB/阿里云SLB）
   - 自动分配公网IP
   - 生产环境对外暴露服务

4. ExternalName
   - DNS级CNAME映射
   - 引用集群外服务
```

---

### ⭐ Q9: Pod 之间如何通信？

**回答**：
```
1. 同 Pod 内容器：通过 localhost（共享网络命名空间）
2. 同 Node Pod 间：通过 cni0 网桥（如 Calico 的虚拟网卡）
3. 跨 Node Pod 间：通过 CNI 插件的隧道或路由方案
   - Calico：BGP 路由（推荐）
   - Flannel：VXLAN 隧道
   - Cilium：eBPF（性能最优）

关键规则：
- 每个Pod都有独立IP
- Pod间通信不经过NAT
- 所有Node和所有Pod间可以直接通信
```

---

### Q10: Headless Service 是什么？什么场景用？

**回答**：
```
clusterIP: None，DNS直接返回Pod IP而不是ClusterIP。

使用场景：
1. StatefulSet：需要每个Pod有稳定独立的DNS记录
   mysql-0.mysql-headless → 10.244.1.5
   mysql-1.mysql-headless → 10.244.2.3

2. 自定义负载均衡：客户端自己选择连接哪个Pod
```

---

## 四、配置与存储篇

### ⭐ Q11: ConfigMap 和 Secret 的区别

**一句话回答**：ConfigMap 存非敏感配置（明文），Secret 存敏感信息（base64编码，但不是加密）。

```
ConfigMap：
  - 明文存储
  - 环境变量、配置文件
  - 例：DB地址、日志级别

Secret：
  - base64编码存储（注意：不是加密！）
  - 支持etcd加密（需要配置EncryptionConfiguration）
  - 需要严格RBAC控制
  - 例：密码、Token、证书
  - 特殊类型：dockerconfigjson（镜像仓库凭证）、tls（证书）

面试加分：提到 base64 不等于加密，生产用 Vault/External Secrets
```

---

### Q12: PV、PVC、StorageClass 的关系

**一句话回答**：StorageClass 定义存储类型，PVC 申请存储，PV 提供存储。动态供应时 PVC + StorageClass 自动创建 PV。

```
静态供应：
  管理员手动创建 PV → PVC 绑定 PV → Pod 使用 PVC

动态供应（推荐）：
  PVC 指定 StorageClass → Provisioner 自动创建 PV → Pod 使用 PVC

accessModes：
  - ReadWriteOnce (RWO): 单节点读写，最常用
  - ReadOnlyMany (ROX): 多节点只读
  - ReadWriteMany (RWX): 多节点读写（NFS等）

reclaimPolicy：
  - Retain: 保留数据，手动清理
  - Delete: 自动删除
```

---

## 五、Helm 篇

### ⭐ Q13: 什么是 Helm？有什么优势？

**一句话回答**：Helm 是 K8S 的包管理器，将多个 K8S 资源打包为一个 Chart，支持模板化配置、版本管理和一键部署。

```
核心优势：
1. 一条命令部署（vs kubectl apply 多个文件）
2. 模板化配置（values.yaml 参数化）
3. 多环境管理（values-dev.yaml / values-prod.yaml）
4. 内置升级/回滚（helm upgrade / rollback）
5. 版本历史（helm history）
6. 生态丰富（公共 Chart 仓库）

核心概念：
- Chart: K8S 应用的包（模板 + 默认值）
- Release: Chart 的一个运行实例
- Repository: Chart 仓库
- Values: 自定义配置值
```

---

## 六、调度与弹性伸缩篇（⭐ 新增）

### ⭐ Q14: nodeAffinity 和 podAffinity 的区别？

**一句话回答**：nodeAffinity 控制 Pod 和 Node 的关系（Pod 选择 Node），podAffinity 控制 Pod 和 Pod 的关系（Pod 靠近/远离其他 Pod）。

```
nodeAffinity（节点亲和性）：
  - 关注：Pod → Node
  - 基于：Node 的标签
  - 不需要 topologyKey
  - 场景：Pod 必须调度到 SSD Node / GPU Node

podAffinity / podAntiAffinity（Pod 亲和/反亲和）：
  - 关注：Pod → Pod
  - 基于：已有 Pod 的标签
  - 必须指定 topologyKey
  - 场景：前端靠近缓存 / API 副本分散部署（高可用）

topologyKey 常用值：
  - kubernetes.io/hostname → 同一 Node
  - topology.kubernetes.io/zone → 同一可用区

硬 vs 软：
  - required = 必须满足，不满足 Pending
  - preferred = 偏好满足，不满足也能调度
```

---

### ⭐ Q15: Taint（污点）和 Toleration（容忍度）是什么？

**一句话回答**：Taint 是 Node 上的排斥标记，Toleration 是 Pod 声明"我能容忍某些污点"。

```
三个 effect：
  NoSchedule     → 新 Pod 不调度（已有不受影响）
  PreferNoSchedule → 尽量不调度
  NoExecute      → 不调度 + 驱逐不匹配的已有 Pod

典型场景：
  - Master 节点隔离（默认有 control-plane:NoSchedule 污点）
  - GPU 专用节点（只有 GPU 任务能调度）
  - Node 故障自动驱逐（node.kubernetes.io/not-ready:NoExecute）

Taint vs nodeAffinity：
  - Taint = Node 排斥 Pod（"闲人免进"）
  - nodeAffinity = Pod 选择 Node（"我想进这房间"）
  - 两者可组合使用
```

---

### ⭐ Q16: HPA 的工作原理是什么？

**一句话回答**：HPA（Horizontal Pod Autoscaler）根据 Pod 的 CPU/内存等指标自动调整 Deployment 的副本数。

```
工作流程：
  1. Metrics Server 采集 Pod 的资源使用数据
  2. HPA Controller 每 15-30 秒检查
  3. 计算期望副本数 = ceil(当前指标总量 / 目标指标值)
  4. 调整 Deployment 的 replicas

前提条件：
  - 必须安装 Metrics Server
  - Pod 必须配置 resources.requests（HPA 基于此计算百分比）

扩缩行为控制（behavior）：
  scaleDown.stabilizationWindowSeconds → 缩容稳定窗口（避免抖动）
  scaleUp → 扩容策略

面试加分：
  - HPA 是"水平"扩缩（加减副本数），VPA 是"垂直"扩缩（调整 requests）
  - Cluster Autoscaler 是节点级别（加减 Node）
  - 三者组成完整的三级自动伸缩体系
```

---

## 七、安全篇（⭐ 新增）

### ⭐ Q17: RBAC 是什么？核心概念？

**一句话回答**：RBAC 是 K8S 的授权机制，通过 Role 定义权限、RoleBinding 绑定到主体（User/Group/ServiceAccount）。

```
四个核心对象：
  Role           → Namespace 级别权限规则
  ClusterRole    → 集群级别权限规则（也可被 RoleBinding 引用）
  RoleBinding    → 绑定 Role/ClusterRole 到主体（Namespace 内）
  ClusterRoleBinding → 绑定 ClusterRole 到主体（全集群）

主体（subjects）：
  User           → 外部用户
  Group          → 用户组
  ServiceAccount → Pod 的身份（最常用）

最佳实践：
  ✅ 每个应用创建独立 ServiceAccount
  ✅ 最小权限原则（只授予必要的 API 操作）
  ✅ Secret 访问权限单独控制
  ✅ 能用 RoleBinding 就不用 ClusterRoleBinding
```

---

### ⭐ Q17-A: RoleBinding 引用 ClusterRole 和 ClusterRoleBinding 有什么区别？

**一句话回答**：权限范围由 Binding 决定，不由 Role 决定。RoleBinding 无论引用 Role 还是 ClusterRole，都只在 RoleBinding 所在的 Namespace 生效。

```
三种组合方式：

① Role + RoleBinding（同 Namespace）
  作用范围：RoleBinding 所在 Namespace

② ClusterRole + RoleBinding（跨 NS 复用规则）
  作用范围：⭐ 仅 RoleBinding 所在 Namespace
  优点：ClusterRole 作为"规则模板"，避免每个 NS 重复定义相同的 Role

③ ClusterRole + ClusterRoleBinding（全集群）
  作用范围：整个集群

面试加分回答：
  "内置的 ClusterRole（如 view/edit/admin）就是利用这个机制复用的。
   给某个团队的 SA 授予某个 Namespace 的 edit 权限时，
   我会用 RoleBinding 引用内置 ClusterRole:edit，而非自己写 Role，
   这样既复用了内置权限规则，又不扩大到全集群。"
```

---

### ⭐ Q17-B: 写 Role 时如何确定 apiGroups 填什么？

**一句话回答**：用 `kubectl api-resources` 查资源所属的 API Version，取 `/` 前的部分就是 apiGroup。

```
核心速查表：
  apiGroups: [""]              → Pod、Service、ConfigMap、Secret、Node、
                                  PVC、Namespace、Endpoints、Events
  apiGroups: ["apps"]          → Deployment、StatefulSet、DaemonSet、ReplicaSet
  apiGroups: ["batch"]         → Job、CronJob
  apiGroups: ["autoscaling"]   → HorizontalPodAutoscaler
  apiGroups: ["networking.k8s.io"] → Ingress、NetworkPolicy
  apiGroups: ["rbac.authorization.k8s.io"] → Role、RoleBinding、
                                              ClusterRole、ClusterRoleBinding
  apiGroups: ["storage.k8s.io"]    → StorageClass

验证命令：
  kubectl api-resources | grep -E "^deployments"
  # NAME          SHORTNAMES  APIVERSION  NAMESPACED  KIND
  # deployments   deploy      apps/v1     true        Deployment
  #                           ↑
  #                           apiGroup = "apps"
```

---

### Q17-C: 子资源（subresource）权限是什么？常见的有哪些？

**一句话回答**：子资源是某个资源的特定操作入口，需要单独授权，格式为 `resources: ["父资源/子资源"]`。

```
常见子资源速查：
  pods/log         → kubectl logs（需要 get 权限）
  pods/exec        → kubectl exec（需要 create 权限）
  pods/portforward → kubectl port-forward（需要 create 权限）
  pods/status      → 更新 Pod 状态
  deployments/scale → kubectl scale（需要 update 权限）

错误示例（常见坑）：
  你授权了 pods 的 get 权限，但 kubectl logs 仍然报 403。
  原因：logs 是子资源，需要单独授权 pods/log。

正确配置：
  rules:
  - apiGroups: [""]
    resources: ["pods"]         # Pod 本体
    verbs: ["get", "list"]
  - apiGroups: [""]
    resources: ["pods/log"]     # 日志子资源（单独授权）
    verbs: ["get"]
  - apiGroups: [""]
    resources: ["pods/exec"]    # exec 子资源（单独授权）
    verbs: ["create"]
```

---

### Q17-D: 如何排查 RBAC 权限问题？

**一句话回答**：用 `kubectl auth can-i` 验证权限，用 `describe` 查找绑定关系。

```
排查步骤：

1. 确认报错类型
   Error: pods is forbidden: User "system:serviceaccount:ns:app-sa"
          cannot list resource "pods" in API group "" in the namespace "ns"

2. 验证权限
   kubectl auth can-i list pods \
     --as=system:serviceaccount:ns:app-sa -n ns
   # → no

3. 列出该 SA 的所有权限
   kubectl auth can-i --list \
     --as=system:serviceaccount:ns:app-sa -n ns

4. 找到所有绑定该 SA 的 RoleBinding
   kubectl get rolebindings,clusterrolebindings -A \
     -o wide | grep "app-sa"

5. 查看 Role/ClusterRole 的规则
   kubectl describe role <role-name> -n ns

6. 添加缺失权限
   kubectl edit role <role-name> -n ns
```

---

### Q18: NetworkPolicy 的作用？默认行为是什么？

**回答**：
```
作用：控制 Pod 之间的网络流量（入站 Ingress / 出站 Egress）

默认行为：
  - 没有任何 NetworkPolicy → 所有 Pod 之间网络完全互通

创建 NetworkPolicy 后：
  - 只影响匹配 podSelector 的 Pod
  - 只影响 policyTypes 中指定的方向（Ingress/Egress）
  - 规则是叠加的（多个 Policy 取并集）

注意：
  - 需要支持 NetworkPolicy 的 CNI（Calico、Cilium 支持，Flannel 不支持）
  - 限制出站时别忘了放行 DNS（UDP 53）
  - 推荐白名单模式：先 deny-all，再逐条允许
```

---

### Q19: Pod 安全最佳实践有哪些？

**回答**：
```
SecurityContext：
  ✅ runAsNonRoot: true          → 禁止 root 运行
  ✅ allowPrivilegeEscalation: false → 禁止提权
  ✅ readOnlyRootFilesystem: true    → 根文件系统只读
  ✅ drop ALL capabilities           → 丢弃所有 Linux capabilities
  ✅ seccompProfile: RuntimeDefault  → 系统调用过滤

PodSecurity Standards：
  - Baseline：基本安全（防止提权）
  - Restricted：严格安全（推荐生产使用）

镜像安全：
  ✅ 使用非 root 基础镜像
  ✅ 定期扫描镜像漏洞（Trivy）
  ✅ 使用最小化基础镜像（distroless/Alpine）
  ✅ 固定镜像 tag（不用 latest）

RBAC：
  ✅ 不使用 default ServiceAccount
  ✅ 每个 Pod 使用独立 SA
  ✅ 最小权限原则
```

---

## 八、实战场景篇

### ⭐ Q20: 如何实现零停机部署？

**回答**：
```
1. Deployment 滚动更新策略
   strategy:
     type: RollingUpdate
     rollingUpdate:
       maxSurge: 1          # 允许最多多1个Pod
       maxUnavailable: 0    # 不允许任何Pod不可用

2. readinessProbe 保护
   - 新Pod通过readinessProbe后才接入流量
   - 老Pod在新Pod就绪前继续服务

3. 优雅关闭
   - preStop hook: sleep 10（等待连接排空）
   - terminationGracePeriodSeconds: 30

4. Ingress/Service 层面
   - 多个版本并行运行
   - 金丝雀发布（Canary）

5. 健康检查端点
   - 确保应用真正就绪后才报告healthy
```

---

### ⭐ Q21: Pod 常见异常状态怎么排查？

**回答**：
```
通用排查公式：
  kubectl get pods        → 看状态
  kubectl describe pod    → 看 Events
  kubectl logs [--previous] → 看日志
  kubectl top pod         → 看资源

Pending → 资源不足 / 亲和性不满足 / PVC 未绑定
  → kubectl describe pod → Events: 0/N nodes available

CrashLoopBackOff → 应用崩溃反复重启
  → kubectl logs --previous（看上次崩溃日志）
  → kubectl describe pod → Last State.Terminated

ImagePullBackOff → 镜像拉取失败
  → kubectl describe pod → Events: Failed to pull image
  → 检查 imagePullSecrets

OOMKilled → 内存超限
  → kubectl describe pod → Last State: OOMKilled
  → 增大 limits.memory

Running 但 Not Ready → readinessProbe 未通过
  → 检查 readinessProbe 配置
  → 增加 initialDelaySeconds
  → 配置 startupProbe
```

---

### Q22: 如何进行容器资源调优？

**回答**：
```
1. 资源估算
   - 压测确定应用的实际需求
   - 使用 VPA（Vertical Pod Autoscaler）辅助推荐

2. CPU 建议
   - requests: 正常负载的 70-80%
   - limits: requests 的 2-4 倍
   - 利用 CPU 的可压缩性（超限只会限流，不会杀死）

3. 内存建议
   - requests ≈ limits（避免 OOM Kill）
   - 预留 20-30% buffer
   - 内存不可压缩，超限直接 OOM Kill

4. JVM 应用特别注意
   - -Xmx 应小于 limits.memory 的 80%
   - 留出堆外内存空间

5. 监控
   - 使用 Prometheus + Grafana 监控资源使用率
   - 设置 HPA（水平自动扩缩）
```

---

### Q23: K8S 中如何实现蓝绿部署和金丝雀发布？

**蓝绿部署**：
```
1. 部署 v2 Deployment（使用不同 label）
2. 更新 Service selector 指向 v2
3. 如果出问题，Service selector 切回 v1

特点：切换即时，但需要双倍资源
```

**金丝雀发布**（Canary）：
```
1. v2 Deployment 只有 1 个副本
2. 逐步增加 v2 比例（10% → 50% → 100%）
3. 观察错误率和性能指标
4. 有问题立即回滚

工具：Flagger、Argo Rollouts、Istio
```

---

## 九、进阶题

### Q24: K8S 的控制循环（Reconcile Loop）是什么？

**回答**：
```
控制循环是 K8S 控制器模式的核心：
1. 控制器观察（Watch）API Server 中的资源状态
2. 对比"期望状态"（YAML中定义）和"实际状态"（集群中真实的）
3. 如果不一致，执行动作使实际状态趋近期望状态
4. 循环重复

类比：恒温器——你设定 25°C（期望状态），恒温器不断检测室温（实际状态），低于 25°C 就开暖气。

每个控制器都有自己的控制循环：
- Deployment Controller：对比期望副本数 vs 实际 Pod 数
- Node Controller：监控 Node 健康状态
- Service Controller：维护 Endpoints
```

---

### Q25: Pod 一直处于 Pending，如何排查？

**回答**：
```
1. kubectl describe pod <name>
2. 查看 Events 部分：
   - "Insufficient cpu" → Node CPU 不足
   - "Insufficient memory" → Node 内存不足
   - "didn't match Pod's node affinity" → 亲和性不满足
   - "node(s) had taints that the pod didn't tolerate" → 污点不匹配
   - "persistentvolumeclaim not found/not bound" → PVC 问题

3. 逐一检查：
   → kubectl describe node → 看 Allocatable vs Capacity
   → kubectl get nodes --show-labels → 检查标签
   → kubectl describe node | grep Taints → 检查污点
   → kubectl get pvc → 检查 PVC 状态
   → 检查 podAntiAffinity 是否有足够的 Node
```

---

### Q26: etcd 和 API Server 的关系？为什么所有组件通过 API Server 通信？

**回答**：
```
关系：
  - etcd = 数据库（存储集群所有状态）
  - API Server = 统一入口（唯一操作 etcd 的组件）

为什么所有组件通过 API Server 通信而非直接访问 etcd：
  1. 安全：etcd 不暴露给外部，通过 API Server 做认证/授权
  2. 解耦：组件不需要知道 etcd 的拓扑和配置
  3. 审计：所有操作经过 API Server，可以记录审计日志
  4. 一致性：API Server 提供乐观并发控制（resourceVersion）
  5. 变更通知：组件通过 Watch API Server 而非 Watch etcd
```

---

### Q27: 滚动更新卡住了怎么排查？

**回答**：
```
1. kubectl rollout status deployment/<name>  → 确认卡在哪
2. kubectl get pods  → 看新/旧 Pod 状态

新 Pod Not Ready？
  → readinessProbe 未通过
  → 检查 initialDelaySeconds 是否够
  → kubectl logs <new-pod>

旧 Pod 一直 Terminating？
  → preStop hook 阻塞
  → 应用没处理 SIGTERM 信号
  → terminationGracePeriodSeconds 不够

解决：
  → kubectl rollout undo deployment/<name>  → 回滚
  → 修复问题后重新触发更新
```

---

## 🎯 模拟面试（JD：能使用 K8S 进行部署）

### 面试官可能的问题顺序

1. **自我介绍后**：你用过 K8S 吗？简单说说 K8S 的架构。
2. **深入基础**：Pod 和容器的关系？什么是探针？
3. **资源管理**：requests 和 limits？资源不够会怎样？
4. **网络通信**：Service 的类型？Pod 之间怎么通信？
5. **配置管理**：怎么管理配置？ConfigMap 和 Secret 区别？
6. **调度**：Pod 怎么被调度到 Node？亲和性和污点了解吗？
7. **弹性伸缩**：怎么自动扩缩？HPA 怎么配？
8. **实际部署**：你平时怎么部署应用到 K8S？用过 Helm 吗？
9. **安全**：RBAC 了解吗？怎么控制 Pod 权限？
10. **故障排查**：Pod 起不来你怎么排查？什么流程？
11. **进阶**：怎么实现零停机部署？滚动更新策略？

---

**上一章**：[第9章：运维与故障排查](./09-operations.md) | **实战**：[第6章：部署实战](./06-practice-project.md)
