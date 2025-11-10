import type { PromptContext } from "../../context.js";
import type { ProgramResult } from "../types.js";

import * as t from "../../prompts/types.js";

import { AbrechnungsContext } from "../billing/types.js";
import { Transportart, Einsatzart } from "../einsatzarten.js";

import { handleRTH } from "../transport-typ/rth.js";
import { findBillingType } from "../billing/billing.js";
import { handleRtwNotfall } from "../transport-typ/notfall.js";
import { handleKtpDowngrade } from "../transport-typ/ktp-downgrade.js";

export async function handleKeinTransport(
	ctx: PromptContext,
): Promise<ProgramResult> {
	if (!(await ctx.prompts.wurdePatientAngetroffen())) {
		return { transportType: Transportart.Leerfahrt };
	}

	if (await ctx.prompts.beiEintreffenSichereTodeszeichen()) {
		await ctx.messages.beiEintreffenSichereTodeszeichen();

		return {
			transportType: Transportart.NichtVerrechenbar,
		};
	}

	switch (await ctx.prompts.anderesFahrzeugTransportiert()) {
		case t.ÜbergabeTyp.Keine:
			break;
		case t.ÜbergabeTyp.Luftgebunden:
			return await handleRTH(ctx);
		case t.ÜbergabeTyp.Bodengebunden:
			switch (await ctx.prompts.welchesEingesetzteFahrzeug()) {
				case t.Fahrzeug.NEF:
				case t.Fahrzeug.VEF:
					return { error: ctx.messages.KEIN_TRANSPORTMITTEL };
				case t.Fahrzeug.KTW:
				case t.Fahrzeug.RTW:
					return {
						transportType: Transportart.NichtVerrechenbar,
					};
				case t.Fahrzeug.NAW:
				case t.Fahrzeug.ITW:
					await ctx.messages.arztbesetztesRettungsmittelKeinTransport();

					ctx.setCached(
						"ablehnungsgrundNotarzt",
						t.AblehungsgrundNotarzt.KeinGrund,
					);

					ctx.setCached("warNotarztBeteiligt", true);
			}
	}

	const doctorInvolvement = await ctx.prompts.warNotarztBeteiligt();

	if (!doctorInvolvement) {
		return {
			transportType: Transportart.NichtVerrechenbar,
		};
	}

	const doctorNotBillableReason = await ctx.prompts.ablehnungsgrundNotarzt();

	switch (doctorNotBillableReason) {
		case t.AblehungsgrundNotarzt.KeinGrund:
			break;
		case t.AblehungsgrundNotarzt.NichtAusBayern:
		case t.AblehungsgrundNotarzt.Luftrettungsmittel:
			ctx.setCached("ablehnungsgrundNotarzt", doctorNotBillableReason);

			return await handleNotarztAblehnung(ctx);
		case t.AblehungsgrundNotarzt.NAW_ITW:
		case t.AblehungsgrundNotarzt.NichtImDienst:
		case t.AblehungsgrundNotarzt.KeineLeistung:
		case t.AblehungsgrundNotarzt.MehrerePatienten:
			return { transportType: Transportart.NichtVerrechenbar };
	}

	return await handleNAV(ctx);
}

export async function handleNAV(ctx: PromptContext) {
	await ctx.messages.hinweiseNAV();

	switch (await ctx.prompts.notfallSzenarioMitNA()) {
		case t.NotarzteinsatzTyp.Verkehrsunfall:
		case t.NotarzteinsatzTyp.ArbeitsOderWegeUnfall:
		case t.NotarzteinsatzTyp.Schulunfall:
		case t.NotarzteinsatzTyp.SonstigerUnfall: {
			return {
				transportType: Transportart.Verrechenbar,
				callType: Einsatzart.NA_kein_Transport_Unfall,
				billing: await findBillingType(ctx, AbrechnungsContext.NA),
			};
		}
		case t.NotarzteinsatzTyp.Internistisch:
		case t.NotarzteinsatzTyp.SonstigerNofall: {
			return {
				transportType: Transportart.Verrechenbar,
				callType: Einsatzart.NA_kein_Transport_Internistisch,
				billing: await findBillingType(ctx, AbrechnungsContext.NA),
			};
		}
		case t.NotarzteinsatzTyp.Verlegung:
			return { error: ctx.messages.VERLEGUNG_OHNE_TRANSPORT };
	}
}

export async function handleKeinTransportAlsNotfall(
	ctx: PromptContext,
	patientTransported = true,
): Promise<ProgramResult> {
	switch (await ctx.prompts.notfallSzenarioOhneNA()) {
		case t.NotfalleinsatzTyp.Schulunfall:
		case t.NotfalleinsatzTyp.Verkehrsunfall:
		case t.NotfalleinsatzTyp.SonstigerUnfall:
		case t.NotfalleinsatzTyp.ArbeitsOderWegeUnfall: {
			return {
				transportType: Transportart.Verrechenbar,
				callType: Einsatzart.NF_kein_Transport_Unfall,
				billing: await findBillingType(ctx, AbrechnungsContext.NF),
			};
		}

		case t.NotfalleinsatzTyp.Verlegung:
		case t.NotfalleinsatzTyp.Verlegung_VRTW:
		case t.NotfalleinsatzTyp.NeugeborenenHoldienst:
			if (!patientTransported) {
				return {
					error:
						"**Fehler:** Eine Verlegung ohne Transport gibt es nicht... Dieses Einsatzszenario ist so nicht möglich.",
				};
			}

		// eslint-disable-next-line no-fallthrough
		case t.NotfalleinsatzTyp.Internistisch:
		case t.NotfalleinsatzTyp.SonstigerNofall: {
			return {
				transportType: Transportart.Verrechenbar,
				callType: Einsatzart.NF_kein_Transport_SonstNotfall,
				billing: await findBillingType(ctx, AbrechnungsContext.NF),
			};
		}
	}
}

export async function handleNotarztAblehnung(
	ctx: PromptContext,
): Promise<ProgramResult> {
	switch (await ctx.prompts.ablehnungsgrundNotarzt()) {
		case t.AblehungsgrundNotarzt.KeinGrund:
			break;
		case t.AblehungsgrundNotarzt.KeineLeistung:
		case t.AblehungsgrundNotarzt.NichtImDienst:
		case t.AblehungsgrundNotarzt.MehrerePatienten:
			await ctx.messages.notarztNichtAbrechnungsfähig();
			ctx.setCached("warNotarztBeteiligt", false);

			if ((await ctx.prompts.welchesEingesetzteFahrzeug()) === t.Fahrzeug.KTW) {
				return handleKtpDowngrade(ctx);
			}

			return await handleRtwNotfall(ctx);
		case t.AblehungsgrundNotarzt.NichtAusBayern:
			await ctx.messages.hinweisNotarztHerkunftAngeben();

			return await handleKeinTransportAlsNotfall(
				ctx,
				await ctx.prompts.wurdePatientTransportiert(),
			);
		case t.AblehungsgrundNotarzt.Luftrettungsmittel:
			return await handleRTH(ctx);
		case t.AblehungsgrundNotarzt.NAW_ITW: {
			const currentVehicle = await ctx.prompts.welchesEingesetzteFahrzeug();

			switch (currentVehicle) {
				case t.Fahrzeug.KTW:
				case t.Fahrzeug.RTW:
					await ctx.messages.transportBeiVersorgungDurchNAW();

					return {
						transportType: Transportart.Verrechenbar,
						callType: Einsatzart.KTP_zum_KH,
						billing: await findBillingType(
							ctx,
							AbrechnungsContext.KTP_Herabstufung,
						),
					};
				case t.Fahrzeug.NEF:
				case t.Fahrzeug.VEF:
					return { error: ctx.messages.KEIN_TRANSPORTMITTEL };
				case t.Fahrzeug.NAW:
					return { error: ctx.messages.NAW_OHNE_ARZT };
				case t.Fahrzeug.ITW:
					await ctx.messages.notarztNichtAbrechnungsfähig();
					ctx.setCached("warNotarztBeteiligt", false);

					return await handleRtwNotfall(ctx);
			}
		}
	}

	throw new Error("Unreachable!");
}
