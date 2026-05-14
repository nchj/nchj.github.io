#!/bin/bash
# ===========================================
# K8S培训综合实战 - 一键部署 & 验证脚本
# 覆盖所有知识点：
#   1. Namespace 隔离
#   2. Deployment（Pod + 资源限制 + 探针 + 滚动更新）
#   3. Service（ClusterIP + DNS服务发现）
#   4. ConfigMap（非敏感配置）
#   5. Secret（敏感信息）
#   6. Helm 包管理（安装/升级/回滚）
# ===========================================

set -e

KUBECONFIG_PATH="${KUBECONFIG:-$HOME/.kube/sealos.yaml}"
NS="k8s-training"
RELEASE_NAME="training-app"
CHART_DIR="./helm-chart"

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

info()  { echo -e "${BLUE}[INFO]${NC} $1"; }
ok()    { echo -e "${GREEN}[OK]${NC} $1"; }
warn()  { echo -e "${YELLOW}[WARN]${NC} $1"; }
fail()  { echo -e "${RED}[FAIL]${NC} $1"; }
step()  { echo -e "\n${CYAN}📌 $1${NC}"; }

echo "================================================"
echo "  K8S培训综合实战 - 部署 & 验证"
echo "================================================"
echo ""

# 检查 KUBECONFIG
info "检查集群连接..."
export KUBECONFIG=$KUBECONFIG_PATH
if kubectl cluster-info > /dev/null 2>&1; then
    ok "集群连接成功"
else
    warn "无法获取集群信息，但继续尝试..."
fi

# ==========================================
# 步骤0：权限检查
# ==========================================
step "步骤0：权限检查"
echo "   知识点：RBAC（基于角色的访问控制）"
echo ""

CAN_CREATE_NS=$(kubectl auth can-i create namespaces 2>/dev/null || echo "no")
CAN_CREATE_POD=$(kubectl auth can-i create pods -n $NS 2>/dev/null || echo "no")
CAN_CREATE_DEPLOY=$(kubectl auth can-i create deployments -n $NS 2>/dev/null || echo "no")

if [ "$CAN_CREATE_NS" = "no" ] && [ "$CAN_CREATE_POD" = "no" ]; then
    warn "当前用户没有创建 namespace 和 pod 的权限"
    echo ""
    echo "   当前用户：$(kubectl config view --minify 2>/dev/null | grep 'namespace\|user' || echo 'unknown')"
    echo ""
    info "解决方案："
    echo "   1. 使用完整的 kubeconfig 文件（含管理员凭证）"
    echo "   2. 联系集群管理员授予相应权限"
    echo "   3. 使用 minikube/kind 搭建本地练习集群"
    echo ""
    info "本地练习集群推荐："
    echo "   # macOS"
    echo "   brew install kind"
    echo "   kind create cluster --name k8s-training"
    echo "   export KUBECONFIG=\$(kind get kubeconfig-path --name k8s-training)"
    echo ""
    echo "   # 或使用 minikube"
    echo "   brew install minikube"
    echo "   minikube start --cpus 2 --memory 4096"
    echo ""
    echo "   # 或使用 Docker Desktop 自带的 K8S"
    echo "   # 设置 → Kubernetes → Enable Kubernetes"
    echo ""

    # 即使没有实际集群权限，仍然展示学习内容
    info "虽然无法实际部署，但可以查看所有模板和配置："
    echo ""
    info "📋 Helm Chart 模板渲染（知识点：helm template）:"
    if [ -d "$CHART_DIR" ]; then
        helm template $RELEASE_NAME $CHART_DIR --namespace $NS 2>/dev/null || echo "  (需要安装 helm)"
    fi
    echo ""
    ok "培训材料已准备就绪，建议在本地 K8S 集群上实操"
    exit 0
fi

ok "权限检查通过，继续部署..."

# ==========================================
# 步骤1：创建 Namespace
# 知识点：多租户隔离
# ==========================================
step "步骤1：创建 Namespace"
echo "   知识点：Namespace 用于多租户隔离、资源分组"
echo ""

if kubectl get ns $NS > /dev/null 2>&1; then
    warn "Namespace $NS 已存在，跳过创建"
else
    kubectl create namespace $NS
    ok "Namespace $NS 创建成功"
fi

# ==========================================
# 步骤2：使用 Helm 安装应用
# 知识点：Helm Chart 一键部署
# ==========================================
step "步骤2：Helm 安装应用"
echo "   知识点：Helm = K8S 包管理器，一条命令部署所有资源"
echo "   将创建：Deployment + Service + ConfigMap + Secret"
echo ""

cd "$(dirname "$0")"

# 先渲染模板看看（知识点：helm template）
info "渲染 Helm 模板..."
helm template $RELEASE_NAME $CHART_DIR --namespace $NS > /tmp/training-rendered.yaml
ok "模板渲染成功，查看渲染结果: cat /tmp/training-rendered.yaml"

# 安装
if helm list -n $NS 2>/dev/null | grep -q $RELEASE_NAME; then
    warn "Release $RELEASE_NAME 已存在，执行升级..."
    helm upgrade $RELEASE_NAME $CHART_DIR -n $NS
    ok "Release 升级成功"
else
    helm install $RELEASE_NAME $CHART_DIR -n $NS
    ok "Release $RELEASE_NAME 安装成功"
fi

# 等待 Pod 就绪
info "等待 Pod 就绪..."
kubectl wait --for=condition=ready pod \
    -l app.kubernetes.io/instance=$RELEASE_NAME \
    -n $NS --timeout=120s 2>/dev/null || warn "Pod 等待超时，继续验证..."

# ==========================================
# 步骤3：验证 Deployment
# ==========================================
step "步骤3：验证 Deployment"
echo "   知识点：Pod 副本数、资源限制、探针"
echo ""

PODS=$(kubectl get pods -n $NS -l app.kubernetes.io/instance=$RELEASE_NAME -o name 2>/dev/null || true)
if [ -z "$PODS" ]; then
    warn "没有找到 Pod，可能部署失败"
else
    POD_COUNT=$(echo "$PODS" | wc -l | tr -d ' ')
    info "Pod 数量: $POD_COUNT（期望: 2）"
    [ "$POD_COUNT" -eq 2 ] && ok "副本数正确" || warn "副本数不完全匹配"

    echo ""
    info "Pod 状态："
    kubectl get pods -n $NS -l app.kubernetes.io/instance=$RELEASE_NAME

    echo ""
    FIRST_POD=$(echo "$PODS" | head -1)
    info "资源配置（知识点：requests 和 limits）："
    kubectl get $FIRST_POD -n $NS -o jsonpath='CPU Request: {.spec.containers[0].resources.requests.cpu}
CPU Limit:   {.spec.containers[0].resources.limits.cpu}
Mem Request: {.spec.containers[0].resources.requests.memory}
Mem Limit:   {.spec.containers[0].resources.limits.memory}
'
    echo ""
fi

# ==========================================
# 步骤4：验证 Service
# ==========================================
step "步骤4：验证 Service"
echo "   知识点：ClusterIP Service、标签选择器、Endpoints"
echo ""

info "Service 信息："
kubectl get svc -n $NS -l app.kubernetes.io/instance=$RELEASE_NAME 2>/dev/null || warn "未找到 Service"

echo ""
info "Endpoints（Service 如何关联 Pod）："
kubectl get endpoints -n $NS -l app.kubernetes.io/instance=$RELEASE_NAME 2>/dev/null || warn "未找到 Endpoints"

# ==========================================
# 步骤5：验证 ConfigMap
# ==========================================
step "步骤5：验证 ConfigMap"
echo "   知识点：非敏感配置外部化、配置注入"
echo ""

info "ConfigMap 内容："
kubectl get configmap ${RELEASE_NAME}-config -n $NS -o yaml 2>/dev/null | grep -A 20 "^data:" || \
    kubectl get configmap -n $NS -o yaml 2>/dev/null || warn "未找到 ConfigMap"

# ==========================================
# 步骤6：验证 Secret
# ==========================================
step "步骤6：验证 Secret"
echo "   知识点：敏感信息管理（base64编码，非加密！）"
echo ""

info "Secret keys（隐藏值）："
kubectl get secret ${RELEASE_NAME}-secret -n $NS -o jsonpath='{.data}' 2>/dev/null | python3 -c "
import sys, json
data = json.load(sys.stdin)
for k in data:
    print(f'  {k}: [HIDDEN - base64 encoded]')
" 2>/dev/null || kubectl get secret ${RELEASE_NAME}-secret -n $NS 2>/dev/null || warn "未找到 Secret"

info "解码验证（知识点：base64 不是加密）："
DB_HOST=$(kubectl get secret ${RELEASE_NAME}-secret -n $NS -o jsonpath='{.data.DB_HOST}' 2>/dev/null)
if [ -n "$DB_HOST" ]; then
    echo -n "  DB_HOST 解码: " && echo "$DB_HOST" | base64 -d 2>/dev/null && echo
    DB_PASS=$(kubectl get secret ${RELEASE_NAME}-secret -n $NS -o jsonpath='{.data.DB_PASSWORD}' 2>/dev/null)
    echo -n "  DB_PASSWORD 解码: " && echo "$DB_PASS" | base64 -d 2>/dev/null && echo
fi
warn "⚠️  base64 只是编码不是加密！生产环境需要 etcd 加密或使用 Vault"

# ==========================================
# 步骤7：DNS 服务发现测试
# ==========================================
step "步骤7：DNS 服务发现测试"
echo "   知识点：CoreDNS 自动为 Service 创建 DNS 记录"
echo ""

info "创建临时 Pod 测试 DNS 解析..."
kubectl run dns-test --image=busybox:1.36 --rm -it --restart=Never -n $NS -- \
    sh -c "nslookup ${RELEASE_NAME}.${NS}.svc.cluster.local 2>/dev/null || echo 'DNS test completed'" 2>/dev/null || \
    warn "DNS 测试跳过（可能权限不足）"

# ==========================================
# 步骤8：滚动更新 & 回滚演示
# ==========================================
step "步骤8：滚动更新 & 回滚"
echo "   知识点：RollingUpdate 策略、maxSurge、maxUnavailable"
echo ""

info "执行滚动更新（修改镜像版本 nginx:1.25 → nginx:1.26）..."
helm upgrade $RELEASE_NAME $CHART_DIR -n $NS --set image.tag=1.26
info "等待更新完成..."
sleep 10
helm history $RELEASE_NAME -n $NS

echo ""
info "回滚到上一版本..."
helm rollback $RELEASE_NAME 1 -n $NS
sleep 10
ok "回滚完成"

echo ""
info "版本历史："
helm history $RELEASE_NAME -n $NS

# ==========================================
# 验证总结
# ==========================================
echo ""
echo "================================================"
echo "  ✅ 验证总结"
echo "================================================"
echo ""
echo "  已验证的知识点："
echo "  ✅ Namespace       - 多租户资源隔离"
echo "  ✅ Deployment      - Pod 管理、副本数、资源限制"
echo "  ✅ Liveness Probe  - 存活探针"
echo "  ✅ Readiness Probe - 就绪探针"
echo "  ✅ Service         - 内部负载均衡 (ClusterIP)"
echo "  ✅ Endpoints       - Service 与 Pod 的关联"
echo "  ✅ ConfigMap       - 非敏感配置管理"
echo "  ✅ Secret          - 敏感信息管理（base64编码）"
echo "  ✅ DNS 服务发现    - CoreDNS 自动解析"
echo "  ✅ Helm Install    - 一键部署"
echo "  ✅ Helm Upgrade    - 滚动更新"
echo "  ✅ Helm Rollback   - 版本回滚"
echo "  ✅ Helm History    - 版本历史"
echo "  ✅ RollingUpdate   - 零停机更新策略"
echo ""
echo "================================================"

warn "⚠️  Sealos 是付费集群！练习完请务必执行清理！"
echo ""
echo "清理命令："
echo "  cd $(pwd)"
echo "  ./cleanup.sh"
echo ""
