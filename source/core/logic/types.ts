import type {
	CallType,
	BillingType,
	TransportType,
	BillingTariff,
} from "../prompts/types.js";

export interface BillingInfo {
	tariff: BillingTariff;
	target: BillingType;
}

export interface ProgramResultError {
	error: string;
}

export type ProgramResultNonError =
	| {
			transportType: Exclude<TransportType, TransportType.Verrechenbar>;
	  }
	| {
			transportType: TransportType.Verrechenbar;
			callType: CallType;
			billing: BillingInfo;
	  };

export type ProgramResult = ProgramResultNonError | ProgramResultError;
