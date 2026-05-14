# 第5章：Helm 包管理

## 🎯 学习目标
- 理解 Helm 的作用和核心概念
- 掌握 Helm Chart 的结构
- 能使用 Helm 部署和管理应用
- 理解 values.yaml 模板化配置

---

## 📖 学习要点

### 5.1 为什么需要 Helm？

**问题**：直接用 `kubectl apply -f` 部署的痛点
- 多个 YAML 文件难以管理（Deployment + Service + ConfigMap + Secret + Ingress...）
- 不同环境（dev/staging/prod）配置不同，要维护多份 YAML
- 没有版本管理、没有升级/回滚机制
- 每个项目都从零开始写 YAML，重复劳动

**Helm = K8S 的包管理器**（类似 apt/yum/brew/npm）

```
没有 Helm：
  kubectl apply -f deployment.yaml
  kubectl apply -f service.yaml
  kubectl apply -f configmap.yaml
  kubectl apply -f secret.yaml
  kubectl apply -f ingress.yaml
  # 每次更新都要重复...

用 Helm：
  helm install myapp ./chart         # 一条命令部署全部
  helm upgrade myapp ./chart         # 一条命令升级
  helm rollback myapp 1              # 一条命令回滚
  helm uninstall myapp               # 一条命令卸载
```

### 5.2 Helm 核心概念

| 概念 | 说明 | 类比 |
|------|------|------|
| **Chart** | 一个 K8S 应用的打包格式 | npm 包 / Docker Image |
| **Release** | Chart 的一个运行实例 | Docker 容器 |
| **Repository** | Chart 的仓库 | npm registry / Docker Hub |
| **Values** | 自定义配置值 | 环境变量 / 配置文件 |

```
Chart (模板 + 默认值)
    ↓ helm install + values.yaml
Release (渲染后的 YAML → 部署到 K8S)
```

### 5.3 Chart 目录结构

```
myapp/
├── Chart.yaml              # Chart 元数据（名称、版本、描述）
├── values.yaml             # 默认配置值 ⭐
├── charts/                 # 依赖的子 Chart
├── templates/              # K8S 资源模板 ⭐
│   ├── deployment.yaml
│   ├── service.yaml
│   ├── configmap.yaml
│   ├── ingress.yaml
│   ├── _helpers.tpl        # 模板辅助函数
│   └── NOTES.txt           # 安装后提示信息
└── .helmignore
```

### 5.4 Chart.yaml

```yaml
apiVersion: v2
name: myapp                 # Chart 名称
description: A Helm chart for my application
type: application
version: 0.1.0              # Chart 版本（遵循 SemVer）
appVersion: "1.0.0"         # 应用版本
keywords:
  - web
  - application
maintainers:
  - name: devops-team
    email: devops@example.com
```

### 5.5 values.yaml 与模板化

**values.yaml（默认值）**：

```yaml
# 全局配置
global:
  imageRegistry: ""

# 应用配置
replicaCount: 2

image:
  repository: nginx
  tag: "1.25"
  pullPolicy: IfNotPresent

service:
  type: ClusterIP
  port: 80

resources:
  requests:
    cpu: "100m"
    memory: "64Mi"
  limits:
    cpu: "500m"
    memory: "256Mi"

ingress:
  enabled: false
  className: "nginx"
  host: app.example.com

config:
  APP_ENV: production
  LOG_LEVEL: info
```

**templates/deployment.yaml（模板）**：

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: {{ include "myapp.fullname" . }}
  labels:
    {{- include "myapp.labels" . | nindent 4 }}
spec:
  replicas: {{ .Values.replicaCount }}
  selector:
    matchLabels:
      {{- include "myapp.selectorLabels" . | nindent 6 }}
  template:
    metadata:
      labels:
        {{- include "myapp.selectorLabels" . | nindent 8 }}
    spec:
      containers:
      - name: {{ .Chart.Name }}
        image: "{{ .Values.image.repository }}:{{ .Values.image.tag }}"
        imagePullPolicy: {{ .Values.image.pullPolicy }}
        ports:
        - containerPort: 80
        env:
        {{- range $key, $val := .Values.config }}
        - name: {{ $key }}
          value: {{ $val | quote }}
        {{- end }}
        resources:
          {{- toYaml .Values.resources | nindent 10 }}
```

**模板语法要点**：
```go
{{ .Values.xxx }}           # 引用 values.yaml 的值
{{ .Chart.Name }}           # 引用 Chart 元数据
{{ include "func" . }}      # 调用 _helpers.tpl 中定义的函数
{{- ... | nindent 4 }}      # 缩进4格
{{- range $key, $val := . }} # 循环
{{- if .Values.xxx }}       # 条件判断
```

### 5.6 Helm 常用命令

```bash
# === 仓库管理 ===
helm repo add bitnami https://charts.bitnami.com/bitnami
helm repo update
helm search repo nginx

# === 创建 Chart ===
helm create myapp           # 生成标准 Chart 结构

# === 安装/部署 ===
# 使用默认值
helm install myapp ./myapp -n k8s-training

# 使用自定义 values
helm install myapp ./myapp -n k8s-training \
  -f values-prod.yaml

# 覆盖单个值
helm install myapp ./myapp -n k8s-training \
  --set replicaCount=3 \
  --set image.tag=1.26

# === 查看 ===
helm list -n k8s-training           # 查看已安装的 Release
helm status myapp -n k8s-training   # 查看状态
helm get values myapp -n k8s-training  # 查看当前 values

# === 升级 ===
helm upgrade myapp ./myapp -n k8s-training \
  --set image.tag=1.26

# === 回滚 ===
helm rollback myapp 1 -n k8s-training    # 回滚到 revision 1
helm history myapp -n k8s-training       # 查看历史

# === 卸载 ===
helm uninstall myapp -n k8s-training

# === 调试 ===
helm template myapp ./myapp          # 本地渲染模板（不部署）
helm lint ./myapp                    # 检查 Chart 语法
helm diff upgrade myapp ./myapp      # 查看变更（需要 helm-diff 插件）
```

### 5.7 使用公共 Chart 部署

```bash
# 安装 Bitnami Nginx
helm repo add bitnami https://charts.bitnami.com/bitnami
helm install my-nginx bitnami/nginx -n k8s-training \
  --set replicaCount=2 \
  --set service.type=ClusterIP

# 安装 MySQL
helm install my-db bitnami/mysql -n k8s-training \
  --set auth.rootPassword=MyRootPassword123 \
  --set primary.persistence.size=5Gi
```

### 5.8 多环境配置管理

```bash
# 目录结构
myapp/
├── values.yaml           # 默认值
├── values-dev.yaml       # 开发环境
├── values-staging.yaml   # 预发布环境
└── values-prod.yaml      # 生产环境

# 部署到不同环境
helm install myapp-dev ./myapp -n dev -f values-dev.yaml
helm install myapp-prod ./myapp -n prod -f values-prod.yaml
```

**values-prod.yaml 示例**：
```yaml
replicaCount: 3

image:
  tag: "1.0.0"

resources:
  requests:
    cpu: "500m"
    memory: "512Mi"
  limits:
    cpu: "2000m"
    memory: "2Gi"

ingress:
  enabled: true
  host: app.example.com
```

---

## 📝 习题

### 选择题

**Q1.** Helm 中，一个 Chart 的运行实例称为什么？
- A) Chart
- B) Release
- C) Template
- D) Package

**Q2.** `helm rollback myapp 1` 的作用是？
- A) 删除 myapp
- B) 回滚 myapp 到 revision 1
- C) 更新 myapp 到版本1
- D) 查看 myapp 的历史

**Q3.** Helm 模板中 `{{ .Values.replicaCount }}` 的作用是？
- A) 定义 replicaCount 的值
- B) 引用 values.yaml 中 replicaCount 的值
- C) 创建一个名为 replicaCount 的资源
- D) 删除 replicaCount 配置

**Q4.** `helm template` 命令的作用是？
- A) 部署应用到 K8S
- B) 创建新的 Chart
- C) 本地渲染模板，查看最终 YAML（不部署）
- D) 从仓库下载 Chart

**Q5.** 如何覆盖 values.yaml 中的单个值？
- A) `helm install --value key=value`
- B) `helm install --set key=value`
- C) `helm install --override key=value`
- D) `helm install --env key=value`

### 简答题

**Q6.** Helm 相比直接 `kubectl apply` 有什么优势？

**Q7.** 请描述 Helm 的 Chart、Release、Repository 三者的关系。

**Q8.** 如何实现多环境（dev/prod）的 Helm 配置管理？

### 动手题

**Q9.** 请创建一个 Helm Chart，部署一个 Nginx 应用，要求：
- Chart 名称：webapp
- 支持自定义副本数、镜像标签、Service 类型
- 包含 Deployment 和 Service 模板
- 支持 ConfigMap 配置注入

---

## ✅ 参考答案

### A1. B) Release
Chart 是包模板，Release 是 Chart 的一个部署实例。同一个 Chart 可以安装多次，每次产生不同的 Release。

### A2. B) 回滚 myapp 到 revision 1
rollback 会回滚到指定的历史版本（revision），之前的版本会被保留在 history 中。

### A3. B) 引用 values.yaml 中 replicaCount 的值
`{{ .Values.xxx }}` 是 Go 模板语法，引用 values.yaml 中的配置值。

### A4. C) 本地渲染模板，查看最终 YAML（不部署）
`helm template` 非常有用，可以在不部署的情况下看到渲染后的 K8S YAML，用于调试模板。

### A5. B) `helm install --set key=value`
`--set` 用于覆盖 values.yaml 中的值。也可以用 `-f values-override.yaml` 覆盖多个值。

### A6. Helm 的优势
| 特性 | kubectl apply | Helm |
|------|--------------|------|
| 部署多个资源 | 多条命令 | 一条命令 |
| 参数化 | 手动修改 YAML | values.yaml |
| 多环境 | 多份 YAML | 多个 values 文件 |
| 升级/回滚 | 手动管理 | 内置支持 |
| 版本管理 | 自己用 Git | 内置 history |
| 共享/复用 | 复制粘贴 | Chart 仓库 |

### A7. Chart、Release、Repository 的关系
- **Repository**：Chart 的远程仓库（集中存放）
- **Chart**：从 Repository 下载的"应用包"（包含模板和默认配置）
- **Release**：Chart 在集群上的一个运行实例（一次 `helm install` = 一个 Release）

```
Repository (仓库) → 包含多个 Chart (包)
Chart (包) → 可以创建多个 Release (实例)
Release (实例) → 运行在 K8S 集群中
```

### A8. 多环境配置管理
```
# 方案1：多 values 文件（推荐）
values.yaml          # 公共默认值
values-dev.yaml      # 开发环境覆盖
values-prod.yaml     # 生产环境覆盖

helm install -f values.yaml -f values-dev.yaml ./chart
helm install -f values.yaml -f values-prod.yaml ./chart

# 方案2：--set 覆盖
helm install --set replicaCount=1 ./chart    # dev
helm install --set replicaCount=3 ./chart    # prod

# 方案3：--set-file 引用环境变量文件
helm install --set-file config.env=env/dev.env ./chart
```

### A9. Helm Chart 实现参见实操练习部分。

---

## 🔧 实操练习

```bash
export KUBECONFIG=~/.kube/sealos.yaml
kubectl create namespace k8s-training

# 1. 创建 Chart
helm create webapp
cd webapp

# 2. 修改 values.yaml
cat > values.yaml <<'EOF'
replicaCount: 2

image:
  repository: nginx
  tag: "1.25"
  pullPolicy: IfNotPresent

service:
  type: ClusterIP
  port: 80

resources:
  requests:
    cpu: "50m"
    memory: "32Mi"
  limits:
    cpu: "200m"
    memory: "128Mi"

config:
  APP_ENV: production
  LOG_LEVEL: info
EOF

# 3. 简化 templates/deployment.yaml（用 Helm 默认生成的即可）
# 4. 简化 templates/service.yaml（用 Helm 默认生成的即可）

# 5. 本地渲染检查
helm template mywebapp ./webapp

# 6. 安装
helm install mywebapp ./webapp -n k8s-training

# 7. 查看状态
helm status mywebapp -n k8s-training
helm list -n k8s-training
kubectl get all -n k8s-training

# 8. 升级（改副本数）
helm upgrade mywebapp ./webapp -n k8s-training --set replicaCount=5
kubectl get pods -n k8s-training

# 9. 回滚
helm rollback mywebapp 1 -n k8s-training

# 10. 查看 history
helm history mywebapp -n k8s-training

# ⚠️ 清理！
helm uninstall mywebapp -n k8s-training
cd ..
rm -rf webapp
kubectl delete namespace k8s-training
```

---

**上一章**：[第4章：ConfigMap、Secret 与存储](./04-config-storage.md) | **下一章**：[第6章：部署实战](./06-practice-project.md) | **进阶**：[第7章：调度与弹性伸缩](./07-scheduling-autoscaling.md)
