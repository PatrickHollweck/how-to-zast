import * as t from "../source/core/prompts/types.js";

import { runTest } from "./util.js";
import { Transportart } from "../source/core/logic/einsatzarten.js";

test("Dienstfahrt = TA 2", async () => {
	await runTest(
		{
			vorhaltung: t.Vorhaltung.Regelvorhaltung,
			dispositionsStichwort: t.Stichwort.RD_Absicherung_Dienstfahrt,
		},
		{ transportType: Transportart.Dienstfahrt },
	);
});

test("Werkstattfahrt = TA 3", async () => {
	await runTest(
		{
			vorhaltung: t.Vorhaltung.Regelvorhaltung,
			dispositionsStichwort: t.Stichwort.RD_Sonstige_Werkstattfahrt,
		},
		{ transportType: Transportart.Werkstattfahrt },
	);
});

test("Gebietsabsicherung = TA 4", async () => {
	await runTest(
		{
			vorhaltung: t.Vorhaltung.Regelvorhaltung,
			dispositionsStichwort: t.Stichwort.RD_Absicherung_Gebietsabsicherung,
		},
		{ transportType: Transportart.Gebietsabsicherung },
	);
});
