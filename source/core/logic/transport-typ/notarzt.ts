import type { ProgramResult } from "../types.js";
import type { PromptContext } from "../../context.js";

import * as t from "../../prompts/types.js";

import { findBillingType } from "../billing/billing.js";
import { Transportart, Einsatzart } from "../einsatzarten.js";

import { Kostenträger, Tarif, AbrechnungsContext } from "../billing/types.js";

export async function handleNotarzteinsatz(
	ctx: PromptContext,
): Promise<ProgramResult> {
	const callType = {
		[t.NotarzteinsatzTyp.Verlegung]: Einsatzart.NA_Verlegung,
		[t.NotarzteinsatzTyp.Schulunfall]: Einsatzart.NA_Schulunfall,
		[t.NotarzteinsatzTyp.Internistisch]: Einsatzart.NA_Internistisch,
		[t.NotarzteinsatzTyp.Verkehrsunfall]: Einsatzart.NA_Verkehrsunfall,
		[t.NotarzteinsatzTyp.SonstigerUnfall]: Einsatzart.NA_Sonstiger_Unfall,
		[t.NotarzteinsatzTyp.SonstigerNofall]: Einsatzart.NA_Sonstiger_Notfall,
		[t.NotarzteinsatzTyp.ArbeitsOderWegeUnfall]: Einsatzart.NA_Arbeitsunfall,
	}[await ctx.prompts.notfallSzenarioMitNA()];

	if (
		callType === Einsatzart.NA_Sonstiger_Notfall &&
		(await ctx.prompts.sonstigerNotfallKrankenhausTräger())
	) {
		return {
			transportType: Transportart.Verrechenbar,
			callType,
			billing: {
				tariff: Tarif.NA_KHS,
				target: Kostenträger.KHS,
			},
		};
	}

	return {
		transportType: Transportart.Verrechenbar,
		callType,
		billing: await findBillingType(ctx, AbrechnungsContext.NA),
	};
}
