export enum MessageType {
  Info,
  Success,
  Warning,
  Alert,
  Error,
}

export const enum AlarmReason {
  Krankentransport,
  Notfall,
  Notarzt,
  Verlegungsarzt,
  ITW,
}

export const enum VehicleKind {
  KTW,
  RTW,
  NEF,
  VEF,
  NAW,
  ITW,
}

export const enum CallScenario {
  Rettungsfahrt,
  Dienstfahrt,
  Werkstattfahrt,
  Gebietsabsicherung,
  ArztZubringer,
  HuLaPlaÜbernahme,
}

export const enum EmergencyScenario_NA {
  Verkehrsunfall,
  Verlegung,
  ArbeitsOderWegeUnfall,
  Schulunfall,
  Internistisch,
  SonstigerUnfall,
  SonstigerNofall,
}

export const enum EmergencyScenario_NF_Downgrade {
  ArbeitsOderWegeOderSchulUnfall,
  SonstigerUnfall,
  SonstigerEinsatz,
}

export const enum DoctorNotBillableReason {
  KeinGrund,
  Luftrettungsmittel,
  NAW_ITW,
  MehrerePatienten,
  NichtImDienst,
  KeineLeistung,
}

export const enum ProvisionType {
  Regelvorhaltung,
  Sondereinsatz,
}

export const enum BillingContextTyp {
  KTP,
  KTP_Herabstufung,
  NF,
  NA,
}

export const enum BillingType {
  KTR = "KTR # Krankenkasse des Patienten",
  SZ = "SZ # Selbstzahler bzw. Privatrechnung",
  BG = "BG # zuständige Berufsgenossenschaft",
  KHS = "KHS # abgebendes Krankenhaus",
}

export const enum BillingTariff {
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

export const enum TransportType {
  Sonstig = 0,
  Verrechenbar = 1,
  Dienstfahrt = 2,
  Werkstattfahrt = 3,
  Gebietsabsicherung = 4,
  NA_VA_Zubringer = 5,
  NEF_Einsatz = 6,
  VEF_Einsatz = 7,
  NichtVerrechenbar = 8,
  Leerfahrt = 9,
}

export enum CallType {
  KTP_zum_KH = 10,
  KTP_Verlegung = 11,
  KTP_Heimfahrt = 12,
  KTP_Ambulanzfahrt = 13,
  KTP_Ambulanzfahrt_genehmigt = 15,
  KTP_Dialyse = 16,
  KTP_Notfall = 17,
  KTP_Ambulanzfahrt_KV211 = 18,
  KTP_Sonstige = 19,
  KTP_RÜckverlegung = 90,
  KTP_MedTransport = 91,
  KTP_Transplantat = 93,
  KTP_BG_Unfall = 94,
  KTP_Sonstiger_Unfall = 95,
  KTP_Versorgungsleiden = 96,
  KTP_Serienfahrt = 98,
  // NF
  NF_VU = 20,
  NF_Verlegung = 21,
  NF_Arbeitsunfall = 22,
  NF_Schulunfall = 23,
  NF_Internistisch = 25,
  NF_Sonstiger_Unfall = 26,
  NF_kein_Transport_Internistisch = 27,
  NF_kein_Transport_Unfall = 28,
  NF_Sonstiger_Nofall = 29,
  NF_Neugeborenen_Allgemein = 92,
  NF_Neugeborenen_Augsburg_Landshut = 92,
  NF_Verlegung_KVB = 97,
  NF_ITW = 99,
  // NA
  NA_VU = 60,
  NA_Verlegung = 61,
  NA_Arbeitsunfall = 62,
  NA_Schulunfall = 63,
  NA_Internistisch = 65,
  NA_Sonstiger_Unfall = 66,
  NA_kein_Transport_Internistisch = 67,
  NA_kein_Transport_Unfall = 68,
  NA_Sonstiger_Notfall = 69,
}
