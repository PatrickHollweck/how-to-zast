import type { PromptContext } from "./context.js";
import type { ProgramResult } from "./logic/types.js";

import * as t from "./prompts/types.js";

import { Transportart } from "./logic/einsatzarten.js";
import { handleArztZubringer } from "./logic/einsatz-typ/arzt-zubringer.js";
import { handleCallToTransport } from "./logic/einsatz-typ/transport-einsatz.js";

export async function run(ctx: PromptContext): Promise<ProgramResult> {
	const result = await startPrompting(ctx);

	if ("error" in result) {
		await ctx.io.out.error(`Fehler: ${result.error}`);
	} else {
		await ctx.io.out.result(result);
	}

	return result;
}

async function startPrompting(ctx: PromptContext): Promise<ProgramResult> {
	const kvTyp = await ctx.prompts.kvTyp();

	switch (kvTyp) {
		case t.KvTyp.ÖffentlicheRechtlicheVorhaltung:
			// TODO: "Nein" Branch aus der Dokumentation wird hier nicht berücksichtigt! - Nachfragen, wie diese Sektion zu verstehen ist!
			ctx.kvType = t.KvTräger.HauptKv;
			break;
		case t.KvTyp.TemporäreVohalteerhöhung:
			if (await ctx.prompts.vorhalteErhöhungFinanzierungDurchKtr()) {
				ctx.kvType = t.KvTräger.HauptKv;
			} else {
				ctx.kvType = t.KvTräger.SonderfahrdienstKv;
			}

			break;

		case t.KvTyp.WasserrettungBergrettung:
			return {
				error:
					"Berg-, Wasser-, und Einsätze des Luftrettungsdienst aktuell nicht implementiert!",
			};

		case t.KvTyp.BayKSG:
			return {
				transportType: Transportart.NichtVerrechenbar,
			};

		case t.KvTyp.Privat:
			return {
				error:
					"**Keine Erfassung und Abrechnung über die ZAST!** Der jeweilige Durchführende rechnet gemäß seines Vertrages direkt mit den Kostenträgern ab!",
			};
	}

	if ((await ctx.prompts.vorhaltung()) === t.Vorhaltung.Sondereinsatz) {
		await ctx.messages.sondereinsätzeNichtVerpflegt();

		return {
			transportType: Transportart.Sonstig,
		};
	}

	const alarmType = await ctx.prompts.dispositionsStichwort();

	switch (alarmType) {
		case t.Stichwort.RD_KTP:
		case t.Stichwort.RD_1:
		case t.Stichwort.RD_2:
		case t.Stichwort.RD_VEF:
		case t.Stichwort.RD_ITW: {
			const currentVehicle = await ctx.prompts.welchesEingesetzteFahrzeug();

			switch (alarmType) {
				case t.Stichwort.RD_1:
				case t.Stichwort.RD_2:
				case t.Stichwort.RD_KTP:
					if ([t.Fahrzeug.NEF, t.Fahrzeug.VEF].includes(currentVehicle)) {
						await ctx.io.out.alert(ctx.messages.KEIN_TRANSPORTMITTEL);

						return await handleArztZubringer(ctx);
					}

					break;
				case t.Stichwort.RD_VEF:
					if (currentVehicle === t.Fahrzeug.VEF) {
						return handleArztZubringer(ctx);
					}

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
						await ctx.io.out.alert(
							ctx.messages.VEF_VERLEGUNG_ÜBERGABE_NICHT_MÖGL,
						);

						return {
							transportType: Transportart.NichtVerrechenbar,
						};
					}

					break;
				case t.Stichwort.RD_ITW:
					if (currentVehicle !== t.Fahrzeug.ITW) {
						return { error: ctx.messages.DISPOSITION_NICHT_ITW_ZU_ITW_EINSATZ };
					}
			}

			if (
				currentVehicle === t.Fahrzeug.ITW ||
				currentVehicle === t.Fahrzeug.NAW
			) {
				ctx.setCached("warNotarztBeteiligt", true);
				ctx.setCached(
					"ablehnungsgrundNotarzt",
					t.AblehungsgrundNotarzt.KeinGrund,
				);
			}

			switch (await ctx.prompts.einsatzSzenario()) {
				case t.EinsatzZweck.Transport:
					return await handleCallToTransport(ctx);

				case t.EinsatzZweck.ArztZubringer:
					return await handleArztZubringer(ctx);

				default:
					return { error: "Unbekanntes Einsatzszenario!" };
			}
		}
		case t.Stichwort.RD_MANV:
			return { error: ctx.messages.ABRECHNUNG_MANV };

		case t.Stichwort.RD_Absicherung_Dienstfahrt:
			return {
				transportType: Transportart.Dienstfahrt,
			};

		case t.Stichwort.RD_Absicherung_Gebietsabsicherung:
			return {
				transportType: Transportart.Gebietsabsicherung,
			};

		case t.Stichwort.RD_Sonstige_Werkstattfahrt:
			await ctx.messages.reparaturLängerAlsEinTag();

			return {
				transportType: Transportart.Werkstattfahrt,
			};
	}
}
