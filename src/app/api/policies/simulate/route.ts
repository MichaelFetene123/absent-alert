import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import {
  DEFAULT_ACTIVE_POLICY,
  SAMPLE_POLICIES,
  evaluatePolicy,
} from "@/lib/services/policy-engine.service";
import type { PolicySimulationInput } from "@/lib/types/policy";

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { policyId, input } = body as {
      policyId?: string;
      input: PolicySimulationInput;
    };

    if (!input) {
      return NextResponse.json(
        { error: "Missing simulation input payload." },
        { status: 400 }
      );
    }

    const policy =
      SAMPLE_POLICIES.find((p) => p.id === policyId) || DEFAULT_ACTIVE_POLICY;

    const result = evaluatePolicy(input, policy);

    return NextResponse.json({
      success: true,
      policyId: policy.id,
      policyVersion: policy.version,
      result,
    });
  } catch (error) {
    console.error("Policy simulation API error:", error);
    return NextResponse.json(
      { error: "Internal server error during policy simulation." },
      { status: 500 }
    );
  }
}
