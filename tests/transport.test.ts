import * as t from "../source/core/prompts/types.js";
import { Transportart } from "../source/core/logic/einsatzarten.js";

import { runTest } from "./util.js";

test("Kein Patient angetroffen = EA 9", async () => {
	await runTest(
		{
			kvTyp: t.KvTyp.ÖffentlicheRechtlicheVorhaltung,
			vorhaltung: t.Vorhaltung.Regelvorhaltung,
			einsatzSzenario: t.EinsatzZweck.Transport,
			welchesEingesetzteFahrzeug: t.Fahrzeug.RTW,
			dispositionsStichwort: t.Stichwort.RD_KTP,
			wurdePatientTransportiert: false,
			wurdePatientAngetroffen: false,
		},
		{ transportType: Transportart.Leerfahrt },
	);
});

test("Kein Transport, sichere Todeszeichen = EA 8", async () => {
	await runTest(
		{
			kvTyp: t.KvTyp.ÖffentlicheRechtlicheVorhaltung,
			vorhaltung: t.Vorhaltung.Regelvorhaltung,
			wurdePatientTransportiert: false,
			wurdePatientAngetroffen: true,
			welchesEingesetzteFahrzeug: t.Fahrzeug.RTW,
			beiEintreffenSichereTodeszeichen: true,
			einsatzSzenario: t.EinsatzZweck.Transport,
			dispositionsStichwort: t.Stichwort.RD_KTP,
		},
		{ transportType: Transportart.NichtVerrechenbar },
	);
});

test("Kein Transport, KTW/RTW, Keine Übergabe, Kein NA  = EA 8", async () => {
	for (const vehicle of [t.Fahrzeug.KTW, t.Fahrzeug.RTW]) {
		for (const callType of [
			t.Stichwort.RD_KTP,
			t.Stichwort.RD_1,
			t.Stichwort.RD_2,
		]) {
			await runTest(
				{
					kvTyp: t.KvTyp.ÖffentlicheRechtlicheVorhaltung,
					vorhaltung: t.Vorhaltung.Regelvorhaltung,
					einsatzSzenario: t.EinsatzZweck.Transport,
					dispositionsStichwort: callType,
					wurdePatientTransportiert: false,
					wurdePatientAngetroffen: true,
					beiEintreffenSichereTodeszeichen: false,
					welchesEingesetzteFahrzeug: vehicle,
					// Es is besser trotzdem nach dem Fahrzeug und Stichwort zu fragen um hier NEF usw. nicht zu erlauben!
					anderesFahrzeugTransportiert: t.ÜbergabeTyp.Keine,
					warNotarztBeteiligt: false,
				},
				{ transportType: Transportart.NichtVerrechenbar },
			);
		}
	}
});

test("Kein Transport, KTW/RTW, VEF-Verlegung  = EA 8", async () => {
	for (const vehicle of [t.Fahrzeug.KTW, t.Fahrzeug.RTW]) {
		await runTest(
			{
				kvTyp: t.KvTyp.ÖffentlicheRechtlicheVorhaltung,
				vorhaltung: t.Vorhaltung.Regelvorhaltung,
				wurdePatientTransportiert: false,
				welchesEingesetzteFahrzeug: vehicle,
				dispositionsStichwort: t.Stichwort.RD_VEF,
			},
			{ error: "" },
		);
	}
});
