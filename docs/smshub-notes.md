# SMSHub API Integration Notes

*Documented and verified against official SMSHub documentation (`https://smshub.et/docs`) and live API validation endpoints.*

---

## 1. Verified Specifications

| Question | Answer |
|---|---|
| **Endpoint URL** | **Live send:** `POST https://smshub.et/api/sms`<br>**Test mode (zero cost):** `POST https://smshub.et/api/test`<br>**Balance check:** `GET https://smshub.et/api/balance` |
| **Auth header** | `Authorization: Bearer sk_live_...` |
| **Phone number format required** | Ethiopian mobile numbers: Ethio Telecom (`09xxxxxxxx`) or Safaricom (`07xxxxxxxx`). Also accepts `2519...`, `2517...`, `+2519...`, `+2517...`. Punctuation, dashes, spaces, and brackets are ignored. |
| **Request fields** | JSON body (UTF-8):<br>• `msisdn`: `string` (required) – recipient phone number.<br>• `text`: `string` (required) – message body.<br>• `track_links`: `boolean` (optional, default `false`) – appends `?utm_source=smshub` to URLs.<br>*(Note: `from` / Sender ID is not accepted in payload; SMSHub appends the account signature automatically).* |
| **Success response** | HTTP `200 OK`<br>See real response below (contains `status: "success"`, `data.message_id`, `data.message_status`, `credits_used`, `credits_remaining`, `request_id`). |
| **Error response** | HTTP `400`, `401`, `402`, `403`, `422`, `429`, `500`, `502`, `503`<br>JSON body: `{ status: "error", error_type: string, message: string, request_id: string }`. |
| **Provider message id field** | `data.message_id` (prefixed with `msg_`, e.g., `msg_9b2d4e6f8a0c1e3b5d7f`) |
| **Delivery report / webhook?** | Handset delivery receipts are not supported by Ethio Telecom / Safaricom yet (`delivery_report` is `null`).<br>Webhooks are supported via **Dashboard → API access → Webhooks** (`message.sent`, `message.failed`, `credits.low`, etc.) with HMAC-SHA256 signature verification in `X-SMSHub-Signature`. |
| **Unicode (Amharic) supported? Max length** | **GSM-7 (Latin only):** 160 characters max per segment, including signature.<br>**Unicode (Amharic / Ge'ez / emojis):** 70 characters max per segment, including signature.<br>*(Any Amharic character switches the entire message to Unicode mode).* |

---

## 2. Real API Responses (Verified Live)

### 2.1 Balance Check (`GET /api/balance`)
```json
{
  "status": "success",
  "data": {
    "credits": 15,
    "credit_rule": {
      "ethio": 1,
      "safaricom": 2
    },
    "low_credit_threshold": 20
  },
  "request_id": "req_..."
}
```

### 2.2 Validation / Test Call (`POST /api/test`)
```json
{
  "status": "success",
  "data": {
    "mode": "test",
    "message_status": "test_passed",
    "would_send": true,
    "msisdn": "0911234567",
    "network": "ethio",
    "final_text": "AbsentAlert Test: Student John Doe was marked absent on Oct 21.\n\n- Michael Fetene | 0982428697",
    "characters": 94,
    "character_limit": 160,
    "encoding": "gsm7",
    "credits_needed": 1,
    "credits_used": 0,
    "credits_remaining": 15,
    "signature_applied": true,
    "phone_in_signature": true,
    "links_tracked": false,
    "provider_contacted": false,
    "sms_sent": false,
    "message": "Validation passed. No SMS was sent and no credits were used."
  },
  "request_id": "req_3ee96046d3f1ecdc"
}
```

### 2.3 Live Send Expected Format (`POST /api/sms`)
```json
{
  "status": "success",
  "data": {
    "message_id": "msg_9b2d4e6f8a0c1e3b5d7f",
    "msisdn": "0911234567",
    "network": "ethio",
    "message_status": "sent",
    "credits_used": 1,
    "credits_remaining": 14,
    "signature_applied": true,
    "phone_in_signature": true
  },
  "request_id": "req_8f3a1c09d2e4b7a1"
}
```

### 2.4 Real Validation Error (`POST /api/test` with invalid phone number `12345`)
```json
{
  "status": "error",
  "error_type": "invalid_msisdn",
  "message": "Invalid msisdn. Use an Ethiopian mobile number: 09xxxxxxxx (Ethio Telecom) or 07xxxxxxxx (Safaricom), also accepted as 251… or +251….",
  "request_id": "req_64ec3e8ff378eb32"
}
```

---

## 3. Key Findings & Design Implications

1. **Sender ID / Signature Behavior**:
   - There is no custom `from` field in the request payload.
   - SMSHub automatically appends the verified account signature (e.g. `\n\n- Michael Fetene | 0982428697`), which consumes characters against the single SMS limit (160 for GSM-7, 70 for Unicode).
   - Custom signatures can be configured in the SMSHub dashboard.
2. **Character Budget**:
   - The default signature takes approximately 30-35 characters.
   - For English absence notifications, the body text should be kept under ~120 characters to guarantee staying within a single 160-character GSM-7 segment.
   - For Amharic notifications, Unicode limit is 70 characters (including signature).
3. **Verify API (OTP)**:
   - `POST /api/verify/send` accepts `{ msisdn, app_name?, code_length?, expires_in? }` and generates/delivers a code.
   - `POST /api/verify/check` accepts `{ verification_id, code }` and validates it without charging credits.
   - For absent alerts, transactional SMS via `POST /api/sms` with `{ msisdn, text }` is used.
4. **Credit Accounting**:
   - Ethio Telecom recipients: 1 credit per SMS.
   - Safaricom recipients: 2 credits per SMS.
   - `POST /api/test` allows full integration testing without consuming credits.
5. **Error Handling & Retries**:
   - Only HTTP `429`, `500`, `502` (carrier refused), and `503` are retryable.
   - Client errors (`400`, `401`, `402`, `403`, `422`) must be treated as final failures.
