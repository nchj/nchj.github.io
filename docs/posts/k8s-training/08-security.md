# 第8章：安全与权限

## 🎯 学习目标
- 理解 K8S 安全架构的四大层面
- 掌握 RBAC 的核心概念和配置（⭐ 面试高频）
- 理解 NetworkPolicy 网络隔离策略
- 了解 SecurityContext 容器安全上下文
- 能在面试中清晰回答安全相关问题

---

## 📖 学习要点

### 8.1 K8S 安全架构全景

K8S 安全分为四个层面：

```
┌──────────────────────────────────────────────────────────┐
│                 K8S 安全四层模型                            │
│                                                          │
│  ① 认证（Authentication）                                │
│     "你是谁？"                                           │
│     → Token、证书、OIDC、ServiceAccount                  │
│                                                          │
│  ② 授权（Authorization / RBAC）                         │
│     "你能做什么？"                                        │
│     → Role、ClusterRole、RoleBinding                     │
│                                                          │
│  ③ 准入控制（Admission Control）                        │
│     "你的请求安全吗？"                                    │
│     → LimitRanger、ResourceQuota、PodSecurity           │
│                                                          │
│  ④ 网络策略（Network Policy）                            │
│     "谁能和谁通信？"                                      │
│     → NetworkPolicy、Service Mesh                        │
└──────────────────────────────────────────────────────────┘

请求流程：
  用户请求 → ①认证（你是谁）→ ②授权（你能做吗）→ ③准入控制（请求安全吗）→ 写入 etcd
```

---

### 8.2 RBAC（⭐⭐⭐ 面试必考）

RBAC = Role-Based Access Control（基于角色的访问控制），是 K8S 的授权机制。

#### 8.2.1 核心概念

```
四个核心对象：

Role          → 定义"能做什么"（Namespace 级别）
ClusterRole   → 定义"能做什么"（集群级别）

RoleBinding         → 把 Role 绑定到"谁"
ClusterRoleBinding  → 把 ClusterRole 绑定到"谁"

绑定对象（"谁"）：
  User       → 外部用户（通过证书/OIDC 认证）
  Group      → 用户组
  ServiceAccount → Pod 的身份（最常用！）
```

```
┌─────────────┐     绑定到     ┌──────────────────┐
│   Role      │ ←──────────── │   RoleBinding    │
│ (权限规则)   │               │ (角色绑定)        │
└──────┬──────┘               └────────┬─────────┘
       │                               │
       │        授予                   │
       ▼                               ▼
┌──────────────────────────────────────────────┐
│         ServiceAccount（Pod 身份）              │
│   或 User / Group（用户/用户组）               │
└──────────────────────────────────────────────┘
```

#### 8.2.2 Role 和 ClusterRole

```yaml
# Role：Namespace 级别的权限
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  name: developer
  namespace: production           # ⭐ 只在 production namespace 生效
rules:
- apiGroups: [""]                # "" = core API group（Pod、Service 等）
  resources: ["pods", "services", "configmaps"]
  verbs: ["get", "list", "watch", "create", "update"]
- apiGroups: ["apps"]            # apps API group（Deployment、StatefulSet 等）
  resources: ["deployments"]
  verbs: ["get", "list", "watch", "create", "update", "patch"]
- apiGroups: [""]
  resources: ["secrets"]         # Secret 单独限制
  verbs: ["get", "list"]         # 只允许查看，不允许创建/删除
```

```yaml
# ClusterRole：集群级别的权限
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRole
metadata:
  name: cluster-reader          # ⭐ 全集群生效
rules:
- apiGroups: [""]
  resources: ["nodes", "namespaces", "pods"]
  verbs: ["get", "list", "watch"]     # 只读权限
```

#### 8.2.3 RoleBinding 和 ClusterRoleBinding

```yaml
# RoleBinding：把 Role 绑定到 ServiceAccount
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  name: developer-binding
  namespace: production
subjects:
- kind: ServiceAccount           # 绑定给 ServiceAccount
  name: app-sa                   # ServiceAccount 名称
  namespace: production
# - kind: User                   # 也可以绑定给外部用户
#   name: zhangsan
# - kind: Group                  # 或用户组
#   name: developers
roleRef:
  kind: Role                     # 引用的 Role
  name: developer                # Role 名称
  apiGroup: rbac.authorization.k8s.io
```

```yaml
# ClusterRoleBinding：把 ClusterRole 绑定到所有 Namespace 的 SA
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRoleBinding
metadata:
  name: read-all-binding
subjects:
- kind: ServiceAccount
  name: monitor-sa
  namespace: monitoring
roleRef:
  kind: ClusterRole
  name: cluster-reader
  apiGroup: rbac.authorization.k8s.io
```

#### 8.2.4 ServiceAccount（Pod 的身份）

```yaml
# 每个 Namespace 默认有一个 default ServiceAccount
# 建议为每个应用创建独立的 SA

apiVersion: v1
kind: ServiceAccount
metadata:
  name: app-sa
  namespace: production
---
# 在 Pod 中使用 ServiceAccount
apiVersion: v1
kind: Pod
metadata:
  name: my-app
  namespace: production
spec:
  serviceAccountName: app-sa     # ⭐ 指定 SA（不指定则用 default）
  containers:
  - name: app
    image: myapp:1.0
```

#### 8.2.5 内置 ClusterRole（⭐ 面试常考）

K8S 自带了几个常用的 ClusterRole，不需要自己创建：

| ClusterRole | 权限范围 | 典型用途 |
|-------------|----------|----------|
| `cluster-admin` | **全集群所有权限** | 集群管理员（慎用！） |
| `admin` | Namespace 内几乎所有权限（含 RBAC） | Namespace 负责人 |
| `edit` | Namespace 内读写权限（不含 RBAC） | 普通开发者 |
| `view` | Namespace 内只读权限 | 只读观察者 |

```bash
# 给开发者 devuser 授予 production namespace 的 edit 权限
kubectl create rolebinding devuser-edit \
  --clusterrole=edit \
  --user=devuser \
  --namespace=production

# 给监控 SA 授予全集群只读（ClusterRoleBinding）
kubectl create clusterrolebinding monitor-view \
  --clusterrole=view \
  --serviceaccount=monitoring:prometheus-sa
```

> ⚠️ 重要区别：
> - `kubectl create rolebinding --clusterrole=edit -n production` → ClusterRole + **RoleBinding** = 只在 production 生效
> - `kubectl create clusterrolebinding --clusterrole=edit` → ClusterRole + **ClusterRoleBinding** = 全集群生效

#### 8.2.6 RoleBinding 引用 ClusterRole（⭐ 常见混淆点）

这是一个非常实用但容易混淆的用法：**ClusterRole 可以被 RoleBinding 引用**，此时权限仅在 RoleBinding 所在的 Namespace 生效。

```
场景：你希望在每个 Namespace 里都有相同的权限规则（如"只读 Pod"），
      但不想在每个 Namespace 里都创建一模一样的 Role。

解决方案：
  1. 创建一个 ClusterRole（定义规则）
  2. 在每个 Namespace 里用 RoleBinding 引用这个 ClusterRole
```

```yaml
# ClusterRole 定义规则（集群级别，共享使用）
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRole
metadata:
  name: pod-reader
rules:
- apiGroups: [""]
  resources: ["pods", "pods/log"]
  verbs: ["get", "list", "watch"]
---
# RoleBinding 在 team-a namespace 引用 ClusterRole
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  name: team-a-pod-reader
  namespace: team-a              # ⭐ 只在 team-a 生效
subjects:
- kind: ServiceAccount
  name: app-sa
  namespace: team-a
roleRef:
  kind: ClusterRole              # ⭐ 引用的是 ClusterRole（而不是 Role）
  name: pod-reader
  apiGroup: rbac.authorization.k8s.io
```

```
总结对比：

                  ┌──────────────┬──────────────────────────┐
                  │ roleRef 类型  │ binding 类型              │ 作用范围
  ────────────────┼──────────────┼──────────────────────────┤
  常规用法        │ Role         │ RoleBinding               │ 同 Namespace
  跨 NS 复用      │ ClusterRole  │ RoleBinding               │ ⭐ 仅 RoleBinding 所在 NS
  全集群授权      │ ClusterRole  │ ClusterRoleBinding        │ 全集群
  ────────────────┴──────────────┴──────────────────────────┘
```

#### 8.2.7 聚合 ClusterRole（Aggregated ClusterRole）

通过标签聚合多个 ClusterRole，实现权限的动态扩展：

```yaml
# 聚合 ClusterRole：自动合并所有带 rbac.example.com/aggregate-to-monitoring=true 标签的 ClusterRole
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRole
metadata:
  name: monitoring
aggregationRule:
  clusterRoleSelectors:
  - matchLabels:
      rbac.example.com/aggregate-to-monitoring: "true"
rules: []  # 聚合 ClusterRole 的 rules 由 controller 自动填充，这里不需要手写

---
# 被聚合的 ClusterRole（打上标签即可自动加入）
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRole
metadata:
  name: monitoring-endpoints
  labels:
    rbac.example.com/aggregate-to-monitoring: "true"   # ⭐ 关键标签
rules:
- apiGroups: [""]
  resources: ["endpoints", "pods", "services"]
  verbs: ["get", "list", "watch"]
```

> 💡 内置 ClusterRole（`admin`、`edit`、`view`）都使用了聚合机制。安装 CRD 时，运营商可以通过打标签的方式自动扩展这些内置权限，而无需修改原有 ClusterRole。

#### 8.2.8 API Group 详解（⭐ 写 Role 必须掌握）

RBAC rules 中的 `apiGroups` 决定了 `resources` 属于哪个 API Group：

```
常用 API Group 对应关系：

apiGroups: [""]                        # core group（空字符串）
  resources: pods, services, configmaps, secrets, nodes,
             namespaces, endpoints, persistentvolumeclaims, events

apiGroups: ["apps"]
  resources: deployments, replicasets, statefulsets, daemonsets

apiGroups: ["batch"]
  resources: jobs, cronjobs

apiGroups: ["autoscaling"]
  resources: horizontalpodautoscalers

apiGroups: ["networking.k8s.io"]
  resources: ingresses, networkpolicies

apiGroups: ["rbac.authorization.k8s.io"]
  resources: roles, rolebindings, clusterroles, clusterrolebindings

apiGroups: ["storage.k8s.io"]
  resources: storageclasses, volumeattachments

apiGroups: ["apiextensions.k8s.io"]
  resources: customresourcedefinitions (CRDs)
```

```bash
# 查询某个资源属于哪个 API Group
kubectl api-resources | grep deployment
# NAME           SHORTNAMES   APIVERSION   NAMESPACED   KIND
# deployments    deploy       apps/v1      true         Deployment
#                             ^^^^
#                             这里 apps 就是 apiGroup
```

```yaml
# 示例：给 Dispatcher 服务授予创建 Job 的权限
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  name: job-creator
  namespace: processing
rules:
- apiGroups: ["batch"]          # ⭐ Job 属于 batch group
  resources: ["jobs"]
  verbs: ["create", "get", "list", "watch", "delete"]
- apiGroups: [""]               # ⭐ Pod 日志属于 core group
  resources: ["pods", "pods/log"]
  verbs: ["get", "list", "watch"]
```

#### 8.2.9 subresources（子资源）权限

某些操作需要单独授权**子资源**：

```yaml
rules:
# Pod 本身的增删查
- apiGroups: [""]
  resources: ["pods"]
  verbs: ["get", "list", "watch", "create", "delete"]

# Pod 日志（pods/log 是子资源）
- apiGroups: [""]
  resources: ["pods/log"]           # ⭐ 子资源格式：资源/子资源
  verbs: ["get"]

# Pod exec（远程执行命令）
- apiGroups: [""]
  resources: ["pods/exec"]          # ⭐ kubectl exec 需要此权限
  verbs: ["create"]

# Deployment 扩缩容（scale 子资源）
- apiGroups: ["apps"]
  resources: ["deployments/scale"]  # ⭐ kubectl scale 需要此权限
  verbs: ["update"]
```

```
常见子资源速查：
  pods/log        → kubectl logs
  pods/exec       → kubectl exec
  pods/portforward → kubectl port-forward
  pods/status     → 更新 Pod 状态
  deployments/scale → kubectl scale
  services/proxy  → kubectl proxy
```

#### 8.2.10 RBAC 调试与审计（⭐ 必会命令）

```bash
# ===== 权限检查 =====

# 检查当前用户是否有某个权限
kubectl auth can-i create pods
kubectl auth can-i list secrets -n production

# 检查指定 SA 是否有权限（impersonation）
kubectl auth can-i list pods \
  --as=system:serviceaccount:production:app-sa \
  -n production

# 列出当前用户所有权限（K8S 1.14+）
kubectl auth can-i --list -n production

# 列出指定 SA 的所有权限
kubectl auth can-i --list \
  --as=system:serviceaccount:monitoring:prometheus-sa \
  -n monitoring

# ===== 查看 RBAC 资源 =====

# 查看所有 Role 和 RoleBinding
kubectl get roles,rolebindings -n production

# 查看 ClusterRole 的详细规则
kubectl describe clusterrole edit

# 查看谁绑定了某个 ClusterRole
kubectl get clusterrolebindings -o wide | grep cluster-admin

# 找出某个 SA 被绑定到哪些 Role/ClusterRole
kubectl get rolebindings,clusterrolebindings -A \
  -o jsonpath='{range .items[*]}{.metadata.name}{" → "}{range .subjects[*]}{.kind}/{.name}{" "}{end}{"\n"}{end}' \
  | grep "app-sa"

# ===== 权限问题排查流程 =====
# 1. 查看错误信息（通常是 403 Forbidden）
kubectl get pods -n production
# Error: pods is forbidden: User "xxx" cannot list resource "pods" ...

# 2. 确认当前身份
kubectl auth whoami   # K8S 1.28+
kubectl config current-context

# 3. 检查权限
kubectl auth can-i list pods --as=system:serviceaccount:production:app-sa -n production

# 4. 找到对应的 SA 和 RoleBinding
kubectl describe rolebinding -n production | grep -A5 "app-sa"

# 5. 修复：添加缺失权限
kubectl edit role <role-name> -n production
```

#### 8.2.11 生产级 RBAC 架构（多团队场景）

**场景**：一个 K8S 集群，team-a 和 team-b 各有自己的 Namespace，SRE 团队负责全集群运维。

```
集群权限架构图：

┌─────────────────────────────────────────────────────────────┐
│                        K8S 集群                              │
│                                                             │
│  ┌─────────────────────┐   ┌─────────────────────────┐     │
│  │   Namespace: team-a  │   │   Namespace: team-b     │     │
│  │                      │   │                         │     │
│  │  app-sa ─[RoleBinding]→ ClusterRole:edit          │     │
│  │  ci-sa  ─[RoleBinding]→ ClusterRole:edit          │     │
│  │  mon-sa ─[RoleBinding]→ ClusterRole:view          │     │
│  └──────────────────────┘   └─────────────────────────┘     │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              集群级别（ClusterRoleBinding）           │   │
│  │  sre-team → ClusterRole:cluster-admin               │   │
│  │  monitoring-sa → ClusterRole:view                   │   │
│  │  ingress-controller-sa → ClusterRole:ingress-viewer │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

```yaml
# 完整示例：为 team-a 的 CI/CD 流水线配置 RBAC

# 1. 创建 ServiceAccount
apiVersion: v1
kind: ServiceAccount
metadata:
  name: ci-deployer
  namespace: team-a
---
# 2. 创建 Role（只允许 CI/CD 需要的操作）
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  name: ci-deployer-role
  namespace: team-a
rules:
# 允许管理 Deployment
- apiGroups: ["apps"]
  resources: ["deployments", "replicasets"]
  verbs: ["get", "list", "watch", "create", "update", "patch"]
# 允许管理 ConfigMap（不含 Secret）
- apiGroups: [""]
  resources: ["configmaps", "services"]
  verbs: ["get", "list", "watch", "create", "update", "patch"]
# 只允许查看 Pod（不允许创建/删除）
- apiGroups: [""]
  resources: ["pods", "pods/log"]
  verbs: ["get", "list", "watch"]
# 允许查看 Job 状态（部署后验证）
- apiGroups: ["batch"]
  resources: ["jobs"]
  verbs: ["get", "list", "watch"]
# 注意：❌ 不授予 secrets 权限（CI 环境不需要读敏感信息）
# 注意：❌ 不授予 rolebindings 权限（防止 CI 提升自身权限）
---
# 3. RoleBinding 绑定
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  name: ci-deployer-binding
  namespace: team-a
subjects:
- kind: ServiceAccount
  name: ci-deployer
  namespace: team-a
roleRef:
  kind: Role
  name: ci-deployer-role
  apiGroup: rbac.authorization.k8s.io
```

#### 8.2.12 RBAC 最佳实践（面试加分）

```
✅ 最小权限原则
   → 每个 ServiceAccount 只授予必需的权限
   → 不要直接用 default SA
   → 定期审计（kubectl auth can-i --list）

✅ 分离读写权限
   → developer Role: 可以 get/list/create/update
   → viewer Role: 只能 get/list/watch

✅ 限制 Secret 访问
   → 大部分应用不需要访问 Secret
   → 把 Secret 权限单独抽到一个 Role
   → CI/CD SA 通常不需要读 Secret（通过注入而不是读取）

✅ 使用命名规范
   → Role/Binding: <team>-<action>（如 dev-readonly）
   → ServiceAccount: <app>-sa（如 api-sa, ci-deployer）

✅ 优先使用内置 ClusterRole
   → view/edit/admin 已覆盖大多数场景
   → 通过 RoleBinding 引用 ClusterRole，避免重复定义

✅ 使用 RoleBinding + ClusterRole 代替重复的 Role
   → 多个 Namespace 需要相同规则时，创建一个 ClusterRole，
     在每个 Namespace 用 RoleBinding 引用

❌ 不要使用 ClusterRoleBinding 授予非必要权限
   → ClusterRoleBinding 是全集群级别的
   → 能用 RoleBinding 的就不要用 ClusterRoleBinding

❌ 不要授予通配符权限
   → resources: ["*"] 或 verbs: ["*"] 等于放弃最小权限
   → cluster-admin 只给极少数人

❌ 防止权限提升（Privilege Escalation）
   → 不要给应用授予 create rolebindings/clusterrolebindings 权限
   → 否则应用可以给自己提权
```

**面试回答模板**：
> "RBAC 是 K8S 的授权机制，通过 Role/ClusterRole 定义权限规则，通过 RoleBinding/ClusterRoleBinding 绑定到 User/Group/ServiceAccount。有几个关键点容易混淆：一是 ClusterRole 可以被 RoleBinding 引用，此时权限只在该 Namespace 生效，这是多 Namespace 复用权限规则的常用方式；二是 API Group 要写对，Deployment 在 apps 组，Job 在 batch 组；三是子资源需要单独授权，比如 pods/exec 和 pods/log。生产实践中我们遵循最小权限原则，每个应用独立 SA，用 `kubectl auth can-i --list` 做定期审计。"

---

### 8.3 NetworkPolicy（网络策略）

#### 8.3.1 为什么需要 NetworkPolicy？

```
默认情况下：
  K8S 中所有 Pod 之间网络完全互通（零信任反面）

有了 NetworkPolicy：
  可以精确控制：
  → 哪些 Pod 可以被访问
  → 哪些 Pod 可以访问外部
  → 允许哪些端口和协议
```

> ⚠️ NetworkPolicy 需要 CNI 插件支持（Calico、Cilium 支持，Flannel 默认不支持）。

#### 8.3.2 NetworkPolicy 示例

**示例1：只允许前端 Pod 访问 API Pod**

```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: api-allow-frontend
  namespace: production
spec:
  podSelector:
    matchLabels:
      app: api                  # 这个 Policy 作用于 label=app:api 的 Pod
  policyTypes:
  - Ingress                    # 控制入站流量
  ingress:
  - from:
    - podSelector:
        matchLabels:
          app: frontend        # 只允许 label=app:frontend 的 Pod
    ports:
    - port: 8080               # 只允许 8080 端口
      protocol: TCP
```

**效果**：
```
frontend Pod → api Pod:8080   ✅ 允许
database Pod → api Pod:8080   ❌ 拒绝
任何 Pod → api Pod:3306       ❌ 拒绝（只开了 8080）
api Pod → 外部                ✅ 允许（出站默认不受限，除非设 Egress）
```

**示例2：禁止 Pod 访问外部网络**

```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: deny-external
  namespace: production
spec:
  podSelector:
    matchLabels:
      app: sensitive-app
  policyTypes:
  - Egress                     # 控制出站流量
  egress:
  - to:
    - podSelector: {}           # 只允许访问同 namespace 内的 Pod
    ports:
    - port: 53                  # DNS
      protocol: UDP
  - to:                         # 允许访问特定 Service
    - namespaceSelector:
        matchLabels:
          name: production
```

**示例3：完全隔离 Namespace**

```yaml
# 默认拒绝所有入站流量（白名单模式）
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: deny-all-ingress
  namespace: production
spec:
  podSelector: {}               # 作用于所有 Pod（空选择器 = 所有）
  policyTypes:
  - Ingress
  # ingress 为空 = 拒绝所有入站
```

#### 8.3.3 NetworkPolicy 要点总结

```
1. 选择器（podSelector）
   → 空 {} = 该 namespace 的所有 Pod
   → 有条件 = 只有匹配标签的 Pod

2. 策略类型（policyTypes）
   → Ingress：入站（谁可以访问我）
   → Egress：出站（我可以访问谁）
   → 不指定 Ingress = 不限制入站
   → 不指定 Egress = 不限制出站

3. 规则模式
   → 白名单模式：先 deny-all，再逐条允许（推荐）
   → 黑名单模式：逐条拒绝（不推荐，容易遗漏）

4. DNS 注意事项
   → 即使限制了出站，也要放行 UDP 53 端口（DNS）
   → 否则 Pod 无法解析域名
```

---

### 8.4 SecurityContext（安全上下文）

控制 Pod 和容器的安全属性：

#### 8.4.1 Pod 级别

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: secure-pod
spec:
  securityContext:
    runAsNonRoot: true          # ⭐ 强制容器以非 root 运行（面试高频）
    runAsUser: 1000             # 以 UID 1000 运行
    runAsGroup: 3000            # 以 GID 3000 运行
    fsGroup: 2000               # 挂载的 Volume 文件属组
    seccompProfile:             # Seccomp 安全配置文件
      type: RuntimeDefault
  containers:
  - name: app
    image: myapp:1.0
    securityContext:
      allowPrivilegeEscalation: false   # ⭐ 禁止提权（面试高频）
      readOnlyRootFilesystem: true      # 根文件系统只读
      capabilities:
        drop: ["ALL"]                   # 丢弃所有 Linux capabilities
        add: ["NET_BIND_SERVICE"]       # 只添加必需的
```

#### 8.4.2 核心安全配置（面试记忆表）

| 配置 | 作用 | 推荐值 |
|------|------|--------|
| `runAsNonRoot` | 禁止以 root 运行 | `true` |
| `allowPrivilegeEscalation` | 禁止 setuid 提权 | `false` |
| `readOnlyRootFilesystem` | 根文件系统只读 | `true`（需要时挂载 writable volume） |
| `capabilities.drop: ["ALL"]` | 丢弃所有 Linux capabilities | 推荐 |
| `seccompProfile` | 系统调用过滤 | `RuntimeDefault` |

#### 8.4.3 PodSecurity admission（Pod 安全准入）

K8S 1.25+ 使用 Pod Security Standards 替代了旧的 PodSecurityPolicy：

| 级别 | 说明 | 策略 |
|------|------|------|
| **Privileged** | 无限制 | 不推荐 |
| **Baseline** | 基本安全（防止提权） | 最小安全要求 |
| **Restricted** | 严格安全 | 推荐 |

```yaml
# 在 Namespace 上应用安全标准
apiVersion: v1
kind: Namespace
metadata:
  name: production
  labels:
    pod-security.kubernetes.io/enforce: restricted   # 强制执行
    pod-security.kubernetes.io/audit: restricted     # 审计记录
    pod-security.kubernetes.io/warn: restricted      # 告警
```

---

### 8.5 ResourceQuota（资源配额）

限制 Namespace 的总资源用量，防止一个团队占用所有资源：

```yaml
apiVersion: v1
kind: ResourceQuota
metadata:
  name: team-quota
  namespace: team-a
spec:
  hard:
    # 计算资源限制
    requests.cpu: "10"           # 该 namespace 所有 Pod 的 CPU requests 总和不超过 10 核
    requests.memory: "20Gi"      # 内存 requests 不超过 20Gi
    limits.cpu: "20"             # CPU limits 不超过 20 核
    limits.memory: "40Gi"        # 内存 limits 不超过 40Gi

    # 对象数量限制
    pods: "50"                   # 最多 50 个 Pod
    services: "10"               # 最多 10 个 Service
    persistentvolumeclaims: "20" # 最多 20 个 PVC
    configmaps: "50"             # 最多 50 个 ConfigMap
    secrets: "50"                # 最多 50 个 Secret
```

```bash
# 查看配额使用情况
kubectl describe resourcequota team-quota -n team-a

# 输出示例：
# Name:            team-quota
# Resource         Used  Hard
# --------         ----  ----
# limits.cpu       3     20
# limits.memory    6Gi   40Gi
# pods             5     50
# services         3     10
```

---

### 8.6 LimitRange（默认资源限制）

为没有配置 resources 的 Pod 设置默认值：

```yaml
apiVersion: v1
kind: LimitRange
metadata:
  name: default-limits
  namespace: production
spec:
  limits:
  - type: Container
    default:                    # 默认 limits（没设 limits 的 Pod 自动获得）
      cpu: "500m"
      memory: "256Mi"
    defaultRequest:             # 默认 requests（没设 requests 的 Pod 自动获得）
      cpu: "100m"
      memory: "64Mi"
    max:                        # 最大限制（不能超过）
      cpu: "2000m"
      memory: "2Gi"
    min:                        # 最小限制（不能低于）
      cpu: "50m"
      memory: "32Mi"
```

**面试回答模板**：
> "LimitRange 是 namespace 级别的默认资源限制，为没有配置 resources 的 Pod 自动填充 default 和 defaultRequest。ResourceQuota 是 namespace 级别的总量限制。两者配合使用：LimitRange 确保每个 Pod 有合理配置，ResourceQuota 确保整个 namespace 不超标。"

---

## 📝 习题

### 选择题

**Q1.** RBAC 中，定义集群级别权限的对象是？
- A) Role
- B) RoleBinding
- C) ClusterRole
- D) ServiceAccount

**Q2.** Pod 默认使用哪个 ServiceAccount？
- A) admin-sa
- B) default
- C) kube-system
- D) 无 ServiceAccount

**Q3.** 以下哪个 NetworkPolicy 配置会拒绝所有入站流量？
- A) `podSelector: {app: nginx}`，不设置 ingress
- B) `podSelector: {}`，设置 `policyTypes: [Ingress]`，ingress 为空
- C) `podSelector: {app: nginx}`，设置 `policyTypes: [Egress]`
- D) 设置 `ingress: [{from: [{podSelector: {}}]}]`

**Q4.** `runAsNonRoot: true` 的作用是？
- A) 容器以 root 用户运行
- B) 容器不能以 root 用户运行（如果镜像默认是 root 会启动失败）
- C) 禁止容器访问网络
- D) 限制容器的内存使用

**Q5.** ResourceQuota 和 LimitRange 的区别是？
- A) ResourceQuota 限制单个 Pod，LimitRange 限制整个 Namespace
- B) ResourceQuota 限制整个 Namespace 的总量，LimitRange 为单个 Pod 设置默认值
- C) 两者完全一样
- D) ResourceQuota 限制网络，LimitRange 限制存储

**Q6.** 用 `RoleBinding` 引用 `ClusterRole`，权限生效范围是？
- A) 全集群
- B) 仅 ClusterRole 所在的 Namespace
- C) 仅 RoleBinding 所在的 Namespace
- D) 两个 Namespace 都生效

**Q7.** 以下哪个操作需要 `pods/exec` 权限？
- A) `kubectl get pods`
- B) `kubectl logs mypod`
- C) `kubectl exec -it mypod -- bash`
- D) `kubectl delete pod mypod`

### 简答题

**Q8.** 请简述 RBAC 的四个核心对象及其作用。

**Q9.** 为什么不应该直接使用 default ServiceAccount？最佳实践是什么？

**Q10.** NetworkPolicy 默认行为是什么？如何实现白名单安全策略？

**Q11.** 请解释 SecurityContext 中 `allowPrivilegeEscalation: false` 的作用。

**Q12.** 你需要给 Dispatcher 服务（在 processing namespace）配置 RBAC，使其能够在 processing namespace 内创建和查看 Job，但不能删除 Job，也不能操作其他资源。请写出 ServiceAccount、Role、RoleBinding 的 YAML。

---

## ✅ 参考答案

### A1. C) ClusterRole
Role 是 Namespace 级别，ClusterRole 是集群级别。

### A2. B) default
每个 Namespace 自动创建一个 default ServiceAccount。建议为每个应用创建独立 SA。

### A3. B) `podSelector: {}`，设置 `policyTypes: [Ingress]`，ingress 为空
空 podSelector = 所有 Pod。policyTypes 指定 Ingress 但 ingress 规则为空 = 拒绝所有入站。

### A4. B) 容器不能以 root 用户运行
如果镜像的 USER 是 root（UID 0），设置 `runAsNonRoot: true` 后 Pod 会启动失败。

### A5. B) ResourceQuota 限制整个 Namespace 的总量，LimitRange 为单个 Pod 设置默认值

### A6. C) 仅 RoleBinding 所在的 Namespace
RoleBinding 引用 ClusterRole 时，权限范围由 Binding 决定，只在 RoleBinding 所在的 Namespace 生效。这是 ClusterRole 跨 Namespace 复用权限规则的常见方式，而非扩大权限范围。

### A7. C) `kubectl exec -it mypod -- bash`
- `kubectl get pods` → 需要 `pods` 的 `list` 权限
- `kubectl logs` → 需要 `pods/log` 子资源的 `get` 权限
- `kubectl exec` → 需要 `pods/exec` 子资源的 `create` 权限
- `kubectl delete pod` → 需要 `pods` 的 `delete` 权限

### A8. RBAC 四个核心对象
```
Role：Namespace 级别的权限规则（能访问哪些 API、执行哪些操作）
ClusterRole：集群级别的权限规则（也可被 RoleBinding 引用，只在该 NS 生效）
RoleBinding：将 Role/ClusterRole 绑定到 User/Group/ServiceAccount（Namespace 内生效）
ClusterRoleBinding：将 ClusterRole 绑定到主体（全集群生效）
```

### A9. 不使用 default SA 的原因
```
1. default SA 权限不可控——不同版本的 K8S 对 default SA 的权限策略不同
2. 无法区分应用——多个 Pod 用同一个 SA，审计时无法区分
3. 最小权限原则——每个应用应该只有必要的权限

最佳实践：
  - 每个应用创建独立 ServiceAccount
  - 通过 RoleBinding 授予最小必要权限
  - 在 Pod spec 中显式指定 serviceAccountName
  - 定期用 kubectl auth can-i --list 审计权限
```

### A10. NetworkPolicy 默认行为
```
默认：所有 Pod 之间网络完全互通（无限制）

白名单安全策略实现：
  1. 先创建一个"拒绝所有入站"的 NetworkPolicy
  2. 再逐条创建"允许特定来源"的 NetworkPolicy

  # 步骤1：默认拒绝
  podSelector: {}, policyTypes: [Ingress], ingress: []

  # 步骤2：允许前端访问 API
  podSelector: {app: api}, ingress: [{from: [{podSelector: {app: frontend}}]}]
```

### A11. allowPrivilegeEscalation: false
```
allowPrivilegeEscalation 控制容器是否可以"提权"：

  false → 容器进程不能通过 setuid/setgid 提升权限
  true  → 允许提权（默认值）

为什么重要？
  - 即使以普通用户运行（runAsUser: 1000），
    如果进程有 setuid 位，仍然可以提权到 root
  - 设置为 false + runAsNonRoot: true = 双重保险

这是 CIS K8S Benchmark 的必检项。
```

### A12. Dispatcher RBAC 配置
```yaml
# ServiceAccount
apiVersion: v1
kind: ServiceAccount
metadata:
  name: dispatcher-sa
  namespace: processing
---
# Role：只允许创建和查看 Job
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  name: dispatcher-role
  namespace: processing
rules:
- apiGroups: ["batch"]
  resources: ["jobs"]
  verbs: ["create", "get", "list", "watch"]  # ❌ 不包含 delete
- apiGroups: [""]
  resources: ["pods", "pods/log"]            # 查看 Job 创建的 Pod 日志
  verbs: ["get", "list", "watch"]
---
# RoleBinding
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  name: dispatcher-binding
  namespace: processing
subjects:
- kind: ServiceAccount
  name: dispatcher-sa
  namespace: processing
roleRef:
  kind: Role
  name: dispatcher-role
  apiGroup: rbac.authorization.k8s.io

# 验证：
# kubectl auth can-i create jobs --as=system:serviceaccount:processing:dispatcher-sa -n processing
# → yes
# kubectl auth can-i delete jobs --as=system:serviceaccount:processing:dispatcher-sa -n processing
# → no
```

---

## 🔧 实操练习

```bash
export KUBECONFIG=~/.kube/sealos.yaml
kubectl create namespace k8s-training

# 1. 创建 ServiceAccount
kubectl create sa app-sa -n k8s-training

# 2. 创建 Role（只允许操作 Pod）
kubectl apply -f - <<EOF
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  name: pod-reader
  namespace: k8s-training
rules:
- apiGroups: [""]
  resources: ["pods"]
  verbs: ["get", "list", "watch"]
EOF

# 3. 创建 RoleBinding
kubectl apply -f - <<EOF
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  name: app-sa-pod-reader
  namespace: k8s-training
subjects:
- kind: ServiceAccount
  name: app-sa
  namespace: k8s-training
roleRef:
  kind: Role
  name: pod-reader
  apiGroup: rbac.authorization.k8s.io
EOF

# 4. 验证权限
kubectl auth can-i list pods --as=system:serviceaccount:k8s-training:app-sa -n k8s-training
# 应输出: yes

kubectl auth can-i create deployments --as=system:serviceaccount:k8s-training:app-sa -n k8s-training
# 应输出: no

# 5. 查看 RBAC 资源
kubectl get roles,rolebindings -n k8s-training

# 6. 创建 ResourceQuota
kubectl apply -f - <<EOF
apiVersion: v1
kind: ResourceQuota
metadata:
  name: training-quota
  namespace: k8s-training
spec:
  hard:
    pods: "10"
    services: "5"
    requests.cpu: "2"
    requests.memory: "4Gi"
EOF

kubectl describe resourcequota training-quota -n k8s-training

# ⚠️ 清理！
kubectl delete namespace k8s-training
```

---

**上一章**：[第7章：调度与弹性伸缩](./07-scheduling-autoscaling.md) | **下一章**：[第9章：运维与故障排查](./09-operations.md)
