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

// test("Kein Transport, sichere Todeszeichen = EA 8", async () => {
// 	await runTest(
// 		{
// 			vorhaltung: t.ProvisionType.Regelvorhaltung,
// 			szenario: t.CallScenario.Rettungsfahrt,
// 			wurdePatientTransportiert: false,
// 			wurdePatientAngetroffen: true,
// 			beiEintreffenSichereTodeszeichen: true,
// 		},
// 		{ transportType: t.TransportType.NichtVerrechenbar },
// 	);
// });

// test("Kein Transport, Fahrzeug egal, Schlagwort Notfall, Keine Übergabe, Kein NA  = EA 8", async () => {
// 	for (const vehicle of getNumberEnumOptions(t.VehicleKind)) {
// 		for (const callType of getNumberEnumOptions(t.AlarmReason)) {
// 			await runTest(
// 				{
// 					vorhaltung: t.ProvisionType.Regelvorhaltung,
// 					szenario: t.CallScenario.Rettungsfahrt,
// 					wurdePatientTransportiert: false,
// 					wurdePatientAngetroffen: true,
// 					beiEintreffenSichereTodeszeichen: false,
// 					welchesEingesetzteFahrzeug: vehicle,
// 					// Es is besser trotzdem nach dem Fahrzeug und Stichwort zu fragen um hier NEF usw. nicht zu erlauben!
// 					anderesFahrzeugTransportiert: t.TransferType.Keine,
// 					dispositionsSchlagwort: callType,
// 					warNotarztBeteiligt: false,
// 				},
// 				{ transportType: t.TransportType.NichtVerrechenbar },
// 			);
// 		}
// 	}
// });
