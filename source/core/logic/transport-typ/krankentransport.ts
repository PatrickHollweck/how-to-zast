import type { PromptContext } from "../../context.js";
import type { BillingInfo, ProgramResult } from "../types.js";

import * as t from "../../prompts/types.js";

import { findBillingType } from "../billing/billing.js";
import { Einsatzart, Transportart } from "../einsatzarten.js";
import { AbrechnungsContext, Kostenträger, Tarif } from "../billing/types.js";

export async function handleKrankentransport(
	ctx: PromptContext,
): Promise<ProgramResult> {
	const ktpType = await ctx.prompts.krankentransportSzenario();

	if (ktpType === t.KrankentransportTyp.HeimfahrtWohnungswechel) {
		return {
			transportType: Transportart.Verrechenbar,
			callType: Einsatzart.KTP_Heimfahrt,
			billing: {
				tariff: Tarif.KTP_SZ,
				target: Kostenträger.SZ,
			},
		};
	}

	let callType = {
		[t.KrankentransportTyp.Dialyse]: Einsatzart.KTP_Dialyse,
		[t.KrankentransportTyp.KtpZumKh]: Einsatzart.KTP_zum_KH,
		[t.KrankentransportTyp.Verlegung]: Einsatzart.KTP_Verlegung,
		[t.KrankentransportTyp.Heimfahrt]: Einsatzart.KTP_Heimfahrt,
		[t.KrankentransportTyp.Sonstiger]: Einsatzart.KTP_Sonstige,
		[t.KrankentransportTyp.Serienfahrt]: Einsatzart.KTP_Serienfahrt,
		[t.KrankentransportTyp.Versorgungsleiden]: Einsatzart.KTP_Versorgungsleiden,
		[t.KrankentransportTyp.TransportMedGerät]: Einsatzart.KTP_MedTransport,
		[t.KrankentransportTyp.AmbulanzfahrtKonsil]: Einsatzart.KTP_Ambulanzfahrt,
		[t.KrankentransportTyp.TransplantatTransport]: Einsatzart.KTP_Transplantat,
		[t.KrankentransportTyp.VerlegungInHeimkrankenhaus]:
			Einsatzart.KTP_Verlegung_HeimKHS,
		[t.KrankentransportTyp.AmbulanzfahrtGenehmigt]:
			Einsatzart.KTP_Ambulanzfahrt_genehmigt,
		[t.KrankentransportTyp.AmbulanzfahrtNichtGenehmigt_KHS]:
			Einsatzart.KTP_Ambulanzfahrt,
		[t.KrankentransportTyp.AmbulanzfahrtNichtGenehmigt_Ambulanz]:
			Einsatzart.KTP_Ambulanzfahrt,
		[t.KrankentransportTyp.AmbulanzfahrtBraunauSimbach]:
			Einsatzart.KTP_Ambulanzfahrt_KV211,
	}[ktpType];

	if (
		[
			t.KrankentransportTyp.Dialyse,
			t.KrankentransportTyp.Sonstiger,
			t.KrankentransportTyp.Serienfahrt,
			t.KrankentransportTyp.VerlegungInHeimkrankenhaus,
			t.KrankentransportTyp.AmbulanzfahrtNichtGenehmigt_Ambulanz,
			t.KrankentransportTyp.AmbulanzfahrtNichtGenehmigt_KHS,
		].includes(ktpType)
	) {
		if (await ctx.prompts.liegtKrankentransportGenehmigungVor()) {
			await ctx.messages.ktpGenehmigungsnummerEintragen();

			if (
				ktpType === t.KrankentransportTyp.AmbulanzfahrtNichtGenehmigt_KHS ||
				ktpType === t.KrankentransportTyp.AmbulanzfahrtNichtGenehmigt_Ambulanz
			) {
				callType = Einsatzart.KTP_Ambulanzfahrt_genehmigt;
			}

			if (
				(await ctx.prompts.istBeiDakVersichert()) &&
				ktpType === t.KrankentransportTyp.AmbulanzfahrtNichtGenehmigt_Ambulanz
			) {
				await ctx.messages.ktpDakHinfahrtZuNichtKhsAmbulanterBehandlungHinweis();

				callType = Einsatzart.KTP_Sonstige;
			}
		} else {
			if (
				ktpType ===
					t.KrankentransportTyp.AmbulanzfahrtNichtGenehmigt_Ambulanz &&
				(await ctx.prompts.istBeiDakVersichert())
			) {
				return {
					transportType: Transportart.Verrechenbar,
					callType: Einsatzart.KTP_Sonstige,
					billing: {
						tariff: Tarif.KTP_SZ,
						target: Kostenträger.SZ,
					},
				};
			}

			if (ktpType === t.KrankentransportTyp.VerlegungInHeimkrankenhaus) {
				return {
					error: ctx.messages.VERLEGUNG_HEIMATNAHES_KH_OHNE_GENEHMIGUNG,
				};
			}

			if (!(await ctx.prompts.ktpIstHinfahrtZuBehandlungseinrichtung())) {
				let billing: BillingInfo = {
					tariff: Tarif.KTP_KTR_BG,
					target: Kostenträger.KTR,
				};

				switch (await ctx.prompts.liegtGenehmigungsKulanzausnahmeVor()) {
					case t.KtpKulanzGrund.Keiner:
						billing = { tariff: Tarif.KTP_SZ, target: Kostenträger.SZ };
						break;

					case t.KtpKulanzGrund.AlleAußerDakVersicherte:
						if (
							ktpType ===
								t.KrankentransportTyp.AmbulanzfahrtNichtGenehmigt_KHS ||
							ktpType ===
								t.KrankentransportTyp.AmbulanzfahrtNichtGenehmigt_Ambulanz ||
							(await ctx.prompts.istBeiDakVersichert())
						) {
							billing = { tariff: Tarif.KTP_SZ, target: Kostenträger.SZ };
						}

						break;
					case t.KtpKulanzGrund.AlleKrankenkassen:
						return {
							transportType: Transportart.Verrechenbar,
							callType: Einsatzart.KTP_Sonstige,
							billing,
						};
				}

				return {
					transportType: Transportart.Verrechenbar,
					callType,
					billing,
				};
			}

			// Ambulanzfahrt, Keine Genehmigung, Hinfahrt, Keine Verlegung in Heimkrankenhaus
			switch (await ctx.prompts.liegtGenehmigungsKulanzausnahmeVor()) {
				case t.KtpKulanzGrund.Keiner:
					// Set context flags to force Kostenträger = SZ
					ctx.setCached("istUrsacheBG", false);
					ctx.setCached("istKrankenkasseBekannt", false);

					ctx.setCached(
						"verlegungInKrankenhausNiedrigerVersorungsstufe",
						false,
					);

					break;
				case t.KtpKulanzGrund.AlleAußerDakVersicherte:
					if (await ctx.prompts.istBeiDakVersichert()) {
						return {
							transportType: Transportart.Verrechenbar,
							callType: Einsatzart.KTP_Ambulanzfahrt,
							billing: {
								tariff: Tarif.KTP_SZ,
								target: Kostenträger.SZ,
							},
						};
					}

				// eslint-disable-next-line no-fallthrough
				case t.KtpKulanzGrund.AlleKrankenkassen:
					return {
						transportType: Transportart.Verrechenbar,
						callType,
						billing: {
							tariff: Tarif.KTP_KTR_BG,
							target: Kostenträger.KTR,
						},
					};
			}
		}
	}

	if (ktpType === t.KrankentransportTyp.AmbulanzfahrtKonsil) {
		ctx.setCached("verlegungInKrankenhausNiedrigerVersorungsstufe", true);
	}

	return {
		transportType: Transportart.Verrechenbar,
		callType,
		billing: await findBillingType(ctx, AbrechnungsContext.KTP),
	};
}
