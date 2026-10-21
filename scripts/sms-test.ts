import "dotenv/config";

// Configuration from environment variables
const baseUrl = (process.env.SMSHUB_BASE_URL || "https://smshub.et").replace(/\/+$/, "");
const apiKey = process.env.SMSHUB_API_KEY;
const testPhone = process.env.SMSHUB_TEST_PHONE || process.env.SMS_TEST_RECIPIENT || process.argv[2];
const isLiveMode = process.argv.includes("--live") || process.env.SMSHUB_LIVE === "true";

function maskKey(key?: string): string {
  if (!key) return "(not set)";
  if (key.length <= 12) return "***";
  return `${key.slice(0, 8)}...${key.slice(-4)}`;
}

function maskPhone(phone?: string): string {
  if (!phone) return "(not set)";
  if (phone.length <= 6) return "***";
  return `${phone.slice(0, 4)}****${phone.slice(-3)}`;
}

async function runSmsVerification() {
  console.log("==========================================");
  console.log("       AbsentAlert - SMSHub Verification   ");
  console.log("==========================================");
  console.log(`Base URL:     ${baseUrl}`);
  console.log(`API Key:      ${maskKey(apiKey)}`);
  console.log(`Recipient:    ${maskPhone(testPhone)}`);
  console.log(`Mode:         ${isLiveMode ? "LIVE (/api/sms)" : "VALIDATION / TEST (/api/test)"}`);
  console.log("------------------------------------------");

  if (!apiKey) {
    console.error("ERROR: SMSHUB_API_KEY is not defined in environment.");
    process.exit(1);
  }

  // 1. Check account balance and key validity
  console.log("\n[1/3] Checking account balance & API credentials (GET /api/balance)...");
  try {
    const balanceRes = await fetch(`${baseUrl}/api/balance`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        Accept: "application/json",
      },
    });

    const balanceJson = (await balanceRes.json().catch(() => null)) as any;
    console.log(`HTTP Status:  ${balanceRes.status} ${balanceRes.statusText}`);

    if (!balanceRes.ok) {
      console.error("Failed to query account balance:");
      console.error(JSON.stringify(balanceJson, null, 2));
      if (balanceRes.status === 401) {
        console.error("\n-> The API key appears invalid, expired, or revoked.");
      } else if (balanceRes.status === 403) {
        console.error("\n-> The account may have pending KYC, unverified phone, or is suspended.");
      }
      return;
    }

    console.log("Account verified successfully!");
    console.log(`Remaining credits: ${balanceJson?.data?.credits}`);
    console.log(`Credit rules:     Ethio = ${balanceJson?.data?.credit_rule?.ethio} credit(s), Safaricom = ${balanceJson?.data?.credit_rule?.safaricom} credit(s)`);
  } catch (err: any) {
    console.error(`Network error connecting to ${baseUrl}:`, err.message);
    return;
  }

  // 2. Validate payload with /api/test endpoint (no credits consumed)
  const recipient = testPhone || "0911234567";
  const testMessage = "AbsentAlert Test: Student John Doe was marked absent on Oct 21.";

  console.log(`\n[2/3] Validating message against /api/test (zero credits)...`);
  console.log(`Test message: "${testMessage}"`);

  try {
    const testRes = await fetch(`${baseUrl}/api/test`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        msisdn: recipient,
        text: testMessage,
      }),
    });

    const testJson = (await testRes.json().catch(() => null)) as any;
    console.log(`HTTP Status:  ${testRes.status} ${testRes.statusText}`);
    console.log("Response payload:");
    console.log(JSON.stringify(testJson, null, 2));

    if (!testRes.ok) {
      console.error("\nValidation failed on /api/test:");
      console.error(`Error Type: ${testJson?.error_type}`);
      console.error(`Message:    ${testJson?.message}`);
      return;
    }

    console.log("Validation passed successfully!");
    console.log(`Encoding:        ${testJson?.data?.encoding}`);
    console.log(`Characters:      ${testJson?.data?.characters} / ${testJson?.data?.character_limit}`);
    console.log(`Final preview:   ${JSON.stringify(testJson?.data?.final_text)}`);
  } catch (err: any) {
    console.error("Network error during /api/test:", err.message);
    return;
  }

  // 3. Send real SMS if live mode is requested
  console.log("\n[3/3] Live SMS Send Verification (POST /api/sms)...");
  if (!isLiveMode) {
    console.log("INFO: Live mode was NOT requested. No credits were deducted.");
    console.log("To send a real live SMS to a phone number, run:");
    console.log("  npx tsx scripts/sms-test.ts <phone_number> --live");
    console.log("Example:");
    console.log("  npx tsx scripts/sms-test.ts 0911234567 --live");
    return;
  }

  if (!testPhone) {
    console.error("ERROR: Cannot send live SMS without a recipient phone number.");
    console.error("Please provide a phone number as an argument or set SMSHUB_TEST_PHONE in .env.");
    return;
  }

  console.log(`Sending live SMS to ${maskPhone(testPhone)}...`);
  try {
    const sendRes = await fetch(`${baseUrl}/api/sms`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        msisdn: testPhone,
        text: testMessage,
      }),
    });

    const sendJson = (await sendRes.json().catch(() => null)) as any;
    console.log(`HTTP Status:  ${sendRes.status} ${sendRes.statusText}`);
    console.log("Response payload:");
    console.log(JSON.stringify(sendJson, null, 2));

    if (sendRes.ok && sendJson?.status === "success") {
      console.log("\nSUCCESS: Real SMS sent successfully!");
      console.log(`Message ID:        ${sendJson?.data?.message_id}`);
      console.log(`Carrier Status:    ${sendJson?.data?.message_status}`);
      console.log(`Credits remaining: ${sendJson?.data?.credits_remaining}`);
    } else {
      console.error("\nERROR: Failed to send SMS.");
      console.error(`Error Type: ${sendJson?.error_type}`);
      console.error(`Message:    ${sendJson?.message}`);
    }
  } catch (err: any) {
    console.error("Network error during /api/sms:", err.message);
  }
}

runSmsVerification().catch((e) => {
  console.error("Unexpected error:", e);
  process.exit(1);
});
