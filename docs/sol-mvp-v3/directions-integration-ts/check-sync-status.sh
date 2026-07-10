#!/bin/bash
# Quick check status của sync integration
set -e

GREEN='\033[0;32m'
CYAN='\033[0;36m'
NC='\033[0m'

echo ""
echo -e "${CYAN}═══ P1 Results ═══${NC}"
sudo -u postgres psql huongdi_prod << 'EOF'
SELECT session_id, people, expert, builder, independent, rank_1, created_at
FROM p1_results
ORDER BY created_at DESC LIMIT 5;
EOF

echo ""
echo -e "${CYAN}═══ P2 Results ═══${NC}"
sudo -u postgres psql huongdi_prod << 'EOF'
SELECT session_id, experience, capital, technology, income_goal, created_at
FROM p2_results
ORDER BY created_at DESC LIMIT 5;
EOF

echo ""
echo -e "${CYAN}═══ User Events ═══${NC}"
sudo -u postgres psql huongdi_prod << 'EOF'
SELECT event_type, session_id, created_at
FROM user_events
ORDER BY created_at DESC LIMIT 15;
EOF

echo ""
echo -e "${CYAN}═══ Cleanup bad records (scores=0) ═══${NC}"
sudo -u postgres psql huongdi_prod << 'EOF'
DELETE FROM p1_results WHERE people=0 AND expert=0 AND builder=0 AND independent=0;
DELETE FROM p2_results WHERE experience=0 AND capital=0 AND time=0;
EOF

echo ""
echo -e "${CYAN}═══ Final counts ═══${NC}"
sudo -u postgres psql huongdi_prod << 'EOF'
SELECT 'p1_results' AS tbl, COUNT(*) FROM p1_results
UNION ALL SELECT 'p2_results', COUNT(*) FROM p2_results
UNION ALL SELECT 'user_events', COUNT(*) FROM user_events
UNION ALL SELECT 'saved_directions', COUNT(*) FROM saved_directions
UNION ALL SELECT 'directions', COUNT(*) FROM directions
UNION ALL SELECT 'leads', COUNT(*) FROM leads;
EOF

echo ""
echo -e "${GREEN}✅ Done${NC}"
