export enum Vorhaltung {
	Regelvorhaltung,
	Sondereinsatz,
}

export enum Disposition {
	Krankentransport,
	Notfall,
	Notarzt,
	VEF_Verlegung,
	ITW,
}

export enum Fahrzeug {
	KTW,
	RTW,
	NEF,
	VEF,
	NAW,
	ITW,
}

export enum Szenario {
	Rettungsfahrt,
	Dienstfahrt,
	Werkstattfahrt,
	Gebietsabsicherung,
	ArztZubringer,
}

export enum NotfallTyp {
	Verkehrsunfall,
	Verlegung,
	ArbeitsOderWegeUnfall,
	Schulunfall,
	Internistisch,
	SonstigerUnfall,
	SonstigerNofall,
}

export enum NotarztTyp {
	Verkehrsunfall,
	Verlegung,
	ArbeitsOderWegeUnfall,
	Schulunfall,
	Internistisch,
	SonstigerUnfall,
	SonstigerNofall,
	NeugeborenenHoldienst,
}

export enum NotfallTyp_Downgrade {
	ArbeitsOderWegeOderSchulUnfall,
	SonstigerUnfall,
	SonstigerEinsatz,
	Holdienst,
	Verlegung,
}

export enum AblehungsgrundNotarzt {
	KeinGrund,
	Luftrettungsmittel,
	NAW_ITW,
	MehrerePatienten,
	NichtImDienst,
	NichtAusBayern,
	KeineLeistung,
}

export enum RthTrnasportTyp {
	KeinTransport,
	Bodengebunden,
	Luftgebunden,
}

export enum ÜbergabeTyp {
	Keine,
	Luftgebunden,
	Bodengebunden,
}

export enum HoldienstTyp {
	Andere,
	Landshut,
	Augsburg,
}
