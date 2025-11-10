import type { PromptContext } from "../../context.js";
import type { ProgramResult } from "../types.js";

import * as t from "../../prompts/types.js";

import { findBillingType } from "../billing/billing.js";
import { handleKtpDowngrade } from "./ktp-downgrade.js";
import { AbrechnungsContext } from "../billing/types.js";
import { Transportart, Einsatzart } from "../einsatzarten.js";

export async function handleRtwNotfall(
	ctx: PromptContext,
): Promise<ProgramResult> {
	const callScenario = await ctx.prompts.notfallSzenarioOhneNA();

	if (callScenario === t.NotfalleinsatzTyp.NeugeborenenHoldienst) {
		if (await ctx.prompts.holdienstBegleitungDurchKlinik()) {
			return {
				transportType: Transportart.Verrechenbar,
				callType: Einsatzart.NF_Neugeborenen_Holdienst,
				billing: await findBillingType(ctx, AbrechnungsContext.NF),
			};
		}

		if (await ctx.prompts.wahrnehmungAlsNotfall()) {
			ctx.setCached("notfallSzenarioOhneNA", t.NotfalleinsatzTyp.Verlegung);

			return await handleRtwNotfall(ctx);
		} else {
			ctx.setCached("herabstufungGrundKTP", t.NotfallTyp_Downgrade.Holdienst);

			return await handleKtpDowngrade(ctx);
		}
	}

	if (callScenario === t.NotfalleinsatzTyp.Verlegung) {
		const isKvbTransfer = await ctx.prompts.verlegungBegleitungKVB();

		return {
			transportType: Transportart.Verrechenbar,
			callType: isKvbTransfer
				? Einsatzart.NF_Verlegung_KVB
				: Einsatzart.NF_Verlegung,
			billing: await findBillingType(
				ctx,
				isKvbTransfer
					? AbrechnungsContext.NF_KVB_Verlegungsarzt
					: AbrechnungsContext.NF,
			),
		};
	}

	const callType = {
		[t.NotfalleinsatzTyp.Verkehrsunfall]: Einsatzart.NF_Verkehrsunfall,
		[t.NotfalleinsatzTyp.Verlegung]: Einsatzart.NF_Verlegung,
		[t.NotfalleinsatzTyp.Verlegung_VRTW]: Einsatzart.NF_Verlegung_VRTW,
		[t.NotfalleinsatzTyp.ArbeitsOderWegeUnfall]: Einsatzart.NF_Arbeitsunfall,
		[t.NotfalleinsatzTyp.Schulunfall]: Einsatzart.NF_Schulunfall,
		[t.NotfalleinsatzTyp.Internistisch]: Einsatzart.NF_Internistisch,
		[t.NotfalleinsatzTyp.SonstigerUnfall]: Einsatzart.NF_Sonstiger_Unfall,
		[t.NotfalleinsatzTyp.SonstigerNofall]: Einsatzart.NF_Sonstiger_Nofall,
	}[callScenario];

	return {
		transportType: Transportart.Verrechenbar,
		callType,
		billing: await findBillingType(ctx, AbrechnungsContext.NF),
	};
}
