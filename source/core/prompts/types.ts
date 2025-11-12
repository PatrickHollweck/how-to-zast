export enum Vorhaltung {
	Regelvorhaltung,
	Sondereinsatz,
}

export enum EinsatzZweck {
	Transport,
	ArztZubringer,
}

export enum Fahrzeug {
	KTW,
	RTW,
	NEF,
	VEF,
	NAW,
	ITW,
}

export enum Stichwort {
	// auch: #RD#KTP/RTW
	RD_KTP,
	// Notfalleinsatz; auch: RD#Überörtlich, #RD 0
	RD_1,
	// Notarzteinsatz; auch: #RD#Amok und alles größer als RD 2 jedoch kleiner als MANV
	RD_2,
	RD_MANV,
	// RD Sondereinsätze
	RD_VEF,
	RD_ITW,
	//
	RD_Absicherung_Dienstfahrt,
	RD_Absicherung_Gebietsabsicherung,
	//
	RD_Sonstige_Werkstattfahrt,
	// Rettungseinsatzfahrzeug
	// TODO: RD_REF
	// Transport von Organ-, Blut-, med. Gerät
	// TODO: RD_Hilfe_Sonstige,
	// Sonstiges
	// TODO: RD_ITH,
	// Bergwacht
	// TODO: RD_Bergrettung,
	// Wasserwacht; auch: #RD#Wassernot, #RD#Tauchunfall, #RD#Eisunfall
	// TODO: RD_Wasserrettung,
}

export enum NotarzteinsatzTyp {
	Verkehrsunfall,
	Verlegung,
	ArbeitsOderWegeUnfall,
	Schulunfall,
	Internistisch,
	SonstigerUnfall,
	SonstigerNofall,
}

export enum NotfalleinsatzTyp {
	Verkehrsunfall,
	Verlegung,
	Verlegung_VRTW,
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

export enum KrankentransportTyp {
	KtpZumKh,
	Verlegung,
	VerlegungInHeimkrankenhaus,
	Heimfahrt,
	HeimfahrtWohnungswechel,
	AmbulanzfahrtKonsil,
	AmbulanzfahrtGenehmigt,
	AmbulanzfahrtNichtGenehmigt_KHS,
	AmbulanzfahrtNichtGenehmigt_Ambulanz,
	AmbulanzfahrtBraunauSimbach,
	Dialyse,
	Sonstiger,
	TransportMedGerät,
	TransplantatTransport,
	Versorgungsleiden,
	Serienfahrt,
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

export enum KtpKulanzGrund {
	Keiner,
	AlleAußerDakVersicherte,
	AlleKrankenkassen,
}

export enum RthTransportTyp {
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
