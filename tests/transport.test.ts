import * as t from "../source/core/prompts/types.js";
import { Transportart } from "../source/core/logic/einsatzarten.js";

import { runTest } from "./util.js";

test("Kein Patient angetroffen = EA 9", async () => {
	await runTest(
		{
			vorhaltung: t.Vorhaltung.Regelvorhaltung,
			szenario: t.Szenario.Rettungsfahrt,
			wurdePatientTransportiert: false,
			wurdePatientAngetroffen: false,
		},
		{ transportType: Transportart.Leerfahrt },
	);
});

test("Kein Transport, sichere Todeszeichen = EA 8", async () => {
	await runTest(
		{
			vorhaltung: t.Vorhaltung.Regelvorhaltung,
			szenario: t.Szenario.Rettungsfahrt,
			wurdePatientTransportiert: false,
			wurdePatientAngetroffen: true,
			beiEintreffenSichereTodeszeichen: true,
		},
		{ transportType: Transportart.NichtVerrechenbar },
	);
});

test("Kein Transport, KTW/RTW, Keine Übergabe, Kein NA  = EA 8", async () => {
	for (const vehicle of [t.Fahrzeug.KTW, t.Fahrzeug.RTW]) {
		for (const callType of [
			t.Disposition.Krankentransport,
			t.Disposition.Notfall,
			t.Disposition.Notarzt,
		]) {
			await runTest(
				{
					vorhaltung: t.Vorhaltung.Regelvorhaltung,
					szenario: t.Szenario.Rettungsfahrt,
					wurdePatientTransportiert: false,
					wurdePatientAngetroffen: true,
					beiEintreffenSichereTodeszeichen: false,
					welchesEingesetzteFahrzeug: vehicle,
					// Es is besser trotzdem nach dem Fahrzeug und Stichwort zu fragen um hier NEF usw. nicht zu erlauben!
					anderesFahrzeugTransportiert: t.ÜbergabeTyp.Keine,
					dispositionsSchlagwort: callType,
					warNotarztBeteiligt: false,
				},
				{ transportType: Transportart.NichtVerrechenbar },
			);
		}
	}
});

test("Kein Transport, KTW/RTW, VEF-Verlegung  = EA 8", async () => {
	for (const vehicle of [t.Fahrzeug.KTW, t.Fahrzeug.RTW]) {
		for (const callType of [t.Disposition.VEF_Verlegung]) {
			await runTest(
				{
					vorhaltung: t.Vorhaltung.Regelvorhaltung,
					szenario: t.Szenario.Rettungsfahrt,
					wurdePatientTransportiert: false,
					wurdePatientAngetroffen: true,
					beiEintreffenSichereTodeszeichen: false,
					welchesEingesetzteFahrzeug: vehicle,
					dispositionsSchlagwort: callType,
				},
				{ error: "" },
			);
		}
	}
});
