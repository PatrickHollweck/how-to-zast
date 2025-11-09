import type { Einsatzart, Transportart } from "./einsatzarten.js";
import type { Tarif, Kostenträger } from "./billing/types.js";

export interface BillingInfo {
	tariff: Tarif;
	target: Kostenträger;
}

export interface ProgramResultError {
	error: string;
}

export type ProgramResultNonError =
	| {
			transportType: Exclude<Transportart, Transportart.Verrechenbar>;
	  }
	| {
			transportType: Transportart.Verrechenbar;
			callType: Einsatzart;
			billing: BillingInfo;
	  };

export type ProgramResult = ProgramResultNonError | ProgramResultError;
