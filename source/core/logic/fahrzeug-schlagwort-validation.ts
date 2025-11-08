import type { PromptContext } from "../context.js";
import type { ProgramResult } from "../logic/types.js";

import * as t from "../prompts/types.js";

import { Transportart } from "./einsatzarten.js";
import { handleDoctorTransportToCallSite } from "./einsatz-typ/arzt-zubringer.js";

export async function isValidVehicleCallTransportCombination(
	ctx: PromptContext,
): Promise<ProgramResult | null> {
	const currentVehicle = await ctx.prompts.welchesEingesetzteFahrzeug();
	const alarmType = await ctx.prompts.dispositionsSchlagwort();

	switch (alarmType) {
		case t.Disposition.Krankentransport:
		case t.Disposition.Notfall:
		case t.Disposition.Notarzt:
			if ([t.Fahrzeug.NEF, t.Fahrzeug.VEF].includes(currentVehicle)) {
				await ctx.io.out.alert(ctx.messages.KEIN_TRANSPORTMITTEL);

				return await handleDoctorTransportToCallSite(ctx);
			}

			break;
		case t.Disposition.VEF_Verlegung:
			if ([t.Fahrzeug.NAW, t.Fahrzeug.NEF].includes(currentVehicle)) {
				return { error: ctx.messages.NEF_ODER_NAW_ZU_VEF_VERLEGUNG };
			}

			if (!(await ctx.prompts.wurdePatientTransportiert())) {
				return { error: ctx.messages.VERLEGUNG_OHNE_TRANSPORT };
			}

			if (
				(await ctx.prompts.anderesFahrzeugTransportiert()) !==
				t.ÜbergabeTyp.Keine
			) {
				await ctx.io.out.alert(ctx.messages.VEF_VERLEGUNG_ÜBERGABE_NICHT_MÖGL);

				return {
					transportType: Transportart.NichtVerrechenbar,
				};
			}

			break;
		case t.Disposition.ITW:
			if (currentVehicle !== t.Fahrzeug.ITW) {
				return { error: ctx.messages.DISPOSITION_NICHT_ITW_ZU_ITW_EINSATZ };
			}
	}

	if (currentVehicle === t.Fahrzeug.ITW || currentVehicle === t.Fahrzeug.NAW) {
		ctx.setCached("warNotarztBeteiligt", true);

		ctx.setCached(
			"abrechnungsfähigkeitNotarzt_Transport",
			t.AblehungsgrundNotarzt.KeinGrund,
		);
	}

	return null;
}
