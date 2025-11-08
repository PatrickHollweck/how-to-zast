import type { PromptContext } from "../../context.js";
import type { ProgramResult } from "../types.js";

import * as t from "../../prompts/types.js";

import { Transportart } from "../einsatzarten.js";
import { handleNonTransport } from "../kein-transport.js";

export async function handleDoctorTransportToCallSite(
	ctx: PromptContext,
): Promise<ProgramResult> {
	switch (await ctx.prompts.welchesEingesetzteFahrzeug()) {
		case t.Fahrzeug.KTW:
		case t.Fahrzeug.RTW:
			return {
				transportType: Transportart.NA_VA_Zubringer,
			};
		case t.Fahrzeug.NEF:
			return { transportType: Transportart.NEF_Einsatz };
		case t.Fahrzeug.VEF:
			return { transportType: Transportart.VEF_Einsatz };
		case t.Fahrzeug.ITW:
		case t.Fahrzeug.NAW:
			ctx.setCached(
				"abrechnungsfähigkeitNotarzt_KeinTransport",
				t.AblehungsgrundNotarzt.KeinGrund,
			);

			return await handleNonTransport(ctx);
	}
}
