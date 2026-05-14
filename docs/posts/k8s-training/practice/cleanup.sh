#!/bin/bash
# ===========================================
# K8S培训综合实战 - 清理脚本
# ⚠️ Sealos 是付费的！练习完务必执行！
# ===========================================

set -e

KUBECONFIG_PATH="$HOME/.kube/sealos.yaml"
NS="k8s-training"
RELEASE_NAME="training-app"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

info()  { echo -e "${GREEN}[INFO]${NC} $1"; }
warn()  { echo -e "${YELLOW}[WARN]${NC} $1"; }

export KUBECONFIG=$KUBECONFIG_PATH

echo "================================================"
echo "  🔧 清理 K8S 培训资源"
echo "================================================"
echo ""

# 1. 卸载 Helm Release
info "卸载 Helm Release: $RELEASE_NAME"
if helm list -n $NS 2>/dev/null | grep -q $RELEASE_NAME; then
    helm uninstall $RELEASE_NAME -n $NS
    ok "Release 已卸载"
else
    warn "Release 不存在，跳过"
fi

# 2. 删除 Namespace（会删除该 NS 下所有资源）
info "删除 Namespace: $NS"
if kubectl get ns $NS > /dev/null 2>&1; then
    kubectl delete namespace $NS --timeout=60s
    ok "Namespace 已删除"
else
    warn "Namespace 不存在，跳过"
fi

# 3. 确认清理干净
echo ""
info "验证清理结果："
REMAINING=$(kubectl get all -n $NS 2>/dev/null || echo "Namespace 不存在")
if echo "$REMAINING" | grep -q "No resources"; then
    ok "所有资源已清理干净 ✅"
elif echo "$REMAINING" | grep -q "namespace.*not found"; then
    ok "Namespace 已完全删除 ✅"
else
    warn "可能还有残留资源，请手动检查："
    echo "$REMAINING"
fi

echo ""
echo "================================================"
ok "清理完成！费用停止产生。"
echo "================================================"
