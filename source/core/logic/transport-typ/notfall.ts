import type { PromptContext } from "../../context.js";
import type { ProgramResult } from "../types.js";

import * as t from "../../prompts/types.js";

import { findBillingType } from "../billing/billing.js";
import { handleKtpDowngrade } from "../ktp-downgrade.js";
import { AbrechnungsContext } from "../billing/types.js";
import { Transportart, Einsatzart } from "../einsatzarten.js";

export async function handleTransportWithoutDoctorInvolvementRTW(
	ctx: PromptContext,
): Promise<ProgramResult> {
	const callScenario = await ctx.prompts.notfallSzenarioOhneNA();

	if (callScenario === t.NotarztTyp.NeugeborenenHoldienst) {
		if (await ctx.prompts.holdienstBegleitungDurchKlinik()) {
			return {
				transportType: Transportart.Verrechenbar,
				callType: Einsatzart.NF_Neugeborenen_Holdienst,
				billing: await findBillingType(ctx, AbrechnungsContext.NF),
			};
		}

		if (await ctx.prompts.wahrnehmungAlsNotfall()) {
			ctx.setCached("notfallSzenarioOhneNA", t.NotarztTyp.Verlegung);

			return await handleTransportWithoutDoctorInvolvementRTW(ctx);
		} else {
			ctx.setCached("herabstufungGrundKTP", t.NotfallTyp_Downgrade.Holdienst);

			return await handleKtpDowngrade(ctx);
		}
	}

	if (callScenario === t.NotarztTyp.Verlegung) {
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
		[t.NotarztTyp.Verkehrsunfall]: Einsatzart.NF_Verkehrsunfall,
		[t.NotarztTyp.Verlegung]: Einsatzart.NF_Verlegung,
		[t.NotarztTyp.ArbeitsOderWegeUnfall]: Einsatzart.NF_Arbeitsunfall,
		[t.NotarztTyp.Schulunfall]: Einsatzart.NF_Schulunfall,
		[t.NotarztTyp.Internistisch]: Einsatzart.NF_Internistisch,
		[t.NotarztTyp.SonstigerUnfall]: Einsatzart.NF_Sonstiger_Unfall,
		[t.NotarztTyp.SonstigerNofall]: Einsatzart.NF_Sonstiger_Nofall,
	}[callScenario];

	return {
		transportType: Transportart.Verrechenbar,
		callType,
		billing: await findBillingType(ctx, AbrechnungsContext.NF),
	};
}
