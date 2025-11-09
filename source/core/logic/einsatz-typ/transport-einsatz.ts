import type { PromptContext } from "../../context.js";
import type { ProgramResult } from "../../logic/types.js";

import * as t from "../../prompts/types.js";

import { AbrechnungsContext } from "../billing/types.js";
import { Transportart, Einsatzart } from "../einsatzarten.js";

import { findBillingType } from "../billing/billing.js";
import { handleKtpDowngrade } from "../ktp-downgrade.js";
import { handleKrankentransport } from "../transport-typ/krankentransport.js";
import { handleTransportWithDoctorInvolvement } from "../transport-typ/notarzt.js";
import { isValidVehicleCallTransportCombination } from "../fahrzeug-schlagwort-validation.js";
import { handleTransportWithoutDoctorInvolvementRTW } from "../transport-typ/notfall.js";

import {
	handleNonTransport,
	handleNonTransport_DoctorNotBillable,
} from "../kein-transport.js";

export async function handleCallToTransport(
	ctx: PromptContext,
): Promise<ProgramResult> {
	const transport = await ctx.prompts.wurdePatientTransportiert();

	if (!transport) {
		return await handleNonTransport(ctx);
	}

	const validationResult = await isValidVehicleCallTransportCombination(ctx);

	if (validationResult != null) {
		return validationResult;
	}

	// Bei Transport von oder zu HuLaPla ist eine Arztbeteiligung o.ä irrelevant,
	// es wird immer nur ein 1/19 abgerechnet
	if (await ctx.prompts.transportUrsprungOderZielHuLaPla()) {
		return {
			transportType: Transportart.Verrechenbar,
			callType: Einsatzart.KTP_Sonstige,
			billing: await findBillingType(ctx, AbrechnungsContext.KTP),
		};
	}

	const doctorInvolvement = await ctx.prompts.warNotarztBeteiligt();

	if (
		doctorInvolvement &&
		(await ctx.prompts.abrechnungsfähigkeitNotarzt_Transport()) !==
			t.AblehungsgrundNotarzt.KeinGrund
	) {
		return await handleNonTransport_DoctorNotBillable(ctx);
	}

	if (doctorInvolvement) {
		return await handleTransportWithDoctorInvolvement(ctx);
	}

	const currentVehicle = await ctx.prompts.welchesEingesetzteFahrzeug();
	const alarmType = await ctx.prompts.dispositionsSchlagwort();

	switch (currentVehicle) {
		case t.Fahrzeug.KTW:
		case t.Fahrzeug.RTW:
			if (alarmType === t.Disposition.VEF_Verlegung) {
				return {
					transportType: Transportart.Verrechenbar,
					callType: Einsatzart.NA_Verlegung,
					billing: await findBillingType(ctx, AbrechnungsContext.NA),
				};
			}

			if (
				alarmType === t.Disposition.Notarzt &&
				!(await ctx.prompts.warNotarztBeteiligt())
			) {
				await ctx.messages.disponierterNotarzteinsatzOhneNotarzt();
				ctx.setCached("dispositionsSchlagwort", t.Disposition.Notfall);

				return await handleCallToTransport(ctx);
			}

			break;
		case t.Fahrzeug.NEF:
		case t.Fahrzeug.VEF:
		case t.Fahrzeug.NAW:
			break;
		case t.Fahrzeug.ITW:
			if (alarmType === t.Disposition.ITW) {
				return {
					transportType: Transportart.Verrechenbar,
					callType: Einsatzart.NF_ITW,
					billing: await findBillingType(ctx, AbrechnungsContext.NF),
				};
			}
	}

	const perceptionAsEmergency = await ctx.prompts.wahrnehmungAlsNotfall();

	if (alarmType === t.Disposition.Krankentransport && !perceptionAsEmergency) {
		return await handleKrankentransport(ctx);
	}

	if (currentVehicle === t.Fahrzeug.KTW && perceptionAsEmergency) {
		await ctx.messages.ktpNotfallHerabstufung();

		return {
			transportType: Transportart.Verrechenbar,
			callType: Einsatzart.KTP_Notfall,
			billing: await findBillingType(ctx, AbrechnungsContext.KTP),
		};
	}

	if (alarmType > t.Disposition.Krankentransport && !perceptionAsEmergency) {
		return await handleKtpDowngrade(ctx);
	}

	if (currentVehicle === t.Fahrzeug.RTW) {
		return await handleTransportWithoutDoctorInvolvementRTW(ctx);
	}

	throw new Error("Unreachable!");
}
