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
          name: "**Regelvorhaltung**",
          value: t.ProvisionType.Regelvorhaltung,
          description:
            "Rettungsmittel die öffentlich-rechtlich regelhaft vorgehalten werden",
        },
        {
          name: "Sonderbedarf",
          value: t.ProvisionType.Sondereinsatz,
          description: "z.B: LRD, UGRD, ORGL, ELRD, HvO, SEG-Einsatz",
        },
      ],
    });
  }

  public szenario() {
    return this.io.select({
      title: "Was beschreibt die Hauptaufgabe der Fahrt am besten?",
      description: "*Dein Fahrzeug wurde alarmiert weil...*",
      choices: [
        {
          name: "Fahrt zu einem Einsatz **als Transportmittel**",
          description:
            "Transportmittel nach DIN1789 wie: KTW, N-KTW, RTW wird zu KTP, Notfall o.ä alarmiert. Ausschließlich bei Beauftragung durch zuständige ILS",
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

  public transportUrsprungOderZielHuLaPla() {
    return this.io.selectBool(
      "Ist der Einsatz- oder Zielort ein Hubschrauberlandeplatz?",
      "**Hier geht es ausschließlich um einen festen Hubschrauberlandeplatz eines Klinikums!** Transport von Hubschrauberlandeplatz in Einrichtung **oder** von Einrichtung zum Hubschrauberlandeplatz, dann Übernahme durch RTH / ITH"
    );
  }

  public herabstufungGrundKTP() {
    // TODO: Andere KTP Gründe? Also Notfall zum Kathetherwechsel...?!
    return this.io.select({
      title: "Wodruch wird dein Einsatz am besten beschrieben?",
      choices: [
        {
          name: "Verlegung",
          description: "Verlegung von KHS A zu KHS B",
          value: t.EmergencyScenario_NF_Downgrade.Verlegung,
        },
        {
          name: "Schul-, Wege-, Arbeitsunfall oder ursächlich einer anerkannten Berufskrankheit",
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
        {
          name: "Neugeborenen Holdienst - Inkubatortransport mit Begleitung eines **Klinik**-Behandlungsteams!",
          value: t.EmergencyScenario_NF_Downgrade.Holdienst,
        },
      ],
    });
  }

  public verlegungBegleitungKVB() {
    return this.io.selectBool(
      "Wurde die Verlegung durch einen diensthabenden **KVB-Verlegungsarzt** begleitet?"
    );
  }

  public dispositionsSchlagwort() {
    return this.io.select({
      title: "Disposition des Einsatzes als...",
      description:
        "Was steht als Stichwort im Alarmtext? Hier geht es um das letztendlich durch die Leitstelle gewählte Stichwort",
      choices: [
        {
          name: "**Notfall**einsatz - Notfall ohne Notarzt",
          value: t.AlarmReason.Notfall,
          description: "RD1 - keine planmäßige Alarmierung eines NA",
        },
        {
          name: "**Notarzt**einsatz - Notfall mit Notarzt",
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
        {
          name: "ITW Einsatz",
          value: t.AlarmReason.ITW,
          description: "Nur bei Verwendung des Stichworts: #RD#ITW durch ILS",
        },
      ],
    });
  }

  public bodengebundenerNotarzt() {
    return this.io.selectBool(
      "War ein **bodengebundener** Notarzt **ebenfalls** an der **VERSORGUNG** beteiligt?"
    );
  }

  public transportBeiHeliBeteiligung() {
    return this.io.select({
      title: "Was beschreibt den Transport am besten? **Ein Patient...**",
      description:
        "Jeweils bei Transport in Behandlungseinrichtung! Auch Nein, wenn kein Patient angetroffen wurde oder sichere Todeszeichen bei Eintreffen aufweist!",
      choices: [
        {
          name: "...wurde **nicht** transportiert",
          value: t.HeliTransportType.KeinTransport,
        },
        {
          name: "...wurde mit **ihrem** Fahrzeug transportiert",
          value: t.HeliTransportType.Bodengebunden,
        },
        {
          name: "...wurde mit dem **Helikopter** transportiert",
          value: t.HeliTransportType.Luftgebunden,
        },
      ],
    });
  }

  public anderesFahrzeugTransportiert() {
    return this.io.select({
      title:
        "War ein anderes Fahrzeug beteiligt, welches den Transport des Patienten übernommen hat?",
      description:
        "Beispiel: KTW zur Erstversorgung, RTW übernimmt dann Transport",
      choices: [
        {
          name: "Ja, an **Luft**rettungsmittel",
          value: t.TransferType.Luftgebunden,
        },
        {
          name: "Ja, an **Land**rettungsmittel",
          value: t.TransferType.Bodengebunden,
        },
        { name: "Nein", value: t.TransferType.Keine },
      ],
    });
  }

  public async sonstigerNotfallKrankenhausTräger() {
    return await this.io.selectBool(
      "Wurde von einem Krankenhaus abtransportiert *und* gibt es einen triftigen Grund weshalb das Krankenhaus die Kosten für den Transport tragen muss?",
      "Beispiel: Keine zwingende Begründung für Transport mit Notarzt!"
    );
  }

  public async abrechnungsfähigkeitNotarzt_NurRdAusreichend() {
    return await this.io.selectBool(
      "Wäre eine reine Hilfeleistung durch den Rettungsdienst *ohne Notarzt* ausreichend gewesen?",
      "Entscheidungshilfe: Hätte eine Nachforderung durch den Rettungsdienst stattgefunden, wenn der Notarzt nicht eh schon alarmiert gewesen wäre?"
    );
  }

  public async abrechnungsfähigkeitNotarzt_KeinTransport() {
    if (await this.abrechnungsfähigkeitNotarzt_NurRdAusreichend()) {
      return t.DoctorNotBillableReason.KeineLeistung;
    }

    return this.io.select({
      title: `Trifft eine der folgenden Aussagen zu? **Der Notarzt...**`,
      choices: getAbrechnungsfähigkeitNotarztChoices(true),
    });
  }

  public abrechnungsfähigkeitNotarzt_Transport() {
    return this.io.select({
      title: `Trifft eine der folgenden Aussagen zu? **Der Notarzt...**`,
      choices: getAbrechnungsfähigkeitNotarztChoices(true),
    });
  }

  public wahrnehmungAlsNotfall() {
    // TODO: Hilfestellung in Beschreibung - wie definiert?
    return this.io.selectBool(
      "Wahrnehmung des Patientenzustands durch RD-Personal am Einsatzort als Notfall?",
      `
**Faustregel**
1. Wurden beim Transport Sonder-/Wegerechte (Blaulicht) eingesetzt? *oder...*
2. Wurde eine Behandlung durchgeführt welche einen schweren gesundheitlichen Schaden abgewendet hat?
<hr/>

##### Definition "Rettungsfahrt" nach §5 KTP-RL - Notfall
> Patienten bedürfen einer Rettungsfahrt, wenn sie aufgrund ihres Zustands mit einem qualifizierten Rettungsmittel (RTW, ...) befördert werden müssen oder der Eintritt eines derartigen Zustands während des Transports zu erwarten ist.

##### Definition "Krankentransport" nach §6 KTP-RL - Kein Notfall
> Ein Krankentransport kann verordnet werden, wenn Patientinnen oder Patienten während der Fahrt einer fachlichen Betreuung oder der besonderen Einrichtungen des KTW bedürfen oder deren Erforderlichkeit aufgrund ihres Zustandes zu erwarten ist.

<hr/>
Auszug aus der <a href="https://www.g-ba.de/richtlinien/25/">Krankentransport Richtlinie</a>
`
    );
  }

  public wurdePatientTransportiert() {
    return this.io.selectBool(
      "Wurde ein Patient mit **ihrem** Fahrzeug **transportiert**?",
      `Nur "Ja", bei Transport zu verrechenbarem Zielort. Beispiel: "Nach Hause" fahren bei Notfalleinsatz nicht erlaubt!`
    );
  }

  public welchesEingesetzteFahrzeug() {
    return this.io.select({
      title: "Auf welchem Fahrzeug bist du eingesetzt?",
      choices: [
        { name: "KTW / N-KTW", value: t.VehicleKind.KTW },
        { name: "RTW", value: t.VehicleKind.RTW },
        { name: "NEF", value: t.VehicleKind.NEF },
        { name: "VEF", value: t.VehicleKind.VEF },
        { name: "NAW", value: t.VehicleKind.NAW },
        { name: "ITW", value: t.VehicleKind.ITW },
      ],
    });
  }

  public warNotarztBeteiligt() {
    return this.io.selectBool(
      "War ein **diensthabender Notarzt** an der **VERSORGUNG** ihres Patienten beteiligt?",
      `<span style="color: red">**Ein Klinik-, zufällig anwesender Not-, oder Hausarzt zählt hier nicht!**</span>
      Ausschließlich: Diensthabende oder durch ILS in Dienst gestellte Verlegungs-, oder Notärzte welche **aktiv** an der Patientenversorgung teilgenommen haben!`,
      "Ja",
      "Nein / Abbestellt"
    );
  }

  public wurdePatientAngetroffen() {
    return this.io.selectBool(
      "Wurde ein Patient durch den Rettungsdienst angetroffen?",
      `Beispiele für "nein": Vorsorgliche Bereitstellung, Kein Patient auffindbar, Dein Fahrzeug wurde durch die ILS abbestellt`
    );
  }

  public beiEintreffenSichereTodeszeichen() {
    return this.io.selectBool(
      "Lagen bei Eintreffen sichere Todeszeichen vor?",
      `Wenn eine Reanimation stattfand, auch wenn diese erfolglos war (!), muss diese Frage mit Nein beantwortet werden.`
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
      "Beispiel: Bettenmangel im abgebenden Krankenhaus. Auch ja: Bei jedem *anderem* Grund, wenn das abgebende Krankenhaus den Transport zahlen muss!"
    );
  }

  public istPrivateOderUnbekannteKrankenkasse() {
    return this.io.selectBool(
      "Ist der Patient privat versichert **oder** die Krankenversicherung unbekannt?"
    );
  }

  public istUrsacheBG() {
    return this.io.selectBool(
      "Ist ein Schul-, Arbeits-, Wegeunfall oder eine anerkannte Berufskrankheit ursächlich für den Einsatz?"
    );
  }

  public istBerufsgenossenschaftBekannt() {
    return this.io.selectBool(
      "Ist die zuständige Berufsgenossenschaft bekannt?"
    );
  }

  public notfallSzenarioOhneNA() {
    return this.io.select({
      title: "Was beschreibt deinen Einsatz am besten?",
      choices: [
        {
          name: "Arbeitsunfall / Wegeunfall",
          value: t.EmergencyScenario_NF.ArbeitsOderWegeUnfall,
          description:
            "Notfalleinsatz am Arbeitsplatz/Schule oder auf dem Weg von/zum Arbeitsplatz/Schule.\nInternistische Notfälle fallen nicht unter diese EA!",
        },
        {
          name: "Schulunfall",
          value: t.EmergencyScenario_NF.Schulunfall,
          description:
            "Notfalleinsatz innerhalb des Schulgeländes. Internistische Notfälle fallen nicht unter diese EA!",
        },
        {
          name: "Verkehrsunfall",
          value: t.EmergencyScenario_NF.Verkehrsunfall,
          description: "Unfall mit Verkehrsfahrzeug jeder Art",
        },
        {
          name: "Verlegung",
          value: t.EmergencyScenario_NF.Verlegung,
          description: "Verlegung von KHS A nach KHS B",
        },
        {
          name: "Internistischer Notfall",
          value: t.EmergencyScenario_NF.Internistisch,
          description: "Jeder Internistische Nofall.",
        },
        {
          name: "Sonstiger Unfall",
          value: t.EmergencyScenario_NF.SonstigerUnfall,
          description:
            "Jeder Unfall (bzw. Trauma) welcher nicht von den anderen Unfallarten besser beschrieben ist.\nHaus- und Sportunfälle, welche nicht Schul-, Arbeits- oder Wegeunfälle sind",
        },
        {
          name: "Sonstiger Notfall",
          value: t.EmergencyScenario_NF.SonstigerNofall,
          description:
            "Notfalleinsatz, welcher mit keiner anderen Einsatzart definiert ist.",
        },
        {
          name: "Neugeborenen Holdienst - Inkubatortransport mit Begleitung eines **Klinik**-Behandlungsteams!",
          value: t.EmergencyScenario_NF.NeugeborenenHoldienst,
          description:
            "Abholung des Behandlungsteams und Transport zum anfordernden KHS. Transport des Behandlungsteam und des Neugeborenen in das Kinder-KHS",
        },
      ],
    });
  }

  public holdienstBegleitungDurchKlinik() {
    return this.io.selectBool(
      "War ein Behandlungsteam des Klinikums beteiligt?"
    );
  }

  public holdienstRegion() {
    return this.io.select({
      title: "In welcher Region fand der Holdienst statt?",
      choices: [
        { name: "Augsburg", value: t.NewbornTransportRegion.Augsburg },
        { name: "Landshut", value: t.NewbornTransportRegion.Landshut },
        { name: "*Andere Region*", value: t.NewbornTransportRegion.Andere },
      ],
    });
  }

  public notfallSzenarioMitNA() {
    return this.io.select({
      title: "Was beschreibt deinen Einsatz am besten?",
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

function getAbrechnungsfähigkeitNotarztChoices(transport: boolean) {
  return [
    {
      name: "...stammt von einem **Luftrettungsmittel**",
      description: "RTH, ITH",
      value: t.DoctorNotBillableReason.Luftrettungsmittel,
    },
    transport
      ? {
          name: "...stammt von einem **ITW** oder **NAW**, ihr Fahrzeug übernimmt nur den Transport",
          description:
            "In diesem Fall kann durch das Transportmittel nur ein Krankentransport abgerechnet werden. Das Notarztbesetzte Transportmittel schreibt eine NAV",
          value: t.DoctorNotBillableReason.NAW_ITW,
        }
      : null,
    {
      name: "...hat **mehrere Patienten** an dieser Einsatzstelle versorgt, für **meinen Patienten wäre jedoch keine Notarztalarmierung erfolgt**, wenn kein Notarzt vor Ort gewesen wäre",
      description:
        "Zusätzlich am gleichen Einsatz versorgte Patienten können nur abgerechnet werden, wenn hier in der Theorie eine erneute Notarztalarmierung über die ILS erfolgt wäre.",
      value: t.DoctorNotBillableReason.MehrerePatienten,
    },
    {
      name: "...ist zum Einsatzzeitpunkt **nicht** an einem **bayerischen Notarztstandort** eingesetzt",
      description:
        "Notärzte die nicht in Bayern tätig sind können nicht an der Abrechnung teilnehmen. Ein Notarzt kann sich in seiner Rolle nicht selbstständig in Dienst versetzen!",
      value: t.DoctorNotBillableReason.NichtAusBayern,
    },
    {
      name: "...wurde **nicht** durch Meldung der KVB an die ILS in Dienst versetzt",
      description:
        "Ausschließlich die zuständige ILS kann einen Notarzt in seiner Rolle in Dienst versetzen. Eine nachträgliche Indienstsetzung durch die ILS ist möglich. Ein Notarzt kann sich in seiner Rolle nicht selbstständig in Dienst versetzen!",
      value: t.DoctorNotBillableReason.NichtImDienst,
    },
    {
      name: "...hat **keine** abrechnungsfähig ärztliche Leistung vollbracht",
      description:
        "Ärztliche Maßnahmen: Basisuntersuchung, Anamneseerhebung, Diagnostik, Versorgung (Therapie). Trifft nur äußerst selten zu, da bereits eine einfache Anamnese eine verrechenbare Leistung ist.",
      value: t.DoctorNotBillableReason.KeineLeistung,
    },
    {
      name: "...ist ein **Klinik-, KVB-, Hausarzt-, oder ein zufällig anwesender Arzt** (egal ob mit oder ohne Notarztqualifikation)",
      description:
        "Ein nicht in Dienst gestellter Arzt nimmt nicht an der Abrechnung teil. Ein Notarzt kann sich in seiner Rolle nicht selbstständig in Dienst versetzen.",
      value: t.DoctorNotBillableReason.NichtImDienst,
    },
    {
      name: "...ist als **Hintergrundnotarzt** tätig geworden",
      value: t.DoctorNotBillableReason.NichtImDienst,
    },
    {
      name: "**Keine Aussage trifft zu**",
      value: t.DoctorNotBillableReason.KeinGrund,
    },
  ].filter((choice) => choice != null);
}
