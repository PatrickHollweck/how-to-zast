import * as t from "../source/core/prompts/types.js";

import { runTest } from "./util.js";
import { Einsatzart, Transportart } from "../source/core/logic/einsatzarten.js";
import { Kostenträger, Tarif } from "../source/core/logic/billing/types.js";

test("Arzt-Zubringer mit KTW, RTW = EA 5", async () => {
	for (const vehicle of [t.Fahrzeug.KTW, t.Fahrzeug.RTW])
		await runTest(
			{
				kvTyp: t.KvTyp.ÖffentlicheRechtlicheVorhaltung,
				vorhaltung: t.Vorhaltung.Regelvorhaltung,
				dispositionsStichwort: t.Stichwort.RD_1,
				einsatzSzenario: t.EinsatzZweck.ArztZubringer,
				welchesEingesetzteFahrzeug: vehicle,
			},
			{ transportType: Transportart.NA_VA_Zubringer },
		);
});

test("Arzt-Zubringer mit NEF = EA 6", async () => {
	await runTest(
		{
			kvTyp: t.KvTyp.ÖffentlicheRechtlicheVorhaltung,
			vorhaltung: t.Vorhaltung.Regelvorhaltung,
			dispositionsStichwort: t.Stichwort.RD_1,
			welchesEingesetzteFahrzeug: t.Fahrzeug.NEF,
		},
		{ transportType: Transportart.NEF_Einsatz },
	);
});

test("Arzt-Zubringer mit VEF = EA 7", async () => {
	await runTest(
		{
			kvTyp: t.KvTyp.ÖffentlicheRechtlicheVorhaltung,
			vorhaltung: t.Vorhaltung.Regelvorhaltung,
			dispositionsStichwort: t.Stichwort.RD_VEF,
			welchesEingesetzteFahrzeug: t.Fahrzeug.VEF,
		},
		{ transportType: Transportart.VEF_Einsatz },
	);
});

test("Arzt-Zubringer mit NAW, ITW = NAV", async () => {
	for (const vehicle of [t.Fahrzeug.NAW, t.Fahrzeug.ITW])
		await runTest(
			{
				kvTyp: t.KvTyp.ÖffentlicheRechtlicheVorhaltung,
				vorhaltung: t.Vorhaltung.Regelvorhaltung,
				dispositionsStichwort: t.Stichwort.RD_1,
				einsatzSzenario: t.EinsatzZweck.ArztZubringer,
				welchesEingesetzteFahrzeug: vehicle,
				wurdePatientAngetroffen: true,
				beiEintreffenSichereTodeszeichen: false,
				anderesFahrzeugTransportiert: t.ÜbergabeTyp.Keine,
				notfallSzenarioMitNA: t.NotarzteinsatzTyp.Internistisch,
				transportUrsprungOderZielHuLaPla: false,
				istPrivateOderUnbekannteKrankenkasse: false,
			},
			{
				transportType: Transportart.Verrechenbar,
				callType: Einsatzart.NA_kein_Transport_Internistisch,
				billing: { tariff: Tarif.NA_KTR_BG, target: Kostenträger.KTR },
			},
		);
});
