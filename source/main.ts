import * as t from "./core/prompts/types.js";

import { ConsoleIO } from "./core/io/console-io.js";
import { PromptContext } from "./core/prompts/context.js";

async function main(): Promise<void> {
  const io = new ConsoleIO();
  const ctx = new PromptContext(io);

  if ((await ctx.prompts.vorhaltung()) === t.ProvisionType.Sondereinsatz) {
    await ctx.io.message(
      "In diesem Tool sind Sondereinsätze aktuell nicht verpflegt."
    );

    return await ctx.io.displayResult(t.TransportType.Sonstig);
  }

  switch (await ctx.prompts.szenario()) {
    case t.CallScenario.Rettungsfahrt:
      await handleTransportCall(ctx);
      break;
    case t.CallScenario.ArztZubringer:
      await handleDoctorTransportToCallSite(ctx);
      break;
    case t.CallScenario.Dienstfahrt:
      await ctx.io.displayResult(t.TransportType.Dienstfahrt);
      break;
    case t.CallScenario.Werkstattfahrt:
      await ctx.io.message(
        "Dauert die Reparatur länger als einen Tag, muss für die Rückfahrt eine zweite Fahrt mit Nummer gebucht werden, ansonsten reicht eine"
      );

      await ctx.io.displayResult(t.TransportType.Werkstattfahrt);

      break;
    case t.CallScenario.Gebietsabsicherung:
      await ctx.io.displayResult(t.TransportType.Gebietsabsicherung);
      break;
    default:
      await ctx.io.displayError("Unbekanntes Szenario!");
  }
}

async function handleTransportCall(ctx: PromptContext) {
  const doctorInvolvement = await ctx.prompts.warNotarztBeteiligt();
  const transport = await ctx.prompts.wurdePatientTransportiert();

  if (!transport) {
    return handleNonTransport(ctx);
  }

  if (doctorInvolvement && transport) {
    return handleTransportWithDoctorInvolvement(ctx);
  }

  const alarmType = await ctx.prompts.dispositionsSchlagwort();

  if (alarmType === t.AlarmReason.Verlegungsarzt) {
    return await ctx.io.displayResult(
      t.TransportType.Verrechenbar,
      t.CallType.NA_Verlegung,
      await findBillingType(ctx, t.BillingContextTyp.NA)
    );
  }

  if (alarmType === t.AlarmReason.Notarzt) {
    await ctx.io.message(
      "Ein disponierter Notarzteinsatz, welcher ohne Notarztbeteiligung abgearbeitet wurde, muss als Notfalleinsatz abgerechnet werden!"
    );

    ctx.overrideCache("alarmiert_als", t.AlarmReason.Notfall);
  }

  const currentVehicle = await ctx.prompts.welchesEingesetzteFahrzeug();

  if (
    ![
      t.VehicleKind.KTW,
      t.VehicleKind.RTW,
      t.VehicleKind.ITW,
      t.VehicleKind.Misc,
    ].includes(currentVehicle)
  ) {
    ctx.io.message(
      "Abrechnung unmöglich! Ihr gewähltes Fahrzeug ist kein zugelassenes Transportmittel und kann somit keinen Transport abrechnen! Wählen sie ein anderes Einsatzmittel"
    );

    ctx.flushCached("eingesetztes_fahrzeug");

    return handleTransportCall(ctx);
  }

  const perceptionAsEmergency = await ctx.prompts.wahrnehmungAlsNotfall();

  if (
    alarmType === t.AlarmReason.Krankentransport &&
    perceptionAsEmergency &&
    currentVehicle === t.VehicleKind.KTW
  ) {
    // TODO: Explizite Frage: RTW verfügbar?
    return ctx.io.displayResult(
      t.TransportType.Verrechenbar,
      t.CallType.KTP_Notfall,
      await findBillingType(ctx, t.BillingContextTyp.KTP)
    );
  }

  if (alarmType > t.AlarmReason.Krankentransport && !perceptionAsEmergency) {
    // TODO: Abrechnung KTP
    throw new Error("Not implemented yet");
  }
}

async function isPrivatOrUnknownInsurance(ctx: PromptContext) {
  return (
    (await ctx.prompts.istPrivateKrankenkasse()) ||
    !(await ctx.prompts.istKrankenkasseBekannt())
  );
}

async function findBillingType(
  ctx: PromptContext,
  billingContextType: t.BillingContextTyp
): Promise<[number, t.BillingType] | null> {
  switch (billingContextType) {
    case t.BillingContextTyp.KTP:
      return null;
    case t.BillingContextTyp.NF:
      return null;
    case t.BillingContextTyp.NA:
      if (!(await ctx.prompts.wurdePatientTransportiert())) {
        if (await isPrivatOrUnknownInsurance(ctx)) {
          return [t.BillingTariff.NA_SZ, t.BillingType.SZ];
        }

        if (await ctx.prompts.istUrsacheBerufskrankheit()) {
          return [t.BillingTariff.NA_KTR_BG, t.BillingType.BG];
        }

        return [t.BillingTariff.NA_KTR_BG, t.BillingType.KTR];
      }

      switch (await ctx.prompts.notfallSzenarioMitNA()) {
        case t.EmergencyScenario.ArbeitsWegeUnfall:
        case t.EmergencyScenario.Schulunfall:
          await ctx.io.message(
            "Name des Arbeitgeber/Schule und Anschrift notieren!"
          );

          if (await isPrivatOrUnknownInsurance(ctx)) {
            return [t.BillingTariff.NA_SZ, t.BillingType.SZ];
          }

          return [t.BillingTariff.NA_KTR_BG, t.BillingType.KTR];
        case t.EmergencyScenario.Internistisch:
        case t.EmergencyScenario.Verkehrsunfall:
        case t.EmergencyScenario.SonstigerUnfall:
          return (await isPrivatOrUnknownInsurance(ctx))
            ? [t.BillingTariff.NA_SZ, t.BillingType.SZ]
            : [t.BillingTariff.NA_KTR_BG, t.BillingType.KTR];
        case t.EmergencyScenario.Verlegung:
          if (
            await ctx.prompts.verlegungInKrankenhausNiedrigerVersorungsstufe()
          ) {
            return [t.BillingTariff.NA_KHS, t.BillingType.KHS];
          }

          if (await isPrivatOrUnknownInsurance(ctx)) {
            return [t.BillingTariff.NA_SZ, t.BillingType.SZ];
          }

          return [t.BillingTariff.NA_KTR_BG, t.BillingType.KTR];
        case t.EmergencyScenario.SonstigerNofall:
          if (await isPrivatOrUnknownInsurance(ctx)) {
            return [t.BillingTariff.NA_SZ, t.BillingType.SZ];
          }

          return [t.BillingTariff.NA_KTR_BG, t.BillingType.KTR];
      }
  }
}

async function handleNonTransport(ctx: PromptContext) {
  const doctorInvolvement = await ctx.prompts.warNotarztBeteiligt();

  if (await ctx.prompts.beiEintreffenSichereTodeszeichen()) {
    return await ctx.io.displayResult(t.TransportType.NichtVerrechenbar);
  }

  if (doctorInvolvement) {
    await ctx.io.message(`Zu beachten:
        1. Bei einem Massenanfall von Verletzten (MANV) können diese Vorgaben nicht angewandt werden. Abrechnungen sind im Einzelfall in Absprache mit der ZAST GmbH zu klären.
        2. Als Transportweg ist von \"Notarztversorgung\" nach \"Patienten- oder Behandlungsadresse\" anzugeben
        3. Zusätzlich am gleichen Einsatz versorgte Patienten können nur abgerechnet werden, wenn im Regelfall hier eine erneute Notarztalarmierung über die ILS erfolgt wäre`);

    switch (await ctx.prompts.notfallSzenarioMitNA()) {
      case t.EmergencyScenario.Verkehrsunfall:
      case t.EmergencyScenario.ArbeitsWegeUnfall:
      case t.EmergencyScenario.Schulunfall:
      case t.EmergencyScenario.SonstigerUnfall:
        return await ctx.io.displayResult(
          t.TransportType.Verrechenbar,
          t.CallType.NA_kein_Transport_Unfall,
          await findBillingType(ctx, t.BillingContextTyp.NA)
        );
      case t.EmergencyScenario.Internistisch:
      case t.EmergencyScenario.SonstigerNofall:
        return await ctx.io.displayResult(
          t.TransportType.Verrechenbar,
          t.CallType.NA_kein_Transport_Internistisch,
          await findBillingType(ctx, t.BillingContextTyp.NA)
        );
      case t.EmergencyScenario.Verlegung:
        return await ctx.io.message(
          "Eine durchgeführte Verlegung ohne Transport ist nicht möglich."
        );
    }
  } else {
    if (await ctx.prompts.wurdePatientAngetroffen()) {
      return await ctx.io.displayResult(t.TransportType.NichtVerrechenbar);
    } else {
      return await ctx.io.displayResult(t.TransportType.Leerfahrt);
    }
  }
}

async function handleTransportWithDoctorInvolvement(ctx: PromptContext) {
  let callType = {
    [t.EmergencyScenario.Verkehrsunfall]: t.CallType.NA_VU,
    [t.EmergencyScenario.Verlegung]: t.CallType.NA_Verlegung,
    [t.EmergencyScenario.ArbeitsWegeUnfall]: t.CallType.NA_Arbeitsunfall,
    [t.EmergencyScenario.Schulunfall]: t.CallType.NA_Schulunfall,
    [t.EmergencyScenario.Internistisch]: t.CallType.NA_Internistisch,
    [t.EmergencyScenario.SonstigerUnfall]: t.CallType.NA_Sonstiger_Unfall,
    [t.EmergencyScenario.SonstigerNofall]: t.CallType.NA_Sonstiger_Notfall,
  }[await ctx.prompts.notfallSzenarioMitNA()];

  return await ctx.io.displayResult(
    t.TransportType.Verrechenbar,
    callType,
    await findBillingType(ctx, t.BillingContextTyp.NA)
  );
}

async function handleDoctorTransportToCallSite(ctx: PromptContext) {
  const transport = await ctx.prompts.wurdePatientTransportiert();

  // Beispiel: NAW Transport...
  if (transport) {
    return handleTransportCall(ctx);
  }

  const currentVehicle = await ctx.prompts.welchesEingesetzteFahrzeug();
  const alarmReason = await ctx.prompts.dispositionsSchlagwort();

  const callUpgradeMessage =
    "Sobald ein durch die Leitstelle alarmierter Arzt an einem Einsatz teilnimmt, wird dieser automatisch zum Notarzteinsatz, auch wenn die initiale Alarmierung anders war.";

  switch (currentVehicle) {
    case t.VehicleKind.KTW:
    case t.VehicleKind.RTW:
    case t.VehicleKind.Misc:
      switch (alarmReason) {
        case t.AlarmReason.Krankentransport:
        // @ts-expect-error # Explicit fallthrough
        case t.AlarmReason.Notfall:
          await ctx.io.message(callUpgradeMessage);
        case t.AlarmReason.Notarzt:
        case t.AlarmReason.Verlegungsarzt:
          return await ctx.io.displayResult(t.TransportType.VEF_Einsatz);
      }
    case t.VehicleKind.NEF:
      switch (alarmReason) {
        case t.AlarmReason.Krankentransport:
        // @ts-expect-error # Explicit fallthrough
        case t.AlarmReason.Notfall:
          await ctx.io.message(callUpgradeMessage);
        case t.AlarmReason.Notarzt:
          return await ctx.io.displayResult(t.TransportType.NEF_Einsatz);
        case t.AlarmReason.Verlegungsarzt:
          await ctx.io.message(
            "Eine Alarmierung eines NEF zu einer VEF-Verlegung ist nicht möglich. Im Zweifel als Notarztverlegung abrechnen!"
          );

          return await ctx.io.displayResult(t.TransportType.NEF_Einsatz);
      }
    case t.VehicleKind.VEF:
      switch (alarmReason) {
        case t.AlarmReason.Krankentransport:
        case t.AlarmReason.Notfall:
        case t.AlarmReason.Notarzt:
          await ctx.io.message(callUpgradeMessage);
          // TODO: So richtig?
          return await ctx.io.displayResult(t.TransportType.NEF_Einsatz);
        case t.AlarmReason.Verlegungsarzt:
          return await ctx.io.displayResult(t.TransportType.VEF_Einsatz);
      }
  }
}

await main();
