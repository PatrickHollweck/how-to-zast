import type { PromptContext } from "../../context.js";
import type { ProgramResult } from "../types.js";

import { findBillingType } from "../billing/billing.js";
import { AbrechnungsContext } from "../billing/types.js";
import { Transportart, Einsatzart } from "../einsatzarten.js";

export async function handleKrankentransport(
	ctx: PromptContext,
): Promise<ProgramResult> {
	// TODO: Implement...
	return {
		transportType: Transportart.Verrechenbar,
		callType: Einsatzart.KTP_zum_KH,
		billing: await findBillingType(ctx, AbrechnungsContext.KTP),
	};
}
