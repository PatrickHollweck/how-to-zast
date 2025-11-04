import * as t from "./types.js";

import type { PromptIOProvider } from "../io/io-provider.js";

export class Prompts {
  private io: PromptIOProvider;

  constructor(io: PromptIOProvider) {
    this.io = io;
  }

  public vorhaltung() {
    return this.io.select({
      title:
        "Fand dein Einsatz im Rahmen des Hauptaufgabengebietes nach BayRDG statt?",
      choices: [
        {
          name: "Regelvorhaltung",
          value: t.ProvisionType.Regelvorhaltung,
          description:
            "Rettungsmittel die öffentlich-rechtlich regelhaft vorgehalten werden",
        },
        {
          name: "Sondereinsatz",
          value: t.ProvisionType.Sondereinsatz,
          description: "z.B: LRD, UGRD, ORGL, ELRD, HvO, SEG-Einsatz",
        },
      ],
    });
  }

  public szenario() {
    return this.io.select({
      title: "Was beschreibt die Hauptaufgabe der Fahrt am besten...?",
      choices: [
        {
          name: "Fahrt zu Rettungseinsatz als Transportmittel",
          description:
            "Transportmittel nach DIN1789 wie: KTW, N-KTW, RTW\nausschließlich bei Beauftragung durch zuständige ILS",
          value: t.CallScenario.Rettungsfahrt,
        },
        {
          name: "Zubringen eines Arztes",
          description:
            "Ein Notarzt oder Verlegungsarzt wurde durch die Leitstelle alarmiert und an die Einstalstelle verbracht.\nTypischerweise: NEF, VEF Einsätze\nAuch zu nutzen wenn NEF oder VEF defekt, besetzt oder anderweitig belegt ist und ein anderes Fahrzeug genutzt wird.",
          value: t.CallScenario.ArztZubringer,
        },
        {
          name: "Fahrt zur Aufrechterhaltung des Dienstbetriebs",
          value: t.CallScenario.Dienstfahrt,
          description:
            "Voraussetzungen:\n1. Durchführung nur auf Anordnung durch KGF oder RDL\n2. Leitstelle muss davon unterrichtet sein und muss innerhalb der Vorhaltezeit diese Fahrt genehmigen\noder: nötige Fahrten zur Personalumsetzung",
        },
        {
          name: "Fahrt von oder zur Werkstatt",
          value: t.CallScenario.Werkstattfahrt,
          description:
            "Voraussetzung: Direkter Zusammenhang mit Reparatur eines Rettungsdienstfahrzeugs muss vorliegen",
        },
        {
          name: "Fahrt zur Gebietsabsicherung",
          value: t.CallScenario.Gebietsabsicherung,
          description:
            "Alarmierung durch zuständige ILS mit: R0540#Gebietsabsicherung\nSicherstellung der Einsatzfähigkeit in einem anderen Rettungsdienstbereich bzw. Einsatzgebiet einer anderen Rettungswache",
        },
      ],
    });
  }

  public dispositionsSchlagwort() {
    return this.io.select({
      title: "Disposition des Einssatzes als...",
      description:
        "Was steht als Stichwort im Alarmtext? Hier geht es um das letztendlich durch die Leitstelle gewählte Stichwort",
      choices: [
        {
          name: "Notfalleinsatz - Notfall ohne Notarzt",
          value: t.AlarmReason.Notfall,
          description: "RD1 - keine planmäßige Alarmierung eines NA",
        },
        {
          name: "Notarzteinsatz - Notfall mit Notarzt",
          value: t.AlarmReason.Notarzt,
          description:
            "RD2 oder höher - MIT planmäßiger Beteiligung eines Notarzt",
        },
        {
          name: "Krankentransport",
          value: t.AlarmReason.Krankentransport,
          description: "#RD#KTP#90XX - auch Prio.2 (#9017) Einsätze!",
        },
        {
          name: "Einsatz mit Verlegungsarzt",
          value: t.AlarmReason.Verlegungsarzt,
          description: "typischerweise: #RD#VEF",
        },
      ],
    });
  }

  public wahrnehmungAlsNotfall() {
    // TODO: Hilfestellung in Beschreibung - wie definiert?
    return this.io.selectBool("Wahrnehmung am Einsatzort als Notfall?");
  }

  public wurdePatientTransportiert() {
    return this.io.selectBool(
      "Wurde ein Patient mit ihrem Fahrzeug transportiert?",
      "Auch ja bei: Transport von Einsatzstelle zu luftgebundenem Rettungsmittel (RTH, ITH)"
    );
  }

  public bodengebundenerTransport() {
    return this.io.select({
      title: "Wie wurde der Patient zum Ziel transportiert?",
      choices: [
        {
          name: "Mit bodengebundenem Rettungsmittel",
          description: "KTW, N-KTW, RTW, ...",
          value: 0,
        },
        {
          name: "Mit einem luftgebundenem Rettungsmittel, welcher dann zum Krankenhaus transportiert hat",
          value: 1,
        },
      ],
    });
  }

  public welchesEingesetzteFahrzeug() {
    return this.io.select({
      title: "Auf welchem Fahrzeug bist du eingesetzt?",
      choices: [
        { name: "KTW", value: t.VehicleKind.KTW },
        { name: "RTW", value: t.VehicleKind.RTW },
        { name: "NEF", value: t.VehicleKind.NEF },
        { name: "VEF", value: t.VehicleKind.NEF },
        { name: "ITW", value: t.VehicleKind.ITW },
        {
          name: "Sonstiges Fahrzeug - HvO, N-KTW, SEG-Fahrzeuge, ...",
          value: t.VehicleKind.Misc,
        },
      ],
    });
  }

  public warNotarztBeteiligt() {
    return this.io.selectBool(
      "War ein Notarzt an der VERSORGUNG beteiligt?",
      `
**Nur "ja" wenn:**
1. Notarzt ärztliche Maßnahmen (wie: Basisuntersuchung, Anamneseerhebung, Diagnostik, Versorgung - einzeln oder in Kombination) durchgeführt und/oder angewiesen hat!
2. Leistungserbringung ausschließlich durch diensthabende oder von der ILS in Dienst gesetzten Verlegungs- oder Notarzt!

**Auch "nein" wenn:**
1. Alarmierung als Notarzteinsatz, Notarzt wurde jedoch vor Eintreffen abbestellt`
    );
  }

  public wurdePatientAngetroffen() {
    return this.io.selectBool(
      "Wurde ein Patient durch den Rettungsdienst angetroffen?"
    );
  }

  public beiEintreffenSichereTodeszeichen() {
    return this.io.selectBool("Lagen bei Eintreffen sichere Todeszeichen vor?");
  }

  public istKrankenkasseBekannt() {
    return this.io.selectBool(
      "Ist die Krankenkasse oder Unfallversicherung des Patienten bekannt?"
    );
  }

  public verlegungInKrankenhausNiedrigerVersorungsstufe() {
    return this.io.selectBool(
      "Wurde in ein Krankenhaus mit gleicher oder niedrigerer Versorgungsstufe verlegt?",
      "Beispiel: Bettenmangel im abgebenden Krankenhaus"
    );
  }

  public istPrivateKrankenkasse() {
    return this.io.selectBool("Ist der Patient privatversichert?");
  }

  public istUrsacheBerufskrankheit() {
    return this.io.selectBool(
      "Ist ein Schul-, Arbeits- und Wegeunfall oder Berufskrankheit ursächlich für den Transport?"
    );
  }

  public notfallSzenarioOhneNA() {
    // TODO
    return this.io.select({
      title: "Was beschreibt das Einsatzszenario am besten?",
      choices: [],
    });
  }

  public notfallSzenarioMitNA() {
    return this.io.select({
      title: "Was beschreibt das Einsatzszenario am besten?",
      choices: [
        {
          name: "Verkehrsunfall",
          value: t.EmergencyScenario.Verkehrsunfall,
          description: "Unfall mit Verkehrsfahrzeug jeder Art",
        },
        {
          name: "Verlegung",
          value: t.EmergencyScenario.Verlegung,
          description: "Verlegung von KHS A nach KHS B",
        },
        {
          name: "Arbeitsunfall / Wegeunfall",
          value: t.EmergencyScenario.ArbeitsWegeUnfall,
          description:
            "Notarzteinsatz am Arbeitsplatz/Schule oder auf dem Weg von/zum Arbeitsplatz/Schule.\nInternistische Notfälle fallen nicht unter diese EA!",
        },
        {
          name: "Schulunfall",
          value: t.EmergencyScenario.Schulunfall,
          description:
            "Notarzteinsatz innerhalb des Schulgeländes. Internistische Notfälle fallen nicht unter diese EA!",
        },
        {
          name: "Internistischer Notfall",
          value: t.EmergencyScenario.Internistisch,
          description:
            "Jeder Internistische Nofall. Auch: Reanimation mit internistischer Ursache",
        },
        {
          name: "Sonstiger Unfall",
          value: t.EmergencyScenario.SonstigerUnfall,
          description:
            "Jeder Unfall (bzw. Trauma) welcher nicht von den anderen Unfallarten besser beschrieben ist.\nHaus- und Sportunfälle, welche nicht Schul-, Arbeits- oder Wegeunfälle sind",
        },
        {
          name: "Sonstiger Notfall",
          value: t.EmergencyScenario.SonstigerNofall,
          description:
            "Notarzteinsatz, welcher mit keiner anderen Einsatzart definiert ist.",
        },
      ],
    });
  }
}
