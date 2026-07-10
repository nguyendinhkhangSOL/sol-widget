#!/bin/bash
# Export data 37 directions → JSON file cho em build 37 prompts
set -e

DB_NAME="huongdi_prod"
OUTPUT="/tmp/37-directions-export.json"

echo "═══ Export 37 Directions Data ═══"

sudo -u postgres psql -Aqt "$DB_NAME" -c "
SELECT json_agg(
    json_build_object(
      'id', id,
      'name', name,
      'slug', slug,
      'tagline', tagline,
      'category', category::text,
      'description', description,
      'why_fit', why_fit,
      'barriers', barriers,
      'vp_people', vp_people,
      'vp_expert', vp_expert,
      'vp_builder', vp_builder,
      'vp_independent', vp_independent,
      'vr_capital', vr_capital,
      'vr_time', vr_time,
      'vr_tech', vr_tech,
      'vr_network', vr_network,
      'vr_risk', vr_risk,
      'vr_energy', vr_energy,
      'vb_income_speed', vb_income_speed,
      'vb_income_pot', vb_income_pot,
      'vb_scalability', vb_scalability,
      'vb_ai_leverage', vb_ai_leverage,
      'sort_order', sort_order
    ) ORDER BY sort_order
  )
FROM directions;
" > "$OUTPUT"

SIZE=$(du -h "$OUTPUT" | cut -f1)
COUNT=$(cat "$OUTPUT" | python3 -c "import json,sys; print(len(json.load(sys.stdin)))")

echo "✅ Exported $COUNT directions → $OUTPUT (${SIZE})"
echo ""
echo "Download về máy anh:"
echo "  scp sol-vps:$OUTPUT C:\\BOTHUOCLA\\sol-widget\\docs\\sol-mvp-v3\\BUOC-4-ROADMAP\\"
