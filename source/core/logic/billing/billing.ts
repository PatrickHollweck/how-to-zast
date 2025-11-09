import * as t from "../../prompts/types.js";

import type { BillingInfo } from "../types.js";
import type { PromptContext } from "../../context.js";

import { AbrechnungsContext, Tarif } from "./types.js";

import {
	handle_KTR_SZ,
	handle_BG_KTR_SZ,
	handle_BG_SZ_forced,
	handle_KHS_KTR_BG_SZ,
} from "./util.js";

export async function findBillingType(
	ctx: PromptContext,
	billingContext: AbrechnungsContext,
): Promise<BillingInfo> {
	if (await ctx.prompts.transportUrsprungOderZielHuLaPla()) {
		return await handle_KTR_SZ(ctx, AbrechnungsContext.KTP);
	}

	switch (billingContext) {
		case AbrechnungsContext.KTP:
			return await handleKrankentransport(ctx);
		case AbrechnungsContext.KTP_Herabstufung:
			return await handleKTPHerabstufung(ctx);
		case AbrechnungsContext.NF:
			return await handleNotfall(ctx);
		case AbrechnungsContext.NF_KVB_Verlegungsarzt:
			return await handle_KHS_KTR_BG_SZ(
				ctx,
				AbrechnungsContext.NF_KVB_Verlegungsarzt,
			);
		case AbrechnungsContext.NA:
			return await handleDoctorCall(ctx);
	}
}

async function handleNotfall(ctx: PromptContext): Promise<BillingInfo> {
	const currentVehicle = await ctx.prompts.welchesEingesetzteFahrzeug();

	if (
		currentVehicle === t.Fahrzeug.KTW &&
		(await ctx.prompts.anderesFahrzeugTransportiert()) ===
			t.ÜbergabeTyp.Luftgebunden
	) {
		await ctx.messages.einsatzNichtVerrechenbarAlsKTW();

		throw new Error("Einsatz mit diesem Fahrzeug nicht abrechenbar!");
	}

	if (
		(await ctx.prompts.dispositionsSchlagwort()) === t.Disposition.ITW &&
		currentVehicle === t.Fahrzeug.ITW
	) {
		return handle_KHS_KTR_BG_SZ(ctx, AbrechnungsContext.NF);
	}

	if (!(await ctx.prompts.wurdePatientTransportiert())) {
		return handle_BG_KTR_SZ(ctx, AbrechnungsContext.NF);
	}

	switch (await ctx.prompts.notfallSzenarioOhneNA()) {
		case t.NotfalleinsatzTyp.Verkehrsunfall:
		case t.NotfalleinsatzTyp.Internistisch:
		case t.NotfalleinsatzTyp.SonstigerUnfall:
			return handle_KTR_SZ(ctx, AbrechnungsContext.NF);
		case t.NotfalleinsatzTyp.Verlegung:
			return handle_KHS_KTR_BG_SZ(ctx, AbrechnungsContext.NF);
		case t.NotfalleinsatzTyp.Schulunfall:
		case t.NotfalleinsatzTyp.ArbeitsOderWegeUnfall:
			return handle_BG_SZ_forced(ctx, AbrechnungsContext.NF);
		case t.NotfalleinsatzTyp.SonstigerNofall:
			return handle_KHS_KTR_BG_SZ(ctx, AbrechnungsContext.NF, true);
		case t.NotfalleinsatzTyp.NeugeborenenHoldienst: {
			const region = await ctx.prompts.holdienstRegion();

			switch (region) {
				case t.HoldienstTyp.Andere:
					return await handle_KHS_KTR_BG_SZ(ctx, AbrechnungsContext.NF, true);
				case t.HoldienstTyp.Landshut:
					return {
						tariff: Tarif.NF_NEUGEBORENEN_LANDSHUT,
						target: (
							await handle_KHS_KTR_BG_SZ(ctx, AbrechnungsContext.NF, true)
						).target,
					};
				case t.HoldienstTyp.Augsburg:
					return {
						tariff: Tarif.NF_NEUGEBORENEN_AUGSBURG,
						target: (
							await handle_KHS_KTR_BG_SZ(ctx, AbrechnungsContext.NF, true)
						).target,
					};
			}
		}
	}
}

async function handleKrankentransport(ctx: PromptContext) {
	return await handle_KTR_SZ(ctx, AbrechnungsContext.KTP);
}

async function handleKTPHerabstufung(ctx: PromptContext): Promise<BillingInfo> {
	switch (await ctx.prompts.herabstufungGrundKTP()) {
		case t.NotfallTyp_Downgrade.ArbeitsOderWegeOderSchulUnfall:
			ctx.setCached("istUrsacheBG", true);
			return await handle_BG_KTR_SZ(ctx, AbrechnungsContext.KTP_Herabstufung);
		case t.NotfallTyp_Downgrade.SonstigerEinsatz:
			ctx.setCached("istUrsacheBG", false);
			return await handle_BG_SZ_forced(
				ctx,
				AbrechnungsContext.KTP_Herabstufung,
			);
		case t.NotfallTyp_Downgrade.Verlegung:
			return handle_KHS_KTR_BG_SZ(ctx, AbrechnungsContext.KTP_Herabstufung);
		case t.NotfallTyp_Downgrade.Holdienst:
			return handle_KHS_KTR_BG_SZ(
				ctx,
				AbrechnungsContext.KTP_Herabstufung,
				true,
			);
		case t.NotfallTyp_Downgrade.SonstigerUnfall:
			return await handle_KTR_SZ(ctx, AbrechnungsContext.KTP_Herabstufung);
	}
}

async function handleDoctorCall(ctx: PromptContext): Promise<BillingInfo> {
	switch (await ctx.prompts.notfallSzenarioMitNA()) {
		case t.NotarzteinsatzTyp.Verlegung:
			return await handle_KHS_KTR_BG_SZ(ctx, AbrechnungsContext.NA);
		case t.NotarzteinsatzTyp.Schulunfall:
		case t.NotarzteinsatzTyp.ArbeitsOderWegeUnfall:
			ctx.setCached("istUrsacheBG", true);
			return await handle_BG_SZ_forced(ctx, AbrechnungsContext.NA);

		case t.NotarzteinsatzTyp.SonstigerNofall:
		case t.NotarzteinsatzTyp.SonstigerUnfall:
			return await handle_BG_KTR_SZ(ctx, AbrechnungsContext.NA);

		case t.NotarzteinsatzTyp.Internistisch:
		case t.NotarzteinsatzTyp.Verkehrsunfall:
			return await handle_KTR_SZ(ctx, AbrechnungsContext.NA);

		default:
			throw new Error("Unbekannter Notfalltyp");
	}
}
