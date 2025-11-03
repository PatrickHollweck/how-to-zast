import { cachedAnswer } from "./cache.js";

import type { PromptIOProvider } from "../io/io-provider.js";

export enum AlarmReason {
  Krankentransport,
  Notfall,
  Notarzt,
  Verlegungsarzt,
}

export enum VehicleKind {
  KTW,
  RTW,
  NEF,
  VEF,
  ITW,
  Misc,
}

export enum CallScenario {
  Rettungsfahrt,
  Dienstfahrt,
  Werkstattfahrt,
  Gebietsabsicherung,
  ArztZubringer,
}

export enum EmergencyScenario {
  Verkehrsunfall,
  Verlegung,
  ArbeitsWegeUnfall,
  Schulunfall,
  Internistisch,
  SonstigerUnfall,
  SonstigerNofall,
}

export enum ProvisionType {
  Regelvorhaltung,
  Sondereinsatz,
}

export const createContext = (io: PromptIOProvider) => ({
  io,
  vorhaltung: cachedAnswer(() => {
    return io.select({
      title:
        "Fand dein Einsatz im Rahmen des Hauptaufgabengebietes nach BayRDG statt?",
      choices: [
        {
          name: "Regelvorhaltung",
          value: ProvisionType.Regelvorhaltung,
          description:
            "Rettungsmittel die öffentlich-rechtlich regelhaft vorgehalten werden",
        },
        {
          name: "Sondereinsatz",
          value: ProvisionType.Sondereinsatz,
          description: "z.B: LRD, UGRD, ORGL, ELRD, HvO, SEG-Einsatz",
        },
      ],
    });
  }),
  szenario: cachedAnswer(() => {
    return io.select({
      title: "Was beschreibt die Hauptaufgabe der Fahrt am besten...?",
      choices: [
        {
          name: "Fahrt zu Rettungseinsatz als Transportmittel",
          description:
            "Transportmittel nach DIN1789 wie: KTW, N-KTW, RTW\nausschließlich bei Beauftragung durch zuständige ILS",
          value: CallScenario.Rettungsfahrt,
        },
        {
          name: "Zubringen eines Arztes",
          description:
            "Ein Notarzt oder Verlegungsarzt wurde durch die Leitstelle alarmiert und an die Einstalstelle verbracht.\nTypischerweise: NEF, VEF Einsätze\nAuch zu nutzen wenn NEF oder VEF defekt, besetzt oder anderweitig belegt ist und ein anderes Fahrzeug genutzt wird.",
          value: CallScenario.ArztZubringer,
        },
        {
          name: "Fahrt zur Aufrechterhaltung des Dienstbetriebs",
          value: CallScenario.Dienstfahrt,
          description:
            "Voraussetzungen:\n1. Durchführung nur auf Anordnung durch KGF oder RDL\n2. Leitstelle muss davon unterrichtet sein und muss innerhalb der Vorhaltezeit diese Fahrt genehmigen\noder: nötige Fahrten zur Personalumsetzung",
        },
        {
          name: "Fahrt von oder zur Werkstatt",
          value: CallScenario.Werkstattfahrt,
          description:
            "Voraussetzung: Direkter Zusammenhang mit Reparatur eines Rettungsdienstfahrzeugs muss vorliegen",
        },
        {
          name: "Fahrt zur Gebietsabsicherung",
          value: CallScenario.Gebietsabsicherung,
          description:
            "Alarmierung durch zuständige ILS mit: R0540#Gebietsabsicherung\nSicherstellung der Einsatzfähigkeit in einem anderen Rettungsdienstbereich bzw. Einsatzgebiet einer anderen Rettungswache",
        },
      ],
    });
  }),
  alarmiert_als: cachedAnswer(() => {
    return io.select({
      title: "Alarmierung als...",
      description: "Was steht auf deinem Display?",
      choices: [
        {
          name: "Notfalleinsatz - ohne Notarzt",
          value: AlarmReason.Notfall,
          description: "typsicherweise: RD1 - KEINE Beteiligung eines Notarzt",
        },
        {
          name: "Notfalleinsatz - mit Notarzt",
          value: AlarmReason.Notarzt,
          description:
            "typischerweise: RD2 oder höher - MIT Beteiligung eines Notarzt",
        },
        {
          name: "Krankentransport",
          value: AlarmReason.Krankentransport,
          description: "#RD#KTP#90XX - auch Prio.2 (#9017) Einsätze!",
        },
        {
          name: "Einsatz mit Verlegungsarzt",
          value: AlarmReason.Verlegungsarzt,
          description: "typischerweise: #RD#VEF",
        },
      ],
    });
  }),
  wahrnehmung_als_notfall: cachedAnswer(() => {
    // TODO: Hilfestellung in Beschreibung - wie definiert?
    return io.selectBool("Wahrnehmung am Einsatzotrt als Notfall?");
  }),
  patient_transportiert: cachedAnswer(() => {
    return io.selectBool("Wurde ein Patient mit ihrem Fahrzeug transportiert?");
  }),
  eingesetztes_fahrzeug: cachedAnswer(() => {
    return io.select({
      title: "Auf welchem Fahrzeug bist du eingesetzt?",
      choices: [
        { name: "KTW", value: VehicleKind.KTW },
        { name: "RTW", value: VehicleKind.RTW },
        { name: "NEF", value: VehicleKind.NEF },
        { name: "VEF", value: VehicleKind.NEF },
        { name: "ITW", value: VehicleKind.ITW },
        {
          name: "Sonstiges Fahrzeug - HvO, N-KTW, SEG-Fahrzeuge, ...",
          value: VehicleKind.Misc,
        },
      ],
    });
  }),
  notarzt_beteiligt: cachedAnswer(() => {
    return io.selectBool(
      "War ein durch Notarzt an der Versorgung beteiligt?",
      "Nur ja wenn:\n\t1. Notarzt ärztliche Maßnahmen (wie: Basisuntersuchung, Anamneseerhebung, Diagniostik, Versorgung - einzeln oder in Kombination) durchgeführt und/oder angewiesen hat!\n\t2. Leistungserbringung ausschließlich durch diensthabende oder von der ILS in Dienst gesetzte (Not-, Verlegungs-)Ärzte - also: Kein Haus-, Klinikarzt UND nicht bei zufälliger Anwesenheit!"
    );
  }),
  patient_angetroffen: cachedAnswer(() => {
    return io.selectBool(
      "Wurde ein Patient durch den Rettungsdienst angetroffen?"
    );
  }),
  sichere_todeszeichen: cachedAnswer(() => {
    return io.selectBool("Lagen bei Eintreffen sichere Todeszeichen vor?");
  }),
  notfall_szenario_ohne_NA: cachedAnswer(() => {
    // TODO
    return io.select({
      title: "Was beschreibt das Einsatzszenario am besten?",
      choices: [],
    });
  }),
  notfall_szenario_mit_NA: cachedAnswer(() => {
    return io.select({
      title: "Was beschreibt das Einsatzszenario am besten?",
      choices: [
        {
          name: "Verkehrsunfall",
          value: EmergencyScenario.Verkehrsunfall,
          description: "Unfall mit Verkehrsfahrzeug jeder Art",
        },
        {
          name: "Verlegung",
          value: EmergencyScenario.Verlegung,
          description: "Verlegung von KHS A nach KHS B",
        },
        {
          name: "Arbeitsunfall / Wegeunfall",
          value: EmergencyScenario.ArbeitsWegeUnfall,
          description:
            "Notarzteinsatz am Arbeitsplatz/Schule oder auf dem Weg von/zum Arbeitsplatz/Schule.\nInternistische Notfälle fallen nicht unter diese EA!",
        },
        {
          name: "Schulunfall",
          value: EmergencyScenario.Schulunfall,
          description:
            "Notarzteinsatz innerhalb des Schulgeländes. Internistische Notfälle fallen nicht unter diese EA!",
        },
        {
          name: "Internistischer Notfall",
          value: EmergencyScenario.Internistisch,
          description:
            "Jeder Internistische Nofall. Auch: Reanimation mit internistischer Ursache",
        },
        {
          name: "Sonstiger Unfall",
          value: EmergencyScenario.SonstigerUnfall,
          description:
            "Jeder Unfall (bzw. Trauma) welcher nicht von den anderen Unfallarten besser beschrieben ist.\nHaus- und Sportunfälle, welche nicht Schul-, Arbeits- oder Wegeunfälle sind",
        },
        {
          name: "Sonstiger Notfall",
          value: EmergencyScenario.SonstigerNofall,
          description:
            "Notarzteinsatz, welcher mit keiner anderen Einsatzart definiert ist.",
        },
      ],
    });
  }),
});

export type PromptContext = ReturnType<typeof createContext>;
