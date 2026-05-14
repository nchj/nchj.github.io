# 第9章：运维与故障排查

## 🎯 学习目标
- 掌握 kubectl 高级用法和输出格式
- 理解 K8S 事件（Events）系统
- 掌握 Pod 常见异常状态的排查方法
- 了解日志体系和监控告警
- 能在面试中清晰描述故障排查思路

---

## 📖 学习要点

### 9.1 kubectl 高级用法

#### 9.1.1 输出格式

```bash
# 常用输出格式
kubectl get pods -o wide                    # 显示 Node、IP 等额外列
kubectl get pods -o yaml                    # 输出完整 YAML
kubectl get pods -o json                    # 输出 JSON
kubectl get pods -o name                    # 只输出资源名
kubectl get pods -o custom-columns=NAME:.metadata.name,STATUS:.status.phase  # 自定义列
kubectl get pods -o jsonpath='{.items[*].metadata.name}'   # JSONPath 提取

# 实用 JSONPath 示例
kubectl get pods -o jsonpath='{.items[*].status.podIP}'    # 所有 Pod IP
kubectl get pods -o jsonpath='{.items[*].spec.nodeName}'   # 所有 Pod 所在 Node
kubectl get secret my-secret -o jsonpath='{.data.password}' | base64 -d  # 解码 Secret
kubectl get nodes -o jsonpath='{.items[*].metadata.labels}' # 所有 Node 标签
```

#### 9.1.2 常用查询技巧

```bash
# 按标签筛选
kubectl get pods -l app=nginx
kubectl get pods -l 'app in (nginx,redis)'
kubectl get pods -l 'tier notin (frontend)'

# 按字段筛选
kubectl get pods --field-selector status.phase=Running
kubectl get pods --field-selector spec.nodeName=node-1

# 按命名空间
kubectl get pods -A                           # 所有 namespace
kubectl get pods --all-namespaces             # 同上
kubectl get pods -n kube-system               # 指定 namespace

# 查看 API 资源
kubectl api-resources                         # 列出所有 API 资源
kubectl api-resources | grep pod              # 筛选 pod 相关
kubectl explain pod.spec.containers           # 查看字段文档（比看文档快！）
kubectl explain pod.spec.containers.resources # 查看具体字段说明
```

#### 9.1.3 资源管理

```bash
# 查看资源消耗
kubectl top nodes                            # Node 资源使用率
kubectl top pods -n k8s-training             # Pod 资源使用率
kubectl top pods --sort-by=cpu               # 按 CPU 排序
kubectl top pods --sort-by=memory            # 按内存排序

# 查看资源定义
kubectl describe pod <name>                  # 详细描述（含 Events）
kubectl get pod <name> -o yaml               # 完整 YAML

# 编辑资源（直接打开编辑器）
kubectl edit deployment nginx -n k8s-training
# 等同于：kubectl get → 修改 → kubectl apply

# 查看资源变更（diff）
kubectl diff -f deployment.yaml              # 查看本地 YAML 和集群差异

# 打补丁（局部更新）
kubectl patch deployment nginx -p '{"spec":{"replicas":5}}' -n k8s-training

# 临时注入（调试用，不修改原始 YAML）
kubectl set image deployment/nginx nginx=nginx:1.26 -n k8s-training
kubectl set resources deployment/nginx -c nginx --limits=cpu=1,memory=1Gi -n k8s-training
```

#### 9.1.4 调试命令

```bash
# 查看日志
kubectl logs <pod-name> -n k8s-training
kubectl logs <pod-name> -c <container-name>  # 多容器时指定容器
kubectl logs <pod-name> --previous            # 上一次崩溃的日志（CrashLoopBackOff 必备）
kubectl logs -l app=nginx                     # 按标签查看多个 Pod 日志
kubectl logs -f <pod-name>                    # 实时跟踪（类似 tail -f）
kubectl logs --tail=100 <pod-name>            # 最近 100 行
kubectl logs --since=1h <pod-name>            # 最近 1 小时

# 进入容器
kubectl exec -it <pod-name> -- /bin/bash
kubectl exec -it <pod-name> -- /bin/sh        # Alpine 等轻量镜像

# 端口转发
kubectl port-forward svc/nginx 8080:80        # 本地 8080 → Service 80
kubectl port-forward pod/nginx 8080:80        # 直接转发到 Pod

# 临时运行 Pod（调试用）
kubectl run debug --image=busybox:1.36 --rm -it --restart=Never -- sh
kubectl run curl-debug --image=curlimages/curl --rm -it --restart=Never -- curl http://nginx-svc

# 文件拷贝
kubectl cp <pod-name>:/path/file ./local-file        # 从 Pod 拷出
kubectl cp ./local-file <pod-name>:/path/file         # 拷入 Pod

# 查看 RBAC 权限
kubectl auth can-i create deployments -n k8s-training
kubectl auth can-i create deployments --as=system:serviceaccount:k8s-training:app-sa -n k8s-training
kubectl auth can-i --list --as=system:serviceaccount:k8s-training:app-sa -n k8s-training
```

---

### 9.2 Pod 生命周期与状态转换

```
                    ┌──────────┐
          kubectl   │ Pending  │ ← 资源已创建，等待调度
        apply ────→│          │
                    └────┬─────┘
                         │ Scheduler 分配 Node
                         ▼
                    ┌──────────┐
                    │ Running  │ ← 容器已启动（Running 或 Running+Ready）
                    │          │
                    └──┬───┬───┘
                       │   │
              探针失败 │   │ 正常退出
                       │   │
                       ▼   ▼
              ┌────────┐ ┌──────────┐
              │Failed │ │Succeeded │
              └────────┘ └──────────┘

              ┌──────────┐
              │Unknown  │ ← Node 不可达
              └──────────┘
```

**面试关键：理解 Pending 不一定是异常，可能是正常的调度等待。**

---

### 9.3 常见异常排查（⭐⭐⭐ 面试必考）

#### 9.3.1 排查万能公式

```
第一步：看状态
  kubectl get pods

第二步：看详情
  kubectl describe pod <name>
  → 重点看 Events 部分（最底部）

第三步：看日志
  kubectl logs <name>
  kubectl logs <name> --previous    # CrashLoopBackOff 时看上次日志

第四步：看指标
  kubectl top pod <name>
```

#### 9.3.2 Pending

```
原因排查：
  kubectl describe pod <name>
  → Events: 0/3 nodes available, ...

常见原因：
  ❌ 资源不足：Node 的 CPU/内存 requests 已满
  ❌ nodeSelector 没有匹配的 Node
  ❌ nodeAffinity 不满足
  ❌ Taint 不被 Toleration 容忍
  ❌ PVC 未绑定（PVC Pending 导致 Pod Pending）
  ❌ podAntiAffinity 冲突（没有足够的 Node）

解决：
  → kubectl describe node <node> 查看资源使用情况
  → kubectl get nodes --show-labels 检查标签
  → kubectl describe node <node> | grep Taints 检查污点
  → kubectl get pvc 检查 PVC 状态
```

#### 9.3.3 CrashLoopBackOff

```
原因排查：
  kubectl logs <name> --previous    # ⭐ 关键！看崩溃前的日志
  kubectl describe pod <name>

常见原因：
  ❌ 应用启动失败（配置错误、依赖不可用）
  ❌ livenessProbe 配置不合理（应用正常但探针判断失败）
  ❌ OOM Kill（内存超过 limits）
  ❌ 命令/参数错误

解决：
  → kubectl logs <name> --previous 看崩溃原因
  → kubectl describe pod 看 State.Last State.Terminated（含退出码和原因）
  → 检查 livenessProbe 配置（initialDelaySeconds 是否够）
  → 检查 resources.limits.memory 是否太小
```

#### 9.3.4 ImagePullBackOff / ErrImagePull

```
原因排查：
  kubectl describe pod <name>
  → Events: Failed to pull image ...

常见原因：
  ❌ 镜像名/标签错误
  ❌ 私有仓库无凭证（需要 imagePullSecrets）
  ❌ 网络不通（无法访问镜像仓库）
  ❌ 镜像不存在（tag 错误）

解决：
  → 检查 image 字段拼写和 tag
  → kubectl create secret docker-registry 创建凭证
  → kubectl apply -f deployment.yaml 更新 imagePullSecrets
  → 在 Node 上手动 docker pull 测试连通性
```

#### 9.3.5 Running 但 Not Ready

```
原因排查：
  kubectl describe pod <name>

常见原因：
  ❌ readinessProbe 失败（应用还没准备好）
  ❌ 应用启动慢（Java/Spring Boot 等需要预热）
  ❌ 依赖服务不可用（数据库连接失败）

解决：
  → 检查 readinessProbe 配置
  → 增加 initialDelaySeconds
  → 配置 startupProbe（给慢启动应用缓冲）
  → kubectl logs 查看应用日志
```

#### 9.3.6 OOMKilled

```
原因排查：
  kubectl describe pod <name>
  → State.Last State.Terminated.Reason: OOMKilled
  → State.Last State.Terminated.OOMKilled: true

常见原因：
  ❌ limits.memory 设置太小
  ❌ 应用存在内存泄漏
  ❌ JVM -Xmx 设置接近 limits

解决：
  → 增大 resources.limits.memory
  → JVM 应用：-Xmx < limits.memory * 0.8
  → 分析内存使用：kubectl top pod → 持续观察
```

**面试回答模板**：
> "排查 Pod 问题我一般遵循四步：先 kubectl get pods 看状态，再 describe 看 Events，然后 logs 看日志，最后 top 看资源。最常见的是 CrashLoopBackOff，我会先用 `--previous` 看上次崩溃日志，再结合 describe 中的退出码和终止原因判断。如果是 Pending 则检查资源、亲和性、污点容忍和 PVC 状态。"

---

### 9.4 Events 事件系统

Events 是 K8S 中记录"发生了什么"的审计日志，是排查问题的第一入口。

```bash
# 查看所有事件
kubectl get events -n k8s-training

# 查看事件详情（按时间排序，最新的在上面）
kubectl get events -n k8s-training --sort-by='.lastTimestamp'

# 只看 Warning 事件
kubectl get events -n k8s-training --field-selector type=Warning

# 只看某个 Pod 的事件
kubectl get events -n k8s-training --field-selector involvedObject.name=<pod-name>

# 持续监控事件
kubectl get events -n k8s-training -w

# 查看事件详情
kubectl describe pod <name>   # Events 在输出最底部
```

Events 的常见类型：
```
Normal 类型：
  Pulling          → 正在拉取镜像
  Pulled           → 镜像拉取完成
  Created          → 容器已创建
  Started          → 容器已启动
  Scheduled        → Pod 已调度到 Node
  Killing          → 正在终止容器

Warning 类型：
  FailedScheduling       → 调度失败（资源不足、亲和性不满足）
  FailedAttachVolume     → 挂载 Volume 失败
  FailedMount            → Mount 失败
  InsufficientCPU        → CPU 不够
  InsufficientMemory     → 内存不够
  BackOff                → 容器启动失败，正在退避重试
```

> Events 有 TTL（默认 1 小时），不会永久保存。长期事件监控需要使用日志系统。

---

### 9.5 日志体系

#### 9.5.1 容器日志

```
K8S 中容器日志的标准输出：
  stdout → 容器标准输出
  stderr → 容器错误输出
  → kubelet 自动采集，kubectl logs 可查看
  → 日志文件存储在 Node 的 /var/log/containers/
```

```bash
# 基本日志
kubectl logs <pod-name>

# 多容器 Pod
kubectl logs <pod-name> -c <container-name>

# 之前的容器（崩溃后重启，旧容器日志丢失除非用 --previous）
kubectl logs <pod-name> --previous

# 跟踪日志
kubectl logs -f <pod-name>

# 多 Pod 日志聚合（按标签）
kubectl logs -l app=nginx --all-containers=true
```

#### 9.5.2 集群组件日志

```bash
# Node 上的组件日志
# kubelet 日志（在 Node 上）
journalctl -u kubelet -f

# kube-proxy 日志
journalctl -u kube-proxy -f

# Master 组件日志（在 Master Node 上）
journalctl -u kube-apiserver -f
journalctl -u kube-scheduler -f
journalctl -u kube-controller-manager -f

# 或者通过 Pod 查看（组件以静态 Pod 运行时）
kubectl logs -n kube-system kube-apiserver-<node>
kubectl logs -n kube-system etcd-<node>
```

#### 9.5.3 集中式日志方案

```
生产环境的日志方案：

  方案1：EFK Stack（传统）
  ┌────────┐   ┌──────────┐   ┌─────────────┐
  │ Fluentd │→→│Elasticsearch│→→│  Kibana     │
  │(采集)    │   │(存储/搜索) │   │(可视化)     │
  └────────┘   └──────────┘   └─────────────┘

  方案2：PLG Stack（更现代）
  ┌────────┐   ┌──────────┐   ┌─────────────┐
  │Promtail│→→│  Loki     │→→│  Grafana    │
  │(采集)    │   │(存储)     │   │(可视化)     │
  └────────┘   └──────────┘   └─────────────┘

  方案3：云厂商托管
  → 阿里云 SLS / AWS CloudWatch / 腾讯云 CLS
```

---

### 9.6 监控告警概览

#### 9.6.1 Prometheus + Grafana（行业标准）

```
┌──────────────────────────────────────────────────┐
│                监控体系架构                         │
│                                                  │
│  ┌──────────────┐                               │
│  │  Prometheus   │ ← 采集、存储、告警              │
│  │  (数据源)      │                               │
│  └──────┬───────┘                               │
│         │                                        │
│    ┌────┴────┐                                   │
│    ▼         ▼                                   │
│  Grafana  AlertManager                           │
│  (面板)    (告警通知)                              │
│                                                  │
│  采集目标：                                       │
│  ├── kubelet (Node/Pod 指标)                     │
│  ├── kube-state-metrics (K8S 资源状态)            │
│  ├── node-exporter (Node 硬件指标)                │
│  ├── blackbox-exporter (探针)                     │
│  └── 应用自带 /metrics 端点                       │
└──────────────────────────────────────────────────┘
```

#### 9.6.2 关键监控指标

```
Node 级别：
  → CPU 使用率、内存使用率、磁盘 IO、网络流量
  → kubelet 状态

Pod 级别：
  → CPU/Memory 使用率 vs requests/limits
  → Pod 重启次数
  → OOM Kill 次数

集群级别：
  → Pod 数量、Deployment 状态
  → PV 使用率
  → 证书过期时间
  → etcd 集群健康

业务级别：
  → HTTP 请求量 / 错误率 / 延迟（RED 指标）
  → 消息队列积压
  → 数据库连接池
```

---

### 9.7 集群维护操作

#### 9.7.1 节点维护（cordon / drain）

```bash
# 标记 Node 不可调度（不再调度新 Pod，已有 Pod 不受影响）
kubectl cordon <node-name>

# 驱逐 Node 上的所有 Pod（维护前使用）
kubectl drain <node-name> --ignore-daemonsets --delete-emptydir-data

# cordon + drain 的典型场景：
# 1. Node 需要升级/维护
# 2. 缩容集群
# 3. 节点硬件故障

# 恢复
kubectl uncordon <node-name>
```

#### 9.7.2 版本升级策略

```
K8S 版本号：v1.28.3
  → 1 = 大版本
  → 28 = 小版本
  → 3 = 补丁版本

升级规则（面试了解）：
  → 小版本只能升级 +1（1.27 → 1.28，不能跳到 1.29）
  → 大版本不能跳（不能直接从 1.26 → 1.28）
  → 控制面先升级，再逐个升级 Worker

多云/托管集群（EKS/ACK/GKE）：
  → 控制面升级由云厂商管理
  → Worker Node 升级通过滚动替换
```

#### 9.7.3 备份与恢复

```
etcd 备份（集群最重要的备份）：
  # 备份 etcd 快照
  ETCDCTL_API=3 etcdctl snapshot save snapshot.db \
    --endpoints=https://127.0.0.1:2379 \
    --cacert=/etc/kubernetes/pki/etcd/ca.crt \
    --cert=/etc/kubernetes/pki/etcd/server.crt \
    --key=/etc/kubernetes/pki/etcd/server.key

  # 恢复（⚠️ 慎重！）
  ETCDCTL_API=3 etcdctl snapshot restore snapshot.db

资源清单备份（YAML 级别）：
  # 导出所有资源为 YAML
  kubectl get all -A -o yaml > cluster-backup.yaml

  # 或使用 Velero（专业备份工具）
  velero backup create daily-backup --include-namespaces=production
```

---

### 9.8 常见运维场景

#### 场景1：滚动更新卡住

```bash
# 现象：kubectl rollout status 一直不完成

# 排查
kubectl get pods                    # 看是否有旧 Pod 没退出
kubectl describe deployment <name>  # 看 Events 和 Conditions

# 常见原因
# 1. 新 Pod 的 readinessProbe 不通过 → 旧 Pod 不会被终止
# 2. 旧 Pod 的 preStop hook 阻塞
# 3. 资源不足，新 Pod Pending

# 强制回滚
kubectl rollout undo deployment/<name>
```

#### 场景2：Namespace 删除卡住

```bash
# 现象：kubectl delete ns <name> 一直 Terminating

# 原因：有资源仍在使用该 Namespace

# 解决：强制删除（最后手段）
kubectl patch namespace <name> -p '{"metadata":{"finalizers":null}}' --type=merge
```

#### 场景3：Pod 频繁重启

```bash
# 排查步骤
kubectl get pod <name> -o yaml | grep -A5 restartCount  # 看重启次数
kubectl describe pod <name> | grep -A10 "Last State"      # 看上次的终止原因
kubectl logs <name> --previous                            # 看崩溃日志

# 常见原因：
# OOMKilled      → 增大 limits.memory
# Exit Code 137  → 被 SIGKILL（通常是 OOM）
# Exit Code 1    → 应用错误（看日志）
# Exit Code 0    → 正常退出（可能是探针配置问题）
# Exit Code 139  → 段错误（程序崩溃）
```

---

## 📝 习题

### 选择题

**Q1.** Pod 处于 CrashLoopBackOff 状态，首先应该用什么命令排查？
- A) `kubectl describe node`
- B) `kubectl logs <pod-name> --previous`
- C) `kubectl top pods`
- D) `kubectl get events`

**Q2.** `kubectl cordon <node>` 的作用是？
- A) 驱逐 Node 上的所有 Pod
- B) 标记 Node 不可调度（不影响已有 Pod）
- C) 删除 Node
- D) 重启 Node

**Q3.** Pod 处于 Pending 状态，最不可能的原因是？
- A) Node 资源不足
- B) 镜像拉取失败
- C) PVC 未绑定
- D) podAntiAffinity 冲突

**Q4.** `kubectl drain <node>` 的作用是？
- A) 清空 Node 上的所有日志
- B) 安全驱逐 Node 上的所有 Pod（DaemonSet 除外）
- C) 删除 Node
- D) 暂停 Node

**Q5.** Events 的默认保留时间是？
- A) 永久
- B) 1 小时
- C) 24 小时
- D) 7 天

### 简答题

**Q6.** 请描述 Pod 常见异常状态（Pending、CrashLoopBackOff、ImagePullBackOff、OOMKilled）的排查步骤。

**Q7.** `kubectl describe pod <name>` 的输出中，哪些部分对排查问题最有价值？

**Q8.** 生产环境的日志方案应该考虑哪些方面？

### 场景题

**Q9.** 用户反馈服务不可用，你收到告警。请描述从接到告警到定位问题的完整排查流程。

**Q10.** 一个 Deployment 的滚动更新卡住了，`kubectl rollout status` 一直显示等待。请列出排查步骤。

---

## ✅ 参考答案

### A1. B) `kubectl logs <pod-name> --previous`
CrashLoopBackOff 意味着容器反复崩溃重启，`--previous` 可以看到上一次崩溃前的日志。

### A2. B) 标记 Node 不可调度（不影响已有 Pod）
cordon 只是设置 `Unschedulable: true`，已有 Pod 继续运行。drain 才会驱逐 Pod。

### A3. B) 镜像拉取失败
镜像拉取失败会导致 ImagePullBackOff/ErrImagePull，不是 Pending。Pending 的常见原因是资源不足、亲和性不满足、PVC 未绑定等调度问题。

### A4. B) 安全驱逐 Node 上的所有 Pod（DaemonSet 除外）
drain = cordon（标记不可调度）+ 驱逐 Pod。通常需要 `--ignore-daemonsets` 和 `--delete-emptydir-data`。

### A5. B) 1 小时
Events 默认 TTL 为 1 小时（`--event-ttl=1h`），不是永久保存。

### A6. 常见异常排查步骤
```
Pending：
  1. kubectl describe pod → Events 部分
  2. 检查 "0/N nodes available"
  3. 检查资源：kubectl describe node → Allocatable
  4. 检查亲和性：nodeSelector/nodeAffinity/podAntiAffinity
  5. 检查污点：kubectl describe node | grep Taints
  6. 检查 PVC：kubectl get pvc

CrashLoopBackOff：
  1. kubectl logs --previous（看崩溃日志）
  2. kubectl describe pod → Last State.Terminated
  3. 检查退出码和原因（OOMKilled、Error、Completed）
  4. 检查 livenessProbe 配置

ImagePullBackOff：
  1. kubectl describe pod → Events
  2. 检查 image 拼写和 tag
  3. 检查 imagePullSecrets
  4. 在 Node 上手动 docker pull 测试

OOMKilled：
  1. kubectl describe pod → Last State.Terminated
  2. 增大 limits.memory
  3. JVM 应用：-Xmx < limits * 0.8
```

### A7. describe 输出中最有价值的部分
```
1. Events（最底部）
   → 记录了 Pod 的完整事件链
   → Warning 类型的事件是排查关键

2. Conditions
   → PodScheduled：是否已调度
   → Initialized：Init 容器是否完成
   → Ready：是否就绪
   → ContainersReady：容器是否就绪

3. Last State.Terminated（如果 Pod 重启过）
   → Exit Code（退出码）
   → Reason（OOMKilled、Error 等）
   → Finished At（终止时间）

4. Status.ContainerStatuses
   → State：当前状态（Running/Waiting/Terminated）
   → Last Termination State：上次终止信息
   → Restart Count：重启次数
```

### A8. 生产环境日志方案
```
需求：
  1. 集中采集：所有 Pod 日志统一采集
  2. 结构化存储：方便搜索和分析
  3. 可视化：Dashboard 查看日志
  4. 告警：错误日志触发告警
  5. 保留策略：按合规要求保留（如 30 天）

方案选型：
  - EFK（Elasticsearch + Fluentd + Kibana）：功能全面但资源消耗大
  - PLG（Promtail + Loki + Grafana）：轻量，与 Grafana 生态集成好
  - 云厂商托管（阿里云 SLS / AWS CloudWatch）：免运维

最佳实践：
  - 应用日志写 stdout/stderr（不要写文件）
  - 使用结构化 JSON 日志格式
  - 设置合理的日志级别（生产 info/warn/error）
  - 敏感信息脱敏
```

### A9. 服务不可用排查流程
```
1. 确认影响范围
   → kubectl get pods -A -o wide | grep -v Running
   → 是单个 Pod 还是大规模故障？

2. 检查 Service 和 Endpoints
   → kubectl get svc -n <namespace>
   → kubectl get endpoints <service-name>
   → Endpoints 是否有健康的 Pod IP？

3. 检查 Pod 状态
   → kubectl get pods -n <namespace>
   → 有没有 Pending/CrashLoopBackOff 的 Pod？

4. 如果有异常 Pod
   → kubectl describe pod <name> → 看 Events
   → kubectl logs <name> [--previous]

5. 检查 Node 状态
   → kubectl get nodes
   → 有没有 NotReady 的 Node？

6. 检查资源
   → kubectl top nodes
   → kubectl top pods -n <namespace>

7. 快速止血
   → 如果是单个 Pod 问题：kubectl rollout restart deployment/<name>
   → 如果是配置问题：kubectl rollout undo deployment/<name>
   → 如果是资源问题：临时扩容或清理无用资源
```

### A10. 滚动更新卡住排查
```
1. kubectl rollout status deployment/<name>  # 确认卡在哪个阶段

2. kubectl get pods  # 查看新/旧 Pod 状态
   → 新 Pod 是否 Running？
   → 新 Pod 是否 Ready？
   → 旧 Pod 是否在 Terminating？

3. 如果新 Pod Not Ready：
   → kubectl logs <new-pod>（检查应用启动）
   → 检查 readinessProbe（initialDelaySeconds 够不够）
   → 检查新 Pod 是否有资源

4. 如果旧 Pod 一直 Terminating：
   → 检查 preStop hook（是否有 sleep 阻塞）
   → 检查 terminationGracePeriodSeconds
   → kubectl describe pod <old-pod>

5. 强制处理：
   → kubectl rollout undo deployment/<name>  # 回滚
   → 或手动删除旧 Pod：kubectl delete pod <old-pod> --grace-period=0 --force
```

---

## 🔧 实操练习

```bash
export KUBECONFIG=~/.kube/sealos.yaml
kubectl create namespace k8s-training

# 1. 部署一个应用
kubectl apply -f - <<EOF
apiVersion: apps/v1
kind: Deployment
metadata:
  name: debug-demo
  namespace: k8s-training
spec:
  replicas: 2
  selector:
    matchLabels:
      app: debug
  template:
    metadata:
      labels:
        app: debug
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

# 2. 练习 kubectl 高级用法
kubectl get pods -n k8s-training -o wide
kubectl get pods -n k8s-training -o custom-columns=NAME:.metadata.name,NODE:.spec.nodeName,STATUS:.status.phase
kubectl get pods -n k8s-training -o jsonpath='{.items[*].status.podIP}'

# 3. 查看 Events
kubectl get events -n k8s-training --sort-by='.lastTimestamp'
kubectl describe pod -l app=debug -n k8s-training

# 4. 练习排障
# 创建一个会 CrashLoopBackOff 的 Pod
kubectl apply -f - <<EOF
apiVersion: v1
kind: Pod
metadata:
  name: crash-demo
  namespace: k8s-training
spec:
  containers:
  - name: crasher
    image: busybox:1.36
    command: ["sh", "-c", "echo 'starting' && exit 1"]
    resources:
      requests:
        cpu: "10m"
        memory: "16Mi"
      limits:
        cpu: "50m"
        memory: "32Mi"
EOF

# 观察 Pod 状态变化
kubectl get pods crash-demo -n k8s-training -w
# Ctrl+C 停止

# 排查
kubectl describe pod crash-demo -n k8s-training
kubectl logs crash-demo --previous -n k8s-training

# 5. 练习调试命令
kubectl run curl-test --image=curlimages/curl --rm -it --restart=Never -n k8s-training -- \
  curl -s http://debug-demo.k8s-training.svc.cluster.local 2>/dev/null | head -5

# 6. 练习资源查看
kubectl top pods -n k8s-training    # 如果 Metrics Server 已安装

# ⚠️ 清理！
kubectl delete namespace k8s-training
```

---

**上一章**：[第8章：安全与权限](./08-security.md) | **下一章**：[第10章：面试高频题](./10-interview-questions.md)
