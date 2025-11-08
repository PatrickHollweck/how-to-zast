import type { PromptContext } from "../context.js";
import type { ProgramResult } from "./types.js";

import * as t from "../prompts/types.js";

import { AbrechnungsContext } from "./billing/types.js";
import { Transportart, Einsatzart } from "./einsatzarten.js";

import { findBillingType } from "./billing/billing.js";
import { handleKtpDowngrade } from "./ktp-downgrade.js";
import { handleAirTransport } from "./transport-typ/rth.js";
import { isValidVehicleCallTransportCombination } from "./fahrzeug-schlagwort-validation.js";
import { handleTransportWithoutDoctorInvolvementRTW } from "./transport-typ/notfall.js";

export async function handleNonTransport(
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

	const validationResult = await isValidVehicleCallTransportCombination(ctx);

	if (validationResult != null) {
		return validationResult;
	}

	const transferToOtherVehicleType =
		await ctx.prompts.anderesFahrzeugTransportiert();

	if (transferToOtherVehicleType) {
		if (transferToOtherVehicleType === t.ÜbergabeTyp.Luftgebunden) {
			return await handleAirTransport(ctx);
		}

		switch (await ctx.prompts.welchesEingesetzteFahrzeug()) {
			case t.Fahrzeug.KTW:
			case t.Fahrzeug.RTW:
			case t.Fahrzeug.NEF:
			case t.Fahrzeug.VEF: {
				return {
					transportType: Transportart.NichtVerrechenbar,
				};
			}
			case t.Fahrzeug.NAW:
			case t.Fahrzeug.ITW:
				ctx.setCached(
					"abrechnungsfähigkeitNotarzt_Transport",
					t.AblehungsgrundNotarzt.KeinGrund,
				);

				ctx.setCached(
					"abrechnungsfähigkeitNotarzt_KeinTransport",
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

	const doctorNotBillableReason =
		await ctx.prompts.abrechnungsfähigkeitNotarzt_KeinTransport();

	switch (doctorNotBillableReason) {
		case t.AblehungsgrundNotarzt.KeinGrund:
			break;
		case t.AblehungsgrundNotarzt.NichtAusBayern:
		case t.AblehungsgrundNotarzt.Luftrettungsmittel:
			ctx.setCached(
				"abrechnungsfähigkeitNotarzt_Transport",
				doctorNotBillableReason,
			);

			return await handleNonTransport_DoctorNotBillable(ctx);
		case t.AblehungsgrundNotarzt.NAW_ITW:
		case t.AblehungsgrundNotarzt.NichtImDienst:
		case t.AblehungsgrundNotarzt.KeineLeistung:
		case t.AblehungsgrundNotarzt.MehrerePatienten:
			return { transportType: Transportart.NichtVerrechenbar };
	}

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

export async function handleNonTransport_NF(
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

export async function handleNonTransport_DoctorNotBillable(
	ctx: PromptContext,
): Promise<ProgramResult> {
	const doctorNotBillableReason =
		await ctx.prompts.abrechnungsfähigkeitNotarzt_Transport();

	const isKTW =
		(await ctx.prompts.welchesEingesetzteFahrzeug()) === t.Fahrzeug.KTW;

	switch (doctorNotBillableReason) {
		case t.AblehungsgrundNotarzt.KeinGrund:
			break;
		case t.AblehungsgrundNotarzt.KeineLeistung:
		case t.AblehungsgrundNotarzt.NichtImDienst:
		case t.AblehungsgrundNotarzt.MehrerePatienten:
			await ctx.messages.notarztNichtAbrechnungsfähig();
			ctx.setCached("warNotarztBeteiligt", false);

			if (isKTW) {
				return handleKtpDowngrade(ctx);
			}

			return await handleTransportWithoutDoctorInvolvementRTW(ctx);
		case t.AblehungsgrundNotarzt.NichtAusBayern:
			await ctx.messages.hinweisNotarztHerkunftAngeben();

			return await handleNonTransport_NF(
				ctx,
				await ctx.prompts.wurdePatientTransportiert(),
			);
		case t.AblehungsgrundNotarzt.Luftrettungsmittel:
			return await handleAirTransport(ctx);
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

					return await handleTransportWithoutDoctorInvolvementRTW(ctx);
			}
		}
	}

	throw new Error("Unreachable!");
}
