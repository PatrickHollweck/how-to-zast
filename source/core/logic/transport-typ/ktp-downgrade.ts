import type { PromptContext } from "../../context.js";
import type { ProgramResult } from "../types.js";

import * as t from "../../prompts/types.js";

import { findBillingType } from "../billing/billing.js";
import { AbrechnungsContext } from "../billing/types.js";
import { Transportart, Einsatzart } from "../einsatzarten.js";

export async function handleKtpDowngrade(
	ctx: PromptContext,
): Promise<ProgramResult> {
	await ctx.messages.disponierterNotfallNichtSoWahrgenommen();

	const downgradeReason = await ctx.prompts.herabstufungGrundKTP();

	const callType = {
		[t.NotfallTyp_Downgrade.ArbeitsOderWegeOderSchulUnfall]:
			Einsatzart.KTP_BG_Unfall,
		[t.NotfallTyp_Downgrade.SonstigerUnfall]: Einsatzart.KTP_Sonstiger_Unfall,
		[t.NotfallTyp_Downgrade.SonstigerEinsatz]: Einsatzart.KTP_zum_KH,
		[t.NotfallTyp_Downgrade.Holdienst]: Einsatzart.KTP_Verlegung,
		[t.NotfallTyp_Downgrade.Verlegung]: Einsatzart.KTP_Verlegung,
	}[downgradeReason];

	return {
		transportType: Transportart.Verrechenbar,
		callType,
		billing: await findBillingType(ctx, AbrechnungsContext.KTP_Herabstufung),
	};
}
