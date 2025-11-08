import type { PromptContext } from "../context.js";
import type { ProgramResult } from "../logic/types.js";

import * as t from "../prompts/types.js";

import { findBillingType } from "./billing/billing.js";
import { AbrechnungsContext } from "./billing/types.js";
import { handleCallToTransport } from "./einsatz-typ/transport-einsatz.js";
import { Transportart, Einsatzart } from "./einsatzarten.js";
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
				await handleDoctorTransportToCallSite(ctx);

				return { error: ctx.messages.KEIN_TRANSPORTMITTEL };
			}

			break;
		case t.Disposition.VEF_Verlegung:
			if ([t.Fahrzeug.NAW, t.Fahrzeug.NEF].includes(currentVehicle)) {
				return { error: ctx.messages.NEF_ODER_NAW_ZU_VEF_VERLEGUNG };
			}

			break;
		case t.Disposition.ITW:
			if (currentVehicle !== t.Fahrzeug.ITW) {
				return { error: ctx.messages.DISPOSITION_NICHT_ITW_ZU_ITW_EINSATZ };
			}
	}

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

		case t.Fahrzeug.ITW:
			if (alarmType === t.Disposition.ITW) {
				return {
					transportType: Transportart.Verrechenbar,
					callType: Einsatzart.NF_ITW,
					billing: await findBillingType(ctx, AbrechnungsContext.NF),
				};
			}

		// -- fallthrough...
		case t.Fahrzeug.NAW:
			ctx.setCached("warNotarztBeteiligt", true);

			ctx.setCached(
				"abrechnungsfähigkeitNotarzt_Transport",
				t.AblehungsgrundNotarzt.KeinGrund,
			);

			break;
		case t.Fahrzeug.NEF:
		case t.Fahrzeug.VEF:
			await handleDoctorTransportToCallSite(ctx);

			return { error: ctx.messages.KEIN_TRANSPORTMITTEL };
	}

	return null;
}
