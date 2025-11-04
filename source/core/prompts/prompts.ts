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
      title: "Was beschreibt die Hauptaufgabe der Fahrt am besten?",
      choices: [
        {
          name: "Fahrt zu Einsatz als Transportmittel",
          description:
            "Transportmittel nach DIN1789 wie: KTW, N-KTW, RTW. Ausschließlich bei Beauftragung durch zuständige ILS",
          value: t.CallScenario.Rettungsfahrt,
        },
        {
          name: "Zubringen eines Arztes",
          description:
            "Ein Notarzt oder Verlegungsarzt wurde durch die Leitstelle alarmiert und an die Einstalstelle verbracht.\nTypischerweise: NEF, VEF Einsätze\nAuch zu nutzen wenn NEF oder VEF defekt, besetzt oder anderweitig belegt ist und ein anderes Fahrzeug genutzt wird.",
          value: t.CallScenario.ArztZubringer,
        },
        {
          name: "Transport eines Patient *von* oder *zu* Hubschrauberlandeplatz",
          description:
            "Transport von Hubschrauberlandeplatz in Einrichtung **oder** von Einrichtung zum Hubschrauberlandeplatz. Dort dann Übernahme durch RTH oder ITH",
          value: t.CallScenario.HuLaPlaÜbernahme,
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

  public transportInBehandlungseinrichtung() {
    return this.io.selectBool(
      "Wurde in eine Behandlungseinrichtung transportiert?",
      "Beispiel: Krankenhaus, Arztpraxis, ..."
    );
  }

  public herabstufungGrundKTP() {
    return this.io.select({
      title: "Wodruch wird dein Einsatz am besten beschrieben?",
      choices: [
        {
          name: "Schul-, Wege-, Arbeitsunfall oder Ursächlich einer anerkannten Berufskrankheit",
          value:
            t.EmergencyScenario_NF_Downgrade.ArbeitsOderWegeOderSchulUnfall,
        },
        {
          name: "Sonstiger Unfall (Traumatisch)",
          value: t.EmergencyScenario_NF_Downgrade.SonstigerUnfall,
        },
        {
          name: "Sonstiger Einsatz (Internistisch, Neurologisch, ...)",
          value: t.EmergencyScenario_NF_Downgrade.SonstigerEinsatz,
        },
      ],
    });
  }

  public dispositionsSchlagwort() {
    return this.io.select({
      title: "Disposition des Einsatzes als...",
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
          name: "VEF Verlegung",
          value: t.AlarmReason.Verlegungsarzt,
          description: "typischerweise: #RD#VEF",
        },
      ],
    });
  }

  public wahrnehmungAlsNotfall() {
    // TODO: Hilfestellung in Beschreibung - wie definiert?
    return this.io.selectBool(
      "Wahrnehmung des Patientenzustands durch RD-Personals am Einsatzort als Notfall?",
      `##### Definition "Rettungsfahrt" nach §5 KTP-RL - Notfall
> Patientinnen und Patienten bedürfen einer Rettungsfahrt, wenn sie aufgrund ihres Zustands mit einem qualifizierten Rettungsmittel (Rettungswagen, Notarztwagen, Rettungshubschrauber) befördert werden müssen oder der Eintritt eines derartigen Zustands während des Transports zu erwarten ist.

##### Definition "Krankentransport" nach §6 KTP-RL - Kein Notfall
> (1) Ein Krankentransport kann verordnet werden, wenn Patientinnen oder Patienten während der Fahrt einer
fachlichen Betreuung oder der besonderen Einrichtungen des Krankentransportwagens (KTW) bedürfen oder
deren Erforderlichkeit aufgrund ihres Zustandes zu erwarten ist. (2) [...] soll auch dann verordnet werden, wenn dadurch die Übertragung schwerer,
ansteckender Krankheiten [...] vermieden werden kann.

<hr/>
Auszug aus der <a href="https://www.g-ba.de/richtlinien/25/">Krankentransport Richtlinie</a>
`
    );
  }

  public wurdePatientTransportiert() {
    return this.io.selectBool(
      "Wurde ein Patient mit ihrem Fahrzeug transportiert?",
      `
- **Auch "Ja" bei:**
  1. Transport von Einsatzstelle **zu** luftgebundenem Rettungsmittel (RTH, ITH).
  2. Einsatz als NAW (RTW + NA, ohne seperates Einsatzmittel, zugestiegen).
- **Auch "Nein" wenn:** Reanimation während Transport eingestellt wurde.
- Genauer Zielort nicht relevant! Was zählt ist das "erreichen" des definierten Zielorts.`
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
        { name: "KTW / N-KTW", value: t.VehicleKind.KTW },
        { name: "RTW", value: t.VehicleKind.RTW },
        { name: "NEF", value: t.VehicleKind.NEF },
        { name: "VEF", value: t.VehicleKind.NEF },
        { name: "ITW", value: t.VehicleKind.ITW },
        {
          name: "Sonstiges Fahrzeug - HvO, SEG-Fahrzeuge, ...",
          value: t.VehicleKind.Misc,
        },
      ],
    });
  }

  public warNotarztBeteiligt() {
    return this.io.selectBool(
      "War ein **diensthabender Notarzt** an der **VERSORGUNG** ihres Patienten beteiligt?",
      `
1. <span style="color: red">**Ein Klinik-, zufällig anwesender Not-, oder Hausarzt zählt hier nicht!**
> Ausschließlich: Diensthabende oder durch ILS in Dienst gestellte Verlegungs-, oder Notärzte!</span>
3. **Nur "Ja", wenn:** Notarzt ärztliche Maßnahme(n) (wie: Untersuchung, Anamnese, Diagnostik, Versorgung) durchgeführt und/oder angewiesen wurden!
4. **Auch "Nein", wenn:** Alarmierung als Notarzteinsatz, Notarzt wurde jedoch vor Eintreffen abbestellt`
    );
  }

  public wurdePatientAngetroffen() {
    return this.io.selectBool(
      "Wurde ein Patient durch den Rettungsdienst angetroffen?"
    );
  }

  public beiEintreffenSichereTodeszeichen() {
    return this.io.selectBool(
      "Lagen bei Eintreffen sichere Todeszeichen vor?",
      "Auch mit Ja zu beantworten, wenn sich aktiv gegen eine Reanimation entschieden wurde und keine weitere Beahndlung stattfand!"
    );
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

  public istPrivateOderUnbekannteKrankenkasse() {
    return this.io.selectBool(
      "Ist der Patient privat versichert **oder** die Krankenversicherung unbekannt?"
    );
  }

  public istUrsacheBG() {
    return this.io.selectBool(
      "Ist ein Schul-, Arbeits-, Wegeunfall oder eine anerkannte Berufskrankheit ursächlich für den Transport?"
    );
  }

  public istBerufsgenossenschaftBekannt() {
    return this.io.selectBool(
      "Ist die zuständige Berufsgenossenschaft bekannt?"
    );
  }

  public notfallSzenarioMitNA() {
    return this.io.select({
      title: "Was beschreibt das Einsatzszenario am besten?",
      description: `
- Arbeits-, Wege-, und Schulunfälle dürfen **nicht** als als Verkehrsunfall oder "Sonstiger Unfall" abgerechnet werden, wenn ein direkter Zusammenhang zwischen der schulischen oder beruflichen Tätigkeit besteht! Weil diese Einsätze nicht über die Berufsgenossenschaft abgerechnet werden können
- Internistische Notfälle können **nicht**, als "Unfall" abgerechnet werden. Beispiel: Ein Herzinfarkt am Arbeitsplatz ist keine BG-Sache!
      `,
      choices: [
        {
          name: "Arbeitsunfall / Wegeunfall",
          value: t.EmergencyScenario_NA.ArbeitsOderWegeUnfall,
          description:
            "Notarzteinsatz am Arbeitsplatz/Schule oder auf dem Weg von/zum Arbeitsplatz/Schule.\nInternistische Notfälle fallen nicht unter diese EA!",
        },
        {
          name: "Schulunfall",
          value: t.EmergencyScenario_NA.Schulunfall,
          description:
            "Notarzteinsatz innerhalb des Schulgeländes. Internistische Notfälle fallen nicht unter diese EA!",
        },
        {
          name: "Verkehrsunfall",
          value: t.EmergencyScenario_NA.Verkehrsunfall,
          description: "Unfall mit Verkehrsfahrzeug jeder Art",
        },
        {
          name: "Verlegung",
          value: t.EmergencyScenario_NA.Verlegung,
          description: "Verlegung von KHS A nach KHS B",
        },
        {
          name: "Internistischer Notfall",
          value: t.EmergencyScenario_NA.Internistisch,
          description:
            "Jeder Internistische Nofall. Auch: Reanimation mit internistischer Ursache",
        },
        {
          name: "Sonstiger Unfall",
          value: t.EmergencyScenario_NA.SonstigerUnfall,
          description:
            "Jeder Unfall (bzw. Trauma) welcher nicht von den anderen Unfallarten besser beschrieben ist.\nHaus- und Sportunfälle, welche nicht Schul-, Arbeits- oder Wegeunfälle sind",
        },
        {
          name: "Sonstiger Notfall",
          value: t.EmergencyScenario_NA.SonstigerNofall,
          description:
            "Notarzteinsatz, welcher mit keiner anderen Einsatzart definiert ist.",
        },
      ],
    });
  }
}
