# 第3章：Service 与网络

## 🎯 学习目标
- 理解 K8S 网络模型：每个 Pod 都有独立 IP
- 掌握 Service 的四种类型和使用场景
- 理解 Ingress 的工作原理
- 掌握 DNS 服务发现机制

---

## 📖 学习要点

### 3.1 K8S 网络模型

K8S 网络有三大基本要求（CNI 实现）：
1. **所有 Pod 之间可以直接通信**（不经过 NAT）
2. **所有 Node 和所有 Pod 之间可以直接通信**
3. **Pod 看到自己的 IP 和其他 Pod 的 IP 是一样的**

```
┌──────────────┐       ┌──────────────┐
│   Pod A      │       │   Pod B      │
│ 10.244.1.5   │──────▶│ 10.244.2.3   │
│              │  直接  │              │
└──────────────┘  通信  └──────────────┘
       ▲                    ▲
       │                    │
       └────────┬───────────┘
                │
         ┌──────┴──────┐
         │   CNI 插件    │
         │ (Calico等)   │
         └─────────────┘
```

### 3.2 为什么需要 Service？

**问题**：Pod IP 是不稳定的！
- Pod 每次重建 IP 都会变
- 水平扩缩时 Pod 数量会变
- 客户端不可能记住一堆会变的 IP

**解决**：Service 提供稳定的 VIP（虚拟 IP）和 DNS 名称

```
          ┌──────────┐
          │ Service  │
          │ ClusterIP│
          │10.0.0.100│
          └────┬─────┘
               │ 负载均衡
        ┌──────┼──────┐
        ▼      ▼      ▼
     ┌─────┐┌─────┐┌─────┐
     │Pod 1││Pod 2││Pod 3│
     │.1.5 ││.2.3 ││.2.4 │
     └─────┘└─────┘└─────┘
     
  Pod 3 挂了？Service 自动从 Endpoints 移除
  新 Pod 加入？Service 自动加入 Endpoints
```

### 3.3 Service 四种类型（面试必背）

| 类型 | 说明 | 使用场景 |
|------|------|---------|
| **ClusterIP** | 默认值，仅集群内部可访问 | 内部服务通信（微服务间） |
| **NodePort** | 每个节点开放一个端口 | 开发测试、简单外部访问 |
| **LoadBalancer** | 云厂商创建外部负载均衡 | 生产环境对外暴露服务 |
| **ExternalName** | DNS 级别的 CNAME 映射 | 引用外部服务（如 RDS） |

#### ClusterIP Service（最常用）

```yaml
apiVersion: v1
kind: Service
metadata:
  name: nginx-service
  namespace: k8s-training
spec:
  type: ClusterIP           # 默认值
  selector:                  # 通过 label 选择后端 Pod
    app: nginx
  ports:
  - port: 80                # Service 端口
    targetPort: 80           # Pod 端口
    protocol: TCP
```

```bash
# 集群内部访问方式：
# 1. Service IP
curl http://10.0.0.100:80

# 2. DNS（推荐）⚡
curl http://nginx-service.k8s-training.svc.cluster.local

# 3. 同 namespace 内可简写
curl http://nginx-service
```

#### NodePort Service

```yaml
apiVersion: v1
kind: Service
metadata:
  name: nginx-nodeport
spec:
  type: NodePort
  selector:
    app: nginx
  ports:
  - port: 80                # Service 端口
    targetPort: 80           # Pod 端口
    nodePort: 30080          # 节点端口（30000-32767）
```

```
外部请求 → NodeIP:30080 → kube-proxy(iptables) → Pod:80
```

#### LoadBalancer Service

```yaml
apiVersion: v1
kind: Service
metadata:
  name: nginx-lb
spec:
  type: LoadBalancer
  selector:
    app: nginx
  ports:
  - port: 80
    targetPort: 80
```

> 云厂商（AWS/GCP/阿里云）会自动创建一个 ELB/SLB 并分配公网 IP。Sealos 环境也支持。

### 3.4 DNS 服务发现（面试高频）

K8S 内置 DNS 服务（CoreDNS），自动为 Service 创建 DNS 记录：

```
完整 FQDN 格式：
<service-name>.<namespace>.svc.cluster.local

示例：
nginx-service.k8s-training.svc.cluster.local

简写规则：
- 同 namespace:          nginx-service
- 跨 namespace:          nginx-service.k8s-training
- 完整:                  nginx-service.k8s-training.svc.cluster.local
```

**面试题**：Pod 内 `nginx-service` 是如何解析到 Service ClusterIP 的？
> Pod 的 `/etc/resolv.conf` 中配置了 `nameserver` 指向 CoreDNS Service IP，`search` 配置了 namespace 和 `svc.cluster.local`。所以 `nginx-service` 会先尝试 `nginx-service.k8s-training.svc.cluster.local`。

### 3.5 Headless Service

将 `clusterIP: None`，DNS 直接解析到 Pod IP：

```yaml
apiVersion: v1
kind: Service
metadata:
  name: mysql-headless
spec:
  clusterIP: None            # Headless!
  selector:
    app: mysql
  ports:
  - port: 3306
```

```
# 普通 Service DNS 解析：
mysql-service → 10.0.0.100 (ClusterIP)

# Headless Service DNS 解析：
mysql-headless → 10.244.1.5, 10.244.2.3, 10.244.2.4 (直接是 Pod IP 列表)
```

**使用场景**：StatefulSet 需要每个 Pod 有独立的 DNS 记录：
```
mysql-0.mysql-headless.namespace.svc.cluster.local → 10.244.1.5
mysql-1.mysql-headless.namespace.svc.cluster.local → 10.244.2.3
```

### 3.6 Ingress（7层路由）

Service 是 4层（TCP/UDP），Ingress 是 7层（HTTP/HTTPS）。

Ingress 后端的 Service 一般使用 ClusterIP，因为 Ingress Controller 运行在集群内部，通过 ClusterIP 访问后端 Pod，而 NodePort 或 LoadBalancer 是用来暴露 Ingress Controller 本身的。

在生产环境中，Ingress Controller 通常通过 LoadBalancer 类型的 Service 暴露，云厂商会提供外部 IP，将外部流量引入集群，再由 Ingress Controller 根据 Ingress 规则转发到后端 ClusterIP Service。

```
互联网用户
    │
    ▼
┌──────────┐
│ Ingress  │ ← 入口控制器（Nginx/Traefik）
│ Controller│
└────┬─────┘
     │ HTTP 路由规则
     ▼
┌──────────────────────────────────┐
│         Ingress 资源              │
│                                  │
│  host: api.example.com → api-svc │
│  host: www.example.com → web-svc │
│  /api/* → api-svc               │
│  /* → web-svc                    │
└──────────────────────────────────┘
     │         │
     ▼         ▼
  [api-svc]  [web-svc]  ← ClusterIP Service
```

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: app-ingress
  namespace: k8s-training
  annotations:
    nginx.ingress.kubernetes.io/rewrite-target: /
spec:
  ingressClassName: nginx          # 指定 Ingress Controller
  rules:
  - host: app.example.com          # 域名
    http:
      paths:
      - path: /api
        pathType: Prefix
        backend:
          service:
            name: api-service      # 得先建 service 一般是clusterip，也可以是其他的，但是没必要
            port:
              number: 80
      - path: /
        pathType: Prefix
        backend:
          service:
            name: web-service
            port:
              number: 80
  tls:                             # HTTPS 配置
  - hosts:
    - app.example.com
    secretName: tls-secret
```

**Ingress vs Service LoadBalancer（面试对比）**：
| 对比项 | LoadBalancer Service | Ingress |
|--------|---------------------|---------|
| 层级 | 4层（TCP） | 7层（HTTP） |
| 成本 | 每个 Service 一个 LB | 多个 Service 共享一个 LB |
| 路由能力 | 无 | 基于域名、路径路由 |
| TLS | 自己处理 | 统一管理证书 |

### 3.7 NetworkPolicy（网络策略）

默认 K8S 中所有 Pod 之间网络是互通的。NetworkPolicy 可以限制流量：

```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: api-policy
  namespace: k8s-training
spec:
  podSelector:
    matchLabels:
      app: api
  policyTypes:
  - Ingress
  ingress:
  - from:
    - podSelector:
        matchLabels:
          app: web            # 只允许 label=web 的 Pod 访问
    ports:
    - port: 8080
```

---

## 📝 习题

### 选择题

**Q1.** K8S 中 Service 的默认类型是？
- A) NodePort
- B) LoadBalancer
- C) ClusterIP
- D) ExternalName

**Q2.** 同一 namespace 下的 Pod 如何通过 DNS 访问名为 `user-service` 的 Service？
- A) user-service.k8s-training.svc.cluster.local
- B) user-service
- C) A 和 B 都可以
- D) 需要直接用 Service IP

**Q3.** NodePort 端口的默认范围是？
- A) 1-1024
- B) 3000-4000
- C) 30000-32767
- D) 80-443

**Q4.** Headless Service 的 clusterIP 设置为什么？
- A) 0.0.0.0
- B) None
- C) 空
- D) 127.0.0.1

**Q5.** Ingress 工作在哪一层？
- A) 第2层（数据链路层）
- B) 第3层（网络层）
- C) 第4层（传输层）
- D) 第7层（应用层）

### 简答题

**Q6.** Service 和 Pod 之间是怎么关联的？Service 如何感知 Pod 的变化？

**Q7.** 请解释 Ingress 和 Service 的关系。有了 Service 为什么还需要 Ingress？

**Q8.** 什么场景下需要用 Headless Service？

### 动手题

**Q9.** 请为上一章的 Nginx Deployment 创建：
1. 一个 ClusterIP Service
2. 一个 NodePort Service
3. 通过端口转发测试 Service 是否正常工作

---

## ✅ 参考答案

### A1. C) ClusterIP
不指定 type 时默认是 ClusterIP，只能在集群内部访问。

### A2. C) A 和 B 都可以
同 namespace 下可以用短名称 `user-service`，K8S DNS 会自动补全。

### A3. C) 30000-32767
NodePort 默认范围是 30000-32767，可以通过 kube-apiserver 的 `--service-node-port-range` 参数修改。

### A4. B) None
`clusterIP: None` 表示 Headless Service，DNS 直接返回 Pod IP 而不是 ClusterIP。

### A5. D) 第7层（应用层）
Ingress 工作在 HTTP/HTTPS 层，可以基于域名和路径做路由。

### A6. Service 与 Pod 的关联
```
1. Service 创建时定义 selector（标签选择器）
2. K8S Endpoints Controller 持续监控匹配 selector 的 Pod
3. 将匹配的 Pod IP:Port 写入 Service 的 Endpoints 对象
4. kube-proxy 监听 Endpoints 变化，更新 iptables/IPVS 规则
5. 流量到达 Service VIP 时，由 iptables/IPVS 负载均衡到 Endpoints 中的 Pod

# 查看自动关联的 Endpoints
kubectl get endpoints nginx-service
```

### A7. Ingress 和 Service 的关系
**Service 是 4 层负载均衡**：只按 IP:Port 转发，不知道 HTTP 域名和路径。
**Ingress 是 7 层路由**：
- 一个 Ingress 可以根据域名/路径路由到多个 Service
- 统一管理 TLS 证书
- 共享一个外部 IP（而不是每个 Service 一个 LoadBalancer）

简单说：**Service 是内部负载均衡，Ingress 是外部流量入口的路由器**。

### A8. Headless Service 使用场景
1. **StatefulSet**：需要每个 Pod 有稳定、独立的 DNS 记录（如 `mysql-0.mysql`）
2. **自行负载均衡**：客户端自己决定连接哪个 Pod（如自定义负载均衡算法）
3. **直接 Pod 发现**：需要知道每个 Pod 的具体 IP

### A9. Service YAML + 测试

```yaml
# ClusterIP Service
apiVersion: v1
kind: Service
metadata:
  name: nginx-clusterip
  namespace: k8s-training
spec:
  type: ClusterIP
  selector:
    app: nginx
  ports:
  - port: 80
    targetPort: 80

---
# NodePort Service
apiVersion: v1
kind: Service
metadata:
  name: nginx-nodeport
  namespace: k8s-training
spec:
  type: NodePort
  selector:
    app: nginx
  ports:
  - port: 80
    targetPort: 80
    nodePort: 30080
```

```bash
# 测试
kubectl port-forward svc/nginx-clusterip 8080:80 -n k8s-training
# 然后另一个终端：
curl http://localhost:8080
```

---

## 🔧 实操练习

```bash
export KUBECONFIG=~/.kube/sealos.yaml
kubectl create namespace k8s-training

# 1. 部署应用
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
---
apiVersion: v1
kind: Service
metadata:
  name: nginx-svc
  namespace: k8s-training
spec:
  type: ClusterIP
  selector:
    app: nginx
  ports:
  - port: 80
    targetPort: 80
EOF

# 2. 查看 Service 和 Endpoints
kubectl get svc -n k8s-training
kubectl get endpoints nginx-svc -n k8s-training

# 3. 端口转发测试
kubectl port-forward svc/nginx-svc 8080:80 -n k8s-training &
sleep 2
curl http://localhost:8080
kill %1

# 4. 创建临时 Pod 测试 DNS
kubectl run test-dns --image=busybox:1.36 --rm -it --restart=Never -n k8s-training -- \
  nslookup nginx-svc.k8s-training.svc.cluster.local

# ⚠️ 清理！
kubectl delete namespace k8s-training
```

---

**上一章**：[第2章：Pod 与工作负载管理](./02-pod-and-workloads.md) | **下一章**：[第4章：ConfigMap、Secret 与存储](./04-config-storage.md)
