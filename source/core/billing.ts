import * as t from "./prompts/types.js";
import type { PromptContext } from "./context.js";
import type { BillingInfo } from "./logic/types.js";

export async function findBillingType(
	ctx: PromptContext,
	billingContext: t.BillingContextTyp,
): Promise<BillingInfo> {
	if (await ctx.prompts.transportUrsprungOderZielHuLaPla()) {
		return await handle_KTR_SZ(ctx, t.BillingContextTyp.KTP);
	}

	switch (billingContext) {
		case t.BillingContextTyp.KTP:
			return await handleKTP(ctx);
		case t.BillingContextTyp.KTP_Herabstufung:
			return await handleKTPHerabstufung(ctx);
		case t.BillingContextTyp.NF:
			return await handleNF(ctx);
		case t.BillingContextTyp.NF_KVB_Verlegungsarzt:
			return await handle_KHS_KTR_BG_SZ(
				ctx,
				t.BillingContextTyp.NF_KVB_Verlegungsarzt,
			);
		case t.BillingContextTyp.NA:
			return await handleDoctorCall(ctx);
	}
}

async function handleNF(ctx: PromptContext): Promise<BillingInfo> {
	const currentVehicle = await ctx.prompts.welchesEingesetzteFahrzeug();

	if (
		currentVehicle === t.VehicleKind.KTW &&
		(await ctx.prompts.anderesFahrzeugTransportiert()) ===
			t.TransferType.Luftgebunden
	) {
		await ctx.messages.einsatzNichtVerrechenbarAlsKTW();

		throw new Error("Einsatz mit diesem Fahrzeug nicht abrechenbar!");
	}

	if (
		(await ctx.prompts.dispositionsSchlagwort()) === t.AlarmReason.ITW &&
		currentVehicle === t.VehicleKind.ITW
	) {
		return handle_KHS_KTR_BG_SZ(ctx, t.BillingContextTyp.NF);
	}

	if (!(await ctx.prompts.wurdePatientTransportiert())) {
		return handle_BG_KTR_SZ(ctx, t.BillingContextTyp.NF);
	}

	switch (await ctx.prompts.notfallSzenarioOhneNA()) {
		case t.EmergencyScenario_NF.Verkehrsunfall:
		case t.EmergencyScenario_NF.Internistisch:
		case t.EmergencyScenario_NF.SonstigerUnfall:
			return handle_KTR_SZ(ctx, t.BillingContextTyp.NF);
		case t.EmergencyScenario_NF.Verlegung:
			return handle_KHS_KTR_BG_SZ(ctx, t.BillingContextTyp.NF);
		case t.EmergencyScenario_NF.Schulunfall:
		case t.EmergencyScenario_NF.ArbeitsOderWegeUnfall:
			return handle_BG_SZ_forced(ctx, t.BillingContextTyp.NF);
		case t.EmergencyScenario_NF.SonstigerNofall:
			return handle_KHS_KTR_BG_SZ(ctx, t.BillingContextTyp.NF, true);
		case t.EmergencyScenario_NF.NeugeborenenHoldienst: {
			const region = await ctx.prompts.holdienstRegion();

			switch (region) {
				case t.NewbornTransportRegion.Andere:
					return await handle_KHS_KTR_BG_SZ(ctx, t.BillingContextTyp.NF, true);
				case t.NewbornTransportRegion.Landshut:
					return {
						tariff: t.BillingTariff.NF_NEUGEBORENEN_LANDSHUT,
						target: (
							await handle_KHS_KTR_BG_SZ(ctx, t.BillingContextTyp.NF, true)
						).target,
					};
				case t.NewbornTransportRegion.Augsburg:
					return {
						tariff: t.BillingTariff.NF_NEUGEBORENEN_AUGSBURG,
						target: (
							await handle_KHS_KTR_BG_SZ(ctx, t.BillingContextTyp.NF, true)
						).target,
					};
			}
		}
	}
}

async function handleKTP(ctx: PromptContext) {
	return await handle_KTR_SZ(ctx, t.BillingContextTyp.KTP);
}

async function handleKTPHerabstufung(ctx: PromptContext): Promise<BillingInfo> {
	switch (await ctx.prompts.herabstufungGrundKTP()) {
		case t.EmergencyScenario_NF_Downgrade.ArbeitsOderWegeOderSchulUnfall:
			ctx.setCached("istUrsacheBG", true);
			return await handle_BG_KTR_SZ(ctx, t.BillingContextTyp.KTP_Herabstufung);
		case t.EmergencyScenario_NF_Downgrade.SonstigerEinsatz:
			ctx.setCached("istUrsacheBG", false);
			return await handle_BG_SZ_forced(
				ctx,
				t.BillingContextTyp.KTP_Herabstufung,
			);
		case t.EmergencyScenario_NF_Downgrade.Verlegung:
			return handle_KHS_KTR_BG_SZ(ctx, t.BillingContextTyp.KTP_Herabstufung);
		case t.EmergencyScenario_NF_Downgrade.Holdienst:
			return handle_KHS_KTR_BG_SZ(
				ctx,
				t.BillingContextTyp.KTP_Herabstufung,
				true,
			);
		case t.EmergencyScenario_NF_Downgrade.SonstigerUnfall:
			return await handle_KTR_SZ(ctx, t.BillingContextTyp.KTP_Herabstufung);
	}
}

async function handleDoctorCall(ctx: PromptContext): Promise<BillingInfo> {
	switch (await ctx.prompts.notfallSzenarioMitNA()) {
		case t.EmergencyScenario_NA.Verlegung:
			return await handle_KHS_KTR_BG_SZ(ctx, t.BillingContextTyp.NA);
		case t.EmergencyScenario_NA.Schulunfall:
		case t.EmergencyScenario_NA.ArbeitsOderWegeUnfall:
			ctx.setCached("istUrsacheBG", true);
			return await handle_BG_SZ_forced(ctx, t.BillingContextTyp.NA);

		case t.EmergencyScenario_NA.SonstigerNofall:
		case t.EmergencyScenario_NA.SonstigerUnfall:
			return await handle_BG_KTR_SZ(ctx, t.BillingContextTyp.NA);

		case t.EmergencyScenario_NA.Internistisch:
		case t.EmergencyScenario_NA.Verkehrsunfall:
			return await handle_KTR_SZ(ctx, t.BillingContextTyp.NA);

		default:
			throw new Error("Unbekannter Notfalltyp");
	}
}

async function handle_KTR_SZ(
	ctx: PromptContext,
	billingContext: t.BillingContextTyp,
): Promise<BillingInfo> {
	return (await ctx.prompts.istPrivateOderUnbekannteKrankenkasse())
		? { tariff: getSelbstzahlerTarif(billingContext), target: t.BillingType.SZ }
		: {
				tariff: getKrankenkasseTarif(billingContext),
				target: t.BillingType.KTR,
			};
}

async function handle_BG_SZ(
	ctx: PromptContext,
	billingContext: t.BillingContextTyp,
): Promise<BillingInfo | null> {
	if (await ctx.prompts.istUrsacheBG()) {
		await ctx.messages.hinweisEintragungAbrechnungsdatenBG();

		if (await ctx.prompts.istBerufsgenossenschaftBekannt()) {
			return {
				tariff: getBerufsgenossenschaftTarif(billingContext),
				target: t.BillingType.BG,
			};
		}
	}

	if (await ctx.prompts.istPrivateOderUnbekannteKrankenkasse()) {
		await ctx.messages.hinweiseUnbekannterKTR();

		return {
			tariff: getSelbstzahlerTarif(billingContext),
			target: t.BillingType.SZ,
		};
	}

	return null;
}

async function handle_BG_SZ_forced(
	ctx: PromptContext,
	billingContext: t.BillingContextTyp,
): Promise<BillingInfo> {
	const isBG = await handle_BG_SZ(ctx, billingContext);

	if (isBG) {
		return isBG;
	}

	await ctx.messages.keinKostenträgerFehlermeldung();

	throw new Error("Abrechnung nicht möglich!");
}

async function handle_BG_KTR_SZ(
	ctx: PromptContext,
	billingContext: t.BillingContextTyp,
): Promise<BillingInfo> {
	const isBG = await handle_BG_SZ(ctx, billingContext);

	if (isBG) {
		return isBG;
	}

	return await handle_KTR_SZ(ctx, billingContext);
}

async function handle_KHS_KTR_BG_SZ(
	ctx: PromptContext,
	billingContext: t.BillingContextTyp,
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
			target: t.BillingType.KHS,
		};
	}

	return await handle_KTR_SZ(ctx, billingContext);
}

function getBerufsgenossenschaftTarif(billingContext: t.BillingContextTyp) {
	return {
		[t.BillingContextTyp.KTP]: t.BillingTariff.KTP_KTR_BG,
		[t.BillingContextTyp.KTP_Herabstufung]: t.BillingTariff.KTP_KTR_BG,
		[t.BillingContextTyp.NF]: t.BillingTariff.NF_KTR_BG,
		[t.BillingContextTyp.NF_KVB_Verlegungsarzt]:
			t.BillingTariff.NF_VERLEGUNG_KVB_KTR_BG,
		[t.BillingContextTyp.NA]: t.BillingTariff.NA_KTR_BG,
	}[billingContext];
}

function getSelbstzahlerTarif(billingContext: t.BillingContextTyp) {
	return {
		[t.BillingContextTyp.KTP]: t.BillingTariff.KTP_SZ,
		[t.BillingContextTyp.KTP_Herabstufung]: t.BillingTariff.KTP_SZ,
		[t.BillingContextTyp.NF]: t.BillingTariff.NF_SZ,
		[t.BillingContextTyp.NF_KVB_Verlegungsarzt]:
			t.BillingTariff.NF_VERLEGUNG_KVB_SZ,
		[t.BillingContextTyp.NA]: t.BillingTariff.NA_SZ,
	}[billingContext];
}

function getKrankenhausTarif(billingContext: t.BillingContextTyp) {
	return {
		[t.BillingContextTyp.KTP]: t.BillingTariff.KTP_KHS,
		[t.BillingContextTyp.KTP_Herabstufung]: t.BillingTariff.KTP_KHS,
		[t.BillingContextTyp.NF]: t.BillingTariff.NF_KHS,
		[t.BillingContextTyp.NF_KVB_Verlegungsarzt]:
			t.BillingTariff.NF_VERLEGUNG_KVB_KHS,
		[t.BillingContextTyp.NA]: t.BillingTariff.NA_KHS,
	}[billingContext];
}

function getKrankenkasseTarif(billingContext: t.BillingContextTyp) {
	return {
		[t.BillingContextTyp.KTP]: t.BillingTariff.KTP_KTR_BG,
		[t.BillingContextTyp.KTP_Herabstufung]: t.BillingTariff.KTP_KTR_BG,
		[t.BillingContextTyp.NF]: t.BillingTariff.NF_KTR_BG,
		[t.BillingContextTyp.NF_KVB_Verlegungsarzt]:
			t.BillingTariff.NF_VERLEGUNG_KVB_KTR_BG,
		[t.BillingContextTyp.NA]: t.BillingTariff.NA_KTR_BG,
	}[billingContext];
}
