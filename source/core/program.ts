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
	if ((await ctx.prompts.vorhaltung()) === t.Vorhaltung.Sondereinsatz) {
		await ctx.messages.sondereinsätzeNichtVerpflegt();

		return {
			transportType: Transportart.Sonstig,
		};
	}

	switch (await ctx.prompts.szenario()) {
		case t.Szenario.Rettungsfahrt:
			return await handleCallToTransport(ctx);
		case t.Szenario.ArztZubringer:
			return await handleArztZubringer(ctx);
		case t.Szenario.Dienstfahrt:
			return { transportType: Transportart.Dienstfahrt };
		case t.Szenario.Werkstattfahrt:
			await ctx.messages.reparaturLängerAlsEinTag();

			return {
				transportType: Transportart.Werkstattfahrt,
			};
		case t.Szenario.Gebietsabsicherung: {
			return {
				transportType: Transportart.Gebietsabsicherung,
			};
		}
		default: {
			return { error: "Unbekanntes Szenario!" };
		}
	}
}
