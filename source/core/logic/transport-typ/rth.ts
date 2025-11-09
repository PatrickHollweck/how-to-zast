import type { ProgramResult } from "../types.js";
import type { PromptContext } from "../../context.js";

import * as t from "../../prompts/types.js";

import { handleCallToTransport } from "../einsatz-typ/transport-einsatz.js";

import {
	handleKeinTransport,
	handleKeinTransportAlsNotfall,
} from "../einsatz-typ/kein-transport.js";

export async function handleRTH(ctx: PromptContext): Promise<ProgramResult> {
	const groundDoctorInvolved = await ctx.prompts.bodengebundenerNotarzt();
	const transportType = await ctx.prompts.transportBeiHeliBeteiligung();

	ctx.setCached("ablehnungsgrundNotarzt", t.AblehungsgrundNotarzt.KeinGrund);

	if (groundDoctorInvolved) {
		await ctx.messages.hinweisBodengebundenenNotarztAngeben();

		ctx.setCached("warNotarztBeteiligt", true);

		switch (transportType) {
			case t.RthTransportTyp.KeinTransport:
				ctx.setCached("anderesFahrzeugTransportiert", t.ÜbergabeTyp.Keine);
				return await handleKeinTransport(ctx);
			case t.RthTransportTyp.Bodengebunden:
				ctx.setCached("anderesFahrzeugTransportiert", t.ÜbergabeTyp.Keine);

				return await handleCallToTransport(ctx);
			case t.RthTransportTyp.Luftgebunden:
				ctx.setCached("wahrnehmungAlsNotfall", true);
				ctx.setCached("wurdePatientTransportiert", true);
				ctx.setCached("dispositionsStichwort", t.Stichwort.RD_2);

				return await handleCallToTransport(ctx);
		}
	}

	ctx.setCached("warNotarztBeteiligt", false);
	ctx.setCached("anderesFahrzeugTransportiert", t.ÜbergabeTyp.Keine);
	await ctx.messages.hinweisLuftrettungsmittelNotarztAngeben();

	switch (transportType) {
		case t.RthTransportTyp.Bodengebunden:
			ctx.setCached("wahrnehmungAlsNotfall", true);
			ctx.setCached("wurdePatientTransportiert", true);

			return await handleCallToTransport(ctx);
		case t.RthTransportTyp.KeinTransport:
			if (await ctx.prompts.ablehnungsgrundNotarzt_NurRdAusreichend()) {
				return await handleKeinTransport(ctx);
			}

		// -- fallthrough..
		case t.RthTransportTyp.Luftgebunden:
			return await handleKeinTransportAlsNotfall(ctx);
		default:
			throw new Error("Unbekannter Transport-Typ!");
	}
}
