# 第4章：ConfigMap、Secret 与存储

## 🎯 学习目标
- 掌握 ConfigMap 管理非敏感配置
- 掌握 Secret 管理敏感信息
- 理解 PV/PVC 存储模型
- 掌握不同存储挂载方式

---

## 📖 学习要点

### 4.1 配置管理的重要性

**12-Factor App 原则**：「配置与代码分离」

```
❌ 硬编码配置（不推荐）：
image: mysql:8.0
env:
  - name: DB_HOST
    value: "10.244.1.5"      # IP 可能变
  - name: DB_PASSWORD
    value: "my-secret-pwd"   # 明文密码写代码里！

✅ 外部化配置（推荐）：
image: mysql:8.0
env:
  - name: DB_HOST
    valueFrom:
      configMapKeyRef:
        name: app-config
        key: db_host
  - name: DB_PASSWORD
    valueFrom:
      secretKeyRef:
        name: app-secret
        key: db_password
```

### 4.2 ConfigMap

**用途**：存储非敏感配置（数据库地址、端口号、环境标识等）

#### 创建方式

```bash
# 方式1：从字面量创建
kubectl create configmap app-config \
  --from-literal=DB_HOST=mysql-service \
  --from-literal=DB_PORT=3306 \
  -n k8s-training

# 方式2：从文件创建
kubectl create configmap nginx-config \
  --from-file=nginx.conf \
  -n k8s-training

# 方式3：从目录创建（每个文件一个 key）
kubectl create configmap app-config \
  --from-file=config/ \
  -n k8s-training

# 方式4：从 YAML 创建
kubectl apply -f configmap.yaml
```

#### YAML 定义

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: app-config
  namespace: k8s-training
data:
  # 简单键值对
  DB_HOST: "mysql-service"
  DB_PORT: "3306"
  APP_ENV: "production"
  # 多行配置（注意竖线 | 保留换行）
  application.yml: |
    server:
      port: 8080
    spring:
      datasource:
        url: jdbc:mysql://${DB_HOST}:${DB_PORT}/mydb
```

#### 在 Pod 中使用 ConfigMap

```yaml
# 方式1：环境变量
spec:
  containers:
  - name: app
    env:
    - name: DATABASE_HOST          # 容器内环境变量名
      valueFrom:
        configMapKeyRef:
          name: app-config         # ConfigMap 名
          key: DB_HOST             # 要取的 key
    # 一次性导入所有 key
    envFrom:
    - configMapRef:
        name: app-config

---
# 方式2：挂载为文件（配置文件场景）
spec:
  containers:
  - name: app
    volumeMounts:
    - name: config-volume
      mountPath: /etc/config       # 挂载目录
  volumes:
  - name: config-volume
    configMap:
      name: app-config
      # 可选：指定哪些 key，以及文件权限
      items:
      - key: application.yml
        path: application.yml
        mode: 0644
```

### 4.3 Secret

**用途**：存储敏感信息（密码、Token、证书、SSH Key）

**面试考点**：ConfigMap vs Secret 的区别？
> 1. Secret 存储的值是 **base64 编码**（不是加密！只是编码）
> 2. Secret 在传输和存储时可以启用 **加密 at rest**（etcd 加密）
> 3. Secret 访问需要 **RBAC 权限控制**
> 4. Secret 有大小限制（1MB）
> 5. 生产环境建议使用 **External Secrets Operator** 或 Vault

#### Secret YAML

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: app-secret
  namespace: k8s-training
type: Opaque                     # 通用类型
data:
  # ⚠️ data 字段的值必须是 base64 编码
  username: YWRtaW4=            # echo -n "admin" | base64
  password: cEBzc3cwcmQ=        # echo -n "p@ssw0rd" | base64
---
# stringData 字段可以直接写明文（K8S 自动编码）
apiVersion: v1
kind: Secret
metadata:
  name: app-secret
  namespace: k8s-training
type: Opaque
stringData:                      # ⭐ 明文，方便使用
  username: admin
  password: p@ssw0rd
```

#### Secret 常见类型

| 类型 | 用途 |
|------|------|
| `Opaque` | 通用（密码、Key） |
| `kubernetes.io/dockerconfigjson` | Docker 镜像仓库凭证 |
| `kubernetes.io/tls` | TLS 证书 |
| `kubernetes.io/basic-auth` | Basic Auth |

#### Docker 镜像仓库凭证（拉私有镜像必备）

```bash
# 创建镜像仓库凭证
kubectl create secret docker-registry regcred \
  --docker-server=registry.example.com \
  --docker-username=admin \
  --docker-password=pass123 \
  -n k8s-training

# 在 Pod 中引用
spec:
  imagePullSecrets:
  - name: regcred
  containers:
  - name: app
    image: registry.example.com/myapp:v1
```

### 4.4 PV / PVC 存储模型

**为什么需要 PV/PVC？**
- Pod 是临时的，重建后数据丢失
- 需要持久化存储（数据库、文件上传等）
- 不同云厂商/存储类型差异大，需要抽象

```
管理员创建 PV  ──┐
                 ├──→  用户创建 PVC 绑定  ──→  Pod 使用 PVC
存储类供应 PV  ──┘
```

#### PersistentVolume（PV）

```yaml
apiVersion: v1
kind: PersistentVolume
metadata:
  name: mysql-pv
spec:
  capacity:
    storage: 10Gi
  accessModes:
    - ReadWriteOnce              # 单节点读写
  persistentVolumeReclaimPolicy: Retain
  storageClassName: manual       # 定义了一个名称
  # hostPath 是最简单的，生产用 NFS/Ceph/云盘
  hostPath:
    path: /data/mysql
    type: DirectoryOrCreate
```

#### PersistentVolumeClaim（PVC）

```yaml
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: mysql-pvc
  namespace: k8s-training
spec:
  accessModes:
    - ReadWriteOnce
  resources:
    requests:
      storage: 5Gi               # 申请 5Gi
  storageClassName: manual       # 和上面定义的名称符合
```

#### Pod 挂载 PVC

```yaml
spec:
  containers:
  - name: mysql
    image: mysql:8.0
    volumeMounts:
    - name: mysql-data
      mountPath: /var/lib/mysql   # MySQL 数据目录
  volumes:
  - name: mysql-data
    persistentVolumeClaim:
      claimName: mysql-pvc        # 引用 PVC
```

#### accessModes 类型

| 模式 | 缩写 | 说明 |
|------|------|------|
| ReadWriteOnce | RWO | 单节点读写（最常用） |
| ReadOnlyMany | ROX | 多节点只读 |
| ReadWriteMany | RWX | 多节点读写（如 NFS） |

#### 回收策略

| 策略 | 说明 |
|------|------|
| Retain | PVC 删除后保留数据，需手动清理 |
| Delete | PVC 删除时自动删除 PV 和数据 |
| Recycle | 已废弃，执行 rm -rf |

### 4.5 StorageClass（动态供应）

生产环境推荐使用 StorageClass，自动创建 PV：

```yaml
apiVersion: storage.k8s.io/v1
kind: StorageClass
metadata:
  name: fast-ssd
provisioner: kubernetes.io/aws-ebs  # 云厂商 provisioner
parameters:
  type: gp3
  fsType: ext4
reclaimPolicy: Delete
volumeBindingMode: WaitForFirstConsumer  # 延迟绑定，调度后再创建
```

```yaml
# PVC 指定 storageClassName，自动创建 PV
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: dynamic-pvc
spec:
  accessModes:
    - ReadWriteOnce
  storageClassName: fast-ssd     # ⭐ 使用 StorageClass
  resources:
    requests:
      storage: 20Gi
```

### 4.6 emptyDir 和 hostPath

```yaml
# emptyDir：Pod 临时存储，Pod 删除后数据丢失
# 用途：容器间共享数据、缓存
volumes:
- name: cache
  emptyDir: {}

# hostPath：挂载 Node 本地目录
# 用途：开发测试，生产不推荐（Pod 漂移到其他 Node 数据丢失）
volumes:
- name: host-data
  hostPath:
    path: /var/data
    type: DirectoryOrCreate
```

---

## 📝 习题

### 选择题

**Q1.** ConfigMap 中 data 字段的值是什么格式？
- A) 明文
- B) base64 编码
- C) AES 加密
- D) MD5 哈希

**Q2.** Secret 中存储的密码是安全的吗？

- A) 是，Secret 自动加密
- B) 不是，默认只 base64 编码，需要额外配置 etcd 加密
- C) Secret 不存储敏感信息
- D) 取决于 Pod 的权限

**Q3.** PV 的 accessModes 中 `ReadWriteOnce` 表示？
- A) 多个节点可以读写
- B) 只有一个节点可以读写
- C) 所有节点只读
- D) 只能写一次

**Q4.** Pod 删除后，哪种 Volume 的数据会保留？
- A) emptyDir
- B) hostPath
- C) persistentVolumeClaim
- D) B 和 C 都可能

**Q5.** 动态存储供应需要什么？
- A) 手动创建 PV
- B) StorageClass + Storage Provisioner
- C) ConfigMap
- D) Secret

### 简答题

**Q6.** 请比较 ConfigMap 和 Secret 的区别。

**Q7.** 请解释 PV、PVC、StorageClass 三者的关系。

**Q8.** 为什么生产环境不建议使用 hostPath？

---

## ✅ 参考答案

### A1. A) 明文
ConfigMap 的 data 字段直接存明文字符串。而 Secret 的 data 字段是 base64 编码。

### A2. B) 不是，默认只 base64 编码
base64 不是加密，只是编码，任何人都能解码。要安全需要：
1. 配置 etcd 加密（EncryptionConfiguration）
2. 启用 RBAC 限制 Secret 访问
3. 考虑使用 Vault/External Secrets

### A3. B) 只有一个节点可以读写
ReadWriteOnce = RWO = 单节点读写。这是最常见的模式。

### A4. D) B 和 C 都可能
- emptyDir：Pod 删除数据丢失 ❌
- hostPath：数据在 Node 本地，Pod 删除但文件还在 ✅
- PVC：数据在持久化存储中，Pod 删除不影响 ✅

### A5. B) StorageClass + Storage Provisioner
StorageClass 定义存储类型，Provisioner 负责自动创建 PV。PVC 指定 storageClassName 后自动完成供应。

### A6. ConfigMap vs Secret

| 对比项 | ConfigMap | Secret |
|--------|-----------|--------|
| 存储内容 | 非敏感配置 | 敏感信息 |
| 数据格式 | 明文 | base64 编码 |
| 大小限制 | 1MB | 1MB |
| 安全性 | 普通 RBAC | 需要更严格的 RBAC |
| etcd 加密 | 通常不需要 | 建议启用 |
| 使用方式 | 环境变量/文件 | 环境变量/文件/imagePullSecrets |
| 生产建议 | 可以 | 用 Vault/External Secrets |

### A7. PV、PVC、StorageClass 的关系

```
StorageClass：存储"类型"的模板（如 SSD、HDD）
  ↓ 定义
Provisioner：自动创建 PV 的插件
  ↓ 创建
PersistentVolume（PV）：集群级别的存储资源（类似"磁盘"）
  ↓ 被绑定
PersistentVolumeClaim（PVC）：用户对存储的请求（类似"申请单"）
  ↓ 被使用
Pod：通过 volumeMounts 挂载 PVC

静态供应：管理员手动创建 PV → PVC 绑定 PV
动态供应：PVC 指定 StorageClass → Provisioner 自动创建 PV
```

### A8. 不建议 hostPath 的原因
1. **数据不安全**：Node 故障时数据丢失
2. **调度问题**：Pod 漂移到其他 Node 后找不到原来的数据
3. **安全风险**：可以访问宿主机文件系统
4. **隔离性差**：多 Pod 可能冲突
5. **不适合集群环境**：违反了 Pod 的可移植性

---

## 🔧 实操练习

```bash
export KUBECONFIG=~/.kube/sealos.yaml
kubectl create namespace k8s-training

# 1. 创建 ConfigMap
kubectl create configmap app-config \
  --from-literal=APP_ENV=production \
  --from-literal=LOG_LEVEL=info \
  -n k8s-training

# 2. 创建 Secret
kubectl create secret generic app-secret \
  --from-literal=username=admin \
  --from-literal=password=MySecret123 \
  -n k8s-training

# 3. 查看创建的资源
kubectl get configmap,secret -n k8s-training

# 4. 查看 Secret 的值（解码）
kubectl get secret app-secret -o jsonpath='{.data.password}' -n k8s-training | base64 -d
echo

# 5. 创建使用 ConfigMap 和 Secret 的 Pod
kubectl apply -f - <<EOF
apiVersion: v1
kind: Pod
metadata:
  name: config-demo
  namespace: k8s-training
spec:
  containers:
  - name: app
    image: busybox:1.36
    command: ['sh', '-c', 'echo "ENV: $APP_ENV" && echo "USER: $DB_USER" && echo "PASS: $DB_PASS" && sleep 60']
    env:
    - name: APP_ENV
      valueFrom:
        configMapKeyRef:
          name: app-config
          key: APP_ENV
    - name: DB_USER
      valueFrom:
        secretKeyRef:
          name: app-secret
          key: username
    - name: DB_PASS
      valueFrom:
        secretKeyRef:
          name: app-secret
          key: password
    resources:
      requests:
        cpu: "10m"
        memory: "16Mi"
      limits:
        cpu: "50m"
        memory: "32Mi"
EOF

# 6. 查看 Pod 日志验证配置注入成功
kubectl logs config-demo -n k8s-training

# ⚠️ 清理！
kubectl delete namespace k8s-training
```

---

**上一章**：[第3章：Service 与网络](./03-service-networking.md) | **下一章**：[第5章：Helm 包管理](./05-helm.md)
