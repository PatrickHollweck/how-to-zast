import { ConsoleIO } from "./core/io/console-io.js";
import * as p from "./core/prompts/context.js";

async function main(): Promise<void> {
  const io = new ConsoleIO();
  const context = p.createContext(io);

  if ((await context.vorhaltung()) === p.ProvisionType.Sondereinsatz) {
    await context.io.message(
      "In diesem Tool sind Sondereinsätze aktuell nicht verpflegt."
    );

    return await context.io.displayResult(0, null, null);
  }

  const callScenario = await context.szenario();

  switch (callScenario) {
    case p.CallScenario.Rettungsfahrt:
      await handleTransportCall(context);
      break;
    case p.CallScenario.ArztZubringer:
      await handleDoctorTransport(context);
      break;
    case p.CallScenario.Dienstfahrt:
      await context.io.displayResult(2, null, null);
      break;
    case p.CallScenario.Werkstattfahrt:
      await context.io.displayResult(3, null, null);
      await context.io.message(
        "Dauert die Reparatur länger als einen Tag, muss für die Rückfahrt eine zweite Fahrt mit Nummer gebucht werden, ansonsten reicht eine"
      );

      break;
    case p.CallScenario.Gebietsabsicherung:
      await context.io.displayResult(4, null, null);
      break;
    default:
      await context.io.displayError("Unbekanntes Szenario!");
  }
}

async function handleTransportCall(context: p.PromptContext) {
  const doctorInvolvement = await context.notarzt_beteiligt();
  const transport = await context.patient_transportiert();
  const emergencyScenario = await context.notfall_szenario_mit_NA();

  if (!transport) {
    if (await context.sichere_todeszeichen()) {
      return await context.io.displayResult(8, null, null);
    }

    if (doctorInvolvement) {
      await context.io.message(`Zu beachten:
        1. Bei einem Massenanfall von Verletzten (MANV) können diese Vorgaben nicht angewandt werden. Abrechnungen sind im Einzelfall in Absprache mit der ZAST GmbH zu klären.
        2. Als Transportweg ist von \"Notarztversorgung\" nach \"Patienten- oder Behandlungsadresse\" anzugeben
        3. Zusätzlich am gleichen Einsatz versorgte Patienten können nur abgerechnet werden, wenn im Regelfall hier eine erneute Notarztalarmierung über die ILS erfolgt wäre`);

      switch (emergencyScenario) {
        case p.EmergencyScenario.Verkehrsunfall:
        case p.EmergencyScenario.ArbeitsWegeUnfall:
        case p.EmergencyScenario.Schulunfall:
        case p.EmergencyScenario.SonstigerUnfall:
          return await context.io.displayResult(1, 68, null);
        case p.EmergencyScenario.Internistisch:
        case p.EmergencyScenario.SonstigerNofall:
          return await context.io.displayResult(1, 67, null);
        case p.EmergencyScenario.Verlegung:
          return await context.io.message(
            "Eine durchgeführte Verlegung ohne Transport ist nicht möglich."
          );
      }
    } else {
      if (await context.patient_angetroffen()) {
        return await context.io.displayResult(8, null, null);
      } else {
        return await context.io.displayResult(9, null, null);
      }
    }
  }

  const alarmType = await context.alarmiert_als();
  const perceptionAsEmergency = await context.wahrnehmung_als_notfall();
}

async function handleDoctorTransport(context: p.PromptContext) {
  const transport = await context.patient_transportiert();

  // Beispiel: NAW Transport...
  if (transport) {
    return handleTransportCall(context);
  }

  const currentVehicle = await context.eingesetztes_fahrzeug();
  const alarmReason = await context.alarmiert_als();

  const callUpdateMessage =
    "Sobald ein durch die Leitstelle alarmierter Arzt an einem Einsatz teilnimmt, wird dieser automatisch zum Notarzteinsatz, auch wenn die initiale Alarmierung anders war.";

  switch (currentVehicle) {
    case p.VehicleKind.KTW:
    case p.VehicleKind.RTW:
    case p.VehicleKind.Misc:
      switch (alarmReason) {
        case p.AlarmReason.Krankentransport:
        // @ts-expect-error # Explicit fallthrough
        case p.AlarmReason.Notfall:
          await context.io.message(callUpdateMessage);
        case p.AlarmReason.Notarzt:
        case p.AlarmReason.Verlegungsarzt:
          return await context.io.displayResult(5, null, null);
      }
    case p.VehicleKind.NEF:
      switch (alarmReason) {
        case p.AlarmReason.Krankentransport:
        // @ts-expect-error # Explicit fallthrough
        case p.AlarmReason.Notfall:
          await context.io.message(callUpdateMessage);
        case p.AlarmReason.Notarzt:
          return await context.io.displayResult(6, null, null);
        case p.AlarmReason.Verlegungsarzt:
          await context.io.message(
            "Eine Alarmierung eines NEF zu einer VEF-Verlegung ist nicht möglich. Im Zweifel als Notarztverlegung abrechnen!"
          );

          return await context.io.displayResult(6, null, null);
      }
    case p.VehicleKind.VEF:
      switch (alarmReason) {
        case p.AlarmReason.Krankentransport:
        case p.AlarmReason.Notfall:
        case p.AlarmReason.Notarzt:
          await context.io.message(callUpdateMessage);
          // TODO: So richtig?
          return await context.io.displayResult(6, null, null);
        case p.AlarmReason.Verlegungsarzt:
          return await context.io.displayResult(7, null, null);
      }
  }
}

await main();
