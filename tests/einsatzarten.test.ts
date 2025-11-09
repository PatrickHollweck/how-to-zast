import * as t from "../source/core/prompts/types.js";

import { runTest } from "./util.js";
import { Transportart } from "../source/core/logic/einsatzarten.js";

test("Dienstfahrt = TA 2", async () => {
	await runTest(
		{
			vorhaltung: t.Vorhaltung.Regelvorhaltung,
			szenario: t.Szenario.Dienstfahrt,
		},
		{ transportType: Transportart.Dienstfahrt },
	);
});

test("Werkstattfahrt = TA 3", async () => {
	await runTest(
		{
			vorhaltung: t.Vorhaltung.Regelvorhaltung,
			szenario: t.Szenario.Werkstattfahrt,
		},
		{ transportType: Transportart.Werkstattfahrt },
	);
});

test("Gebietsabsicherung = TA 4", async () => {
	await runTest(
		{
			vorhaltung: t.Vorhaltung.Regelvorhaltung,
			szenario: t.Szenario.Gebietsabsicherung,
		},
		{ transportType: Transportart.Gebietsabsicherung },
	);
});
