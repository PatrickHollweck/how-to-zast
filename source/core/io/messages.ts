import type { IOProvider } from "./io-provider.js";

export class Messages {
	private io: IOProvider;

	constructor(io: IOProvider) {
		this.io = io;
	}

	public readonly NAW_OHNE_ARZT =
		"Ein NAW kann nicht ohne Arzt transportieren!";

	public readonly KEIN_TRANSPORTMITTEL =
		"Abrechnung unmöglich! Ihr gewähltes Fahrzeug ist kein zugelassenes Transportmittel und kann somit keinen Transport abrechnen! NEF und VEF sind **keine** Transportmittel! Es wurde wahrscheinlich nur ein Arzt zur Einsatzstelle verbracht...?!";

	public readonly VERLEGUNG_OHNE_TRANSPORT =
		"**Fehler:** Eine Verlegung ohne Transport gibt es nicht... Dieses Einsatzszenario ist so nicht möglich.";

	public readonly DISPOSITION_NICHT_ITW_ZU_ITW_EINSATZ =
		"Dieses Fahrzeug kann nicht zu einem ITW Einsatz alarmiert werden!";

	public readonly NEF_ODER_NAW_ZU_VEF_VERLEGUNG =
		"Ein NEF / NAW kann nicht zu einer VEF-Verlegung alarmiert werden! In diesem Fall handelt es sich um einen Notarzteinsatz!";

	public readonly VEF_VERLEGUNG_ÜBERGABE_NICHT_MÖGL =
		"Eine VEF-Verlegung kann nicht abrechnungsfähig an ein anderes Transportmittel übergeben werden! Ihr Fahrzeug kann keinen Transport abrechnen. Das schlussendlich transportierende Rettungsmittel schreibt die VEF-Verlegung.";

	public async ktpNotfallHerabstufung() {
		await this.io.out.warning(
			`
**Hochstufung auf Notfalleinsatz nicht erlaubt!**

---

Abrechnung **ausschließlich** als KTP-Notfall, falls kein RTW zur Verfügung stand, oder sich ein Einsatztaktischer Vorteil durch KTW Transport ergibt!

---
**Eintrag in ZAST-Info Feld: "KTP-NOTFALL" vornehmen!**
`,
		);
	}

	public async hinweisNotarztHerkunftAngeben() {
		await this.io.out.info(
			`Notarztstandort des eingesetzen Notarzt im ZAST-Info Feld angeben! Beispiel: "Notarzt aus: Ulm, Österreich, ..."`,
		);
	}

	public async hinweisLuftrettungsmittelNotarztAngeben() {
		await this.io.out.info(
			`Als "Anweisender Arzt" muss der **luftgebundene** Arzt angegeben werden! Zusätzlich Eintrag des RTH Rufnamen ins Zast-Info Feld`,
		);
	}

	public async hinweisBodengebundenenNotarztAngeben() {
		await this.io.out.info(
			`Als "Anweisender Arzt" muss der **bodengebundene** Arzt angegeben werden!`,
		);
	}

	public async hinweisEintragungAbrechnungsdatenBG() {
		await this.io.out.info(
			"Name und Anschrift des Arbeitgeber (bzw. Schule) in ZAST-Info Feld oder auf Transportschein notieren!",
		);
	}

	public async hinweiseUnbekannterKTR() {
		await this.io.out.info(
			"In diesem Fall muss eine Privatrechnung ausgestellt werden. Der Patient kann diese nach Klärung des Trägers einreichen!",
		);
	}

	public async transportBeiVersorgungDurchNAW() {
		await this.io.out.info(
			"In diesem Fall, kann das Transportfahrzeug nur einen Krankentransport abrechnen. Das Notarztbesetzte Transportmittel (NAW, ITW) muss eine NAV schreiben!",
		);
	}

	public async disponierterNotarzteinsatzOhneNotarzt() {
		await this.io.out.warning(
			"Ein disponierter Notarzteinsatz, welcher ohne (bodengebundene und bayerische) Notarztbeteiligung abgearbeitet wurde, kann nicht als Notarzteinsatz abgerechnet werden!",
		);
	}

	public async vefToITWCall() {
		await this.io.out.error(
			"Ein VEF kann nicht zu einem ITW Einsatz disponiert werden! Dieser Einsatz ist so nicht möglich.",
		);
	}

	public async einsatzNichtVerrechenbarAlsKTW() {
		await this.io.out.error(
			"Dieser Einsatz kann mit einem KTW nicht abgerechnet werden!",
		);
	}

	public async disponierterNotfallNichtSoWahrgenommen() {
		await this.io.out.warning(
			`Wird ein als Notfall disponierter Einsatz vor Ort nicht als Notfall wahrgenommen, oder erfüllt nicht die Kriterien für die Abrechnung als Notarzteinsatz, ist eine **herabstufung auf einen Krankentransport verpflichtend!**<hr/>**Eintrag in ZAST-Info Feld: "NOTFALL-ALARMIERUNG" vornehmen**`,
		);
	}

	public async notarztNichtAbrechnungsfähig() {
		await this.io.out.alert(
			"Dieser Einsatz erfüllt nicht die Kriterien für die Abrechnung als Notarzteinsatz. Stattdessen muss ein Notfalleinsatz abgerechnet werden!",
		);
	}

	public async reparaturLängerAlsEinTag() {
		await this.io.out.warning(
			"Dauert die Reparatur länger als einen Tag, muss für die Rückfahrt eine zweite Fahrt mit Nummer gebucht werden.",
		);
	}

	public async sondereinsätzeNichtVerpflegt() {
		await this.io.out.alert(
			"In diesem Tool sind Sonderbedarfseinsätze aktuell nicht verpflegt.",
		);
	}

	public async beiEintreffenSichereTodeszeichen() {
		await this.io.out.info(
			"Liegen beim Eintreffen des Rettungsdienstes sichere Todeszeichen vor, ist keine Abrechnung durch den Rettungsdienst möglich!",
		);
	}

	public async hinweiseNAV() {
		await this.io.out.info(`
**Zu beachten:**
1. Als Transportweg ist von "Notarztversorgung" nach "Patienten- oder Behandlungsadresse" anzugeben
2. Zusätzlich am gleichen Einsatz versorgte Patienten können nur abgerechnet werden, wenn im Regelfall eine erneute Notarztalarmierung über die ILS erfolgt wäre
3. Bei einem MANV ist die Abrechnungen mit der ZAST GmbH direkt zu klären!
`);
	}

	public async keinKostenträgerFehlermeldung() {
		await this.io.out.error(
			"Dieser Einsatz kann nur durch die Berufsgenossenschaft oder als Selbstzahler abgerechnet werden. Beides ist aufgrund der Anfgaben nicht möglich. Bitte prüfe deine Antworten!",
		);
	}
}
