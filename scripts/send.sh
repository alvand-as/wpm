#!/usr/bin/env bash
set -euo pipefail

: "${WHATSAPP_TOKEN:?Set WHATSAPP_TOKEN in your environment}"
: "${WHATSAPP_PHONE_NUMBER_ID:?Set WHATSAPP_PHONE_NUMBER_ID in your environment}"
: "${WHATSAPP_TO:?Set WHATSAPP_TO (recipient number, e.g. 15551234567, no + or spaces) in your environment}"

TEXT="${1:-Hello from WhatsApp PM MVP}"

curl -s -X POST "https://graph.facebook.com/v20.0/${WHATSAPP_PHONE_NUMBER_ID}/messages" \
  -H "Authorization: Bearer ${WHATSAPP_TOKEN}" \
  -H "Content-Type: application/json" \
  -d "{
    \"messaging_product\": \"whatsapp\",
    \"to\": \"${WHATSAPP_TO}\",
    \"type\": \"text\",
    \"text\": { \"body\": \"${TEXT}\" }
  }"
echo
