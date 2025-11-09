import type { PromptContext } from "../../context.js";
import type { ProgramResult } from "../../logic/types.js";

import * as t from "../../prompts/types.js";

import { AbrechnungsContext } from "../billing/types.js";
import { Transportart, Einsatzart } from "../einsatzarten.js";

import { findBillingType } from "../billing/billing.js";
import { handleRtwNotfall } from "../transport-typ/notfall.js";
import { handleKtpDowngrade } from "../transport-typ/ktp-downgrade.js";
import { handleNotarzteinsatz } from "../transport-typ/notarzt.js";
import { handleKrankentransport } from "../transport-typ/krankentransport.js";

import {
	handleKeinTransport,
	handleNotarztAblehnung,
} from "./kein-transport.js";

export async function handleCallToTransport(
	ctx: PromptContext,
): Promise<ProgramResult> {
	if (!(await ctx.prompts.wurdePatientTransportiert())) {
		return await handleKeinTransport(ctx);
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
		(await ctx.prompts.ablehnungsgrundNotarzt()) !==
			t.AblehungsgrundNotarzt.KeinGrund
	) {
		return await handleNotarztAblehnung(ctx);
	}

	if (doctorInvolvement) {
		return await handleNotarzteinsatz(ctx);
	}

	const currentVehicle = await ctx.prompts.welchesEingesetzteFahrzeug();
	const alarmType = await ctx.prompts.dispositionsStichwort();

	switch (currentVehicle) {
		case t.Fahrzeug.KTW:
		case t.Fahrzeug.RTW:
			if (alarmType === t.Stichwort.RD_VEF) {
				return {
					transportType: Transportart.Verrechenbar,
					callType: Einsatzart.NA_Verlegung,
					billing: await findBillingType(ctx, AbrechnungsContext.NA),
				};
			}

			if (
				alarmType === t.Stichwort.RD_2 &&
				!(await ctx.prompts.warNotarztBeteiligt())
			) {
				await ctx.messages.disponierterNotarzteinsatzOhneNotarzt();
				ctx.setCached("dispositionsStichwort", t.Stichwort.RD_1);

				return await handleCallToTransport(ctx);
			}

			break;
		case t.Fahrzeug.NEF:
		case t.Fahrzeug.VEF:
		case t.Fahrzeug.NAW:
			break;
		case t.Fahrzeug.ITW:
			if (alarmType === t.Stichwort.RD_ITW) {
				return {
					transportType: Transportart.Verrechenbar,
					callType: Einsatzart.NF_ITW,
					billing: await findBillingType(ctx, AbrechnungsContext.NF),
				};
			}
	}

	const perceptionAsEmergency = await ctx.prompts.wahrnehmungAlsNotfall();

	if (alarmType === t.Stichwort.RD_KTP && !perceptionAsEmergency) {
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

	if (alarmType > t.Stichwort.RD_KTP && !perceptionAsEmergency) {
		return await handleKtpDowngrade(ctx);
	}

	if (currentVehicle === t.Fahrzeug.RTW) {
		return await handleRtwNotfall(ctx);
	}

	throw new Error("Unreachable!");
}
