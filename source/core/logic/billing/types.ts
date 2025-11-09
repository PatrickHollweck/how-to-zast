export enum AbrechnungsContext {
	KTP,
	KTP_Herabstufung,
	NF,
	NF_KVB_Verlegungsarzt,
	NA,
}

export enum Kostenträger {
	KTR = "KTR # Krankenkasse des Patienten",
	SZ = "SZ # Selbstzahler bzw. Privatrechnung",
	BG = "BG # zuständige Berufsgenossenschaft",
	KHS = "KHS # abgebendes Krankenhaus",
}

export enum Tarif {
	// Krankentransport
	KTP_KTR_BG = 10,
	KTP_SZ = 20,
	KTP_KHS = 80,
	// Notfälle
	NF_KTR_BG = 11,
	NF_SZ = 21,
	NF_KHS = 91,
	NF_NEUGEBORENEN_AUGSBURG = 71,
	NF_NEUGEBORENEN_LANDSHUT = 73,
	NF_VERLEGUNG_KVB_KTR_BG = 14,
	NF_VERLEGUNG_KVB_SZ = 24,
	NF_VERLEGUNG_KVB_KHS = 94,
	NF_ITW_KTR_BG = 13,
	NF_ITW_SZ = 23,
	NF_ITW_KHS = 93,
	// Notarzt
	NA_KTR_BG = 12,
	NA_SZ = 22,
	NA_KHS = 92,
}
