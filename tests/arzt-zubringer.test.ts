import * as t from "../source/core/prompts/types.js";

import { runTest } from "./util.js";
import { Transportart } from "../source/core/logic/einsatzarten.js";

test("Arzt-Zubringer mit KTW, RTW = EA 5", async () => {
	for (const vehicle of [t.Fahrzeug.KTW, t.Fahrzeug.RTW])
		await runTest(
			{
				vorhaltung: t.Vorhaltung.Regelvorhaltung,
				szenario: t.Szenario.ArztZubringer,
				welchesEingesetzteFahrzeug: vehicle,
			},
			{ transportType: Transportart.NA_VA_Zubringer },
		);
});

test("Arzt-Zubringer mit NEF = EA 6", async () => {
	await runTest(
		{
			vorhaltung: t.Vorhaltung.Regelvorhaltung,
			szenario: t.Szenario.ArztZubringer,
			welchesEingesetzteFahrzeug: t.Fahrzeug.NEF,
		},
		{ transportType: Transportart.NEF_Einsatz },
	);
});

test("Arzt-Zubringer mit VEF = EA 7", async () => {
	await runTest(
		{
			vorhaltung: t.Vorhaltung.Regelvorhaltung,
			szenario: t.Szenario.ArztZubringer,
			welchesEingesetzteFahrzeug: t.Fahrzeug.VEF,
		},
		{ transportType: Transportart.VEF_Einsatz },
	);
});

// test("Arzt-Zubringer mit NAW, ITW = NAV", async () => {
// 	for (const vehicle of [t.Fahrzeug.NAW, t.Fahrzeug.ITW])
// 		await runTest(
// 			{
// 				vorhaltung: t.Vorhaltung.Regelvorhaltung,
// 				szenario: t.Szenario.ArztZubringer,
// 				welchesEingesetzteFahrzeug: vehicle,
// 				wurdePatientAngetroffen: true,
// 				beiEintreffenSichereTodeszeichen: false,
// 				dispositionsSchlagwort: t.Disposition.Notarzt,
// 			},
// 			{ transportType: Transportart.NA_VA_Zubringer },
// 		);
// });
