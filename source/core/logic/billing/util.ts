import type { PromptContext } from "../../context.js";
import type { BillingInfo } from "../types.js";

import { Tarif, Kostenträger, AbrechnungsContext } from "./types.js";

export async function handle_KTR_SZ(
	ctx: PromptContext,
	billingContext: AbrechnungsContext,
): Promise<BillingInfo> {
	return (await ctx.prompts.istPrivateOderUnbekannteKrankenkasse())
		? { tariff: getSelbstzahlerTarif(billingContext), target: Kostenträger.SZ }
		: {
				tariff: getKrankenkasseTarif(billingContext),
				target: Kostenträger.KTR,
			};
}

export async function handle_BG_SZ(
	ctx: PromptContext,
	billingContext: AbrechnungsContext,
): Promise<BillingInfo | null> {
	if (await ctx.prompts.istUrsacheBG()) {
		await ctx.messages.hinweisEintragungAbrechnungsdatenBG();

		if (await ctx.prompts.istBerufsgenossenschaftBekannt()) {
			return {
				tariff: getBerufsgenossenschaftTarif(billingContext),
				target: Kostenträger.BG,
			};
		}
	}

	if (await ctx.prompts.istPrivateOderUnbekannteKrankenkasse()) {
		await ctx.messages.hinweiseUnbekannterKTR();

		return {
			tariff: getSelbstzahlerTarif(billingContext),
			target: Kostenträger.SZ,
		};
	}

	return null;
}

export async function handle_BG_SZ_forced(
	ctx: PromptContext,
	billingContext: AbrechnungsContext,
): Promise<BillingInfo> {
	const isBG = await handle_BG_SZ(ctx, billingContext);

	if (isBG) {
		return isBG;
	}

	await ctx.messages.keinKostenträgerFehlermeldung();

	throw new Error("Abrechnung nicht möglich!");
}

export async function handle_BG_KTR_SZ(
	ctx: PromptContext,
	billingContext: AbrechnungsContext,
): Promise<BillingInfo> {
	const isBG = await handle_BG_SZ(ctx, billingContext);

	if (isBG) {
		return isBG;
	}

	return await handle_KTR_SZ(ctx, billingContext);
}

export async function handle_KHS_KTR_BG_SZ(
	ctx: PromptContext,
	billingContext: AbrechnungsContext,
	disallowBG = false,
): Promise<BillingInfo> {
	if (!disallowBG) {
		const isBG = await handle_BG_SZ(ctx, billingContext);

		if (isBG) {
			return isBG;
		}
	}

	if (await ctx.prompts.verlegungInKrankenhausNiedrigerVersorungsstufe()) {
		return {
			tariff: getKrankenhausTarif(billingContext),
			target: Kostenträger.KHS,
		};
	}

	return await handle_KTR_SZ(ctx, billingContext);
}

function getBerufsgenossenschaftTarif(billingContext: AbrechnungsContext) {
	return {
		[AbrechnungsContext.KTP]: Tarif.KTP_KTR_BG,
		[AbrechnungsContext.KTP_Herabstufung]: Tarif.KTP_KTR_BG,
		[AbrechnungsContext.NF]: Tarif.NF_KTR_BG,
		[AbrechnungsContext.NF_KVB_Verlegungsarzt]: Tarif.NF_VERLEGUNG_KVB_KTR_BG,
		[AbrechnungsContext.NA]: Tarif.NA_KTR_BG,
	}[billingContext];
}

function getSelbstzahlerTarif(billingContext: AbrechnungsContext) {
	return {
		[AbrechnungsContext.KTP]: Tarif.KTP_SZ,
		[AbrechnungsContext.KTP_Herabstufung]: Tarif.KTP_SZ,
		[AbrechnungsContext.NF]: Tarif.NF_SZ,
		[AbrechnungsContext.NF_KVB_Verlegungsarzt]: Tarif.NF_VERLEGUNG_KVB_SZ,
		[AbrechnungsContext.NA]: Tarif.NA_SZ,
	}[billingContext];
}

function getKrankenhausTarif(billingContext: AbrechnungsContext) {
	return {
		[AbrechnungsContext.KTP]: Tarif.KTP_KHS,
		[AbrechnungsContext.KTP_Herabstufung]: Tarif.KTP_KHS,
		[AbrechnungsContext.NF]: Tarif.NF_KHS,
		[AbrechnungsContext.NF_KVB_Verlegungsarzt]: Tarif.NF_VERLEGUNG_KVB_KHS,
		[AbrechnungsContext.NA]: Tarif.NA_KHS,
	}[billingContext];
}

function getKrankenkasseTarif(billingContext: AbrechnungsContext) {
	return {
		[AbrechnungsContext.KTP]: Tarif.KTP_KTR_BG,
		[AbrechnungsContext.KTP_Herabstufung]: Tarif.KTP_KTR_BG,
		[AbrechnungsContext.NF]: Tarif.NF_KTR_BG,
		[AbrechnungsContext.NF_KVB_Verlegungsarzt]: Tarif.NF_VERLEGUNG_KVB_KTR_BG,
		[AbrechnungsContext.NA]: Tarif.NA_KTR_BG,
	}[billingContext];
}
