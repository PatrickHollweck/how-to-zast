import type { ProgramResult } from "../types.js";
import type { PromptContext } from "../../context.js";

import * as t from "../../prompts/types.js";

import { handleCallToTransport } from "../einsatz-typ/transport-einsatz.js";
import { isValidVehicleCallTransportCombination } from "../fahrzeug-schlagwort-validation.js";

import {
	handleNonTransport,
	handleNonTransport_NF,
} from "../kein-transport.js";

export async function handleAirTransport(
	ctx: PromptContext,
): Promise<ProgramResult> {
	const groundDoctorInvolved = await ctx.prompts.bodengebundenerNotarzt();
	const transportType = await ctx.prompts.transportBeiHeliBeteiligung();

	ctx.setCached(
		"abrechnungsfähigkeitNotarzt_KeinTransport",
		t.AblehungsgrundNotarzt.KeinGrund,
	);

	ctx.setCached(
		"abrechnungsfähigkeitNotarzt_Transport",
		t.AblehungsgrundNotarzt.KeinGrund,
	);

	const validationResult = await isValidVehicleCallTransportCombination(ctx);

	if (validationResult != null) {
		return validationResult;
	}

	if (groundDoctorInvolved) {
		await ctx.messages.hinweisBodengebundenenNotarztAngeben();

		ctx.setCached("warNotarztBeteiligt", true);

		switch (transportType) {
			case t.RthTrnasportTyp.KeinTransport:
				ctx.setCached("anderesFahrzeugTransportiert", t.ÜbergabeTyp.Keine);
				return await handleNonTransport(ctx);
			case t.RthTrnasportTyp.Bodengebunden:
				ctx.setCached("anderesFahrzeugTransportiert", t.ÜbergabeTyp.Keine);

				return await handleCallToTransport(ctx);
			case t.RthTrnasportTyp.Luftgebunden:
				ctx.setCached("wahrnehmungAlsNotfall", true);
				ctx.setCached("wurdePatientTransportiert", true);
				ctx.setCached("dispositionsSchlagwort", t.Disposition.Notarzt);

				return await handleCallToTransport(ctx);
			default:
				throw new Error("Unbekannter Transport-Typ!");
		}
	}

	ctx.setCached("warNotarztBeteiligt", false);
	ctx.setCached("anderesFahrzeugTransportiert", t.ÜbergabeTyp.Keine);
	await ctx.messages.hinweisLuftrettungsmittelNotarztAngeben();

	switch (transportType) {
		case t.RthTrnasportTyp.Bodengebunden:
			ctx.setCached("wahrnehmungAlsNotfall", true);
			ctx.setCached("wurdePatientTransportiert", true);

			return await handleCallToTransport(ctx);
		case t.RthTrnasportTyp.KeinTransport:
			if (await ctx.prompts.abrechnungsfähigkeitNotarzt_NurRdAusreichend()) {
				return await handleNonTransport(ctx);
			}

		// -- fallthrough..
		case t.RthTrnasportTyp.Luftgebunden: {
			return await handleNonTransport_NF(ctx);
		}
		default:
			throw new Error("Unbekannter Transport-Typ!");
	}
}
