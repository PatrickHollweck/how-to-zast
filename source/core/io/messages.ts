import type { PromptIOProvider } from "./io-provider.js";
import { MessageType as t } from "../prompts/types.js";

export class Messages {
  private io: PromptIOProvider;

  constructor(io: PromptIOProvider) {
    this.io = io;
  }

  public async ktpNotfallHerabstufung() {
    await this.io.message(
      t.Warning,
      `
**Hochstufung auf Notfalleinsatz nicht erlaubt!**
<hr/>
Abrechnung **AUSSCHLIEßLICH** als KTP-Notfall, falls kein RTW zur Verfügung stand, oder sich ein Einsatztaktischer Vorteil durch KTW Transport ergibt!
<hr/>
**Eintrag in ZAST-Info Feld: "KTP-NOTFALL" vornehmen!**
`
    );
  }

  public async keinTransportmittel() {
    await this.io.message(
      t.Error,
      "Abrechnung unmöglich! Ihr gewähltes Fahrzeug ist kein zugelassenes Transportmittel und kann somit keinen Transport abrechnen! Wählen sie ein anderes Einsatzmittel"
    );
  }

  public async disponierterNotarzteinsatzOhneNotarzt() {
    await this.io.message(
      t.Warning,
      "Ein disponierter Notarzteinsatz, welcher ohne Notarztbeteiligung abgearbeitet wurde, kann nicht als Notarzteinsatz abgerechnet werden!"
    );
  }

  public async disponierterNotfallNichtSoWahrgenommen() {
    await this.io.message(
      t.Warning,
      `Wird ein als Notfall disponierter Einsatz vor Ort nicht als Notfall wahrgenommen ist eine **herabstufung auf einen Krankentransport verpflichtend!**<hr/>**Eintrag in ZAST-Info Feld: "NOTFALL-ALARMIERUNG" vornehmen**`
    );
  }

  public async notarztNichtAbrechnungsfähig() {
    await this.io.message(
      t.Alert,
      "Dieser Einsatz erfüllt nicht die Kriterien für die Abrechnung als Notarzteinsatz. Stattdessen muss ein Notfalleinsatz abgerechnet werden!"
    );
  }

  public async reparatMehrAlsEinTag() {
    await this.io.message(
      t.Warning,
      "Dauert die Reparatur länger als einen Tag, muss für die Rückfahrt eine zweite Fahrt mit Nummer gebucht werden."
    );
  }

  public async sondereinsätzeNichtVerpflegt() {
    await this.io.message(
      t.Alert,
      "In diesem Tool sind Sondereinsätze aktuell nicht verpflegt."
    );
  }

  public async beiEintreffenSichereTodeszeichen() {
    await this.io.message(
      t.Info,
      "Liegen beim Eintreffen des Rettungsdienstes sichere Todeszeichen vor, ist keine Abrechnung durch den Rettungsdienst möglich!"
    );
  }

  public async hinweiseNAV() {
    await this.io.message(
      t.Info,
      `
**Zu beachten:**
1. Als Transportweg ist von \"Notarztversorgung\" nach \"Patienten- oder Behandlungsadresse\" anzugeben
2. Zusätzlich am gleichen Einsatz versorgte Patienten können nur abgerechnet werden, wenn im Regelfall eine erneute Notarztalarmierung über die ILS erfolgt wäre
3. Bei einem MANV ist die Abrechnungen mit der ZAST GmbH direkt zu klären!`
    );
  }

  public async verlegungOhneTransportFehlermeldung() {
    await this.io.message(
      t.Error,
      "**Fehler:** Eine Verlegung ohne Transport gibt es nicht... Dieses Einsatzszenario ist so nicht möglich."
    );
  }

  public async hinweisEintragungAbrechnungsdatenBG() {
    await this.io.message(
      t.Info,
      "Name und Anschrift des Arbeitgeber (bzw. Schule) in ZAST-Info Feld oder auf Transportschein notieren!"
    );
  }

  public async hinweiseUnbekannterKTR() {
    await this.io.message(
      t.Info,
      "In diesem Fall muss eine Privatrechnung ausgestellt werden. Der Patient kann diese nach Klärung des Trägers einreichen!"
    );
  }

  public async keinKostenträgerFehlermeldung() {
    await this.io.message(
      t.Error,
      "Dieser Einsatz kann nur durch die Berufsgenossenschaft oder als Selbstzahler abgerechnet werden. Beides ist aufgrund der Anfgaben nicht möglich. Bitte prüfe deine Antworten!"
    );
  }
}
