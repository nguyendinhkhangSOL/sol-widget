#!/bin/bash
# ═══════════════════════════════════════════════════════════════
# Setup SSH Key cho sol-vps (103.72.57.11) — chạy 1 lần
# Chạy: bash setup-ssh-sol-vps.sh
# Sau khi xong: ssh sol-vps  (không cần pass)
# ═══════════════════════════════════════════════════════════════
set -e

VPS_USER="${VPS_USER:-solop}"
VPS_HOST="${VPS_HOST:-103.72.57.11}"
VPS_PORT="${VPS_PORT:-22}"
ALIAS_NAME="${ALIAS_NAME:-sol-vps}"

echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "  🔐 Setup SSH Key cho $ALIAS_NAME"
echo "═══════════════════════════════════════════════════════════════"
echo ""
echo "  📋 Cấu hình:"
echo "    Alias:  $ALIAS_NAME"
echo "    User:   $VPS_USER"
echo "    Host:   $VPS_HOST"
echo "    Port:   $VPS_PORT"
echo ""

# ─── STEP 1: ~/.ssh directory ────────────────────────────────
echo "[1/5] 📁 Setup ~/.ssh directory..."
mkdir -p ~/.ssh
chmod 700 ~/.ssh
echo "    ✅ ~/.ssh ready"

# ─── STEP 2: Generate SSH key (nếu chưa có) ──────────────────
echo "[2/5] 🔑 SSH key ed25519..."
PRIVATE_KEY="$HOME/.ssh/id_ed25519"
PUBLIC_KEY="$HOME/.ssh/id_ed25519.pub"

if [ -f "$PRIVATE_KEY" ]; then
    echo "    ⏭  Key đã tồn tại: $PRIVATE_KEY"
    read -p "    Dùng key hiện tại? (Y/n): " REUSE
    if [ "$REUSE" = "n" ] || [ "$REUSE" = "N" ]; then
        BAK_SUFFIX="bak-$(date +%Y%m%d-%H%M%S)"
        mv "$PRIVATE_KEY" "$PRIVATE_KEY.$BAK_SUFFIX"
        [ -f "$PUBLIC_KEY" ] && mv "$PUBLIC_KEY" "$PUBLIC_KEY.$BAK_SUFFIX"
        ssh-keygen -t ed25519 -f "$PRIVATE_KEY" -N "" -C "solop@$ALIAS_NAME-$(date +%Y%m%d)"
        echo "    ✅ Tạo key mới"
    fi
else
    echo "    → Đang tạo key mới..."
    ssh-keygen -t ed25519 -f "$PRIVATE_KEY" -N "" -C "solop@$ALIAS_NAME-$(date +%Y%m%d)"
    echo "    ✅ Tạo key: $PRIVATE_KEY"
fi

# ─── STEP 3: Copy public key lên VPS ─────────────────────────
echo ""
echo "[3/5] 📤 Copy public key lên VPS..."
echo "    ⚠ CẦN nhập pass VPS 1 LẦN CUỐI:"
echo ""

PUB_KEY_CONTENT=$(cat "$PUBLIC_KEY")

ssh -p "$VPS_PORT" "$VPS_USER@$VPS_HOST" "
mkdir -p ~/.ssh
chmod 700 ~/.ssh
echo '$PUB_KEY_CONTENT' >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys
sort -u ~/.ssh/authorized_keys -o ~/.ssh/authorized_keys
echo '✅ Key installed'
"

if [ $? -ne 0 ]; then
    echo ""
    echo "    ❌ SSH copy failed. Kiểm tra:"
    echo "       - VPS host đúng chưa? ($VPS_HOST)"
    echo "       - User đúng chưa? ($VPS_USER)"
    echo "       - Port đúng chưa? ($VPS_PORT)"
    exit 1
fi

echo "    ✅ Public key installed trên VPS"

# ─── STEP 4: Setup ~/.ssh/config với alias ───────────────────
echo ""
echo "[4/5] ⚙️  Setup ~/.ssh/config..."

CONFIG_FILE="$HOME/.ssh/config"
touch "$CONFIG_FILE"
chmod 600 "$CONFIG_FILE"

if grep -q "^Host $ALIAS_NAME$" "$CONFIG_FILE" 2>/dev/null; then
    echo "    ⏭  Alias '$ALIAS_NAME' đã có trong config — skip"
else
    cat >> "$CONFIG_FILE" << EOF

# ─── Sol La Bàn VPS (auto $(date +%Y-%m-%d)) ───
Host $ALIAS_NAME
    HostName $VPS_HOST
    User $VPS_USER
    Port $VPS_PORT
    IdentityFile ~/.ssh/id_ed25519
    IdentitiesOnly yes
    ServerAliveInterval 60
    ServerAliveCountMax 3
    StrictHostKeyChecking accept-new
EOF
    echo "    ✅ Append alias '$ALIAS_NAME' vào $CONFIG_FILE"
fi

# ─── STEP 5: Test connection ─────────────────────────────────
echo ""
echo "[5/5] 🧪 Test connection (không cần pass)..."

TEST_OUTPUT=$(ssh -o BatchMode=yes -o ConnectTimeout=10 "$ALIAS_NAME" "echo CONNECTED as \$(whoami) at \$(hostname)" 2>&1)

if echo "$TEST_OUTPUT" | grep -q "CONNECTED"; then
    echo "    ✅ $TEST_OUTPUT"
else
    echo "    ❌ Test failed"
    echo "    $TEST_OUTPUT"
    echo "    → Debug: ssh -v $ALIAS_NAME"
    exit 1
fi

# ─── DONE ────────────────────────────────────────────────────
echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "  ✅ SETUP XONG!"
echo "═══════════════════════════════════════════════════════════════"
echo ""
echo "  📋 Từ giờ dùng như sau (KHÔNG cần pass):"
echo ""
echo "    ssh $ALIAS_NAME"
echo "    scp file.txt $ALIAS_NAME:/var/www/huongdi/"
echo "    scp -r folder/ $ALIAS_NAME:/tmp/"
echo "    rsync -avz --progress ./ $ALIAS_NAME:/tmp/dest/"
echo "    ssh $ALIAS_NAME 'pm2 status'"
echo ""
echo "  🔑 Private key: $PRIVATE_KEY"
echo "  📄 Config file: $CONFIG_FILE"
echo ""
echo "  ⚠  BACKUP private key ngay vào USB / 1Password / GDrive"
echo ""
